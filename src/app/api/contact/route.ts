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
    const smtpSetting = await prisma.websiteSettings.findUnique({
      where: { key: 'SMTP_SETTINGS' },
    });

    const smtp = smtpSetting?.value as any;

    if (smtp && smtp.user && smtp.pass && smtp.host) {
      const transporter = nodemailer.createTransport({
        host: smtp.host || 'smtp.gmail.com',
        port: parseInt(smtp.port) || 587,
        secure: smtp.secure === true || smtp.secure === 'true',
        auth: {
          user: smtp.user,
          pass: smtp.pass,
        },
      });

      const toEmail = smtp.notificationEmail || smtp.user;
      const fromEmail = smtp.fromEmail || smtp.user;

      const mailOptions = {
        from: fromEmail,
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
      }
    } else {
      // Send email via nodemailer fallback env
      const envUser = process.env.SMTP_USER;
      const envPass = process.env.SMTP_PASS;

      if (envUser && envPass) {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 587,
          secure: false,
          auth: {
            user: envUser,
            pass: envPass,
          },
        });

        const toEmail = process.env.NOTIFICATION_EMAIL || envUser;

        const mailOptions = {
          from: envUser,
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
          console.log('Email sent successfully via fallback env');
        } catch (emailError) {
          console.error('Error sending email via fallback env:', emailError);
        }
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
