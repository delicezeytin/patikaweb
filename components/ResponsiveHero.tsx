import React from 'react';
import { Link } from 'react-router-dom';

interface ResponsiveHeroProps {
    mobileImage: string;
    desktopImage?: string; // Optional - uses mobileImage if not provided
    title: string;
    subtitle: string;
    badge?: string;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    className?: string;
}

/**
 * ResponsiveHero Component
 * - Mobile: Full-width background image with text overlay
 * - Desktop: Split layout with content on left, image on right
 */
const ResponsiveHero: React.FC<ResponsiveHeroProps> = ({
    mobileImage,
    desktopImage,
    title,
    subtitle,
    badge = "Yeni Dönem Kayıtları Başladı",
    primaryButtonText = "Ziyaret Planla",
    primaryButtonLink = "/appointment",
    secondaryButtonText = "Detaylı Bilgi",
    secondaryButtonLink = "/about",
    className = ''
}) => {
    const imageUrl = desktopImage || mobileImage;

    return (
        <section className={`px-4 sm:px-10 py-8 ${className}`}>
            {/* Mobile Layout - Full Background */}
            <div
                className="lg:hidden flex min-h-[500px] flex-col gap-6 bg-cover bg-center bg-no-repeat rounded-2xl items-start justify-end px-6 pb-12 sm:px-12 shadow-md relative overflow-hidden"
                style={{ backgroundImage: `url("${mobileImage}")` }}
            >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="relative flex flex-col gap-4 text-left max-w-2xl">
                    <span className="inline-flex w-fit items-center rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white tracking-wide uppercase">
                        {badge}
                    </span>
                    <h1 className="text-white text-4xl sm:text-5xl font-black leading-tight tracking-tight drop-shadow-lg">
                        {title}
                    </h1>
                    <p className="text-white/90 text-lg font-normal leading-relaxed max-w-xl drop-shadow-md">
                        {subtitle}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        <Link
                            to={primaryButtonLink}
                            className="flex items-center justify-center rounded-xl h-12 px-6 bg-primary hover:bg-orange-600 text-white text-sm font-bold transition-transform active:scale-95 shadow-lg shadow-orange-500/20"
                        >
                            {primaryButtonText}
                        </Link>
                        <Link
                            to={secondaryButtonLink}
                            className="flex items-center justify-center rounded-xl h-12 px-6 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 text-sm font-bold transition-colors"
                        >
                            {secondaryButtonText}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Desktop Layout - Split Grid */}
            <div className="hidden lg:grid grid-cols-2 gap-0 bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl ring-1 ring-gray-100 dark:ring-white/5">
                {/* Left Content */}
                <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16 gap-6 z-10">
                    <span className="inline-flex w-fit items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold text-secondary tracking-wide uppercase">
                        {badge}
                    </span>
                    <h1 className="text-text-main dark:text-white text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                        {title.includes("Patika") ? (
                            <>Patika'da <br className="hidden lg:block" />Mutlu Adımlar</>
                        ) : (
                            title
                        )}
                    </h1>
                    <p className="text-text-muted dark:text-gray-400 text-lg font-normal leading-relaxed">
                        {subtitle}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-2">
                        <Link
                            to={primaryButtonLink}
                            className="flex items-center justify-center rounded-xl h-12 px-8 bg-primary hover:bg-orange-600 text-white text-base font-bold transition-transform active:scale-95 shadow-lg shadow-orange-500/20"
                        >
                            {primaryButtonText}
                        </Link>
                        <Link
                            to={secondaryButtonLink}
                            className="flex items-center justify-center rounded-xl h-12 px-8 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-text-main dark:text-white border border-gray-200 dark:border-gray-700 text-base font-bold transition-colors"
                        >
                            {secondaryButtonText}
                        </Link>
                    </div>
                </div>

                {/* Right Image */}
                <div className="relative min-h-[400px] lg:min-h-full h-full">
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url("${imageUrl}")` }}
                    />
                </div>
            </div>
        </section>
    );
};

export default ResponsiveHero;
