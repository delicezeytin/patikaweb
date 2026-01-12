import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendEmail = async (to: string | string[], subject: string, html: string): Promise<boolean> => {
    try {
        const settings = await prisma.systemSettings.findFirst();
        if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
            console.error('SMTP settings missing in database');
            return false;
        }

        // Lazy load nodemailer to avoid import errors if not installed (though we installed it)
        const nodemailer = require('nodemailer');

        const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: parseInt(settings.smtpPort || '587'),
            secure: false, // true for 465, false for other ports
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPass,
            },
        });

        await transporter.sendMail({
            from: `"Patika Yuva" <${settings.smtpUser}>`,
            to: to,
            subject: subject,
            html: html,
        });

        console.log(`Email sent successfully to: ${to}`);
        return true;
    } catch (error) {
        console.error('Send email error:', error);
        return false;
    }
};

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
    const sent = await sendEmail(
        email,
        'Patika Yuva - Doğrulama Kodu (OTP)',
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #e65100;">Giriş Doğrulama</h2>
            <p>Yönetim paneline giriş yapmak için aşağıdaki kodu kullanınız:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; background: #eee; padding: 10px; display: inline-block; border-radius: 8px;">${otp}</h1>
            <p>Bu kod 5 dakika süreyle geçerlidir.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <small style="color: #888;">Patika Çocuk Yuvası</small>
        </div>
        `
    );

    if (!sent) {
        // Fallback or error logging is handled in sendEmail, but we throw here to notify caller of failure if needed
        // For OTP specifically, auth route might handle error.
        throw new Error('OTP e-postası gönderilemedi. Lütfen SMTP ayarlarını kontrol ediniz.');
    }
};
