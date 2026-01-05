import React, { useState, useEffect } from 'react';
import ResponsiveHero from '../components/ResponsiveHero';

// Default content fallback (same as initial setup in Admin)
const defaultContent = {
  heroTitle: "Patika'da Yaşam ve Öğrenme",
  heroSubtitle: "Çocuklarınızın güvenle büyüyeceği, doğayla iç içe, sevgi dolu ve keşif odaklı bir yuva.",
  missionTitle: "Misyonumuz",
  missionText: "Çocukların doğal merakını destekleyen, özgüvenli, yaratıcı ve sosyal sorumluluk bilinci yüksek bireyler yetiştirmek için güvenli bir alan sağlamak. Her adımda sevgiyi ve saygıyı temel alarak, aile sıcaklığında bir eğitim yuvası olmak.",
  visionTitle: "Vizyonumuz",
  visionText: "Yenilikçi eğitim modelleriyle çocuk gelişiminde öncü, doğa ile teknolojiyi dengeli kullanan ve mutlu çocukların yetiştiği örnek gösterilen bir okul öncesi eğitim kurumu olmak.",
  values: [
    { title: "Güvenlik ve Hijyen", text: "En yüksek standartlarda fiziksel güvenlik ve temizlik protokolleri." },
    { title: "Bireysel İlgi", text: "Her çocuğun kendi hızında gelişimine saygı duyan özel yaklaşım." },
    { title: "Aile İşbirliği", text: "Şeffaf iletişim ve ebeveynlerin eğitime aktif katılımı." }
  ]
};

