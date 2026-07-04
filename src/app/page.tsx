'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { 
  Menu,
  X,
  Play,
  ArrowRight,
  Building2
} from 'lucide-react';
import Navbar from '@/components/website/Navbar';

// --- Real data from Facebook page: facebook.com/metaphoricarchitect ---
const BRAND = {
  name: 'Metaphoric',
  nameAlt: 'Metaphoric Architect',
  tagline: 'Architect',
  city: 'Dhaka, Bangladesh',
  facebook: 'https://www.facebook.com/metaphoricarchitect',
  instagram: 'https://www.instagram.com/',
  email: 'info@metaphoricarchitect.com',
  phone: '+880 1XXX-XXXXXX',
  address: 'Dhaka, Bangladesh',
  services: ['Architecture', 'Design', 'Planning', 'Construction', 'Consulting'],
  followers: '15.8K',
  eyebrow: 'Architecture | Design | Planning | Construction',
  heroLine1: 'Build',
  heroLine2: 'Dreams.',
  studioDesc: 'Metaphoric Architect is a Dhaka-based multidisciplinary firm specializing in architecture, interior design, urban planning, construction management, and consulting. We craft spaces that blend timeless form with purposeful function.',
  years: '10+',
  projects: '200+',
  satisfaction: '98%',
};

// --- Reusable Scroll Reveal Component ---
const RevealSection = ({ children, className = '', delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transition-all duration-1000 ease-out transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// --- Custom Mouse Follower ---
const CustomCursor = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateCursor = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsHovering(!!target.closest('a, button, input, textarea, select, .cursor-expand'));
    };
    window.addEventListener('mousemove', updateCursor);
    return () => window.removeEventListener('mousemove', updateCursor);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      className="hidden md:flex fixed top-0 left-0 w-8 h-8 rounded-full border border-[#D4AF37] pointer-events-none z-[100] transition-transform duration-200 ease-out items-center justify-center mix-blend-difference"
      style={{ 
        transform: `translate(${pos.x - 16}px, ${pos.y - 16}px) scale(${isHovering ? 2 : 1})`,
        backgroundColor: isHovering ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
      }}
    >
      <div className={`w-1.5 h-1.5 bg-[#D4AF37] rounded-full transition-opacity duration-200 ${isHovering ? 'opacity-0' : 'opacity-100'}`} />
    </div>
  );
};

// --- Hero Animated Text ---
const AnimatedHeroText = ({ text, className = '', delay = 0 }: { text: string; className?: string; delay?: number }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <span 
      className={`block overflow-hidden ${className}`}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(100%)',
        transition: 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1), transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
      }}
    >
      {text}
    </span>
  );
};

