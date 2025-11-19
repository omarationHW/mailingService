import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';

const contactListSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateContactListSchema = contactListSchema.partial();

const addContactsSchema = z.object({
  contactIds: z.array(z.string()).min(1),
});

export const getContactLists = async (req: Request, res: Response) => {
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

    const [lists, total] = await Promise.all([
      prisma.contactList.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      }),
      prisma.contactList.count({ where }),
    ]);

    return res.json({
      lists,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
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
      include: {
        members: {
          include: {
            contact: true,
          },
          orderBy: { addedAt: 'desc' },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    if (!list) {
      return res.status(404).json({ error: 'Contact list not found' });
    }

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
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return res.status(201).json({ list });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create contact list error:', error);
    return res.status(500).json({ error: 'Failed to create contact list' });
  }
};

export const updateContactList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateContactListSchema.parse(req.body);

    const existingList = await prisma.contactList.findUnique({
      where: { id },
    });

    if (!existingList) {
      return res.status(404).json({ error: 'Contact list not found' });
    }

    const list = await prisma.contactList.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: {
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return res.json({ list });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update contact list error:', error);
    return res.status(500).json({ error: 'Failed to update contact list' });
  }
};

export const deleteContactList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const list = await prisma.contactList.findUnique({
      where: { id },
    });

    if (!list) {
      return res.status(404).json({ error: 'Contact list not found' });
    }

    await prisma.contactList.delete({
      where: { id },
    });

    return res.json({ message: 'Contact list deleted successfully' });
  } catch (error) {
    console.error('Delete contact list error:', error);
    return res.status(500).json({ error: 'Failed to delete contact list' });
  }
};

export const addContactsToList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { contactIds } = addContactsSchema.parse(req.body);

    const list = await prisma.contactList.findUnique({
      where: { id },
    });

    if (!list) {
      return res.status(404).json({ error: 'Contact list not found' });
    }

    // Add contacts to list (ignore duplicates)
    const createData = contactIds.map((contactId) => ({
      contactListId: id,
      contactId,
    }));

    await prisma.contactListMember.createMany({
      data: createData,
      skipDuplicates: true,
    });

    const updatedList = await prisma.contactList.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            contact: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    });

    return res.json({ list: updatedList });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Add contacts to list error:', error);
    return res.status(500).json({ error: 'Failed to add contacts to list' });
  }
};

export const removeContactFromList = async (req: Request, res: Response) => {
  try {
    const { id, contactId } = req.params;

    const member = await prisma.contactListMember.findFirst({
      where: {
        contactListId: id,
        contactId,
      },
    });

    if (!member) {
      return res.status(404).json({ error: 'Contact not found in list' });
    }

    await prisma.contactListMember.delete({
      where: { id: member.id },
    });

    return res.json({ message: 'Contact removed from list successfully' });
  } catch (error) {
    console.error('Remove contact from list error:', error);
    return res.status(500).json({ error: 'Failed to remove contact from list' });
  }
};

export const getContactsInList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const list = await prisma.contactList.findUnique({
      where: { id },
    });

    if (!list) {
      return res.status(404).json({ error: 'Contact list not found' });
    }

    const [members, total] = await Promise.all([
      prisma.contactListMember.findMany({
        where: { contactListId: id },
        skip,
        take: limitNum,
        include: {
          contact: true,
        },
        orderBy: { addedAt: 'desc' },
      }),
      prisma.contactListMember.count({ where: { contactListId: id } }),
    ]);

    const contacts = members.map((m) => m.contact);

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
    console.error('Get contacts in list error:', error);
    return res.status(500).json({ error: 'Failed to get contacts in list' });
  }
};
