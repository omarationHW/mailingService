import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';

const templateSchema = z.object({
  name: z.string().min(1),
  htmlContent: z.string().min(1),
  thumbnail: z.string().optional(),
  description: z.string().optional(),
});

const updateTemplateSchema = templateSchema.partial();

export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;

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

    const [templates, total] = await Promise.all([
      prisma.template.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.template.count({ where }),
    ]);

    return res.json({
      templates,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return res.status(500).json({ error: 'Failed to get templates' });
  }
};

export const getTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    return res.status(500).json({ error: 'Failed to get template' });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const data = templateSchema.parse(req.body);

    const template = await prisma.template.create({
      data: {
        name: data.name,
        htmlContent: data.htmlContent,
        thumbnail: data.thumbnail,
        description: data.description,
      },
    });

    return res.status(201).json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create template error:', error);
    return res.status(500).json({ error: 'Failed to create template' });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateTemplateSchema.parse(req.body);

    const existingTemplate = await prisma.template.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = await prisma.template.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.htmlContent && { htmlContent: data.htmlContent }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    return res.json({ template });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update template error:', error);
    return res.status(500).json({ error: 'Failed to update template' });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findUnique({
      where: { id },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await prisma.template.delete({
      where: { id },
    });

    return res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    return res.status(500).json({ error: 'Failed to delete template' });
  }
};
