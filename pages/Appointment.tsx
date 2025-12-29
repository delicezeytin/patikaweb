import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// Types must match Admin.tsx exactly for local storage data
interface Teacher {
  id: number;
  name: string;
  role: string;
  image: string;
  branch: string;
}

interface ClassConfig {
  id: number;
  name: string;
  isIncluded: boolean;
  assignedTeachers: Teacher[];
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

// Helper interface for slot rendering
interface SlotStatus {
  time: string;
  status: 'available' | 'taken' | 'hidden';
}

// --- Default Data fallback for initialization (Matches Admin.tsx) ---
const allSystemTeachers: Teacher[] = [
  { id: 1, name: "Ayşe Yılmaz", role: "Sınıf Öğretmeni", branch: "3-4 Yaş Grubu", image: "face_3" },
  { id: 2, name: "Mehmet Demir", role: "Sınıf Öğretmeni", branch: "4-5 Yaş Grubu", image: "face_6" },
  { id: 3, name: "Zeynep Kaya", role: "Sınıf Öğretmeni", branch: "5-6 Yaş Grubu", image: "face_2" },
  { id: 4, name: "Canan Yıldız", role: "İngilizce Öğretmeni", branch: "Tüm Yaş Grupları", image: "face_4" },
  { id: 5, name: "Elif Öztürk", role: "Yardımcı Öğretmen", branch: "3-4 Yaş Grubu", image: "face_5" },
  { id: 6, name: "Burak Şen", role: "Spor Öğretmeni", branch: "Tüm Yaş Grupları", image: "sports_handball" },
];

const initialDefaultForms: MeetingForm[] = [
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
        assignedTeachers: [allSystemTeachers[0], allSystemTeachers[4]]
      },
      {
        id: 102,
        name: 'Kelebekler Sınıfı (4-5 Yaş)',
        isIncluded: true,
        assignedTeachers: [allSystemTeachers[1]]
      },
      {
        id: 103,
        name: 'Gökkuşağı Sınıfı (5-6 Yaş)',
        isIncluded: true,
        assignedTeachers: [allSystemTeachers[2]]
      },
      {
        id: 104,
        name: 'Branş Dersleri',
        isIncluded: true,
        assignedTeachers: [allSystemTeachers[3], allSystemTeachers[5]]
      }
    ]
  },
];

