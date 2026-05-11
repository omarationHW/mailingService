import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';

const contactListSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

const updateContactListSchema = contactListSchema.partial();

const addContactsSchema = z.object({
  contactIds: z.array(z.string()).min(1),
});

export const getContactLists = async (req: Request, res: Response) => {
  try {
    const { search, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string) || 20), 200);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [lists, total] = await Promise.all([
      prisma.contactList.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { members: true } } },
      }),
      prisma.contactList.count({ where }),
    ]);

    return res.json({
      lists,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get contact lists error:', error);
    return res.status(500).json({ error: 'Failed to get contact lists' });
  }
};

export const getContactList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const list = await prisma.contactList.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });
    if (!list) return res.status(404).json({ error: 'Contact list not found' });
    return res.json({ list });
  } catch (error) {
    console.error('Get contact list error:', error);
    return res.status(500).json({ error: 'Failed to get contact list' });
  }
};

export const createContactList = async (req: Request, res: Response) => {
  try {
    const data = contactListSchema.parse(req.body);
    const list = await prisma.contactList.create({
      data: { name: data.name.trim(), description: data.description?.trim() },
      include: { _count: { select: { members: true } } },
    });
    return res.status(201).json({ list });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Error de validación', details: error.errors });
    console.error('Create contact list error:', error);
    return res.status(500).json({ error: 'Failed to create contact list' });
  }
};

export const updateContactList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateContactListSchema.parse(req.body);

    const existing = await prisma.contactList.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Contact list not found' });

    const list = await prisma.contactList.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() }),
      },
      include: { _count: { select: { members: true } } },
    });
    return res.json({ list });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Error de validación', details: error.errors });
    console.error('Update contact list error:', error);
    return res.status(500).json({ error: 'Failed to update contact list' });
  }
};

export const deleteContactList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const list = await prisma.contactList.findUnique({ where: { id } });
    if (!list) return res.status(404).json({ error: 'Contact list not found' });
    await prisma.contactList.delete({ where: { id } });
    return res.json({ message: 'Contact list deleted successfully' });
  } catch (error) {
    console.error('Delete contact list error:', error);
    return res.status(500).json({ error: 'Failed to delete contact list' });
  }
};

export const batchDeleteContactLists = async (req: Request, res: Response) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de IDs' });
    }
    const { count } = await prisma.contactList.deleteMany({ where: { id: { in: ids } } });
    return res.json({ deleted: count });
  } catch (error) {
    console.error('Batch delete lists error:', error);
    return res.status(500).json({ error: 'Error al eliminar listas' });
  }
};

export const addContactsToList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contactIds } = addContactsSchema.parse(req.body);

    const list = await prisma.contactList.findUnique({ where: { id } });
    if (!list) return res.status(404).json({ error: 'Contact list not found' });

    // Verify contacts exist
    const existing = await prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true },
    });
    const validIds = existing.map(c => c.id);

    await prisma.contactListMember.createMany({
      data: validIds.map(contactId => ({ contactListId: id, contactId })),
      skipDuplicates: true,
    });

    const updatedList = await prisma.contactList.findUnique({
      where: { id },
      include: { _count: { select: { members: true } } },
    });

    return res.json({ list: updatedList, added: validIds.length, invalid: contactIds.length - validIds.length });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Error de validación', details: error.errors });
    console.error('Add contacts to list error:', error);
    return res.status(500).json({ error: 'Failed to add contacts to list' });
  }
};

export const removeContactFromList = async (req: Request, res: Response) => {
  try {
    const { id, contactId } = req.params;
    const member = await prisma.contactListMember.findFirst({
      where: { contactListId: id, contactId },
    });
    if (!member) return res.status(404).json({ error: 'Contact not found in list' });
    await prisma.contactListMember.delete({ where: { id: member.id } });
    return res.json({ message: 'Contact removed from list successfully' });
  } catch (error) {
    console.error('Remove contact from list error:', error);
    return res.status(500).json({ error: 'Failed to remove contact from list' });
  }
};

export const batchRemoveFromList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contactIds } = req.body;
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de contactIds' });
    }
    const { count } = await prisma.contactListMember.deleteMany({
      where: { contactListId: id, contactId: { in: contactIds } },
    });
    return res.json({ removed: count });
  } catch (error) {
    console.error('Batch remove from list error:', error);
    return res.status(500).json({ error: 'Error al remover contactos' });
  }
};

export const getContactsInList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50', search, company, tags } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string) || 50), 500);
    const skip = (pageNum - 1) * limitNum;

    const list = await prisma.contactList.findUnique({ where: { id } });
    if (!list) return res.status(404).json({ error: 'Contact list not found' });

    // Build contact filter
    const contactFilter: any = {};
    if (search) {
      contactFilter.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { name: { contains: search as string, mode: 'insensitive' } },
        { company: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (company) {
      contactFilter.company = { contains: company as string, mode: 'insensitive' };
    }
    if (tags) {
      const tagArray = (tags as string).split(',').map(t => t.trim()).filter(Boolean);
      if (tagArray.length > 0) contactFilter.tags = { hasSome: tagArray };
    }

    const hasContactFilter = Object.keys(contactFilter).length > 0;

    // Prisma requires filtering on relation via `is` wrapper
    const memberWhere: any = { contactListId: id };
    if (hasContactFilter) memberWhere.contact = { is: contactFilter };

    const [members, total] = await Promise.all([
      prisma.contactListMember.findMany({
        where: memberWhere,
        skip,
        take: limitNum,
        include: { contact: true },
        orderBy: { addedAt: 'desc' },
      }),
      prisma.contactListMember.count({ where: memberWhere }),
    ]);

    return res.json({
      members,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    console.error('Get contacts in list error:', error);
    return res.status(500).json({ error: 'Failed to get contacts in list' });
  }
};

export const getListMeta = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const members = await prisma.contactListMember.findMany({
      where: { contactListId: id },
      select: { contact: { select: { company: true, tags: true } } },
    });

    const companies = Array.from(
      new Set(members.map(m => m.contact.company).filter(Boolean) as string[])
    ).sort((a, b) => a.localeCompare(b));

    const tags = Array.from(
      new Set(members.flatMap(m => m.contact.tags))
    ).sort((a, b) => a.localeCompare(b));

    return res.json({ companies, tags });
  } catch (error) {
    console.error('Get list meta error:', error);
    return res.status(500).json({ error: 'Failed to get list meta' });
  }
};
