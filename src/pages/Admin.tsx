import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GoogleGenAI } from "@google/genai";

// --- Types & Mock Data ---

type MeetingStatus = 'pending' | 'approved' | 'rejected';

// Enriched Teacher Interface for Appointment Page Compatibility
interface Teacher {
  id: number;
  name: string;
  role: string;
  branch: string;
  image: string; // Material symbol name
}

interface ClassConfig {
  id: number;
  name: string;
  isIncluded: boolean;
  assignedTeachers: Teacher[];
}

interface MeetingRequest {
  id: number;
  formId: number;
  parentName: string;
  studentName: string;
  date: string;
  time: string;
  status: MeetingStatus;
}

interface MeetingForm {
  id: number;
  title: string;
  dates: string[]; 
  dailyStartTime: string;
  dailyEndTime: string;
  durationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
  classes: ClassConfig[];
}

interface SystemSettings {
  // geminiKey removed to comply with guidelines (use process.env.API_KEY)
  calendarId: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
}

// Global Mock Data for Teachers available in the system
const allSystemTeachers: Teacher[] = [
  { id: 1, name: "Ayşe Yılmaz", role: "Sınıf Öğretmeni", branch: "3-4 Yaş Grubu", image: "face_3" },
  { id: 2, name: "Mehmet Demir", role: "Sınıf Öğretmeni", branch: "4-5 Yaş Grubu", image: "face_6" },
  { id: 3, name: "Zeynep Kaya", role: "Sınıf Öğretmeni", branch: "5-6 Yaş Grubu", image: "face_2" },
  { id: 4, name: "Canan Yıldız", role: "İngilizce Öğretmeni", branch: "Tüm Yaş Grupları", image: "face_4" },
  { id: 5, name: "Elif Öztürk", role: "Yardımcı Öğretmen", branch: "3-4 Yaş Grubu", image: "face_5" },
  { id: 6, name: "Burak Şen", role: "Spor Öğretmeni", branch: "Tüm Yaş Grupları", image: "sports_handball" },
];

const initialForms: MeetingForm[] = [
  { 
    id: 1, 
    title: 'Genel Tanışma Toplantısı', 
    dates: ['2024-10-20', '2024-10-21'], 
    dailyStartTime: '09:00',
    dailyEndTime: '16:00',
    durationMinutes: 20,
    bufferMinutes: 10,
    isActive: true,
    classes: [
      { 
        id: 101, 
        name: 'Güneş Sınıfı (3-4 Yaş)', 
        isIncluded: true, 
        assignedTeachers: [allSystemTeachers[0], allSystemTeachers[4]] // Ayşe, Elif
      },
      { 
        id: 102, 
        name: 'Kelebekler Sınıfı (4-5 Yaş)', 
        isIncluded: true, 
        assignedTeachers: [allSystemTeachers[1]] // Mehmet
      },
      { 
        id: 103, 
        name: 'Gökkuşağı Sınıfı (5-6 Yaş)', 
        isIncluded: true, 
        assignedTeachers: [allSystemTeachers[2]] // Zeynep
      },
      {
        id: 104,
        name: 'Branş Dersleri',
        isIncluded: true,
        assignedTeachers: [allSystemTeachers[3], allSystemTeachers[5]] // Canan, Burak
      }
    ]
  },
];

const initialRequests: MeetingRequest[] = [
  { id: 101, formId: 1, parentName: 'Ayşe Yılmaz', studentName: 'Can Yılmaz', date: '2024-10-20', time: '14:00', status: 'pending' },
  { id: 102, formId: 1, parentName: 'Mehmet Demir', studentName: 'Elif Demir', date: '2024-10-21', time: '10:30', status: 'approved' },
];

const chartData = [
  { name: 'Pzt', attendance: 120 },
  { name: 'Sal', attendance: 132 },
  { name: 'Çar', attendance: 125 },
  { name: 'Per', attendance: 140 },
  { name: 'Cum', attendance: 118 },
];

