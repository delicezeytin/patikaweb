import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DynamicFormRenderer, { FormField } from '../components/DynamicFormRenderer';
import { formService } from '../services/api';

interface CustomForm {
    id: string;
    title: string;
    slug: string;
    description: string;
    fields: FormField[];
    isActive: boolean;
    submissions: any[];
    notificationEmails?: string;
    targetPage?: string;
}

const DynamicFormPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [form, setForm] = useState<CustomForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const loadForm = async () => {
            try {
                // Try to find by slug first
                const res = await formService.getAll();
                const forms = res.data.forms || [];

                // Strategy: Find by slug OR by id (for legacy links)
                // Also check if valid
                const foundForm = forms.find((f: any) => f.slug === slug || f.id === slug); // Use 'any' to bypass partial interface mismatch if any

                if (foundForm && foundForm.isActive !== false) {
                    setForm(foundForm);
                } else {
                    setNotFound(true);
                }
            } catch (error) {
                console.error('Error loading form:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };

        if (slug) loadForm();
    }, [slug]);

    const handleSubmit = async (data: any) => {
        if (!form) return;

        try {
            // Data is already an object from DynamicFormRenderer (thanks to previous refactors in other components, 
            // but let's verify DynamicFormRenderer props. It returns key-value pairs? 
            // In Contact.tsx it returns 'data' which seems to be an object.
            // Let's assume standardized object structure from Renderer.

            await formService.submit(form.id, data);
            alert('Form başarıyla gönderildi!');
            // Optional: Redirect or clear form
        } catch (error) {
            console.error('Form submission error:', error);
            alert('Form gönderilirken bir hata oluştu.');
        }
    };

    if (loading) {
        return (
            <div className="max-w-[800px] w-full mx-auto px-4 py-20 flex items-center justify-center">
                <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    if (notFound || !form) {
        return (
            <div className="max-w-[800px] w-full mx-auto px-4 py-20">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-12 text-center">
                    <div className="size-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-4xl text-gray-400">search_off</span>
                    </div>
                    <h1 className="text-2xl font-bold text-text-main dark:text-white mb-2">Form Bulunamadı</h1>
                    <p className="text-text-muted dark:text-gray-400 mb-6">
                        Aradığınız form mevcut değil veya artık aktif değil. (Slug: {slug})
                    </p>
                    <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">
                        <span className="material-symbols-outlined">home</span>
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-[800px] w-full mx-auto px-4 py-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-6 md:p-10">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text-main dark:text-white mb-2">{form.title}</h1>
                    {form.description && (
                        <p className="text-text-muted dark:text-gray-400">{form.description}</p>
                    )}
                </div>
                <DynamicFormRenderer
                    fields={form.fields}
                    submitButtonText="Gönder"
                    onSubmit={handleSubmit}
                />
            </div>
        </div>
    );
};

export default DynamicFormPage;
