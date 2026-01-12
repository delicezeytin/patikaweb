import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all documents (public)
router.get('/', async (req, res) => {
    try {
        const documents = await prisma.document.findMany({
            orderBy: { name: 'asc' }
        });
        res.json({ documents });
    } catch (error) {
        console.error('Get documents error:', error);
        res.status(500).json({ error: 'Dokümanlar alınırken bir hata oluştu' });
    }
});

// Create document (protected)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { id, name, url, icon, color, bg } = req.body;
        const document = await prisma.document.create({
            data: { id, name, url, icon, color, bg }
        });
        res.json({ success: true, document });
    } catch (error) {
        console.error('Create document error:', error);
        res.status(500).json({ error: 'Doküman eklenirken bir hata oluştu' });
    }
});

// Update document (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, url, icon, color, bg } = req.body;
        const document = await prisma.document.update({
            where: { id: id as string },
            data: { name, url, icon, color, bg }
        });
        res.json({ success: true, document });
    } catch (error) {
        console.error('Update document error:', error);
        res.status(500).json({ error: 'Doküman güncellenirken bir hata oluştu' });
    }
});

// Delete document (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.document.delete({ where: { id: id as string } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete document error:', error);
        res.status(500).json({ error: 'Doküman silinirken bir hata oluştu' });
    }
});

export default router;
