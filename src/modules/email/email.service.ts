import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export class EmailService {
    private transporter: nodemailer.Transporter | null = null;

    constructor() {
        const smtpHost = process.env.SMTP_HOST;
        const smtpPort = parseInt(process.env.SMTP_PORT || "587");
        const smtpUser = process.env.SMTP_USER;
        const smtpPass = process.env.SMTP_PASS;

        if (smtpHost && smtpUser && smtpPass) {
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpPort === 465,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
            });
        }
    }

    async sendEmail(options: SendEmailOptions): Promise<boolean> {
        const fromAddress = process.env.SMTP_FROM || '"LendPay Wallet" <no-reply@lendpay.com>';

        if (this.transporter) {
            try {
                await this.transporter.sendMail({
                    from: fromAddress,
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                    text: options.text,
                });
                return true;
            } catch (error) {
                console.error("Failed to send email via SMTP provider:", error);
                return false;
            }
        }

        // Development/Test fallback log
        console.log("==========================================");
        console.log(`[EMAIL ENGINE] Sending to: ${options.to}`);
        console.log(`[EMAIL ENGINE] Subject: ${options.subject}`);
        console.log(`[EMAIL ENGINE] Body snippet: ${options.text || options.html.replace(/<[^>]*>?/gm, "")}`);
        console.log("==========================================");
        return true;
    }

    async sendVerificationOTP(email: string, firstName: string, code: string): Promise<boolean> {
        const subject = "Verify Your LendPay Account";
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Welcome to LendPay Wallet, ${firstName}!</h2>
                <p>Please use the following 6-digit verification code to complete your registration:</p>
                <div style="background: #f4f6f8; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #2563eb; border-radius: 8px; margin: 20px 0;">
                    ${code}
                </div>
                <p>This code will expire in 15 minutes.</p>
                <p>If you did not request this verification, please ignore this email.</p>
            </div>
        `;
        const text = `Welcome ${firstName}! Your LendPay verification code is: ${code}. It expires in 15 minutes.`;

        return this.sendEmail({ to: email, subject, html, text });
    }

    async sendPasswordResetOTP(email: string, firstName: string, code: string): Promise<boolean> {
        const subject = "Reset Your LendPay Password";
        const html = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2>Reset Your Password, ${firstName}</h2>
                <p>We received a request to reset your LendPay Wallet password.</p>
                <p>Please use the following 6-digit code to reset your password:</p>
                <div style="background: #f4f6f8; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #dc2626; border-radius: 8px; margin: 20px 0;">
                    ${code}
                </div>
                <p>This code will expire in 30 minutes.</p>
                <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
        `;
        const text = `Reset your LendPay password. Your code is: ${code}. It expires in 30 minutes.`;

        return this.sendEmail({ to: email, subject, html, text });
    }
}

export const emailService = new EmailService();
export default emailService;
