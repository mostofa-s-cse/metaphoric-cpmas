'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Navbar from '@/components/website/Navbar';
import Footer from '@/components/website/Footer';
import CustomCursor from '@/components/website/CustomCursor';
import RevealSection from '@/components/website/RevealSection';

interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  coverImage: string;
  order: number;
}

interface PortfolioClientProps {
  initialItems: PortfolioItem[];
}

export default function PortfolioClient({ initialItems }: PortfolioClientProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Extract unique categories (in uppercase / original casing)
  const categories = ['ALL', ...Array.from(new Set(initialItems.map((item) => item.category.toUpperCase())))];

  // Filter items
  const filteredItems =
    selectedCategory === 'ALL'
      ? initialItems
      : initialItems.filter((item) => item.category.toUpperCase() === selectedCategory);

  return (
    <div className="min-h-screen bg-[#141210] text-[#E8E3DB] font-sans selection:bg-[#D4AF37]/30 selection:text-[#FDFBF7] overflow-x-hidden font-inter">
      <CustomCursor />
      <Navbar />

      {/* --- HERO BANNER --- */}
      <section className="relative pt-48 pb-24 border-b border-[#D4AF37]/10 bg-[#1A1816]">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-playfair font-normal leading-tight text-[#FDFBF7] mb-6">
              Our <i className="text-[#D4AF37]">Portfolio</i>.
            </h1>
            <p className="text-[#A69F95] text-lg leading-relaxed font-light">
              Explore our curation of premium residential, commercial, and structural designs crafted across Dhaka and greater Bangladesh.
            </p>
          </div>
        </div>
      </section>

      {/* --- FILTER NAVIGATION --- */}
      <section className="py-12 border-b border-[#D4AF37]/10 bg-[#141210]/50 sticky top-[76px] z-30 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex flex-wrap items-center gap-6 md:gap-10">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`text-[10px] font-medium tracking-[0.2em] uppercase py-2 transition-all relative cursor-pointer cursor-expand hover:text-[#D4AF37] ${
                  selectedCategory === category
                    ? 'text-[#D4AF37] after:content-[""] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-[#D4AF37]'
                    : 'text-[#8C8477]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- PORTFOLIO LIST --- */}
      <section className="py-24">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#D4AF37]/20 p-12">
              <h3 className="text-xl font-playfair text-[#FDFBF7] mb-2">No projects found</h3>
              <p className="text-sm text-[#A69F95]">We are constantly updating our portfolio. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-24">
              {filteredItems.map((proj, i) => (
                <RevealSection
                  key={proj.id}
                  delay={(i % 2) * 200}
                  className={`group cursor-pointer cursor-expand portfolio-card`}
                >
                  <Link href={`/portfolio/${proj.id}`} className="block">
                    <div className="relative overflow-hidden aspect-[4/5] mb-8 border border-[#D4AF37]/10 group-hover:border-[#D4AF37]/35 transition-all">
                      <div className="absolute inset-0 bg-[#D4AF37]/10 mix-blend-overlay z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141210]/60 via-transparent to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proj.coverImage}
                        alt={proj.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                      />
                      <div className="absolute bottom-8 left-8 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                        <span className="text-[9px] text-[#D4AF37] tracking-[0.3em] uppercase font-medium flex items-center gap-2">
                          View Details <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-start border-b border-[#D4AF37]/20 pb-6">
                      <div>
                        <h4 className="text-3xl font-playfair text-[#FDFBF7] mb-2 group-hover:text-[#D4AF37] transition-colors duration-500">
                          {proj.title}
                        </h4>
                        <p className="text-[#A69F95] text-xs tracking-widest uppercase font-light">
                          {proj.category}
                        </p>
                      </div>
                      <div className="text-[#D4AF37] group-hover:translate-x-2 transition-transform">
                        <ArrowRight strokeWidth={1} />
                      </div>
                    </div>
                  </Link>
                </RevealSection>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-inter { font-family: 'Inter', sans-serif; }
        
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
      `}} />
    </div>
  );
}
