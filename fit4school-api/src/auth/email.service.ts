import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER || 'fit4school.official@gmail.com',
        pass: process.env.EMAIL_PASS || 'pmzh zbqg omcc gcna',
      },
    });
  }

  async sendOtpEmail(email: string, otp: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"Fit4School" <${process.env.EMAIL_USER || 'fit4school.official@gmail.com'}>`,
        to: email,
        subject: 'Your Fit4School Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #61C35C;">Fit4School Account Verification</h2>
            <p>Your verification code is:</p>
            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This code will expire in 5 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `,
      });
      console.log(`OTP sent to ${email}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
}