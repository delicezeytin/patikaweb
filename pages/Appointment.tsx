import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { meetingService } from '../services/api';

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

// Initial default data removed in favor of API fetching

const Appointment: React.FC = () => {
  const location = useLocation(); // Hook to get URL params
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

  // --- REFACTORED STATE FOR API INTEGRATION ---
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);

  // Load Active Form Data from API
  useEffect(() => {
    const loadFormData = async () => {
      try {
        // 1. Fetch all forms
        const res = await meetingService.getAllForms();
        const forms: MeetingForm[] = res.data.forms || [];

        // Logic to determine which form to load
        let activeForm: MeetingForm | undefined;

        // Try to get ID from URL query param
        const searchParams = new URLSearchParams(location.search);
        const urlId = searchParams.get('id');

        if (urlId) {
          activeForm = forms.find(f => f.id.toString() === urlId);
        } else {
          // Fallback to the first 'isActive' form
          activeForm = forms.find(f => f.isActive);
        }

        if (!activeForm) {
          console.warn("No active form found");
          setNoActiveForm(true);
          return;
        }

        // Parse JSON fields if they come as strings (Prisma sometimes returns JSON as object, sometimes string depending on driver/middleware, usually object in simple fetch)
        // However, looking at the code, typical API response will be JSON.
        // Ensure classes is array
        if (typeof activeForm.classes === 'string') {
          try { activeForm.classes = JSON.parse(activeForm.classes); } catch (e) { }
        }
        if (typeof activeForm.dates === 'string') {
          try { activeForm.dates = JSON.parse(activeForm.dates); } catch (e) { }
        }

        setActiveFormTitle(activeForm.title);
        setActiveFormId(activeForm.id);

        // 1. Get included classes
        const includedClasses = (activeForm.classes || []).filter(cls => cls.isIncluded);
        setClasses(includedClasses);

        // 2. Format Dates
        const formattedDates = (activeForm.dates || []).map(dateStr => {
          try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) throw new Error("Invalid Date");
            const dayName = date.toLocaleDateString('tr-TR', { weekday: 'short' });
            const dayMonth = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
            const raw = date.toISOString().split('T')[0]; // Ensure YYYY-MM-DD
            return { day: dayName, date: dayMonth, raw: raw };
          } catch (e) {
            return null;
          }
        }).filter(d => d !== null) as { day: string, date: string, raw: string }[];

        setDates(formattedDates);

        // 3. Generate Time Slots
        const generateSlots = () => {
          const slots: string[] = [];
          if (!activeForm || !activeForm.dailyStartTime || !activeForm.dailyEndTime) return [];

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

          const lunchStartMins = 12 * 60; // 12:00
          const afternoonStartMins = 13 * 60 + 30; // 13:30

          let current = startMins;
          if (stepMins <= 0) return [];

          while (current + (activeForm.durationMinutes || 20) <= endMins) {
            if (current >= lunchStartMins && current < afternoonStartMins) {
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
  }, [location.search]);

  // --- REFACTORED SLOT AVAILABILITY LOGIC ---
  useEffect(() => {
    const updateVisibleSlots = async () => {
      if (!selectedDate || !selectedClass || allPossibleSlots.length === 0 || !activeFormId) {
        setVisibleSlots([]);
        return;
      }

      try {
        // Fetch booked slots from API
        // Note: In a real app we might cache this or pass current view date
        const res = await meetingService.getBookedSlots(activeFormId);
        const bookedSlots = res.data.slots || []; // Array of {date, time, classId}

        // Filter taken times for this date and class
        // Assuming "date" in DB matches "selectedDate" format (YYYY-MM-DD)
        const takenTimes = bookedSlots
          .filter((r: any) =>
            r.date === selectedDate &&
            r.classId === selectedClass.id
          )
          .map((r: any) => r.time);

        // Define Sessions
        const morningAll = allPossibleSlots.filter(t => t < "12:30");
        const afternoonAll = allPossibleSlots.filter(t => t >= "12:30");

        const processSession = (sessionSlots: string[]): SlotStatus[] => {
          const result: SlotStatus[] = [];
          let foundFirstAvailable = false;

          for (const time of sessionSlots) {
            if (takenTimes.includes(time)) {
              result.push({ time, status: 'taken' });
            } else {
              if (!foundFirstAvailable) {
                result.push({ time, status: 'available' });
                foundFirstAvailable = true;
              } else {
                result.push({ time, status: 'hidden' });
              }
            }
          }
          return result;
        };

        const morningProcessed = processSession(morningAll);
        const afternoonProcessed = processSession(afternoonAll);

        setVisibleSlots([...morningProcessed, ...afternoonProcessed]);

      } catch (error) {
        console.error("Error fetching slots:", error);
        setVisibleSlots([]); // Fail safe
      }
    };

    updateVisibleSlots();
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

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otpValues];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtpValues(newOtp);

    // Focus appropriate input
    const focusIndex = Math.min(5, pastedData.length);
    inputRefs.current[focusIndex]?.focus();
    if (pastedData.length === 6) {
      inputRefs.current[5]?.blur(); // Optional: blur if full
    }
  };

  // Wizard Navigation
  const handleNext = async () => {
    // Step 1: Class Selection -> Step 2
    if (step === 1 && selectedClass) {
      setStep(2);
    }
    // Step 2: Date/Time -> Step 3
    else if (step === 2 && selectedDate && selectedTime) {
      setStep(3);
    }
    // Step 3: Info -> Create Request (Pending OTP) -> Step 4 (OTP Input)
    else if (step === 3 && formData.parentName && formData.studentName && formData.phone && formData.email) {
      // Create Request on Server
      try {
        const reqData = {
          formId: activeFormId,
          classId: selectedClass?.id,
          className: selectedClass?.name,
          parentName: formData.parentName,
          studentName: formData.studentName,
          phone: formData.phone,
          email: formData.email,
          date: selectedDate,
          time: selectedTime,
          teacherId: selectedClass?.assignedTeachers?.[0]?.id // Optional, taking first
        };

        const res = await meetingService.createRequest(reqData);
        if (res.data.success) {
          setCreatedRequestId(res.data.requestId);
          setGeneratedOtp(""); // Clear client side OTP if any
          setEmail(formData.email); // Ensure email state is set for OTP screen
          setOtpStage('verify'); // Set to verify mode immediately
          setTimer(300); // 5 mins
          setIsTimerActive(true);
          setStep(4); // Go to OTP Step
        }
      } catch (error: any) {
        console.error("Error creating request:", error);
        alert(error.response?.data?.error || "Talep oluşturulurken bir hata oluştu.");
      }
    }
    // Step 4 is handled by handleVerifyOtp
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // Override handleVerifyOtp to use API
  const handleVerifyOtp = async () => {
    if (!createdRequestId) return;
    const enteredOtp = otpValues.join("");

    try {
      const res = await meetingService.verifyRequest(createdRequestId, enteredOtp);
      if (res.data.success) {
        setStep(5); // Success!
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      alert(error.response?.data?.error || "Doğrulama hatası.");
      setOtpValues(new Array(6).fill(""));
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
                {s === 1 && "Sınıf"}
                {s === 2 && "Zaman"}
                {s === 3 && "Bilgiler"}
                {s === 4 && "Doğrulama"}
                {s === 5 && "Onay"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 dark:border-white/5 min-h-[400px] relative overflow-hidden">

        {/* Step 4: OTP Verification (Was Step 1) */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto py-4 animate-fadeIn">
            <div className="size-20 rounded-full bg-red-50 dark:bg-red-900/20 text-secondary flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">lock</span>
            </div>
            <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2">E-posta Doğrulama</h2>
            <p className="text-text-muted dark:text-gray-400 mb-4 text-sm">
              Lütfen <span className="font-bold text-text-main dark:text-white">{email}</span> adresine gönderilen 6 haneli doğrulama kodunu giriniz.
            </p>

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
                    onPaste={handleOtpPaste}
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
                Doğrula ve Tamamla
                <span className="material-symbols-outlined">check</span>
              </button>

              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-text-muted dark:text-gray-400">
                  Kod gelmedi mi?{" "}
                  {/* Resend Logic via API would be needed here, or just let them wait/retry */}
                  <span className="text-xs text-gray-400">(Lütfen spam klasörünü kontrol ediniz)</span>
                </p>
                {isTimerActive && (
                  <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
                    <span className="material-symbols-outlined text-sm">timer</span>
                    {formatTime(timer)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Class Selection */}
        {step === 1 && (
          <div className="animate-fadeIn">
            <h2 className="text-2xl font-bold text-text-main dark:text-white mb-6 text-center">Sınıf Seçimi</h2>
            {noActiveForm ? (
              <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 border border-red-100 dark:border-red-900/30">
                <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                <p className="font-bold">Aktif randevu formu bulunamadı.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {classes.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClass(c)}
                    className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all text-center group
                      ${selectedClass?.id === c.id
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-white/5 text-text-main dark:text-white hover:border-primary/50'
                      }`}
                  >
                    <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">{c.assignedTeachers?.[0]?.image || 'school'}</span>
                    <span className="font-bold text-lg">{c.name}</span>
                    <span className="text-sm opacity-80 mt-1 px-2">
                      {c.assignedTeachers && c.assignedTeachers.length > 0
                        ? c.assignedTeachers.map(t => t.name).join(', ')
                        : 'Öğretmen Atanmadı'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date & Time Selection */}
        {step === 2 && (
          <div className="animate-fadeIn space-y-8">
            {/* Date Selection */}
            <div>
              <h3 className="font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">1</span>
                Tarih Seçin
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {dates.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => { setSelectedDate(d.raw); setSelectedTime(null); }}
                    className={`min-w-[120px] p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1
                      ${selectedDate === d.raw
                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-white/5 text-text-muted hover:border-primary/50'
                      }`}
                  >
                    <span className="text-sm opacity-80">{d.day}</span>
                    <span className="text-lg font-bold">{d.date.split(' ')[0]}</span>
                    <span className="text-xs font-bold uppercase">{d.date.split(' ')[1]}</span>
                  </button>
                ))}
                {dates.length === 0 && (
                  <div className="text-gray-400 p-4">Uygun tarih bulunamadı.</div>
                )}
              </div>
            </div>

            {/* Time Selection */}
            <div className={`transition-all duration-500 ${selectedDate ? 'opacity-100 translate-y-0' : 'opacity-50 translate-y-4 pointer-events-none'}`}>
              <h3 className="font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                <span className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">2</span>
                Saat Seçin
              </h3>

              {visibleSlots.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-gray-200 rounded-xl text-gray-400">
                  <span className="material-symbols-outlined text-3xl mb-2">schedule</span>
                  <p>Bu tarih için uygun saat bulunmamaktadır veya tüm randevular doludur.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {visibleSlots.map((slot, i) => (
                    <button
                      key={i}
                      disabled={slot.status !== 'available'}
                      onClick={() => setSelectedTime(slot.time)}
                      className={`py-3 px-2 rounded-xl text-sm font-bold transition-all relative overflow-hidden
                          ${slot.status === 'available'
                          ? selectedTime === slot.time
                            ? 'bg-secondary text-white shadow-lg shadow-secondary/30 scale-105'
                            : 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 text-text-main dark:text-white hover:border-secondary hover:text-secondary'
                          : ''
                        }
                          ${slot.status === 'taken' ? 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-gray-600 cursor-not-allowed border border-transparent' : ''}
                          ${slot.status === 'hidden' ? 'hidden' : ''}
                        `}
                    >
                      {slot.time}
                      {slot.status === 'taken' && <span className="absolute inset-0 flex items-center justify-center bg-gray-100/50 dark:bg-black/50"><span className="material-symbols-outlined text-sm font-bold">close</span></span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Info Form */}
        {step === 3 && (
          <div className="animate-fadeIn max-w-lg mx-auto">
            <h2 className="text-2xl font-bold text-text-main dark:text-white mb-2 text-center">İletişim Bilgileri</h2>
            <p className="text-text-muted dark:text-gray-400 text-center text-sm mb-8">
              Randevu onayı için bilgilerinizi eksiksiz doldurunuz.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted dark:text-gray-400 mb-1 ml-1">Veli Adı Soyadı</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-xl">person</span>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="Adınız Soyadınız"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted dark:text-gray-400 mb-1 ml-1">Öğrenci Adı</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-xl">school</span>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="Öğrencinin Adı"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted dark:text-gray-400 mb-1 ml-1">Telefon</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-xl">phone</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="05XX XXX XX XX"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 focus:border-primary outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted dark:text-gray-400 mb-1 ml-1">E-posta</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 material-symbols-outlined text-xl">mail</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      setEmail(e.target.value);
                    }}
                    placeholder="veli@ornek.com"
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 focus:border-primary outline-none transition-colors"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1 ml-1">* Doğrulama kodu bu adrese gönderilecektir.</p>
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

        {/* Navigation Buttons (Steps 1, 2, 3) */}
        {step < 4 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`px-6 py-2.5 rounded-xl font-bold transition-colors flex items-center gap-2 
              ${step === 1 ? 'invisible' : 'text-text-muted hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Geri
            </button>
            <button
              onClick={handleNext}
              disabled={
                (step === 1 && !selectedClass) ||
                (step === 2 && (!selectedDate || !selectedTime)) ||
                (step === 3 && (!formData.parentName || !formData.studentName || !formData.phone || !formData.email))
              }
              className="px-8 py-2.5 bg-primary hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              {step === 3 ? "Doğrulama Kodu Gönder" : "Devam Et"}
              <span className="material-symbols-outlined">{step === 3 ? 'lock' : 'arrow_forward'}</span>
            </button>
          </div>
        )}
      </div>
    </div >
  );
};
export default Appointment;
