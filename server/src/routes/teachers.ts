import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all teachers (public for display)
router.get('/', async (req, res) => {
    try {
        const teachers = await prisma.teacher.findMany({
            include: { classes: { include: { class: true } } },
            orderBy: { name: 'asc' }
        });
        res.json({ teachers });
    } catch (error) {
        console.error('Get teachers error:', error);
        res.status(500).json({ error: 'Öğretmenler alınırken bir hata oluştu' });
    }
});

// Create teacher (protected)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, role, branch, image } = req.body;
        const teacher = await prisma.teacher.create({
            data: { name, role, branch, image: image || 'face' }
        });
        res.json({ success: true, teacher });
    } catch (error) {
        console.error('Create teacher error:', error);
        res.status(500).json({ error: 'Öğretmen eklenirken bir hata oluştu' });
    }
});

// Update teacher (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, role, branch, image } = req.body;
        const teacher = await prisma.teacher.update({
            where: { id: parseInt(id as string) },
            data: { name, role, branch, image }
        });
        res.json({ success: true, teacher });
    } catch (error) {
        console.error('Update teacher error:', error);
        res.status(500).json({ error: 'Öğretmen güncellenirken bir hata oluştu' });
    }
});

// Delete teacher (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.teacher.delete({ where: { id: parseInt(id as string) } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete teacher error:', error);
        res.status(500).json({ error: 'Öğretmen silinirken bir hata oluştu' });
    }
});

export default router;
