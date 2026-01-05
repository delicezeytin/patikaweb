import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ResponsiveHero from '../components/ResponsiveHero';

interface SchoolDocument {
  id: string;
  name: string;
  url: string;
  icon: string;
  color: string;
  bg: string;
}

interface HomeContent {
  heroTitle: string;
  heroImage: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  valuesTitle: string;
  values: { title: string; text: string; icon: string }[];
  talesTitle: string;
  talesText: string;
  talesHighlight: string;
  realityTitle: string;
  realityText: string;
  realityHighlight: string;
  formsTitle: string;
}

const defaultHomeContent: HomeContent = {
  heroTitle: "Patika'da Yürümek",
  heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKkBtmpwhIX5KPxEgKI9zWs4svarIXcB1OZmLOigX0jzCFwcO2zjv_pYzq0bkdHKpWowLwr7ahocm6bA42dTHgnb6j_UBwIlw-kpe2fIhKOlbp8SOWv9NgGWm2uys4pnyqiuP3zZ9NfQDiyw72zo4LZJSbSbrrGo86d5SjWWfbVqiydSWq_Bzyx5NzHhYKd1cXcQ_TWVQ64WochSWtVJV4kVa4ADz1_amSMQIWsalNn6fRHRBzZ1rVpn9eIgNw_G6HRkLLyYa_Hg",
  primaryButtonText: "Patika'ya Dair",
  primaryButtonLink: "/about",
  secondaryButtonText: "Masallar ve Gerçekler",
  secondaryButtonLink: "/masallar-ve-gercekler",
  valuesTitle: "Neden Masallar ve Gerçekler Dünyası?",
  values: [],
  talesTitle: "Masallar",
  talesText: "Hikâyeler, oyunlar ve semboller aracılığıyla çocukların hayal gücüne alan açılır.",
  talesHighlight: "Masallar, doğruyu öğretmek için değil; düşünmeye davet etmek için vardır.",
  realityTitle: "Gerçekler",
  realityText: "Günlük yaşam, ilişkiler ve sorumluluklar çocuğun anlayabileceği bir dille deneyimlenir.",
  realityHighlight: "Gerçekler, korkutmak için değil; güven duygusu oluşturmak için vardır.",
  formsTitle: "Formlar"
};

const Home: React.FC = () => {
  const [documents, setDocuments] = useState<SchoolDocument[]>([
    { id: 'reg', name: "Öğrenci Kayıt Formu", url: "#", icon: "description", color: "text-secondary", bg: "bg-red-50 dark:bg-red-900/20" },
    { id: 'health', name: "Sağlık Bilgi Formu", url: "#", icon: "medical_services", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { id: 'trip', name: "Gezi İzin Belgesi", url: "#", icon: "directions_bus", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" }
  ]);

  const [content, setContent] = useState<HomeContent>(defaultHomeContent);

  useEffect(() => {
    const savedDocs = localStorage.getItem('patika_documents');
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }

    // Using v3 key to force update content for user
    const savedContent = localStorage.getItem('patika_home_content_v3');
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    } else {
      // Clear old content to avoid confusion
      localStorage.removeItem('patika_home_content_v2');
    }
  }, []);

  return (
    <div className="max-w-[1200px] w-full flex flex-col">
      <ResponsiveHero
        mobileImage={content.heroImage}
        title={content.heroTitle}
        subtitle=""
        badge=""
        primaryButtonText={content.primaryButtonText}
        primaryButtonLink={content.primaryButtonLink}
        secondaryButtonText={content.secondaryButtonText}
        secondaryButtonLink={content.secondaryButtonLink}
      />

      <section className="px-4 sm:px-10 py-12">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <h1 className="text-text-main dark:text-white text-3xl sm:text-4xl font-bold leading-tight">
              {content.valuesTitle}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Masallar Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col gap-6 relative z-10">
                <div className="size-16 rounded-2xl bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-purple-600 dark:text-purple-300">
                  <span className="material-symbols-outlined text-4xl">auto_stories</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-4 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{content.talesTitle}</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                      {content.talesText}
                    </p>
                    <div className="flex items-center gap-3 text-purple-700 dark:text-purple-300 font-medium bg-white/50 dark:bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                      <span className="material-symbols-outlined">lightbulb</span>
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: content.talesHighlight.replace(/\n/g, '<br />') }}></p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 size-64 bg-purple-200/50 dark:bg-purple-900/30 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            </div>

            {/* Gerçekler Card */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex flex-col gap-6 relative z-10">
                <div className="size-16 rounded-2xl bg-white dark:bg-white/10 shadow-sm flex items-center justify-center text-orange-600 dark:text-orange-300">
                  <span className="material-symbols-outlined text-4xl">nature_people</span>
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-4 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">{content.realityTitle}</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                      {content.realityText}
                    </p>
                    <div className="flex items-center gap-3 text-orange-700 dark:text-orange-300 font-medium bg-white/50 dark:bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                      <span className="material-symbols-outlined">verified_user</span>
                      <p className="text-sm" dangerouslySetInnerHTML={{ __html: content.realityHighlight.replace(/\n/g, '<br />') }}></p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 size-64 bg-orange-200/50 dark:bg-orange-900/30 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Values Section */}
      {content.values && content.values.length > 0 && (
        <section className="px-4 sm:px-10 py-12 max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {content.values.map((val, idx) => (
              <div key={idx} className="p-8 rounded-3xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 shadow-sm hover:shadow-xl transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-primary text-primary group-hover:text-white flex items-center justify-center mb-6 transition-colors">
                  <span className="material-symbols-outlined text-3xl">{val.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-text-main dark:text-white mb-3">{val.title}</h3>
                <p className="text-text-muted dark:text-gray-400 leading-relaxed">{val.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-4 sm:px-10 py-12 bg-gray-50 dark:bg-white/5 my-8 rounded-3xl mx-4 sm:mx-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">diversity_3</span>
            </div>
            <h2 className="text-text-main dark:text-white text-2xl font-bold tracking-tight">{content.formsTitle}</h2>
          </div>

          <div className="flex flex-col gap-4">
            {/* Hızlı Erişim Formları header removed */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {documents.map((form, i) => (
                <a
                  key={i}
                  href={form.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 transition-colors cursor-pointer shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={`size-10 rounded-full ${form.bg} flex items-center justify-center ${form.color}`}>
                      <span className="material-symbols-outlined">{form.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-text-main dark:text-white font-bold text-sm group-hover:text-primary transition-colors">{form.name}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-primary">download</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;