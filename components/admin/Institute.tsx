import React, { useState, useEffect } from 'react';
import { instituteAPI } from '../../src/services/apiClient';

interface InstituteSettings {
  name: string;
  email: string;
  phone: string;
  address: string;
  logo: string;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const Institute: React.FC<Props> = ({ showToast }) => {
  const [settings, setSettings] = useState<InstituteSettings>({
    name: '',
    email: '',
    phone: '',
    address: '',
    logo: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await instituteAPI.get();
      setSettings(data);
    } catch (error) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await instituteAPI.update(settings);
      showToast('Profile settings saved!');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-gray-100 animate-fade-in max-w-2xl">
      <h3 className="text-xl font-black text-navy uppercase tracking-widest mb-8 border-b border-gray-50 pb-4">Institute Settings</h3>
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Institute Name</label>
          <input 
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold outline-none focus:border-navy transition-colors" 
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            placeholder="Enter institute name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Official Email</label>
          <input 
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold outline-none focus:border-navy transition-colors" 
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            placeholder="contact@institute.com"
            type="email"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
          <input 
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold outline-none focus:border-navy transition-colors" 
            value={settings.phone}
            onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            placeholder="+91 XXXXX XXXXX"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Address</label>
          <textarea 
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold outline-none focus:border-navy transition-colors resize-none" 
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            placeholder="Institute address"
            rows={3}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Logo URL</label>
          <input 
            className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold outline-none focus:border-navy transition-colors" 
            value={settings.logo}
            onChange={(e) => setSettings({ ...settings, logo: e.target.value })}
            placeholder="https://example.com/logo.png"
          />
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-navy text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl mt-6 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Update Profile'}
        </button>
      </div>
    </div>
  );
};

export default Institute;
