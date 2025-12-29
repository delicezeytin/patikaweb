import React, { useState, useEffect } from 'react';

const FoodList: React.FC = () => {
  const [menu, setMenu] = useState([
    { day: "Pazartesi", breakfast: "Omlet, Peynir, Zeytin, Süt", lunch: "Mercimek Çorbası, Sebzeli Tavuk, Bulgur Pilavı", snack: "Meyve Salatası, Kurabiye" },
    { day: "Salı", breakfast: "Kaşarlı Tost, Domates, Salatalık, Ihlamur", lunch: "Tarhana Çorbası, İzmir Köfte, Makarna", snack: "Sütlaç" },
    { day: "Çarşamba", breakfast: "Haşlanmış Yumurta, Bal, Tereyağı, Süt", lunch: "Yayla Çorbası, Taze Fasulye, Pirinç Pilavı", snack: "Kek, Meyve Suyu" },
    { day: "Perşembe", breakfast: "Menemen, Peynir, Zeytin, Bitki Çayı", lunch: "Domates Çorbası, Fırın Somon, Patates Püresi", snack: "Yoğurtlu Meyve" },
    { day: "Cuma", breakfast: "Simit, Peynir, Domates, Süt", lunch: "Ezogelin Çorbası, Etli Nohut, Bulgur Pilavı", snack: "Aşure" },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('patika_food_menu');
    if (saved) {
        setMenu(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="max-w-[1200px] w-full flex flex-col items-center py-12 px-4 sm:px-10">
      <div className="text-center mb-12">
        <div className="size-20 rounded-full bg-red-50 dark:bg-red-900/20 text-secondary flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-4xl">restaurant_menu</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white mb-3">Haftalık Yemek Listesi</h1>
        <p className="text-text-muted dark:text-gray-400 max-w-2xl mx-auto">
          Çocuklarımızın gelişimi için diyetisyen kontrolünde hazırlanan, mevsimine uygun, doğal ve besleyici menümüz.
        </p>
      </div>

      <div className="w-full bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-primary/10 text-primary">
                <th className="p-5 font-bold text-sm uppercase tracking-wider rounded-tl-3xl">Gün</th>
                <th className="p-5 font-bold text-sm uppercase tracking-wider">Sabah Kahvaltısı</th>
                <th className="p-5 font-bold text-sm uppercase tracking-wider">Öğle Yemeği</th>
                <th className="p-5 font-bold text-sm uppercase tracking-wider rounded-tr-3xl">İkindi Kahvaltısı</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {menu.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-5 font-bold text-text-main dark:text-white whitespace-nowrap bg-gray-50/50 dark:bg-white/5">
                    {item.day}
                  </td>
                  <td className="p-5 text-text-muted dark:text-gray-300">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-400 text-lg">bakery_dining</span>
                        {item.breakfast}
                    </div>
                  </td>
                  <td className="p-5 text-text-muted dark:text-gray-300">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-lg">soup_kitchen</span>
                        {item.lunch}
                    </div>
                  </td>
                  <td className="p-5 text-text-muted dark:text-gray-300">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400 text-lg">cookie</span>
                        {item.snack}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-6 w-full">
        <div className="flex-1 bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl border border-green-100 dark:border-green-900/30">
            <h3 className="font-bold text-green-800 dark:text-green-200 text-lg mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">eco</span>
                Organik ve Taze
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300">
                Yemeklerimizde kullanılan sebze ve meyveler mevsimine uygun olarak seçilmekte, katkı maddesi içermeyen doğal ürünler tercih edilmektedir.
            </p>
        </div>
        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <h3 className="font-bold text-blue-800 dark:text-blue-200 text-lg mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined">medical_services</span>
                Alerjen Bilgisi
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
                Gıda alerjisi olan öğrencilerimiz için özel menüler hazırlanmaktadır. Lütfen kayıt esnasında alerjen durumunu belirtiniz.
            </p>
        </div>
      </div>
    </div>
  );
};

export default FoodList;