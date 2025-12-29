import React, { useState, useEffect } from 'react';
import ResponsiveHero from '../components/ResponsiveHero';

interface Tale {
  id: number;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  isActive: boolean;
}

const Stories: React.FC = () => {
  const [tales, setTales] = useState<Tale[]>([]);
  const [expandedTaleId, setExpandedTaleId] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('patika_tales');
    if (saved) {
      setTales(JSON.parse(saved));
    } else {
      // Fallback default data purely for initial view before admin save (optional, but good for demo)
      setTales([
        {
          id: 1,
          title: "Cesur Küçük Tavşan",
          description: "Ormanın derinliklerinde yaşayan küçük bir tavşanın korkularıyla yüzleşme hikayesi.",
          content: "Bir varmış, bir yokmuş... Ormanın derinliklerinde, rengarenk çiçeklerin arasında yaşayan Pamuk adında küçük bir tavşan varmış. Pamuk çok sevimliymiş ama birazcık ürkekmiş. Rüzgarın sesinden bile korkar, hemen yuvasına saklanırmış. Bir gün ormanda büyük bir fırtına çıkmış...",
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTnKdTr5SLnWPQXu_SDhg9qy-_WnA_reqdARzoPxY85rESislnNwb20btMaDt7lQJJ0hW9Ol-Q-64eYiQv2IfqJd53IdVRgFu90KjUYGQoIZWtYv9pzA6tK_Xqz8IZDFEFLBoAx5OnmVvLYfTLvLmvgXXIo5SV-tTb4KbJ5n1k2GznreLjC3SwEs5qt_q40kiJ69OOKXq3KgCuFWl_C-Nptr2MPOqBfznRJngn7-NopPEDlTS79kHY94bkHCk0DkU3k4UDeXijCA",
          isActive: true
        },
        {
          id: 2,
          title: "Paylaşmanın Gücü",
          description: "Patika'nın bahçesinde oyuncaklarını paylaşmayı öğrenen çocukların sıcak hikayesi.",
          content: "Patika Çocuk Yuvası'nın güneşli bir sabahında, çocuklar bahçede neşeyle oynuyormuş. Ali, elindeki kırmızı kamyonu kimseye vermek istemiyormuş. Ayşe ise kum havuzunda oynamak için bir kamyona ihtiyaç duyuyormuş...",
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqxmzNantTWtxM-zvYswviZfgpgo6eBs_6Je72rub7sEpvV6QCy42gSfPruYeCoOW8uh7RFSPshq1EGN4hjjB1aQ5ZBhBDpMVkQaBXRLoAPWbh9hA5TXAN0d-4YM1KP0ZJzrNZ42S1l8R2bS7gyDpHpTV5yQ99nBvaZJVes6mlc7N1xCGR5KRg4OaD371MjceS4PrCxuDkvPPEZZP5ntcDVyhwHsBDhcTGkqTjMfN-cB0N93IIsAR_jHaLZbab88-g8g8Y_3CGOg",
          isActive: true
        },
        {
          id: 3,
          title: "Rüyalar Ülkesi",
          description: "Uyku vaktinde anlatılacak sakinleştirici bir macera.",
          content: "Gecenin sessizliğinde, yıldızlar gökyüzünde parıldarken, küçük bir bulut gökyüzünde süzülüyormuş. Bu bulutun adı Pofuduk'muş. Pofuduk, çocukların rüyalarına güzel düşler taşımakla görevliymiş...",
          imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdbp9o9-TtVVmRIC4E2kJYdHKH04cDAONxZW6IHc0YWOsB2u9G83mB9oJ07YWl2DxX9jpfJUVNGrY42ygZvPSo9Md0z03uy_MJFuWYih2jix2jQIq1yVijQV2t6H6ggG52iczIh-6YqJeSZN8tNpGfAyymgggMRmzaCMCqlNGbRztf-DSbtxa5pyB7TbvUMLEN6M5HDG6SaZqVCC06YpfLjntQRGVpFJRKB10ykTJ_nK5kkGHyhw5PEDWShQqr36-YmRgx-4eQAA",
          isActive: true
        }
      ]);
    }
  }, []);

  // Hero image
  const heroImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuCet7VdWERQ-k0xejdilUfabNBi6vtJmcr6mJMAA9Q3mLkYmZQOOIgG3EQ6AQIZ_kwh5LWfFOaxdNHmjND-KLapHopQhTNAdzVgxKzGWEqD4TC2G-zcZqmmm-0GlzsglrpiovksHg6W9Zr_qnIgdDCo7GUkOtCvi3y5qXMn1VbLcEBgd2RZ56GKwQZYGEoLigzmKtq1MsMEYQp87KkBFF8mw97P0pf1x0m99aFmLgD6OUWCd-gKFhaIDMQB092VTqe538Z0BhyegA";

  const displayedTales = showAll ? tales : tales.slice(0, 3);

  return (
    <div className="max-w-[1200px] w-full flex flex-col">
      <ResponsiveHero
        mobileImage={heroImage}
        title="Masallar ve Gerçekler"
        subtitle="Patika'da çocukların hayal dünyasına eşlik ediyor, ebeveynlik yolculuğunda birlikte yürüyoruz."
        badge="Hikayeler"
        primaryButtonText="Masalları Keşfet"
        primaryButtonLink="#masallar"
        secondaryButtonText="Hakkımızda"
        secondaryButtonLink="/about"
      />

      <section className="px-4 sm:px-10 py-12">
        <div className="flex flex-col gap-6 text-center max-w-[960px] mx-auto">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className="w-12 h-1 bg-secondary rounded-full"></span>
            <span className="text-secondary font-bold uppercase tracking-widest text-sm">Okul Felsefemiz</span>
            <span className="w-12 h-1 bg-secondary rounded-full"></span>
          </div>
          <h3 className="text-4xl md:text-5xl font-black text-[#181411] dark:text-white leading-tight">
            Gerçekler: Patika'da Yürümek
          </h3>
          <p className="text-[#8a7560] dark:text-gray-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
            Çocuklara bir şeyler öğretmek yerine, onların keşif yolculuğunda yanlarında olmayı, yani "Patika'da birlikte yürümeyi" benimsiyoruz. Geleneksel eğitim modellerinin ötesinde, çocuğun doğal merakını rehber kabul ediyoruz.
          </p>

          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 mt-12 text-left">
            <div className="w-full md:w-1/2 relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl rotate-1 hover:rotate-0 transition-transform duration-500">
                <img alt="Child playing with wooden blocks" className="w-full h-auto object-cover aspect-[4/3]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDN-wsJblYzErTTGv1zkrrVuLNJntsqSf8y6xIkMqBHxfC32bUoqQrX0LLQTwEgHFY1o_lC6VIRGvdoKiTQVIyyapYBsASBP2dvYSzIVhPqmCdnVOkHqReaSfodRzKHBIftz4aJYaDzb0KOJ_l6C3Xl09_xBEpWwXArsCDn50ELJJOO6LLAnle2gMMV4Bgt5JqtQe8wJr8JeWU68jtG-cFy4EeCSIDE91660P-CUh_wtiCWckqtJi8t_vy4gYtbVz3QSnVCz59b6g" />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white dark:bg-[#2c2219] p-4 rounded-xl shadow-lg max-w-[200px] hidden md:block">
                <p className="text-xs font-bold text-primary italic">"Oyun, çocuğun en ciddi işidir."</p>
              </div>
            </div>
            <div className="w-full md:w-1/2 flex flex-col gap-5">
              <h4 className="text-2xl md:text-3xl font-bold text-[#181411] dark:text-white">Oyunla Keşfetme Özgürlüğü</h4>
              <p className="text-[#8a7560] dark:text-gray-300 text-base leading-7">
                Çocukların dünyayı anlamlandırma biçimi oyundur. Patika'da biz "öğretmen" değil, oyun arkadaşı ve gözlemciyiz. Bilimsel veriler ışığında, yapılandırılmamış oyun saatlerinin çocukların problem çözme becerilerini, duygusal zekalarını ve sosyal uyum yeteneklerini nasıl geliştirdiğini her gün deneyimliyoruz.
              </p>
              <p className="text-[#8a7560] dark:text-gray-300 text-base leading-7">
                Sınıflarımızda ders zilleri çalmaz; oyunun akışı, keşfin derinliği belirler zamanı. Bir yaprağın damarlarını incelerken biyolojiyi, bloklarla kule yaparken fiziği deneyimlerler.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-10 py-12 bg-white dark:bg-gray-800 rounded-3xl mx-4 sm:mx-10 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="w-full lg:w-1/2 flex flex-col gap-6">
            <h4 className="text-2xl md:text-3xl font-bold text-[#181411] dark:text-white">Yaşam Ritmi ve Alışkanlıklar</h4>
            <p className="text-[#8a7560] dark:text-gray-300 text-base leading-7">
              Patika'da tuvalet eğitimi, beslenme veya uyku birer "zorunluluk" veya "eğitim" süreci değildir. Bunlar yaşamın doğal ritmidir. Çocuğun bedenini tanıması, sinyallerini dinlemesi ve kendi bakımını üstlenmesi için ona rehberlik ederiz.
            </p>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex gap-4 items-start">
                <span className="material-symbols-outlined text-secondary mt-1">restaurant</span>
                <div>
                  <h5 className="font-bold text-[#181411] dark:text-white text-lg">Sofrada Paylaşım</h5>
                  <p className="text-sm text-[#8a7560] dark:text-gray-400 mt-1">Yemek yemek sadece doymak değil, sosyalleşmektir. Kendi tabağını hazırlayan, sebzeleri tanıyan çocuk, gıdayla barışık büyür.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <span className="material-symbols-outlined text-secondary mt-1">wash</span>
                <div>
                  <h5 className="font-bold text-[#181411] dark:text-white text-lg">Öz Bakım Becerileri</h5>
                  <p className="text-sm text-[#8a7560] dark:text-gray-400 mt-1">El yıkamaktan ayakkabı bağlamaya kadar her an, çocuğun "ben yapabilirim" duygusunu beslediğimiz kıymetli bir fırsattır.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full lg:w-1/2 grid grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden h-48 md:h-64 shadow-md">
              <img alt="Healthy eating habits" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCJ3BO04W00LnQNjkNph1jpM787ER5SAjWrbVgHywb8yIJSnpbMNh9J5AdCQ2lfunSijYKfsPX6r0Bh-xgM4xnCzfH1uzwd0Q57iLcmrau8ega1JubjgdCTfSoyYoviH2Wrcd3GUEbOOXf2WAku7wVqsuSTEA7Ec7cPJEswQytKrZr8SgT9vbIIsBF2GMY9xjuGqWZ4JMx6LFHvQGeJcnPruCn-paRZTM0qV1Iu_WBzrvpMUgLHmy0UVMruwbSeA6eo3D2M1e8lSQ" />
            </div>
            <div className="rounded-xl overflow-hidden h-48 md:h-64 shadow-md mt-8">
              <img alt="Self care moments" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4m3XSaOlgI3RiM4eiBRc7Ndf2MZLlrKZbB7g40LdauhprnrXDAwYS00jjSLapYO3-q84PobPCFhlorX6CcmVYmH1oErLx317VxOug1oI4trzTIT4Foy3WTrN85vMTj2QOJKCdNBB9x9W5v0EUmk-Pb9oMT71rZOMH3luKoGc4Ln92ED-3nbxvG-qGU_8145mH7W6_wjylBU8qeICjSOXV_7AxQlJT5OtdFOjtpuCC_AOBIDByQrq6zDFS3ib5DcWnkHKxJDBlaQ" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-10 py-12 bg-gray-50 dark:bg-white/5 my-8 rounded-3xl mx-4 sm:mx-10" id="masallar">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-2 items-center text-center">
            <div className="p-3 bg-white dark:bg-[#3a2e24] rounded-full shadow-sm mb-2">
              <span className="material-symbols-outlined text-primary text-4xl">auto_stories</span>
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-[#181411] dark:text-white">
              Masallar
            </h3>
            <p className="text-[#8a7560] dark:text-gray-400 text-lg md:text-xl max-w-2xl">
              Çocuklarımızın hayal gücünü zenginleştiren, sevgi ve macera dolu hikayeler.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
            {displayedTales.map(tale => (
              <article key={tale.id} className={`flex flex-col gap-3 group cursor-pointer transition-all duration-300 ${expandedTaleId === tale.id ? 'col-span-1 sm:col-span-2 lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl' : ''}`}>
                <div className={`relative w-full rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all border-4 border-white dark:border-[#3a2e24] ${expandedTaleId === tale.id ? 'aspect-[21/9] max-h-[400px]' : 'aspect-[4/3]'}`}>
                  <div className="absolute inset-0 bg-center bg-no-repeat bg-cover transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: `url("${tale.imageUrl}")` }}></div>
                  <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <div className="absolute top-3 left-3 bg-primary text-white backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold shadow-sm">Masal</div>
                </div>
                <div className="flex flex-col gap-2 px-2">
                  <h4 className="text-[#181411] dark:text-white text-xl font-bold leading-tight group-hover:text-primary transition-colors">{tale.title}</h4>
                  {expandedTaleId === tale.id ? (
                    <div className="prose dark:prose-invert max-w-none mt-4 animate-fadeIn">
                      <p className="whitespace-pre-wrap text-lg leading-relaxed font-serif text-[#5e4e41] dark:text-gray-300">
                        {tale.content}
                      </p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setExpandedTaleId(null); }}
                        className="mt-6 flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
                      >
                        <span className="material-symbols-outlinedRotate-180">arrow_upward</span> Masalı Kapat
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[#8a7560] dark:text-gray-400 text-sm font-normal line-clamp-2">{tale.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedTaleId(tale.id); }}
                          className="text-primary text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                        >
                          Masalı Oku <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!showAll && tales.length > 3 && (
            <div className="flex justify-center mt-8">
              <button
                onClick={() => setShowAll(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl border border-[#e6e0db] dark:border-[#3a2e24] bg-white dark:bg-[#2c2219] text-[#181411] dark:text-white font-bold hover:shadow-md transition-all"
              >
                Tüm Masalları Gör
                <span className="material-symbols-outlined">auto_stories</span>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Stories;