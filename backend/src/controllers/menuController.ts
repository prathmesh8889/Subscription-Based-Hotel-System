import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

const S = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  price: z.coerce.number().positive(),
  category: z.string().min(1),
  imageUrl: z.string().optional().nullable(),
  isAvailable: z.boolean().optional(),
  prepTimeMinutes: z.coerce.number().int().min(0).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const getMenuItems = async (q: any, r: Response) => {
  const hotelId = q.user?.hotelId;
  if (!hotelId) {
    r.status(403).json({ success: false, error: 'No hotel assigned.' });
    return;
  }

  const d = await prisma.menuItem.findMany({
    where: { hotelId },
    orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
  });

  r.json({
    success: true,
    data: d.map(i => ({ ...i, price: Number(i.price) })),
  });
};

export const createMenuItem = async (q: any, r: Response) => {
  try {
    const hotelId = q.user?.hotelId;
    const p = S.safeParse(q.body);

    if (!hotelId || !p.success) {
      r.status(400).json({ success: false, error: 'Invalid menu item.' });
      return;
    }

    const h = await prisma.hotel.findUnique({ where: { id: hotelId } });
    if (!h || (await prisma.menuItem.count({ where: { hotelId } })) >= h.maxMenuItems) {
      r.status(403).json({ success: false, error: 'Menu item limit reached.' });
      return;
    }

    const i = await prisma.menuItem.create({
      data: {
        hotelId,
        name: p.data.name,
        description: p.data.description ?? null,
        price: p.data.price,
        category: p.data.category,
        imageUrl: p.data.imageUrl || null,
        isAvailable: p.data.isAvailable ?? true,
        prepTimeMinutes: p.data.prepTimeMinutes ?? 15,
        sortOrder: p.data.sortOrder ?? 0,
      },
    });

    r.status(201).json({ success: true, data: { ...i, price: Number(i.price) } });
  } catch (e) {
    console.error(e);
    r.status(500).json({ success: false, error: 'Failed to create menu item.' });
  }
};

export const updateMenuItem = async (q: any, r: Response) => {
  const p = S.partial().safeParse(q.body);
  const x = await prisma.menuItem.findFirst({
    where: { id: q.params.id, hotelId: q.user?.hotelId },
  });

  if (!p.success || !x) {
    r.status(404).json({ success: false, error: 'Menu item not found or invalid.' });
    return;
  }

  const i = await prisma.menuItem.update({
    where: { id: x.id },
    data: {
      ...(p.data.name !== undefined ? { name: p.data.name } : {}),
      ...(p.data.description !== undefined ? { description: p.data.description } : {}),
      ...(p.data.price !== undefined ? { price: p.data.price } : {}),
      ...(p.data.category !== undefined ? { category: p.data.category } : {}),
      ...(p.data.imageUrl !== undefined ? { imageUrl: p.data.imageUrl || null } : {}),
      ...(p.data.isAvailable !== undefined ? { isAvailable: p.data.isAvailable } : {}),
      ...(p.data.prepTimeMinutes !== undefined ? { prepTimeMinutes: p.data.prepTimeMinutes } : {}),
      ...(p.data.sortOrder !== undefined ? { sortOrder: p.data.sortOrder } : {}),
    },
  });

  r.json({ success: true, data: { ...i, price: Number(i.price) } });
};

export const deleteMenuItem = async (q: any, r: Response) => {
  const x = await prisma.menuItem.findFirst({
    where: { id: q.params.id, hotelId: q.user?.hotelId },
  });

  if (!x) {
    r.status(404).json({ success: false, error: 'Menu item not found.' });
    return;
  }

  await prisma.menuItem.delete({ where: { id: x.id } });
  r.json({ success: true });
};
