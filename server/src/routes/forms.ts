import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get all forms (with optional auth for admin view)
router.get('/', optionalAuthMiddleware, async (req, res) => {
    try {
        const forms = await prisma.customForm.findMany({
            include: { submissions: req.admin ? true : false },
            orderBy: { title: 'asc' }
        });
        res.json({ forms });
    } catch (error) {
        console.error('Get forms error:', error);
        res.status(500).json({ error: 'Formlar alınırken bir hata oluştu' });
    }
});

// Get form by slug (public for form display)
router.get('/slug/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const form = await prisma.customForm.findUnique({
            where: { slug }
        });

        if (!form || !form.isActive) {
            return res.status(404).json({ error: 'Form bulunamadı veya aktif değil' });
        }

        res.json({ form });
    } catch (error) {
        console.error('Get form by slug error:', error);
        res.status(500).json({ error: 'Form alınırken bir hata oluştu' });
    }
});

// Get form by ID (protected for admin)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const form = await prisma.customForm.findUnique({
            where: { id: id as string },
            include: { submissions: { orderBy: { createdAt: 'desc' } } }
        });
        res.json({ form });
    } catch (error) {
        console.error('Get form error:', error);
        res.status(500).json({ error: 'Form alınırken bir hata oluştu' });
    }
});

// Create form (protected)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { id, title, slug, description, fields, isActive, notificationEmails, targetPage } = req.body;
        const form = await prisma.customForm.create({
            data: { id, title, slug, description, fields, isActive, notificationEmails, targetPage: targetPage || 'none' }
        });
        res.json({ success: true, form });
    } catch (error) {
        console.error('Create form error:', error);
        res.status(500).json({ error: 'Form oluşturulurken bir hata oluştu' });
    }
});

// Update form (protected)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, slug, description, fields, isActive, notificationEmails, targetPage } = req.body;
        const form = await prisma.customForm.update({
            where: { id: id as string },
            data: { title, slug, description, fields, isActive, notificationEmails, targetPage }
        });
        res.json({ success: true, form });
    } catch (error) {
        console.error('Update form error:', error);
        res.status(500).json({ error: 'Form güncellenirken bir hata oluştu' });
    }
});

// Delete form (protected)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.customForm.delete({ where: { id: id as string } });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete form error:', error);
        res.status(500).json({ error: 'Form silinirken bir hata oluştu' });
    }
});

// Submit form (public)
router.post('/:id/submit', async (req, res) => {
    try {
        const { id } = req.params;
        const { data } = req.body;

        const form = await prisma.customForm.findUnique({ where: { id } });
        if (!form || !form.isActive) {
            return res.status(404).json({ error: 'Form bulunamadı veya aktif değil' });
        }

        const submission = await prisma.formSubmission.create({
            data: { formId: id, data }
        });

        // Send notification email if configured
        // Send notification email if configured
        if (form.notificationEmails) {
            try {
                // Import the unified email service
                const { sendEmail } = require('../services/email');

                const emailList = form.notificationEmails.split(',').map(e => e.trim());
                const fieldMap: any = form.fields;
                let messageBody = `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #e65100;">Yeni Form Başvurusu: ${form.title}</h2>
                    <ul style="list-style: none; padding: 0;">`;

                for (const [key, value] of Object.entries(data as any)) {
                    const fieldDef = Array.isArray(fieldMap) ? fieldMap.find((f: any) => f.id === key || f.label === key) : null;
                    const label = fieldDef ? fieldDef.label : key;
                    messageBody += `<li style="margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                        <strong style="display:inline-block; width: 150px; color: #555;">${label}:</strong> 
                        <span>${value}</span>
                    </li>`;
                }
                messageBody += `</ul>
                <p style="margin-top:20px; font-size: 12px; color: #999;">Bu mesaj Patika Çocuk Yuvası web sitesi üzerinden gönderilmiştir.</p>
                </div>`;

                await sendEmail(emailList, `Yeni Başvuru: ${form.title}`, messageBody);

            } catch (emailError) {
                console.error('Failed to send email:', emailError);
                // Do not fail the request, just log error
            }
        }

        res.json({ success: true, submission });
    } catch (error) {
        console.error('Submit form error:', error);
        res.status(500).json({ error: 'Form gönderilirken bir hata oluştu' });
    }
});

// Get submissions for a form (protected)
router.get('/:id/submissions', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const submissions = await prisma.formSubmission.findMany({
            where: { formId: id as string },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ submissions });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({ error: 'Başvurular alınırken bir hata oluştu' });
    }
});

// Update submission status (protected)
router.put('/submissions/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const submission = await prisma.formSubmission.update({
            where: { id: parseInt(id as string) },
            data: { status }
        });
        res.json({ success: true, submission });
    } catch (error) {
        console.error('Update submission error:', error);
        res.status(500).json({ error: 'Başvuru güncellenirken bir hata oluştu' });
    }
});

export default router;
