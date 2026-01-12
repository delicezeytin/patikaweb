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

const PersonnelForm: React.FC = () => {
  const [formData, setFormData] = useState<CustomForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await formService.getAll();
        const forms = res.data.forms || [];
        // Priority: targetPage="personnel" > id="personnel"
        // Also cast to 'any' to avoid TS error if targetPage isn't in local interface yet
        const form = forms.find((f: any) => f.targetPage === 'personnel' || f.id === 'personnel');

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

  const handleSubmit = (data: any) => {
    if (!formData) return;

    const timestamp = Date.now();
    const dateStr = new Date().toISOString().split('T')[0];

    // Save submission to patika_custom_forms
    const savedForms = localStorage.getItem('patika_custom_forms');
    if (savedForms) {
      const forms: CustomForm[] = JSON.parse(savedForms);
      const updatedForms = forms.map(f => {
        if (f.id === 'personnel') {
          return {
            ...f,
            submissions: [
              ...(f.submissions || []),
              {
                id: timestamp,
                date: dateStr,
                data: data // Data already contains both field.id and field.label keys from DynamicFormRenderer
              }
            ]
          };
        }
        return f;
      });
      localStorage.setItem('patika_custom_forms', JSON.stringify(updatedForms));
    }

    // Also save to global applications for Panel Özeti view
    const existingAppsStr = localStorage.getItem('patika_applications');
    const existingApps = existingAppsStr ? JSON.parse(existingAppsStr) : [];
    const newApp = {
      id: timestamp,
      type: 'staff',
      name: data['Ad Soyad'] || data['p1'] || 'Bilinmiyor',
      email: data['E-posta'] || data['email'] || '',
      phone: data['Telefon'] || data['p3'] || '',
      message: `${data['Başvurulan Pozisyon'] || data['p4'] || 'Pozisyon belirtilmedi'} pozisyonu için başvuru`,
      date: dateStr,
      status: 'new'
    };
    localStorage.setItem('patika_applications', JSON.stringify([newApp, ...existingApps]));

    setSubmitted(true);
    window.scrollTo(0, 0);
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
          <h2 className="text-3xl font-black text-text-main dark:text-white mb-4">Başvurunuz Alındı!</h2>
          <p className="text-lg text-text-muted dark:text-gray-400 max-w-lg mx-auto">
            Personel başvuru formunuz başarıyla bize ulaştı. İnsan kaynakları departmanımız başvurunuzu inceledikten sonra sizinle iletişime geçecektir.
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
          <div className="size-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">work</span>
          </div>
          <h1 className="text-3xl font-black text-text-main dark:text-white">
            {formData?.title || 'Personel Başvuru Formu'}
          </h1>
          <p className="text-text-muted dark:text-gray-400 mt-2">
            {formData?.description || 'Patika ailesine katılmak için ilk adımı atın.'}
          </p>
        </div>

        {formData && formData.isActive !== false ? (
          <DynamicFormRenderer
            fields={formData.fields || []}
            submitButtonText="Başvuruyu Tamamla"
            onSubmit={handleSubmit}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-4">block</span>
            <h3 className="text-xl font-bold text-text-main dark:text-white">Başvurular Kapalı</h3>
            <p className="text-text-muted dark:text-gray-400 max-w-md mt-2">
              Şu anda açık bir pozisyonumuz bulunmamaktadır veya başvuru dönemi sona ermiştir. İlginiz için teşekkür ederiz.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersonnelForm;