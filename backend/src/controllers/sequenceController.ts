import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';

const sequenceStepSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  schedulingType: z.enum(['RELATIVE_DELAY', 'ABSOLUTE_DATE']).default('RELATIVE_DELAY'),
  delayDays: z.number().min(0).default(0),
  delayHours: z.number().min(0).default(0),
  absoluteScheduleDate: z.string().optional().transform((val) => val ? new Date(val) : undefined),
});

const sequenceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.enum(['MANUAL', 'CONTACT_CREATED', 'LIST_ADDED', 'TAG_ADDED', 'EMAIL_OPENED', 'LINK_CLICKED']),
  triggerValue: z.string().optional(),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
  steps: z.array(sequenceStepSchema).min(1),
});

const updateSequenceSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
  triggerType: z.enum(['MANUAL', 'CONTACT_CREATED', 'LIST_ADDED', 'TAG_ADDED', 'EMAIL_OPENED', 'LINK_CLICKED']).optional(),
  triggerValue: z.string().optional(),
  fromEmail: z.string().email().optional(),
  fromName: z.string().min(1).optional(),
});

const enrollContactsSchema = z.object({
  contactIds: z.array(z.string()).min(1),
});

export const getSequences = async (req: Request, res: Response) => {
  try {
    const { search, status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [sequences, total] = await Promise.all([
      prisma.sequence.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              steps: true,
              enrollments: true,
            },
          },
        },
      }),
      prisma.sequence.count({ where }),
    ]);

    return res.json({
      sequences,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get sequences error:', error);
    return res.status(500).json({ error: 'Failed to get sequences' });
  }
};

export const getSequence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sequence = await prisma.sequence.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        enrollments: {
          include: {
            contact: true,
            executions: {
              include: {
                step: true,
              },
              orderBy: { scheduledFor: 'asc' },
            },
          },
          orderBy: { enrolledAt: 'desc' },
        },
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
    });

    if (!sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    return res.json({ sequence });
  } catch (error) {
    console.error('Get sequence error:', error);
    return res.status(500).json({ error: 'Failed to get sequence' });
  }
};

export const createSequence = async (req: Request, res: Response) => {
  try {
    const data = sequenceSchema.parse(req.body);

    const sequence = await prisma.sequence.create({
      data: {
        name: data.name,
        description: data.description,
        triggerType: data.triggerType,
        triggerValue: data.triggerValue,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        steps: {
          create: data.steps.map((step, index) => ({
            stepOrder: index,
            name: step.name,
            subject: step.subject,
            htmlContent: step.htmlContent,
            schedulingType: step.schedulingType,
            delayDays: step.delayDays,
            delayHours: step.delayHours,
            absoluteScheduleDate: step.absoluteScheduleDate,
          })),
        },
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
    });

    return res.status(201).json({ sequence });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create sequence error:', error);
    return res.status(500).json({ error: 'Failed to create sequence' });
  }
};

export const updateSequence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateSequenceSchema.parse(req.body);

    const existingSequence = await prisma.sequence.findUnique({
      where: { id },
    });

    if (!existingSequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    const sequence = await prisma.sequence.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status && { status: data.status }),
        ...(data.triggerType && { triggerType: data.triggerType }),
        ...(data.triggerValue !== undefined && { triggerValue: data.triggerValue }),
        ...(data.fromEmail && { fromEmail: data.fromEmail }),
        ...(data.fromName && { fromName: data.fromName }),
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
        _count: {
          select: {
            steps: true,
            enrollments: true,
          },
        },
      },
    });

    return res.json({ sequence });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update sequence error:', error);
    return res.status(500).json({ error: 'Failed to update sequence' });
  }
};

export const deleteSequence = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sequence = await prisma.sequence.findUnique({
      where: { id },
    });

    if (!sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    await prisma.sequence.delete({
      where: { id },
    });

    return res.json({ message: 'Sequence deleted successfully' });
  } catch (error) {
    console.error('Delete sequence error:', error);
    return res.status(500).json({ error: 'Failed to delete sequence' });
  }
};

