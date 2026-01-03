import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DynamicFormRenderer, { FormField } from '../components/DynamicFormRenderer';

interface CustomForm {
    id: string;
    title: string;
    slug: string;
    description: string;
    fields: FormField[];
    isActive: boolean;
    submissions: any[];
}

const DynamicFormPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const [form, setForm] = useState<CustomForm | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('patika_custom_forms');
        if (saved) {
            try {
                const forms: CustomForm[] = JSON.parse(saved);
                const foundForm = forms.find(f => f.slug === slug || f.id === slug);
                if (foundForm && foundForm.isActive) {
                    setForm(foundForm);
                } else {
                    setNotFound(true);
                }
            } catch (e) {
                console.error('Error loading form', e);
                setNotFound(true);
            }
        } else {
            setNotFound(true);
        }
        setLoading(false);
    }, [slug]);

    const handleSubmit = (data: FormData) => {
        if (!form) return;

        // Convert FormData to object
        const submissionData: { [key: string]: any } = {};
        data.forEach((value, key) => {
            submissionData[key] = value;
        });

        // Save submission
        const saved = localStorage.getItem('patika_custom_forms');
        if (saved) {
            const forms: CustomForm[] = JSON.parse(saved);
            const updatedForms = forms.map(f => {
                if (f.id === form.id) {
                    return {
                        ...f,
                        submissions: [
                            ...(f.submissions || []),
                            {
                                id: Date.now(),
                                date: new Date().toISOString(),
                                data: submissionData
                            }
                        ]
                    };
                }
                return f;
            });
            localStorage.setItem('patika_custom_forms', JSON.stringify(updatedForms));
        }

        alert('Form başarıyla gönderildi!');
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
                        Aradığınız form mevcut değil veya artık aktif değil.
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
