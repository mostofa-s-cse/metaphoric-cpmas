import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer';
import { getCurrentUser } from '@/lib/auth';
import {
  apiSuccess,
  apiCreated,
  apiError,
  apiBadRequest,
  apiUnauthorized,
  apiForbidden,
} from '@/lib/apiResponse';

const PATH = '/api/contact';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, scope, details } = body;

    if (!name || !email || !scope) {
      return apiBadRequest('Name, email, and scope are required.', PATH);
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

    return apiCreated({ inquiry }, 'Inquiry submitted successfully', PATH);
  } catch (error: any) {
    console.error('API /contact error:', error);
    return apiError(error?.message || 'Internal server error', PATH);
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return apiUnauthorized(PATH);
    }

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return apiForbidden(PATH, 'Forbidden: Insufficient privileges');
    }

    const inquiries = await prisma.contactInquiry.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return apiSuccess({ inquiries }, 'Contact inquiries retrieved successfully', PATH);
  } catch (error: any) {
    console.error('API /contact GET error:', error);
    return apiError(error?.message || 'Internal server error', PATH);
  }
}