export const updateSequenceSteps = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { steps } = z.object({ steps: z.array(sequenceStepSchema).min(1) }).parse(req.body);

    const sequence = await prisma.sequence.findUnique({
      where: { id },
      include: { steps: true },
    });

    if (!sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    // Delete existing steps and create new ones
    await prisma.$transaction([
      prisma.sequenceStep.deleteMany({
        where: { sequenceId: id },
      }),
      prisma.sequenceStep.createMany({
        data: steps.map((step, index) => ({
          sequenceId: id,
          stepOrder: index,
          name: step.name,
          subject: step.subject,
          htmlContent: step.htmlContent,
          schedulingType: step.schedulingType,
          delayDays: step.delayDays,
          delayHours: step.delayHours,
          absoluteScheduleDate: step.absoluteScheduleDate,
        })),
      }),
    ]);

    const updatedSequence = await prisma.sequence.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    return res.json({ sequence: updatedSequence });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update sequence steps error:', error);
    return res.status(500).json({ error: 'Failed to update sequence steps' });
  }
};

export const enrollContacts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contactIds } = enrollContactsSchema.parse(req.body);

    const sequence = await prisma.sequence.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    if (sequence.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Cannot enroll contacts in inactive sequence' });
    }

    // Enroll contacts and create step executions
    const enrollments = await Promise.all(
      contactIds.map(async (contactId) => {
        // Check if contact exists
        const contact = await prisma.contact.findUnique({ where: { id: contactId } });
        if (!contact) return null;

        // Check if already enrolled
        const existing = await prisma.sequenceEnrollment.findUnique({
          where: {
            sequenceId_contactId: {
              sequenceId: id,
              contactId,
            },
          },
        });

        if (existing) return null;

        // Create enrollment
        const enrollment = await prisma.sequenceEnrollment.create({
          data: {
            sequenceId: id,
            contactId,
            status: 'ACTIVE',
          },
        });

        // Create step executions for all steps
        const now = new Date();
        await Promise.all(
          sequence.steps.map(async (step) => {
            let scheduledFor: Date;

            if (step.schedulingType === 'ABSOLUTE_DATE' && step.absoluteScheduleDate) {
              // Use absolute date directly
              scheduledFor = step.absoluteScheduleDate;
            } else {
              // Calculate relative delay
              const delayMs = (step.delayDays * 24 * 60 * 60 * 1000) + (step.delayHours * 60 * 60 * 1000);
              scheduledFor = new Date(now.getTime() + delayMs);
            }

            return prisma.sequenceStepExecution.create({
              data: {
                enrollmentId: enrollment.id,
                stepId: step.id,
                status: 'PENDING',
                scheduledFor,
              },
            });
          })
        );

        return enrollment;
      })
    );

    const successfulEnrollments = enrollments.filter((e) => e !== null);

    return res.json({
      message: `Enrolled ${successfulEnrollments.length} contacts`,
      enrolled: successfulEnrollments.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Enroll contacts error:', error);
    return res.status(500).json({ error: 'Failed to enroll contacts' });
  }
};

export const unenrollContact = async (req: Request, res: Response) => {
  try {
    const { id, contactId } = req.params;

    const enrollment = await prisma.sequenceEnrollment.findUnique({
      where: {
        sequenceId_contactId: {
          sequenceId: id,
          contactId,
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: 'Contact not enrolled in sequence' });
    }

    await prisma.sequenceEnrollment.delete({
      where: { id: enrollment.id },
    });

    return res.json({ message: 'Contact unenrolled successfully' });
  } catch (error) {
    console.error('Unenroll contact error:', error);
    return res.status(500).json({ error: 'Failed to unenroll contact' });
  }
};

export const getEnrollments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const sequence = await prisma.sequence.findUnique({
      where: { id },
    });

    if (!sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    const where: any = { sequenceId: id };
    if (status) {
      where.status = status;
    }

    const [enrollments, total] = await Promise.all([
      prisma.sequenceEnrollment.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          contact: true,
          executions: {
            include: {
              step: true,
            },
            orderBy: { scheduledFor: 'asc' },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      }),
      prisma.sequenceEnrollment.count({ where }),
    ]);

    return res.json({
      enrollments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get enrollments error:', error);
    return res.status(500).json({ error: 'Failed to get enrollments' });
  }
};

export const getSequenceAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const sequence = await prisma.sequence.findUnique({
      where: { id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!sequence) {
      return res.status(404).json({ error: 'Sequence not found' });
    }

    // Get all executions for this sequence
    const executions = await prisma.sequenceStepExecution.findMany({
      where: {
        step: {
          sequenceId: id,
        },
      },
      include: {
        step: true,
        enrollment: {
          include: {
            contact: true,
          },
        },
      },
    });

    // Get all events for this sequence
    const events = await prisma.event.findMany({
      where: {
        sequenceId: id,
      },
      include: {
        contact: true,
      },
    });

    // Calculate metrics
    const totalExecutions = executions.length;
    const sentExecutions = executions.filter((e) => e.status === 'SENT');
    const totalSent = sentExecutions.length;

    const emailOpenedEvents = events.filter((e) => e.type === 'EMAIL_OPENED');
    const linkClickedEvents = events.filter((e) => e.type === 'LINK_CLICKED');

    const uniqueOpens = new Set(emailOpenedEvents.map((e) => e.contactId)).size;
    const uniqueClicks = new Set(linkClickedEvents.map((e) => e.contactId)).size;

    const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0;
    const clickRate = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0;

    // Metrics by step
    const stepMetrics = sequence.steps.map((step) => {
      const stepExecutions = executions.filter((e) => e.stepId === step.id);
      const stepSent = stepExecutions.filter((e) => e.status === 'SENT').length;
      const stepEvents = events.filter((e) => e.sequenceStepExecutionId && stepExecutions.some((ex) => ex.id === e.sequenceStepExecutionId));
      const stepOpens = stepEvents.filter((e) => e.type === 'EMAIL_OPENED').length;
      const stepClicks = stepEvents.filter((e) => e.type === 'LINK_CLICKED').length;

      return {
        stepId: step.id,
        stepOrder: step.stepOrder,
        name: step.name,
        subject: step.subject,
        sent: stepSent,
        opened: stepOpens,
        clicked: stepClicks,
        openRate: stepSent > 0 ? (stepOpens / stepSent) * 100 : 0,
        clickRate: stepSent > 0 ? (stepClicks / stepSent) * 100 : 0,
      };
    });

    // Device stats
    const deviceStats: Record<string, number> = {};
    events.forEach((event) => {
      if (event.device) {
        deviceStats[event.device] = (deviceStats[event.device] || 0) + 1;
      }
    });

    // Country stats
    const countryStats: Record<string, number> = {};
    events.forEach((event) => {
      if (event.country) {
        countryStats[event.country] = (countryStats[event.country] || 0) + 1;
      }
    });

    // Engagement timeline (grouped by date)
    const timelineMap: Record<string, { opens: number; clicks: number }> = {};
    events.forEach((event) => {
      const date = event.createdAt.toISOString().split('T')[0];
      if (!timelineMap[date]) {
        timelineMap[date] = { opens: 0, clicks: 0 };
      }
      if (event.type === 'EMAIL_OPENED') {
        timelineMap[date].opens++;
      } else if (event.type === 'LINK_CLICKED') {
        timelineMap[date].clicks++;
      }
    });

    const engagementTimeline = Object.entries(timelineMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Count enrollments
    const enrollments = await prisma.sequenceEnrollment.count({
      where: { sequenceId: id },
    });

    const activeEnrollments = await prisma.sequenceEnrollment.count({
      where: {
        sequenceId: id,
        status: 'ACTIVE',
      },
    });

    const completedEnrollments = await prisma.sequenceEnrollment.count({
      where: {
        sequenceId: id,
        completedAt: { not: null },
      },
    });

    return res.json({
      sequence: {
        id: sequence.id,
        name: sequence.name,
        status: sequence.status,
      },
      metrics: {
        enrollments,
        activeEnrollments,
        completedEnrollments,
        totalExecutions,
        sent: totalSent,
        opened: uniqueOpens,
        clicked: uniqueClicks,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
      },
      stepMetrics,
      deviceStats: Object.entries(deviceStats).map(([device, count]) => ({ device, count })),
      countryStats: Object.entries(countryStats)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10), // Top 10 countries
      engagementTimeline,
    });
  } catch (error) {
    console.error('Get sequence analytics error:', error);
    return res.status(500).json({ error: 'Failed to get sequence analytics' });
  }
};
