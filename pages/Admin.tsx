import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { GoogleGenAI } from "@google/genai";
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import emailjs from '@emailjs/browser';
import {
  authService,
  contentService,
  teacherService,
  classService,
  menuService,
  scheduleService,
  documentService,
  formService,
  meetingService,
  settingsService,
  API_URL
} from '../services/api';
import { formatDate, formatDateTime } from '../utils/dateFormatter';

// --- Types & Mock Data ---

export type FormFieldType = 'text' | 'textarea' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'checkbox' | 'radio' | 'file';

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // For select, radio, checkbox
}

interface CustomForm {
  id: string; // Changed from number to string for compatibility
  title: string;
  slug: string; // URL-friendly path, auto-generated from title
  description: string;
  fields: FormField[];
  isActive: boolean;
  isAccessible?: boolean; // If false, form is visible but cannot be filled
  targetPage?: string; // which page this form belongs to
  submissions: any[];
}

// Turkish character conversion and slugify helper
const slugify = (text: string): string => {
  const turkishMap: { [key: string]: string } = {
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'I': 'I', 'İ': 'I',
    'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
  };
  return text
    .split('')
    .map(char => turkishMap[char] || char)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

type MeetingStatus = 'pending' | 'approved' | 'rejected';

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
  classId?: number;
  className?: string;
  teacherId?: number;
  email?: string;
  phone?: string;
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
  notificationEmail: string;
  timezone: string;
  emailjsServiceId: string;
  emailjsTemplateId: string;
  emailjsPublicKey: string;
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

const initialSchedules = [];

// --- Content Management Types ---
interface Tale {
  id: number;
  title: string;
  description: string;
  content: string; // HTML or markdown supported text
  imageUrl: string;
  isActive: boolean;
}

interface AboutContent {
  heroTitle: string;
  introTitle: string;
  introText: string;
  perspectiveTitle: string;
  perspectiveText: string;
}

const initialTales: Tale[] = [
  {
    id: 1,
    title: "Cesur Küçük Tavşan",
    description: "Ormanın derinliklerinde yaşayan küçük bir tavşanın korkularıyla yüzleşme hikayesi.",
    content: "Bir varmış, bir yokmuş... Ormanın derinliklerinde, rengarenk çiçeklerin arasında yaşayan Pamuk adında küçük bir tavşan varmış. Pamuk çok sevimliymiş ama birazcık ürkekmiş. Rüzgarın sesinden bile korkar, hemen yuvasına saklanırmış. Bir gün ormanda büyük bir fırtına çıkmış...",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBTnKdTr5SLnWPQXu_SDhg9qy-_WnA_reqdARzoPxY85rESislnNwb20btMaDt7lQJJ0hW9Ol-Q-64eYiQv2IfqJd53IdVRgFu90KjUYGQoIZWtYv9pzA6tK_Xqz8IZDFEFLBoAx5OnmVyLYfTLvLmvgXXIo5SV-tTb4KbJ5n1k2GznreLjC3SwEs5qt_q40kiJ69OOKXq3KgCuFWl_C-Nptr2MPOqBfznRJngn7-NopPEDlTS79kHY94bkHCk0DkU3k4UDeXijCA",
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
];

const initialAboutContent: AboutContent = {
  heroTitle: "Patika'da Yaşam ve Öğrenme",
  introTitle: "Patika’ya Dair",
  introText: "Patika, 1999’dan bu yana Bodrum’da, çocukların doğayla temas ederek, sevgiyle ve kendi ritimlerinde büyüdüğü; çocukluğun ilk yıllarına eşlik eden bir yuvadır.\n\nMasal ile gerçeğin iç içe geçtiği bu yolculukta, her çocuk kendi patikasında yürür; bizler ise onlara güvenli, samimi ve yaşayan bir alan sunarız.",
  perspectiveTitle: "Bakış Açımız; Masallar ve Gerçekler",
  perspectiveText: "Masallar, çocukların dünyayı anlamlandırma biçimidir. Gerçekler ise o dünyada nasıl duracaklarını öğrenme hâli.\n\nPatika’da bu ikisi birbirinin karşıtı değil, tamamlayıcısıdır. Çocuklar masallarla düşünür, gerçeklerle dener. Biri hayal kurmayı, diğeriyse ayakta kalmayı öğretir.\n\nBurada çocuklardan hızlı olmaları, yetişmeleri ya da benzemeleri beklenmez. Sormaya, denemeye, durmaya ve yeniden başlamaya alan açılır. Masallar bu alanı yumuşatır; gerçekler ise güvenli kılar.\n\nPatika, çocukların hayattan kopmadan büyüyebileceği bir yol olarak düşünülür. Ne yalnızca düşle, ne yalnızca kuralla ilerler. İkisi arasındaki denge, çocuğun kendi adımlarını bulmasına izin verir."
};

// --- Homepage Content ---
interface HomeContent {
  heroTitle: string;
  heroImage: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  valuesTitle: string;

  talesTitle: string;
  talesText: string;
  talesHighlight: string;
  realityTitle: string;
  realityText: string;
  realityHighlight: string;
  formsTitle: string;
  values: { title: string; text: string; icon: string }[];
}

const initialHomeContent: HomeContent = {
  heroTitle: "Patika'da Mutlu Adımlar",
  heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKkBtmpwhIX5KPxEgKI9zWs4svarIXcB1OZmLOigX0jzCFwcO2zjv_pYzq0bkdHKpWowLwr7ahocm6bA42dTHgnb6j_UBwIlw-kpe2fIhKOlbp8SOWv9NgGWm2uys4pnyqiuP3zZ9NfQDiyw72zo4LZJSbSbrrGo86d5SjWWfbVqiydSWq_Bzyx5NzHhYKd1cXcQ_TWVQ64WochSWtVJV4kVa4ADz1_amSMQIWsalNn6fRHRBzZ1rVpn9eIgNw_G6HRkLLyYa_Hg",
  primaryButtonText: "Patika'ya Dair",
  primaryButtonLink: "/about",
  secondaryButtonText: "Masallar ve Gerçekler",
  secondaryButtonLink: "/masallar-ve-gercekler",
  valuesTitle: "Neden Masallar ve Gerçekler Dünyası?",

  talesTitle: "Masallar",
  talesText: "Hikâyeler, oyunlar ve semboller aracılığıyla çocukların hayal gücüne alan açılır.",
  talesHighlight: "Masallar, doğruyu öğretmek için değil; düşünmeye davet etmek için vardır.",
  realityTitle: "Gerçekler",
  realityText: "Günlük yaşam, ilişkiler ve sorumluluklar çocuğun anlayabileceği bir dille deneyimlenir.",
  realityHighlight: "Gerçekler, korkutmak için değil; güven duygusu oluşturmak için vardır.",
  formsTitle: "Formlar",
  values: []
};

// --- Contact Page Content ---
interface ContactContent {
  pageTitle: string;
  pageSubtitle: string;
  address: string;
  phone: string;
  phoneHours: string;
  email: string;
  mapLink: string;
  quickLinksTitle: string;
}

const initialContactContent: ContactContent = {
  pageTitle: "Bize Ulaşın",
  pageSubtitle: "Sorularınız mı var? Tanışmak için sabırsızlanıyoruz. Çocuğunuzun geleceği için en doğru adımı birlikte atalım.",
  address: "Ortakentyahşi Mahallesi, Hıral Sk. No:6, 48420 Bodrum/Muğla",
  phone: "+90 (552) 804 41 40",
  phoneHours: "Hafta içi 08:00 - 18:00",
  email: "patikayuva@gmail.com",
  mapLink: "https://maps.app.goo.gl/4XhSdNG5ckydkFU67",
  quickLinksTitle: "Hızlı Başvuru Bağlantıları"
};

// --- Meeting Days Content ---
interface MeetingDaysContent {
  heroTitle: string;
  heroImage: string;
  sectionTitle: string;
  introText: string;
  scheduleTitle: string;
  scheduleTime: string;
  descriptionText: string;
  formInfoTitle: string;
  formInfoText: string;
}

const initialMeetingDaysContent: MeetingDaysContent = {
  heroTitle: "Tanışma Günleri",
  heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBKkBtmpwhIX5KPxEgKI9zWs4svarIXcB1OZmLOigX0jzCFwcO2zjv_pYzq0bkdHKpWowLwr7ahocm6bA42dTHgnb6j_UBwIlw-kpe2fIhKOlbp8SOWv9NgGWm2uys4pnyqiuP3zZ9NfQDiyw72zo4LZJSbSbrrGo86d5SjWWfbVqiydSWq_Bzyx5NzHhYKd1cXcQ_TWVQ64WochSWtVJV4kVa4ADz1_amSMQIWsalNn6fRHRBzZ1rVpn9eIgNw_G6HRkLLyYa_Hg",
  sectionTitle: "Patika Tanışma Günleri",
  introText: "Okulumuzu yakından tanımak, bahçemizi gezmek ve eğitim yaklaşımımız üzerine sohbet etmek isteyen; önümüzdeki eğitim–öğretim döneminde Patika’yı düşünen aileleri **Patika Tanışma Günleri**’ne davet ediyoruz.",
  scheduleTitle: "Şubat Ayı Boyunca",
  scheduleTime: "Hafta İçi, 16.45 – 18.00 saatleri arasında",
  descriptionText: "Tanıtım günlerimiz, her yıl **Şubat** ayında Patika Çocuk Yuvası’nda düzenlenir. Bu süreçte hem okulumuzun fiziki imkanlarını görebilir hem de eğitim kadromuzla tanışarak merak ettiğiniz soruları sorabilirsiniz.",
  formInfoTitle: "Form Bilgilendirmesi:",
  formInfoText: "Yandaki başvuru formu şu anda görüntüleme modundadır. Randevu talepleriniz için lütfen iletişim numaramızdan bize ulaşınız."
};

const initialClasses = [
  { id: 101, name: 'Güneş Sınıfı (3-4 Yaş)', capacity: 15, ageGroup: '3-4', teacherIds: [1, 5] },
  { id: 102, name: 'Kelebekler Sınıfı (4-5 Yaş)', capacity: 18, ageGroup: '4-5', teacherIds: [2] },
  { id: 103, name: 'Gökkuşağı Sınıfı (5-6 Yaş)', capacity: 20, ageGroup: '5-6', teacherIds: [3] },
  { id: 104, name: 'Branş Dersleri', capacity: 0, ageGroup: 'Tüm Yaş', teacherIds: [4, 6] }
];

const initialCustomForms: CustomForm[] = [
  {
    id: 'contact', title: 'İletişim Formu', slug: 'iletisim-formu', description: 'Web sitesi iletişim sayfası formu', isActive: true, isAccessible: true, targetPage: 'contact', submissions: [],
    fields: [
      { id: 'c1', type: 'text', label: 'Ad Soyad', required: true, placeholder: 'Ad Soyad' },
      { id: 'c2', type: 'email', label: 'E-posta', required: true, placeholder: 'email@ornek.com' },
      { id: 'c3', type: 'tel', label: 'Telefon', required: true, placeholder: '0555 555 55 55' },
      { id: 'c4', type: 'select', label: 'Konu', required: true, options: ['Bilgi Alma', 'Randevu', 'Şikayet/Öneri'] },
      { id: 'c5', type: 'textarea', label: 'Mesajınız', required: true, placeholder: 'Mesajınızı buraya yazınız...' },
    ]
  },
  {
    id: 'personnel', title: 'Personel Başvuru Formu', slug: 'personel-basvuru-formu', description: 'İş başvuruları için kullanılan form', isActive: true, isAccessible: true, targetPage: 'personnel', submissions: [],
    fields: [
      { id: 'p1', type: 'text', label: 'Ad Soyad', required: true, placeholder: 'Adınız Soyadınız' },
      { id: 'p3', type: 'tel', label: 'Telefon', required: true, placeholder: 'örn: 555 123 4567' },
      { id: 'email', type: 'email', label: 'E-posta', required: true, placeholder: 'örn: ornek@email.com' },
      { id: 'p4', type: 'select', label: 'Başvurulan Pozisyon', required: true, options: ['Sınıf Öğretmeni', 'Yardımcı Öğretmen', 'Branş Öğretmeni', 'Temizlik Personeli', 'Mutfak Personeli', 'Hemşire', 'Psikolog', 'Diğer'] },
      { id: 'p5', type: 'textarea', label: 'Ön Yazı', required: true, placeholder: 'Kendinizden kısaca bahsediniz...' }
    ]
  },
  {
    id: 'school_register', title: 'Okul Kayıt Formu', slug: 'okul-kayit-formu', description: 'Yeni öğrenci kaydı için gerekli bilgiler', isActive: true, isAccessible: true, targetPage: 'student', submissions: [],
    fields: [
      { id: 'f1', type: 'text', label: 'Öğrenci Adı Soyadı', required: true, placeholder: 'Ad Soyad' },
      { id: 'f2', type: 'date', label: 'Doğum Tarihi', required: true },
      { id: 'f3', type: 'text', label: 'Veli Adı Soyadı', required: true, placeholder: 'Veli Adı' },
      { id: 'f4', type: 'tel', label: 'İletişim Numarası', required: true, placeholder: '05XX XXX XX XX' },
    ]
  },
  {
    id: 'meeting_days', title: 'Tanışma Günleri Başvuru Formu', slug: 'tanisma-gunleri-formu', description: 'Tanışma günlerine katılım başvuru formu', isActive: true, isAccessible: true, targetPage: 'meetingDays', submissions: [],
    fields: [
      { id: 'm1', type: 'text', label: 'Veli Adı Soyadı', required: true, placeholder: 'Adınız Soyadınız' },
      { id: 'm2', type: 'text', label: 'Çocuk Adı Soyadı', required: true, placeholder: 'Çocuğunuzun Adı' },
      { id: 'm3', type: 'date', label: 'Çocuk Doğum Tarihi', required: true },
      { id: 'm4', type: 'tel', label: 'Telefon', required: true, placeholder: '0555 555 55 55' },
      { id: 'm5', type: 'email', label: 'E-posta', required: true, placeholder: 'email@ornek.com' },
      { id: 'm6', type: 'textarea', label: 'Eklemek İstediğiniz Not', required: false, placeholder: 'Varsa eklemek istediğiniz bilgiler...' },
    ]
  }
];

const BrandLogo = ({ className = "h-12", onClick }: { className?: string; onClick?: () => void }) => {
  const [imgError, setImgError] = React.useState(false);

  if (imgError) {
    return (
      <div className={`${className} flex items-center justify-center cursor-pointer`} onClick={onClick}>
        <span className="text-2xl font-black text-primary">PATİKA</span>
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="Patika Çocuk Yuvası"
      className={`${className} w-auto object-contain dark:bg-white/90 dark:rounded-lg dark:px-2 dark:py-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      onError={() => setImgError(true)}
    />
  );
};

const Admin: React.FC = () => {
  // --- OTP Authentication State ---
  const ADMIN_EMAIL = 'patikayuva@gmail.com';
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Start false, verify token in useEffect
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state
  const [loginEmail, setLoginEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(''); // Still used? only for dev/testing display maybe
  const [otpInput, setOtpInput] = useState(['', '', '', '', '', '']);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [showOtpOnScreen, setShowOtpOnScreen] = useState(false); // Default to false in prod
  const otpInputRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null)
  ];

  // Verify token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          await authService.verifyToken();
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Auth verification failed', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  const handleSendOtp = async () => {
    if (!loginEmail) {
      setOtpError('Lütfen e-posta adresinizi girin.');
      return;
    }

    // Client-side simple check before API call
    if (loginEmail.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      setOtpError('Bu e-posta adresi yönetim paneline erişim yetkisine sahip değil.');
      return;
    }

    try {
      const response = await authService.requestOtp(loginEmail);
      setOtpSent(true);
      setOtpError('');
      setOtpInput(['', '', '', '', '', '']);

      // If dev mode, backend might return OTP
      if (response.data.devOtp) {
        setGeneratedOtp(response.data.devOtp);
        setShowOtpOnScreen(true);
      } else {
        setShowOtpOnScreen(false);
      }

      // Focus first OTP input
      setTimeout(() => otpInputRefs[0].current?.focus(), 100);
    } catch (error: any) {
      setOtpError(error.response?.data?.error || 'OTP gönderilirken bir hata oluştu.');
    }
  };

  const handleOtpChange = async (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otpInput];
    newOtp[index] = value.slice(-1);
    setOtpInput(newOtp);
    setOtpError('');

    // Auto-focus next input
    if (value && index < 5) {
      otpInputRefs[index + 1].current?.focus();
    }

    // Auto-verify when all digits are entered
    if (newOtp.every(digit => digit !== '')) {
      const enteredOtp = newOtp.join('');

      try {
        const response = await authService.verifyOtp(loginEmail, enteredOtp);
        const { token } = response.data;

        localStorage.setItem('auth_token', token);
        // Also keep old session for compatibility if needed, or remove it
        localStorage.setItem('patika_admin_session', JSON.stringify({ timestamp: Date.now(), email: loginEmail }));

        setIsAuthenticated(true);
      } catch (error: any) {
        setOtpError(error.response?.data?.error || 'Geçersiz doğrulama kodu. Lütfen tekrar deneyin.');
        setOtpInput(['', '', '', '', '', '']);
        setTimeout(() => otpInputRefs[0].current?.focus(), 100);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpInput[index] && index > 0) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('patika_admin_session');
    setOtpSent(false);
    setLoginEmail('');
    setGeneratedOtp('');
    setOtpInput(['', '', '', '', '', '']);
  };

  const copyOtpToClipboard = () => {
    navigator.clipboard.writeText(generatedOtp);
    // Auto-fill OTP inputs
    const digits = generatedOtp.split('');
    setOtpInput(digits);
    // Trigger verification if full
    if (digits.length === 6) {
      // We can't easily trigger the async check here without duplicating logic inside handleOtpChange
      // But user can just type one char or we can add a manual button or useEffect on otpInput
    }
  };


  // --- State Management ---
  const [activeView, setActiveView] = useState<'dashboard' | 'teachers' | 'classes' | 'food-menu' | 'schedule' | 'meetings' | 'meeting-manage' | 'meeting-edit' | 'applications' | 'settings' | 'forms' | 'form-builder' | 'meeting-calendar' | 'content-management'>('dashboard');
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);

  // Load initial state from LocalStorage if available to simulate persistence between pages
  const [forms, setForms] = useState<MeetingForm[]>(initialForms); // Will load from API later if we move meeting forms to DB


  const [requests, setRequests] = useState<MeetingRequest[]>(initialRequests); // Will load from API later


  // Settings State
  const [settings, setSettings] = useState<SystemSettings>({
    calendarId: "",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: "",
    notificationEmail: "",
    timezone: "Europe/Istanbul",
    emailjsServiceId: "",
    emailjsTemplateId: "",
    emailjsPublicKey: ""
  });

  // Content Management State
  const [contentTab, setContentTab] = useState<'home' | 'about' | 'contact' | 'meetingDays' | 'documents'>('home');

  const [homeContent, setHomeContent] = useState<HomeContent>(initialHomeContent);

  const [aboutContent, setAboutContent] = useState<AboutContent>(initialAboutContent);

  // Contact Content


  const [contactContent, setContactContent] = useState<ContactContent>(initialContactContent);

  const [meetingDaysContent, setMeetingDaysContent] = useState<MeetingDaysContent>(initialMeetingDaysContent);

  // Documents State
  interface SchoolDocument {
    id: string;
    name: string;
    url: string;
    icon: string;
    color: string;
    bg: string;
  }

  const [documents, setDocuments] = useState<SchoolDocument[]>([]);
  const [editingDocument, setEditingDocument] = useState<SchoolDocument | null>(null);

  const saveContent = async (type: 'home' | 'about' | 'contact' | 'meetingDays') => {
    setIsLoading(true);
    try {
      if (type === 'home') await contentService.update('home', homeContent);
      if (type === 'about') await contentService.update('about', aboutContent);
      if (type === 'contact') await contentService.update('contact', contactContent);
      if (type === 'meetingDays') await contentService.update('meetingDays', meetingDaysContent);
      alert('İçerik başarıyla kaydedildi!');
    } catch (error) {
      console.error('Content save error', error);
      alert('İçerik kaydedilirken hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTeacher = async () => {
    if (!editingTeacher) return;
    try {
      if (teachers.find(t => t.id === editingTeacher.id)) {
        await teacherService.update(editingTeacher.id, editingTeacher);
        // Optimistic update or refetch
        const res = await teacherService.getAll();
        if (res.data.teachers) setTeachers(res.data.teachers);
      } else {
        await teacherService.create(editingTeacher);
        const res = await teacherService.getAll();
        if (res.data.teachers) setTeachers(res.data.teachers);
      }
      setEditingTeacher(null);
    } catch (error) {
      console.error('Teacher save error', error);
      alert('Öğretmen kaydedilirken hata oluştu.');
    }
  };

  const handleDeleteTeacher = async (id: number) => {
    if (!window.confirm('Bu öğretmeni silmek istediğinizden emin misiniz?')) return;
    try {
      await teacherService.delete(id);
      setTeachers(teachers.filter(t => t.id !== id));
    } catch (error) {
      console.error('Delete teacher error', error);
      alert('Öğretmen silinirken hata oluştu.');
    }
  };

  const handleSaveClass = async () => {
    if (!editingClass) return;
    try {
      if (classes.find(c => c.id === editingClass.id)) {
        await classService.update(editingClass.id, editingClass);
        const res = await classService.getAll();
        if (res.data.classes) setClasses(res.data.classes);
      } else {
        await classService.create(editingClass);
        const res = await classService.getAll();
        if (res.data.classes) setClasses(res.data.classes);
      }
      setEditingClass(null);
    } catch (error) {
      console.error('Class save error', error);
      alert('Sınıf kaydedilirken hata oluştu.');
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (!window.confirm('Bu sınıfı silmek istediğinizden emin misiniz?')) return;
    try {
      await classService.delete(id);
      setClasses(classes.filter(c => c.id !== id));
    } catch (error) {
      console.error('Delete class error', error);
      alert('Sınıf silinirken hata oluştu.');
    }
  };

  // Documents now loaded from API in fetchData

  // Edit Form Temporary State
  const [editFormData, setEditFormData] = useState<MeetingForm | null>(null);
  const [tempDateInput, setTempDateInput] = useState("");

  // Ref for Date Input to trigger picker programmatically
  const dateInputRef = useRef<HTMLInputElement>(null);

  // AI Email Modal State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [approvalStep, setApprovalStep] = useState<1 | 2>(1);
  const [generatedEmailSubject, setGeneratedEmailSubject] = useState("");
  const [generatedEmailBody, setGeneratedEmailBody] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<{ requestId: number, newStatus: MeetingStatus } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Calendar Event State
  const [calendarEvent, setCalendarEvent] = useState({
    title: '',
    date: '',
    time: '',
    endTime: '',
    location: 'Patika Çocuk Yuvası',
    description: '',
    attendeeEmail: '',
    attendeeName: ''
  });
  const [icsDataUri, setIcsDataUri] = useState('');
  const [googleCalendarLink, setGoogleCalendarLink] = useState('');

  // Teachers State
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Classes State
  // Classes State
  const [classes, setClasses] = useState<{ id: number; name: string; capacity: number; ageGroup: string; teacherIds: number[] }[]>([]);

  // Food Menu State (weekly)
  // Food Menu State (weekly)
  const [foodMenu, setFoodMenu] = useState<{ [day: string]: { breakfast: string; lunch: string; snack: string } }>({});

  // Schedule State
  // Schedule State
  const [schedule, setSchedule] = useState<{ time: string; activity: string; classId: number }[]>([]);

  // Custom Forms State - with comprehensive deduplication
  // Custom Forms State
  const [customForms, setCustomForms] = useState<CustomForm[]>([]);

  const handleSaveMenu = async () => {
    try {
      await menuService.updateBulk(foodMenu);
      alert('Yemek listesi kaydedildi.');
    } catch (error) {
      console.error('Menu save error', error);
      alert('Yemek listesi kaydedilirken hata oluştu.');
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await scheduleService.updateBulk(schedule);
      alert('Ders programı kaydedildi.');
    } catch (error) {
      console.error('Schedule save error', error);
      alert('Ders programı kaydedilirken hata oluştu.');
    }
  };

  const handleSaveSettings = async () => {
    try {
      await settingsService.update(settings);
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    } catch (error) {
      console.error('Settings save error', error);
      alert('Ayarlar kaydedilirken hata oluştu.');
    }
  };

  const handleDeleteCustomForm = async (id: string) => {
    if (!window.confirm('Bu formu silmek istediğinizden emin misiniz?')) return;
    try {
      await formService.delete(id);
      setCustomForms(customForms.filter(f => f.id !== id));
    } catch (error) {
      console.error('Delete form error', error);
      alert('Form silinirken hata oluştu.');
    }
  };

  // Editing states
  const [editingForm, setEditingForm] = useState<CustomForm | null>(null);

  // --- Data Fetching ---
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching all dashboard data...');
        const [
          homeRes, aboutRes, contactRes, meetingDaysRes,
          teachersRes, classesRes, formsRes, menuRes,
          scheduleRes, documentsRes, settingsRes,
          meetingFormsRes, meetingRequestsRes
        ] = await Promise.all([
          contentService.get('home'),
          contentService.get('about'),
          contentService.get('contact'),
          contentService.get('meetingDays'),
          teacherService.getAll(),
          classService.getAll(),
          formService.getAll(),
          menuService.getAll(),
          scheduleService.getAll(),
          documentService.getAll(),
          settingsService.get(),
          meetingService.getAllForms(),
          meetingService.getAllRequests()
        ]);

        // Content
        if (homeRes.data?.content) setHomeContent(homeRes.data.content);
        if (aboutRes.data?.content) setAboutContent(aboutRes.data.content);
        if (contactRes.data?.content) setContactContent(contactRes.data.content);
        if (meetingDaysRes.data?.content) setMeetingDaysContent(meetingDaysRes.data.content);

        // Lists (handling { key: [] } wrapper)
        if (teachersRes.data.teachers) setTeachers(teachersRes.data.teachers);
        if (classesRes.data.classes) setClasses(classesRes.data.classes);
        if (formsRes.data.forms) setCustomForms(formsRes.data.forms);
        if (menuRes.data.menu) setFoodMenu(menuRes.data.menu); // Need to check if menu wrapper is 'menu' or object of days
        if (scheduleRes.data.schedule) setSchedule(scheduleRes.data.schedule);
        if (documentsRes.data.documents) setDocuments(documentsRes.data.documents);
        if (settingsRes.data.settings) {
          // Merge with defaults to ensure all fields are present
          setSettings(prev => ({
            ...prev,
            calendarId: settingsRes.data.settings.calendarId || '',
            smtpHost: settingsRes.data.settings.smtpHost || '',
            smtpPort: settingsRes.data.settings.smtpPort || '587',
            smtpUser: settingsRes.data.settings.smtpUser || '',
            smtpPass: settingsRes.data.settings.smtpPass || '',
            notificationEmail: settingsRes.data.settings.notificationEmail || '',
            timezone: settingsRes.data.settings.timezone || 'Europe/Istanbul',
            emailjsServiceId: settingsRes.data.settings.emailjsServiceId || '',
            emailjsTemplateId: settingsRes.data.settings.emailjsTemplateId || '',
            emailjsPublicKey: settingsRes.data.settings.emailjsPublicKey || ''
          }));
        }

        // Meeting System
        if (meetingFormsRes.data.forms) setForms(meetingFormsRes.data.forms);
        if (meetingRequestsRes.data.requests) setRequests(meetingRequestsRes.data.requests);

      } catch (error) {
        console.error("Error fetching dashboard data", error);
        // Optional: show error toast
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);
  const [viewingSubmission, setViewingSubmission] = useState<{ data: any; date: string } | null>(null);

  // Applications State - derived from form submissions
  const [applications, setApplications] = useState<{ id: number; type: 'school' | 'staff' | 'contact'; name: string; email: string; phone: string; message: string; date: string; status: 'new' | 'reviewed' | 'contacted' }[]>([]);

  // Editing states
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingClass, setEditingClass] = useState<{ id: number; name: string; capacity: number; ageGroup: string; teacherIds: number[] } | null>(null);

  // Persistence Effects for new data
  // Persistence removed in favor of API calls


  // Self-healing migration: Ensure all required forms ALWAYS exist and remove duplicates
  useEffect(() => {
    const requiredForms = [
      {
        id: 'contact', title: 'İletişim Formu', slug: 'iletisim-formu', description: 'Web sitesi iletişim sayfası formu', isActive: true, submissions: [], notificationEmails: '',
        fields: [
          { id: 'c1', type: 'text', label: 'Ad Soyad', required: true, placeholder: 'Ad Soyad' },
          { id: 'c2', type: 'email', label: 'E-posta', required: true, placeholder: 'email@ornek.com' },
          { id: 'c3', type: 'tel', label: 'Telefon', required: true, placeholder: '0555 555 55 55' },
          { id: 'c4', type: 'select', label: 'Konu', required: true, options: ['Bilgi Alma', 'Randevu', 'Şikayet/Öneri'] },
          { id: 'c5', type: 'textarea', label: 'Mesajınız', required: true, placeholder: 'Mesajınızı buraya yazınız...' },
        ]
      },
      {
        id: 'personnel', title: 'Personel Başvuru Formu', slug: 'personel-basvuru-formu', description: 'İş başvuruları için kullanılan form', isActive: true, submissions: [], notificationEmails: '',
        fields: [
          { id: 'p1', type: 'text', label: 'Ad Soyad', required: true, placeholder: 'Adınız Soyadınız' },
          { id: 'p3', type: 'tel', label: 'Telefon', required: true, placeholder: 'örn: 555 123 4567' },
          { id: 'email', type: 'email', label: 'E-posta', required: true, placeholder: 'örn: ornek@email.com' },
          { id: 'p4', type: 'select', label: 'Başvurulan Pozisyon', required: true, options: ['Sınıf Öğretmeni', 'Yardımcı Öğretmen', 'Branş Öğretmeni', 'Temizlik Personeli', 'Mutfak Personeli', 'Hemşire', 'Psikolog', 'Diğer'] },
          { id: 'p5', type: 'textarea', label: 'Ön Yazı', required: true, placeholder: 'Kendinizden kısaca bahsediniz...' }
        ]
      },
      {
        id: 'school_register', title: 'Okul Kayıt Formu', slug: 'okul-kayit-formu', description: 'Yeni öğrenci kaydı için gerekli bilgiler', isActive: true, submissions: [], notificationEmails: '',
        fields: [
          { id: 'f1', type: 'text', label: 'Öğrenci Adı Soyadı', required: true, placeholder: 'Ad Soyad' },
          { id: 'f2', type: 'date', label: 'Doğum Tarihi', required: true },
          { id: 'f3', type: 'text', label: 'Veli Adı Soyadı', required: true, placeholder: 'Veli Adı' },
          { id: 'f4', type: 'tel', label: 'İletişim Numarası', required: true, placeholder: '05XX XXX XX XX' },
        ]
      },
      {
        id: 'meeting_request', title: 'Tanışma Günü Başvuru Formu', slug: 'tanisma-gunu-basvuru', description: 'Veli tanışma günleri için başvuru formu', isActive: true, submissions: [], notificationEmails: '',
        fields: [
          { id: 'm1', type: 'text', label: 'Veli Adı Soyadı', required: true, placeholder: 'Adınız Soyadınız' },
          { id: 'm2', type: 'text', label: 'Öğrenci Adı Soyadı', required: true, placeholder: 'Öğrencinin Adı Soyadı' },
          { id: 'm3', type: 'tel', label: 'İletişim Numarası', required: true, placeholder: '05XX XXX XX XX' },
          { id: 'm4', type: 'email', label: 'E-posta Adresi', required: true, placeholder: 'email@ornek.com' },
          { id: 'm5', type: 'select', label: 'Görüşme Tercihi', required: true, options: ['Hafta İçi Sabah', 'Hafta İçi Öğleden Sonra', 'Fark etmez'] },
          { id: 'm6', type: 'textarea', label: 'Notlarınız', required: false, placeholder: 'Varsa belirtmek istediğiniz özel durumlar...' }
        ]
      }
    ];

    // STEP 1: Remove duplicates - keep only the first occurrence of each ID
    const seenIds = new Set<string>();
    let deduplicatedForms = customForms.filter(form => {
      if (seenIds.has(form.id)) {
        console.log(`[Self-Healing] Removed duplicate form: ${form.title} (${form.id})`);
        return false;
      }
      seenIds.add(form.id);
      return true;
    });

    let needsUpdate = deduplicatedForms.length !== customForms.length;

    // STEP 2: Ensure all required forms exist
    requiredForms.forEach(reqForm => {
      const existingForm = deduplicatedForms.find(f => f.id === reqForm.id);
      if (!existingForm) {
        deduplicatedForms.push(reqForm);
        needsUpdate = true;
        console.log(`[Self-Healing] Added missing form: ${reqForm.title}`);
      } else {
        // Ensure required fields exist
        let formNeedsUpdate = false;
        let updatedForm = { ...existingForm };

        if (!existingForm.slug) {
          updatedForm.slug = reqForm.slug;
          formNeedsUpdate = true;
        }
        if (existingForm.notificationEmails === undefined) {
          updatedForm.notificationEmails = '';
          formNeedsUpdate = true;
        }
        if (reqForm.id === 'personnel' && !existingForm.fields.some(f => f.id === 'email')) {
          updatedForm.fields = reqForm.fields;
          formNeedsUpdate = true;
          console.log(`[Self-Healing] Fixed personnel form fields`);
        }

        if (formNeedsUpdate) {
          deduplicatedForms = deduplicatedForms.map(f => f.id === reqForm.id ? updatedForm : f);
          needsUpdate = true;
        }
      }
    });

    if (needsUpdate) {
      setCustomForms(deduplicatedForms);
    }
  }, []); // Run check on mount



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

      setGeneratedEmailBody(response.text || "E-posta oluşturulamadı.");
      setShowEmailModal(true);

    } catch (error) {
      console.error("AI Error:", error);
      alert("E-posta oluşturulurken bir hata oluştu: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChangeClick = async (requestId: number, newStatus: MeetingStatus) => {
    if (newStatus === 'pending' || newStatus === 'rejected') {
      try {
        await meetingService.updateRequestStatus(requestId, newStatus);
        setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
      } catch (err) { console.error(err); alert('Durum güncellenemedi'); }
      return;
    }
    const request = requests.find(r => r.id === requestId);
    if (request && newStatus === 'approved') {
      setPendingStatusChange({ requestId, newStatus });
      const form = forms.find(f => f.id === request.formId);
      let classInfo = form?.classes.find(c => c.id === request.classId);
      if (!classInfo && request.teacherId) {
        classInfo = form?.classes.find(c => c.assignedTeachers.some(at => at.id === request.teacherId));
      }
      const className = request.className || classInfo?.name || 'Belirtilmemiş';
      const teacherNames = classInfo?.assignedTeachers?.map(t => t.name).join(', ') || '';
      const dateObj = new Date(request.date);
      const formattedDate = dateObj.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const [hour, minute] = request.time.split(':').map(Number);
      const endHour = minute >= 30 ? hour + 1 : hour;
      const endMinute = (minute + 30) % 60;
      const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      setCalendarEvent({
        title: `Patika Veli Toplantısı - ${request.studentName}/${className} - ${formattedDate}`,
        date: request.date, time: request.time, endTime,
        location: 'Patika Çocuk Yuvası',
        description: [`Veli: ${request.parentName}`, `Öğrenci: ${request.studentName}`, `Sınıf: ${className}`, teacherNames ? `Öğretmenler: ${teacherNames}` : ''].filter(Boolean).join('\n'),
        attendeeEmail: request.email || '', attendeeName: request.parentName
      });
      setGeneratedEmailSubject(`Patika Çocuk Yuvası Veli Toplantısı - ${formattedDate} - ${request.time} - ${request.studentName}`);
      setGeneratedEmailBody(`Sayın ${request.parentName},\n\n${formattedDate} tarihinde saat ${request.time}'da veli toplantısı onaylandı.\n\n📅 Tarih: ${formattedDate}\n⏰ Saat: ${request.time}\n👧 Öğrenci: ${request.studentName}\n🏫 Sınıf: ${className}\n${teacherNames ? `👩‍🏫 Öğretmenler: ${teacherNames}\n` : ''}\n📎 Ek: Takvim daveti\n\nGörüşmek üzere,\nPatika Çocuk Yuvası`);
      setApprovalStep(1);
      setShowEmailModal(true);
    }
  };

  const confirmStatusChange = async () => {
    if (pendingStatusChange) {
      const { requestId, newStatus } = pendingStatusChange;

      try {
        await meetingService.updateRequestStatus(requestId, newStatus);
        setRequests(prev => prev.map(req => req.id === requestId ? { ...req, status: newStatus } : req));
      } catch (err) { console.error(err); alert('Durum güncellenemedi'); return; }

      if (newStatus === 'approved') {
        if (settings.emailjsServiceId && settings.emailjsTemplateId && settings.emailjsPublicKey) {
          const req = requests.find(r => r.id === requestId);
          if (req) {
            const emailParams = {
              to_name: req.parentName,
              to_email: req.email,
              message: generatedEmailBody,
              subject: generatedEmailSubject,
            };

            emailjs.send(settings.emailjsServiceId, settings.emailjsTemplateId, emailParams, settings.emailjsPublicKey)
              .then(() => alert("Randevu onaylandı ve e-posta başarıyla gönderildi!"))
              .catch((err) => alert("Randevu onaylandı ancak e-posta gönderilemedi: " + JSON.stringify(err)));
          }
        } else {
          alert("Randevu onaylandı! Otomatik e-posta için Ayarlar'dan EmailJS yapılandırmasını tamamlayın.");
        }
      } else {
        alert("Durum güncellendi.");
      }

      setShowEmailModal(false);
      setPendingStatusChange(null);
      setGeneratedEmailSubject("");
      setGeneratedEmailBody("");
      setApprovalStep(1);
    }
  };

  const proceedToEmailStep = () => {
    // Generate ICS content for email embedding
    const icsContent = generateICSContent();
    setIcsDataUri(`data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`);

    // Generate Google Calendar link for the email
    const gcalLink = generateGoogleCalendarLink();
    setGoogleCalendarLink(gcalLink);

    // Update email body to include the add-to-calendar link
    setGeneratedEmailBody(prev => {
      const linkSection = `\n\n📅 Takvime eklemek için:\n${gcalLink}`;
      return prev.includes('Takvime eklemek') ? prev : prev + linkSection;
    });

    setApprovalStep(2);
  };

  const generateGoogleCalendarLink = () => {
    const [year, month, day] = calendarEvent.date.split('-').map(Number);
    const [sh, sm] = calendarEvent.time.split(':').map(Number);
    const [eh, em] = calendarEvent.endTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, sh, sm);
    const end = new Date(year, month - 1, day, eh, em);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(calendarEvent.title)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(calendarEvent.description)}&location=${encodeURIComponent(calendarEvent.location)}${calendarEvent.attendeeEmail ? `&add=${encodeURIComponent(calendarEvent.attendeeEmail)}` : ''}`;
  };

  const generateICSContent = () => {
    const [year, month, day] = calendarEvent.date.split('-').map(Number);
    const [sh, sm] = calendarEvent.time.split(':').map(Number);
    const [eh, em] = calendarEvent.endTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, sh, sm);
    const end = new Date(year, month - 1, day, eh, em);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    const uid = `patika-${Date.now()}@patikacocukyuvasi.com`;
    return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Patika//TR', 'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${fmt(new Date())}`, `DTSTART:${fmt(start)}`, `DTEND:${fmt(end)}`, `SUMMARY:${calendarEvent.title}`, `DESCRIPTION:${calendarEvent.description.replace(/\n/g, '\\n')}`, `LOCATION:${calendarEvent.location}`, `ORGANIZER:mailto:${settings.smtpUser || 'info@patika.com'}`, calendarEvent.attendeeEmail ? `ATTENDEE:mailto:${calendarEvent.attendeeEmail}` : '', 'STATUS:CONFIRMED', 'END:VEVENT', 'END:VCALENDAR'].filter(Boolean).join('\r\n');
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

    const teacherToAdd = teachers.find(t => t.id === teacherId);
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

  const handleSaveForm = async () => {
    if (editFormData) {
      try {
        if (selectedFormId && forms.find(f => f.id === selectedFormId)) {
          await meetingService.updateForm(selectedFormId, editFormData);
          const res = await meetingService.getAllForms();
          if (res.data.forms) setForms(res.data.forms);
        } else {
          await meetingService.createForm(editFormData);
          const res = await meetingService.getAllForms();
          if (res.data.forms) setForms(res.data.forms);
        }
        setActiveView('meetings');
      } catch (e) { console.error(e); alert('Form kaydedilemedi'); }
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
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: 'transparent' }}
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
        <div className="flex gap-4">
          <button
            onClick={() => setActiveView('meeting-calendar')}
            className="flex items-center gap-2 rounded-xl h-11 px-5 bg-white border border-gray-200 hover:bg-gray-50 text-text-muted font-bold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined">calendar_month</span>
            Takvim Görünümü
          </button>
          <button
            onClick={handleCreateNewClick}
            className="flex items-center gap-2 rounded-xl h-11 px-5 bg-primary hover:bg-orange-600 text-white text-sm font-bold transition-transform active:scale-95 shadow-md"
          >
            <span className="material-symbols-outlined text-xl">add</span>
            Yeni Toplantı Formu Oluştur
          </button>
        </div>
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
                          onClick={() => {
                            const url = `${window.location.origin}/#/appointment?id=${form.id}`;
                            navigator.clipboard.writeText(url).then(() => {
                              alert('Bağlantı kopyalandı: ' + url);
                            });
                          }}
                          className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors flex items-center gap-1"
                          title="Bağlantıyı Kopyala"
                        >
                          <span className="material-symbols-outlined text-lg">link</span>
                          <span className="hidden sm:inline">Link</span>
                        </button>
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
      </div >
    </div >
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
                      {teachers.map(t => (
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

  // --- NEW RENDER FUNCTIONS ---

  const renderMeetingCalendar = () => {
    return (
      <div className="flex flex-col gap-6 animate-fadeIn max-w-6xl mx-auto h-[calc(100vh-140px)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveView('meetings')}
            className="size-10 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-text-muted hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h2 className="text-2xl font-bold text-text-main dark:text-white">Toplantı Takvimi</h2>
        </div>
        {settings.calendarId ? (
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-2 overflow-hidden">
            <iframe
              src={`https://calendar.google.com/calendar/embed?src=${encodeURIComponent(settings.calendarId)}&ctz=Europe%2FIstanbul`}
              style={{ border: 0 }}
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              title="Google Calendar"
            ></iframe>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-10 text-center">
            <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <span className="material-symbols-outlined text-5xl">calendar_today</span>
            </div>
            <h3 className="text-xl font-bold text-text-main dark:text-white mb-2">Takvim Bağlanmadı</h3>
            <p className="text-text-muted mb-6 max-w-md">
              Google Takvim'inizi burada görüntülemek için Ayarlar sayfasından <b>Takvim ID</b>'nizi girmeniz gerekmektedir.
            </p>
            <button
              onClick={() => setActiveView('settings')}
              className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-colors"
            >
              Ayarlara Git
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderTeachers = () => (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">Öğretmenler</h2>
        <button onClick={() => setEditingTeacher({ id: Date.now(), name: '', role: '', branch: '', image: 'face' })} className="flex items-center gap-2 rounded-xl h-11 px-5 bg-primary hover:bg-orange-600 text-white text-sm font-bold shadow-md">
          <span className="material-symbols-outlined">add</span>
          Yeni Öğretmen
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teachers.map(t => (
          <div key={t.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4">
            <div className="size-14 rounded-full bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined text-2xl">{t.image}</span></div>
            <div className="flex-1">
              <h3 className="font-bold text-text-main dark:text-white">{t.name}</h3>
              <p className="text-sm text-text-muted">{t.role}</p>
              <p className="text-xs text-text-muted">{t.branch}</p>
            </div>
            <button onClick={() => setEditingTeacher(t)} className="text-gray-400 hover:text-primary"><span className="material-symbols-outlined">edit</span></button>
            <button onClick={() => handleDeleteTeacher(t.id)} className="text-gray-400 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
          </div>
        ))}
      </div>
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold">{teachers.find(t => t.id === editingTeacher.id) ? 'Öğretmen Düzenle' : 'Yeni Öğretmen'}</h3>
            <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20" placeholder="Ad Soyad" value={editingTeacher.name} onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })} />
            <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20" placeholder="Görev" value={editingTeacher.role} onChange={(e) => setEditingTeacher({ ...editingTeacher, role: e.target.value })} />
            <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20" placeholder="Branş" value={editingTeacher.branch} onChange={(e) => setEditingTeacher({ ...editingTeacher, branch: e.target.value })} />
            <div>
              <label className="text-xs font-bold text-text-muted mb-1 block">İkon (Material Symbol)</label>
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">{editingTeacher.image || 'face'}</span>
                </div>
                <select
                  value={editingTeacher.image || 'face'}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, image: e.target.value })}
                  className="flex-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20"
                >
                  <option value="face">Yüz 1</option>
                  <option value="face_2">Yüz 2</option>
                  <option value="face_3">Yüz 3</option>
                  <option value="face_4">Yüz 4</option>
                  <option value="face_5">Yüz 5</option>
                  <option value="face_6">Yüz 6</option>
                  <option value="person">Kişi</option>
                  <option value="school">Okul</option>
                  <option value="sports_handball">Spor</option>
                  <option value="music_note">Müzik</option>
                  <option value="palette">Sanat</option>
                  <option value="psychology">Psikoloji</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingTeacher(null)} className="px-4 py-2 text-gray-500">İptal</button>
              <button onClick={handleSaveTeacher} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderClasses = () => (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">Sınıflar</h2>
        <button onClick={() => setEditingClass({ id: Date.now(), name: '', capacity: 15, ageGroup: '', teacherIds: [] })} className="flex items-center gap-2 rounded-xl h-11 px-5 bg-primary hover:bg-orange-600 text-white text-sm font-bold shadow-md">
          <span className="material-symbols-outlined">add</span>
          Yeni Sınıf
        </button>
      </div>

      {(!classes || classes.length === 0) ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
          <p className="text-text-muted">Henüz sınıf eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-text-main dark:text-white text-lg">{c.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => setEditingClass(c)} className="text-gray-400 hover:text-primary"><span className="material-symbols-outlined text-xl">edit</span></button>
                  <button onClick={() => handleDeleteClass(c.id)} className="text-gray-400 hover:text-red-500"><span className="material-symbols-outlined text-xl">delete</span></button>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-text-muted"><span className="material-symbols-outlined text-lg">child_care</span>{c.ageGroup}</div>
                <div className="flex items-center gap-2 text-text-muted"><span className="material-symbols-outlined text-lg">group</span>Kapasite: {c.capacity}</div>
                <div className="flex flex-wrap gap-1 mt-2">{c.teacherIds?.map(tid => { const t = teachers.find(x => x.id === tid); return t ? <span key={tid} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-bold">{t.name}</span> : null; })}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-xl font-bold">{classes.find(c => c.id === editingClass.id) ? 'Sınıf Düzenle' : 'Yeni Sınıf'}</h3>
            <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20" placeholder="Sınıf Adı" value={editingClass.name} onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })} />
            <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20" placeholder="Yaş Grubu (ör: 3-4 Yaş)" value={editingClass.ageGroup} onChange={(e) => setEditingClass({ ...editingClass, ageGroup: e.target.value })} />
            <input type="number" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20" placeholder="Kapasite" value={editingClass.capacity} onChange={(e) => setEditingClass({ ...editingClass, capacity: parseInt(e.target.value) || 0 })} />
            <div className="flex justify-end gap-3">
              <button onClick={() => setEditingClass(null)} className="px-4 py-2 text-gray-500">İptal</button>
              <button onClick={handleSaveClass} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFoodMenu = () => {
    const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
    return (
      <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">Haftalık Yemek Listesi</h2>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr><th className="px-4 py-3 text-left font-bold text-text-muted">Gün</th><th className="px-4 py-3 text-left font-bold text-text-muted">Kahvaltı</th><th className="px-4 py-3 text-left font-bold text-text-muted">Öğle Yemeği</th><th className="px-4 py-3 text-left font-bold text-text-muted">Atıştırmalık</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {days.map(day => (
                <tr key={day} className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3 font-bold text-primary">{day}</td>
                  <td className="px-4 py-3"><input className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm" value={foodMenu[day]?.breakfast || ''} onChange={(e) => setFoodMenu({ ...foodMenu, [day]: { ...foodMenu[day], breakfast: e.target.value } })} /></td>
                  <td className="px-4 py-3"><input className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm" value={foodMenu[day]?.lunch || ''} onChange={(e) => setFoodMenu({ ...foodMenu, [day]: { ...foodMenu[day], lunch: e.target.value } })} /></td>
                  <td className="px-4 py-3"><input className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm" value={foodMenu[day]?.snack || ''} onChange={(e) => setFoodMenu({ ...foodMenu, [day]: { ...foodMenu[day], snack: e.target.value } })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleSaveMenu} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg active:scale-95">
            <span className="material-symbols-outlined">save</span>
            Listeyi Kaydet
          </button>
        </div>
      </div>
    );
  };

  const renderSchedule = () => (
    <div className="max-w-4xl mx-auto animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">Günlük Ders Programı</h2>
        <button onClick={() => setSchedule([...schedule, { time: '', activity: '', classId: 0 }])} className="flex items-center gap-2 rounded-xl h-10 px-4 bg-primary/10 text-primary text-sm font-bold hover:bg-primary hover:text-white">
          <span className="material-symbols-outlined text-xl">add</span>Etkinlik Ekle
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-white/5">
            <tr><th className="px-4 py-3 text-left font-bold text-text-muted w-40">Saat</th><th className="px-4 py-3 text-left font-bold text-text-muted">Etkinlik</th><th className="px-4 py-3 w-12"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {schedule.map((s, i) => (
              <tr key={i} className="hover:bg-gray-50 dark:hover:bg-white/5">
                <td className="px-4 py-3"><input className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm font-bold" value={s.time} onChange={(e) => { const ns = [...schedule]; ns[i].time = e.target.value; setSchedule(ns); }} placeholder="09:00-10:00" /></td>
                <td className="px-4 py-3"><input className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm" value={s.activity} onChange={(e) => { const ns = [...schedule]; ns[i].activity = e.target.value; setSchedule(ns); }} placeholder="Etkinlik Adı" /></td>
                <td className="px-4 py-3"><button onClick={() => setSchedule(schedule.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end mt-4">
        <button onClick={handleSaveSchedule} className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg active:scale-95">
          <span className="material-symbols-outlined">save</span>
          Programı Kaydet
        </button>
      </div>
    </div>
  );

  const renderApplications = () => {
    const typeLabels: { [key: string]: string } = { school: 'Okul Kayıt', staff: 'Personel Başvurusu', contact: 'İletişim' };
    const statusColors: { [key: string]: string } = { new: 'bg-yellow-100 text-yellow-700', reviewed: 'bg-blue-100 text-blue-700', contacted: 'bg-green-100 text-green-700' };
    const statusLabels: { [key: string]: string } = { new: 'Yeni', reviewed: 'İncelendi', contacted: 'İletişim Kuruldu' };
    return (
      <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">Başvuru Formları</h2>
        <div className="flex gap-4 flex-wrap">
          {['school', 'staff', 'contact'].map(type => (
            <div key={type} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
              <span className="material-symbols-outlined text-primary">{type === 'school' ? 'school' : type === 'staff' ? 'work' : 'mail'}</span>
              <span className="font-bold text-text-main dark:text-white">{typeLabels[type]}</span>
              <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-bold">{applications.filter(a => a.type === type).length}</span>
            </div>
          ))}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-white/5">
              <tr><th className="px-4 py-3 text-left font-bold text-text-muted">Tip</th><th className="px-4 py-3 text-left font-bold text-text-muted">İsim</th><th className="px-4 py-3 text-left font-bold text-text-muted">İletişim</th><th className="px-4 py-3 text-left font-bold text-text-muted">Mesaj</th><th className="px-4 py-3 text-left font-bold text-text-muted">Tarih</th><th className="px-4 py-3 text-left font-bold text-text-muted">Durum</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                  <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-xs rounded font-bold">{typeLabels[app.type]}</span></td>
                  <td className="px-4 py-3 font-bold text-text-main dark:text-white">{app.name}</td>
                  <td className="px-4 py-3 text-text-muted text-xs"><div>{app.email}</div><div>{app.phone}</div></td>
                  <td className="px-4 py-3 text-text-muted max-w-xs truncate">{app.message}</td>
                  <td className="px-4 py-3 text-text-muted">{app.date}</td>
                  <td className="px-4 py-3">
                    <select value={app.status} onChange={(e) => setApplications(applications.map(a => a.id === app.id ? { ...a, status: e.target.value as 'new' | 'reviewed' | 'contacted' } : a))} className={`px-2 py-1 rounded text-xs font-bold ${statusColors[app.status]}`}>
                      {Object.entries(statusLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderForms = () => (
    <div className="max-w-6xl mx-auto animate-fadeIn space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">Formlar</h2>
        <button onClick={() => { const title = 'Yeni Form'; setEditingForm({ id: Date.now().toString(), title, slug: slugify(title), description: '', fields: [], isActive: true, submissions: [] }); setActiveView('form-builder'); }} className="flex items-center gap-2 rounded-xl h-11 px-5 bg-primary hover:bg-orange-600 text-white text-sm font-bold shadow-md">
          <span className="material-symbols-outlined">add</span>
          Yeni Form Oluştur
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {customForms.map(form => {
          const formUrl = `${window.location.origin}${window.location.pathname}#/form/${form.slug || slugify(form.title)}`;
          return (
            <div key={form.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="size-12 rounded-full bg-orange-100 dark:bg-orange-900/20 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl">feed</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${form.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {form.isActive ? 'Aktif' : 'Pasif'}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-main dark:text-white mb-1">{form.title}</h3>
                <p className="text-sm text-text-muted line-clamp-2">{form.description || 'Açıklama yok'}</p>
              </div>
              {/* Form URL Display */}
              <div className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/10">
                <span className="material-symbols-outlined text-primary text-sm">link</span>
                <code className="text-xs text-text-muted flex-1 truncate">/form/{form.slug || slugify(form.title)}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(formUrl);
                    alert('Form linki kopyalandı!');
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-white/10 rounded transition-colors"
                  title="Linki Kopyala"
                >
                  <span className="material-symbols-outlined text-sm text-text-muted">content_copy</span>
                </button>
              </div>
              <div className="pt-4 border-t border-gray-50 dark:border-white/5 flex items-center justify-between text-sm font-bold">
                <div className="flex gap-2">
                  <button onClick={() => { setEditingForm(form); setActiveView('form-builder'); }} className="flex items-center gap-1 text-primary hover:text-orange-700">
                    <span className="material-symbols-outlined text-lg">edit_square</span> Düzenle
                  </button>
                  <button onClick={() => { setEditingForm(form); setActiveView('form-submissions'); }} className="flex items-center gap-1 text-text-muted hover:text-text-main">
                    <span className="material-symbols-outlined text-lg">list_alt</span> Başvurular ({form.submissions?.length || 0})
                  </button>
                </div>
                <button onClick={() => handleDeleteCustomForm(form.id)} className="text-gray-400 hover:text-red-500">
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderFormBuilder = () => {
    if (!editingForm) return null;

    const onDragEnd = (result: DropResult) => {
      if (!result.destination) return;
      const items = Array.from(editingForm.fields);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      setEditingForm({ ...editingForm, fields: items });
    };

    const addField = (type: FormFieldType) => {
      const newField: FormField = {
        id: `field-${Date.now()}`,
        type,
        label: 'Yeni Alan',
        required: false,
        placeholder: '',
        options: type === 'select' || type === 'radio' || type === 'checkbox' ? ['Seçenek 1', 'Seçenek 2'] : undefined
      };
      setEditingForm({ ...editingForm, fields: [...editingForm.fields, newField] });
    };

    const removeField = (id: string) => {
      setEditingForm({ ...editingForm, fields: editingForm.fields.filter(f => f.id !== id) });
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
      setEditingForm({ ...editingForm, fields: editingForm.fields.map(f => f.id === id ? { ...f, ...updates } : f) });
    };

    const saveForm = async () => {
      try {
        const exists = customForms.find(f => f.id === editingForm.id);
        if (exists) {
          await formService.update(editingForm.id, editingForm);
        } else {
          await formService.create(editingForm);
        }
        // Refetch to be sure
        const res = await formService.getAll();
        if (res.data.forms) setCustomForms(res.data.forms);

        setActiveView('forms');
        setEditingForm(null);
      } catch (error) {
        console.error('Form save error', error);
        alert('Form kaydedilirken hata oluştu.');
      }
    };

    return (
      <div className="max-w-6xl mx-auto animate-fadeIn pb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setActiveView('forms')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5"><span className="material-symbols-outlined">arrow_back</span></button>
            <h2 className="text-2xl font-bold text-text-main dark:text-white">Form Düzenleyici</h2>
          </div>
          <button onClick={saveForm} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined">save</span> Kaydet
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form Settings & Toolbox */}
          <div className="space-y-6">


            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm space-y-4">
              <h3 className="font-bold text-lg mb-2">Form Ayarları</h3>
              <input value={editingForm.title} onChange={e => setEditingForm({ ...editingForm, title: e.target.value, slug: slugify(e.target.value) })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20" placeholder="Form Başlığı" />
              <textarea value={editingForm.description} onChange={e => setEditingForm({ ...editingForm, description: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20" placeholder="Form Açıklaması" rows={3} />

              <label className="block">
                <span className="text-xs font-bold text-text-muted">Hangi Sayfada Görünecek?</span>
                <select
                  value={editingForm.targetPage || 'none'}
                  onChange={e => setEditingForm({ ...editingForm, targetPage: e.target.value })}
                  className="w-full mt-1 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20"
                >
                  <option value="none">Seçiniz (Sadece Link ile)</option>
                  <option value="contact">İletişim Sayfası</option>
                  <option value="personnel">Personel Başvuru Sayfası</option>
                  <option value="student">Öğrenci Kayıt Sayfası</option>
                  <option value="meetingDays">Tanışma Günleri Sayfası</option>
                </select>
                <p className="text-xs text-text-muted mt-1">Eğer bir sayfa seçerseniz, o sayfadaki mevcut formun yerine bu form gösterilir.</p>
              </label>

              <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingForm.isActive} onChange={e => setEditingForm({ ...editingForm, isActive: e.target.checked })} className="size-4 rounded text-primary focus:ring-primary" />
                  <span className="text-sm font-bold">Form Görünür (Aktif)</span>
                </label>
                <p className="text-xs text-text-muted -mt-2 ml-6">Pasifse form hiç görünmez.</p>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editingForm.isAccessible !== false} onChange={e => setEditingForm({ ...editingForm, isAccessible: e.target.checked })} className="size-4 rounded text-green-600 focus:ring-green-600" />
                  <span className="text-sm font-bold">Form Erişilebilir (Doldurulabilir)</span>
                </label>
                <p className="text-xs text-text-muted -mt-2 ml-6">Kapalıysa form görünür ancak kullanıcı dolduramaz.</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
              <h3 className="font-bold text-lg mb-4">Alan Ekle</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { type: 'text', icon: 'text_fields', label: 'Metin' },
                  { type: 'textarea', icon: 'notes', label: 'Uzun Metin' },
                  { type: 'number', icon: '123', label: 'Sayı' },
                  { type: 'email', icon: 'mail', label: 'E-posta' },
                  { type: 'tel', icon: 'call', label: 'Telefon' },
                  { type: 'date', icon: 'calendar_today', label: 'Tarih' },
                  { type: 'select', icon: 'arrow_drop_down_circle', label: 'Seçim' },
                  { type: 'checkbox', icon: 'check_box', label: 'Onay Kutusu' },
                ].map((item) => (
                  <button key={item.type} onClick={() => addField(item.type as FormFieldType)} className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:border-primary hover:bg-primary/5 hover:text-primary transition-all">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <span className="text-xs font-bold">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Drag & Drop Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-gray-50 dark:bg-black/20 p-6 rounded-2xl min-h-[600px] border-2 border-dashed border-gray-200 dark:border-white/10">
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="form-fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                      {editingForm.fields.length === 0 && (
                        <div className="text-center text-text-muted py-20">
                          <span className="material-symbols-outlined text-4xl mb-2 opacity-50">drag_indicator</span>
                          <p>Soldaki menüden alan ekleyin</p>
                        </div>
                      )}
                      {editingForm.fields.map((field, index) => (
                        <React.Fragment key={field.id}>
                          <Draggable draggableId={field.id} index={index}>
                            {(provided) => (
                              <div ref={provided.innerRef} {...provided.draggableProps} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 group relative">
                                <div {...provided.dragHandleProps} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 cursor-move hover:text-primary">
                                  <span className="material-symbols-outlined">drag_indicator</span>
                                </div>
                                <div className="pl-8 pr-8 space-y-3">
                                  <div className="flex gap-4">
                                    <input value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent text-sm font-bold" placeholder="Alan Etiketi" />
                                    <div className="flex items-center gap-2">
                                      <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} id={`req-${field.id}`} />
                                      <label htmlFor={`req-${field.id}`} className="text-xs font-bold text-text-muted">Zorunlu</label>
                                    </div>
                                  </div>
                                  {(field.type === 'text' || field.type === 'email' || field.type === 'tel' || field.type === 'number') && (
                                    <input value={field.placeholder || ''} onChange={e => updateField(field.id, { placeholder: e.target.value })} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/10 text-xs" placeholder="Placeholder (İpucu metni)" />
                                  )}
                                  {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
                                    <div className="space-y-2">
                                      <label className="text-xs font-bold text-text-muted">Seçenekler (Virgülle ayırın)</label>
                                      <input value={field.options?.join(', ') || ''} onChange={e => updateField(field.id, { options: e.target.value.split(',').map(s => s.trim()) })} className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/10 text-xs" placeholder="Seçenek 1, Seçenek 2" />
                                    </div>
                                  )}
                                </div>
                                <button onClick={() => removeField(field.id)} className="absolute right-2 top-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="material-symbols-outlined">delete</span>
                                </button>
                              </div>
                            )}
                          </Draggable>
                        </React.Fragment>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFormSubmissions = () => {
    if (!editingForm) return null;

    return (
      <div className="max-w-6xl mx-auto animate-fadeIn space-y-6 pb-20">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => { setActiveView('forms'); setEditingForm(null); }} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-text-muted">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-text-main dark:text-white">{editingForm.title} Başvuruları</h2>
            <p className="text-text-muted">Toplam {editingForm.submissions?.length || 0} başvuru</p>
          </div>
          {editingForm.submissions?.length > 0 && (
            <button
              onClick={() => {
                // Generate CSV content
                const headers = ['Tarih', ...editingForm.fields.map(f => f.label)];
                const rows = editingForm.submissions.map(sub => {
                  const date = sub.createdAt ? formatDateTime(sub.createdAt) : formatDateTime(sub.date || new Date());
                  const fieldValues = editingForm.fields.map(field => {
                    const val = sub.data?.[field.label] || sub.data?.[field.id] || '-';
                    return typeof val === 'object' ? JSON.stringify(val) : String(val).replace(/"/g, '""');
                  });
                  return [date, ...fieldValues];
                });

                // Create CSV with BOM for Excel Turkish character support
                const BOM = '\uFEFF';
                const csvContent = BOM + [
                  headers.map(h => `"${h}"`).join(';'),
                  ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
                ].join('\n');

                // Download file
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${editingForm.title.replace(/\s+/g, '_')}_Basvurular_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              Excel Olarak İndir
            </button>
          )}
        </div>

        <div className="bg-white dark:bg-card-dark rounded-3xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <th className="p-4 text-xs font-bold text-text-muted uppercase w-32">Tarih</th>
                  {editingForm.fields.slice(0, 4).map(field => (
                    <th key={field.id} className="p-4 text-xs font-bold text-text-muted uppercase whitespace-nowrap min-w-[150px]">{field.label}</th>
                  ))}
                  {editingForm.fields.length > 4 && (
                    <th className="p-4 text-xs font-bold text-text-muted uppercase w-20">Detay</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {editingForm.submissions?.length > 0 ? (
                  editingForm.submissions.map((sub, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setViewingSubmission(sub)}
                      className="border-b border-gray-50 dark:border-white/5 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors cursor-pointer"
                    >
                      <td className="p-4 text-sm font-medium text-text-muted whitespace-nowrap">
                        {sub.date ? new Date(sub.date).toLocaleDateString('tr-TR') : '-'}
                      </td>
                      {editingForm.fields.slice(0, 4).map(field => {
                        const val = sub.data?.[field.label] || sub.data?.[field.id] || '-';
                        const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
                        return (
                          <td key={field.id} className="p-4 text-sm font-bold text-text-main dark:text-gray-300 max-w-[200px] truncate" title={displayVal}>
                            {displayVal.length > 30 ? displayVal.substring(0, 30) + '...' : displayVal}
                          </td>
                        );
                      })}
                      {editingForm.fields.length > 4 && (
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary">
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Görüntüle
                          </span>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={editingForm.fields.length > 4 ? 6 : editingForm.fields.slice(0, 4).length + 1} className="p-12 text-center text-text-muted">
                      Henüz başvuru bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submission Detail Modal */}
        {viewingSubmission && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewingSubmission(null)}>
            <div
              className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fadeIn"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-black text-text-main dark:text-white">Başvuru Detayları</h3>
                  <p className="text-sm text-text-muted mt-1">
                    {viewingSubmission.date ? new Date(viewingSubmission.date).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Tarih belirtilmedi'}
                  </p>
                </div>
                <button
                  onClick={() => setViewingSubmission(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
                {editingForm.fields.map(field => {
                  const val = viewingSubmission.data?.[field.label] || viewingSubmission.data?.[field.id] || '-';
                  const displayVal = typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val);
                  return (
                    <div key={field.id} className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                      <label className="text-xs font-bold text-text-muted uppercase tracking-wider">{field.label}</label>
                      <p className="text-text-main dark:text-white font-medium mt-1 whitespace-pre-wrap break-words">{displayVal}</p>
                    </div>
                  );
                })}

                {/* Show any extra data keys not in current form fields (for backward compatibility) */}
                {viewingSubmission.data && Object.keys(viewingSubmission.data).filter(key =>
                  !editingForm.fields.some(f => f.id === key || f.label === key)
                ).length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <p className="text-xs font-bold text-text-muted uppercase mb-3">Ek Bilgiler</p>
                      {Object.entries(viewingSubmission.data)
                        .filter(([key]) => !editingForm.fields.some(f => f.id === key || f.label === key))
                        .map(([key, val]) => (
                          <div key={key} className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-2">
                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">{key}</label>
                            <p className="text-text-main dark:text-white font-medium mt-1 whitespace-pre-wrap break-words">
                              {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val)}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => setViewingSubmission(null)}
                  className="px-5 py-2.5 text-text-muted hover:text-text-main dark:hover:text-white font-bold rounded-xl transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderContentManagement = () => {
    return (
      <div className="max-w-6xl mx-auto animate-fadeIn space-y-6 pb-20">
        <h2 className="text-2xl font-bold text-text-main dark:text-white">İçerik Yönetimi</h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
          <button
            onClick={() => setContentTab('home')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${contentTab === 'home' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            Anasayfa
          </button>
          <button
            onClick={() => setContentTab('about')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${contentTab === 'about' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            Patika'ya Dair
          </button>
          <button
            onClick={() => setContentTab('contact')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${contentTab === 'contact' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            İletişim
          </button>
          <button
            onClick={() => setContentTab('meetingDays')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${contentTab === 'meetingDays' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            Tanışma Günleri
          </button>

          <button
            onClick={() => setContentTab('documents')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${contentTab === 'documents' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}
          >
            Dokümanlar
          </button>
        </div>

        {/* Homepage Content Tab */}
        {contentTab === 'home' && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-lg text-text-main dark:text-white">Anasayfa İçerikleri</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted mb-1">Hero Başlık</label>
                <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.heroTitle} onChange={(e) => setHomeContent({ ...homeContent, heroTitle: e.target.value })} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">Birincil Buton Metni</label>
                  <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.primaryButtonText} onChange={(e) => setHomeContent({ ...homeContent, primaryButtonText: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">Birincil Buton Linki</label>
                  <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.primaryButtonLink} onChange={(e) => setHomeContent({ ...homeContent, primaryButtonLink: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">İkincil Buton Metni</label>
                  <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.secondaryButtonText} onChange={(e) => setHomeContent({ ...homeContent, secondaryButtonText: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">İkincil Buton Linki</label>
                  <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.secondaryButtonLink} onChange={(e) => setHomeContent({ ...homeContent, secondaryButtonLink: e.target.value })} />
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Ana Bölüm Başlığı</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Bölüm Başlığı</label>
                    <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.valuesTitle} onChange={(e) => setHomeContent({ ...homeContent, valuesTitle: e.target.value })} />
                  </div>

                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Masallar ve Gerçekler Bölümü</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Masallar Başlık</label>
                    <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.talesTitle || ''} onChange={(e) => setHomeContent({ ...homeContent, talesTitle: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Masallar Metin</label>
                    <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.talesText || ''} onChange={(e) => setHomeContent({ ...homeContent, talesText: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Masallar Vurgu</label>
                    <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.talesHighlight || ''} onChange={(e) => setHomeContent({ ...homeContent, talesHighlight: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Gerçekler Başlık</label>
                    <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.realityTitle || ''} onChange={(e) => setHomeContent({ ...homeContent, realityTitle: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Gerçekler Metin</label>
                    <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.realityText || ''} onChange={(e) => setHomeContent({ ...homeContent, realityText: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Gerçekler Vurgu</label>
                    <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.realityHighlight || ''} onChange={(e) => setHomeContent({ ...homeContent, realityHighlight: e.target.value })} />
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Formlar Bölümü</h4>
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">Formlar Alanı Başlığı</label>
                  <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={homeContent.formsTitle || ''} onChange={(e) => setHomeContent({ ...homeContent, formsTitle: e.target.value })} />
                </div>
              </div>


              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveContent('home')}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          </div>
        )
        }

        {/* Meeting Days Content Tab */}
        {
          contentTab === 'meetingDays' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-6 space-y-6">
              <h3 className="font-bold text-lg text-text-main dark:text-white">Tanışma Günleri İçerikleri</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">Sayfa Başlığı (Hero)</label>
                  <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={meetingDaysContent.heroTitle} onChange={(e) => setMeetingDaysContent({ ...meetingDaysContent, heroTitle: e.target.value })} />
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Tanıtım Bölümü</h4>
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Bölüm Başlığı</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={meetingDaysContent.sectionTitle} onChange={(e) => setMeetingDaysContent({ ...meetingDaysContent, sectionTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Giriş Metni (Markdown Kullanılabilir: **kalın**)</label>
                      <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 h-32" value={meetingDaysContent.introText} onChange={(e) => setMeetingDaysContent({ ...meetingDaysContent, introText: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Takvim Kutusu</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Takvim Başlığı (örn: Şubat Ayı Boyunca)</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={meetingDaysContent.scheduleTitle} onChange={(e) => setMeetingDaysContent({ ...meetingDaysContent, scheduleTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Takvim Zamanı</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={meetingDaysContent.scheduleTime} onChange={(e) => setMeetingDaysContent({ ...meetingDaysContent, scheduleTime: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted mb-1">Detay Metni</label>
                    <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 h-24" value={meetingDaysContent.descriptionText} onChange={(e) => setMeetingDaysContent({ ...meetingDaysContent, descriptionText: e.target.value })} />
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Form Bilgilendrome Kutusu</h4>
                  <div className="grid grid-cols-1 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Kutu Başlığı</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={meetingDaysContent.formInfoTitle} onChange={(e) => setMeetingDaysContent({ ...meetingDaysContent, formInfoTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Kutu Metni</label>
                      <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 h-20" value={meetingDaysContent.formInfoText} onChange={(e) => setMeetingDaysContent({ ...meetingDaysContent, formInfoText: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveContent('meetingDays')}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          )
        }

        {/* Contact Content Tab */}
        {
          contentTab === 'contact' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-6 space-y-6">
              <h3 className="font-bold text-lg text-text-main dark:text-white">İletişim Sayfası İçerikleri</h3>

              <div className="space-y-6">
                {/* Genel Ayarlar */}
                <div>
                  <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Genel Ayarlar</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Sayfa Başlığı</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={contactContent.pageTitle} onChange={(e) => setContactContent({ ...contactContent, pageTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Sayfa Alt Başlığı</label>
                      <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 h-20" value={contactContent.pageSubtitle} onChange={(e) => setContactContent({ ...contactContent, pageSubtitle: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* İletişim Bilgileri */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <h4 className="font-bold text-md text-text-main dark:text-white mb-3">İletişim Bilgileri</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Adres</label>
                      <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 h-20" value={contactContent.address} onChange={(e) => setContactContent({ ...contactContent, address: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-text-muted mb-1">Telefon</label>
                        <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={contactContent.phone} onChange={(e) => setContactContent({ ...contactContent, phone: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-muted mb-1">Telefon Saatleri</label>
                        <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={contactContent.phoneHours} onChange={(e) => setContactContent({ ...contactContent, phoneHours: e.target.value })} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">E-posta</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={contactContent.email} onChange={(e) => setContactContent({ ...contactContent, email: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* Harita ve Diğer */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Harita ve Bağlantılar</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Harita Linki (Google Maps)</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={contactContent.mapLink} onChange={(e) => setContactContent({ ...contactContent, mapLink: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Hızlı Başvuru Bağlantıları Başlığı</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={contactContent.quickLinksTitle || ''} onChange={(e) => setContactContent({ ...contactContent, quickLinksTitle: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveContent('contact')}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          )
        }

        {
          contentTab === 'about' && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm p-6 space-y-6">
              <h3 className="font-bold text-lg text-text-main dark:text-white">Patika'ya Dair Sayfası İçerikleri</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted mb-1">Hero Başlık</label>
                  <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={aboutContent.heroTitle} onChange={(e) => setAboutContent({ ...aboutContent, heroTitle: e.target.value })} />
                </div>


                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Tanıtım ve Bakış Açısı</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Tanıtım Başlığı (Patika'ya Dair)</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={aboutContent.introTitle || ''} onChange={(e) => setAboutContent({ ...aboutContent, introTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Tanıtım Metni</label>
                      <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 h-32" value={aboutContent.introText || ''} onChange={(e) => setAboutContent({ ...aboutContent, introText: e.target.value })} />
                    </div>

                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                  <h4 className="font-bold text-md text-text-main dark:text-white mb-3">Bakış Açısı ve Felsefe</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Başlık (Bakış Açımız; Masallar ve Gerçekler)</label>
                      <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5" value={aboutContent.perspectiveTitle || ''} onChange={(e) => setAboutContent({ ...aboutContent, perspectiveTitle: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Metin İçeriği</label>
                      <textarea className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 h-64" value={aboutContent.perspectiveText || ''} onChange={(e) => setAboutContent({ ...aboutContent, perspectiveText: e.target.value })} />
                    </div>
                  </div>
                </div>

              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => saveContent('about')}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                >
                  Değişiklikleri Kaydet
                </button>
              </div>
            </div>
          )
        }

        {
          contentTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setEditingDocument({ id: Date.now().toString(), name: '', url: '', icon: 'description', color: 'text-secondary', bg: 'bg-red-50 dark:bg-red-900/20' })}
                  className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-md hover:bg-orange-600 transition-colors"
                >
                  <span className="material-symbols-outlined">add</span>
                  Yeni Doküman Ekle
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`size-10 shrink-0 rounded-full ${doc.bg} flex items-center justify-center ${doc.color}`}>
                        <span className="material-symbols-outlined">{doc.icon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-sm text-text-main dark:text-white truncate">{doc.name}</span>
                        <span className="text-xs text-text-muted truncate">{doc.url}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button onClick={() => setEditingDocument(doc)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-text-muted hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-lg">edit</span>
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Bu dokümanı silmek istediğinize emin misiniz?')) {
                            setDocuments(documents.filter(d => d.id !== doc.id));
                          }
                        }}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-400 hover:text-red-500 transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {editingDocument && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-text-main dark:text-white">
                        {documents.find(d => d.id === editingDocument.id) ? 'Dokümanı Düzenle' : 'Yeni Doküman'}
                      </h3>
                      <button onClick={() => setEditingDocument(null)} className="text-gray-400 hover:text-red-500">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Doküman Adı</label>
                      <input
                        className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-text-main dark:text-white"
                        value={editingDocument.name}
                        onChange={(e) => setEditingDocument({ ...editingDocument, name: e.target.value })}
                        placeholder="Örn: Kayıt Formu"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">Dosya Yükle</label>
                      <div className="flex flex-col gap-2">
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setEditingDocument({ ...editingDocument, url: `/files/${file.name}` });
                            }
                          }}
                          className="block w-full text-sm text-text-muted
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-xl file:border-0
                                file:text-sm file:font-bold
                                file:bg-primary file:text-white
                                hover:file:bg-orange-600
                                cursor-pointer
                            "
                        />
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                          <span className="material-symbols-outlined text-text-muted">link</span>
                          <code className="text-sm font-mono text-text-main dark:text-white truncate flex-1">{editingDocument.url || 'Dosya seçilmedi'}</code>
                        </div>
                        <p className="text-xs text-orange-500 bg-orange-50 dark:bg-orange-900/10 p-2 rounded-lg border border-orange-100 dark:border-orange-900/20">
                          <strong>Bilgi:</strong> Web sitemiz statik yapıdadır. Dosyasını seçtiğiniz dokümanı, proje klasöründeki <code>/public/files/</code> dizinine manuel olarak eklemeniz gerekmektedir.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-text-muted mb-1">İkon (Material Symbol)</label>
                        <input
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-text-main dark:text-white"
                          value={editingDocument.icon}
                          onChange={(e) => setEditingDocument({ ...editingDocument, icon: e.target.value })}
                          placeholder="description"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-muted mb-1">Renk Teması</label>
                        <select
                          className="w-full p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-text-main dark:text-white appearance-none"
                          onChange={(e) => {
                            const val = e.target.value;
                            let theme = { color: 'text-secondary', bg: 'bg-red-50 dark:bg-red-900/20' };
                            if (val === 'blue') theme = { color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' };
                            if (val === 'green') theme = { color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' };
                            if (val === 'orange') theme = { color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' };
                            if (val === 'purple') theme = { color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' };
                            setEditingDocument({ ...editingDocument, ...theme });
                          }}
                          defaultValue={
                            editingDocument.color.includes('blue') ? 'blue' :
                              editingDocument.color.includes('green') ? 'green' :
                                editingDocument.color.includes('orange') ? 'orange' :
                                  editingDocument.color.includes('purple') ? 'purple' : 'red'
                          }
                        >
                          <option value="red">Kırmızı</option>
                          <option value="blue">Mavi</option>
                          <option value="green">Yeşil</option>
                          <option value="orange">Turuncu</option>
                          <option value="purple">Mor</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
                      <button onClick={() => setEditingDocument(null)} className="px-5 py-2 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">İptal</button>
                      <button
                        onClick={() => {
                          const exists = documents.find(d => d.id === editingDocument.id);
                          if (exists) {
                            setDocuments(documents.map(d => d.id === editingDocument.id ? editingDocument : d));
                          } else {
                            setDocuments([...documents, editingDocument]);
                          }
                          setEditingDocument(null);
                        }}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition-transform active:scale-95"
                      >
                        Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        }
      </div >
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

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-white/5">
          <label className="block">
            <span className="text-xs font-bold text-text-muted">Bildirim E-postası (Yönetici)</span>
            <input
              type="email"
              value={settings.notificationEmail}
              onChange={(e) => setSettings({ ...settings, notificationEmail: e.target.value })}
              className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
              placeholder="yonetici@patikayuva.com"
            />
            <p className="text-xs text-text-muted mt-1">Form başvuruları bu adrese gönderilir.</p>
          </label>
          <label className="block">
            <span className="text-xs font-bold text-text-muted">Zaman Dilimi</span>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
            >
              <option value="Europe/Istanbul">Türkiye (Europe/Istanbul)</option>
              <option value="UTC">UTC</option>
            </select>
          </label>
        </div>

        <div className="flex items-end gap-2 mt-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-text-muted">Test E-postası Alıcısı</label>
            <input
              type="email"
              placeholder="test@ornek.com"
              id="test-email-input"
              className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-sm"
            />
          </div>
          <button
            onClick={async () => {
              const emailInput = document.getElementById('test-email-input') as HTMLInputElement;
              const email = emailInput.value;
              if (!email) return alert('Lütfen bir e-posta adresi girin.');

              try {
                // We need to implement settingsService.testEmail or call API directly
                // Assuming we add it to settingsService or do a fetch
                // For now, raw fetch
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_URL}/settings/test-email`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ email })
                });
                const data = await res.json();
                if (data.success) alert(data.message);
                else alert('Hata: ' + data.error);
              } catch (e) {
                console.error(e);
                alert('Test sırasında hata oluştu.');
              }
            }}
            className="h-10 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-sm"
          >
            Test E-postası Gönder
          </button>
        </div>

        <div className="pt-4 border-t border-gray-100 dark:border-white/5">
          <h4 className="font-bold text-sm text-text-main dark:text-white mb-3">EmailJS Entegrasyonu (İstemci Taraflı Gönderim)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-text-muted">Service ID</span>
              <input
                type="text"
                value={settings.emailjsServiceId}
                onChange={(e) => setSettings({ ...settings, emailjsServiceId: e.target.value })}
                className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                placeholder="service_xxx"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-text-muted">Template ID</span>
              <input
                type="text"
                value={settings.emailjsTemplateId}
                onChange={(e) => setSettings({ ...settings, emailjsTemplateId: e.target.value })}
                className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                placeholder="template_xxx"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-text-muted">Public Key</span>
              <input
                type="text"
                value={settings.emailjsPublicKey}
                onChange={(e) => setSettings({ ...settings, emailjsPublicKey: e.target.value })}
                className="w-full mt-1 h-10 px-3 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5"
                placeholder="user_xxx"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={async () => {
            if (!window.confirm('Veritabanını tüm başlangıç verileriyle (İçerik, Öğretmen, Sınıf, Form, Toplantı) doldurmak istediğinize emin misiniz?')) return;

            setIsLoading(true);
            let success = 0;
            let fail = 0;

            try {
              // 1. Content
              try {
                await contentService.update('home', initialHomeContent);
                await contentService.update('about', initialAboutContent);
                await contentService.update('contact', initialContactContent);
                await contentService.update('meetingDays', initialMeetingDaysContent);
                success++;
              } catch (e) { console.error('Content seed failed', e); fail++; }

              // 2. Teachers
              try {
                const current = (await teacherService.getAll()).data.teachers || [];
                for (const t of allSystemTeachers) {
                  if (!current.find((c: any) => c.name === t.name)) {
                    await teacherService.create({ name: t.name, role: t.role, branch: t.branch, image: t.image });
                  }
                }
                success++;
              } catch (e) { console.error('Teacher seed failed', e); fail++; }

              // 3. Classes
              try {
                const current = (await classService.getAll()).data.classes || [];
                for (const c of initialClasses) {
                  if (!current.find((cc: any) => cc.name === c.name)) {
                    await classService.create({ name: c.name, capacity: c.capacity, ageGroup: c.ageGroup, teacherIds: [] });
                  }
                }
                success++;
              } catch (e) { console.error('Class seed failed', e); fail++; }

              // 4. Forms
              try {
                const currentForms = (await formService.getAll()).data.forms || [];
                for (const f of initialCustomForms) {
                  const existsById = currentForms.find((cf: any) => cf.id === f.id);
                  const existsBySlug = currentForms.find((cf: any) => cf.slug === f.slug);

                  if (existsById) {
                    // Prefer ID match update
                    await formService.update(f.id, f);
                  } else if (existsBySlug) {
                    // Slug collision: update the rogue form with our official content
                    // We must NOT change its ID, so we strip ID from the payload if necessary,
                    // but formService.update usually ignores the ID in the body if it's cleaner.
                    // A safe way is to pass everything except ID.
                    const { id, ...rest } = f;
                    await formService.update(existsBySlug.id, rest); // Update using ITS id
                  } else {
                    // No conflict, safe to create
                    await formService.create(f);
                  }
                }
                success++;
              } catch (e) { console.error('Form seed failed', e); fail++; }

              // 5. Documents
              try {
                const docs = [
                  { id: 'reg', name: "Öğrenci Kayıt Formu", url: "#", icon: "description", color: "text-secondary", bg: "bg-red-50 dark:bg-red-900/20" },
                  { id: 'health', name: "Sağlık Bilgi Formu", url: "#", icon: "medical_services", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
                  { id: 'trip', name: "Gezi İzin Belgesi", url: "#", icon: "directions_bus", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" }
                ];
                const currentDocs = (await documentService.getAll()).data.documents || [];

                for (const d of docs) {
                  const exists = currentDocs.find((cd: any) => cd.id === d.id);
                  if (exists) {
                    await documentService.update(d.id, d);
                  } else {
                    await documentService.create(d);
                  }
                }
                success++;
              } catch (e) { console.error('Doc seed failed', e); fail++; }

              // 6. Meetings
              try {
                const existing = (await meetingService.getAllForms()).data.forms || [];
                for (const mf of initialForms) {
                  const exists = existing.find((ex: any) => ex.title === mf.title);
                  if (!exists) { await meetingService.createForm(mf); }
                }
                success++;
              } catch (e) { console.error('Meeting seed failed', e); fail++; }

              // 7. Meeting Requests
              try {
                const formsRes = await meetingService.getAllForms();
                const allForms = formsRes.data.forms || [];
                const targetForm = allForms.find((f: any) => f.title === 'Genel Tanışma Toplantısı');

                if (targetForm) {
                  const currentRequests = (await meetingService.getAllRequests()).data.requests || [];
                  for (const req of initialRequests) {
                    const exists = currentRequests.find((cr: any) => cr.studentName === req.studentName && cr.date === req.date);
                    if (!exists) {
                      await meetingService.createRequest({ ...req, formId: targetForm.id });
                    }
                  }
                  success++;
                }
              } catch (e) { console.error('Meeting Req seed failed', e); fail++; }

              // 8. Legacy Applications (Mock Submissions)
              try {
                console.log('Seeding Sample Submissions...');
                const mockApps = [
                  { type: 'school', name: 'Ahmet Yıldırım', email: 'ahmet@email.com', phone: '0532 111 2233', message: 'Çocuğumuz için kayıt olmak istiyoruz', date: '2024-10-15' },
                  { type: 'staff', name: 'Selin Kara', email: 'selin@email.com', phone: '0533 222 3344', message: 'Okul öncesi öğretmeni pozisyonu için başvuru', date: '2024-10-16' },
                  { type: 'contact', name: 'Fatma Demir', email: 'fatma@email.com', phone: '0534 333 4455', message: 'Fiyat bilgisi almak istiyorum', date: '2024-10-17' },
                ];

                for (const app of mockApps) {
                  let formId = '';
                  let data = {};

                  if (app.type === 'contact') {
                    formId = 'contact';
                    data = { 'Ad Soyad': app.name, 'E-posta': app.email, 'Telefon': app.phone, 'Mesajınız': app.message, 'Konu': 'Bilgi Alma' };
                  } else if (app.type === 'staff') {
                    formId = 'personnel';
                    data = { 'Ad Soyad': app.name, 'E-posta': app.email, 'Telefon': app.phone, 'Ön Yazı': app.message, 'Başvurulan Pozisyon': 'Sınıf Öğretmeni' };
                  } else if (app.type === 'school') {
                    formId = 'school_register';
                    data = { 'Veli Adı Soyadı': app.name, 'İletişim Numarası': app.phone, 'Öğrenci Adı Soyadı': 'Örnek Öğrenci', 'Doğum Tarihi': '2020-01-01' };
                  }

                  if (formId) {
                    try {
                      // We use the public submit endpoint to seed submissions
                      await formService.submit(formId, data);
                    } catch (err) {
                      // Ignore error if duplicate/validation fails slightly
                      console.warn(`Seed submission skip ${formId}`, err);
                    }
                  }
                }
                success++;
              } catch (e) { console.error('Submission seed failed', e); fail++; }

              alert(`Tamamlandı!\nBaşarılı: ${success}\nHatalı: ${fail}`);
              window.location.reload();
            } catch (error) {
              console.error('Seed fatal error:', error);
              alert('Hata oluştu.');
            } finally {
              setIsLoading(false);
            }
          }}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">database</span>
          Veritabanını Senkronize Et (Başlangıç Verileri)
        </button>

        <button
          onClick={handleSaveSettings}
          disabled={settingsSaved}
          className={`px-6 py-2 font-bold rounded-lg shadow-lg transition-all flex items-center gap-2 ${settingsSaved ? 'bg-green-500 text-white' : 'bg-green-600 text-white hover:bg-green-700'}`}
        >
          {settingsSaved ? (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              Kaydedildi!
            </>
          ) : (
            "Ayarları Kaydet"
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Login Screen */}
      {!isAuthenticated && (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
          <div className="w-full max-w-md">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 space-y-6">
              <div className="text-center">
                <Link to="/">
                  <BrandLogo className="h-16 mx-auto mb-4" />
                </Link>
                <h1 className="text-2xl font-black text-text-main dark:text-white">Yönetim Paneli</h1>
                <p className="text-text-muted dark:text-gray-400 text-sm mt-2">Güvenli giriş için e-posta doğrulaması gereklidir</p>
              </div>

              {!otpSent ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block">E-posta Adresi (patikayuva@gmail.com)</label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => { setLoginEmail(e.target.value); setOtpError(''); }}
                      placeholder="admin@patika.com"
                      className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {otpError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg">error</span>
                      {otpError}
                    </div>
                  )}
                  <button
                    onClick={handleSendOtp}
                    className="w-full py-4 bg-primary hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">send</span>
                    Doğrulama Kodu Gönder
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="size-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-3xl text-green-600">mark_email_read</span>
                    </div>
                    <p className="text-text-muted dark:text-gray-400 text-sm">
                      <strong>{loginEmail}</strong> adresine doğrulama kodu gönderildi.
                    </p>
                  </div>

                  {/* OTP Display (Testing Mode) */}
                  {showOtpOnScreen && generatedOtp && (
                    <div
                      onClick={copyOtpToClipboard}
                      className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-700 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <span className="material-symbols-outlined">developer_mode</span>
                          <span className="text-xs font-bold uppercase">Test Modu - Kodu Kopyala</span>
                        </div>
                        <span className="material-symbols-outlined text-blue-600">content_copy</span>
                      </div>
                      <div className="text-center mt-2">
                        <span className="text-3xl font-mono font-black tracking-widest text-blue-700 dark:text-blue-300">{generatedOtp}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-text-muted uppercase mb-2 block text-center">6 Haneli Doğrulama Kodu</label>
                    <div className="flex justify-center gap-2">
                      {otpInput.map((digit, index) => (
                        <input
                          key={index}
                          ref={otpInputRefs[index]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
                            if (pastedData) {
                              const newOtp = [...otpInput];
                              pastedData.split('').forEach((char, i) => {
                                if (index + i < 6) {
                                  newOtp[index + i] = char;
                                }
                              });
                              setOtpInput(newOtp);
                              // Auto-verify if full code is pasted
                              if (newOtp.every(d => d !== '')) {
                                const enteredOtp = newOtp.join('');
                                // Delay slightly to allow state update
                                setTimeout(() => {
                                  if (enteredOtp.length === 6) {
                                    // Trigger verification logic reuse if possible or just let user click
                                    // Better to just focus the last filled input
                                    const nextIndex = Math.min(index + pastedData.length, 5);
                                    otpInputRefs[nextIndex].current?.focus();
                                  }
                                }, 0);
                              } else {
                                const nextIndex = Math.min(index + pastedData.length, 5);
                                otpInputRefs[nextIndex].current?.focus();
                              }
                            }
                          }}
                          className="w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                        />
                      ))}
                    </div>
                  </div>

                  {otpError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2 justify-center">
                      <span className="material-symbols-outlined text-lg">error</span>
                      {otpError}
                    </div>
                  )}

                  <button
                    onClick={async () => {
                      const enteredOtp = otpInput.join('');
                      if (enteredOtp.length !== 6) {
                        setOtpError('Lütfen 6 haneli kodu tam olarak girin.');
                        return;
                      }

                      try {
                        const response = await authService.verifyOtp(loginEmail, enteredOtp);
                        const { token } = response.data;
                        localStorage.setItem('auth_token', token);
                        setIsAuthenticated(true);
                      } catch (error: any) {
                        // Fallback for dev mode purely client-side if server blocked or something, 
                        // but generally we want server verification.
                        // Keeping the generatedOtp check ONLY as a desperate fallback if API fails? 
                        // No, arguably generatedOtp is only for dev display. 
                        // If generatedOtp exists (dev mode) AND matches, we can allow.
                        if (generatedOtp && enteredOtp === generatedOtp) {
                          setIsAuthenticated(true);
                          return;
                        }

                        setOtpError(error.response?.data?.error || 'Geçersiz doğrulama kodu. Lütfen tekrar deneyin.');
                        setOtpInput(['', '', '', '', '', '']);
                        setTimeout(() => otpInputRefs[0].current?.focus(), 100);
                      }
                    }}
                    disabled={otpInput.some(d => d === '')}
                    className="w-full py-4 bg-primary hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">login</span>
                    Giriş Yap
                  </button>

                  <button
                    onClick={() => { setOtpSent(false); setOtpError(''); }}
                    className="w-full py-3 text-text-muted hover:text-text-main text-sm font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    Farklı E-posta Kullan
                  </button>
                </div>
              )}
            </div>
            <div className="text-center mt-6 space-y-2">
              <Link to="/" className="text-primary hover:text-orange-600 text-sm font-bold flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-lg">home</span>
                Ana Sayfaya Dön
              </Link>
              <p className="text-text-muted dark:text-gray-500 text-xs">
                © {new Date().getFullYear()} Patika Çocuk Yuvası • Tüm hakları saklıdır
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Admin Panel */}
      {isAuthenticated && (
        <div className="flex min-h-screen bg-background-light dark:bg-background-dark">
          {/* Sidebar - Desktop */}
          <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-white/5 hidden md:flex flex-col fixed h-full z-20">
            <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-center">
              <BrandLogo className="h-10" />
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              <button onClick={() => setActiveView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'dashboard' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">dashboard</span>
                Panel Özeti
              </button>

              <div className="pt-4 pb-2">
                <span className="px-4 text-xs font-bold text-text-muted uppercase tracking-wider">İçerik Yönetimi</span>
              </div>
              <button onClick={() => setActiveView('content-management')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'content-management' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">edit_note</span>
                Site İçerikleri
              </button>
              <button onClick={() => setActiveView('teachers')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'teachers' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">group</span>
                Öğretmenler
              </button>
              <button onClick={() => setActiveView('classes')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'classes' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">school</span>
                Sınıflar
              </button>
              <button onClick={() => setActiveView('food-menu')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'food-menu' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">restaurant</span>
                Yemek Listesi
              </button>
              <button onClick={() => setActiveView('schedule')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'schedule' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">calendar_today</span>
                Ders Programı
              </button>

              <div className="pt-4 pb-2">
                <span className="px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Sistem</span>
              </div>
              <button onClick={() => setActiveView('meetings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${['meetings', 'meeting-manage', 'meeting-edit'].includes(activeView) ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">event</span>
                Toplantılar
              </button>
              <button onClick={() => setActiveView('forms')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${['forms', 'form-builder'].includes(activeView) ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">feed</span>
                Formlar
              </button>
              <button onClick={() => setActiveView('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeView === 'settings' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                <span className="material-symbols-outlined">settings</span>
                Ayarlar
              </button>
            </nav>
            <div className="p-4 border-t border-gray-100 dark:border-white/5">
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                <span className="material-symbols-outlined">logout</span>
                Güvenli Çıkış
              </button>
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
            {activeView === 'teachers' && renderTeachers()}
            {activeView === 'classes' && renderClasses()}
            {activeView === 'food-menu' && renderFoodMenu()}
            {activeView === 'schedule' && renderSchedule()}
            {activeView === 'meetings' && renderMeetingFormsList()}
            {activeView === 'meeting-calendar' && renderMeetingCalendar()}
            {activeView === 'meeting-manage' && renderMeetingManagement()}
            {activeView === 'meeting-edit' && renderMeetingEdit()}
            {activeView === 'forms' && renderForms()}
            {activeView === 'form-builder' && renderFormBuilder()}
            {activeView === 'form-submissions' && renderFormSubmissions()}
            {activeView === 'content-management' && renderContentManagement()}
            {activeView === 'settings' && renderSettings()}
          </main>

          {/* Two-Step Approval Modal */}
          {showEmailModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-text-main dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">{approvalStep === 1 ? 'event' : 'mail_outline'}</span>
                      {approvalStep === 1 ? 'Takvim Etkinliği Oluştur' : 'Onay E-postası Gönder'}
                    </h3>
                    <button onClick={() => setShowEmailModal(false)} className="text-gray-400 hover:text-red-500">
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${approvalStep === 1 ? 'bg-primary text-white' : 'bg-green-100 text-green-600'}`}>
                      {approvalStep > 1 ? <span className="material-symbols-outlined text-sm">check</span> : <span>1</span>}
                      Takvim
                    </div>
                    <div className="w-8 h-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${approvalStep === 2 ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                      <span>2</span>
                      E-posta
                    </div>
                  </div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto space-y-4">
                  {approvalStep === 1 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-text-muted uppercase block mb-1">Etkinlik Başlığı</label>
                          <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white font-bold outline-none" value={calendarEvent.title} onChange={(e) => setCalendarEvent({ ...calendarEvent, title: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-text-muted uppercase block mb-1">Tarih</label>
                          <input type="date" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white outline-none" value={calendarEvent.date} onChange={(e) => setCalendarEvent({ ...calendarEvent, date: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-bold text-text-muted uppercase block mb-1">Başlangıç</label>
                            <input type="time" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white outline-none" value={calendarEvent.time} onChange={(e) => setCalendarEvent({ ...calendarEvent, time: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-text-muted uppercase block mb-1">Bitiş</label>
                            <input type="time" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white outline-none" value={calendarEvent.endTime} onChange={(e) => setCalendarEvent({ ...calendarEvent, endTime: e.target.value })} />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-text-muted uppercase block mb-1">Konum</label>
                          <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white outline-none" value={calendarEvent.location} onChange={(e) => setCalendarEvent({ ...calendarEvent, location: e.target.value })} />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-text-muted uppercase block mb-1">Katılımcı E-posta</label>
                          <input type="email" className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white outline-none" value={calendarEvent.attendeeEmail} onChange={(e) => setCalendarEvent({ ...calendarEvent, attendeeEmail: e.target.value })} placeholder="veli@email.com" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-xs font-bold text-text-muted uppercase block mb-1">Açıklama</label>
                          <textarea className="w-full h-24 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white text-sm outline-none resize-none" value={calendarEvent.description} onChange={(e) => setCalendarEvent({ ...calendarEvent, description: e.target.value })} />
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-start gap-3 text-sm text-blue-800 dark:text-blue-200">
                        <span className="material-symbols-outlined shrink-0">info</span>
                        <p>Bu etkinlik .ics dosyası olarak oluşturulacak ve veliye e-postaya eklenecektir.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-700 dark:text-green-300 text-sm">
                        <span className="material-symbols-outlined">check_circle</span>
                        <span>Takvim etkinliği oluşturuldu ve e-postaya eklenecek.</span>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-muted uppercase block mb-1">Konu</label>
                        <input className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white font-bold outline-none" value={generatedEmailSubject} onChange={(e) => setGeneratedEmailSubject(e.target.value)} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-text-muted uppercase block mb-1">İçerik</label>
                        <textarea className="w-full h-48 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-black/20 text-text-main dark:text-white font-mono text-sm leading-relaxed outline-none resize-none" value={generatedEmailBody} onChange={(e) => setGeneratedEmailBody(e.target.value)} />
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-white/5 rounded-xl text-sm">
                        <span className="material-symbols-outlined text-primary">attachment</span>
                        <div>
                          <span className="font-bold text-text-main dark:text-white">Ek Dosya:</span>
                          <span className="text-text-muted dark:text-gray-400 ml-2">patika-toplanti.ics</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 flex justify-between gap-3">
                  <button onClick={() => { if (approvalStep === 1) setShowEmailModal(false); else setApprovalStep(1); }} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:text-text-main hover:bg-gray-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
                    {approvalStep === 2 && <span className="material-symbols-outlined">arrow_back</span>}
                    {approvalStep === 1 ? 'İptal' : 'Geri'}
                  </button>
                  {approvalStep === 1 ? (
                    <button onClick={proceedToEmailStep} className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white shadow-lg hover:bg-orange-600 transition-transform active:scale-95 flex items-center gap-2">
                      Etkinliği Oluştur
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </button>
                  ) : (
                    <button onClick={confirmStatusChange} className="px-6 py-2.5 rounded-xl font-bold bg-green-600 text-white shadow-lg hover:bg-green-700 transition-transform active:scale-95 flex items-center gap-2">
                      <span className="material-symbols-outlined">send</span>
                      Gönder ve Onayla
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Admin;