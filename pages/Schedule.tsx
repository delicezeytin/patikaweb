import React, { useState, useEffect } from 'react';

interface ScheduleItem {
  time: string;
  activity: string;
  icon: string;
  color: string;
}

interface ScheduleData {
  '3-4': ScheduleItem[];
  '4-5': ScheduleItem[];
  '5-6': ScheduleItem[];
}

const Schedule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'3-4' | '4-5' | '5-6'>('3-4');
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    '3-4': [
      { time: "08:00 - 09:00", activity: "Okula Geliş ve Serbest Oyun", icon: "sunny", color: "text-orange-500" },
      { time: "09:00 - 09:30", activity: "Sabah Kahvaltısı", icon: "restaurant", color: "text-green-500" },
      { time: "09:30 - 10:30", activity: "Sabah Sporu ve Çember Saati", icon: "sports_gymnastics", color: "text-blue-500" },
      { time: "10:30 - 11:30", activity: "Sanat ve El Becerileri", icon: "palette", color: "text-purple-500" },
      { time: "11:30 - 12:30", activity: "Öğle Yemeği", icon: "soup_kitchen", color: "text-red-500" },
      { time: "12:30 - 14:30", activity: "Uyku ve Dinlenme Zamanı", icon: "bedtime", color: "text-indigo-500" },
      { time: "14:30 - 15:00", activity: "İkindi Kahvaltısı", icon: "bakery_dining", color: "text-yellow-500" },
      { time: "15:00 - 16:00", activity: "Müzik ve Ritim Atölyesi", icon: "music_note", color: "text-pink-500" },
      { time: "16:00 - 17:00", activity: "Bahçe Zamanı", icon: "park", color: "text-green-600" },
    ],
    '4-5': [
      { time: "08:00 - 09:00", activity: "Okula Geliş ve Kitap İnceleme", icon: "auto_stories", color: "text-blue-500" },
      { time: "09:00 - 09:30", activity: "Sabah Kahvaltısı", icon: "restaurant", color: "text-green-500" },
      { time: "09:30 - 10:30", activity: "İngilizce Oyun Saati", icon: "language", color: "text-red-500" },
      { time: "10:30 - 11:30", activity: "Fen ve Doğa Etkinliği", icon: "science", color: "text-green-600" },
      { time: "11:30 - 12:30", activity: "Öğle Yemeği", icon: "soup_kitchen", color: "text-orange-500" },
      { time: "12:30 - 13:30", activity: "Sessiz Kitap Okuma / Dinlenme", icon: "menu_book", color: "text-teal-500" },
      { time: "13:30 - 14:30", activity: "Matematik ve Akıl Oyunları", icon: "calculate", color: "text-indigo-500" },
      { time: "14:30 - 15:00", activity: "İkindi Kahvaltısı", icon: "bakery_dining", color: "text-yellow-500" },
      { time: "15:00 - 16:00", activity: "Drama ve Hikaye Anlatımı", icon: "theater_comedy", color: "text-purple-500" },
      { time: "16:00 - 17:00", activity: "Serbest Oyun / Eve Gidiş", icon: "family_restroom", color: "text-gray-500" },
    ],
    '5-6': [
      { time: "08:00 - 09:00", activity: "Okula Geliş ve Güne Hazırlık", icon: "wb_sunny", color: "text-orange-500" },
      { time: "09:00 - 09:30", activity: "Sabah Kahvaltısı", icon: "restaurant", color: "text-green-500" },
      { time: "09:30 - 10:30", activity: "Okuma Yazmaya Hazırlık", icon: "edit_note", color: "text-blue-600" },
      { time: "10:30 - 11:30", activity: "Robotik Kodlama / Satranç", icon: "smart_toy", color: "text-purple-600" },
      { time: "11:30 - 12:30", activity: "Öğle Yemeği", icon: "soup_kitchen", color: "text-red-500" },
      { time: "12:30 - 13:30", activity: "Değerler Eğitimi", icon: "volunteer_activism", color: "text-pink-500" },
      { time: "13:30 - 14:30", activity: "Spor ve Jimnastik", icon: "sports_handball", color: "text-orange-600" },
      { time: "14:30 - 15:00", activity: "İkindi Kahvaltısı", icon: "bakery_dining", color: "text-yellow-500" },
      { time: "15:00 - 16:00", activity: "Proje Saati (Mutfak/Tasarım)", icon: "design_services", color: "text-teal-500" },
      { time: "16:00 - 17:00", activity: "Günün Değerlendirmesi", icon: "forum", color: "text-blue-400" },
    ]
  });

  useEffect(() => {
    const saved = localStorage.getItem('patika_schedule');
    if (saved) {
        setScheduleData(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="max-w-[1000px] w-full flex flex-col items-center py-12 px-4 sm:px-10">
      <div className="text-center mb-10">
        <div className="size-20 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-4xl">calendar_month</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white mb-3">Günlük Ders Programı</h1>
        <p className="text-text-muted dark:text-gray-400 max-w-2xl mx-auto">
          Çocuklarımızın yaş gruplarına özel olarak hazırlanan, bilişsel, fiziksel ve sosyal gelişimlerini destekleyen dengeli programımız.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-10 w-full max-w-md">
        {(['3-4', '4-5', '5-6'] as const).map((age) => (
          <button
            key={age}
            onClick={() => setActiveTab(age)}
            className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all
              ${activeTab === age 
                ? 'bg-white dark:bg-gray-800 text-primary shadow-sm' 
                : 'text-text-muted hover:text-text-main'}`}
          >
            {age} Yaş Grubu
          </button>
        ))}
      </div>

      <div className="w-full relative">
        <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
        <div className="flex flex-col gap-6">
          {scheduleData[activeTab].map((item, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-8 group">
              <div className="w-full sm:w-32 py-2 px-4 bg-primary/10 text-primary font-bold rounded-lg text-center sm:text-right shrink-0">
                {item.time}
              </div>
              
              <div className="hidden sm:flex size-4 rounded-full bg-primary border-4 border-white dark:border-background-dark shadow-sm z-10 mt-3 relative"></div>
              
              <div className="flex-1 w-full bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
                <div className={`size-12 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center shrink-0 ${item.color}`}>
                  <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                </div>
                <span className="font-bold text-text-main dark:text-white text-lg">{item.activity}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Schedule;