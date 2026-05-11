import { Request, Response } from 'express';
import prisma from '../config/database';
import { EventType } from '@prisma/client';

export const getDashboardAnalytics = async (_req: Request, res: Response) => {
  try {
    // Date boundaries for current and previous month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      totalCampaigns,
      prevMonthCampaigns,
      totalContacts,
      prevMonthContacts,
      totalSent,
      prevMonthSent,
      totalOpens,
      prevMonthOpens,
      totalClicks,
      prevMonthClicks,
      recentCampaigns,
      topContacts,
    ] = await Promise.all([
      // Current totals
      prisma.campaign.count({
        where: { status: { in: ['COMPLETED', 'SENDING'] } },
      }),
      prisma.campaign.count({
        where: {
          status: { in: ['COMPLETED', 'SENDING'] },
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),
      prisma.contact.count(),
      prisma.contact.count({
        where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
      }),
      prisma.event.count({ where: { type: EventType.EMAIL_SENT } }),
      prisma.event.count({
        where: {
          type: EventType.EMAIL_SENT,
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM events
        WHERE type = 'EMAIL_OPENED' AND (metadata->>'viaProxy') IS DISTINCT FROM 'true'
      `,
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM events
        WHERE type = 'EMAIL_OPENED'
          AND (metadata->>'viaProxy') IS DISTINCT FROM 'true'
          AND created_at >= ${prevMonthStart} AND created_at <= ${prevMonthEnd}
      `,
      prisma.event.count({ where: { type: EventType.LINK_CLICKED } }),
      prisma.event.count({
        where: {
          type: EventType.LINK_CLICKED,
          createdAt: { gte: prevMonthStart, lte: prevMonthEnd },
        },
      }),
      prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              campaignContacts: true,
              events: true,
            },
          },
        },
      }),
      prisma.$queryRaw<
        Array<{
          contact_id: string;
          email: string;
          name: string | null;
          event_count: bigint;
        }>
      >`
        SELECT
          c.id as contact_id,
          c.email,
          c.name,
          COUNT(e.id) as event_count
        FROM contacts c
        INNER JOIN events e ON e.contact_id = c.id
        WHERE e.type IN ('EMAIL_OPENED', 'LINK_CLICKED')
        GROUP BY c.id, c.email, c.name
        ORDER BY event_count DESC
        LIMIT 10
      `,
    ]);

    // Current month counts for rate comparison
    const currentMonthSent = await prisma.event.count({
      where: { type: EventType.EMAIL_SENT, createdAt: { gte: currentMonthStart } },
    });
    const [currentMonthOpensRaw] = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM events
      WHERE type = 'EMAIL_OPENED'
        AND (metadata->>'viaProxy') IS DISTINCT FROM 'true'
        AND created_at >= ${currentMonthStart}
    `;
    const currentMonthOpens = Number(currentMonthOpensRaw.count);
    const currentMonthClicks = await prisma.event.count({
      where: { type: EventType.LINK_CLICKED, createdAt: { gte: currentMonthStart } },
    });
    const currentMonthCampaigns = await prisma.campaign.count({
      where: { status: { in: ['COMPLETED', 'SENDING'] }, createdAt: { gte: currentMonthStart } },
    });
    const currentMonthContacts = await prisma.contact.count({
      where: { createdAt: { gte: currentMonthStart } },
    });

    const calcChange = (current: number, previous: number): number | null => {
      if (previous === 0) return null;
      return parseFloat((((current - previous) / previous) * 100).toFixed(1));
    };

    const totalOpensCount = Number((totalOpens as Array<{ count: bigint }>)[0].count);
    const prevMonthOpensCount = Number((prevMonthOpens as Array<{ count: bigint }>)[0].count);

    const currentOpenRate = currentMonthSent > 0 ? (currentMonthOpens / currentMonthSent) * 100 : 0;
    const prevOpenRate = prevMonthSent > 0 ? (prevMonthOpensCount / prevMonthSent) * 100 : 0;
    const currentClickRate = currentMonthSent > 0 ? (currentMonthClicks / currentMonthSent) * 100 : 0;
    const prevClickRate = prevMonthSent > 0 ? (prevMonthClicks / prevMonthSent) * 100 : 0;

    const openRate = totalSent > 0 ? (totalOpensCount / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const engagementOverTime = await prisma.$queryRaw<
      Array<{ date: Date; opens: bigint; clicks: bigint }>
    >`
      SELECT
        DATE(created_at) as date,
        COUNT(CASE WHEN type = 'EMAIL_OPENED' AND (metadata->>'viaProxy') IS DISTINCT FROM 'true' THEN 1 END) as opens,
        COUNT(CASE WHEN type = 'LINK_CLICKED' THEN 1 END) as clicks
      FROM events
      WHERE created_at >= ${last30Days}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return res.json({
      summary: {
        totalCampaigns,
        totalContacts,
        totalSent,
        totalOpens: totalOpensCount,
        totalClicks,
        openRate: parseFloat(openRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
        changes: {
          campaigns: calcChange(currentMonthCampaigns, prevMonthCampaigns),
          contacts: calcChange(currentMonthContacts, prevMonthContacts),
          openRate: calcChange(
            parseFloat(currentOpenRate.toFixed(2)),
            parseFloat(prevOpenRate.toFixed(2))
          ),
          clickRate: calcChange(
            parseFloat(currentClickRate.toFixed(2)),
            parseFloat(prevClickRate.toFixed(2))
          ),
        },
      },
      recentCampaigns: recentCampaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        sentAt: c.sentAt,
        recipientsCount: c._count.campaignContacts,
        eventsCount: c._count.events,
      })),
      topContacts: topContacts.map((c) => ({
        id: c.contact_id,
        email: c.email,
        name: c.name,
        eventCount: Number(c.event_count),
      })),
      engagementOverTime: engagementOverTime.map((e) => ({
        date: e.date,
        opens: Number(e.opens),
        clicks: Number(e.clicks),
      })),
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    return res.status(500).json({ error: 'Failed to get dashboard analytics' });
  }
};

