import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private readonly resend = new Resend(process.env.RESEND_API_KEY);

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.API_URL ?? 'http://localhost:4000'}/auth/verify-email?token=${token}`;

    const { error } = await this.resend.emails.send({
      from: 'westore <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your westore account',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
          <h2 style="color:#09B1BA;margin:0 0 8px">westore</h2>
          <p style="color:#111;font-size:16px;font-weight:600;margin:0 0 16px">Confirm your email address</p>
          <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 24px">
            Click the button below to verify your account. This link expires in 24 hours.
          </p>
          <a href="${verificationUrl}"
            style="display:inline-block;background:#09B1BA;color:#fff;text-decoration:none;
                   padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600">
            Verify email
          </a>
          <p style="color:#aaa;font-size:12px;margin:24px 0 0">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      throw new Error(`Failed to send verification email: ${error.message}`);
    }
  }
}
