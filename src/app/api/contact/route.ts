import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, scope, details } = body;

    if (!name || !email || !scope) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and scope are required.' },
        { status: 400 }
      );
    }

    // Save to database
    const inquiry = await prisma.contactInquiry.create({
      data: {
        name,
        email,
        scope,
        details,
      },
    });

    // Send email via nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const toEmail = process.env.NOTIFICATION_EMAIL || process.env.SMTP_USER;

    if (toEmail && process.env.SMTP_PASS) {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: toEmail,
        subject: `New Contact Inquiry - ${name}`,
        html: `
          <h2>New Contact Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Project Scope:</strong> ${scope}</p>
          <p><strong>Details:</strong><br/>${details || 'No details provided.'}</p>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        // Continue even if email fails
      }
    }

    return NextResponse.json({ success: true, message: 'Inquiry submitted', data: inquiry });
  } catch (error: any) {
    console.error('API /contact error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const inquiries = await prisma.contactInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, data: inquiries });
  } catch (error: any) {
    console.error('API /contact GET error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error', error: String(error) },
      { status: 500 }
    );
  }
}