const About: React.FC = () => {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const saved = localStorage.getItem('patika_about_content');
    if (saved) {
      setContent(JSON.parse(saved));
    }
  }, []);

  // Hero image
  const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuAR6JKV0jJTMmlJcKp0hdgtUb913yjBS9hk1Hw8QzrD6gH3Qpm3GSS-c_c-JHSolqZd_jeZyV4L5utxXjfOyFG_iKXiJ-_pqSb8KYKT1EPO2QWWQAvDaSPz24w3glcd44TyFsbggM7kHiNDE3oYngLP_3QOoxi8bg8FeTKEy4TS1u1QQUtM2U27cuYEwXM5VelPyk1d__dbIFOf3KqwLroT2IiNHYFJcmKbn5AY_qLX1Z0LyjUdlnOJdZnScq-T-LZxelKlGTj_9w";

  return (
    <div className="max-w-[1200px] w-full flex flex-col">
      <ResponsiveHero
        mobileImage={heroImage}
        title={content.heroTitle}
        subtitle={content.heroSubtitle}
        badge="Hakkımızda"
        primaryButtonText="Bize Ulaşın"
        primaryButtonLink="/contact"
        secondaryButtonText="Hikayemiz"
        secondaryButtonLink="/stories"
      />

      <section className="px-4 sm:px-10 py-12">
        <div className="flex flex-col gap-8 text-center max-w-[960px] mx-auto">
          <h2 className="text-3xl font-bold text-text-main dark:text-white">Patika'ya Dair</h2>
          <div className="w-20 h-1 bg-primary mx-auto rounded-full"></div>
          <p className="text-text-muted dark:text-gray-300 text-lg leading-relaxed text-left sm:text-center">
            Patika, 1999’dan bu yana Bodrum’da, çocukların doğayla temas ederek, sevgiyle ve kendi ritimlerinde büyüdüğü; çocukluğun ilk yıllarına eşlik eden bir yuvadır.
            <br /><br />
            Masal ile gerçeğin iç içe geçtiği bu yolculukta, her çocuk kendi patikasında yürür; bizler ise onlara güvenli, samimi ve yaşayan bir alan sunarız.
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-10 py-12 bg-gray-50 dark:bg-white/5 rounded-3xl mx-4 sm:mx-10 my-8">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-main dark:text-white">Masallar ve Gerçekler Yaklaşımımız</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4 h-full">
              <div className="flex items-center gap-4 text-purple-600 dark:text-purple-400">
                <span className="material-symbols-outlined text-4xl">auto_stories</span>
                <h3 className="text-xl font-bold">Masallar</h3>
              </div>
              <p className="text-text-muted dark:text-gray-300 leading-relaxed">
                Masallar, çocukların dünyayı anlamlandırma biçimidir. Burada çocuklardan hızlı olmaları, yetişmeleri ya da benzemeleri beklenmez. Sormaya, denemeye, durmaya ve yeniden başlamaya alan açılır. Masallar bu alanı yumuşatır.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 font-medium text-purple-700 dark:text-purple-300 text-sm">
                "Biri hayal kurmayı öğretir."
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4 h-full">
              <div className="flex items-center gap-4 text-orange-600 dark:text-orange-400">
                <span className="material-symbols-outlined text-4xl">nature_people</span>
                <h3 className="text-xl font-bold">Gerçekler</h3>
              </div>
              <p className="text-text-muted dark:text-gray-300 leading-relaxed">
                Gerçekler ise o dünyada nasıl duracaklarını öğrenme hâli. Gerçekler, korkutmak için değil; güven duygusu oluşturmak için vardır. İkisi arasındaki denge, çocuğun kendi adımlarını bulmasına izin verir.
              </p>
              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 font-medium text-orange-700 dark:text-orange-300 text-sm">
                "Diğeri ayakta kalmayı öğretir."
              </div>
            </div>
          </div>
          <p className="text-center mt-10 text-text-muted dark:text-gray-400 italic max-w-3xl mx-auto text-lg">
            "Patika'da bu ikisi birbirinin karşıtı değil, tamamlayıcısıdır. Çocuklar masallarla düşünür, gerçeklerle dener. Patika, çocukların hayattan kopmadan büyüyebileceği bir yol olarak düşünülür. Ne yalnızca düşle, ne yalnızca kuralla ilerler."
          </p>
        </div>
      </section>

      <section className="px-4 sm:px-10 py-16">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-wider text-sm uppercase">Eğitim Yaklaşımımız</span>
            <h2 className="text-3xl md:text-4xl font-bold text-text-main dark:text-white mt-2">Nasıl Öğretiyoruz?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 dark:bg-gray-800 -z-10"></div>

            <div className="flex flex-col items-center text-center group">
              <div className="size-24 rounded-full bg-white dark:bg-[#2a2018] border-4 border-primary shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-4xl text-primary">toys</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-main dark:text-white">Oyun Temelli Öğrenme</h3>
              <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed px-4">
                Oyun, çocuğun işidir. Yapılandırılmış ve serbest oyun saatleriyle kavramları deneyimleyerek öğrenmelerini sağlıyoruz.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="size-24 rounded-full bg-white dark:bg-[#2a2018] border-4 border-accent-red shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-4xl text-accent-red">palette</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-main dark:text-white">Sanat ve Yaratıcılık</h3>
              <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed px-4">
                Atölye çalışmalarıyla kendini ifade etme becerilerini geliştiriyor, hayal güçlerini özgürce kullanmalarına alan açıyoruz.
              </p>
            </div>

            <div className="flex flex-col items-center text-center group">
              <div className="size-24 rounded-full bg-white dark:bg-[#2a2018] border-4 border-gray-400 shadow-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-4xl text-gray-500">park</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-text-main dark:text-white">Doğa İle İç İçe</h3>
              <p className="text-text-muted dark:text-gray-400 text-sm leading-relaxed px-4">
                Toprağa dokunmak, bitkileri tanımak ve mevsimleri yerinde gözlemlemek için bahçe zamanlarımız eğitimin önemli bir parçası.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-10 py-12 bg-gray-50 dark:bg-white/5 my-8 rounded-3xl mx-4 sm:mx-10">
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-bold text-text-main dark:text-white">Değerlerimiz</h2>
            <ul className="space-y-4">
              {content.values.map((value, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary mt-1">check_circle</span>
                  <div>
                    <h4 className="font-bold text-text-main dark:text-white">{value.title}</h4>
                    <p className="text-sm text-text-muted dark:text-gray-400">{value.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 w-full max-w-md">
            <div className="aspect-square rounded-2xl overflow-hidden shadow-xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqo2cU3z2rtFktndE2C-UIILIMHTYzJXNGPo5vpocPgxmOzQGHTbQ9cOGtgcGPAfE4bRG3qzIiL1zUhmfbMMhZm20BM2SdoJJxKwsM9oxCg3NwuF0nWGYaYezlKh9uazYnaxCRV1bf-zxVFccxcUzNTad0OULBfQWab0E9RqOW02x0qEoCLlioqE7MbZrbkCQoB4ZC-IRCBGpL2k_5SMX3G1OnDlMTrNplXI8pe8IrCLtM-mgJQSAMiQTw9hLvFoGNQg4C-Z66rg" alt="Teacher helping a young student" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-10 py-16 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block p-3 rounded-full bg-primary/10 text-primary mb-4">
              <span className="material-symbols-outlined text-3xl">calendar_month</span>
            </span>
            <h2 className="text-3xl font-bold text-text-main dark:text-white">Patika Tanışma Günleri</h2>
          </div>
          <div className="space-y-6 text-lg text-text-muted dark:text-gray-300 leading-relaxed">
            <p>
              Okulumuzu yakından tanımak, bahçemizi gezmek ve eğitim yaklaşımımız üzerine sohbet etmek isteyen; önümüzdeki eğitim–öğretim döneminde Patika’yı düşünen aileleri <strong>Patika Tanışma Günleri</strong>’ne davet ediyoruz.
            </p>
            <p>
              Tanıtım günlerimiz, her yıl <strong>Şubat</strong> ayında Patika Çocuk Yuvası’nda düzenlenir ve <strong>16.45 – 18.00</strong> saatleri arasında gerçekleştirilir.
            </p>
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 p-6 rounded-2xl mt-8">
              <p className="font-bold text-text-main dark:text-white">
                Tanışma günleri için randevular, Şubat ayı boyunca iletişim numaramız aracılığıyla alınmaktadır.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;