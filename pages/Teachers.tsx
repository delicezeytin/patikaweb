import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Teacher {
  id: number;
  name: string;
  role: string;
  branch: string;
  image: string; 
  color?: string;
}

const Teachers: React.FC = () => {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
      const saved = localStorage.getItem('patika_teachers');
      if (saved) {
          setTeachers(JSON.parse(saved));
      } else {
          // Fallback static data if nothing is saved yet
          setTeachers([
            { id: 1, name: "Ayşe Yılmaz", role: "Sınıf Öğretmeni", branch: "3-4 Yaş Grubu", image: "face_3", color: "bg-orange-100 text-orange-600" },
            { id: 2, name: "Mehmet Demir", role: "Sınıf Öğretmeni", branch: "4-5 Yaş Grubu", image: "face_6", color: "bg-blue-100 text-blue-600" },
            { id: 3, name: "Zeynep Kaya", role: "Sınıf Öğretmeni", branch: "5-6 Yaş Grubu", image: "face_2", color: "bg-green-100 text-green-600" },
            { id: 4, name: "Canan Yıldız", role: "İngilizce Öğretmeni", branch: "Tüm Yaş Grupları", image: "face_4", color: "bg-purple-100 text-purple-600" },
            { id: 5, name: "Elif Öztürk", role: "Yardımcı Öğretmen", branch: "3-4 Yaş Grubu", image: "face_5", color: "bg-pink-100 text-pink-600" },
            { id: 6, name: "Burak Şen", role: "Spor Öğretmeni", branch: "Tüm Yaş Grupları", image: "sports_handball", color: "bg-red-100 text-red-600" },
          ]);
      }
  }, []);

  const handleApplyClick = () => {
    try {
      const settings = localStorage.getItem('patika_form_settings');
      let isActive = false;
      if (settings) {
        const parsed = JSON.parse(settings);
        const form = parsed.find((f: any) => f.id === 'personnel');
        if (form && form.isActive) {
          isActive = true;
        }
      }
      if (isActive) {
        navigate('/apply-personnel');
      } else {
        alert("Şu anda personel alımımız bulunmamaktadır.");
      }
    } catch (error) {
      alert("Şu anda personel alımımız bulunmamaktadır.");
    }
  };

  return (
    <div className="max-w-[1200px] w-full flex flex-col items-center py-12 px-4 sm:px-10">
      <div className="text-center mb-16 max-w-3xl">
        <div className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-sm mb-4">
          Eğitim Kadromuz
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-text-main dark:text-white mb-6">
          Çocuklarınız Emin Ellerde
        </h1>
        <p className="text-text-muted dark:text-gray-400 text-lg">
          Alanında uzman, tecrübeli ve en önemlisi çocukları çok seven eğitim kadromuzla tanışın. 
          Her bir öğretmenimiz, çocuğunuzun yeteneklerini keşfetmesi için onlara rehberlik eder.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="group relative bg-white dark:bg-gray-800 rounded-3xl p-6 text-center border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute top-0 left-0 w-full h-32 bg-gray-50 dark:bg-white/5 rounded-t-3xl -z-0"></div>
            <div className={`relative z-10 size-32 mx-auto rounded-full ${teacher.color || 'bg-gray-100 text-gray-500'} dark:bg-opacity-20 flex items-center justify-center text-6xl mb-6 shadow-inner border-4 border-white dark:border-gray-800`}>
              <span className="material-symbols-outlined text-[64px]">{teacher.image}</span>
            </div>
            <div className="relative z-10 flex flex-col gap-1">
              <h3 className="text-xl font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">
                {teacher.name}
              </h3>
              <span className="text-primary font-bold text-xs uppercase tracking-wider">
                {teacher.branch}
              </span>
              <p className="text-text-muted dark:text-gray-400 text-sm mt-2">
                {teacher.role}
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5 flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
               <button className="text-gray-400 hover:text-primary transition-colors" title="E-posta Gönder">
                 <span className="material-symbols-outlined">mail</span>
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-20 w-full bg-primary/5 dark:bg-primary/10 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border border-primary/10">
        <div className="flex flex-col gap-3 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-text-main dark:text-white">Ekibimize Katılmak İster misiniz?</h2>
          <p className="text-text-muted dark:text-gray-300">Siz de bu büyük ailenin bir parçası olmak istiyorsanız başvurunuzu bekliyoruz.</p>
        </div>
        <button 
          onClick={handleApplyClick} 
          className="shrink-0 px-8 py-4 bg-white dark:bg-gray-800 text-text-main dark:text-white font-bold rounded-xl shadow-sm hover:shadow-md hover:text-primary transition-all flex items-center gap-2"
        >
          Başvuru Yap
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

export default Teachers;