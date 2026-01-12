import React, { useEffect, useState } from 'react';
import DynamicFormRenderer, { FormField } from '../components/DynamicFormRenderer';
import { formService } from '../services/api';

interface CustomForm {
  id: string;
  title: string;
  slug?: string;
  description?: string;
  fields: FormField[];
  isActive: boolean;
  submissions?: any[];
  notificationEmails?: string;
}

const StudentForm: React.FC = () => {
  const [formData, setFormData] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await formService.getAll();
        const forms = res.data.forms || [];
        // Priority: targetPage="student" > id="school_register"
        const form = forms.find((f: any) => f.targetPage === 'student' || f.id === 'school_register');

        if (form) {
          setFormData(form);
        }
      } catch (e) {
        console.error("Error fetching form", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (data: any) => {
    if (!formData) return;

    try {
      await formService.submit(formData.id, data);
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (e) {
      console.error('Submit error:', e);
      alert('Başvuru gönderilirken bir hata oluştu. Lütfen tekrar deneyiniz.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-[900px] w-full mx-auto px-4 sm:px-10 py-20 flex items-center justify-center">
        <div className="animate-spin size-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-[900px] w-full mx-auto px-4 sm:px-10 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-12 shadow-sm text-center">
          <div className="size-20 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-4xl">check_circle</span>
          </div>
          <h2 className="text-3xl font-black text-text-main dark:text-white mb-4">Ön Kaydınız Alındı!</h2>
          <p className="text-lg text-text-muted dark:text-gray-400 max-w-lg mx-auto">
            Öğrenci ön kayıt formunuz başarıyla bize ulaştı. Kayıt süreciyle ilgili sizinle iletişime geçeceğiz.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-8 px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-colors"
          >
            Anasayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[900px] w-full mx-auto px-4 sm:px-10 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm">
        <div className="text-center mb-10">
          <div className="size-16 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">child_care</span>
          </div>
          <h1 className="text-3xl font-black text-text-main dark:text-white">
            {formData?.title || 'Okul Kayıt Formu'}
          </h1>
          <p className="text-text-muted dark:text-gray-400 mt-2">
            {formData?.description || 'Çocuğunuzun Patika macerası burada başlıyor.'}
          </p>
        </div>

        {formData && formData.isActive !== false ? (
          <DynamicFormRenderer
            fields={formData.fields || []}
            submitButtonText="Ön Kayıt Oluştur"
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">school_disabled</span>
            <h3 className="text-xl font-bold text-text-main dark:text-white">Ön Kayıtlar Kapalı</h3>
            <p className="text-text-muted dark:text-gray-400 max-w-md mt-2">
              Yeni dönem kayıtlarımız henüz başlamamıştır veya kontenjanlarımız dolmuştur. Lütfen daha sonra tekrar deneyiniz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentForm;