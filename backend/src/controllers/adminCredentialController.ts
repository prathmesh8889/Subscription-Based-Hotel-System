import { Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';

const changeSchema = z.object({
  currentPassword: z.string().min(1),
  newEmail: z.string().email(),
  newPassword: z.string().min(10),
});

export async function getCredentialChangeStatus(req: any, res: Response) {
  try {
    const used = await prisma.auditLog.findFirst({
      where: {
        userId: req.user.userId,
        action: 'ADMIN_CREDENTIALS_CHANGED',
      },
      select: { id: true, createdAt: true },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { email: true },
    });

    res.json({
      success: true,
      data: {
        currentEmail: user?.email,
        canChange: !used,
        changedAt: used?.createdAt || null,
      },
    });
  } catch (error) {
    console.error('Credential status error:', error);
    res.status(500).json({ success: false, error: 'Failed to load credential settings.' });
  }
}

export async function changeAdminCredentials(req: any, res: Response) {
  try {
    const parsed = changeSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: 'Enter a valid email and a password of at least 10 characters.' });
      return;
    }

    const alreadyChanged = await prisma.auditLog.findFirst({
      where: {
        userId: req.user.userId,
        action: 'ADMIN_CREDENTIALS_CHANGED',
      },
      select: { id: true },
    });

    if (alreadyChanged) {
      res.status(403).json({ success: false, error: 'Admin login ID and password can only be changed once.' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || user.role !== 'SUPER_ADMIN') {
      res.status(404).json({ success: false, error: 'Super Admin account not found.' });
      return;
    }

    const validCurrentPassword = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!validCurrentPassword) {
      res.status(400).json({ success: false, error: 'Current password is incorrect.' });
      return;
    }

    const newEmail = parsed.data.newEmail.trim().toLowerCase();
    const existingEmail = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existingEmail && existingEmail.id !== user.id) {
      res.status(409).json({ success: false, error: 'This login email is already in use.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 12);

    await prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: newEmail,
          password: hashedPassword,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'ADMIN_CREDENTIALS_CHANGED',
          resource: 'User',
          resourceId: user.id,
          metadata: {
            previousEmail: user.email,
            newEmail,
          },
        },
      });
    });

    res.clearCookie('auth_token', {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });

    res.json({
      success: true,
      message: 'Admin login ID and password changed successfully. Please sign in again.',
      data: { newEmail, requiresLogin: true },
    });
  } catch (error) {
    console.error('Credential change error:', error);
    res.status(500).json({ success: false, error: 'Failed to change admin credentials.' });
  }
}
