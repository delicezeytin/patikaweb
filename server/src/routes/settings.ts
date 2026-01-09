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
        const { emailjsServiceId, emailjsTemplateId, emailjsPublicKey, calendarId } = req.body;

        const settings = await prisma.systemSettings.upsert({
            where: { id: 1 },
            update: { emailjsServiceId, emailjsTemplateId, emailjsPublicKey, calendarId },
            create: { id: 1, emailjsServiceId, emailjsTemplateId, emailjsPublicKey, calendarId }
        });

        res.json({ success: true, settings });
    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: 'Ayarlar güncellenirken bir hata oluştu' });
    }
});

export default router;
