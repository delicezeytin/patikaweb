import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get weekly menu (public)
router.get('/', async (req, res) => {
    try {
        const menu = await prisma.weeklyMenu.findMany({
            orderBy: { id: 'asc' }
        });
        res.json({ menu });
    } catch (error) {
        console.error('Get menu error:', error);
        res.status(500).json({ error: 'Menü alınırken bir hata oluştu' });
    }
});

// Update or create menu for a day (protected)
router.put('/:day', authMiddleware, async (req, res) => {
    try {
        const { day } = req.params;
        const { breakfast, lunch, snack } = req.body;

        const menu = await prisma.weeklyMenu.upsert({
            where: { day },
            update: { breakfast, lunch, snack },
            create: { day, breakfast, lunch, snack }
        });
        res.json({ success: true, menu });
    } catch (error) {
        console.error('Update menu error:', error);
        res.status(500).json({ error: 'Menü güncellenirken bir hata oluştu' });
    }
});

// Bulk update entire week (protected)
router.post('/bulk', authMiddleware, async (req, res) => {
    try {
        const { menu } = req.body; // { Pazartesi: {...}, Salı: {...}, ... }

        const days = Object.keys(menu);
        for (const day of days) {
            await prisma.weeklyMenu.upsert({
                where: { day },
                update: menu[day],
                create: { day, ...menu[day] }
            });
        }

        const updatedMenu = await prisma.weeklyMenu.findMany({ orderBy: { id: 'asc' } });
        res.json({ success: true, menu: updatedMenu });
    } catch (error) {
        console.error('Bulk update menu error:', error);
        res.status(500).json({ error: 'Menü güncellenirken bir hata oluştu' });
    }
});

export default router;