export const getCampaignAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaignContacts: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const [sent, clicked, bounced, failed, uniqueOpens, proxyOpens, uniqueClicks] = await Promise.all([
      prisma.event.count({ where: { campaignId: id, type: EventType.EMAIL_SENT } }),
      prisma.event.count({ where: { campaignId: id, type: EventType.LINK_CLICKED } }),
      prisma.event.count({ where: { campaignId: id, type: EventType.EMAIL_BOUNCED } }),
      prisma.event.count({ where: { campaignId: id, type: EventType.EMAIL_FAILED } }),
      // Unique opens: only non-proxy
      prisma.$queryRaw<Array<{ contact_id: string }>>`
        SELECT DISTINCT contact_id FROM events
        WHERE campaign_id = ${id}::uuid
          AND type = 'EMAIL_OPENED'
          AND (metadata->>'viaProxy') IS DISTINCT FROM 'true'
      `,
      // Proxy opens: for disclosure note
      prisma.$queryRaw<Array<{ contact_id: string }>>`
        SELECT DISTINCT contact_id FROM events
        WHERE campaign_id = ${id}::uuid
          AND type = 'EMAIL_OPENED'
          AND (metadata->>'viaProxy') = 'true'
      `,
      prisma.event.groupBy({
        by: ['contactId'],
        where: { campaignId: id, type: EventType.LINK_CLICKED },
      }),
    ]);

    const uniqueOpensCount = (uniqueOpens as Array<{ contact_id: string }>).length;
    const proxyOpensCount = (proxyOpens as Array<{ contact_id: string }>).length;
    const openRate = sent > 0 ? (uniqueOpensCount / sent) * 100 : 0;
    const clickRate = sent > 0 ? (uniqueClicks.length / sent) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;

    const deviceStats = await prisma.$queryRaw<
      Array<{ device: string; count: bigint }>
    >`
      SELECT COALESCE(device, 'unknown') as device, COUNT(*) as count
      FROM events
      WHERE campaign_id = ${id}::uuid AND type = 'EMAIL_OPENED'
        AND (metadata->>'viaProxy') IS DISTINCT FROM 'true'
      GROUP BY device
    `;

    const countryStats = await prisma.$queryRaw<
      Array<{ country: string; count: bigint }>
    >`
      SELECT COALESCE(country, 'unknown') as country, COUNT(*) as count
      FROM events
      WHERE campaign_id = ${id}::uuid AND type = 'EMAIL_OPENED'
        AND (metadata->>'viaProxy') IS DISTINCT FROM 'true'
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;

    const clickedLinks = await prisma.$queryRaw<
      Array<{ url: string; count: bigint }>
    >`
      SELECT metadata->>'url' as url, COUNT(*) as count
      FROM events
      WHERE campaign_id = ${id}::uuid AND type = 'LINK_CLICKED'
      GROUP BY metadata->>'url'
      ORDER BY count DESC
      LIMIT 10
    `;

    const opensByHour = await prisma.$queryRaw<
      Array<{ hour: number; count: bigint }>
    >`
      SELECT EXTRACT(HOUR FROM created_at)::int as hour, COUNT(*) as count
      FROM events
      WHERE campaign_id = ${id}::uuid AND type = 'EMAIL_OPENED'
        AND (metadata->>'viaProxy') IS DISTINCT FROM 'true'
      GROUP BY hour
      ORDER BY hour ASC
    `;

    const engagementTimeline = await prisma.$queryRaw<
      Array<{ date: Date; opens: bigint; clicks: bigint }>
    >`
      SELECT
        DATE(created_at) as date,
        COUNT(CASE WHEN type = 'EMAIL_OPENED' AND (metadata->>'viaProxy') IS DISTINCT FROM 'true' THEN 1 END) as opens,
        COUNT(CASE WHEN type = 'LINK_CLICKED' THEN 1 END) as clicks
      FROM events
      WHERE campaign_id = ${id}::uuid
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        sentAt: campaign.sentAt,
        totalRecipients: campaign._count.campaignContacts,
      },
      metrics: {
        sent,
        clicked,
        bounced,
        failed,
        uniqueOpens: uniqueOpensCount,
        proxyOpens: proxyOpensCount,
        uniqueClicks: uniqueClicks.length,
        openRate: parseFloat(openRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
        bounceRate: parseFloat(bounceRate.toFixed(2)),
      },
      deviceStats: deviceStats.map((d) => ({
        device: d.device,
        count: Number(d.count),
      })),
      countryStats: countryStats.map((c) => ({
        country: c.country,
        count: Number(c.count),
      })),
      clickedLinks: clickedLinks.map((l) => ({
        url: l.url,
        count: Number(l.count),
      })),
      opensByHour: opensByHour.map((h) => ({
        hour: h.hour,
        count: Number(h.count),
      })),
      engagementTimeline: engagementTimeline.map((e) => ({
        date: e.date,
        opens: Number(e.opens),
        clicks: Number(e.clicks),
      })),
    });
  } catch (error) {
    console.error('Get campaign analytics error:', error);
    return res.status(500).json({ error: 'Failed to get campaign analytics' });
  }
};

