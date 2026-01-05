import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ResponsiveHero from '../components/ResponsiveHero';

interface SchoolDocument {
  id: string;
  name: string;
  info: string;
  icon: string;
  color: string;
  bg: string;
}

interface HomeContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  valuesTitle: string;
  valuesSubtitle: string;
  values: { title: string; text: string; icon: string }[];
}

const defaultHomeContent: HomeContent = {
  heroTitle: "Patika'da Yürümek",
  heroSubtitle: "Masalların eşlik ettiği, gerçek hayata açılan bir yol.",
  heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKkBtmpwhIX5KPxEgKI9zWs4svarIXcB1OZmLOigX0jzCFwcO2zjv_pYzq0bkdHKpWowLwr7ahocm6bA42dTHgnb6j_UBwIlw-kpe2fIhKOlbp8SOWv9NgGWm2uys4pnyqiuP3zZ9NfQDiyw72zo4LZJSbSbrrGo86d5SjWWfbVqiydSWq_Bzyx5NzHhYKd1cXcQ_TWVQ64WochSWtVJV4kVa4ADz1_amSMQIWsalNn6fRHRBzZ1rVpn9eIgNw_G6HRkLLyYa_Hg",
  primaryButtonText: "Patika'ya Dair",
  primaryButtonLink: "/about",
  secondaryButtonText: "Masallar ve Gerçekler",
  secondaryButtonLink: "/stories",
  valuesTitle: "Neden Masallar ve Gerçekler Dünyası?",
  valuesSubtitle: "",
  values: []
};

const Home: React.FC = () => {
  const [documents, setDocuments] = useState<SchoolDocument[]>([
    { id: 'reg', name: "Öğrenci Kayıt Formu", info: "PDF • 2.4 MB", icon: "description", color: "text-secondary", bg: "bg-red-50 dark:bg-red-900/20" },
    { id: 'health', name: "Sağlık Bilgi Formu", info: "PDF • 1.1 MB", icon: "medical_services", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { id: 'trip', name: "Gezi İzin Belgesi", info: "DOCX • 500 KB", icon: "directions_bus", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" }
  ]);

  const [content, setContent] = useState<HomeContent>(defaultHomeContent);

  useEffect(() => {
    const savedDocs = localStorage.getItem('patika_documents');
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }
    // Using v2 key to force update content for user
    const savedContent = localStorage.getItem('patika_home_content_v2');
    if (savedContent) {
      setContent(JSON.parse(savedContent));
    } else {
      // Clear old content to avoid confusion
      localStorage.removeItem('patika_home_content');
    }
  }, []);

  return (
    <div className="max-w-[1200px] w-full flex flex-col">
      <ResponsiveHero
        mobileImage={content.heroImage}
        title={content.heroTitle}
        subtitle={content.heroSubtitle}
        badge=""
        primaryButtonText={content.primaryButtonText}
        primaryButtonLink={content.primaryButtonLink}
        secondaryButtonText={content.secondaryButtonText}
        secondaryButtonLink={content.secondaryButtonLink}
      />

      <section className="px-4 sm:px-10 py-12">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3 text-center sm:text-left">
            <h2 className="text-secondary font-bold tracking-widest text-xs uppercase">Felsefemiz</h2>
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
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-4 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">Masallar</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                      Hikâyeler, oyunlar ve semboller aracılığıyla çocukların hayal gücüne alan açılır.
                    </p>
                    <div className="flex items-center gap-3 text-purple-700 dark:text-purple-300 font-medium bg-white/50 dark:bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                      <span className="material-symbols-outlined">lightbulb</span>
                      <p className="text-sm">Masallar, doğruyu öğretmek için değil; <br /><strong>düşünmeye davet etmek için vardır.</strong></p>
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
                  <h3 className="text-2xl font-black text-gray-800 dark:text-white mb-4 group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors">Gerçekler</h3>
                  <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                      Günlük yaşam, ilişkiler ve sorumluluklar çocuğun anlayabileceği bir dille deneyimlenir.
                    </p>
                    <div className="flex items-center gap-3 text-orange-700 dark:text-orange-300 font-medium bg-white/50 dark:bg-white/5 p-4 rounded-xl backdrop-blur-sm">
                      <span className="material-symbols-outlined">verified_user</span>
                      <p className="text-sm">Gerçekler, korkutmak için değil; <br /><strong>güven duygusu oluşturmak için vardır.</strong></p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 size-64 bg-orange-200/50 dark:bg-orange-900/30 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-10 py-12 bg-gray-50 dark:bg-white/5 my-8 rounded-3xl mx-4 sm:mx-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <span className="material-symbols-outlined">diversity_3</span>
            </div>
            <h2 className="text-text-main dark:text-white text-2xl font-bold tracking-tight">Veli İşlemleri ve Formlar</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-text-main dark:text-gray-200">Randevu Oluşturun</h3>
              <div className="flex flex-col sm:flex-row items-stretch justify-between gap-6 rounded-2xl bg-white dark:bg-gray-800 p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex flex-[3] flex-col justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">calendar_month</span>
                      <p className="text-text-main dark:text-white text-lg font-bold leading-tight">Veli Toplantısı</p>
                    </div>
                    <p className="text-text-muted dark:text-gray-400 text-sm font-normal leading-relaxed">
                      Öğretmenlerimizle birebir görüşmek ve çocuğunuzun gelişimi hakkında konuşmak için online randevu alın.
                    </p>
                  </div>
                  <Link to="/appointment" className="flex items-center justify-center gap-2 rounded-xl h-10 px-6 bg-primary text-white text-sm font-bold w-fit hover:bg-orange-600 transition-colors">
                    <span>Randevu Oluştur</span>
                    <span className="material-symbols-outlined text-lg">arrow_forward</span>
                  </Link>
                </div>
                <div
                  className="w-full sm:w-1/3 aspect-video sm:aspect-square bg-cover bg-center rounded-xl"
                  style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDfd3fUs1gNISGRcSQJAumQhYrSso-xLAb_KUqarxSqO5NLVy2Kd6Jt9D2x7u3_ehpiDIJeouYIwJm0fK_J1VDmf3wd6Bjnuzs9oLLcBJIdzywH2Vqrwuy_jV_-PW2VzPPcVjLTZw5oqbZ-DHYpJk0aM5hOx6gCntjtYggn28cuJPtZaxWUDupv9_GbZAEh3_a5El7UjWHIMf7GAp2Wqf3JVVGn8nDSXFSCSXXwNmKjz7F9ZUxa2aJ3v6gkdvGvZDWJDNZkK6HW_w")' }}
                >
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-bold text-text-main dark:text-gray-200">Hızlı Erişim Formları</h3>
              <div className="flex flex-col gap-3">
                {documents.map((form, i) => (
                  <div key={i} className="group flex items-center justify-between p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 transition-colors cursor-pointer shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className={`size-10 rounded-full ${form.bg} flex items-center justify-center ${form.color}`}>
                        <span className="material-symbols-outlined">{form.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-text-main dark:text-white font-bold text-sm group-hover:text-primary transition-colors">{form.name}</span>
                        <span className="text-xs text-text-muted dark:text-gray-400">{form.info}</span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 group-hover:text-primary">download</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;