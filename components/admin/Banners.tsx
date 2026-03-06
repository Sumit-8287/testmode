import React, { useState, useEffect } from 'react';
import { bannersAPI } from '../../src/services/apiClient';

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl?: string;
  order: number;
  active: boolean;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const Banners: React.FC<Props> = ({ showToast }) => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({ title: '', imageUrl: '', linkUrl: '', active: true, order: 1 });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      const data = await bannersAPI.getAll();
      setBanners(data.sort((a: Banner, b: Banner) => a.order - b.order));
    } catch (error) {
      showToast('Failed to load banners', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const bannerData = {
        id: editingBanner?.id || `banner_${Date.now()}`,
        title: formData.title,
        imageUrl: formData.imageUrl,
        linkUrl: formData.linkUrl,
        order: formData.order,
        active: formData.active
      };

      if (editingBanner) {
        await bannersAPI.update(editingBanner.id, bannerData);
        showToast('Banner updated successfully!');
      } else {
        await bannersAPI.create(bannerData);
        showToast('Banner created successfully!');
      }

      setShowModal(false);
      setEditingBanner(null);
      setFormData({ title: '', imageUrl: '', linkUrl: '', active: true, order: banners.length + 1 });
      loadBanners();
    } catch (error) {
      showToast('Failed to save banner', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this banner?')) {
      try {
        await bannersAPI.delete(id);
        showToast('Banner deleted successfully!');
        loadBanners();
      } catch (error) {
        showToast('Failed to delete banner', 'error');
      }
    }
  };

  const openEditModal = (banner: Banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || '',
      active: banner.active,
      order: banner.order || 1
    });
    setShowModal(true);
  };

  const filteredBanners = banners.filter(b => {
    const matchesSearch = !searchQuery || b.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && b.active) ||
      (statusFilter === 'inactive' && !b.active);
    return matchesSearch && matchesStatus;
  });

  const toggleActive = async (banner: Banner) => {
    try {
      await bannersAPI.update(banner.id, { ...banner, active: !banner.active });
      loadBanners();
      showToast(`Banner ${!banner.active ? 'activated' : 'deactivated'}!`);
    } catch (error) {
      showToast('Failed to update banner', 'error');
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
    <div className="space-y-8 animate-fade-in">
      {/* Header with Search & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-xl font-black text-navy uppercase tracking-widest">App Slide Banners</h3>
          <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase">Total: {banners.length} Banners</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-bold outline-none shadow-sm"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <div className="relative flex-1 md:flex-none">
            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">search</span>
            <input
              type="text"
              placeholder="Search banners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border border-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold outline-none shadow-sm w-full md:w-64 focus:border-navy"
            />
          </div>

          <button
            onClick={() => { setEditingBanner(null); setFormData({ title: '', imageUrl: '', linkUrl: '', active: true, order: banners.length + 1 }); setShowModal(true); }}
            className="bg-navy text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-xl tracking-widest flex items-center gap-2"
          >
            <span className="material-icons-outlined text-sm">add</span> Add Slider
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredBanners.map(banner => (
          <div key={banner.id} className="relative group">
            <div className={`aspect-[2/1] rounded-[2rem] overflow-hidden border-2 ${banner.active ? 'border-navy' : 'border-gray-200'}`}>
              {banner.imageUrl ? (
                <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-navy/5 flex flex-col items-center justify-center">
                  <span className="material-icons-outlined text-4xl text-gray-300">image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-white font-black text-sm truncate">{banner.title}</p>
                  <p className="text-white/60 text-[10px] mt-1">Slot #{banner.order}</p>
                </div>
              </div>
            </div>

            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => toggleActive(banner)}
                className={`p-2 rounded-lg ${banner.active ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}
                title={banner.active ? 'Deactivate' : 'Activate'}
              >
                <span className="material-icons-outlined text-sm">{banner.active ? 'visibility' : 'visibility_off'}</span>
              </button>
              <button
                onClick={() => openEditModal(banner)}
                className="p-2 bg-white text-navy rounded-lg shadow-lg hover:scale-110 transition-transform"
                title="Edit"
              >
                <span className="material-icons-outlined text-sm">edit</span>
              </button>
              <button
                onClick={() => handleDelete(banner.id)}
                className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:scale-110 transition-transform"
                title="Delete"
              >
                <span className="material-icons-outlined text-sm">delete</span>
              </button>
            </div>

            {!banner.active && (
              <div className="absolute top-4 left-4 bg-gray-800/80 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase">
                Inactive
              </div>
            )}
          </div>
        ))}

        {filteredBanners.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-[2rem] border border-gray-100">
            <span className="material-icons-outlined text-6xl text-gray-100 mb-4">image_not_supported</span>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No banners found</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-black text-navy uppercase tracking-widest mb-6">
              {editingBanner ? 'Edit Banner' : 'Add New Banner'}
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Banner Title</label>
                <input
                  type="text"
                  placeholder="e.g. 50% Off Summer Sale"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold outline-none focus:border-navy"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Image URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/image.jpg"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold outline-none focus:border-navy"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Redirect URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://example.com/link"
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold outline-none focus:border-navy"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase ml-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                    className="w-full bg-gray-50 border border-gray-100 p-4 rounded-xl text-xs font-bold outline-none focus:border-navy"
                  />
                </div>
                <div className="flex items-center gap-3 pl-4 pt-4">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                    className="w-5 h-5 accent-navy cursor-pointer"
                  />
                  <span className="text-[10px] font-black text-navy uppercase tracking-widest">Active</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 text-gray-600 py-4 rounded-2xl font-black text-xs uppercase hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-navy text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg shadow-navy/20 hover:scale-[1.02] transition-all"
              >
                {editingBanner ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Banners;
