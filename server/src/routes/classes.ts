import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all classes
router.get('/', async (req, res) => {
    try {
        const classes = await prisma.class.findMany({
            include: { teachers: { include: { teacher: true } } },
            orderBy: { name: 'asc' }
        });
        res.json({ classes });
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ error: 'Sınıflar alınırken bir hata oluştu' });
    }
});

// Create class (protected)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, capacity, ageGroup, teacherIds } = req.body;
        const newClass = await prisma.class.create({
            data: {
                name,
                capacity,
                ageGroup,
                teachers: teacherIds ? {
                    create: teacherIds.map((id: number) => ({ teacherId: id }))
                } : undefined
            },
            include: { teachers: { include: { teacher: true } } }
        });
        res.json({ success: true, class: newClass });
    } catch (error) {
        console.error('Create class error:', error);
        res.status(500).json({ error: 'Sınıf eklenirken bir hata oluştu' });
    }
});

// Update class (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, capacity, ageGroup, teacherIds } = req.body;

        // Delete existing teacher relations
        await prisma.teacherClass.deleteMany({ where: { classId: parseInt(id as string) } });

        const updatedClass = await prisma.class.update({
            where: { id: parseInt(id as string) },
            data: {
                name,
                capacity,
                ageGroup,
                teachers: teacherIds ? {
                    create: teacherIds.map((tid: number) => ({ teacherId: tid }))
                } : undefined
            },
            include: { teachers: { include: { teacher: true } } }
        });
        res.json({ success: true, class: updatedClass });
    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({ error: 'Sınıf güncellenirken bir hata oluştu' });
    }
});

// Delete class (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.class.delete({ where: { id: parseInt(id as string) } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({ error: 'Sınıf silinirken bir hata oluştu' });
    }
});

export default router;
