import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get settings (protected)
router.get('/', authMiddleware, async (req, res) => {
    try {
        let settings = await prisma.systemSettings.findUnique({ where: { id: 1 } });

        if (!settings) {
            settings = await prisma.systemSettings.create({
                data: { id: 1 }
            });
        }

        res.json({ settings });
    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Ayarlar alınırken bir hata oluştu' });
    }
});

// Update settings (protected)
router.put('/', authMiddleware, async (req, res) => {
    try {
        const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey, calendarId, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;

        const settings = await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: { emailjsServiceId, emailjsTemplateId, emailjsPublicKey, calendarId, smtpHost, smtpPort, smtpUser, smtpPass },
            create: { id: 1, emailjsServiceId, emailjsTemplateId, emailjsPublicKey, calendarId, smtpHost, smtpPort, smtpUser, smtpPass }
        });

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Ayarlar güncellenirken bir hata oluştu' });
    }
});

// Test Email (protected)
router.post('/test-email', authMiddleware, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'E-posta adresi gerekli' });

        const { sendEmail } = require('../services/email');
        const sent = await sendEmail(
            email,
            'Patika Yuva - SMTP Test',
            '<h3>SMTP Test Başarılı</h3><p>Bu e-posta, sistem ayarlarındaki SMTP yapılandırmasını test etmek için gönderilmiştir.</p>'
        );

        if (sent) {
            res.json({ success: true, message: 'Test e-postası başarıyla gönderildi.' });
        } else {
            res.status(500).json({ error: 'E-posta gönderilemedi. Lütfen sunucu loglarını kontrol ediniz.' });
        }
    } catch (error) {
        console.error('Test email error:', error);
        res.status(500).json({ error: 'Test işlemi sırasında hata oluştu' });
    }
});

export default router;
