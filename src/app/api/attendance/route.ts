import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiBadRequest,
  apiUnauthorized,
} from '@/lib/apiResponse';

const PATH = '/api/attendance';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized(PATH);
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    let queryDate = new Date();
    if (dateStr) {
      queryDate = new Date(dateStr);
    }
    
    // Normalize date to start of day
    queryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(queryDate);
    nextDay.setDate(queryDate.getDate() + 1);

    const attendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: queryDate,
          lt: nextDay,
        },
      },
      include: {
        labour: {
          select: {
            id: true,
            name: true,
            trade: true,
            dailyWage: true,
          },
        },
      },
    });

    return apiSuccess({ attendances }, 'Attendance logs retrieved successfully', PATH);
  } catch (error) {
    console.error('Fetch attendance error:', error);
    return apiError('Failed to fetch attendance logs', PATH);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized(PATH);
    }

    const body = await request.json();
    const { date, records } = body; // records: [{ labourId: string, status: 'PRESENT'|'ABSENT'|'LEAVE' }]

    if (!date || !records || !Array.isArray(records)) {
      return apiBadRequest('Missing required parameters', PATH);
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const savedRecords = [];

    for (const record of records) {
      const { labourId, status, projectId } = record;

      // Upsert daily attendance record
      const att = await prisma.attendance.upsert({
        where: {
          labourId_date: {
            labourId,
            date: attendanceDate,
          },
        },
        update: {
          status,
          projectId: projectId || undefined,
        },
        create: {
          date: attendanceDate,
          status,
          labourId,
          projectId: projectId || undefined,
        },
      });
      savedRecords.push(att);
    }

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'SUBMIT_ATTENDANCE',
        details: `Submitted attendance logs for date: ${attendanceDate.toLocaleDateString()} (${records.length} workers)`,
      },
    });

    return apiCreated({ count: savedRecords.length }, 'Attendance logs saved successfully', PATH);
  } catch (error) {
    console.error('Save attendance error:', error);
    return apiError('Failed to save attendance logs', PATH);
  }
}
