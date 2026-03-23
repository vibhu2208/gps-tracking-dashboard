import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, company, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'vaibhavsingh5373@gmail.com',
        pass: 'nrfa wdtu gwtx ogar',
      },
    });

    const mailOptions = {
      from: 'vaibhavsingh5373@gmail.com',
      to: 'vaibhavsingh5373@gmail.com',
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🚀 New Contact Form Submission</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1f2937; margin-top: 0;">Contact Details</h2>
            
            <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-left: 4px solid #3b82f6; border-radius: 4px;">
              <p style="margin: 5px 0; color: #4b5563;"><strong style="color: #1f2937;">Name:</strong> ${name}</p>
              <p style="margin: 5px 0; color: #4b5563;"><strong style="color: #1f2937;">Email:</strong> ${email}</p>
              ${phone ? `<p style="margin: 5px 0; color: #4b5563;"><strong style="color: #1f2937;">Phone:</strong> ${phone}</p>` : ''}
              ${company ? `<p style="margin: 5px 0; color: #4b5563;"><strong style="color: #1f2937;">Company:</strong> ${company}</p>` : ''}
            </div>
            
            <h3 style="color: #1f2937; margin-top: 25px;">Message</h3>
            <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
              <p style="color: #374151; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center;">
              <p style="color: #6b7280; font-size: 14px; margin: 0;">
                This email was sent from the Fleetzi GPS Tracking contact form
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'Email sent successfully!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email. Please try again later.' },
      { status: 500 }
    );
  }
}
