import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const PublicLayout: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const linkClass = (path: string) => `text-sm font-medium transition-colors ${
    isActive(path) 
      ? 'text-primary font-bold' 
      : 'text-text-main dark:text-gray-200 hover:text-primary'
  }`;

  const BrandLogo = ({ className = "h-12" }: { className?: string }) => (
    <img 
      src="/logo.png" 
      alt="Patika Çocuk Yuvası" 
      className={`${className} w-auto object-contain dark:bg-white/90 dark:rounded-lg dark:px-2 dark:py-1 transition-all`} 
    />
  );

  // SVG Pattern containing playful shapes: Star, Heart, Circle, Triangle in brand colors
  // Encoded for use in CSS background
  const backgroundPattern = `data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill-opacity='0.15'%3E%3Cpath fill='%23f48c25' d='M15 15l3-9 3 9 9-3-9 3 3 9-3-9-9 3 9-3z'/%3E%3Cpath fill='%23e53935' d='M75 25c0-4.4-3.6-8-8-8s-8 3.6-8 8c0 4.4 3.6 8 8 8s8-3.6 8-8z'/%3E%3Cpath fill='%23f48c25' d='M35 75l-5 5 5 5 5-5-5-5z'/%3E%3Cpath fill='%238a7560' d='M85 85l-6-10h12z'/%3E%3Ccircle fill='%23e53935' cx='50' cy='50' r='3'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

  return (
    <div className="flex flex-col min-h-screen relative bg-background-light dark:bg-background-dark">
      {/* Playful Background Pattern */}
      {/* This fills the empty gray space with "sprinkled" colors/shapes */}
      {/* Opacity reduced to 25% for better readability */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-25"
        style={{ 
          backgroundImage: `url("${backgroundPattern}")`,
          backgroundSize: '100px 100px',
        }}
      />

      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#f5f2f0] dark:bg-background-dark/95 dark:border-white/10 relative">
        <div className="flex justify-center w-full">
          <div className="max-w-[1440px] w-full px-4 sm:px-10 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <BrandLogo className="h-14" />
            </Link>
            
            <nav className="hidden md:flex items-center gap-8">
              <Link to="/" className={linkClass('/')}>Anasayfa</Link>
              <Link to="/about" className={linkClass('/about')}>Patika'ya Dair</Link>
              <Link to="/stories" className={linkClass('/stories')}>Masallar ve Gerçekler</Link>
              <Link to="/contact" className={linkClass('/contact')}>İletişim</Link>
            </nav>

            <div className="md:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-text-main dark:text-white p-2"
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 dark:border-white/5 bg-white dark:bg-background-dark px-4 py-4 flex flex-col gap-4 shadow-lg">
            <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className={linkClass('/')}>Anasayfa</Link>
            <Link to="/about" onClick={() => setIsMobileMenuOpen(false)} className={linkClass('/about')}>Patika'ya Dair</Link>
            <Link to="/stories" onClick={() => setIsMobileMenuOpen(false)} className={linkClass('/stories')}>Masallar ve Gerçekler</Link>
            <Link to="/contact" onClick={() => setIsMobileMenuOpen(false)} className={linkClass('/contact')}>İletişim</Link>
          </div>
        )}
      </header>

      <main className="flex-1 w-full flex justify-center relative z-10">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-background-dark pt-12 pb-8 px-4 sm:px-10 relative z-10">
        <div className="max-w-[1200px] mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                 <BrandLogo className="h-10" />
              </div>
              <p className="text-sm text-text-muted dark:text-gray-400 leading-relaxed">
                Çocuklarımızın yarınlarına ışık tutan, sevgi dolu eğitim yuvamız.
              </p>
              <div className="flex gap-4 mt-2">
                <a className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">public</span></a>
                <a className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">photo_camera</span></a>
                <a className="text-gray-400 hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined">alternate_email</span></a>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-text-main dark:text-white font-bold text-base">İletişim</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-xl mt-0.5">location_on</span>
                  <span className="text-sm text-text-muted dark:text-gray-400">Ortakentyahşi Mahallesi,<br/>Hıral Sk. No:6,<br/>48420 Bodrum/Muğla</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">call</span>
                  <a href="tel:+905528044140" className="text-sm text-text-muted dark:text-gray-400 hover:text-primary transition-colors">+90 (552) 804 41 40</a>
                </div>
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-xl">mail</span>
                  <a href="mailto:patikayuva@gmail.com" className="text-sm text-text-muted dark:text-gray-400 hover:text-primary transition-colors">patikayuva@gmail.com</a>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-text-main dark:text-white font-bold text-base">Hızlı Erişim</h3>
              <div className="flex flex-col gap-2">
                <Link className="text-sm text-text-muted dark:text-gray-400 hover:text-primary transition-colors" to="/food-list">Yemek Listesi</Link>
                <Link className="text-sm text-text-muted dark:text-gray-400 hover:text-primary transition-colors" to="/schedule">Ders Programı</Link>
                <Link className="text-sm text-text-muted dark:text-gray-400 hover:text-primary transition-colors" to="/teachers">Öğretmenlerimiz</Link>
                <Link className="text-sm text-text-muted dark:text-gray-400 hover:text-primary transition-colors" to="/career">Kariyer</Link>
                <Link className="text-sm text-text-muted dark:text-gray-400 hover:text-primary transition-colors font-medium" to="/admin">Yönetim Paneli</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-6 text-center">
            <p className="text-xs text-gray-400">© 2024 Patika Çocuk Yuvası. Tüm hakları saklıdır.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;