export const exportCampaignReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const recipients = await prisma.campaignContact.findMany({
      where: { campaignId: id },
      include: {
        contact: true,
      },
    });

    const events = await prisma.event.findMany({
      where: { campaignId: id },
      include: {
        contact: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const recipientMap = new Map();

    recipients.forEach((r) => {
      recipientMap.set(r.contactId, {
        email: r.contact.email,
        name: r.contact.name,
        status: r.status,
        sentAt: r.sentAt,
        opened: false,
        clicked: false,
        openCount: 0,
        clickCount: 0,
      });
    });

    events.forEach((e) => {
      const recipient = recipientMap.get(e.contactId);
      if (recipient) {
        if (e.type === EventType.EMAIL_OPENED) {
          recipient.opened = true;
          recipient.openCount++;
        }
        if (e.type === EventType.LINK_CLICKED) {
          recipient.clicked = true;
          recipient.clickCount++;
        }
      }
    });

    const csv = [
      ['Email', 'Name', 'Status', 'Sent At', 'Opened', 'Clicked', 'Open Count', 'Click Count'].join(
        ','
      ),
      ...Array.from(recipientMap.values()).map((r) =>
        [
          r.email,
          r.name || '',
          r.status,
          r.sentAt ? r.sentAt.toISOString() : '',
          r.opened,
          r.clicked,
          r.openCount,
          r.clickCount,
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=campaign-${id}-report.csv`);
    return res.send(csv);
  } catch (error) {
    console.error('Export campaign report error:', error);
    return res.status(500).json({ error: 'Failed to export campaign report' });
  }
};
