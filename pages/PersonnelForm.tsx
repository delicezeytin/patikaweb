import React, { useEffect, useState } from 'react';
import DynamicFormRenderer, { FormField } from '../components/DynamicFormRenderer';

interface GenericForm {
  id: string;
  name: string;
  title: string;
  submitButtonText: string;
  isActive: boolean;
  fields: FormField[];
}

// Default fallback data (Matches Admin.tsx)
const defaultPersonnelForm: GenericForm = {
  id: 'personnel',
  name: 'Personel Başvuru Formu',
  title: 'Personel Başvuru Formu',
  submitButtonText: 'Başvuruyu Tamamla',
  isActive: true,
  fields: [
    { id: 'p1', type: 'text', label: 'Ad Soyad', required: true },
    { id: 'p2', type: 'date', label: 'Doğum Tarihi', required: true },
    { id: 'p3', type: 'tel', label: 'Telefon', required: true },
    { id: 'p4', type: 'select', label: 'Başvurulan Pozisyon', options: ['Sınıf Öğretmeni', 'Yardımcı Öğretmen', 'Branş Öğretmeni', 'İdari Personel'], required: true },
    { id: 'p5', type: 'textarea', label: 'Ön Yazı / Deneyimler', required: true },
    { id: 'p6', type: 'file', label: 'CV Yükle', placeholder: 'PDF formatında CV yükleyiniz', required: true },
  ]
};

const PersonnelForm: React.FC = () => {
  const [formData, setFormData] = useState<GenericForm | null>(null);

  useEffect(() => {
    const settings = localStorage.getItem('patika_custom_forms');
    if (settings) {
      try {
        const parsed: GenericForm[] = JSON.parse(settings);
        const form = parsed.find((f: any) => f.id === 'personnel');
        if (form) {
          setFormData(form);
          return;
        }
      } catch (e) {
        console.error("Error parsing form settings", e);
      }
    }
    // Fallback if local storage is empty or specific form not found
    setFormData(defaultPersonnelForm);
  }, []);

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
          <p className="text-text-muted dark:text-gray-400 mt-2">Patika ailesine katılmak için ilk adımı atın.</p>
        </div>

        {formData?.isActive ? (
          <DynamicFormRenderer
            fields={formData.fields || []}
            submitButtonText={formData.submitButtonText}
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