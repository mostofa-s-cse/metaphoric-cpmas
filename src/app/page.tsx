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
      <nav className={`fixed w-full z-50 transition-all duration-700 ${scrolled ? 'bg-[#141210]/95 backdrop-blur-xl border-b border-[#D4AF37]/10 py-4' : 'bg-transparent py-8'}`}>
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <a href="#" className="flex items-center gap-4 group cursor-pointer cursor-expand">
              <div className="h-12 w-12 border border-[#D4AF37]/30 rounded-full flex items-center justify-center transition-transform group-hover:scale-105 group-hover:border-[#D4AF37]">
                <Building2 className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.5} />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-playfair tracking-[0.1em] text-[#FDFBF7] uppercase leading-none">
                  {BRAND.name}
                </span>
                <span className="text-[9px] font-medium tracking-[0.4em] text-[#D4AF37] uppercase leading-none mt-2">
                  {BRAND.tagline}
                </span>
              </div>
            </a>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-12">
              {['Design', 'Portfolio', 'Studio', 'Contact'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-xs font-light tracking-[0.2em] text-[#A69F95] uppercase hover:text-[#D4AF37] transition-colors relative after:content-[''] after:absolute after:-bottom-2 after:left-0 after:w-0 after:h-[1px] after:bg-[#D4AF37] hover:after:w-full after:transition-all after:duration-500">
                  {item}
                </a>
              ))}

              {/* FB Social badge */}
              <a href={BRAND.facebook} target="_blank" rel="noopener noreferrer" className="hidden lg:flex items-center gap-2 text-[9px] text-[#A69F95] tracking-widest uppercase hover:text-[#D4AF37] transition-colors">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                {BRAND.followers} Fans
              </a>
              
              <div className="h-8 w-[1px] bg-[#D4AF37]/20 mx-4"></div>
              
              <Link href={isLoggedIn ? '/dashboard' : '/login'} className="px-8 py-3 text-[10px] font-medium tracking-[0.2em] uppercase text-[#141210] bg-[#D4AF37] hover:bg-[#E5C158] transition-all flex items-center gap-3 hover:shadow-[0_0_40px_rgba(212,175,55,0.2)]">
                Login
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden text-[#D4AF37] p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X strokeWidth={1.5} /> : <Menu strokeWidth={1.5} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden absolute top-full left-0 w-full bg-[#141210]/98 backdrop-blur-3xl border-b border-[#D4AF37]/10 transition-all duration-500 overflow-hidden ${mobileMenuOpen ? 'max-h-[400px] py-8' : 'max-h-0 py-0'}`}>
          <div className="flex flex-col gap-8 px-6">
            {['Design', 'Portfolio', 'Studio', 'Contact'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-sm font-light tracking-[0.2em] text-[#E8E3DB] uppercase">
                {item}
              </a>
            ))}
            <a href={BRAND.facebook} target="_blank" rel="noopener noreferrer" onClick={() => setMobileMenuOpen(false)} className="text-sm font-light tracking-[0.2em] text-[#A69F95] uppercase hover:text-[#D4AF37] transition-colors">
              Facebook — {BRAND.followers} Fans
            </a>
            <Link href={isLoggedIn ? '/dashboard' : '/login'} onClick={() => setMobileMenuOpen(false)} className="inline-flex items-center gap-3 text-[#D4AF37] text-sm font-medium tracking-widest uppercase mt-4">
              Login <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

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
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2800&q=80" 
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
                  Architecture · Design · Planning · Dhaka
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
                  {BRAND.heroLine1}
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
                  {BRAND.heroLine2}
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
                Metaphoric Architect is a Dhaka-based firm delivering architecture, design, planning, construction &amp; consulting services across Bangladesh.
              </p>
              
              <div className="flex items-center gap-6">
                <button className="h-16 w-16 rounded-full border border-[#D4AF37]/40 flex items-center justify-center hover:bg-[#D4AF37] hover:text-[#141210] transition-all group backdrop-blur-md cursor-expand play-pulse">
                  <Play className="h-5 w-5 fill-current ml-1 group-hover:scale-110 transition-transform" />
                </button>
                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#FDFBF7]">Play Film</span>
              </div>

              {/* Hero bottom stats */}
              <div className="flex gap-8 pt-4 border-t border-[#D4AF37]/10">
                {[{ num: BRAND.projects, label: 'Projects' }, { num: BRAND.followers, label: 'FB Fans' }, { num: BRAND.satisfaction, label: 'Satisfaction' }].map((s) => (
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

      {/* --- TRUSTED BY --- */}
      <section className="border-b border-[#D4AF37]/10 bg-[#1A1816] py-16">
        <RevealSection className="max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <p className="text-[9px] font-medium tracking-[0.4em] text-[#8C8477] uppercase mb-12">Featured in global design publications</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 hover:opacity-90 transition-all duration-1000 cursor-expand">
            {BRAND.services.map((svc) => (
              <div key={svc} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]/60"></div>
                <h5 className="text-lg md:text-2xl font-playfair italic tracking-wider text-[#E8E3DB] hover:text-[#D4AF37] transition-colors">{svc}</h5>
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
                {BRAND.studioDesc}
              </p>
              
              <ul className="space-y-6 mb-16 border-l border-[#D4AF37]/20 pl-8">
                {BRAND.services.map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-[#E8E3DB] font-light tracking-wide text-sm">
                    <div className="h-[1px] w-4 bg-[#D4AF37]"></div>
                    {item}
                  </li>
                ))}
              </ul>

              <a href={BRAND.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-6 text-[10px] font-medium tracking-[0.3em] uppercase text-[#FDFBF7] hover:text-[#D4AF37] transition-colors group">
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
            <p className="text-[#8C8477] text-sm mt-4 tracking-wide">{BRAND.city}</p>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-auto md:h-[650px]">
            {/* Main large card */}
            <RevealSection delay={100} className="md:col-span-2 group relative overflow-hidden bg-[#141210] cursor-expand h-[400px] md:h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80" alt="Architecture & Planning" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#141210] via-[#141210]/20 to-transparent"></div>
              <div className="absolute inset-0 p-12 flex flex-col justify-end">
                <h4 className="text-4xl font-playfair text-[#FDFBF7] mb-4">Architecture &amp; Planning</h4>
                <p className="text-[#A69F95] font-light max-w-md text-sm leading-relaxed">From conceptual design to urban planning — we shape the built environment of Dhaka and beyond.</p>
              </div>
            </RevealSection>

            <div className="flex flex-col gap-4">
              {/* Secondary card 1 */}
              <RevealSection delay={200} className="flex-1 group relative overflow-hidden bg-[#141210] cursor-expand h-[300px] md:h-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80" alt="Interior Design" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141210] to-transparent"></div>
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <h4 className="text-2xl font-playfair text-[#FDFBF7] mb-3">Interior Design</h4>
                  <p className="text-[#A69F95] text-xs font-light leading-relaxed">Spatial storytelling through material, light, and form.</p>
                </div>
              </RevealSection>

              {/* Secondary card 2 */}
              <RevealSection delay={300} className="flex-1 group relative overflow-hidden bg-[#141210] cursor-expand h-[300px] md:h-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80" alt="Construction" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141210] to-transparent"></div>
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <h4 className="text-2xl font-playfair text-[#FDFBF7] mb-3">Construction</h4>
                  <p className="text-[#A69F95] text-xs font-light leading-relaxed">End-to-end construction management and consulting.</p>
                </div>
              </RevealSection>
            </div>
          </div>
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
            {/* Project 1 */}
            <RevealSection delay={100} className="group cursor-pointer cursor-expand portfolio-card">
              <div className="relative overflow-hidden aspect-[4/5] mb-8">
                <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80" 
                  alt="The Oak & Ash Residence" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" 
                />
                {/* Hover overlay label */}
                <div className="absolute bottom-8 left-8 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <span className="text-[9px] text-[#D4AF37] tracking-[0.3em] uppercase font-medium">View Project</span>
                </div>
              </div>
              <div className="flex justify-between items-start border-b border-[#D4AF37]/20 pb-6">
                <div>
                  <h4 className="text-3xl font-playfair text-[#FDFBF7] mb-2 group-hover:text-[#D4AF37] transition-colors duration-500">The Oak &amp; Ash Residence</h4>
                  <p className="text-[#A69F95] text-xs tracking-widest uppercase font-light">Minimalist Sanctuary</p>
                </div>
                <div className="text-[#D4AF37] group-hover:translate-x-2 transition-transform">
                  <ArrowRight strokeWidth={1} />
                </div>
              </div>
            </RevealSection>

            {/* Project 2 */}
            <RevealSection delay={300} className="group cursor-pointer cursor-expand portfolio-card md:mt-32">
              <div className="relative overflow-hidden aspect-[4/5] mb-8">
                <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1200&q=80" 
                  alt="Penthouse Noir" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" 
                />
                <div className="absolute bottom-8 left-8 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <span className="text-[9px] text-[#D4AF37] tracking-[0.3em] uppercase font-medium">View Project</span>
                </div>
              </div>
              <div className="flex justify-between items-start border-b border-[#D4AF37]/20 pb-6">
                <div>
                  <h4 className="text-3xl font-playfair text-[#FDFBF7] mb-2 group-hover:text-[#D4AF37] transition-colors duration-500">Penthouse Noir</h4>
                  <p className="text-[#A69F95] text-xs tracking-widest uppercase font-light">Moody Monochrome</p>
                </div>
                <div className="text-[#D4AF37] group-hover:translate-x-2 transition-transform">
                  <ArrowRight strokeWidth={1} />
                </div>
              </div>
            </RevealSection>

            {/* Project 3 */}
            <RevealSection delay={100} className="group cursor-pointer cursor-expand portfolio-card">
              <div className="relative overflow-hidden aspect-[4/5] mb-8">
                <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="https://images.unsplash.com/photo-1631679706909-1844bbd07221?auto=format&fit=crop&w=1200&q=80" 
                  alt="The Jade Studio" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" 
                />
                <div className="absolute bottom-8 left-8 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <span className="text-[9px] text-[#D4AF37] tracking-[0.3em] uppercase font-medium">View Project</span>
                </div>
              </div>
              <div className="flex justify-between items-start border-b border-[#D4AF37]/20 pb-6">
                <div>
                  <h4 className="text-3xl font-playfair text-[#FDFBF7] mb-2 group-hover:text-[#D4AF37] transition-colors duration-500">The Jade Studio</h4>
                  <p className="text-[#A69F95] text-xs tracking-widest uppercase font-light">Contemporary Calm</p>
                </div>
                <div className="text-[#D4AF37] group-hover:translate-x-2 transition-transform">
                  <ArrowRight strokeWidth={1} />
                </div>
              </div>
            </RevealSection>

            {/* Project 4 */}
            <RevealSection delay={300} className="group cursor-pointer cursor-expand portfolio-card md:mt-32">
              <div className="relative overflow-hidden aspect-[4/5] mb-8">
                <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="https://images.unsplash.com/photo-1567538096621-38d2284b23ff?auto=format&fit=crop&w=1200&q=80" 
                  alt="Soleil Retreat" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out" 
                />
                <div className="absolute bottom-8 left-8 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  <span className="text-[9px] text-[#D4AF37] tracking-[0.3em] uppercase font-medium">View Project</span>
                </div>
              </div>
              <div className="flex justify-between items-start border-b border-[#D4AF37]/20 pb-6">
                <div>
                  <h4 className="text-3xl font-playfair text-[#FDFBF7] mb-2 group-hover:text-[#D4AF37] transition-colors duration-500">Soleil Retreat</h4>
                  <p className="text-[#A69F95] text-xs tracking-widest uppercase font-light">Warm Provençal</p>
                </div>
                <div className="text-[#D4AF37] group-hover:translate-x-2 transition-transform">
                  <ArrowRight strokeWidth={1} />
                </div>
              </div>
            </RevealSection>
          </div>

          {/* View All CTA */}
          <RevealSection delay={200} className="mt-24 flex justify-center">
            <a href="#" className="group inline-flex items-center gap-8 px-16 py-6 border border-[#D4AF37]/30 text-[10px] font-medium tracking-[0.3em] uppercase text-[#FDFBF7] hover:border-[#D4AF37] hover:text-[#D4AF37] transition-all duration-500 relative overflow-hidden">
              <span className="absolute inset-0 bg-[#D4AF37]/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></span>
              <span className="relative">View All Projects</span>
              <ArrowRight className="h-3 w-3 relative group-hover:translate-x-2 transition-transform" />
            </a>
          </RevealSection>
        </div>
      </section>

      {/* --- CLIENT REVIEWS --- */}
      <section className="py-32 bg-[#1A1816] relative border-t border-[#D4AF37]/10">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <RevealSection className="flex flex-col items-center text-center mb-24">
            <h2 className="text-[10px] font-medium tracking-[0.4em] text-[#D4AF37] uppercase mb-8 flex items-center gap-6 justify-center">
              <span className="w-12 h-[1px] bg-[#D4AF37]"></span> 04. Praise <span className="w-12 h-[1px] bg-[#D4AF37]"></span>
            </h2>
          </RevealSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Eleanor Vance", role: "Homeowner", text: "They transformed our chaotic house into a serene, tactile haven. The attention to natural light and warm textures is simply poetic." },
              { name: "Julian Rossi", role: "Boutique Hotelier", text: "Their interior architecture completely elevated our guest experience. Every material feels intentional and luxurious." },
              { name: "Sophie Chen", role: "Art Collector", text: "They designed a space that doesn't just display art, but feels like art itself. A masterclass in organic minimalism." }
            ].map((review, i) => (
              <RevealSection key={i} delay={i * 200} className="border border-[#D4AF37]/10 p-12 relative group hover:border-[#D4AF37]/40 transition-colors duration-500 cursor-expand bg-[#141210]">
                <div className="text-8xl text-[#D4AF37]/20 absolute top-4 left-6 font-playfair leading-none italic">"</div>
                <p className="text-[#E8E3DB] font-light leading-loose mb-12 relative z-10 text-sm">
                  {review.text}
                </p>
                <div className="flex items-center gap-6 relative z-10 pt-6 border-t border-[#D4AF37]/10">
                  <div>
                    <h5 className="text-[#FDFBF7] text-sm font-medium mb-1">{review.name}</h5>
                    <p className="text-[9px] text-[#D4AF37] tracking-[0.2em] uppercase">{review.role}</p>
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
                  <a href={`mailto:${BRAND.email}`} className="text-xl font-playfair italic text-[#E8E3DB] hover:text-[#D4AF37] transition-colors cursor-expand">
                    {BRAND.email}
                  </a>
                </div>
                <div>
                  <h5 className="text-[9px] font-medium tracking-[0.3em] text-[#8C8477] uppercase mb-3">Location</h5>
                  <p className="text-lg font-light text-[#E8E3DB] leading-relaxed">
                    {BRAND.address}
                  </p>
                </div>
                <div>
                  <h5 className="text-[9px] font-medium tracking-[0.3em] text-[#8C8477] uppercase mb-3">Follow</h5>
                  <a href={BRAND.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 text-[#E8E3DB] hover:text-[#D4AF37] transition-colors cursor-expand">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    <span className="font-playfair italic text-lg">metaphoricarchitect</span>
                    <span className="text-[#D4AF37] text-xs tracking-widest">({BRAND.followers} fans)</span>
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
                    <option className="bg-[#1A1816]">Architecture & Planning</option>
                    <option className="bg-[#1A1816]">Interior Design</option>
                    <option className="bg-[#1A1816]">Construction Management</option>
                    <option className="bg-[#1A1816]">Consulting</option>
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
            <p>&copy; {new Date().getFullYear()} {BRAND.nameAlt} — {BRAND.city}</p>
            <div className="flex gap-10">
              <a href={BRAND.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">Facebook</a>
              <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[#D4AF37] transition-colors">Instagram</a>
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
