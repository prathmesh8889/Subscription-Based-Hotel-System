// ============================================================
// MENU CONTROLLER
// ============================================================

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { AuthRequest } from '../middleware/auth';

// ============================================================
// GET MENU ITEMS (Public - for customer QR)
// ============================================================

export const getMenuItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hotelId } = req.query;

    if (!hotelId || typeof hotelId !== 'string') {
      res.status(400).json({
        success: false,
        error: 'hotelId is required',
      });
      return;
    }

    // Fetch menu items for the hotel
    const menuItems = await prisma.menuItem.findMany({
      where: {
        hotelId,
        isAvailable: true,
      },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: { menuItems },
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch menu items',
    });
  }
};

// ============================================================
// CREATE MENU ITEM (Owner only)
// ============================================================

export const createMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, price, category, imageUrl, sortOrder } = req.body;

    if (!req.user?.hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: No hotel assigned',
      });
      return;
    }

    // Check if user is OWNER
    if (req.user.role !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Only owners can create menu items',
      });
      return;
    }

    // Validate required fields
    if (!name || !price || !category) {
      res.status(400).json({
        success: false,
        error: 'Name, price, and category are required',
      });
      return;
    }

    // Check menu item limit
    const menuCount = await prisma.menuItem.count({
      where: { hotelId: req.user.hotelId },
    });

    const hotel = await prisma.hotel.findUnique({
      where: { id: req.user.hotelId },
    });

    if (hotel && menuCount >= hotel.maxMenuItems) {
      res.status(402).json({
        success: false,
        error: `Menu item limit reached. Maximum ${hotel.maxMenuItems} items allowed.`,
      });
      return;
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        hotelId: req.user.hotelId,
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl,
        sortOrder: sortOrder || 0,
        isAvailable: true,
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'MENU_ITEM_CREATED',
        resource: 'MenuItem',
        resourceId: menuItem.id,
        hotelId: req.user.hotelId,
        metadata: {
          name,
          price,
          category,
        },
      },
    });

    res.status(201).json({
      success: true,
      data: { menuItem },
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create menu item',
    });
  }
};

// ============================================================
// UPDATE MENU ITEM (Owner only)
// ============================================================

export const updateMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, price, category, imageUrl, isAvailable, sortOrder } = req.body;

    if (!req.user?.hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: No hotel assigned',
      });
      return;
    }

    // Check if user is OWNER
    if (req.user.role !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Only owners can update menu items',
      });
      return;
    }

    // Verify menu item belongs to hotel
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id,
        hotelId: req.user.hotelId,
      },
    });

    if (!existingItem) {
      res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
      return;
    }

    // Update menu item
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(category && { category }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isAvailable !== undefined && { isAvailable }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'MENU_ITEM_UPDATED',
        resource: 'MenuItem',
        resourceId: menuItem.id,
        hotelId: req.user.hotelId,
        metadata: {
          changes: { name, description, price, category, isAvailable },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: { menuItem },
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update menu item',
    });
  }
};

// ============================================================
// DELETE MENU ITEM (Owner only)
// ============================================================

export const deleteMenuItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user?.hotelId) {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: No hotel assigned',
      });
      return;
    }

    // Check if user is OWNER
    if (req.user.role !== 'OWNER') {
      res.status(403).json({
        success: false,
        error: 'Unauthorized: Only owners can delete menu items',
      });
      return;
    }

    // Verify menu item belongs to hotel
    const existingItem = await prisma.menuItem.findFirst({
      where: {
        id,
        hotelId: req.user.hotelId,
      },
    });

    if (!existingItem) {
      res.status(404).json({
        success: false,
        error: 'Menu item not found',
      });
      return;
    }

    // Delete menu item
    await prisma.menuItem.delete({
      where: { id },
    });

    // Log to audit
    await prisma.auditLog.create({
      data: {
        userId: req.user.userId,
        action: 'MENU_ITEM_DELETED',
        resource: 'MenuItem',
        resourceId: id,
        hotelId: req.user.hotelId,
        metadata: {
          name: existingItem.name,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete menu item',
    });
  }
};
