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
        if (form.notificationEmails) {
            try {
                // Fetch settings for SMTP config
                const settings = await prisma.systemSettings.findFirst();

                if (settings && settings.smtpHost && settings.smtpUser && settings.smtpPass) {
                    const nodemailer = require('nodemailer');

                    const transporter = nodemailer.createTransport({
                        host: settings.smtpHost,
                        port: parseInt(settings.smtpPort || '587'),
                        secure: false, // true for 465, false for other ports
                        auth: {
                            user: settings.smtpUser,
                            pass: settings.smtpPass,
                        },
                    });

                    const emailList = form.notificationEmails.split(',').map(e => e.trim());
                    const fieldMap: any = form.fields;
                    let messageBody = `<h3>Yeni Form Başvurusu: ${form.title}</h3><ul>`;

                    for (const [key, value] of Object.entries(data as any)) {
                        const fieldDef = Array.isArray(fieldMap) ? fieldMap.find((f: any) => f.id === key || f.label === key) : null;
                        const label = fieldDef ? fieldDef.label : key;
                        messageBody += `<li><strong>${label}:</strong> ${value}</li>`;
                    }
                    messageBody += `</ul>`;

                    await transporter.sendMail({
                        from: `"Patika Yuva" <${settings.smtpUser}>`,
                        to: emailList,
                        subject: `Yeni Başvuru: ${form.title}`,
                        html: messageBody,
                    });
                    console.log(`Email sent to ${emailList.join(', ')}`);
                } else {
                    console.log('SMTP settings missing, skipping email.');
                }
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
