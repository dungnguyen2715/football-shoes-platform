import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly config: ConfigService) {
    const host = config.get<string>('SMTP_HOST');
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port: config.get<number>('SMTP_PORT', 587),
        secure: config.get<number>('SMTP_PORT', 587) === 465,
        auth: {
          user: config.getOrThrow<string>('SMTP_USER'),
          pass: config.getOrThrow<string>('SMTP_PASSWORD'),
        },
      });
    }
  }

  async sendPasswordReset(email: string, token: string): Promise<void> {
    const frontendUrl = this.config.get<string>(
      'FRONTEND_URL',
      'http://localhost:8080',
    );
    const resetUrl =
      frontendUrl + '/reset-password?token=' + encodeURIComponent(token);

    if (!this.transporter) {
      this.logger.warn(
        'Local-only password reset link for ' + email + ': ' + resetUrl,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to: email,
      subject: 'Reset your Bootyard password',
      text: 'Use this one-time link within 30 minutes: ' + resetUrl,
    });
  }
}
