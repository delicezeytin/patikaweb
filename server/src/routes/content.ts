import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get page content (public)
router.get('/:pageType', async (req, res) => {
    try {
        const { pageType } = req.params;

        const content = await prisma.pageContent.findUnique({
            where: { pageType }
        });

        if (!content) {
            return res.json({ content: null });
        }

        res.json({ content: content.content });
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({ error: 'İçerik alınırken bir hata oluştu' });
    }
});

// Update page content (protected)
router.put('/:pageType', authMiddleware, async (req, res) => {
    try {
        const { pageType } = req.params;
        const { content } = req.body;

        const updated = await prisma.pageContent.upsert({
            where: { pageType: pageType as string },
            update: { content },
            create: { pageType: pageType as string, content }
        });

        res.json({ success: true, content: updated.content });
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({ error: 'İçerik güncellenirken bir hata oluştu' });
    }
});

export default router;
