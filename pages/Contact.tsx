import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DynamicFormRenderer, { FormField } from '../components/DynamicFormRenderer';
import { contentService, formService } from '../services/api';

interface GenericForm {
  id: string;
  name: string;
  title: string;
  submitButtonText: string;
  isActive: boolean;
  fields: FormField[];
}

interface ContactContent {
  pageTitle: string;
  pageSubtitle: string;
  address: string;
  phone: string;
  phoneHours: string;
  email: string;
  mapLink: string;
  quickLinksTitle: string;
}

const defaultContactContent: ContactContent = {
  pageTitle: "Bize Ulaşın",
  pageSubtitle: "",
  address: "Müskebi Mahallesi, Hıral Sokak No: 6/A Ortakent – Bodrum / Muğla",
  phone: "+90 (552) 804 41 40",
  phoneHours: "Hafta içi 09:00 - 17:00",
  email: "patikayuva@gmail.com",
  mapLink: "https://maps.app.goo.gl/4XhSdNG5ckydkFU67",
  quickLinksTitle: "Hızlı Başvuru Bağlantıları"
};

// Default data fallback (Matches Admin.tsx)
const defaultFormsData: GenericForm[] = [
  {
    id: 'contact',
    name: 'İletişim Formu',
    title: 'Bize Yazın',
    submitButtonText: 'Mesajı Gönder',
    isActive: true,
    fields: [
      { id: 'c1', type: 'text', label: 'Ad Soyad', placeholder: 'Adınız ve Soyadınız', required: true },
      { id: 'c2', type: 'email', label: 'E-posta', placeholder: 'ornek@email.com', required: true },
      { id: 'c3', type: 'tel', label: 'Telefon', placeholder: '05XX XXX XX XX', required: true },
      { id: 'c4', type: 'select', label: 'Konu', options: ['Bilgi Almak İstiyorum', 'Randevu Talebi', 'Öneri/Şikayet'], required: true },
      { id: 'c5', type: 'textarea', label: 'Mesajınız', placeholder: 'Mesajınızı buraya yazınız...', required: true },
    ]
  },
  {
    id: 'personnel',
    name: 'Personel Başvuru Formu',
    title: 'Personel Başvuru Formu',
    submitButtonText: 'Başvuruyu Tamamla',
    isActive: true,
    fields: []
  },
  {
    id: 'school_register',
    name: 'Öğrenci Ön Kayıt Formu',
    title: 'Öğrenci Ön Kayıt Formu',
    submitButtonText: 'Ön Kayıt Oluştur',
    isActive: false,
    fields: []
  },
];

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<GenericForm | null>(null);
  const [activeOtherForms, setActiveOtherForms] = useState<{ id: string, title: string, path: string }[]>([]);
  const [content, setContent] = useState<ContactContent>(defaultContactContent);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contentRes, formsRes] = await Promise.all([
          contentService.get('contact'),
          formService.getAll()
        ]);

        if (contentRes.data && contentRes.data.content) {
          setContent(contentRes.data.content);
        }

        const forms: GenericForm[] = formsRes.data.forms || defaultFormsData;

        // Load Contact Form (Priority: targetPage > slug > id)
        // Check for 'any' type cast to access 'targetPage' which might be missing in older interface used here
        const contactForm = forms.find((f: any) => f.targetPage === 'contact' || f.isActive && (f.slug === 'iletisim-formu' || f.id === 'contact'));

        if (contactForm) {
          setFormData(contactForm);
        }

        // Find other active forms for Quick Links
        // Filter out the current displayed form
        const currentFormId = contactForm ? contactForm.id : 'contact';
        const links = forms
          .filter((f: any) => f.id !== currentFormId && f.slug !== 'iletisim-formu' && f.isActive !== false && f.targetPage !== 'none' && f.targetPage !== 'link') // Exclude current, inactive, and link-only forms
          .map((f: any) => {
            // Determine path based on targetPage
            let path = `/form/${f.slug}`; // Default dynamic path
            if (f.targetPage === 'personnel' || f.id === 'personnel') path = '/apply-personnel';
            if (f.targetPage === 'student' || f.id === 'school_register') path = '/apply-student';

            return {
              id: f.id,
              title: f.title,
              path: path
            };
          });

        setActiveOtherForms(links);

      } catch (error) {
        console.error('Error fetching contact data:', error);
      }
    };
    fetchData();
  }, []);

  const handleContactSubmit = async (data: any) => {
    if (!formData) return;

    try {
      await formService.submit(formData.id, data);
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Form submission error:', error);
      alert('Mesaj gönderilirken hata oluştu.');
    }
  };

  return (
    <div className="max-w-[1200px] w-full flex flex-col">
      <section className="px-4 sm:px-10 pt-12 pb-8">
        <div className="max-w-[960px] mx-auto">
          <div className="flex flex-col gap-4 text-center md:text-left">
            <h1 className="text-text-main dark:text-white text-4xl md:text-5xl font-black tracking-tighter">{content.pageTitle}</h1>
            <p className="text-text-muted dark:text-gray-400 text-lg font-normal max-w-2xl">
              {content.pageSubtitle}
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Quick Links for Other Active Forms - MOVED TO TOP */}
            {activeOtherForms.length > 0 && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-white/5 dark:to-white/10 rounded-xl p-6 border border-border-color">
                <h3 className="font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">link</span>
                  {content.quickLinksTitle}
                </h3>
                <div className="flex flex-col gap-3">
                  {activeOtherForms.map(link => (
                    <Link
                      key={link.id}
                      to={link.path}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary group transition-all"
                    >
                      <span className="text-sm font-medium text-text-main dark:text-gray-200 group-hover:text-primary">{link.title}</span>
                      <span className="material-symbols-outlined text-gray-400 group-hover:text-primary text-sm">arrow_forward_ios</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Map - MOVED TO MIDDLE (or standard place) */}
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-border-color shadow-sm group">
              <img
                alt="Map showing location of Patika preschool in Istanbul"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCvaE7mYV1R_zLr4h0qaLMZTi60jiTKoO0A2HhNbHuZrM4d6j-8Pztame7DURT50eg58ghxsUtNstaPRoD2Ggc5gqyKpHK7Sgj_w-QzHu6h_09EvcOZvhBoOuaoc3jD8QetQ2GlEtqSaxEXVzO734kfZTnPy9szSvcuEAFAe0MnBzVAB-cKP_OBheN5M23xbqE93_ZXv00YywH1UXB5M-Z-XDNwBvPjMfJeB0Kdf2iVlmPLw_wb8Zy2_FNBlWEaZOU7F58Mmgy9Iw"
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 p-2 rounded-full shadow-lg">
                  <span className="material-symbols-outlined text-secondary text-4xl drop-shadow-md">location_on</span>
                </div>
              </div>
              <a
                className="absolute bottom-4 right-4 bg-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-gray-50 text-text-main flex items-center gap-1"
                href={content.mapLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                Haritada Göster
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </a>
            </div>

            {/* Contact Info - MOVED TO BOTTOM */}
            <div className="flex flex-col gap-4">
              <div className="flex gap-4 p-4 rounded-xl border border-border-color bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">location_on</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-main dark:text-white mb-1">Adres</h3>
                  <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed">
                    {content.address.split(',').map((part, idx) => (
                      <span key={idx}>{part.trim()}{idx < content.address.split(',').length - 1 && <br />}</span>
                    ))}
                  </p>
                  <a
                    href={content.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary mt-3 hover:underline bg-primary/5 px-2 py-1 rounded-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">directions</span>
                    Yol Tarifi Al
                  </a>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl border border-border-color bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">call</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-main dark:text-white mb-1">Telefon</h3>
                  <a className="text-text-muted dark:text-gray-400 text-sm hover:text-primary transition-colors" href={`tel:${content.phone.replace(/[^+\d]/g, '')}`}>{content.phone}</a>
                  <p className="text-xs text-text-muted dark:text-gray-500 mt-1">{content.phoneHours}</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-xl border border-border-color bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined">mail</span>
                </div>
                <div>
                  <h3 className="font-bold text-text-main dark:text-white mb-1">E-posta</h3>
                  <a className="text-text-muted dark:text-gray-400 text-sm hover:text-primary transition-colors" href={`mailto:${content.email}`}>{content.email}</a>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-border-color p-6 md:p-8 shadow-sm">
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-20 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                  </div>
                  <h2 className="text-2xl font-black text-text-main dark:text-white mb-4">Mesajınız Alındı!</h2>
                  <p className="text-text-muted dark:text-gray-400 max-w-md">
                    En kısa sürede sizinle iletişime geçeceğiz. İlginiz için teşekkür ederiz.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-8 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-colors"
                  >
                    Yeni Mesaj Gönder
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-text-main dark:text-white mb-6">
                    {formData?.title || 'Bize Yazın'}
                  </h2>

                  {formData && formData.isActive !== false ? (
                    <DynamicFormRenderer
                      fields={formData.fields || []}
                      submitButtonText="Mesajı Gönder"
                      onSubmit={handleContactSubmit}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-4">
                        <span className="material-symbols-outlined text-3xl">unpublished</span>
                      </div>
                      <h3 className="text-lg font-bold text-text-main dark:text-white">Form Geçici Olarak Kapalı</h3>
                      <p className="text-text-muted dark:text-gray-400 text-sm max-w-xs mt-2">
                        İletişim formumuz şu anda bakım aşamasındadır veya başvuru kabul etmemektedir. Lütfen telefon ile ulaşınız.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;