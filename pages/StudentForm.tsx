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
const defaultStudentForm: GenericForm = {
  id: 'student', 
  name: 'Öğrenci Ön Kayıt Formu', 
  title: 'Öğrenci Ön Kayıt Formu', 
  submitButtonText: 'Ön Kayıt Oluştur',
  isActive: false, // Default is false for student form as per Admin.tsx
  fields: [
    { id: 's1', type: 'text', label: 'Öğrenci Adı Soyadı', required: true },
    { id: 's2', type: 'date', label: 'Doğum Tarihi', required: true },
    { id: 's3', type: 'radio', label: 'Cinsiyet', options: ['Kız', 'Erkek'], required: true },
    { id: 's4', type: 'text', label: 'Veli Adı Soyadı', required: true },
    { id: 's5', type: 'tel', label: 'Veli Telefon', required: true },
    { id: 's6', type: 'textarea', label: 'Adres', required: true },
  ]
};

const StudentForm: React.FC = () => {
  const [formData, setFormData] = useState<GenericForm | null>(null);

  useEffect(() => {
    const settings = localStorage.getItem('patika_form_settings');
    if (settings) {
      try {
        const parsed: GenericForm[] = JSON.parse(settings);
        const form = parsed.find((f: any) => f.id === 'student');
        if (form) {
          setFormData(form);
          return;
        }
      } catch (e) {
        console.error("Error parsing form settings", e);
      }
    }
    // Fallback
    setFormData(defaultStudentForm);
  }, []);

  return (
    <div className="max-w-[900px] w-full mx-auto px-4 sm:px-10 py-12">
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-sm">
        <div className="text-center mb-10">
          <div className="size-16 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-3xl">child_care</span>
          </div>
          <h1 className="text-3xl font-black text-text-main dark:text-white">
            {formData?.title || 'Öğrenci Ön Kayıt Formu'}
          </h1>
          <p className="text-text-muted dark:text-gray-400 mt-2">Çocuğunuzun Patika macerası burada başlıyor.</p>
        </div>

        {formData?.isActive ? (
          <DynamicFormRenderer 
            fields={formData.fields || []} 
            submitButtonText={formData.submitButtonText} 
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