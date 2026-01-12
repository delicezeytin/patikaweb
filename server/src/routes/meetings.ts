import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// --- Meeting Forms ---

// Get all meeting forms (publicly accessible for now, or use optionalAuth for admin info)
router.get('/forms', async (req, res) => {
    try {
        const forms = await prisma.meetingForm.findMany({
            orderBy: { createdAt: 'desc' },
            include: { requests: false } // Don't include requests in list view usually
        });
        res.json({ forms });
    } catch (error) {
        console.error('Get meeting forms error:', error);
        res.status(500).json({ error: 'Toplantı formları alınırken bir hata oluştu' });
    }
});

// Get single meeting form by ID (public)
router.get('/forms/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const form = await prisma.meetingForm.findUnique({
            where: { id: parseInt(id) }
        });
        if (!form) return res.status(404).json({ error: 'Form bulunamadı' });
        res.json({ form });
    } catch (error) {
        console.error('Get meeting form error:', error);
        res.status(500).json({ error: 'Form alınırken bir hata oluştu' });
    }
});

// Create meeting form (Protected)
router.post('/forms', authMiddleware, async (req, res) => {
    try {
        const { title, dates, dailyStartTime, dailyEndTime, durationMinutes, bufferMinutes, isActive, classes } = req.body;
        const form = await prisma.meetingForm.create({
            data: {
                title, dates, dailyStartTime, dailyEndTime, durationMinutes, bufferMinutes, isActive, classes
            }
        });
        res.json({ success: true, form });
    } catch (error) {
        console.error('Create meeting form error:', error);
        res.status(500).json({ error: 'Form oluşturulurken bir hata oluştu' });
    }
});

// Update meeting form (Protected)
router.put('/forms/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, dates, dailyStartTime, dailyEndTime, durationMinutes, bufferMinutes, isActive, classes } = req.body;
        const form = await prisma.meetingForm.update({
            where: { id: parseInt(id) },
            data: {
                title, dates, dailyStartTime, dailyEndTime, durationMinutes, bufferMinutes, isActive, classes
            }
        });
        res.json({ success: true, form });
    } catch (error) {
        console.error('Update meeting form error:', error);
        res.status(500).json({ error: 'Form güncellenirken bir hata oluştu' });
    }
});

// Delete meeting form (Protected)
router.delete('/forms/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.meetingForm.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete meeting form error:', error);
        res.status(500).json({ error: 'Form silinirken bir hata oluştu' });
    }
});

// --- Meeting Requests ---

// Get all requests (Protected)
router.get('/requests', authMiddleware, async (req, res) => {
    try {
        const requests = await prisma.meetingRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ requests });
    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({ error: 'Randevu talepleri alınırken bir hata oluştu' });
    }
});

// Create request (Public)
router.post('/requests', async (req, res) => {
    try {
        const { formId, parentName, studentName, date, time, classId, className, teacherId, email, phone } = req.body;

        // TODO: Validate slot availability

        const request = await prisma.meetingRequest.create({
            data: {
                formId, parentName, studentName, date, time, classId, className, teacherId, email, phone,
                status: 'pending'
            }
        });

        // TODO: Send notification email

        res.json({ success: true, request });
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ error: 'Randevu oluşturulurken bir hata oluştu' });
    }
});

// Update request status (Protected)
router.put('/requests/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const request = await prisma.meetingRequest.update({
            where: { id: parseInt(id) },
            data: { status }
        });

        // TODO: Send status update email

        res.json({ success: true, request });
    } catch (error) {
        console.error('Update request error:', error);
        res.status(500).json({ error: 'Randevu güncellenirken bir hata oluştu' });
    }
});

// Delete request (Protected)
router.delete('/requests/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.meetingRequest.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete request error:', error);
        res.status(500).json({ error: 'Randevu silinirken bir hata oluştu' });
    }
});

export default router;
