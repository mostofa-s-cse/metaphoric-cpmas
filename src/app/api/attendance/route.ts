import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        labour: true,
      },
    });

    return NextResponse.json({ attendances });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch attendance logs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { date, records } = body; // records: [{ labourId: string, status: 'PRESENT'|'ABSENT'|'LEAVE' }]

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
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

    return NextResponse.json({ success: true, count: savedRecords.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save attendance logs' }, { status: 500 });
  }
}
