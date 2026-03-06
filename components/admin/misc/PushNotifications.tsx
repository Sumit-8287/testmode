import React, { useState, useEffect } from 'react';
import { notificationsAPI } from '../../../src/services/apiClient';

interface Notification { id: string; title: string; message: string; type: string; status: 'sent' | 'pending'; createdDate: string; }

interface Props { showToast: (m: string, type?: 'success' | 'error') => void; }

const PushNotifications: React.FC<Props> = ({ showToast }) => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', message: '', type: '', status: 'pending' as 'sent' | 'pending' });

  useEffect(() => { loadItems(); }, []);

  const loadItems = async () => {
    try {
      const data = await notificationsAPI.getAll().catch(() => []);
      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      showToast('Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSubmit = async () => {
    if (!formData.title || !formData.message) { showToast('Please fill required fields', 'error'); return; }
    try {
      const data = {
        id: editingItem?.id || `notif_${Date.now()}`,
        title: formData.title,
        message: formData.message,
        type: formData.type,
        status: formData.status,
        createdDate: editingItem?.createdDate || new Date().toISOString()
      };
      if (editingItem) {
        await notificationsAPI.update(editingItem.id, data);
        showToast('Updated!');
      } else {
        await notificationsAPI.create(data);
        showToast('Created!');
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({ title: '', message: '', type: '', status: 'pending' });
      loadItems();
    } catch (error) {
      showToast('Failed to save', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete?')) {
      try {
        await notificationsAPI.delete(id);
        showToast('Deleted!');
        loadItems();
      } catch (error) {
        showToast('Failed', 'error');
      }
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div><h3 className="text-lg font-black text-navy uppercase tracking-widest">Push Notifications</h3><p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Total: {items.length}</p></div>
        <button onClick={() => { setEditingItem(null); setFormData({ title: '', message: '', type: '', status: 'pending' }); setShowModal(true); }} className="bg-navy text-white px-6 py-3 rounded-xl font-black text-[11px] uppercase shadow-sm hover:shadow-md hover:scale-105 transition-all flex items-center gap-2"><span className="material-icons-outlined text-base">add</span> Send</button>
      </div>

      <div className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center bg-gray-50/30">
        <div className="flex-1 relative group w-full">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] group-focus-within:text-navy transition-colors">search</span>
          <input
            type="text"
            placeholder="Search notifications by title or message..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all shadow-sm placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group shrink-0">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${isFilterOpen || statusFilter !== 'all' ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Advanced Filters
              {statusFilter !== 'all' && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] p-5 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Filter Items</h4>
                  <button
                    onClick={() => { setStatusFilter('all'); setIsFilterOpen(false); }}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Reset
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Delivery Status</label>
                  <div className="flex flex-col gap-1">
                    {[
                      { id: 'all', label: 'All Notifications', icon: 'notifications_active' },
                      { id: 'sent', label: 'Sent Only', icon: 'done_all', color: 'text-green-500' },
                      { id: 'pending', label: 'Pending Only', icon: 'schedule', color: 'text-amber-500' }
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setStatusFilter(item.id); setIsFilterOpen(false); }}
                        className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-[12px] font-bold transition-all ${statusFilter === item.id ? 'bg-navy text-white shadow-md' : 'hover:bg-gray-50 text-gray-600'}`}
                      >
                        <span className={`material-symbols-outlined text-[18px] ${statusFilter === item.id ? 'text-white' : item.color || 'text-gray-400'}`}>{item.icon}</span>
                        {item.label}
                        {statusFilter === item.id && <span className="material-symbols-outlined text-[16px] ml-auto">check</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 shrink-0">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(parseInt(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent text-[13px] font-bold text-navy outline-none cursor-pointer pr-2"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">{paginatedItems.length === 0 ? (<div className="p-12 text-center"><span className="material-icons-outlined text-5xl text-gray-200 block mb-4">notifications</span><p className="text-gray-400 font-bold uppercase">No notifications found</p></div>) : (<><div className="overflow-x-auto"><table className="w-full text-xs"><thead><tr className="bg-gray-50 border-b border-gray-100"><th className="px-6 py-4 text-left"><input type="checkbox" /></th><th className="px-6 py-4 text-left font-black text-gray-600 uppercase tracking-wider">Title</th><th className="px-6 py-4 text-left font-black text-gray-600 uppercase tracking-wider">Message</th><th className="px-6 py-4 text-center font-black text-gray-600 uppercase tracking-wider">Type</th><th className="px-6 py-4 text-center font-black text-gray-600 uppercase tracking-wider">Status</th><th className="px-6 py-4 text-center font-black text-gray-600 uppercase tracking-wider">Actions</th></tr></thead><tbody>{paginatedItems.map((item, idx) => (<tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50/50 group"><td className="px-6 py-4"><input type="checkbox" /></td><td className="px-6 py-4 font-bold text-navy">{item.title}</td><td className="px-6 py-4 text-gray-600 max-w-xs truncate">{item.message}</td><td className="px-6 py-4 text-center"><span className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded text-[10px] font-bold border border-gray-100">{item.type}</span></td><td className="px-6 py-4 text-center"><span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${item.status === 'sent' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>{item.status}</span></td><td className="px-6 py-4 text-center"><div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => { setEditingItem(item); setFormData({ title: item.title, message: item.message, type: item.type, status: item.status }); setShowModal(true); }} className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg"><span className="material-icons-outlined text-base">edit</span></button><button onClick={() => handleDelete(item.id)} className="p-2 hover:bg-gray-100 text-gray-600 rounded-lg"><span className="material-icons-outlined text-base">delete</span></button></div></td></tr>))}</tbody></table></div><div className="flex items-center justify-between bg-gray-50 border-t border-gray-100 px-6 py-4"><p className="text-sm font-bold text-gray-600">Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length}</p><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 hover:bg-white rounded-lg disabled:opacity-50"><span className="material-icons-outlined">chevron_left</span></button>{Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (<button key={page} onClick={() => setCurrentPage(page)} className={`px-3 py-2 rounded-lg font-black text-sm ${page === currentPage ? 'bg-navy text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>{page}</button>))}<button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 hover:bg-white rounded-lg disabled:opacity-50"><span className="material-icons-outlined">chevron_right</span></button></div></div></>)}</div>

      {showModal && (<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl border border-gray-100"><div className="flex justify-between items-center px-8 py-6 border-b border-gray-100"><h3 className="text-lg font-black text-navy uppercase tracking-widest">{editingItem ? 'Edit Notification' : 'Send Notification'}</h3><button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><span className="material-icons-outlined">close</span></button></div><div className="p-8 space-y-4"><div><label className="block text-xs font-black text-gray-700 uppercase mb-2">Title *</label><input type="text" placeholder="Notification title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg font-bold outline-none focus:ring-2 focus:ring-navy/10" /></div><div><label className="block text-xs font-black text-gray-700 uppercase mb-2">Message *</label><textarea placeholder="Notification message" value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg font-bold outline-none focus:ring-2 focus:ring-navy/10 resize-none" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-xs font-black text-gray-700 uppercase mb-2">Type</label><input type="text" placeholder="e.g., Promotion" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg font-bold outline-none focus:ring-2 focus:ring-navy/10" /></div><div><label className="block text-xs font-black text-gray-700 uppercase mb-2">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'sent' | 'pending' })} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-lg font-bold outline-none focus:ring-2 focus:ring-navy/10"><option value="pending">Pending</option><option value="sent">Sent</option></select></div></div></div><div className="flex gap-4 px-8 py-6 border-t border-gray-100 bg-gray-50"><button onClick={() => setShowModal(false)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-black uppercase hover:bg-gray-300">Cancel</button><button onClick={handleSubmit} className="flex-1 bg-navy text-white py-3 rounded-lg font-black uppercase hover:bg-blue-900">{editingItem ? 'Update' : 'Send'}</button></div></div></div>)}
    </div>
  );
};

export default PushNotifications;