const Appointment: React.FC = () => {
  // Step 1: Verification, 2: Class, 3: Date, 4: Info, 5: Success
  const [step, setStep] = useState(1);

  // OTP States
  const [email, setEmail] = useState("");
  const [otpStage, setOtpStage] = useState<'input' | 'verify'>('input'); // 'input' for email, 'verify' for code
  const [otpValues, setOtpValues] = useState<string[]>(new Array(6).fill(""));
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [timer, setTimer] = useState(120); // 2 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Appointment Data (Dynamically Loaded)
  const [classes, setClasses] = useState<ClassConfig[]>([]);
  const [dates, setDates] = useState<{ day: string, date: string, raw: string }[]>([]);
  const [allPossibleSlots, setAllPossibleSlots] = useState<string[]>([]); // Stores ALL theoretical slots
  const [visibleSlots, setVisibleSlots] = useState<SlotStatus[]>([]); // Stores computed visible slots
  const [activeFormTitle, setActiveFormTitle] = useState("");
  const [activeFormId, setActiveFormId] = useState<number | null>(null);
  const [noActiveForm, setNoActiveForm] = useState(false);

  // User Selections
  const [selectedClass, setSelectedClass] = useState<ClassConfig | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(""); // Stores raw date string (YYYY-MM-DD)
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [formData, setFormData] = useState({
    parentName: "",
    studentName: "",
    phone: "",
    email: "", // Will be filled from verification step
  });

  // Load Active Form Data from LocalStorage
  useEffect(() => {
    const loadFormData = () => {
      try {
        let savedForms = localStorage.getItem('patika_meeting_forms');

        // --- FIX: Initialize default data if LocalStorage is empty ---
        if (!savedForms) {
          console.warn("LocalStorage empty, initializing default forms...");
          localStorage.setItem('patika_meeting_forms', JSON.stringify(initialDefaultForms));
          savedForms = JSON.stringify(initialDefaultForms);
        }
        // -------------------------------------------------------------

        let forms: MeetingForm[];
        try {
          forms = JSON.parse(savedForms);
        } catch (e) {
          console.error("Failed to parse forms from localStorage", e);
          setNoActiveForm(true);
          return;
        }

        const activeForm = forms.find(f => f.isActive);

        if (!activeForm) {
          console.warn("No active form found in list");
          setNoActiveForm(true);
          return;
        }

        // Data Integrity Checks & Fallbacks
        if (!Array.isArray(activeForm.classes)) activeForm.classes = [];
        if (!Array.isArray(activeForm.dates)) activeForm.dates = [];

        setActiveFormTitle(activeForm.title);
        setActiveFormId(activeForm.id);

        // 1. Get included classes
        const includedClasses = activeForm.classes.filter(cls => cls.isIncluded);
        setClasses(includedClasses);

        // 2. Format Dates
        // Input: "2024-10-20" -> Output: { day: "Pzt", date: "20 Ekim", raw: "2024-10-20" }
        const formattedDates = activeForm.dates.map(dateStr => {
          try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) throw new Error("Invalid Date");
            const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' }); // Pzt
            const dayMonth = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }); // 20 Ekim
            return { day: dayName, date: dayMonth, raw: dateStr };
          } catch (e) {
            return null;
          }
        }).filter(d => d !== null) as { day: string, date: string, raw: string }[];

        setDates(formattedDates);


        // 3. Generate Time Slots
        const generateSlots = () => {
          const slots: string[] = [];

          if (!activeForm.dailyStartTime || !activeForm.dailyEndTime) return [];

          const toMinutes = (time: string) => {
            if (!time) return 0;
            const parts = time.split(':');
            if (parts.length < 2) return 0;
            const h = parseInt(parts[0]);
            const m = parseInt(parts[1]);
            return h * 60 + m;
          };

          const toTime = (mins: number) => {
            const h = Math.floor(mins / 60);
            const m = mins % 60;
            return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
          };

          const startMins = toMinutes(activeForm.dailyStartTime);
          const endMins = toMinutes(activeForm.dailyEndTime);
          const stepMins = (activeForm.durationMinutes || 20) + (activeForm.bufferMinutes || 0);

          // Hardcoded Lunch Logic per Requirement: 12:00 - 13:00 (Break), First afternoon slot 13:30
          // This means NO slots starting between 12:00 (inclusive) and 13:30 (exclusive).
          const lunchStartMins = 12 * 60; // 12:00
          const afternoonStartMins = 13 * 60 + 30; // 13:30

          let current = startMins;

          // Safety break to prevent infinite loops if stepMins is 0
          if (stepMins <= 0) return [];

          while (current + (activeForm.durationMinutes || 20) <= endMins) {
            // Check if this slot falls into the lunch break dead zone
            if (current >= lunchStartMins && current < afternoonStartMins) {
              // Jump to afternoon start
              current = afternoonStartMins;
              continue;
            }

            slots.push(toTime(current));
            current += stepMins;
          }
          return slots;
        };

        setAllPossibleSlots(generateSlots());

      } catch (error) {
        console.error("Critical Error loading form data:", error);
        setNoActiveForm(true);
      }
    };

    loadFormData();
  }, []);

  // --- SEQUENTIAL SLOT UNLOCKING LOGIC ---
  useEffect(() => {
    if (!selectedDate || !selectedClass || allPossibleSlots.length === 0) {
      setVisibleSlots([]);
      return;
    }

    // 1. Get taken times for this class on this date
    const requests = JSON.parse(localStorage.getItem('patika_meeting_requests') || '[]');
    const takenTimes = requests
      .filter((r: any) =>
        r.formId === activeFormId &&
        r.date === selectedDate &&
        r.classId === selectedClass.id && // Must match class!
        r.status !== 'rejected' // Rejected slots become free again
      )
      .map((r: any) => r.time);

    // 2. Define Sessions
    // Morning: Start - 12:00
    // Afternoon: 13:00 - End
    // Note: The allPossibleSlots logic already excludes the 12:00-13:30 gap, 
    // so we just split by a pivot time (e.g. 12:30) to separate sessions logically.

    const morningAll = allPossibleSlots.filter(t => t < "12:30");
    const afternoonAll = allPossibleSlots.filter(t => t >= "12:30");

    const processSession = (sessionSlots: string[]): SlotStatus[] => {
      const result: SlotStatus[] = [];
      let foundFirstAvailable = false;

      for (const time of sessionSlots) {
        if (takenTimes.includes(time)) {
          // This slot is booked -> Show it as disabled so users see it's taken
          result.push({ time, status: 'taken' });
        } else {
          // This slot is free
          if (!foundFirstAvailable) {
            // It's the FIRST free slot in this session -> Show it as available
            result.push({ time, status: 'available' });
            foundFirstAvailable = true;
          } else {
            // We already found the next available slot -> HIDE this future slot
            result.push({ time, status: 'hidden' });
          }
        }
      }
      return result;
    };

    const morningProcessed = processSession(morningAll);
    const afternoonProcessed = processSession(afternoonAll);

    setVisibleSlots([...morningProcessed, ...afternoonProcessed]);

  }, [selectedDate, selectedClass, allPossibleSlots, activeFormId, step]);


  // Timer Logic
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerActive(false);
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timer]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // OTP Functions
  const handleSendOtp = () => {
    if (!email || !email.includes('@')) {
      alert("Lütfen geçerli bir e-posta adresi giriniz.");
      return;
    }

    // Generate random 6 digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);

    setOtpStage('verify');
    setTimer(120);
    setIsTimerActive(true);
    setOtpValues(new Array(6).fill(""));

    // Auto fill email in formData
    setFormData(prev => ({ ...prev, email: email }));
  };

  const handleResendOtp = () => {
    handleSendOtp();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const enteredOtp = otpValues.join("");
    if (enteredOtp === generatedOtp) {
      setStep(2); // Proceed to Teacher Selection
    } else {
      alert("Hatalı kod girdiniz, lütfen tekrar deneyin.");
      setOtpValues(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  // Wizard Navigation
  const handleNext = () => {
    if (step === 2 && selectedClass) setStep(3);
    else if (step === 3 && selectedDate && selectedTime) setStep(4);
    else if (step === 4 && formData.parentName && formData.phone) {
      // SAVE REQUEST TO LOCAL STORAGE
      try {
        const newRequest = {
          id: Date.now(),
          formId: activeFormId || 0,
          classId: selectedClass?.id, // Important: Save Class ID
          className: selectedClass?.name, // Save class name for display
          parentName: formData.parentName,
          studentName: formData.studentName,
          phone: formData.phone, // Added Phone
          email: formData.email, // Added Email
          date: selectedDate, // Saving raw date YYYY-MM-DD
          time: selectedTime,
          status: 'pending'
        };

        const existingRequests = JSON.parse(localStorage.getItem('patika_meeting_requests') || '[]');
        existingRequests.push(newRequest);
        localStorage.setItem('patika_meeting_requests', JSON.stringify(existingRequests));

        console.log("Request saved:", newRequest);
      } catch (error) {
        console.error("Error saving request:", error);
      }

      setStep(5);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      // If going back to step 1 (OTP), reset to verify stage if email is present
      if (step === 2) {
        setStep(1);
      } else {
        setStep(step - 1);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAutoFillOtp = () => {
    setOtpValues(generatedOtp.split(''));
  };

  // Helper to get display date
  const getDisplayDate = (rawDate: string) => {
    const d = dates.find(d => d.raw === rawDate);
    return d ? `${d.date} (${d.day})` : rawDate;
  };

  if (noActiveForm) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="size-24 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-gray-400">calendar_off</span>
        </div>
        <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">Aktif Randevu Formu Bulunamadı</h2>
        <p className="text-text-muted dark:text-gray-400 mb-8 max-w-md">
          Şu anda aktif bir veli toplantısı dönemi bulunmamaktadır veya form verilerinde bir hata oluştu. Lütfen okul yönetimi ile iletişime geçiniz.
        </p>
        <Link to="/" className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-orange-600">
          Anasayfaya Dön
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] w-full flex flex-col items-center py-12 px-4 sm:px-10">

      {/* Header Text */}
      <div className="text-center mb-10 max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white mb-3">Veli Toplantı Randevusu</h1>
        <p className="text-text-muted dark:text-gray-400 text-lg">
          {activeFormTitle && <span className="block text-primary font-bold text-sm uppercase tracking-widest mb-2">{activeFormTitle}</span>}
          {step === 1 ? "Güvenliğiniz için lütfen e-posta adresinizi doğrulayın." : "Çocuğunuzun sınıfını seçerek görüşme talebinizi oluşturun."}
        </p>
      </div>

      {/* Stepper */}
      <div className="w-full max-w-4xl mb-12 hidden md:block">
        <div className="relative flex items-center justify-between w-full">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 rounded-full"></div>
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${((step - 1) / 4) * 100}%` }}
          ></div>

          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`flex flex-col items-center gap-2 ${step >= s ? 'text-primary' : 'text-gray-400'}`}>
              <div
                className={`size-10 rounded-full flex items-center justify-center font-bold text-lg border-4 transition-all duration-300
                ${step >= s ? 'bg-primary border-primary text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600'}
                ${step === s ? 'scale-110 shadow-lg' : ''}
                `}
              >
                {step > s ? <span className="material-symbols-outlined font-bold">check</span> : s}
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">
                {s === 1 && "Doğrulama"}
                {s === 2 && "Sınıf"}
                {s === 3 && "Zaman"}
                {s === 4 && "Bilgiler"}
                {s === 5 && "Onay"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 dark:border-white/5 min-h-[400px] relative overflow-hidden">

        {/* Step 1: OTP Verification */}
        {step === 1 && (
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-4 animate-fadeIn">

            {otpStage === 'input' ? (
              // EMAIL INPUT STAGE
              <>
                <div className="size-20 rounded-full bg-orange-50 dark:bg-orange-900/20 text-primary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl">mail</span>
                </div>
                <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">E-posta Doğrulama</h2>
                <p className="text-text-muted dark:text-gray-400 mb-8 text-sm">
                  Veli toplantısı randevusu oluşturmak için lütfen e-posta adresinizi girerek süreci başlatın.
                </p>

                <div className="w-full flex flex-col gap-6">
                  <div className="flex flex-col items-start gap-2 text-left">
                    <span className="text-sm font-bold text-text-main dark:text-gray-300 ml-1">E-posta Adresiniz</span>
                    <div className="relative w-full">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined">alternate_email</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="veli@ornek.com"
                        className="w-full h-14 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-background-light dark:bg-background-dark text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20 rounded-xl p-4 flex gap-3 text-left">
                    <span className="material-symbols-outlined text-primary shrink-0">security</span>
                    <p className="text-xs text-text-muted dark:text-gray-400 leading-relaxed">
                      Güvenliğiniz için size tek kullanımlık bir doğrulama kodu (OTP) göndereceğiz. Bu kod ile işleminize devam edebilirsiniz.
                    </p>
                  </div>

                  <button
                    onClick={handleSendOtp}
                    className="w-full h-14 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    OTP Gönder
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </>
            ) : (
              // CODE VERIFICATION STAGE
              <>
                <div className="size-20 rounded-full bg-red-50 dark:bg-red-900/20 text-secondary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-4xl">lock</span>
                </div>
                <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">E-posta Doğrulama</h2>
                <p className="text-text-muted dark:text-gray-400 mb-4 text-sm">
                  Lütfen <span className="font-bold text-text-main dark:text-white">{email}</span> adresine gönderilen 6 haneli doğrulama kodunu giriniz.
                </p>

                {/* TEST OTP DISPLAY */}
                <div
                  onClick={handleAutoFillOtp}
                  className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-900/30 text-sm font-mono shadow-sm cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  title="Kodu otomatik doldurmak için tıklayın"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm">bug_report</span>
                    <span>TEST MODU: OTP Kodunuz <strong>{generatedOtp}</strong> (Doldurmak için tıkla)</span>
                  </div>
                </div>

                <div className="w-full flex flex-col items-center gap-8">
                  <div className="flex gap-2 sm:gap-4 justify-center w-full">
                    {otpValues.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => { inputRefs.current[index] = el; }}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`size-10 sm:size-14 rounded-xl border-2 text-center text-xl sm:text-2xl font-bold bg-white dark:bg-background-dark outline-none transition-all
                          ${digit
                            ? 'border-primary text-primary shadow-md'
                            : 'border-gray-200 dark:border-gray-700 text-text-main dark:text-white focus:border-primary/50'
                          }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleVerifyOtp}
                    className="w-full h-14 bg-secondary hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-secondary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Doğrula ve Devam Et
                    <span className="material-symbols-outlined">check</span>
                  </button>

                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm text-text-muted dark:text-gray-400">
                      Kod gelmedi mi?{" "}
                      <button
                        onClick={handleResendOtp}
                        disabled={isTimerActive}
                        className={`font-bold underline ${isTimerActive ? 'text-gray-400 cursor-not-allowed' : 'text-text-main dark:text-white hover:text-primary cursor-pointer'}`}
                      >
                        Tekrar Gönder
                      </button>
                    </p>
                    {isTimerActive && (
                      <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                        <span className="material-symbols-outlined text-sm">timer</span>
                        {formatTime(timer)} içinde tekrar gönderebilirsiniz
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setOtpStage('input');
                      setOtpValues(new Array(6).fill(""));
                      setTimer(0);
                    }}
                    className="text-xs text-gray-400 hover:text-text-main mt-4 flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    E-postayı Değiştir
                  </button>
                </div>
              </>
            )}

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 w-full flex justify-center gap-6 text-xs text-gray-400">
              <span className="flex items-center gap-1 cursor-pointer hover:text-primary"><span className="material-symbols-outlined text-sm">help</span> Yardım</span>
              <span className="flex items-center gap-1 cursor-pointer hover:text-primary">Gizlilik Politikası</span>
            </div>
          </div>
        )}

        {/* Step 2: Class Selection */}
        {step === 2 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">school</span>
              Çocuğunuzun Sınıfını Seçin
            </h2>
            {classes.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {classes.map((cls) => (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 hover:shadow-md
                      ${selectedClass?.id === cls.id
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-100 dark:border-gray-700 hover:border-primary/50 bg-white dark:bg-gray-800'
                      }`}
                  >
                    <div className={`size-16 rounded-full flex items-center justify-center text-3xl
                      ${selectedClass?.id === cls.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}
                    `}>
                      <span className="material-symbols-outlined">groups</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-text-main dark:text-white text-lg">{cls.name}</h3>
                      <p className="text-primary text-sm font-medium">
                        {cls.assignedTeachers?.map(t => t.name).join(', ') || 'Öğretmen atanmadı'}
                      </p>
                    </div>
                    {selectedClass?.id === cls.id && (
                      <div className="ml-auto text-primary">
                        <span className="material-symbols-outlined">check_circle</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                <p className="text-text-muted">Bu toplantı formu için atanmış sınıf bulunamadı.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date & Time Selection (Previously Step 2) */}
        {step === 3 && (
          <div className="flex flex-col gap-8 animate-fadeIn">
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">calendar_month</span>
                Tarih Seçin
              </h2>
              {dates.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {dates.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(d.raw)}
                      className={`flex flex-col items-center justify-center min-w-[80px] h-20 rounded-xl border-2 transition-all
                        ${selectedDate === d.raw
                          ? 'border-primary bg-primary text-white shadow-lg'
                          : 'border-gray-100 dark:border-gray-700 text-text-muted dark:text-gray-400 hover:border-primary/50'
                        }`}
                    >
                      <span className="text-sm font-medium opacity-80">{d.day}</span>
                      <span className="text-lg font-bold">{d.date.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-text-muted text-sm italic">Uygun tarih bulunamadı.</div>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">schedule</span>
                Saat Seçin
              </h2>
              {visibleSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {visibleSlots.map((slot, i) => {
                    if (slot.status === 'hidden') return null; // Don't render future slots

                    const isTaken = slot.status === 'taken';
                    const isSelected = selectedTime === slot.time;

                    return (
                      <button
                        key={i}
                        onClick={() => !isTaken && setSelectedTime(slot.time)}
                        disabled={isTaken}
                        className={`py-3 rounded-xl font-bold text-sm border-2 transition-all
                          ${isTaken
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-100 dark:border-gray-700 cursor-not-allowed decoration-slice line-through'
                            : isSelected
                              ? 'border-primary bg-primary text-white shadow-md'
                              : 'border-gray-100 dark:border-gray-700 text-text-main dark:text-white hover:border-primary/50'
                          }`}
                      >
                        {slot.time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-text-muted text-sm italic">
                  {selectedDate ? "Bu tarih için uygun saat bulunamadı veya tüm randevular dolu." : "Lütfen önce bir tarih seçin."}
                </div>
              )}
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl flex items-start gap-3 text-sm text-yellow-800 dark:text-yellow-200">
              <span className="material-symbols-outlined">info</span>
              <p>Öğretmenlerimizin program verimliliği için randevu saatleri sırasıyla açılmaktadır. Dolu olan saatler seçilemez.</p>
            </div>
          </div>
        )}

        {/* Step 4: Contact Form (Previously Step 3) */}
        {step === 4 && (
          <div className="flex flex-col gap-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">badge</span>
                Veli ve Öğrenci Bilgileri
              </h2>
              <div className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                <span className="material-symbols-outlined text-sm">verified_user</span>
                E-posta Doğrulandı
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-text-main dark:text-gray-300">Veli Adı Soyadı <span className="text-secondary">*</span></span>
                <input
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleInputChange}
                  className="w-full h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-background-dark px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                  placeholder="Adınız ve Soyadınız"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-text-main dark:text-gray-300">Öğrenci Adı Soyadı <span className="text-secondary">*</span></span>
                <input
                  name="studentName"
                  value={formData.studentName}
                  onChange={handleInputChange}
                  className="w-full h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-background-dark px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                  placeholder="Öğrencinin Adı"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-text-main dark:text-gray-300">Telefon Numarası <span className="text-secondary">*</span></span>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel"
                  className="w-full h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-background-dark px-4 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all dark:text-white"
                  placeholder="05XX XXX XX XX"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-text-main dark:text-gray-300">E-posta Adresi</span>
                <input
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800/50 px-4 text-gray-500 cursor-not-allowed outline-none"
                />
              </label>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex gap-4 mt-2">
              <div className="size-12 rounded-full bg-white flex items-center justify-center shrink-0 border border-primary/20">
                <span className="material-symbols-outlined text-primary text-2xl">groups</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Randevu Özeti</span>
                <p className="font-bold text-text-main dark:text-white">{selectedClass?.name}</p>
                <p className="text-sm text-text-muted">{getDisplayDate(selectedDate)} - {selectedTime}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Success (Previously Step 4) */}
        {step === 5 && (
          <div className="flex flex-col items-center justify-center text-center py-8 animate-fadeIn">
            <div className="size-24 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-6xl">check_circle</span>
            </div>
            <h2 className="text-3xl font-black text-text-main dark:text-white mb-4">Randevunuz Oluşturuldu!</h2>
            <p className="text-text-muted dark:text-gray-400 max-w-md mx-auto mb-8 text-lg">
              Sayın <strong>{formData.parentName}</strong>, randevu talebiniz alınmıştır. Toplantı talebiniz okul yönetimi tarafından kabul edildikten sonra e-posta adresiniz üzerinden bilgilendirme yapılacaktır.
            </p>

            <div className="bg-white dark:bg-gray-700/50 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-sm mb-8">
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-600 pb-3 mb-3">
                <span className="text-text-muted dark:text-gray-400 text-sm">Tarih</span>
                <span className="font-bold text-text-main dark:text-white">{getDisplayDate(selectedDate)} {selectedTime}</span>
              </div>
              <div className="flex justify-between items-center border-b border-gray-100 dark:border-gray-600 pb-3 mb-3">
                <span className="text-text-muted dark:text-gray-400 text-sm">Sınıf</span>
                <span className="font-bold text-text-main dark:text-white">{selectedClass?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted dark:text-gray-400 text-sm">Öğrenci</span>
                <span className="font-bold text-text-main dark:text-white">{formData.studentName}</span>
              </div>
            </div>

            <Link to="/" className="px-8 py-3 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">
              Anasayfaya Dön
            </Link>
          </div>
        )}

        {/* Navigation Buttons (Steps 2, 3, 4 only) */}
        {step > 1 && step < 5 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleBack}
              className="px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 text-text-muted hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Geri
            </button>
            <button
              onClick={handleNext}
              disabled={
                (step === 2 && !selectedClass) ||
                (step === 3 && (!selectedDate || !selectedTime)) ||
                (step === 4 && (!formData.parentName || !formData.phone))
              }
              className="px-8 py-2.5 bg-primary hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {step === 4 ? "Randevuyu Onayla" : "Devam Et"}
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointment;