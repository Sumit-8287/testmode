import React, { useState, useEffect } from 'react';
import { settingsAPI, splashScreenAPI } from '../../src/services/apiClient';

interface Settings {
  paymentGateway: string;
  systemStatus: string;
  maintenanceMode: boolean;
  razorpayKeyId?: string;
  contactEmail?: string;
  supportPhone?: string;
}

interface SplashSettings {
  imageUrl: string;
  isActive: boolean;
  duration: number;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const SettingsComponent: React.FC<Props> = ({ showToast }) => {
  const [settings, setSettings] = useState<Settings>({
    paymentGateway: 'razorpay',
    systemStatus: 'online',
    maintenanceMode: false,
    razorpayKeyId: '',
    contactEmail: '',
    supportPhone: ''
  });
  const [splash, setSplash] = useState<SplashSettings>({
    imageUrl: '/attached_assets/ChatGPT_Image_Feb_8,_2026,_05_51_58_PM_1770553325908.png',
    isActive: true,
    duration: 3000
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSplash, setSavingSplash] = useState(false);

  useEffect(() => {
    loadSettings();
    loadSplash();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await settingsAPI.get();
      setSettings({ ...settings, ...data });
    } catch (error) {
      showToast('Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadSplash = async () => {
    try {
      const data = await splashScreenAPI.get();
      if (data) {
        setSplash({
          imageUrl: data.imageUrl || '',
          isActive: data.isActive !== false,
          duration: data.duration || 3000
        });
      }
    } catch (error) {
      console.error('Failed to load splash settings');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      showToast('Settings updated successfully!');
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSplash = async () => {
    setSavingSplash(true);
    try {
      await splashScreenAPI.update(splash);
      showToast('Splash screen settings updated!');
    } catch (error) {
      showToast('Failed to save splash screen settings', 'error');
    } finally {
      setSavingSplash(false);
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
    <div className="space-y-6 animate-fade-in max-w-4xl pb-10">
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Global Configuration</h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-medium">Core system and gateway settings</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Payment Gateway</p>
              <select
                value={settings.paymentGateway}
                onChange={(e) => setSettings({ ...settings, paymentGateway: e.target.value })}
                className="w-full h-11 bg-gray-50/50 rounded-xl px-4 font-semibold text-sm border border-gray-100 outline-none focus:ring-1 focus:ring-gray-200 transition-all"
              >
                <option value="razorpay">Razorpay</option>
                <option value="stripe">Stripe</option>
                <option value="paytm">Paytm</option>
              </select>
            </div>
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">System Status</p>
              <div className={`h-11 rounded-xl flex items-center px-4 font-bold text-xs uppercase ${settings.systemStatus === 'online' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-2 ${settings.systemStatus === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                {settings.systemStatus}
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Razorpay Key ID</p>
            <input
              type="text"
              value={settings.razorpayKeyId || ''}
              onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
              placeholder="rzp_live_xxxxxxxxxxxxx"
              className="w-full h-11 bg-gray-50/50 rounded-xl px-4 font-semibold text-sm border border-gray-100 outline-none focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-gray-300"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Contact Email</p>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                placeholder="support@institute.com"
                className="w-full h-11 bg-gray-50/50 rounded-xl px-4 font-semibold text-sm border border-gray-100 outline-none focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-gray-300"
              />
            </div>
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Support Phone</p>
              <input
                type="text"
                value={settings.supportPhone || ''}
                onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
                className="w-full h-11 bg-gray-50/50 rounded-xl px-4 font-semibold text-sm border border-gray-100 outline-none focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-gray-300"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50/30 rounded-2xl border border-gray-100/50">
            <div>
              <p className="text-sm font-bold text-gray-900">Maintenance Mode</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Enable to restrict user access during updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-8 bg-gray-900 text-white px-10 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-gray-800 transition-all shadow-sm active:scale-95"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 tracking-tight">Splash Screen</h3>
          <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-medium">Visual experience on application startup</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50/30 rounded-2xl border border-gray-100/50">
            <div>
              <p className="text-sm font-bold text-gray-900">Enable Splash Screen</p>
              <p className="text-[11px] text-gray-400 mt-0.5 font-medium">Display custom entry screen to students</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={splash.isActive}
                onChange={(e) => setSplash({ ...splash, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-gray-900"></div>
            </label>
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Splash Image URL</p>
            <input
              type="text"
              value={splash.imageUrl}
              onChange={(e) => setSplash({ ...splash, imageUrl: e.target.value })}
              placeholder="https://example.com/splash-image.png"
              className="w-full h-11 bg-gray-50/50 rounded-xl px-4 font-semibold text-sm border border-gray-100 outline-none focus:ring-1 focus:ring-gray-200 transition-all placeholder:text-gray-300"
            />
            {splash.imageUrl && (
              <div className="mt-4 rounded-2xl overflow-hidden border border-gray-100 max-w-sm bg-gray-50 p-2 shadow-inner">
                <img src={splash.imageUrl} alt="Splash Preview" className="w-full h-auto rounded-xl" />
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest ml-1">Display Duration (seconds)</p>
            <input
              type="number"
              value={splash.duration / 1000}
              onChange={(e) => setSplash({ ...splash, duration: Number(e.target.value) * 1000 })}
              min={1}
              max={10}
              className="w-full h-11 bg-gray-50/50 rounded-xl px-4 font-semibold text-sm border border-gray-100 outline-none focus:ring-1 focus:ring-gray-200 transition-all"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSplash}
          disabled={savingSplash}
          className="mt-8 bg-gray-900 text-white px-10 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-50 hover:bg-gray-800 transition-all shadow-sm active:scale-95"
        >
          {savingSplash ? 'Saving...' : 'Update Splash Settings'}
        </button>
      </div>
    </div>
  );
};

export default SettingsComponent;
