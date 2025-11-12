import { Request, Response } from 'express';
import prisma from '../config/database';
import { EventType } from '@prisma/client';
import geoip from 'geoip-lite';
import UAParser from 'ua-parser-js';

const TRACKING_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

export const trackOpen = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const campaignContact = await prisma.campaignContact.findUnique({
      where: { trackToken: token },
      include: {
        campaign: true,
        contact: true,
      },
    });

    if (!campaignContact) {
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return res.send(TRACKING_PIXEL);
    }

    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const geo = geoip.lookup(ip);

    const existingOpen = await prisma.event.findFirst({
      where: {
        type: EventType.EMAIL_OPENED,
        campaignId: campaignContact.campaignId,
        contactId: campaignContact.contactId,
      },
    });

    await prisma.event.create({
      data: {
        type: EventType.EMAIL_OPENED,
        campaignId: campaignContact.campaignId,
        contactId: campaignContact.contactId,
        ip,
        userAgent,
        country: geo?.country || null,
        city: geo?.city || null,
        device: device.type || 'desktop',
        metadata: {
          firstOpen: !existingOpen,
          browser: parser.getBrowser().name,
          os: parser.getOS().name,
        },
      },
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.send(TRACKING_PIXEL);
  } catch (error) {
    console.error('Track open error:', error);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    return res.send(TRACKING_PIXEL);
  }
};

export const trackClick = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    const redirectUrl = decodeURIComponent(url as string);

    const campaignContact = await prisma.campaignContact.findUnique({
      where: { trackToken: token },
      include: {
        campaign: true,
        contact: true,
      },
    });

    if (campaignContact) {
      const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';
      const userAgent = req.headers['user-agent'] || '';
      const parser = new UAParser(userAgent);
      const device = parser.getDevice();
      const geo = geoip.lookup(ip);

      await prisma.event.create({
        data: {
          type: EventType.LINK_CLICKED,
          campaignId: campaignContact.campaignId,
          contactId: campaignContact.contactId,
          ip,
          userAgent,
          country: geo?.country || null,
          city: geo?.city || null,
          device: device.type || 'desktop',
          metadata: {
            url: redirectUrl,
            browser: parser.getBrowser().name,
            os: parser.getOS().name,
          },
        },
      });
    }

    return res.redirect(redirectUrl);
  } catch (error) {
    console.error('Track click error:', error);
    return res.status(500).json({ error: 'Failed to track click' });
  }
};
