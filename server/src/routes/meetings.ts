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
            where: { id: parseInt(id as string) }
        });
        if (!form) return res.status(404).json({ error: 'Form bulunamadı' });
        res.json({ form });
    } catch (error) {
        console.error('Get meeting form error:', error);
        res.status(500).json({ error: 'Form alınırken bir hata oluştu' });
    }
});

// Get booked slots for a form (public)
router.get('/forms/:id/slots', async (req, res) => {
    try {
        const { id } = req.params;
        const requests = await prisma.meetingRequest.findMany({
            where: {
                formId: parseInt(id as string),
                status: { not: 'rejected' } // Only rejected slots are free again
            },
            select: {
                date: true,
                time: true,
                classId: true
            }
        });
        res.json({ slots: requests });
    } catch (error) {
        console.error('Get slots error:', error);
        res.status(500).json({ error: 'Müsaitlik durumu alınırken bir hata oluştu' });
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
            where: { id: parseInt(id as string) },
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
        await prisma.meetingForm.delete({ where: { id: parseInt(id as string) } });
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

// Helper to generate OTP
const generateOtp = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create request (public)
router.post('/requests', async (req, res) => {
    try {
        const { formId, parentName, studentName, date, time, email, phone, classId, className, teacherId } = req.body;

        // Validation
        if (!email) return res.status(400).json({ error: 'E-posta adresi zorunludur' });

        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        const request = await prisma.meetingRequest.create({
            data: {
                formId: Number(formId),
                parentName,
                studentName,
                date,
                time,
                email,
                phone,
                classId,
                className,
                teacherId,
                status: 'pending_verification', // Initial status
                verificationCode: otp,
                verificationExpires: otpExpires
            }
        });

        // Send OTP email
        try {
            const { sendOtpEmail } = require('../services/email');
            await sendOtpEmail(email, otp);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);
            // We still return success but maybe warn? Or fail? 
            // Better to fail if OTP is critical, but preventing whole flow might be bad if SMTP is down.
            // For now, allow proceed but log. User will realize they didn't get email.
        }

        res.json({ success: true, message: 'Doğrulama kodu e-posta adresinize gönderildi.', requestId: request.id });
    } catch (error) {
        console.error('Create request error:', error);
        res.status(500).json({ error: 'Talep oluşturulurken bir hata oluştu' });
    }
});

// Verify Request OTP (public)
router.post('/requests/verify', async (req, res) => {
    try {
        const { requestId, code } = req.body;
        const request = await prisma.meetingRequest.findUnique({ where: { id: Number(requestId) } });

        if (!request) return res.status(404).json({ error: 'Talep bulunamadı' });
        if (request.status !== 'pending_verification') return res.status(400).json({ error: 'Bu talep zaten doğrulanmış veya işleme alınmış' });

        if (request.verificationCode !== code) {
            return res.status(400).json({ error: 'Hatalı doğrulama kodu' });
        }

        if (request.verificationExpires && new Date() > request.verificationExpires) {
            return res.status(400).json({ error: 'Doğrulama kodunun süresi dolmuş' });
        }

        // Verify and set to pending (for admin approval)
        await prisma.meetingRequest.update({
            where: { id: request.id },
            data: {
                status: 'pending',
                verificationCode: null, // Clear code
                verificationExpires: null
            }
        });

        // TODO: Send notification to Admin?

        res.json({ success: true, message: 'Randevu talebiniz başarıyla doğrulandı ve onaya gönderildi.' });
    } catch (error) {
        console.error('Verify request error:', error);
        res.status(500).json({ error: 'Doğrulama sırasında hata oluştu' });
    }
});

// Update status (protected) - REMAINING
router.put('/requests/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const request = await prisma.meetingRequest.update({
            where: { id: Number(id) },
            data: { status }
        });

        // Send notification email to user if approved/rejected
        if (status === 'approved' || status === 'rejected') {
            try {
                const { sendEmail } = require('../services/email');
                const subject = status === 'approved' ? 'Randevu Talebiniz Onaylandı' : 'Randevu Talebiniz Reddedildi';
                const body = `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h3>Sayın ${request.parentName},</h3>
                        <p>Randevu talebiniz <strong>${status === 'approved' ? 'ONAYLANDI' : 'MAALESEF REDDEDİLDİ'}</strong>.</p>
                        <p><strong>Tarih:</strong> ${request.date}</p>
                        <p><strong>Saat:</strong> ${request.time}</p>
                        <p><strong>Öğrenci:</strong> ${request.studentName}</p>
                        <br>
                        <p>İyi günler dileriz.</p>
                        <small>Patika Çocuk Yuvası</small>
                    </div>
                 `;
                if (request.email) await sendEmail(request.email, subject, body);
            } catch (e) {
                console.error('Status update email failed', e);
            }
        }

        res.json({ success: true, request });
    } catch (error) {
        console.error('Update request error:', error);
        res.status(500).json({ error: 'Talep güncellenirken bir hata oluştu' });
    }
});

// Delete request (Protected)
router.delete('/requests/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.meetingRequest.delete({ where: { id: parseInt(id as string) } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete request error:', error);
        res.status(500).json({ error: 'Randevu silinirken bir hata oluştu' });
    }
});

export default router;
