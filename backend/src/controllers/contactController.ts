import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import csvParser from 'csv-parser';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';

const contactSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  company: z.string().optional(),
  phone: z.string().optional(),
  tags: z.array(z.string()).optional(),
  customFields: z.record(z.any()).optional(),
});

const updateContactSchema = contactSchema.partial();

const csvField = (value: string) => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const getContacts = async (req: Request, res: Response) => {
  try {
    const { search, tags, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string) || 50, 500);
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
      const tagArray = (tags as string).split(',').map(t => t.trim()).filter(Boolean);
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
      return res.status(400).json({ error: 'Ya existe un contacto con ese email' });
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
      return res.status(400).json({ error: 'Error de validación', details: error.errors });
    }
    console.error('Create contact error:', error);
    return res.status(500).json({ error: 'Failed to create contact' });
  }
};

export const updateContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateContactSchema.parse(req.body);

    const existingContact = await prisma.contact.findUnique({ where: { id } });

    if (!existingContact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    if (data.email && data.email !== existingContact.email) {
      const emailExists = await prisma.contact.findUnique({ where: { email: data.email } });
      if (emailExists) {
        return res.status(400).json({ error: 'El email ya está en uso' });
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
      return res.status(400).json({ error: 'Error de validación', details: error.errors });
    }
    console.error('Update contact error:', error);
    return res.status(500).json({ error: 'Failed to update contact' });
  }
};

export const deleteContact = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findUnique({ where: { id } });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.contact.delete({ where: { id } });

    return res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Delete contact error:', error);
    return res.status(500).json({ error: 'Failed to delete contact' });
  }
};

// Shared import logic for rows parsed from CSV or XLSX
async function processImportRows(rows: any[]) {
  let imported = 0;
  let skipped = 0;
  const errors: Array<{ row: any; error: string }> = [];

  for (const row of rows) {
    try {
      const email = (row.email || '').toString().trim();
      if (!email) {
        skipped++;
        errors.push({ row, error: 'Email vacío' });
        continue;
      }

      const existing = await prisma.contact.findUnique({ where: { email } });
      if (existing) {
        skipped++;
        continue;
      }

      const rawTags = (row.tags || '').toString().trim();
      const tags = rawTags ? rawTags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

      const customFields: Record<string, any> = {};
      const standard = ['email', 'name', 'company', 'phone', 'tags'];
      for (const [key, value] of Object.entries(row)) {
        if (!standard.includes(key) && value) customFields[key] = value;
      }

      await prisma.contact.create({
        data: {
          email,
          name: (row.name || '').toString().trim() || null,
          company: (row.company || '').toString().trim() || null,
          phone: (row.phone || '').toString().trim() || null,
          tags,
          customFields: Object.keys(customFields).length > 0 ? customFields : {},
        },
      });

      imported++;
    } catch (err) {
      skipped++;
      errors.push({ row, error: err instanceof Error ? err.message : 'Error desconocido' });
    }
  }

  return { imported, skipped, total: rows.length, errors: errors.slice(0, 10) };
}

export const importContacts = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const filename = (req.file.originalname || '').toLowerCase();
    let rows: any[] = [];

    if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else {
      // CSV
      const stream = Readable.from(req.file.buffer.toString());
      await new Promise<void>((resolve, reject) => {
        stream
          .pipe(csvParser())
          .on('data', (data) => rows.push(data))
          .on('end', resolve)
          .on('error', reject);
      });
    }

    const result = await processImportRows(rows);

    return res.json({
      message: 'Importación completada',
      ...result,
    });
  } catch (error) {
    console.error('Import contacts error:', error);
    return res.status(500).json({ error: 'Error al importar contactos' });
  }
};

export const exportContacts = async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || 'csv';

    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'xlsx') {
      const wsData = [
        ['email', 'name', 'company', 'phone', 'tags'],
        ...contacts.map(c => [
          c.email,
          c.name || '',
          c.company || '',
          c.phone || '',
          c.tags.join(','),
        ]),
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Contactos');
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=contactos.xlsx');
      return res.send(buffer);
    }

    // CSV with proper escaping
    const csv = [
      ['email', 'name', 'company', 'phone', 'tags'].join(','),
      ...contacts.map(c =>
        [c.email, c.name || '', c.company || '', c.phone || '', c.tags.join(';')]
          .map(csvField)
          .join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=contactos.csv');
    return res.send('﻿' + csv); // BOM for Excel UTF-8 compatibility
  } catch (error) {
    console.error('Export contacts error:', error);
    return res.status(500).json({ error: 'Error al exportar contactos' });
  }
};

export const downloadTemplate = async (req: Request, res: Response) => {
  try {
    const format = (req.query.format as string) || 'xlsx';

    if (format === 'csv') {
      const csv = 'email,name,company,phone,tags\nejemplo@empresa.com,Juan Pérez,Empresa SA,+34123456789,"vip,cliente"';
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=plantilla_contactos.csv');
      return res.send('﻿' + csv);
    }

    // XLSX template
    const wsData = [
      ['email', 'name', 'company', 'phone', 'tags'],
      ['ejemplo1@empresa.com', 'Juan Pérez', 'Empresa SA', '+34123456789', 'vip,cliente'],
      ['ejemplo2@empresa.com', 'María García', 'Tech Corp', '+34987654321', 'prospecto'],
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    // Set column widths
    ws['!cols'] = [{ wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'Contactos');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=plantilla_contactos.xlsx');
    return res.send(buffer);
  } catch (error) {
    console.error('Download template error:', error);
    return res.status(500).json({ error: 'Error al descargar plantilla' });
  }
};
