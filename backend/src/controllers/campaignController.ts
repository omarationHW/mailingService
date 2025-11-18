import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { CampaignStatus, CampaignContactStatus } from '@prisma/client';
import emailService from '../services/emailService';

const campaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  preheader: z.string().optional(),
  htmlContent: z.string().min(1),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
  scheduledAt: z.string().datetime().optional(),
  contactIds: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

const updateCampaignSchema = campaignSchema.partial().omit({ contactIds: true, tags: true });

export const getCampaigns = async (req: Request, res: Response) => {
  try {
    const { status, search, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status) {
      where.status = status as CampaignStatus;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { subject: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          _count: {
            select: {
              campaignContacts: true,
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    return res.json({
      campaigns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return res.status(500).json({ error: 'Failed to get campaigns' });
  }
};

export const getCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        _count: {
          select: {
            campaignContacts: true,
            events: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    return res.json({ campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    return res.status(500).json({ error: 'Failed to get campaign' });
  }
};

export const createCampaign = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const data = campaignSchema.parse(req.body);

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        subject: data.subject,
        preheader: data.preheader,
        htmlContent: data.htmlContent,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        status: CampaignStatus.DRAFT,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        createdById: req.user.id,
      },
    });

    let contacts = [];

    if (data.contactIds && data.contactIds.length > 0) {
      // Si se especifican contactIds, usar solo esos
      contacts = await prisma.contact.findMany({
        where: {
          id: { in: data.contactIds },
        },
      });
    } else if (data.tags && data.tags.length > 0) {
      // Si se especifican tags, filtrar por tags
      contacts = await prisma.contact.findMany({
        where: {
          tags: { hasSome: data.tags },
        },
      });
    } else {
      // Si no se especifica nada, usar TODOS los contactos
      contacts = await prisma.contact.findMany();
    }

    if (contacts.length > 0) {
      await prisma.campaignContact.createMany({
        data: contacts.map((contact) => ({
          campaignId: campaign.id,
          contactId: contact.id,
          status: CampaignContactStatus.PENDING,
        })),
      });
    }

    return res.status(201).json({ campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create campaign error:', error);
    return res.status(500).json({ error: 'Failed to create campaign' });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateCampaignSchema.parse(req.body);

    const existingCampaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!existingCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (
      existingCampaign.status === CampaignStatus.SENDING ||
      existingCampaign.status === CampaignStatus.COMPLETED
    ) {
      return res
        .status(400)
        .json({ error: 'Cannot update campaign that is sending or completed' });
    }

    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.subject && { subject: data.subject }),
        ...(data.htmlContent && { htmlContent: data.htmlContent }),
        ...(data.fromEmail && { fromEmail: data.fromEmail }),
        ...(data.fromName && { fromName: data.fromName }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
      },
    });

    return res.json({ campaign });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update campaign error:', error);
    return res.status(500).json({ error: 'Failed to update campaign' });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === CampaignStatus.SENDING) {
      return res.status(400).json({ error: 'Cannot delete campaign that is currently sending' });
    }

    await prisma.campaign.delete({
      where: { id },
    });

    return res.json({ message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    return res.status(500).json({ error: 'Failed to delete campaign' });
  }
};

export const sendCampaign = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        campaignContacts: {
          where: {
            status: CampaignContactStatus.PENDING,
          },
          include: {
            contact: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      return res
        .status(400)
        .json({ error: 'Campaign has already been sent or is currently sending' });
    }

    // Si la campaña no tiene contactos asociados, asociar todos los contactos automáticamente
    if (campaign.campaignContacts.length === 0) {
      const allContacts = await prisma.contact.findMany();

      if (allContacts.length === 0) {
        return res.status(400).json({ error: 'No contacts available in the system' });
      }

      // Asociar todos los contactos a esta campaña
      await prisma.campaignContact.createMany({
        data: allContacts.map((contact) => ({
          campaignId: campaign.id,
          contactId: contact.id,
          status: CampaignContactStatus.PENDING,
        })),
      });

      // Recargar la campaña con los contactos recién asociados
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          campaignContacts: {
            where: {
              status: CampaignContactStatus.PENDING,
            },
            include: {
              contact: true,
            },
          },
        },
      });

      if (!updatedCampaign) {
        return res.status(404).json({ error: 'Campaign not found after update' });
      }

      campaign.campaignContacts = updatedCampaign.campaignContacts;
    }

    await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.SENDING,
      },
    });

    const contacts = campaign.campaignContacts.map((cc) => ({
      id: cc.contact.id,
      email: cc.contact.email,
      trackToken: cc.trackToken,
      variables: {
        nombre: cc.contact.name || cc.contact.email,
        empresa: cc.contact.company || '',
        email: cc.contact.email,
        ...(cc.contact.customFields as Record<string, any>),
      },
    }));

    setImmediate(async () => {
      try {
        const { sent, failed } = await emailService.sendBulkEmails({
          campaignId: campaign.id,
          from: {
            email: campaign.fromEmail,
            name: campaign.fromName,
          },
          subject: campaign.subject,
          html: campaign.htmlContent,
          contacts,
        });

        await prisma.campaignContact.updateMany({
          where: {
            campaignId: campaign.id,
            status: CampaignContactStatus.PENDING,
          },
          data: {
            status: CampaignContactStatus.SENT,
            sentAt: new Date(),
          },
        });

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: failed === contacts.length ? CampaignStatus.FAILED : CampaignStatus.COMPLETED,
            sentAt: new Date(),
          },
        });

        console.log(`Campaign ${campaign.id} completed: ${sent} sent, ${failed} failed`);
      } catch (error) {
        console.error('Background send error:', error);
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: CampaignStatus.FAILED,
          },
        });
      }
    });

    return res.json({
      message: 'Campaign sending started',
      totalContacts: contacts.length,
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    return res.status(500).json({ error: 'Failed to send campaign' });
  }
};
