import nodemailer from 'nodemailer';
import config from '../config';
import logger from '../utils/logger';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.port === 465,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass,
      },
    });
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: config.smtp.from,
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      logger.error(`Failed to send email to ${to}: ${error}`);
      // Don't throw - email failures shouldn't crash the flow
    }
  }

  async sendOTPEmail(email: string, otp: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e63946, #1d3557); padding: 30px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0;">LifeBridge</h1>
          <p style="margin: 5px 0; opacity: 0.8;">AI-Powered Emergency Healthcare</p>
        </div>
        <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1d3557;">Email Verification</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your OTP for email verification is:</p>
          <div style="background: #e63946; color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      </body>
      </html>
    `;
    await this.send(email, 'LifeBridge - Email Verification OTP', html);
  }

  async sendPasswordResetEmail(email: string, otp: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e63946, #1d3557); padding: 30px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0;">LifeBridge</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1d3557;">Password Reset</h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your OTP to reset your password is:</p>
          <div style="background: #1d3557; color: white; font-size: 36px; font-weight: bold; letter-spacing: 8px; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            ${otp}
          </div>
          <p>This OTP expires in <strong>10 minutes</strong>.</p>
          <p style="color: #e63946; font-weight: bold;">Never share this OTP with anyone, including LifeBridge staff.</p>
        </div>
      </body>
      </html>
    `;
    await this.send(email, 'LifeBridge - Password Reset OTP', html);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e63946, #1d3557); padding: 30px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0;">Welcome to LifeBridge! 🎉</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
          <p>Hello <strong>${name}</strong>,</p>
          <p>Thank you for joining LifeBridge - India's most comprehensive emergency healthcare platform.</p>
          <p>Together, we save lives.</p>
          <a href="${config.frontendUrl}" style="background: #e63946; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin: 20px 0;">
            Get Started
          </a>
        </div>
      </body>
      </html>
    `;
    await this.send(email, 'Welcome to LifeBridge!', html);
  }

  async sendVerificationApprovalEmail(email: string, name: string, status: string): Promise<void> {
    const isApproved = status === 'approved';
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #e63946, #1d3557); padding: 30px; border-radius: 12px; text-align: center; color: white;">
          <h1 style="margin: 0;">LifeBridge</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
          <h2 style="color: ${isApproved ? '#2d6a4f' : '#e63946'};">
            Verification ${isApproved ? '✅ Approved' : '❌ Rejected'}
          </h2>
          <p>Hello <strong>${name}</strong>,</p>
          <p>Your organization verification has been <strong>${status}</strong>.</p>
          ${isApproved
            ? '<p>You can now access all features on the LifeBridge platform.</p>'
            : '<p>Please contact support for more information.</p>'
          }
        </div>
      </body>
      </html>
    `;
    await this.send(email, `LifeBridge - Verification ${isApproved ? 'Approved' : 'Rejected'}`, html);
  }
}

export default new EmailService();
