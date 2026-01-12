import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendEmail = async (to: string | string[], subject: string, html: string): Promise<{ success: boolean; error?: any }> => {
    try {
        const settings = await prisma.systemSettings.findFirst();
        if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
            console.error('SMTP settings missing in database');
            return { success: false, error: 'SMTP ayarları eksik' };
        }

        // Lazy load nodemailer to avoid import errors if not installed (though we installed it)
        const nodemailer = require('nodemailer');

        const port = parseInt(settings.smtpPort || '587');
        const isSecure = port === 465;

        const transporter = nodemailer.createTransport({
            host: settings.smtpHost,
            port: port,
            secure: isSecure, // true for 465, false for other ports
            auth: {
                user: settings.smtpUser,
                pass: settings.smtpPass,
            },
            tls: {
                rejectUnauthorized: false // Often needed for some SMTP servers
            }
        });

        await transporter.verify(); // Verify connection first

        await transporter.sendMail({
            from: `"Patika Yuva" <${settings.smtpUser}>`,
            to: to,
            subject: subject,
            html: html,
        });

        console.log(`Email sent successfully to: ${to}`);
        return { success: true };
    } catch (error) {
        console.error('Send email error:', error);
        return { success: false, error: error };
    }
};

export const sendOtpEmail = async (email: string, otp: string): Promise<void> => {
    const sent = await sendEmail(
        email,
        'Patika Yuva - Veli Toplantısı Doğrulama Kodu (OTP)',
        `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2 style="color: #e65100;">Doğrulama Kodu</h2>
            <p>E-posta adresinizi doğrulamak ve işleminize devam etmek için aşağıdaki kodu kullanınız:</p>
            <h1 style="font-size: 32px; letter-spacing: 5px; background: #eee; padding: 10px; display: inline-block; border-radius: 8px;">${otp}</h1>
            <p>Bu kod 5 dakika süreyle geçerlidir.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <small style="color: #888;">Patika Çocuk Yuvası</small>
        </div>
        `
    );

    // We can log error if sent.success is false, but return void as per signature
    if (!sent.success) {
        console.error('OTP Email failed', sent.error);
        // For OTP specifically, auth route might handle error, but we can throw here to notify caller of failure if needed
        throw new Error('OTP e-postası gönderilemedi. Lütfen SMTP ayarlarını kontrol ediniz.');
    }
};
