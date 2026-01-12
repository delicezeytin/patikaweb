import React, { useEffect, useState } from 'react';
import DynamicFormRenderer from '../components/DynamicFormRenderer';
import ResponsiveHero from '../components/ResponsiveHero';
import { contentService, formService } from '../services/api';

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
    introText: "Okulumuzu yakından tanımak, bahçemizi gezmek ve eğitim yaklaşımımız üzerine sohbet etmek isteyen; önümüzdeki eğitim–öğretim döneminde Patika'yı düşünen aileleri **Patika Tanışma Günleri**'ne davet ediyoruz.",
    scheduleTitle: "Şubat Ayı Boyunca",
    scheduleTime: "Hafta İçi, 16.45 – 18.00 saatleri arasında",
    descriptionText: "Tanıtım günlerimiz, her yıl **Şubat** ayında Patika Çocuk Yuvası'nda düzenlenir. Bu süreçte hem okulumuzun fiziki imkanlarını görebilir hem de eğitim kadromuzla tanışarak merak ettiğiniz soruları sorabilirsiniz.",
    formInfoTitle: "Form Bilgilendirmesi:",
    formInfoText: "Yandaki başvuru formu şu anda görüntüleme modundadır. Randevu talepleriniz için lütfen iletişim numaramızdan bize ulaşınız."
};

const MeetingDays: React.FC = () => {
    const [meetingForm, setMeetingForm] = useState<any>(null);
    const [content, setContent] = useState<MeetingDaysContent>(defaultMeetingDaysContent);
    const [submitted, setSubmitted] = useState(false);
    const [formLoadingError, setFormLoadingError] = useState(false);

    useEffect(() => {
        window.scrollTo(0, 0);

        const fetchData = async () => {
            try {
                // Load content from API
                const contentRes = await contentService.get('meetingDays');
                if (contentRes.data && contentRes.data.content) {
                    setContent(contentRes.data.content);
                }
            } catch (e) {
                console.error('Error loading meeting days content', e);
            }

            try {
                // Load form with targetPage = meetingDays from API
                const formsRes = await formService.getAll();
                const forms = formsRes.data.forms || [];
                const form = forms.find((f: any) => f.targetPage === 'meetingDays' && f.isActive !== false);
                if (form) {
                    setMeetingForm(form);
                } else {
                    setFormLoadingError(true);
                }
            } catch (e) {
                console.error('Error loading meeting days form', e);
                setFormLoadingError(true);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (data: any) => {
        if (!meetingForm) return;
        try {
            await formService.submit(meetingForm.id, data);
            setSubmitted(true);
            window.scrollTo(0, 0);
        } catch (e: any) {
            // Check if form is not accessible
            if (e.response?.status === 403) {
                alert(e.response.data.error || 'Bu form şu anda başvuru kabul etmemektedir.');
            } else {
                alert('Başvuru gönderilirken bir hata oluştu.');
            }
            console.error('Submit error', e);
        }
    };

    const renderMarkdown = (text: string) => {
        const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
    };

    const isFormAccessible = meetingForm?.accessibleForm !== false;

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

                            {!isFormAccessible && (
                                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 p-6 rounded-2xl mt-4">
                                    <p className="font-bold text-text-main dark:text-white">
                                        {content.formInfoTitle}
                                    </p>
                                    <p className="text-sm text-text-muted dark:text-gray-400 mt-2">
                                        {content.formInfoText}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 md:p-10 shadow-lg border border-border-color relative overflow-hidden">
                        {!isFormAccessible && (
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-bl-full flex items-start justify-end p-4 text-gray-400">
                                <span className="material-symbols-outlined text-2xl">lock</span>
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-2xl font-bold text-text-main dark:text-white">{meetingForm?.title || 'Başvuru Formu'}</h3>
                            <p className="text-text-muted dark:text-gray-400 text-sm mt-1">
                                {!isFormAccessible ? 'Tanışma Günleri Zamanında Aktif Olur' : 'Aşağıdaki formu doldurarak başvurunuzu oluşturabilirsiniz.'}
                            </p>
                        </div>

                        {submitted ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="size-20 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-4xl">check_circle</span>
                                </div>
                                <h2 className="text-2xl font-black text-text-main dark:text-white mb-4">Başvurunuz Alındı!</h2>
                                <p className="text-text-muted dark:text-gray-400 max-w-md">
                                    En kısa sürede sizinle iletişime geçeceğiz. İlginiz için teşekkür ederiz.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="mt-8 px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-colors"
                                >
                                    Yeni Başvuru
                                </button>
                            </div>
                        ) : meetingForm ? (
                            <DynamicFormRenderer
                                fields={meetingForm.fields || []}
                                submitButtonText="Talep Oluştur"
                                readOnly={!isFormAccessible}
                                onSubmit={isFormAccessible ? handleSubmit : undefined}
                            />
                        ) : formLoadingError ? (
                            <div className="text-center py-10 text-gray-400">
                                <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                                <p>Başvuru formu şu anda aktif değil.</p>
                            </div>
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
