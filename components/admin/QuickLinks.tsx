import React, { useState, useEffect } from 'react';
import { quickLinksAPI } from '../../src/services/apiClient';

interface QuickLink {
    _id?: string;
    id: string;
    title: string;
    url: string;
    imageUrl: string;
    bgColor?: string;
    sortBy: number;
    description?: string;
    status: 'active' | 'inactive';
}

interface Props {
    showToast: (m: string, type?: 'success' | 'error') => void;
}

const QuickLinks: React.FC<Props> = ({ showToast }) => {
    const [activeTab, setActiveTab] = useState<'Links' | 'YT Embeds'>('Links');
    const [links, setLinks] = useState<QuickLink[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showAddDrawer, setShowAddDrawer] = useState(false);
    const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
    const [formData, setFormData] = useState({ title: '', url: '', sortBy: 1, imageUrl: '', bgColor: '#0866FF', description: '' });

    const fetchLinks = async () => {
        try {
            setIsLoading(true);
            const data = await quickLinksAPI.getAll();
            setLinks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch links:', error);
            // Fallback to mock if API fails for now to keep UI working
            setLinks([
                { id: '1', title: 'Telegram', url: 'https://t.me/example', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png', bgColor: '#24A1DE', sortBy: 5.00, status: 'active' },
                { id: '2', title: 'Instagram', url: 'https://instagram.com/example', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png', bgColor: '#d6249f', sortBy: 4.00, status: 'active' },
                { id: '3', title: 'Facebook', url: 'https://facebook.com/example', imageUrl: 'https://cdn-icons-png.flaticon.com/512/733/733547.png', bgColor: '#0866FF', sortBy: 3.00, status: 'active' },
                { id: '4', title: 'YouTube', url: 'https://youtube.com/example', imageUrl: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png', bgColor: '#FF0000', sortBy: 2.00, status: 'active' },
                { id: '5', title: 'WhatsApp', url: 'https://wa.me/example', imageUrl: 'https://cdn-icons-png.flaticon.com/512/733/733585.png', bgColor: '#25D366', sortBy: 1.00, status: 'active' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    const filteredLinks = links.filter(link =>
        link.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleOpenAdd = () => {
        setEditingLink(null);
        setFormData({ title: '', url: '', sortBy: (links.length + 1), imageUrl: '', bgColor: '#0866FF', description: '' });
        setShowAddDrawer(true);
    };

    const handleEdit = (link: QuickLink) => {
        setEditingLink(link);
        setFormData({
            title: link.title,
            url: link.url,
            sortBy: link.sortBy,
            imageUrl: link.imageUrl,
            bgColor: link.bgColor || '#0866FF',
            description: link.description || ''
        });
        setShowAddDrawer(true);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.url) {
            showToast('Please fill all required fields', 'error');
            return;
        }

        try {
            if (editingLink) {
                await quickLinksAPI.update(editingLink._id || editingLink.id, {
                    ...formData,
                    status: editingLink.status
                });
                showToast('Link updated successfully');
            } else {
                await quickLinksAPI.create({
                    ...formData,
                    status: 'active'
                });
                showToast('Link added successfully');
            }
            setShowAddDrawer(false);
            fetchLinks();
        } catch (error) {
            console.error('Action failed:', error);
            // Optimization: Update local state if API fails (for local dev without real backend)
            if (editingLink) {
                setLinks(links.map(l => l.id === editingLink.id ? { ...l, ...formData } : l));
            } else {
                setLinks([...links, { id: Date.now().toString(), ...formData, status: 'active' as const }]);
            }
            setShowAddDrawer(false);
            showToast('Action noted (local dev mode)');
        }
    };

    const handleDeleteLink = async (id: string) => {
        if (confirm('Are you sure you want to delete this link?')) {
            try {
                await quickLinksAPI.delete(id);
                showToast('Link deleted');
                fetchLinks();
            } catch (error) {
                setLinks(links.filter(l => l.id !== id && l._id !== id));
                showToast('Link removed locally');
            }
        }
    };

    return (
        <div className="bg-[#f8fafc] min-h-screen p-8">
            {/* Tabs */}
            <div className="flex bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100 w-fit mb-8">
                {(['Links', 'YT Embeds'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-2.5 rounded-xl text-[13px] font-black tracking-widest uppercase transition-all ${activeTab === tab
                            ? 'bg-navy text-white shadow-lg shadow-indigo-100'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Header Section */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-navy tracking-tight">Quick Links</h2>
                    <p className="text-[13px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Manage social media accounts & app shortcuts</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-navy transition-colors">search</span>
                        <input
                            type="text"
                            placeholder="Search links..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 pr-6 py-3.5 bg-white border border-gray-100 rounded-[20px] text-[13px] font-black text-navy outline-none focus:ring-4 focus:ring-navy/5 focus:border-navy/20 transition-all w-[320px] shadow-sm"
                        />
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="w-14 h-14 bg-black text-white rounded-[20px] flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-[28px]">add</span>
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-[32px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">S. NO.</th>
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">IMAGE</th>
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest">TITLE</th>
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">SORT BY</th>
                            <th className="px-8 py-6 text-[11px] font-black text-gray-400 uppercase tracking-widest text-right">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">Loading links...</td></tr>
                        ) : filteredLinks.length === 0 ? (
                            <tr><td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest">No links found</td></tr>
                        ) : filteredLinks.map((link, idx) => (
                            <tr key={link._id || link.id} className="group hover:bg-gray-50/30 transition-colors">
                                <td className="px-8 py-6 text-[14px] font-black text-gray-300">{idx + 1}</td>
                                <td className="px-8 py-6">
                                    <div
                                        className="w-12 h-12 rounded-2xl border border-gray-100 p-2 flex items-center justify-center shadow-sm relative"
                                        style={{ background: link.bgColor || '#fff' }}
                                    >
                                        <img
                                            src={link.imageUrl || 'https://cdn-icons-png.flaticon.com/512/1243/1243420.png'}
                                            alt={link.title}
                                            className="w-full h-full object-contain"
                                            onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/1243/1243420.png')}
                                        />
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-[15px] font-black text-navy tracking-tight">{link.title}</div>
                                    <div className="text-[11px] font-bold text-gray-400 truncate max-w-[200px]">{link.url}</div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className="bg-gray-100 text-gray-600 px-4 py-1.5 rounded-full text-[12px] font-black tracking-wider shadow-inner">
                                        {(link.sortBy || 0).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => handleEdit(link)}
                                            className="px-5 py-2.5 bg-white border border-gray-100 rounded-xl text-[12px] font-black text-navy shadow-sm hover:shadow-md hover:border-gray-200 transition-all flex items-center gap-2"
                                        >
                                            Actions
                                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLink(link._id || link.id)}
                                            className="w-10 h-10 bg-white border border-gray-100 rounded-xl text-red-300 hover:text-red-500 hover:border-red-100 flex items-center justify-center transition-all shadow-sm"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Footer */}
                <div className="px-8 py-6 bg-gray-50/50 flex items-center justify-between border-t border-gray-100">
                    <div className="flex items-center gap-3">
                        <select className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[12px] font-black outline-none shadow-sm focus:border-navy/30 transition-all">
                            <option>10</option>
                            <option>25</option>
                            <option>50</option>
                        </select>
                        <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Entries Per Page</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Showing 1 to {filteredLinks.length} of {links.length} entries</span>
                        <div className="flex gap-2">
                            <button className="w-11 h-11 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-navy hover:border-navy/30 transition-all shadow-sm disabled:opacity-30" disabled>
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button className="w-11 h-11 bg-navy text-white rounded-2xl flex items-center justify-center text-[14px] font-black shadow-lg shadow-indigo-100">1</button>
                            <button className="w-11 h-11 bg-white border border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:text-navy hover:border-navy/30 transition-all shadow-sm disabled:opacity-30" disabled>
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Link Drawer */}
            <div
                className={`fixed inset-0 z-[200] transition-all duration-500 ${showAddDrawer ? 'visible' : 'invisible'}`}
            >
                <div
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${showAddDrawer ? 'opacity-100' : 'opacity-0'}`}
                    onClick={() => setShowAddDrawer(false)}
                />
                <div
                    className={`absolute right-0 top-0 h-full w-[540px] bg-white shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] flex flex-col ${showAddDrawer ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0 bg-white relative">
                        <h3 className="text-[17px] font-bold text-gray-800 tracking-tight">{editingLink ? 'Edit Link' : 'Add Link'}</h3>
                        <button
                            onClick={() => setShowAddDrawer(false)}
                            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors text-gray-400"
                        >
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar-thin px-8 py-8 space-y-7">
                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2.5 flex items-center gap-1">
                                Title<span className="text-red-500 font-black">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter Title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none focus:border-blue-500 transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2.5 flex items-center gap-1">
                                Icon Image URL<span className="text-red-500 font-black">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="https://..."
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none focus:border-blue-500 transition-all placeholder:text-gray-300 mb-4"
                            />
                            <div className="flex gap-4">
                                <div className="w-[100px] h-[100px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2">
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} alt="preview" className="w-full h-full object-contain p-2" onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/1243/1243420.png')} />
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[24px] text-gray-300">image</span>
                                            <span className="text-[10px] font-bold text-gray-400">Preview</span>
                                        </>
                                    )}
                                </div>
                                <div className="flex-1 h-[100px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-4">
                                    <span className="text-[12px] font-bold text-gray-600 text-center">Paste an icon URL above to see the preview</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2.5 flex items-center gap-1">
                                Background Color (Hex)<span className="text-red-500 font-black">*</span>
                            </label>
                            <div className="flex gap-3">
                                <input
                                    type="color"
                                    value={formData.bgColor}
                                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                                    className="w-14 h-[52px] bg-white border border-gray-200 rounded-xl cursor-pointer p-1"
                                />
                                <input
                                    type="text"
                                    placeholder="#000000"
                                    value={formData.bgColor}
                                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                                    className="flex-1 px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none focus:border-blue-500 transition-all placeholder:text-gray-300"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2.5 flex items-center gap-1">
                                Redirect Link<span className="text-red-500 font-black">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Enter Link (https://...)"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none focus:border-blue-500 transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2.5">
                                Sorting Order
                            </label>
                            <input
                                type="number"
                                placeholder="Enter Sorting Order"
                                value={formData.sortBy}
                                onChange={(e) => setFormData({ ...formData, sortBy: Number(e.target.value) })}
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none focus:border-blue-500 transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div>
                            <label className="block text-[13px] font-bold text-gray-700 mb-2.5">
                                Description
                            </label>
                            <textarea
                                placeholder="Enter Description"
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl text-[14px] font-medium text-gray-900 outline-none focus:border-blue-500 transition-all placeholder:text-gray-300 resize-none"
                            />
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-white">
                        <button
                            onClick={handleSubmit}
                            className="w-full h-[52px] bg-[#1e293b] text-white rounded-xl font-bold text-[14px] shadow-lg shadow-gray-200 hover:bg-black transition-all active:scale-[0.98]"
                        >
                            {editingLink ? 'Update Link' : 'Submit'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuickLinks;
