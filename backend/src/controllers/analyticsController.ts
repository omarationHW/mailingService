import { Request, Response } from 'express';
import prisma from '../config/database';
import { EventType } from '@prisma/client';

export const getDashboardAnalytics = async (req: Request, res: Response) => {
  try {
    const [
      totalCampaigns,
      totalContacts,
      totalSent,
      totalOpens,
      totalClicks,
      recentCampaigns,
      topContacts,
    ] = await Promise.all([
      prisma.campaign.count(),
      prisma.contact.count(),
      prisma.event.count({
        where: { type: EventType.EMAIL_SENT },
      }),
      prisma.event.count({
        where: { type: EventType.EMAIL_OPENED },
      }),
      prisma.event.count({
        where: { type: EventType.LINK_CLICKED },
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

    const openRate = totalSent > 0 ? (totalOpens / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (totalClicks / totalSent) * 100 : 0;

    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    const engagementOverTime = await prisma.$queryRaw<
      Array<{
        date: Date;
        opens: bigint;
        clicks: bigint;
      }>
    >`
      SELECT
        DATE(created_at) as date,
        COUNT(CASE WHEN type = 'EMAIL_OPENED' THEN 1 END) as opens,
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
        totalOpens,
        totalClicks,
        openRate: parseFloat(openRate.toFixed(2)),
        clickRate: parseFloat(clickRate.toFixed(2)),
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

    const [sent, opened, clicked, bounced, failed, uniqueOpens, uniqueClicks] = await Promise.all([
      prisma.event.count({
        where: {
          campaignId: id,
          type: EventType.EMAIL_SENT,
        },
      }),
      prisma.event.count({
        where: {
          campaignId: id,
          type: EventType.EMAIL_OPENED,
        },
      }),
      prisma.event.count({
        where: {
          campaignId: id,
          type: EventType.LINK_CLICKED,
        },
      }),
      prisma.event.count({
        where: {
          campaignId: id,
          type: EventType.EMAIL_BOUNCED,
        },
      }),
      prisma.event.count({
        where: {
          campaignId: id,
          type: EventType.EMAIL_FAILED,
        },
      }),
      prisma.event.groupBy({
        by: ['contactId'],
        where: {
          campaignId: id,
          type: EventType.EMAIL_OPENED,
        },
      }),
      prisma.event.groupBy({
        by: ['contactId'],
        where: {
          campaignId: id,
          type: EventType.LINK_CLICKED,
        },
      }),
    ]);

    const openRate = sent > 0 ? (uniqueOpens.length / sent) * 100 : 0;
    const clickRate = sent > 0 ? (uniqueClicks.length / sent) * 100 : 0;
    const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;

    const deviceStats = await prisma.$queryRaw<
      Array<{
        device: string;
        count: bigint;
      }>
    >`
      SELECT
        COALESCE(device, 'unknown') as device,
        COUNT(*) as count
      FROM events
      WHERE campaign_id = ${id} AND type = 'EMAIL_OPENED'
      GROUP BY device
    `;

    const countryStats = await prisma.$queryRaw<
      Array<{
        country: string;
        count: bigint;
      }>
    >`
      SELECT
        COALESCE(country, 'unknown') as country,
        COUNT(*) as count
      FROM events
      WHERE campaign_id = ${id} AND type = 'EMAIL_OPENED'
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10
    `;

    const clickedLinks = await prisma.$queryRaw<
      Array<{
        url: string;
        count: bigint;
      }>
    >`
      SELECT
        metadata->>'url' as url,
        COUNT(*) as count
      FROM events
      WHERE campaign_id = ${id} AND type = 'LINK_CLICKED'
      GROUP BY metadata->>'url'
      ORDER BY count DESC
      LIMIT 10
    `;

    const opensByHour = await prisma.$queryRaw<
      Array<{
        hour: number;
        count: bigint;
      }>
    >`
      SELECT
        EXTRACT(HOUR FROM created_at)::int as hour,
        COUNT(*) as count
      FROM events
      WHERE campaign_id = ${id} AND type = 'EMAIL_OPENED'
      GROUP BY hour
      ORDER BY hour ASC
    `;

    const engagementTimeline = await prisma.$queryRaw<
      Array<{
        date: Date;
        opens: bigint;
        clicks: bigint;
      }>
    >`
      SELECT
        DATE(created_at) as date,
        COUNT(CASE WHEN type = 'EMAIL_OPENED' THEN 1 END) as opens,
        COUNT(CASE WHEN type = 'LINK_CLICKED' THEN 1 END) as clicks
      FROM events
      WHERE campaign_id = ${id}
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
        opened,
        clicked,
        bounced,
        failed,
        uniqueOpens: uniqueOpens.length,
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
