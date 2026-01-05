import React, { useEffect, useState } from 'react';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import ResponsiveHero from '../components/ResponsiveHero';

interface MeetingDaysContent {
    heroTitle: string;
    heroImage: string;
    sectionTitle: string;
    introText: string;
    scheduleTitle: string;
    scheduleTime: string;
    descriptionText: string;
    formInfoTitle: string;
    formInfoText: string;
}

const defaultMeetingDaysContent: MeetingDaysContent = {
    heroTitle: "Tanışma Günleri",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKkBtmpwhIX5KPxEgKI9zWs4svarIXcB1OZmLOigX0jzCFwcO2zjv_pYzq0bkdHKpWowLwr7ahocm6bA42dTHgnb6j_UBwIlw-kpe2fIhKOlbp8SOWv9NgGWm2uys4pnyqiuP3zZ9NfQDiyw72zo4LZJSbSbrrGo86d5SjWWfbVqiydSWq_Bzyx5NzHhYKd1cXcQ_TWVQ64WochSWtVJV4kVa4ADz1_amSMQIWsalNn6fRHRBzZ1rVpn9eIgNw_G6HRkLLyYa_Hg",
    sectionTitle: "Patika Tanışma Günleri",
    introText: "Okulumuzu yakından tanımak, bahçemizi gezmek ve eğitim yaklaşımımız üzerine sohbet etmek isteyen; önümüzdeki eğitim–öğretim döneminde Patika’yı düşünen aileleri **Patika Tanışma Günleri**’ne davet ediyoruz.",
    scheduleTitle: "Şubat Ayı Boyunca",
    scheduleTime: "Hafta İçi, 16.45 – 18.00 saatleri arasında",
    descriptionText: "Tanıtım günlerimiz, her yıl **Şubat** ayında Patika Çocuk Yuvası’nda düzenlenir. Bu süreçte hem okulumuzun fiziki imkanlarını görebilir hem de eğitim kadromuzla tanışarak merak ettiğiniz soruları sorabilirsiniz.",
    formInfoTitle: "Form Bilgilendirmesi:",
    formInfoText: "Yandaki başvuru formu şu anda görüntüleme modundadır. Randevu talepleriniz için lütfen iletişim numaramızdan bize ulaşınız."
};

const MeetingDays: React.FC = () => {
    // Default form structure fallback
    const defaultMeetingForm = {
        id: 'meeting_request',
        title: 'Tanışma Günü Başvuru Formu',
        isActive: true,
        fields: [
            { id: 'parentName', type: 'text', label: 'Veli Adı Soyadı', required: true, placeholder: 'Adınız ve Soyadınız' },
            { id: 'phone', type: 'tel', label: 'Telefon Numarası', required: true, placeholder: '05XX XXX XX XX' },
            { id: 'childName', type: 'text', label: 'Çocuk Adı Soyadı', required: true, placeholder: 'Çocuğunuzun Adı' },
            { id: 'childBirthDate', type: 'date', label: 'Doğum Tarihi', required: true, placeholder: '' },
            { id: 'meetingDate', type: 'date', label: 'Talep Edilen Tarih', required: true, placeholder: '' },
            { id: 'notes', type: 'textarea', label: 'Notlarınız', required: false, placeholder: 'Eklemek istedikleriniz...' }
        ]
    };

    const [meetingForm, setMeetingForm] = useState<any>(null);
    const [content, setContent] = useState<MeetingDaysContent>(defaultMeetingDaysContent);

    useEffect(() => {
        window.scrollTo(0, 0);

        // Load Content
        const savedContent = localStorage.getItem('patika_meeting_days_content');
        if (savedContent) {
            setContent(JSON.parse(savedContent));
        }

        // Load Form
        const savedForms = localStorage.getItem('patika_custom_forms');
        let formToUse = null;

        if (savedForms) {
            try {
                const forms = JSON.parse(savedForms);
                const found = forms.find((f: any) => f.id === 'meeting_request');
                if (found && found.isActive !== false) {
                    formToUse = found;
                }
            } catch (e) {
                console.error("Error parsing form settings", e);
            }
        }

        if (!formToUse) {
            formToUse = defaultMeetingForm;
        }

        setMeetingForm(formToUse);
    }, []);

    const renderMarkdown = (text: string) => {
        const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="max-w-[1200px] w-full flex flex-col mx-auto">
            <ResponsiveHero
                mobileImage={content.heroImage}
                title={content.heroTitle}
                subtitle=""
            />

            <div className="w-full px-4 sm:px-10 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">

                    {/* Left Column: Meeting Days Info */}
                    <div className="flex flex-col gap-8">
                        <div>
                            <span className="inline-block p-3 rounded-full bg-primary/10 text-primary mb-4">
                                <span className="material-symbols-outlined text-3xl">calendar_month</span>
                            </span>
                            <h2 className="text-3xl font-black text-text-main dark:text-white mb-6 md:text-4xl">{content.sectionTitle}</h2>
                        </div>

                        <div className="space-y-6 text-lg text-text-muted dark:text-gray-300 leading-relaxed">
                            <p>
                                {renderMarkdown(content.introText)}
                            </p>

                            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 p-6 rounded-2xl flex items-center gap-4">
                                <span className="material-symbols-outlined text-orange-500 text-3xl">event</span>
                                <div>
                                    <p className="font-bold text-text-main dark:text-white">{content.scheduleTitle}</p>
                                    <p className="text-sm text-text-muted dark:text-gray-400">{content.scheduleTime}</p>
                                </div>
                            </div>

                            <p>
                                {renderMarkdown(content.descriptionText)}
                            </p>

                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-6 rounded-2xl mt-4">
                                <p className="font-bold text-text-main dark:text-white">
                                    {content.formInfoTitle}
                                </p>
                                <p className="text-sm text-text-muted dark:text-gray-400 mt-2">
                                    {content.formInfoText}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Read-Only Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-10 shadow-lg border border-border-color relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-bl-full flex items-start justify-end p-4 text-gray-400">
                            <span className="material-symbols-outlined text-2xl">lock</span>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-text-main dark:text-white">Başvuru Formu</h3>
                            <p className="text-text-muted dark:text-gray-400 text-sm mt-1">Tanışma Günleri Zamanında Aktif Olur</p>
                        </div>

                        {meetingForm ? (
                            <DynamicFormRenderer
                                fields={meetingForm.fields || []}
                                submitButtonText="Talep Oluştur"
                                readOnly={true}
                            />
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full border-gray-200 border-t-primary mb-4"></div>
                                <p>Form yükleniyor...</p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

export default MeetingDays;
