import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get schedule (public)
router.get('/', async (req, res) => {
    try {
        const schedule = await prisma.schedule.findMany({
            orderBy: { sortOrder: 'asc' }
        });
        res.json({ schedule });
    } catch (error) {
        console.error('Get schedule error:', error);
        res.status(500).json({ error: 'Program alınırken bir hata oluştu' });
    }
});

// Add schedule item (protected)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { time, activity, sortOrder } = req.body;
        const item = await prisma.schedule.create({
            data: { time, activity, sortOrder: sortOrder || 0 }
        });
        res.json({ success: true, item });
    } catch (error) {
        console.error('Create schedule error:', error);
        res.status(500).json({ error: 'Program öğesi eklenirken bir hata oluştu' });
    }
});

// Update schedule item (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { time, activity, sortOrder } = req.body;
        const item = await prisma.schedule.update({
            where: { id: parseInt(id) },
            data: { time, activity, sortOrder }
        });
        res.json({ success: true, item });
    } catch (error) {
        console.error('Update schedule error:', error);
        res.status(500).json({ error: 'Program öğesi güncellenirken bir hata oluştu' });
    }
});

// Delete schedule item (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.schedule.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete schedule error:', error);
        res.status(500).json({ error: 'Program öğesi silinirken bir hata oluştu' });
    }
});

// Bulk update schedule (protected)
router.post('/bulk', authMiddleware, async (req, res) => {
    try {
        const { schedule } = req.body; // Array of schedule items

        // Delete all existing
        await prisma.schedule.deleteMany({});

        // Create all new
        const created = await prisma.schedule.createMany({
            data: schedule.map((item: any, index: number) => ({
                time: item.time,
                activity: item.activity,
                sortOrder: index
            }))
        });

        const newSchedule = await prisma.schedule.findMany({ orderBy: { sortOrder: 'asc' } });
        res.json({ success: true, schedule: newSchedule });
    } catch (error) {
        console.error('Bulk update schedule error:', error);
        res.status(500).json({ error: 'Program güncellenirken bir hata oluştu' });
    }
});

export default router;
