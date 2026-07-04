'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Image, Grid, FolderKanban, Users, Shield, MessageSquare, HelpCircle, Save, Loader2, Upload } from 'lucide-react';
import { useGetSettingsQuery, useUpdateSettingMutation, useGetSectionsQuery, useUpdateSectionMutation } from '@/store/api/websiteApi';
import { ServicesTab } from './components/ServicesTab';
import { PortfolioTab } from './components/PortfolioTab';
import { TeamTab } from './components/TeamTab';
import { TrustTab } from './components/TrustTab';
import { TestimonialsTab } from './components/TestimonialsTab';
import { FaqsTab } from './components/FaqsTab';

export default function WebsiteManagementPage() {
  const [activeTab, setActiveTab] = useState('settings');

  const tabs = [
    { id: 'settings', label: 'General Settings', icon: Settings },
    { id: 'sections', label: 'Page Sections', icon: Image },
    { id: 'services', label: 'Services', icon: Grid },
    { id: 'portfolio', label: 'Portfolio (Case Studies)', icon: FolderKanban },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'trust', label: 'Trust Badges', icon: Shield },
    { id: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    { id: 'faqs', label: 'FAQs', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-100">Website Management</h1>
      </div>
      
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-1 shadow-sm">
        <div className="flex overflow-x-auto custom-scrollbar gap-2 p-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[500px]">
        {activeTab === 'settings' && <GeneralSettingsTab />}
        {activeTab === 'sections' && <PageSectionsTab />}
        {activeTab === 'services' && <ServicesTab />}
        {activeTab === 'portfolio' && <PortfolioTab />}
        {activeTab === 'team' && <TeamTab />}
        {activeTab === 'trust' && <TrustTab />}
        {activeTab === 'testimonials' && <TestimonialsTab />}
        {activeTab === 'faqs' && <FaqsTab />}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// GENERAL SETTINGS TAB COMPONENT
// ----------------------------------------------------------------------------
function GeneralSettingsTab() {
  const { data: settings, isLoading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: isUpdating }] = useUpdateSettingMutation();

  const [formData, setFormData] = useState({
    name: 'Metaphoric',
    nameAlt: 'Metaphoric Architect',
    tagline: 'Architect',
    city: 'Dhaka, Bangladesh',
    facebook: 'https://www.facebook.com/metaphoricarchitect',
    instagram: 'https://www.instagram.com/',
    email: 'info@metaphoricarchitect.com',
    phone: '+880 1XXX-XXXXXX',
    address: 'Dhaka, Bangladesh',
    followers: '15.8K',
    years: '10+',
    projects: '200+',
    satisfaction: '98%',
  });

  useEffect(() => {
    if (settings && settings.BRAND_INFO) {
      setFormData(settings.BRAND_INFO);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    try {
      await updateSetting({ key: 'BRAND_INFO', value: formData }).unwrap();
      alert('Settings saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">General Brand Settings</h2>
          <p className="text-sm text-slate-400 mt-1">These details are shown across the navigation, footer, and stats sections of the public website.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isUpdating}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4 p-5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3 border-b border-slate-800 pb-2">Basic Info</h3>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Brand Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Full Name / Alt</label>
            <input type="text" name="nameAlt" value={formData.nameAlt} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Tagline</label>
            <input type="text" name="tagline" value={formData.tagline} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4 p-5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3 border-b border-slate-800 pb-2">Contact & Social</h3>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Email Address</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Facebook URL</label>
              <input type="text" name="facebook" value={formData.facebook} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Instagram URL</label>
              <input type="text" name="instagram" value={formData.instagram} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="space-y-4 p-5 bg-slate-950/50 border border-slate-800/80 rounded-xl md:col-span-2">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3 border-b border-slate-800 pb-2">Global Statistics & Location</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">City / Region</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Full Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Followers Count</label>
              <input type="text" name="followers" value={formData.followers} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
            </div>
             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Years Active</label>
              <input type="text" name="years" value={formData.years} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
            </div>
             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Projects Done</label>
              <input type="text" name="projects" value={formData.projects} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
            </div>
             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Satisfaction Rate</label>
              <input type="text" name="satisfaction" value={formData.satisfaction} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// PAGE SECTIONS TAB COMPONENT
// ----------------------------------------------------------------------------
function PageSectionsTab() {
  const { data: sections, isLoading } = useGetSectionsQuery();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();

  const [heroData, setHeroData] = useState({
    sectionKey: 'HERO',
    subtitle: 'Architecture · Design · Planning · Dhaka',
    title: 'Build',
    highlight: 'Dreams.',
    description: 'Metaphoric Architect is a Dhaka-based firm delivering architecture, design, planning, construction & consulting services across Bangladesh.',
    imageUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=2800&q=80',
    videoUrl: '',
    isActive: true,
  });

  useEffect(() => {
    if (sections && sections.HERO) {
      setHeroData(sections.HERO);
    }
  }, [sections]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setHeroData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      
      if (img.width < 1920 || img.height < 1080) {
        alert(`Warning: The recommended image size is 1920x1080 pixels for the best quality on large screens. Your image is ${img.width}x${img.height} pixels. It will still be uploaded, but may look blurry.`);
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const json = await res.json();
        if (res.ok && json.data?.url) {
          setHeroData((prev) => ({ ...prev, imageUrl: json.data.url }));
        } else {
          alert('Upload failed.');
        }
      } catch (err) {
        console.error(err);
        alert('Upload failed.');
      }
    };
    img.src = objectUrl;
  };

  const handleSave = async () => {
    try {
      await updateSection(heroData).unwrap();
      alert('Hero section saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save hero section.');
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-cyan-500 w-8 h-8" /></div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-200">Hero Section</h2>
          <p className="text-sm text-slate-400 mt-1">This is the first thing visitors see at the top of your landing page.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isUpdating}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Hero Section
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4 p-5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3 border-b border-slate-800 pb-2">Hero Typography</h3>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Eyebrow Subtitle</label>
            <input type="text" name="subtitle" value={heroData.subtitle} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="e.g. Architecture · Design · Planning" />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title Line 1</label>
              <input type="text" name="title" value={heroData.title} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="e.g. Build" />
            </div>
             <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title Line 2 (Highlighted)</label>
              <input type="text" name="highlight" value={heroData.highlight} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="e.g. Dreams." />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Hero Description</label>
            <textarea name="description" value={heroData.description} onChange={handleChange} rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500 resize-none" placeholder="Short introduction..."></textarea>
          </div>
        </div>

        <div className="space-y-4 p-5 bg-slate-950/50 border border-slate-800/80 rounded-xl">
          <h3 className="text-sm font-semibold text-cyan-400 mb-3 border-b border-slate-800 pb-2">Hero Media</h3>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Background Image <span className="text-amber-500/80 ml-1">(Recommended: 1920x1080px)</span></label>
            <div className="flex items-center gap-4">
              <label className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg cursor-pointer transition-colors border border-slate-700 hover:border-cyan-500">
                <Upload className="w-4 h-4" />
                Upload New Image
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {heroData.imageUrl && (
                <span className="text-xs text-slate-500 truncate max-w-[200px]">{heroData.imageUrl.split('/').pop()}</span>
              )}
            </div>
          </div>
          {heroData.imageUrl && (
            <div className="w-full h-32 rounded-lg overflow-hidden border border-slate-700 relative">
              <img src={heroData.imageUrl} alt="Hero preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center pointer-events-none">
                 <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">Image Preview</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Play Film Link (YouTube/Vimeo URL)</label>
            <input type="text" name="videoUrl" value={heroData.videoUrl} onChange={handleChange} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500" placeholder="https://..." />
          </div>
        </div>
      </div>
    </div>
  );
}
