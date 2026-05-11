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

export const getContactMeta = async (_req: Request, res: Response) => {
  try {
    const contacts = await prisma.contact.findMany({
      select: { company: true, tags: true },
    });

    const companies = Array.from(
      new Set(contacts.map(c => c.company).filter(Boolean) as string[])
    ).sort((a, b) => a.localeCompare(b));

    const tags = Array.from(
      new Set(contacts.flatMap(c => c.tags))
    ).sort((a, b) => a.localeCompare(b));

    return res.json({ companies, tags });
  } catch (error) {
    console.error('Get contact meta error:', error);
    return res.status(500).json({ error: 'Failed to get contact meta' });
  }
};

export const checkEmailExists = async (req: Request, res: Response) => {
  try {
    const { email, excludeId } = req.query;
    if (!email) return res.json({ exists: false });

    const where: any = { email: (email as string).toLowerCase().trim() };
    if (excludeId) where.id = { not: excludeId as string };

    const contact = await prisma.contact.findFirst({ where, select: { id: true } });
    return res.json({ exists: Boolean(contact) });
  } catch (error) {
    console.error('Check email error:', error);
    return res.status(500).json({ error: 'Failed to check email' });
  }
};

export const getContacts = async (req: Request, res: Response) => {
  try {
    const { search, tags, company, page = '1', limit = '50' } = req.query;

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

    if (company) {
      where.company = { contains: company as string, mode: 'insensitive' };
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TAG_INVALID_CHARS = /[<>"'{}\\]/;

interface ValidatedRow {
  rowIndex: number;
  email: string;
  name: string;
  company: string;
  phone: string;
  tags: string[];
}

interface InvalidRow {
  rowIndex: number;
  raw: Record<string, string>;
  errors: string[];
}

function parseTagsFromCell(raw: string): string[] {
  return raw.split(/[,;|]/).map(t => t.trim()).filter(Boolean);
}

function validateRow(row: any, rowIndex: number, seenEmails: Set<string>): { valid: ValidatedRow | null; invalid: InvalidRow | null } {
  const errors: string[] = [];
  const rawEmail = (row.email || '').toString().trim();
  const name = (row.name || '').toString().trim();
  const company = (row.company || '').toString().trim();
  const rawPhone = (row.phone || '').toString().trim();
  const rawTags = (row.tags || '').toString().trim();

  // Email checks
  if (!rawEmail) {
    errors.push('Email vacío');
  } else if (rawEmail.includes(',') || rawEmail.includes(';')) {
    errors.push(`Celda contiene múltiples emails: "${rawEmail}"`);
  } else if (rawEmail.includes('@@')) {
    errors.push(`Email con doble "@": "${rawEmail}"`);
  } else if (rawEmail.endsWith('.')) {
    errors.push(`Email termina con punto: "${rawEmail}"`);
  } else if (rawEmail.includes(' ')) {
    errors.push(`Email contiene espacios: "${rawEmail}"`);
  } else if (!EMAIL_REGEX.test(rawEmail)) {
    errors.push(`Formato de email inválido: "${rawEmail}"`);
  } else if (seenEmails.has(rawEmail.toLowerCase())) {
    errors.push(`Email duplicado dentro del archivo: "${rawEmail}"`);
  }

  // Tag checks
  if (rawTags) {
    const tags = parseTagsFromCell(rawTags);
    for (const tag of tags) {
      if (TAG_INVALID_CHARS.test(tag)) {
        errors.push(`Tag con caracteres inválidos: "${tag}"`);
      }
      if (tag.length > 50) {
        errors.push(`Tag demasiado largo (máx 50): "${tag.substring(0, 30)}..."`);
      }
    }
  }

  // Phone checks
  if (rawPhone) {
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 7) {
      errors.push(`Teléfono con muy pocos dígitos: "${rawPhone}"`);
    }
    if (digits.length > 15) {
      errors.push(`Teléfono demasiado largo: "${rawPhone}"`);
    }
  }

  if (errors.length > 0) {
    return {
      valid: null,
      invalid: { rowIndex, raw: { email: rawEmail, name, company, phone: rawPhone, tags: rawTags }, errors },
    };
  }

  const email = rawEmail.toLowerCase();
  seenEmails.add(email);

  return {
    valid: {
      rowIndex,
      email,
      name,
      company,
      phone: rawPhone,
      tags: rawTags ? parseTagsFromCell(rawTags) : [],
    },
    invalid: null,
  };
}

async function parseFileToRows(file: Express.Multer.File): Promise<any[]> {
  const filename = (file.originalname || '').toLowerCase();
  if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: '' });
  }
  // CSV
  const rows: any[] = [];
  const stream = Readable.from(file.buffer.toString());
  await new Promise<void>((resolve, reject) => {
    stream.pipe(csvParser()).on('data', d => rows.push(d)).on('end', resolve).on('error', reject);
  });
  return rows;
}

