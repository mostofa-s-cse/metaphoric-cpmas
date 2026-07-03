import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import {
  apiSuccess,
  apiError,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
  apiNotFound,
} from '@/lib/apiResponse';

const PATH = '/api/users';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiUnauthorized(PATH);
    }

    const { id } = await params;

    // Users can view their own profile; super admins can view any
    if (currentUser.id !== id && currentUser.role !== 'SUPER_ADMIN') {
      return apiForbidden(PATH);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        profileImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return apiNotFound('User', PATH);
    }

    return apiSuccess({ user }, 'User details retrieved successfully', PATH);
  } catch (error: any) {
    console.error('User fetch error:', error);
    return apiError('Failed to fetch user', PATH);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiUnauthorized(PATH);
    }

    const { id } = await params;
    const body = await request.json();
    const { email, fullName, role, newPassword, profileImage } = body;

    // Users can update their own profile (except role); super admins can update all
    const isSelf = currentUser.id === id;
    const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

    if (!isSelf && !isSuperAdmin) {
      return apiForbidden(PATH);
    }

    // Non-super-admins cannot change role
    if (!isSuperAdmin && role) {
      return apiForbidden(PATH, 'Forbidden: Cannot change own role');
    }

    const updateData: any = {};

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (profileImage !== undefined) updateData.profileImage = profileImage;
    if (isSuperAdmin && role) updateData.role = role;

    if (newPassword) {
      if (newPassword.length < 6) {
        return apiBadRequest('Password must be at least 6 characters', PATH);
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        profileImage: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'UPDATE_USER',
        details: `Updated user ${updatedUser.fullName} (${updatedUser.email})`,
      },
    });

    return apiSuccess({ user: updatedUser }, 'User updated successfully', PATH);
  } catch (error: any) {
    console.error('User update error:', error);
    return apiError('Failed to update user', PATH);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return apiUnauthorized(PATH);
    }

    const { id } = await params;

    // Only Super Admin can delete users
    if (currentUser.role !== 'SUPER_ADMIN') {
      return apiForbidden(PATH, 'Forbidden: Only Super Admin can delete users');
    }

    // Prevent self-deletion
    if (currentUser.id === id) {
      return apiBadRequest('Cannot delete your own account', PATH);
    }

    const userToDelete = await prisma.user.findUnique({
      where: { id },
      select: { id: true, fullName: true, email: true },
    });
    if (!userToDelete) {
      return apiNotFound('User', PATH);
    }

    await prisma.user.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: currentUser.id,
        action: 'DELETE_USER',
        details: `Deleted user ${userToDelete.fullName} (${userToDelete.email})`,
      },
    });

    return apiSuccess(null, 'User deleted successfully', PATH);
  } catch (error: any) {
    console.error('User delete error:', error);
    return apiError('Failed to delete user', PATH);
  }
}
