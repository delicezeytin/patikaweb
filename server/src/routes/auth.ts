import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Generate 6-digit OTP
const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request OTP
router.post('/request-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'E-posta adresi gerekli' });
        }

        const adminEmail = process.env.ADMIN_EMAIL || 'patikayuva@gmail.com';

        if (email.toLowerCase() !== adminEmail.toLowerCase()) {
            return res.status(403).json({ error: 'Bu e-posta adresi yönetim paneline erişim yetkisine sahip değil' });
        }

        // Find or create admin user
        let admin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });

        if (!admin) {
            admin = await prisma.adminUser.create({ data: { email: adminEmail } });
        }

        // Generate OTP
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Save OTP to database
        await prisma.otpCode.create({
            data: {
                code: otp,
                adminId: admin.id,
                expiresAt
            }
        });

        // TODO: Send OTP via EmailJS in production
        // For now, return OTP in development mode
        if (process.env.NODE_ENV === 'development') {
            return res.json({
                success: true,
                message: 'OTP gönderildi',
                // Only show OTP in development
                devOtp: otp
            });
        }

        res.json({ success: true, message: 'OTP e-posta adresinize gönderildi' });
    } catch (error) {
        console.error('OTP request error:', error);
        res.status(500).json({ error: 'OTP gönderilirken bir hata oluştu' });
    }
});

// Verify OTP and login
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ error: 'E-posta ve OTP gerekli' });
        }

        const admin = await prisma.adminUser.findUnique({ where: { email } });

        if (!admin) {
            return res.status(403).json({ error: 'Kullanıcı bulunamadı' });
        }

        // Find valid OTP
        const validOtp = await prisma.otpCode.findFirst({
            where: {
                adminId: admin.id,
                code: otp,
                expiresAt: { gt: new Date() },
                usedAt: null
            }
        });

        if (!validOtp) {
            return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş OTP' });
        }

        // Mark OTP as used
        await prisma.otpCode.update({
            where: { id: validOtp.id },
            data: { usedAt: new Date() }
        });

        // Generate JWT token
        const token = jwt.sign(
            { adminId: admin.id, email: admin.email },
            process.env.JWT_SECRET || 'default-secret',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            token,
            admin: { id: admin.id, email: admin.email }
        });
    } catch (error) {
        console.error('OTP verify error:', error);
        res.status(500).json({ error: 'Doğrulama sırasında bir hata oluştu' });
    }
});

// Verify token (check if still valid)
router.get('/verify', async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ valid: false });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as any;
        res.json({ valid: true, admin: { id: decoded.adminId, email: decoded.email } });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

export default router;