export const previewImport = async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const rows = await parseFileToRows(req.file);
    if (rows.length === 0) return res.status(400).json({ error: 'El archivo está vacío o no tiene filas válidas' });
    if (rows.length > 5000) return res.status(400).json({ error: 'El archivo excede el límite de 5,000 filas por importación' });

    const seenInFile = new Set<string>();
    const valid: ValidatedRow[] = [];
    const invalid: InvalidRow[] = [];

    for (let i = 0; i < rows.length; i++) {
      const result = validateRow(rows[i], i + 2, seenInFile); // +2 = 1-based + header row
      if (result.valid) valid.push(result.valid);
      else if (result.invalid) invalid.push(result.invalid);
    }

    // Check which valid emails already exist in DB
    const validEmails = valid.map(r => r.email);
    const existing = await prisma.contact.findMany({
      where: { email: { in: validEmails } },
      select: { email: true },
    });
    const existingSet = new Set(existing.map(c => c.email));

    const newContacts = valid.filter(r => !existingSet.has(r.email));
    const alreadyInDb = valid
      .filter(r => existingSet.has(r.email))
      .map(r => ({ rowIndex: r.rowIndex, raw: { email: r.email, name: r.name }, errors: ['Ya existe en la base de datos'] }));

    return res.json({
      total: rows.length,
      toImport: newContacts.length,
      alreadyExists: alreadyInDb.length,
      invalid: invalid.length,
      invalidRows: invalid,
      duplicateRows: alreadyInDb,
      validRows: newContacts,
    });
  } catch (error) {
    console.error('Preview import error:', error);
    return res.status(500).json({ error: 'Error al analizar el archivo' });
  }
};

export const importContacts = async (req: Request, res: Response) => {
  const { validRows } = req.body;
  if (!Array.isArray(validRows) || validRows.length === 0) {
    return res.status(400).json({ error: 'No hay filas válidas para importar' });
  }

  // Stream progress via SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  const rows = validRows as ValidatedRow[];
  const total = rows.length;
  let imported = 0;
  let skipped = 0;
  const errors: Array<{ email: string; error: string }> = [];

  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const chunk = rows.slice(i, i + BATCH_SIZE);
    await Promise.all(chunk.map(async row => {
      try {
        const existing = await prisma.contact.findUnique({ where: { email: row.email } });
        if (existing) { skipped++; return; }
        await prisma.contact.create({
          data: {
            email: row.email,
            name: row.name || null,
            company: row.company || null,
            phone: row.phone || null,
            tags: row.tags,
            customFields: {},
          },
        });
        imported++;
      } catch (err) {
        skipped++;
        errors.push({ email: row.email, error: err instanceof Error ? err.message : 'Error desconocido' });
      }
    }));

    send({ type: 'progress', imported, skipped, processed: Math.min(i + BATCH_SIZE, total), total });
  }

  send({ type: 'done', imported, skipped, total, errors: errors.slice(0, 20) });
  res.end();
  return;
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
        [c.email, c.name || '', c.company || '', c.phone || '', c.tags.join(',')]
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

export const batchDeleteContacts = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de IDs' });
    }
    const { count } = await prisma.contact.deleteMany({ where: { id: { in: ids } } });
    return res.json({ deleted: count });
  } catch (error) {
    console.error('Batch delete error:', error);
    return res.status(500).json({ error: 'Error al eliminar contactos' });
  }
};

export const batchUpdateContacts = async (req: Request, res: Response) => {
  try {
    const { ids, data } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de IDs' });
    }

    const simpleUpdate: any = {};
    if (data.company !== undefined) simpleUpdate.company = data.company || null;
    if (Object.keys(simpleUpdate).length > 0) {
      await prisma.contact.updateMany({ where: { id: { in: ids } }, data: simpleUpdate });
    }

    if ((Array.isArray(data.tagsAdd) && data.tagsAdd.length > 0) ||
        (Array.isArray(data.tagsRemove) && data.tagsRemove.length > 0)) {
      const contacts = await prisma.contact.findMany({ where: { id: { in: ids } }, select: { id: true, tags: true } });
      await Promise.all(contacts.map(c => {
        let tags = [...c.tags];
        if (Array.isArray(data.tagsAdd)) tags = Array.from(new Set([...tags, ...data.tagsAdd]));
        if (Array.isArray(data.tagsRemove)) tags = tags.filter(t => !data.tagsRemove.includes(t));
        return prisma.contact.update({ where: { id: c.id }, data: { tags } });
      }));
    }

    return res.json({ updated: ids.length });
  } catch (error) {
    console.error('Batch update error:', error);
    return res.status(500).json({ error: 'Error al actualizar contactos' });
  }
};
