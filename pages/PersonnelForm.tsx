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
    { id: 'email', type: 'email', label: 'E-posta', required: true },
    { id: 'p2', type: 'date', label: 'Doğum Tarihi', required: true },
    { id: 'p3', type: 'tel', label: 'Telefon', required: true },
    { id: 'p4', type: 'select', label: 'Başvurulan Pozisyon', options: ['Sınıf Öğretmeni', 'Yardımcı Öğretmen', 'Branş Öğretmeni', 'İdari Personel'], required: true },
    { id: 'p5', type: 'textarea', label: 'Ön Yazı / Deneyimler', required: true },
    { id: 'p6', type: 'file', label: 'CV Yükle', placeholder: 'PDF formatında CV yükleyiniz', required: true }, // Note: File upload implementation requires backend in production
  ]
};

const PersonnelForm: React.FC = () => {
  const [formData, setFormData] = useState<GenericForm | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const settings = localStorage.getItem('patika_custom_forms');
    if (settings) {
      try {
        const parsed: GenericForm[] = JSON.parse(settings);
        const form = parsed.find((f: any) => f.id === 'personnel');
        if (form) {
          // Ensure email field exists if loaded from older config
          if (!form.fields.find(f => f.type === 'email')) {
            form.fields.splice(1, 0, { id: 'email', type: 'email', label: 'E-posta', required: true });
          }
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

  const handlePersonnelSubmit = (data: any) => {
    const timestamp = Date.now();
    const dateStr = new Date().toISOString().split('T')[0];

    // 1. Get existing applications (Global List)
    const existingAppsStr = localStorage.getItem('patika_applications');
    const existingApps = existingAppsStr ? JSON.parse(existingAppsStr) : [];

    // 2. Create new application object
    const newApp = {
      id: timestamp,
      type: 'staff',
      name: data.p1,
      email: data.email,
      phone: data.p3,
      message: `${data.p4} pozisyonu için başvuru. ${data.p5}`,
      date: dateStr,
      status: 'new'
    };

    // 3. Save to Global Applications (patika_applications)
    localStorage.setItem('patika_applications', JSON.stringify([newApp, ...existingApps]));

    // 4. Save to Custom Forms Submissions (patika_custom_forms) for Admin > Forms view
    const existingFormsStr = localStorage.getItem('patika_custom_forms');
    if (existingFormsStr) {
      try {
        const forms = JSON.parse(existingFormsStr);
        const personnelFormIndex = forms.findIndex((f: any) => f.id === 'personnel');

        if (personnelFormIndex !== -1) {
          const submission = {
            id: timestamp,
            date: dateStr,
            data: {
              'Ad Soyad': data.p1,
              'E-posta': data.email,
              'Telefon': data.p3,
              'Pozisyon': data.p4,
              'Ön Yazı': data.p5
            }
          };

          if (!forms[personnelFormIndex].submissions) {
            forms[personnelFormIndex].submissions = [];
          }
          forms[personnelFormIndex].submissions.push(submission);
          localStorage.setItem('patika_custom_forms', JSON.stringify(forms));
        }
      } catch (e) {
        console.error("Error updating custom forms submissions", e);
      }
    }

    // 5. Show success state
    setSubmitted(true);
    window.scrollTo(0, 0);
  };

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
          <p className="text-text-muted dark:text-gray-400 mt-2">Patika ailesine katılmak için ilk adımı atın.</p>
        </div>

        {formData?.isActive ? (
          <DynamicFormRenderer
            fields={formData.fields || []}
            submitButtonText={formData.submitButtonText}
            onSubmit={handlePersonnelSubmit}
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