import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const verificationUrl = `http://localhost:4000/auth/verify-email?token=${token}`;

    console.log('🚀 Email Verification');
    console.log('📧 To:', email);
    console.log('🔗 Verification Link:', verificationUrl);
    console.log('📝 Message: Please click the link above to verify your email address.');
    console.log('⏰ This link will expire in 24 hours.');
    console.log('='.repeat(60));
  }
}