const BrandLogo = ({ className = "h-12" }: { className?: string }) => (
  <img 
    src="/logo.png" 
    alt="Patika Çocuk Yuvası" 
    className={`${className} w-auto object-contain dark:bg-white/90 dark:rounded-lg dark:px-2 dark:py-1`} 
  />
);

const Admin: React.FC = () => {
  // --- State Management ---
  const [activeView, setActiveView] = useState<'dashboard' | 'meetings' | 'meeting-manage' | 'meeting-edit' | 'settings'>('dashboard');
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  
  // Load initial state from LocalStorage if available to simulate persistence between pages
  const [forms, setForms] = useState<MeetingForm[]>(() => {
    const saved = localStorage.getItem('patika_meeting_forms');
    return saved ? JSON.parse(saved) : initialForms;
  });

  const [requests, setRequests] = useState<MeetingRequest[]>(() => {
    const saved = localStorage.getItem('patika_meeting_requests');
    return saved ? JSON.parse(saved) : initialRequests;
  });
  
  // Settings State
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('patika_system_settings');
    return saved ? JSON.parse(saved) : {
      calendarId: "",
      smtpHost: "smtp.gmail.com",
      smtpPort: "587",
      smtpUser: "",
      smtpPass: ""
    };
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('patika_meeting_forms', JSON.stringify(forms));
  }, [forms]);

  useEffect(() => {
    localStorage.setItem('patika_meeting_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    localStorage.setItem('patika_system_settings', JSON.stringify(settings));
  }, [settings]);

  // Edit Form Temporary State
  const [editFormData, setEditFormData] = useState<MeetingForm | null>(null);
  const [tempDateInput, setTempDateInput] = useState("");
  
  // Ref for Date Input to trigger picker programmatically
  const dateInputRef = useRef<HTMLInputElement>(null);

  // AI Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<{ requestId: number, newStatus: MeetingStatus } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- Helpers ---
  
  const getStats = (formId: number) => {
    const formRequests = requests.filter(r => r.formId === formId);
    return {
      pending: formRequests.filter(r => r.status === 'pending').length,
      approved: formRequests.filter(r => r.status === 'approved').length,
      rejected: formRequests.filter(r => r.status === 'rejected').length,
    };
  };

  const generateAIEmail = async (req: MeetingRequest, newStatus: MeetingStatus) => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Sen bir anaokulu yöneticisisin. Aşağıdaki bilgilere göre veliye gönderilmek üzere nazik, profesyonel ve sıcak bir dille Türkçe bir e-posta taslağı oluştur.
        
        Veli Adı: ${req.parentName}
        Öğrenci Adı: ${req.studentName}
        Toplantı Tarihi: ${req.date}
        Toplantı Saati: ${req.time}
        Durum: ${newStatus === 'approved' ? 'ONAYLANDI' : 'REDDEDİLDİ'}
        
        ${newStatus === 'approved' 
          ? 'Onay mesajında: Randevunun onaylandığını, belirtilen saatte kendilerini beklediğimizi ve bu sürenin çocuğun gelişimi için önemli olduğunu vurgula. Ayrıca takvim davetinin eklendiğini belirt.' 
          : 'Red mesajında: Yoğunluk sebebiyle bu saat diliminin dolduğunu, çok üzgün olduğumuzu belirt ve farklı bir saat için iletişime geçmelerini veya sistemden yeni randevu almalarını rica et.'}
        
        Sadece e-posta içeriğini döndür (Konu başlığı ile başla).
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      
      setGeneratedEmail(response.text || "E-posta oluşturulamadı.");
      setShowEmailModal(true);

    } catch (error) {
      console.error("AI Error:", error);
      alert("E-posta oluşturulurken bir hata oluştu: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChangeClick = async (requestId: number, newStatus: MeetingStatus) => {
    if (newStatus === 'pending') {
      setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
      return;
    }

    const request = requests.find(r => r.id === requestId);
    if (request) {
      setPendingStatusChange({ requestId, newStatus });
      await generateAIEmail(request, newStatus);
    }
  };

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      const { requestId, newStatus } = pendingStatusChange;
      setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
      if (newStatus === 'approved' && settings.calendarId) {
        console.log(`Adding event to Google Calendar ID: ${settings.calendarId}`);
      }
      setShowEmailModal(false);
      setPendingStatusChange(null);
      setGeneratedEmail("");
    }
  };
  
  const handleAddToCalendar = (req: MeetingRequest) => {
    const dateParts = req.date.split('-');
    const timeParts = req.time.split(':');
    
    const start = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]), parseInt(timeParts[0]), parseInt(timeParts[1]));
    const end = new Date(start.getTime() + 30 * 60000); // Add 30 minutes
    
    const formatForLink = (date: Date) => {
      return date.toISOString().replace(/-|:|\.\d\d\d/g, "");
    };

    const startTime = formatForLink(start);
    const endTime = formatForLink(end);
    
    const title = encodeURIComponent(`Veli Toplantısı - ${req.studentName}`);
    const details = encodeURIComponent(`Veli: ${req.parentName}\nÖğrenci: ${req.studentName}\nOkul: Patika Çocuk Yuvası`);
    
    let url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}`;
    
    if (settings.calendarId) {
        console.log(`Using configured Calendar ID: ${settings.calendarId}`);
    }
    
    window.open(url, '_blank');
  };

  const handleManageClick = (formId: number) => {
    setSelectedFormId(formId);
    setActiveView('meeting-manage');
  };

  const handleEditClick = (formId: number) => {
    const formToEdit = forms.find(f => f.id === formId);
    if (formToEdit) {
      setEditFormData(JSON.parse(JSON.stringify(formToEdit))); // Deep copy
      setSelectedFormId(formId);
      setActiveView('meeting-edit');
    }
  };

  const handleCreateNewClick = () => {
    const newForm: MeetingForm = {
      id: Date.now(),
      title: 'Yeni Toplantı Formu',
      dates: [],
      dailyStartTime: '09:00',
      dailyEndTime: '16:00',
      durationMinutes: 20,
      bufferMinutes: 10,
      isActive: false,
      classes: [
        { id: 1, name: 'Güneş Sınıfı (3-4 Yaş)', isIncluded: true, assignedTeachers: [] },
        { id: 2, name: 'Kelebekler Sınıfı (4-5 Yaş)', isIncluded: true, assignedTeachers: [] },
        { id: 3, name: 'Gökkuşağı Sınıfı (5-6 Yaş)', isIncluded: true, assignedTeachers: [] },
        { id: 4, name: 'Branş Dersleri', isIncluded: true, assignedTeachers: [] },
      ]
    };
    setEditFormData(newForm);
    setSelectedFormId(null);
    setActiveView('meeting-edit');
  };

  // --- Edit Screen Logic ---

  const handleAddDate = () => {
    if (tempDateInput && editFormData && !editFormData.dates.includes(tempDateInput)) {
      setEditFormData({
        ...editFormData,
        dates: [...editFormData.dates, tempDateInput].sort()
      });
      setTempDateInput("");
    }
  };

  const handleRemoveDate = (dateToRemove: string) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        dates: editFormData.dates.filter(d => d !== dateToRemove)
      });
    }
  };

  const toggleClassInclusion = (classId: number) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        classes: editFormData.classes.map(c => 
          c.id === classId ? { ...c, isIncluded: !c.isIncluded } : c
        )
      });
    }
  };

  const addTeacherToClass = (classId: number, teacherIdString: string) => {
    const teacherId = parseInt(teacherIdString);
    if (!teacherId) return; // Handle "select..." option

    const teacherToAdd = allSystemTeachers.find(t => t.id === teacherId);
    if (editFormData && teacherToAdd) {
      setEditFormData({
        ...editFormData,
        classes: editFormData.classes.map(c => {
          if (c.id === classId && !c.assignedTeachers.find(t => t.id === teacherId)) {
            return { ...c, assignedTeachers: [...c.assignedTeachers, teacherToAdd] };
          }
          return c;
        })
      });
    }
  };

  const removeTeacherFromClass = (classId: number, teacherId: number) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        classes: editFormData.classes.map(c => {
          if (c.id === classId) {
            return { ...c, assignedTeachers: c.assignedTeachers.filter(t => t.id !== teacherId) };
          }
          return c;
        })
      });
    }
  };

  const handleSaveForm = () => {
    if (editFormData) {
      const updatedForms = selectedFormId 
        ? forms.map(f => f.id === selectedFormId ? editFormData : f)
        : [...forms, { ...editFormData, isActive: true }];
      
      setForms(updatedForms);
      setActiveView('meetings');
    }
  };


  // --- Views ---

  const renderDashboard = () => (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Bekleyen Randevu</span>
            <span className="text-2xl font-black text-text-main dark:text-white">{requests.filter(r => r.status === 'pending').length}</span>
          </div>
          <div className="size-12 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">calendar_clock</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Aktif Formlar</span>
            <span className="text-2xl font-black text-text-main dark:text-white">{forms.filter(f => f.isActive).length}</span>
          </div>
          <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">post_add</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Kayıtlı Veli</span>
            <span className="text-2xl font-black text-text-main dark:text-white">148</span>
          </div>
          <div className="size-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">diversity_1</span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Reddedilen</span>
            <span className="text-2xl font-black text-secondary dark:text-red-400">{requests.filter(r => r.status === 'rejected').length}</span>
          </div>
          <div className="size-12 rounded-xl bg-red-50 dark:bg-red-900/20 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">priority_high</span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-text-main dark:text-white">Haftalık Katılım Analizi</h3>
          <select className="text-sm bg-gray-50 dark:bg-white/5 border-none rounded-lg px-3 py-1.5 text-text-main dark:text-white cursor-pointer hover:bg-gray-100 transition-colors">
            <option>Bu Hafta</option>
            <option>Geçen Hafta</option>
          </select>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
              />
              <Bar dataKey="attendance" fill="#f48c25" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderMeetingFormsList = () => (
    <div className="flex flex-col gap-6 animate-fadeIn max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">Aktif Veli Toplantısı Formları</h2>
        <button 
          onClick={handleCreateNewClick}
          className="flex items-center gap-2 rounded-xl h-11 px-5 bg-primary hover:bg-orange-600 text-white text-sm font-bold transition-transform active:scale-95 shadow-md"
        >
          <span className="material-symbols-outlined text-xl">add</span>
          Yeni Toplantı Formu Oluştur
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 font-bold text-text-muted uppercase text-xs tracking-wider">Etkinlik Başlığı</th>
                <th className="px-6 py-4 font-bold text-text-muted uppercase text-xs tracking-wider">Durum İstatistikleri</th>
                <th className="px-6 py-4 font-bold text-text-muted uppercase text-xs tracking-wider">Tarih Aralığı</th>
                <th className="px-6 py-4 font-bold text-text-muted uppercase text-xs tracking-wider text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {forms.map(form => {
                const stats = getStats(form.id);
                const dateRange = form.dates.length > 0 
                  ? `${form.dates[0]}, ${form.dates[form.dates.length - 1]}` 
                  : 'Tarih Girilmedi';

                return (
                  <tr key={form.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-5">
                      <span className="font-bold text-text-main dark:text-white text-base">{form.title}</span>
                      <div className="mt-1 flex items-center gap-2">
                         <span className={`size-2 rounded-full ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                         <span className="text-xs text-text-muted">{form.isActive ? 'Aktif' : 'Pasif'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div title="Bekleyen" className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-md text-xs font-bold border border-yellow-200 dark:border-yellow-900/50">
                           <span className="material-symbols-outlined text-sm">schedule</span>
                           {stats.pending}
                         </div>
                         <div title="Onaylanan" className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-md text-xs font-bold border border-green-200 dark:border-green-900/50">
                           <span className="material-symbols-outlined text-sm">check</span>
                           {stats.approved}
                         </div>
                         <div title="Reddedilen" className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-1 rounded-md text-xs font-bold border border-red-200 dark:border-red-900/50">
                           <span className="material-symbols-outlined text-sm">close</span>
                           {stats.rejected}
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-text-muted dark:text-gray-400 font-medium">
                      {dateRange}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => handleManageClick(form.id)}
                          className="text-primary hover:text-orange-600 font-bold text-sm transition-colors"
                        >
                          Yönet
                        </button>
                        <button 
                          onClick={() => handleEditClick(form.id)}
                          className="text-gray-400 hover:text-text-main dark:hover:text-white font-medium text-sm transition-colors"
                        >
                          Düzenle
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderMeetingManagement = () => {
    const activeForm = forms.find(f => f.id === selectedFormId);
    const activeRequests = requests.filter(r => r.formId === selectedFormId);

    return (
      <div className="flex flex-col gap-6 animate-fadeIn max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-2">
           <button 
             onClick={() => setActiveView('meetings')}
             className="size-10 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
           >
             <span className="material-symbols-outlined">arrow_back</span>
           </button>
           <div>
             <div className="text-xs font-bold text-primary uppercase tracking-wider">Liste Yönetimi</div>
             <h2 className="text-2xl font-bold text-text-main dark:text-white">{activeForm?.title} - Katılım Listesi</h2>
           </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                <tr>
                  <th className="px-6 py-4 font-bold text-text-muted">Veli Adı</th>
                  <th className="px-6 py-4 font-bold text-text-muted">Öğrenci</th>
                  <th className="px-6 py-4 font-bold text-text-muted">Talep Edilen Tarih</th>
                  <th className="px-6 py-4 font-bold text-text-muted">Durum</th>
                  <th className="px-6 py-4 font-bold text-text-muted text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {activeRequests.length > 0 ? activeRequests.map(req => (
                  <tr key={req.id} className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-text-main dark:text-white">{req.parentName}</td>
                    <td className="px-6 py-4 text-text-muted dark:text-gray-400">{req.studentName}</td>
                    <td className="px-6 py-4 text-text-muted dark:text-gray-400">{req.date}, {req.time}</td>
                    <td className="px-6 py-4">
                      {req.status === 'pending' && (
                        <span className="inline-flex items-center rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-bold text-yellow-700 ring-1 ring-inset ring-yellow-600/20">Bekliyor</span>
                      )}
                      {req.status === 'approved' && (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20">Onaylandı</span>
                      )}
                      {req.status === 'rejected' && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 ring-1 ring-inset ring-red-600/20">Reddedildi</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex justify-end gap-3">
                           <button 
                             onClick={() => handleStatusChangeClick(req.id, 'approved')}
                             disabled={isGenerating}
                             className="text-green-600 hover:text-green-700 font-bold text-xs bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 transition-colors disabled:opacity-50"
                           >
                             Onayla
                           </button>
                           <button 
                             onClick={() => handleStatusChangeClick(req.id, 'rejected')}
                             disabled={isGenerating}
                             className="text-red-600 hover:text-red-700 font-bold text-xs bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 transition-colors disabled:opacity-50"
                           >
                             Reddet
                           </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 items-center">
                          {req.status === 'approved' && (
                            <button 
                              onClick={() => handleAddToCalendar(req)}
                              title="Takvime Ekle"
                              className="text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 flex items-center justify-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-lg">event_available</span>
                            </button>
                          )}
                          <button 
                             onClick={() => handleStatusChangeClick(req.id, 'pending')}
                             className="text-gray-400 hover:text-text-main text-xs underline ml-2"
                          >
                            Durumu Sıfırla
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-text-muted">Bu form için henüz bir talep bulunmamaktadır.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMeetingEdit = () => {
    if (!editFormData) return null;

    return (
      <div className="flex flex-col gap-6 animate-fadeIn max-w-4xl mx-auto pb-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setActiveView('meetings')}
               className="size-10 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
             >
               <span className="material-symbols-outlined">arrow_back</span>
             </button>
             <h2 className="text-2xl font-bold text-text-main dark:text-white">
               {editFormData.id ? 'Form Düzenle' : 'Yeni Form'}
             </h2>
          </div>
          <button 
            onClick={handleSaveForm}
            className="flex items-center gap-2 rounded-xl h-11 px-6 bg-primary hover:bg-orange-600 text-white font-bold transition-transform active:scale-95 shadow-lg"
          >
            <span className="material-symbols-outlined">save</span>
            Kaydet
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-text-main dark:text-white mb-4">Temel Bilgiler</h3>
            <label className="block">
              <span className="text-xs font-bold text-text-muted">Etkinlik Başlığı</span>
              <input 
                type="text" 
                value={editFormData.title}
                onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold text-text-muted">Başlangıç Saati</span>
                <input 
                  type="time" 
                  value={editFormData.dailyStartTime}
                  onChange={(e) => setEditFormData({ ...editFormData, dailyStartTime: e.target.value })}
                  className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-text-muted">Bitiş Saati</span>
                <input 
                  type="time" 
                  value={editFormData.dailyEndTime}
                  onChange={(e) => setEditFormData({ ...editFormData, dailyEndTime: e.target.value })}
                  className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold text-text-muted">Görüşme Süresi (dk)</span>
                <input 
                  type="number" 
                  value={editFormData.durationMinutes}
                  onChange={(e) => setEditFormData({ ...editFormData, durationMinutes: parseInt(e.target.value) })}
                  className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-text-muted">Ara Süresi (dk)</span>
                <input 
                  type="number" 
                  value={editFormData.bufferMinutes}
                  onChange={(e) => setEditFormData({ ...editFormData, bufferMinutes: parseInt(e.target.value) })}
                  className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                />
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
            <h3 className="font-bold text-lg text-text-main dark:text-white mb-4">Tarihler</h3>
            <div className="flex gap-2">
              <input 
                type="date"
                ref={dateInputRef}
                value={tempDateInput}
                onChange={(e) => setTempDateInput(e.target.value)}
                className="flex-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
              />
              <button 
                onClick={handleAddDate}
                className="h-10 px-4 bg-primary/10 text-primary font-bold rounded-lg hover:bg-primary hover:text-white transition-colors"
              >
                Ekle
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {editFormData.dates.map(date => (
                <div key={date} className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-lg text-sm">
                  <span>{date}</span>
                  <button onClick={() => handleRemoveDate(date)} className="text-gray-400 hover:text-red-500">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              ))}
              {editFormData.dates.length === 0 && (
                <p className="text-text-muted text-sm italic">Henüz tarih eklenmedi.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
          <h3 className="font-bold text-lg text-text-main dark:text-white mb-4">Sınıflar ve Öğretmenler</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {editFormData.classes.map(cls => (
              <div key={cls.id} className={`p-4 rounded-xl border-2 transition-colors ${cls.isIncluded ? 'border-primary/20 bg-primary/5' : 'border-gray-100 dark:border-white/10'}`}>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-text-main dark:text-white">{cls.name}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={cls.isIncluded} onChange={() => toggleClassInclusion(cls.id)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                {cls.isIncluded && (
                  <div className="space-y-2">
                    {cls.assignedTeachers.map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg text-sm border border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-gray-400">{t.image}</span>
                          <span>{t.name}</span>
                        </div>
                        <button onClick={() => removeTeacherFromClass(cls.id, t.id)} className="text-red-400 hover:text-red-600">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    ))}
                    <select 
                      className="w-full h-9 px-2 rounded-lg text-xs border border-gray-200 dark:border-white/10 bg-white dark:bg-gray-800"
                      onChange={(e) => {
                         addTeacherToClass(cls.id, e.target.value);
                         e.target.value = "";
                      }}
                    >
                      <option value="">+ Öğretmen Ekle</option>
                      {allSystemTeachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.role})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto animate-fadeIn space-y-6">
      <h2 className="text-2xl font-bold text-text-main dark:text-white">Sistem Ayarları</h2>
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-text-main dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">integration_instructions</span>
          Entegrasyonlar
        </h3>
        
        <label className="block">
          <span className="text-xs font-bold text-text-muted">Google Calendar ID</span>
          <input 
            type="text" 
            value={settings.calendarId}
            onChange={(e) => setSettings({ ...settings, calendarId: e.target.value })}
            className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
            placeholder="example@group.calendar.google.com"
          />
        </label>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
        <h3 className="font-bold text-lg text-text-main dark:text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">mail</span>
          E-posta Sunucu Ayarları (SMTP)
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-bold text-text-muted">SMTP Host</span>
            <input 
              type="text" 
              value={settings.smtpHost}
              onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
              className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-text-muted">Port</span>
            <input 
              type="text" 
              value={settings.smtpPort}
              onChange={(e) => setSettings({ ...settings, smtpPort: e.target.value })}
              className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-xs font-bold text-text-muted">Kullanıcı Adı</span>
            <input 
              type="text" 
              value={settings.smtpUser}
              onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
              className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-text-muted">Şifre</span>
            <input 
              type="password" 
              value={settings.smtpPass}
              onChange={(e) => setSettings({ ...settings, smtpPass: e.target.value })}
              className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
            />
          </label>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 transition-colors">
          Ayarları Kaydet
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-white/5 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-center">
          <BrandLogo className="h-10" />
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'dashboard' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined">dashboard</span>
            Panel Özeti
          </button>
          <button 
            onClick={() => setActiveView('meetings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${['meetings', 'meeting-manage', 'meeting-edit'].includes(activeView) ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined">calendar_month</span>
            Toplantı Yönetimi
          </button>
          <button 
            onClick={() => setActiveView('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'settings' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            <span className="material-symbols-outlined">settings</span>
            Sistem Ayarları
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100 dark:border-white/5">
          <Link to="/" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
            <span className="material-symbols-outlined">logout</span>
            Güvenli Çıkış
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 sm:p-8 overflow-y-auto min-h-screen">
        <div className="md:hidden mb-6 flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
          <BrandLogo className="h-8" />
          <div className="flex gap-4">
             <button onClick={() => setActiveView('dashboard')} className="text-text-muted"><span className="material-symbols-outlined">dashboard</span></button>
             <button onClick={() => setActiveView('meetings')} className="text-text-muted"><span className="material-symbols-outlined">calendar_month</span></button>
             <Link to="/" className="text-red-500"><span className="material-symbols-outlined">logout</span></Link>
          </div>
        </div>

        {activeView === 'dashboard' && renderDashboard()}
        {activeView === 'meetings' && renderMeetingFormsList()}
        {activeView === 'meeting-manage' && renderMeetingManagement()}
        {activeView === 'meeting-edit' && renderMeetingEdit()}
        {activeView === 'settings' && renderSettings()}
      </main>

      {/* AI Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                AI E-posta Taslağı
              </h3>
              <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-red-500">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-xl text-sm">
                Gemini AI tarafından oluşturulan bu taslağı göndermeden önce düzenleyebilirsiniz.
              </div>
              <textarea 
                className="w-full h-64 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white font-mono text-sm leading-relaxed focus:border-primary outline-none resize-none"
                value={generatedEmail}
                onChange={(e) => setGeneratedEmail(e.target.value)}
              />
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex justify-end gap-3">
              <button 
                onClick={() => setShowEmailModal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:text-text-main hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                İptal Et
              </button>
              <button 
                onClick={confirmStatusChange}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white shadow-lg hover:bg-orange-600 transition-transform active:scale-95 flex items-center gap-2"
              >
                <span className="material-symbols-outlined">send</span>
                Onayla ve Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;