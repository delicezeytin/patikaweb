import React, { useState, useEffect } from 'react';
import ResponsiveHero from '../components/ResponsiveHero';
import { contentService } from '../services/api';

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
  ],
  introTitle: "Patika’ya Dair",
  introText: "Patika, 1999’dan bu yana Bodrum’da, çocukların doğayla temas ederek, sevgiyle ve kendi ritimlerinde büyüdüğü; çocukluğun ilk yıllarına eşlik eden bir yuvadır.\n\nMasal ile gerçeğin iç içe geçtiği bu yolculukta, her çocuk kendi patikasında yürür; bizler ise onlara güvenli, samimi ve yaşayan bir alan sunarız.",
  perspectiveTitle: "Bakış Açımız; Masallar ve Gerçekler",
  perspectiveText: "Masallar, çocukların dünyayı anlamlandırma biçimidir. Gerçekler ise o dünyada nasıl duracaklarını öğrenme hâli.\n\nPatika’da bu ikisi birbirinin karşıtı değil, tamamlayıcısıdır. Çocuklar masallarla düşünür, gerçeklerle dener. Biri hayal kurmayı, diğeriyse ayakta kalmayı öğretir.\n\nBurada çocuklardan hızlı olmaları, yetişmeleri ya da benzemeleri beklenmez. Sormaya, denemeye, durmaya ve yeniden başlamaya alan açılır. Masallar bu alanı yumuşatır; gerçekler ise güvenli kılar.\n\nPatika, çocukların hayattan kopmadan büyüyebileceği bir yol olarak düşünülür. Ne yalnızca düşle, ne yalnızca kuralla ilerler. İkisi arasındaki denge, çocuğun kendi adımlarını bulmasına izin verir."
};

const About: React.FC = () => {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await contentService.get('about');
        if (res.data && res.data.content) {
          setContent({ ...defaultContent, ...res.data.content });
        }
      } catch (error) {
        console.error('Error fetching about content:', error);
      }
    };
    fetchData();
  }, []);

  // Hero image
  const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuAR6JKV0jJTMmlJcKp0hdgtUb913yjBS9hk1Hw8QzrD6gH3Qpm3GSS-c_c-JHSolqZd_jeZyV4L5utxXjfOyFG_iKXiJ-_pqSb8KYKT1EPO2QWWQAvDaSPz24w3glcd44TyFsbggM7kHiNDE3oYngLP_3QOoxi8bg8FeTKEy4TS1u1QQUtM2U27cuYEwXM5VelPyk1d__dbIFOf3KqwLroT2IiNHYFJcmKbn5AY_qLX1Z0LyjUdlnOJdZnScq-T-LZxelKlGTj_9w";

  return (
    <div className="max-w-[1200px] w-full flex flex-col">
      <ResponsiveHero
        mobileImage={heroImage}
        title={content.heroTitle}
        subtitle=""
        badge="Hakkımızda"
      // Buttons removed
      />

      <section className="px-4 sm:px-10 py-16 md:py-24 dark:bg-background-dark">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-[40px] rotate-3 transition-transform group-hover:rotate-6 duration-500"></div>
            {/* Illustration Image matching Hero style */}
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKkBtmpwhIX5KPxEgKI9zWs4svarIXcB1OZmLOigX0jzCFwcO2zjv_pYzq0bkdHKpWowLwr7ahocm6bA42dTHgnb6j_UBwIlw-kpe2fIhKOlbp8SOWv9NgGWm2uys4pnyqiuP3zZ9NfQDiyw72zo4LZJSbSbrrGo86d5SjWWfbVqiydSWq_Bzyx5NzHhYKd1cXcQ_TWVQ64WochSWtVJV4kVa4ADz1_amSMQIWsalNn6fRHRBzZ1rVpn9eIgNw_G6HRkLLyYa_Hg"
              alt="Mutlu çocuklar oyun oynarken"
              className="relative w-full aspect-[4/5] object-cover rounded-[32px] shadow-2xl transform transition-transform group-hover:scale-[1.02] duration-500"
            />
          </div>
          <div className="flex flex-col gap-8">
            {/* Text Content Wrapped in Rounded Container */}
            <div className="flex flex-col gap-8 text-lg text-text-muted dark:text-gray-300 leading-relaxed bg-gray-100 dark:bg-white/5 p-8 md:p-10 rounded-[32px] border border-gray-100 dark:border-white/5">
              <div>
                <h2 className="text-3xl font-black text-text-main dark:text-white mb-4">{content.introTitle}</h2>
                <div className="space-y-4">
                  {content.introText && content.introText.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>

                {content.perspectiveTitle && (
                  <div className="mt-8 pt-8 border-t border-gray-200 dark:border-white/10">
                    <h3 className="text-2xl font-black text-text-main dark:text-white mb-4">{content.perspectiveTitle}</h3>
                    <div className="space-y-4">
                      {content.perspectiveText && content.perspectiveText.split('\n\n').map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>


            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default About;