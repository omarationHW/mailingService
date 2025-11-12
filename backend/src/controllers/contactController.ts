import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const contactSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

const updateContactSchema = contactSchema.partial();

export const getContacts = async (req: Request, res: Response) => {
  try {
    const { search, tags, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (tags) {
      const tagArray = (tags as string).split(',');
      where.tags = { hasSome: tagArray };
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.count({ where }),
    ]);

    return res.json({
      contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    return res.status(500).json({ error: 'Failed to get contacts' });
  }
};

export const getContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            campaignContacts: true,
            events: true,
          },
        },
      },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    return res.json({ contact });
  } catch (error) {
    console.error('Get contact error:', error);
    return res.status(500).json({ error: 'Failed to get contact' });
  }
};

export const createContact = async (req: Request, res: Response) => {
  try {
    const data = contactSchema.parse(req.body);

    const existingContact = await prisma.contact.findUnique({
      where: { email: data.email },
    });

    if (existingContact) {
      return res.status(400).json({ error: 'Contact with this email already exists' });
    }

    const contact = await prisma.contact.create({
      data: {
        email: data.email,
        name: data.name,
        company: data.company,
        phone: data.phone,
        tags: data.tags || [],
        customFields: data.customFields || {},
      },
    });

    return res.status(201).json({ contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create contact error:', error);
    return res.status(500).json({ error: 'Failed to create contact' });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateContactSchema.parse(req.body);

    const existingContact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (data.email && data.email !== existingContact.email) {
      const emailExists = await prisma.contact.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const contact = await prisma.contact.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.company !== undefined && { company: data.company }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.tags && { tags: data.tags }),
        ...(data.customFields && { customFields: data.customFields }),
      },
    });

    return res.json({ contact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update contact error:', error);
    return res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { id },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.contact.delete({
      where: { id },
    });

    return res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    return res.status(500).json({ error: 'Failed to delete contact' });
  }
};

export const importContacts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results: any[] = [];
    const errors: any[] = [];

    const stream = Readable.from(req.file.buffer.toString());

    await new Promise((resolve, reject) => {
      stream
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    let imported = 0;
    let skipped = 0;

    for (const row of results) {
      try {
        if (!row.email) {
          skipped++;
          errors.push({ row, error: 'Missing email' });
          continue;
        }

        const existingContact = await prisma.contact.findUnique({
          where: { email: row.email },
        });

        if (existingContact) {
          skipped++;
          continue;
        }

        const customFields: Record<string, any> = {};
        const standardFields = ['email', 'name', 'company', 'phone', 'tags'];

        for (const [key, value] of Object.entries(row)) {
          if (!standardFields.includes(key) && value) {
            customFields[key] = value;
          }
        }

        await prisma.contact.create({
          data: {
            email: row.email,
            name: row.name || null,
            company: row.company || null,
            phone: row.phone || null,
            tags: row.tags ? row.tags.split(',').map((t: string) => t.trim()) : [],
            customFields: Object.keys(customFields).length > 0 ? customFields : {},
          },
        });

        imported++;
      } catch (error) {
        skipped++;
        errors.push({ row, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    return res.json({
      message: 'Import completed',
      imported,
      skipped,
      total: results.length,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error('Import contacts error:', error);
    return res.status(500).json({ error: 'Failed to import contacts' });
  }
};

export const exportContacts = async (req: Request, res: Response) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const csv = [
      ['Email', 'Name', 'Company', 'Phone', 'Tags', 'Created At'].join(','),
      ...contacts.map((c) =>
        [
          c.email,
          c.name || '',
          c.company || '',
          c.phone || '',
          c.tags.join(';'),
          c.createdAt.toISOString(),
        ].join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=contacts.csv');
    return res.send(csv);
  } catch (error) {
    console.error('Export contacts error:', error);
    return res.status(500).json({ error: 'Failed to export contacts' });
  }
};