// --- Parallax counter ---
const CounterBadge = ({ value, label }: { value: string; label: string }) => {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const numericValue = parseInt(value);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = Math.ceil(numericValue / 40);
    const interval = setInterval(() => {
      start += step;
      if (start >= numericValue) {
        setCount(numericValue);
        clearInterval(interval);
      } else {
        setCount(start);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [visible, numericValue]);

  return (
    <div ref={ref} className="absolute -bottom-10 -right-10 bg-[#1A1816] border border-[#D4AF37]/20 text-[#FDFBF7] p-10 hidden md:block">
      <span className="block text-6xl font-playfair italic mb-4 text-[#D4AF37]">{count}</span>
      <span className="block text-[10px] font-light tracking-[0.2em] uppercase leading-relaxed">{label}</span>
    </div>
  );
};

export default function PortfolioLanding() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [dynamicBrand, setDynamicBrand] = useState(BRAND);
  const [services, setServices] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [trustBadges, setTrustBadges] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  const [dynamicHero, setDynamicHero] = useState({
    subtitle: 'Architecture · Design · Planning · Dhaka',
    title: BRAND.heroLine1,
    highlight: BRAND.heroLine2,
    description: BRAND.studioDesc,
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2800&q=80',
    videoUrl: ''
  });

  useEffect(() => {
    fetch('/api/website/public')
      .then(res => res.json())
      .then(json => {
        if (json?.data?.settings?.BRAND_INFO) {
          setDynamicBrand({ ...BRAND, ...json.data.settings.BRAND_INFO });
        }
        if (json?.data?.sections?.find((s: any) => s.sectionKey === 'HERO')) {
          const hero = json.data.sections.find((s: any) => s.sectionKey === 'HERO');
          setDynamicHero({
            subtitle: hero.subtitle || 'Architecture · Design · Planning · Dhaka',
            title: hero.title || BRAND.heroLine1,
            highlight: hero.highlight || BRAND.heroLine2,
            description: hero.description || BRAND.studioDesc,
            imageUrl: hero.imageUrl || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2800&q=80',
            videoUrl: hero.videoUrl || ''
          });
        }
        if (json?.data?.services) setServices(json.data.services);
        if (json?.data?.portfolio) setPortfolio(json.data.portfolio);
        if (json?.data?.team) setTeam(json.data.team);
        if (json?.data?.trustBadges) setTrustBadges(json.data.trustBadges);
        if (json?.data?.testimonials) setTestimonials(json.data.testimonials);
        if (json?.data?.faqs) setFaqs(json.data.faqs);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (res.ok) setIsLoggedIn(true);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Trigger hero animations after mount
  useEffect(() => {
    const t = setTimeout(() => setHeroLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#141210] text-[#E8E3DB] font-sans selection:bg-[#D4AF37]/30 selection:text-[#FDFBF7] overflow-x-hidden font-inter">
      <CustomCursor />
      
      {/* --- NAVIGATION --- */}
      <Navbar />

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background Layers */}
        <div className="absolute inset-0 z-0">
          {/* Dark overlays */}
          <div className="absolute inset-0 bg-[#141210]/55 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-[#141210]/20 to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#141210]/85 via-transparent to-transparent z-10"></div>
          
          {/* Hero Background Image - using img tag with Unsplash */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={dynamicHero.imageUrl} 
            alt="Luxury Interior Hero" 
            className="w-full h-full object-cover hero-kenburns"
            onLoad={() => setHeroLoaded(true)}
          />
        </div>

        {/* Floating gold particles */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-[#D4AF37]/30 rounded-full particle-float"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${4 + i * 0.5}s`,
              }}
            />
          ))}
        </div>

        {/* Thin gold vertical line left accent */}
        <div 
          className="absolute left-6 lg:left-12 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4 hidden lg:flex"
          style={{
            opacity: heroLoaded ? 1 : 0,
            transition: 'opacity 1s ease 1.5s',
          }}
        >
          <div className="h-32 w-[1px] bg-gradient-to-b from-transparent via-[#D4AF37]/50 to-transparent"></div>
          <span className="text-[9px] tracking-[0.4em] text-[#D4AF37]/60 uppercase" style={{ writingMode: 'vertical-rl' }}>Scroll</span>
          <div className="h-12 w-[1px] bg-gradient-to-b from-[#D4AF37]/50 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-20 max-w-[1400px] mx-auto px-6 lg:px-12 w-full mt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="max-w-4xl">
              {/* Eyebrow line */}
              <div className="flex items-center gap-6 mb-12 overflow-hidden">
                <div 
                  className="h-[1px] bg-[#D4AF37]"
                  style={{
                    width: heroLoaded ? '64px' : '0px',
                    transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
                  }}
                ></div>
                <span 
                  className="text-[#D4AF37] text-[10px] font-medium tracking-[0.4em] uppercase"
                  style={{
                    opacity: heroLoaded ? 1 : 0,
                    transform: heroLoaded ? 'translateX(0)' : 'translateX(-20px)',
                    transition: 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s',
                  }}
                >
                  {dynamicHero.subtitle}
                </span>
              </div>
              
              <h1 className="text-[12vw] sm:text-[8vw] md:text-8xl lg:text-[140px] font-playfair font-normal leading-[0.85] tracking-tight mb-8">
                {/* "Living" - outline italic text */}
                <span 
                  className="block text-transparent stroke-text-gold italic cursor-expand"
                  style={{
                    opacity: heroLoaded ? 1 : 0,
                    transform: heroLoaded ? 'translateY(0)' : 'translateY(80px)',
                    transition: 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.5s, transform 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.5s',
                  }}
                >
                  {dynamicHero.title}
                </span>
                {/* Solid white text */}
                <span 
                  className="block text-[#FDFBF7]"
                  style={{
                    opacity: heroLoaded ? 1 : 0,
                    transform: heroLoaded ? 'translateY(0)' : 'translateY(80px)',
                    transition: 'opacity 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.8s, transform 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.8s',
                  }}
                >
                  {dynamicHero.highlight}
                </span>
              </h1>
            </div>

            <div 
              className="md:max-w-xs flex flex-col gap-10"
              style={{
                opacity: heroLoaded ? 1 : 0,
                transform: heroLoaded ? 'translateY(0)' : 'translateY(40px)',
                transition: 'opacity 1s ease 1.2s, transform 1s ease 1.2s',
              }}
            >
              <p className="text-[#A69F95] text-sm leading-relaxed font-light">
                {dynamicHero.description}
              </p>
              
              <div className="flex items-center gap-6">
                <a href={dynamicHero.videoUrl || '#'} target="_blank" rel="noopener noreferrer" className="h-16 w-16 rounded-full border border-[#D4AF37]/40 flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#141210] transition-all group backdrop-blur-md cursor-expand play-pulse">
                  <Play className="h-5 w-5 fill-current ml-1 group-hover:scale-110 transition-transform" />
                </a>
                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#FDFBF7]">Play Film</span>
              </div>

              {/* Hero bottom stats */}
              <div className="flex gap-8 pt-4 border-t border-[#D4AF37]/10">
                {[{ num: dynamicBrand.projects, label: 'Projects' }, { num: dynamicBrand.followers, label: 'FB Fans' }, { num: dynamicBrand.satisfaction, label: 'Satisfaction' }].map((s) => (
                  <div key={s.label}>
                    <div className="text-2xl font-playfair text-[#D4AF37] italic">{s.num}</div>
                    <div className="text-[9px] tracking-[0.2em] text-[#8C8477] uppercase mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#141210] to-transparent z-20"></div>
      </section>

      {/* --- TRUSTED BY / CERTIFICATIONS --- */}
      <section className="border-b border-[#D4AF37]/10 bg-[#1A1816] py-16">
        <RevealSection className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <p className="text-[9px] font-medium tracking-[0.4em] text-[#8C8477] uppercase mb-12">Accredited certifications & awards</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-24 opacity-60 hover:opacity-90 transition-all duration-1000 cursor-expand">
            {trustBadges.map((badge: any) => (
              <div key={badge.id} className="flex flex-col items-center gap-2 filter grayscale hover:grayscale-0 transition-all">
                {badge.imageUrl ? (
                  <img src={badge.imageUrl} alt={badge.name} className="h-10 object-contain opacity-70 hover:opacity-100 transition-opacity" />
                ) : (
                  <span className="text-sm tracking-wider font-light text-[#E8E3DB]">{badge.name}</span>
                )}
                <span className="text-[8px] tracking-widest text-[#8C8477] uppercase">{badge.name}</span>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* --- THE VISION SECTION --- */}
      <section id="studio" className="py-32 md:py-48 relative">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <RevealSection className="relative group cursor-expand">
              <div className="absolute -inset-4 bg-[#D4AF37]/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80" 
                alt="Metaphoric Architect Studio" 
                className="relative w-full aspect-[3/4] object-cover grayscale-[30%] group-hover:grayscale-0 transition-all duration-1000 shadow-2xl"
              />
              <CounterBadge value="10" label={"Years of\nExcellence"} />
            </RevealSection>
            
            <RevealSection delay={200} className="lg:pl-10">
              <h2 className="text-[10px] font-medium tracking-[0.4em] text-[#D4AF37] uppercase mb-12 flex items-center gap-6">
                <span className="w-12 h-[1px] bg-[#D4AF37]"></span> 01. The Firm
              </h2>
              <h3 className="text-4xl md:text-5xl lg:text-7xl font-playfair font-normal leading-[1.1] text-[#FDFBF7] mb-10">
                Spaces that speak <i className="text-[#D4AF37]">purpose</i>.
              </h3>
              <p className="text-[#A69F95] text-lg leading-relaxed font-light mb-12">
                {dynamicBrand.studioDesc}
              </p>
              
              <ul className="space-y-6 mb-16 border-l border-[#D4AF37]/20 pl-8">
                {services.map((item: any) => (
                  <li key={item.id} className="flex items-center gap-4 text-[#E8E3DB] font-light tracking-wide text-sm">
                    <div className="h-[1px] w-4 bg-[#D4AF37]"></div>
                    {item.title}
                  </li>
                ))}
              </ul>

              <a href={dynamicBrand.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-6 text-[10px] font-medium tracking-[0.3em] uppercase text-[#FDFBF7] hover:text-[#D4AF37] transition-colors group">
                Follow on Facebook
                <span className="w-12 h-[1px] bg-[#FDFBF7] group-hover:bg-[#D4AF37] group-hover:w-20 transition-all duration-500"></span>
              </a>
            </RevealSection>
          </div>
        </div>
      </section>

      {/* --- EXPERTISE (Bento Grid) --- */}
      <section id="design" className="py-32 bg-[#1A1816] border-y border-[#D4AF37]/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <RevealSection className="flex flex-col items-center text-center mb-24">
            <h2 className="text-[10px] font-medium tracking-[0.4em] text-[#D4AF37] uppercase mb-8 flex items-center gap-6 justify-center">
              <span className="w-12 h-[1px] bg-[#D4AF37]"></span> 02. Services <span className="w-12 h-[1px] bg-[#D4AF37]"></span>
            </h2>
            <h3 className="text-4xl md:text-6xl font-playfair text-[#FDFBF7]">What We Build.</h3>
            <p className="text-[#8C8477] text-sm mt-4 tracking-wide">{dynamicBrand.city}</p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[650px]">
            {services[0] && (
              <Link href={`/services/${services[0].id}`} className="md:col-span-2 block h-[400px] md:h-full">
                <RevealSection delay={100} className="group relative overflow-hidden bg-[#141210] cursor-expand h-full">
                  <img src={services[0].imageUrl} alt={services[0].title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-[#141210]/20 to-transparent"></div>
                  <div className="absolute inset-0 p-12 flex flex-col justify-end">
                    <h4 className="text-4xl font-playfair text-[#FDFBF7] mb-4 group-hover:text-[#D4AF37] transition-colors">{services[0].title}</h4>
                    <p className="text-[#A69F95] font-light max-w-md text-sm leading-relaxed">{services[0].description}</p>
                    <span className="text-[9px] text-[#D4AF37] tracking-[0.3em] uppercase font-medium mt-4 flex items-center gap-2">View Details <ArrowRight className="h-3 w-3" /></span>
                  </div>
                </RevealSection>
              </Link>
            )}

            <div className="flex flex-col gap-4">
              {services[1] && (
                <Link href={`/services/${services[1].id}`} className="flex-1 block h-[300px] md:h-auto">
                  <RevealSection delay={200} className="group relative overflow-hidden bg-[#141210] cursor-expand h-full">
                    <img src={services[1].imageUrl} alt={services[1].title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141210] to-transparent"></div>
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <h4 className="text-2xl font-playfair text-[#FDFBF7] mb-3 group-hover:text-[#D4AF37] transition-colors">{services[1].title}</h4>
                      <p className="text-[#A69F95] text-xs font-light leading-relaxed">{services[1].description}</p>
                      <span className="text-[9px] text-[#D4AF37] tracking-[0.3em] uppercase font-medium mt-2 flex items-center gap-2">View Details <ArrowRight className="h-3 w-3" /></span>
                    </div>
                  </RevealSection>
                </Link>
              )}

              {services[2] && (
                <Link href={`/services/${services[2].id}`} className="flex-1 block h-[300px] md:h-auto">
                  <RevealSection delay={300} className="group relative overflow-hidden bg-[#141210] cursor-expand h-full">
                    <img src={services[2].imageUrl} alt={services[2].title} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141210] to-transparent"></div>
                    <div className="absolute inset-0 p-8 flex flex-col justify-end">
                      <h4 className="text-2xl font-playfair text-[#FDFBF7] mb-3 group-hover:text-[#D4AF37] transition-colors">{services[2].title}</h4>
                      <p className="text-[#A69F95] text-xs font-light leading-relaxed">{services[2].description}</p>
                      <span className="text-[9px] text-[#D4AF37] tracking-[0.3em] uppercase font-medium mt-2 flex items-center gap-2">View Details <ArrowRight className="h-3 w-3" /></span>
                    </div>
                  </RevealSection>
                </Link>
              )}
            </div>
          </div>

          {/* View All Services CTA */}
          <RevealSection delay={200} className="mt-20 flex justify-center">
            <Link href="/services" className="group inline-flex items-center gap-8 px-16 py-6 border border-[#D4AF37]/30 text-[10px] font-medium tracking-[0.3em] uppercase text-[#FDFBF7] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-500 relative overflow-hidden">
              <span className="absolute inset-0 bg-[#D4AF37]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></span>
              <span className="relative">View All Services</span>
              <ArrowRight className="h-3 w-3 relative group-hover:translate-x-2 transition-transform" />
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* --- SELECTED WORKS --- */}
      <section id="portfolio" className="py-32 md:py-48">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <RevealSection className="mb-20">
            <h2 className="text-[10px] font-medium tracking-[0.4em] text-[#D4AF37] uppercase mb-8 flex items-center gap-6">
              <span className="w-12 h-[1px] bg-[#D4AF37]"></span> 03. Portfolio
            </h2>
            <h3 className="text-4xl md:text-6xl font-playfair text-[#FDFBF7]">Curated Spaces.</h3>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
            {portfolio.map((proj: any, i: number) => (
              <RevealSection key={proj.id} delay={i % 2 === 0 ? 100 : 300} className={`group cursor-pointer cursor-expand portfolio-card ${i % 2 !== 0 ? 'md:mt-32' : ''}`}>
                <Link href={`/portfolio/${proj.id}`} className="block">
                  <div className="relative overflow-hidden aspect-[4/5] mb-8">
                    <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <img 
                      src={proj.coverImage} 
                      alt={proj.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" 
                    />
                    <div className="absolute bottom-8 left-8 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                      <span className="text-[9px] text-[#D4AF37] tracking-[0.3em] uppercase font-medium">View Project</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-start border-b border-[#D4AF37]/20 pb-6">
                    <div>
                      <h4 className="text-3xl font-playfair text-[#FDFBF7] mb-2 group-hover:text-[#D4AF37] transition-colors duration-500">{proj.title}</h4>
                      <p className="text-[#A69F95] text-xs tracking-widest uppercase font-light">{proj.category}</p>
                    </div>
                    <div className="text-[#D4AF37] group-hover:translate-x-2 transition-transform">
                      <ArrowRight strokeWidth={1} />
                    </div>
                  </div>
                </Link>
              </RevealSection>
            ))}
          </div>

          {/* View All CTA */}
          <RevealSection delay={200} className="mt-24 flex justify-center">
            <Link href="/portfolio" className="group inline-flex items-center gap-8 px-16 py-6 border border-[#D4AF37]/30 text-[10px] font-medium tracking-[0.3em] uppercase text-[#FDFBF7] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-500 relative overflow-hidden">
              <span className="absolute inset-0 bg-[#D4AF37]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></span>
              <span className="relative">View All Projects</span>
              <ArrowRight className="h-3 w-3 relative group-hover:translate-x-2 transition-transform" />
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* --- TEAM & LEADERSHIP --- */}
      <section id="team" className="py-32 border-t border-[#D4AF37]/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <RevealSection className="mb-20">
            <h2 className="text-[10px] font-medium tracking-[0.4em] text-[#D4AF37] uppercase mb-8 flex items-center gap-6">
              <span className="w-12 h-[1px] bg-[#D4AF37]"></span> 04. Our Team
            </h2>
            <h3 className="text-4xl md:text-6xl font-playfair text-[#FDFBF7]">The Visionaries.</h3>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {team.map((member: any, i: number) => (
              <RevealSection key={member.id} delay={i * 150} className="group cursor-expand flex flex-col justify-between p-4 bg-[#1A1816] border border-[#D4AF37]/5 hover:border-[#D4AF37]/20 transition-all duration-500">
                <Link href={`/team/${member.id}`} className="block">
                  <div className="relative overflow-hidden aspect-[4/5] mb-8 bg-[#1A1816]">
                    <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
                  </div>
                  <h4 className="text-2xl font-playfair text-[#FDFBF7] mb-2 group-hover:text-[#D4AF37] transition-colors">{member.name}</h4>
                  <p className="text-[10px] text-[#D4AF37] tracking-[0.2em] uppercase mb-4">{member.role}</p>
                  <p className="text-[#A69F95] text-sm font-light leading-relaxed line-clamp-3">{member.bio}</p>
                </Link>
              </RevealSection>
            ))}
          </div>

          {/* View All Team CTA */}
          <RevealSection delay={200} className="mt-20 flex justify-center">
            <Link href="/team" className="group inline-flex items-center gap-8 px-16 py-6 border border-[#D4AF37]/30 text-[10px] font-medium tracking-[0.3em] uppercase text-[#FDFBF7] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-500 relative overflow-hidden">
              <span className="absolute inset-0 bg-[#D4AF37]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></span>
              <span className="relative">View All Team</span>
              <ArrowRight className="h-3 w-3 relative group-hover:translate-x-2 transition-transform" />
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* --- FREQUENTLY ASKED QUESTIONS --- */}
      <section className="py-32 border-t border-[#D4AF37]/10 bg-[#1A1816]">
        <div className="max-w-[1000px] mx-auto px-6">
          <RevealSection className="text-center mb-20">
            <h2 className="text-[10px] font-medium tracking-[0.4em] text-[#D4AF37] uppercase mb-8 flex items-center gap-6 justify-center">
              <span className="w-12 h-[1px] bg-[#D4AF37]"></span> 06. Inquiries <span className="w-12 h-[1px] bg-[#D4AF37]"></span>
            </h2>
            <h3 className="text-4xl md:text-5xl font-playfair text-[#FDFBF7]">Frequently Asked Questions</h3>
          </RevealSection>

          <div className="space-y-6">
            {faqs.map((faq: any, i: number) => (
              <RevealSection key={faq.id} delay={i * 100} className="border-b border-[#D4AF37]/10 pb-6">
                <details className="group cursor-pointer">
                  <summary className="flex justify-between items-center text-lg font-medium text-[#E8E3DB] hover:text-[#D4AF37] transition-colors focus:outline-none list-none">
                    <span className="font-playfair leading-relaxed">{faq.question}</span>
                    <span className="text-[#D4AF37] transition-transform duration-300 group-open:rotate-45 text-2xl font-light">+</span>
                  </summary>
                  <p className="text-[#A69F95] text-sm font-light leading-relaxed mt-4 pl-4 border-l border-[#D4AF37]/20 select-text">
                    {faq.answer}
                  </p>
                </details>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* --- CLIENT REVIEWS --- */}
      <section className="py-32 bg-[#1A1816] relative border-t border-[#D4AF37]/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <RevealSection className="flex flex-col items-center text-center mb-24">
            <h2 className="text-[10px] font-medium tracking-[0.4em] text-[#D4AF37] uppercase mb-8 flex items-center gap-6 justify-center">
              <span className="w-12 h-[1px] bg-[#D4AF37]"></span> 05. Praise <span className="w-12 h-[1px] bg-[#D4AF37]"></span>
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((review: any, i: number) => (
              <RevealSection key={review.id} delay={i * 200} className="border border-[#D4AF37]/10 p-12 relative group hover:border-[#D4AF37]/40 transition-colors duration-500 cursor-expand bg-[#141210]">
                <div className="text-8xl text-[#D4AF37]/20 absolute top-4 left-6 font-playfair leading-none italic">"</div>
                <p className="text-[#E8E3DB] font-light leading-loose mb-12 relative z-10 text-sm">
                  {review.reviewText}
                </p>
                <div className="flex items-center gap-6 relative z-10 pt-6 border-t border-[#D4AF37]/10">
                  <div>
                    <h5 className="text-[#FDFBF7] text-sm font-medium mb-1">{review.clientName}</h5>
                    <p className="text-[9px] text-[#D4AF37] tracking-[0.2em] uppercase">{review.clientRole}</p>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOOTER CTA --- */}
      <footer id="contact" className="relative bg-[#141210] pt-40 pb-12 overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start mb-32 pb-20 gap-20">
            <RevealSection className="lg:w-1/2">
              <h2 className="text-5xl md:text-7xl font-playfair text-[#FDFBF7] leading-tight mb-8">
                Let's build your <br/>
                <i className="text-[#D4AF37]">vision.</i>
              </h2>
              <p className="text-[#A69F95] text-lg font-light mb-16 max-w-md leading-relaxed">
                Reach out to discuss your residential, commercial, or urban project in Dhaka and across Bangladesh.
              </p>
              <div className="space-y-10">
                <div>
                  <h5 className="text-[9px] font-medium tracking-[0.3em] text-[#8C8477] uppercase mb-3">Email</h5>
                  <a href={`mailto:${dynamicBrand.email}`} className="text-xl font-playfair italic text-[#E8E3DB] hover:text-[#D4AF37] transition-colors cursor-expand">
                    {dynamicBrand.email}
                  </a>
                </div>
                <div>
                  <h5 className="text-[9px] font-medium tracking-[0.3em] text-[#8C8477] uppercase mb-3">Location</h5>
                  <p className="text-lg font-light text-[#E8E3DB] leading-relaxed">
                    {dynamicBrand.address}
                  </p>
                </div>
                <div>
                  <h5 className="text-[9px] font-medium tracking-[0.3em] text-[#8C8477] uppercase mb-3">Follow</h5>
                  <a href={dynamicBrand.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-[#E8E3DB] hover:text-[#D4AF37] transition-colors cursor-expand">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span className="font-playfair italic text-lg">metaphoricarchitect</span>
                    <span className="text-[#D4AF37] text-xs tracking-widest">({dynamicBrand.followers} fans)</span>
                  </a>
                </div>
              </div>
            </RevealSection>
            
            <RevealSection delay={300} className="lg:w-1/2 w-full bg-[#1A1816] border border-[#D4AF37]/20 p-10 md:p-14">
              <h3 className="text-2xl font-playfair text-[#FDFBF7] mb-10">Begin a dialogue</h3>
              <form 
                className="space-y-10" 
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const data = {
                    name: (form.elements.namedItem('name') as HTMLInputElement).value,
                    email: (form.elements.namedItem('email') as HTMLInputElement).value,
                    scope: (form.elements.namedItem('scope') as HTMLSelectElement).value,
                    details: (form.elements.namedItem('details') as HTMLTextAreaElement).value,
                  };
                  const btn = form.elements.namedItem('submitBtn') as HTMLButtonElement;
                  const originalText = btn.innerText;
                  btn.innerText = 'Submitting...';
                  btn.disabled = true;

                  try {
                    const res = await fetch('/api/contact', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(data),
                    });
                    if (res.ok) {
                      form.reset();
                      btn.innerText = 'Sent Successfully';
                      setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 3000);
                    } else {
                      btn.innerText = 'Error! Try Again';
                      setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 3000);
                    }
                  } catch (err) {
                    btn.innerText = 'Error! Try Again';
                    setTimeout(() => { btn.innerText = originalText; btn.disabled = false; }, 3000);
                  }
                }}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <label className="block text-[9px] font-medium tracking-[0.3em] text-[#8C8477] uppercase mb-3">Name</label>
                    <input name="name" required type="text" className="w-full bg-transparent border-b border-[#D4AF37]/20 pb-4 text-[#FDFBF7] focus:outline-none focus:border-[#D4AF37] transition-colors placeholder:text-[#3A3530] font-light text-sm" placeholder="Jane Doe" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-medium tracking-[0.3em] text-[#8C8477] uppercase mb-3">Email</label>
                    <input name="email" required type="email" className="w-full bg-transparent border-b border-[#D4AF37]/20 pb-4 text-[#FDFBF7] focus:outline-none focus:border-[#D4AF37] transition-colors placeholder:text-[#3A3530] font-light text-sm" placeholder="jane@example.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-medium tracking-[0.3em] text-[#8C8477] uppercase mb-3">Project Scope</label>
                  <select name="scope" required className="w-full bg-transparent border-b border-[#D4AF37]/20 pb-4 text-[#E8E3DB] focus:outline-none focus:border-[#D4AF37] transition-colors font-light text-sm appearance-none cursor-pointer">
                    {services.map((svc: any) => (
                      <option key={svc.id} value={svc.title} className="bg-[#1A1816] text-[#E8E3DB]">
                        {svc.title}
                      </option>
                    ))}
                    {services.length === 0 && (
                      <>
                        <option className="bg-[#1A1816]">Architecture & Planning</option>
                        <option className="bg-[#1A1816]">Interior Design</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-medium tracking-[0.3em] text-[#8C8477] uppercase mb-3">Details</label>
                  <textarea name="details" rows={3} className="w-full bg-transparent border-b border-[#D4AF37]/20 pb-4 text-[#FDFBF7] focus:outline-none focus:border-[#D4AF37] transition-colors placeholder:text-[#3A3530] font-light text-sm resize-none" placeholder="Share your vision with us..."></textarea>
                </div>
                <button name="submitBtn" type="submit" className="w-full py-5 bg-[#D4AF37] hover:bg-[#E5C158] text-[#141210] font-medium tracking-[0.3em] uppercase text-[10px] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  Submit Inquiry
                </button>
              </form>
            </RevealSection>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-medium tracking-widest uppercase text-[#8C8477] border-t border-[#D4AF37]/10 pt-10">
            <p>&copy; {new Date().getFullYear()} {dynamicBrand.nameAlt} — {dynamicBrand.city}</p>
            <div className="flex gap-10">
              <a href={dynamicBrand.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">Facebook</a>
              <a href={dynamicBrand.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        
        .stroke-text-gold {
          -webkit-text-stroke: 1px rgba(212, 175, 55, 0.5);
          color: transparent;
        }

        /* Ken Burns hero animation */
        @keyframes kenburns {
          0%   { transform: scale(1.05) translate(0px, 0px); }
          33%  { transform: scale(1.12) translate(-1%, -0.5%); }
          66%  { transform: scale(1.08) translate(0.5%, 1%); }
          100% { transform: scale(1.05) translate(-0.5%, 0.5%); }
        }
        .hero-kenburns {
          animation: kenburns 30s ease-in-out infinite alternate;
        }

        /* Floating particles */
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
        .particle-float {
          animation: particleFloat var(--duration, 4s) ease-in-out infinite;
        }

        /* Play button pulse */
        @keyframes playPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0); }
          50% { box-shadow: 0 0 0 12px rgba(212, 175, 55, 0.12); }
        }
        .play-pulse {
          animation: playPulse 3s ease-in-out infinite;
        }

        /* Portfolio card shine effect */
        .portfolio-card .relative::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(212,175,55,0.05), transparent);
          transform: skewX(-20deg);
          transition: none;
          z-index: 15;
          pointer-events: none;
        }
        .portfolio-card:hover .relative::after {
          left: 160%;
          transition: left 0.8s ease;
        }

        /* Smooth scroll */
        html { scroll-behavior: smooth; }

        /* Selection */
        ::selection {
          background: rgba(212, 175, 55, 0.3);
          color: #FDFBF7;
        }
      `}} />
    </div>
  );
}
