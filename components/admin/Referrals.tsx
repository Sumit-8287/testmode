import React, { useState, useEffect } from 'react';

interface ReferralRecord {
  _id?: string;
  studentId: string;
  studentName?: string;
  referralCode: string;
  referredStudents: {
    studentId: string;
    studentName: string;
    date: string;
    earning: number;
    status: string;
  }[];
  totalEarnings: number;
  pendingEarnings: number;
}

interface ReferralSettings {
  commissionType: 'percentage' | 'fixed';
  commissionValue: number;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const Referrals: React.FC<Props> = ({ showToast }) => {
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [settings, setSettings] = useState<ReferralSettings>({ commissionType: 'fixed', commissionValue: 50 });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'settings'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [referralsRes, settingsRes, studentsRes] = await Promise.all([
        fetch('/api/admin/referrals'),
        fetch('/api/admin/referral-settings'),
        fetch('/api/students')
      ]);
      const referralsData = await referralsRes.json();
      const settingsData = await settingsRes.json();
      const studentsData = await studentsRes.json();
      setReferrals(referralsData);
      if (settingsData && settingsData.commissionType) {
        setSettings(settingsData);
      }
      setStudents(studentsData);
    } catch (error) {
      showToast('Failed to load referral data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student?.name || studentId;
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/admin/referral-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showToast('Commission settings saved!');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const updateReferralStatus = async (referralCode: string, referredStudentId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/referrals/update-status', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode, referredStudentId, status: newStatus })
      });
      if (res.ok) {
        showToast(`Referral ${newStatus}!`);
        loadData();
      } else {
        showToast('Failed to update status', 'error');
      }
    } catch (error) {
      showToast('Failed to update status', 'error');
    }
  };

  const totalReferrals = referrals.reduce((sum, r) => sum + (r.referredStudents?.length || 0), 0);
  const totalCommissionsPaid = referrals.reduce((sum, r) => sum + (r.totalEarnings || 0), 0);
  const pendingCommissions = referrals.reduce((sum, r) => sum + (r.pendingEarnings || 0), 0);

  const allReferredEntries = referrals.flatMap(r =>
    (r.referredStudents || []).map(rs => ({
      referrerName: getStudentName(r.studentId),
      referrerId: r.studentId,
      referralCode: r.referralCode,
      ...rs
    }))
  ).filter(entry => {
    const matchesSearch = !searchQuery ||
      (entry.referrerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.referrerId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.studentId || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (entry.status || 'pending') === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A237E]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black text-[#1A237E] uppercase tracking-widest">Referral Management</h3>
          <p className="text-[10px] text-gray-400 font-bold mt-1">Manage referrals & commissions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#303F9F]/10 rounded-xl flex items-center justify-center">
              <span className="material-icons-outlined text-[#303F9F]">group</span>
            </div>
            <div>
              <p className="text-2xl font-black text-[#1A237E]">{totalReferrals}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Referrals</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <span className="material-icons-outlined text-green-600">payments</span>
            </div>
            <div>
              <p className="text-2xl font-black text-green-600">₹{totalCommissionsPaid}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Commissions Paid</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <span className="material-icons-outlined text-amber-600">schedule</span>
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">₹{pendingCommissions}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pending Commissions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'all' ? 'bg-[#1A237E] text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            All Referrals
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${activeTab === 'settings' ? 'bg-[#1A237E] text-white shadow-lg' : 'bg-white text-gray-500 border border-gray-200'
              }`}
          >
            Commission Settings
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none shadow-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
            </select>

            <div className="relative flex-1 md:flex-none">
              <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
              <input
                type="text"
                placeholder="Search referrer or student..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none shadow-sm w-full md:w-64 focus:border-[#1A237E]"
              />
            </div>
          </div>
        )}
      </div>

      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h4 className="text-sm font-black text-[#1A237E] uppercase tracking-widest mb-4">Commission Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Commission Type</label>
              <select
                value={settings.commissionType}
                onChange={(e) => setSettings({ ...settings, commissionType: e.target.value as 'percentage' | 'fixed' })}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#303F9F]/20"
              >
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                {settings.commissionType === 'fixed' ? 'Amount (₹)' : 'Percentage (%)'}
              </label>
              <input
                type="number"
                value={settings.commissionValue}
                onChange={(e) => setSettings({ ...settings, commissionValue: Number(e.target.value) })}
                className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#303F9F]/20"
                min={0}
              />
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-xl">
            <p className="text-xs text-[#303F9F] font-medium">
              {settings.commissionType === 'fixed'
                ? `Each referrer earns ₹${settings.commissionValue} per successful referral.`
                : `Each referrer earns ${settings.commissionValue}% of the referred student's purchase amount.`
              }
            </p>
          </div>
          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="mt-4 bg-[#1A237E] text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#303F9F] transition-colors disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      {activeTab === 'all' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Referrer</th>
                  <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Referred Student</th>
                  <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Commission</th>
                  <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="text-left p-4 text-[10px] font-black text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allReferredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <span className="material-icons-outlined text-4xl text-gray-300">loyalty</span>
                      <p className="text-sm text-gray-400 mt-2">No referrals yet</p>
                    </td>
                  </tr>
                ) : (
                  allReferredEntries.map((entry, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#303F9F]/10 rounded-full flex items-center justify-center">
                            <span className="text-xs font-black text-[#303F9F]">{entry.referrerName?.charAt(0)?.toUpperCase() || '?'}</span>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800">{entry.referrerName}</p>
                            <p className="text-[9px] text-gray-400">{entry.referralCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-xs font-bold text-gray-800">{entry.studentName || 'Unknown'}</p>
                        <p className="text-[9px] text-gray-400">{entry.studentId}</p>
                      </td>
                      <td className="p-4 text-xs text-gray-600">
                        {entry.date ? new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                      </td>
                      <td className="p-4">
                        <span className="text-xs font-bold text-green-600">₹{entry.earning || 0}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${entry.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            entry.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                          }`}>
                          {entry.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-4">
                        {(entry.status === 'pending' || !entry.status) && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => updateReferralStatus(entry.referralCode, entry.studentId, 'confirmed')}
                              className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                              title="Approve"
                            >
                              <span className="material-icons-outlined text-sm">check</span>
                            </button>
                            <button
                              onClick={() => updateReferralStatus(entry.referralCode, entry.studentId, 'rejected')}
                              className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                              title="Reject"
                            >
                              <span className="material-icons-outlined text-sm">close</span>
                            </button>
                          </div>
                        )}
                        {entry.status === 'confirmed' && (
                          <span className="text-[9px] text-green-600 font-bold">Approved</span>
                        )}
                        {entry.status === 'rejected' && (
                          <span className="text-[9px] text-red-600 font-bold">Rejected</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Referrals;
