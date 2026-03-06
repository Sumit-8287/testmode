import React, { useState, useEffect } from 'react';
import { packagesAPI, coursesAPI, testSeriesAPI } from '../../src/services/apiClient';
import AddCourse from './AddCourse';
import LiveSessions from './LiveSessions';
import ForumManager from './ForumManager';
import ContentManager from './ContentManager';
import {
  RightSideDrawer,
  DrawerBody,
  DrawerHeader,
  DrawerFooter
} from './DrawerSystem';
import {
  OMRTestDrawer,
  TestDrawer,
  QuizDrawer,
  UploadDrawer,
  LinkDrawer,
  ImportContentDrawer,
  VideoDrawer,
  LiveStreamDrawer,
  WebinarDrawer
} from './FeatureDrawers';
import AddFolderDrawer from './AddFolderDrawer';

interface Package {
  id: string;
  _id?: string;
  name: string;
  description: string;
  courses: string[];
  price: number;
  status: 'active' | 'inactive';
}

interface CourseItem {
  id: string;
  _id?: string;
  name?: string;
  title?: string;
  category?: string;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
  onCourseSelect: (course: any) => void;
}

/**
 * --- PREMIUM UI COMPONENTS FOR BULK ACTIONS ---
 */

const TableViewSwitcher: React.FC<{ viewMode: 'list' | 'grid'; onViewChange: (mode: 'list' | 'grid') => void }> = ({ viewMode, onViewChange }) => {
  return (
    <div className="px-6 mb-6">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 opacity-70">Table View</p>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onViewChange('list')}
          className={`w-[44px] h-[44px] transition-all duration-300 flex items-center justify-center rounded-xl border ${viewMode === 'list'
            ? 'bg-gray-100 text-gray-900 border-gray-200 shadow-sm'
            : 'bg-white text-gray-300 border-gray-100 hover:text-gray-500 hover:border-gray-200'}`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: viewMode === 'list' ? "'FILL' 1" : "''" }}>list</span>
        </button>
        <button
          onClick={() => onViewChange('grid')}
          className={`w-[44px] h-[44px] transition-all duration-300 flex items-center justify-center rounded-xl border ${viewMode === 'grid'
            ? 'bg-gray-100 text-gray-900 border-gray-200 shadow-sm'
            : 'bg-white text-gray-300 border-gray-100 hover:text-gray-500 hover:border-gray-200'}`}
        >
          <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: viewMode === 'grid' ? "'FILL' 1" : "''" }}>grid_view</span>
        </button>
      </div>
    </div>
  );
};

const BulkActionItem: React.FC<{ icon: string; label: string; onClick: () => void }> = ({ icon, label, onClick }) => {
  return (
    <button
      className="w-full flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50/80 transition-all border-l-4 border-transparent hover:border-blue-500 group text-left"
      onClick={onClick}
    >
      <div className="w-[38px] h-[38px] bg-blue-50/40 rounded-xl flex items-center justify-center group-hover:bg-blue-100/60 transition-colors shrink-0">
        <span className="material-symbols-outlined text-[20px] text-blue-500/80 group-hover:text-blue-600 transition-colors">
          {icon}
        </span>
      </div>
      <span className="text-[14px] font-bold text-gray-600 group-hover:text-gray-900 tracking-tight transition-colors">
        {label}
      </span>
    </button>
  );
};

const BigActionTile: React.FC<{ icon: string; label: string; desc: string; onClick: () => void; color?: string }> = ({ icon, label, desc, onClick, color = 'bg-blue-50 text-blue-500' }) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center text-center p-6 rounded-[2.5rem] bg-white border border-gray-100 hover:border-blue-100 hover:bg-blue-50/10 hover:shadow-2xl hover:shadow-blue-100/20 transition-all group active:scale-95 h-full"
  >
    <div className={`w-16 h-16 ${color} rounded-3xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-sm`}>
      <span className="material-symbols-outlined text-[32px]">{icon}</span>
    </div>
    <h4 className="text-[14px] font-black text-gray-900 uppercase tracking-tight mb-2 leading-none">{label}</h4>
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.1em] leading-relaxed max-w-[120px]">{desc}</p>
  </button>
);

const Packages: React.FC<Props> = ({ showToast, onCourseSelect }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', courses: '', price: '', status: 'active' });
  const [availableCourses, setAvailableCourses] = useState<CourseItem[]>([]);
  const [activeTab, setActiveTab] = useState('Products');
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const moreDropdownRef = React.useRef<HTMLDivElement>(null);

  // Drawer States
  const [showOverviewDrawer, setShowOverviewDrawer] = useState(false);
  const [showEditDrawer, setShowEditDrawer] = useState(false);
  const [showFolderDrawer, setShowFolderDrawer] = useState(false);
  const [showLinkDrawer, setShowLinkDrawer] = useState(false);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [uploadType, setUploadType] = useState<any>({ title: '', subtitle: '', accept: '*' });
  const [showTestDrawer, setShowTestDrawer] = useState(false);
  const [showOMRDrawer, setShowOMRDrawer] = useState(false);
  const [showQuizDrawer, setShowQuizDrawer] = useState(false);
  const [showWebinarDrawer, setShowWebinarDrawer] = useState(false);
  const [showVideoDrawer, setShowVideoDrawer] = useState(false);
  const [showLiveStreamDrawer, setShowLiveStreamDrawer] = useState(false);
  const [isBulkDropdownOpen, setIsBulkDropdownOpen] = useState(false);
  const [showProductActionDrawer, setShowProductActionDrawer] = useState(false);
  const [selectedPkgForAction, setSelectedPkgForAction] = useState<Package | null>(null);
  const [showConfirmDrawer, setShowConfirmDrawer] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ title: string; desc: string; onConfirm: () => void } | null>(null);

  // Context State
  const [selectedProductContext, setSelectedProductContext] = useState<any>(null);
  const [testSeriesList, setTestSeriesList] = useState<any[]>([]);
  const [standardTests, setStandardTests] = useState<any[]>([]);
  const [omrTests, setOMRTests] = useState<any[]>([]);
  const [isSeriesLoading, setIsSeriesLoading] = useState(false);
  const [isTestsLoading, setIsTestsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const filterDropdownRef = React.useRef<HTMLDivElement>(null);
  const bulkDropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(event.target as Node)) {
        setIsBulkDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTestSeriesList = async () => {
    setIsSeriesLoading(true);
    try {
      const data = await testSeriesAPI.getAll();
      const list = Array.isArray(data) ? data : [];
      setTestSeriesList(list.length > 0 ? list : [
        { id: '1', seriesName: 'Concepts Test Series' },
        { id: '2', seriesName: 'Full Length Mock Tests' }
      ]);
    } catch (error) {
      console.error('Failed to load test series:', error);
      setTestSeriesList([
        { id: '1', seriesName: 'Concepts Test Series' },
        { id: '2', seriesName: 'Full Length Mock Tests' }
      ]);
    } finally {
      setIsSeriesLoading(false);
    }
  };

  const fetchTestsBySeries = async (seriesId: string, type: 'standard' | 'omr' = 'standard') => {
    setIsTestsLoading(true);
    try {
      const res = await fetch(`/api/tests?seriesId=${seriesId}&testType=${type}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      if (type === 'omr') {
        setOMRTests(list.length > 0 ? list : [
          { _id: `omr1_${seriesId}`, name: 'Mock OMR Test 1' },
          { _id: `omr2_${seriesId}`, name: 'Mock OMR Test 2' }
        ]);
      } else {
        setStandardTests(list.length > 0 ? list : [
          { _id: `std1_${seriesId}`, name: 'Mock Regular Test 1' },
          { _id: `std2_${seriesId}`, name: 'Mock Regular Test 2' }
        ]);
      }
    } catch (error) {
      const mock = [
        { _id: `mock1_${seriesId}`, name: `Mock ${type} Test 1` },
        { _id: `mock2_${seriesId}`, name: `Mock ${type} Test 2` }
      ];
      if (type === 'omr') setOMRTests(mock);
      else setStandardTests(mock);
    } finally {
      setIsTestsLoading(false);
    }
  };

  useEffect(() => {
    if (showTestDrawer || showOMRDrawer) {
      fetchTestSeriesList();
    }
  }, [showTestDrawer, showOMRDrawer]);

  const normalizeData = (data: any[]) => {
    return data.map(item => ({
      ...item,
      id: item.id || item._id,
      _id: item._id || item.id
    }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pkgs, courses] = await Promise.all([
        packagesAPI.getAll(),
        coursesAPI.getAll()
      ]);
      setPackages(Array.isArray(pkgs) ? normalizeData(pkgs) : []);
      setAvailableCourses(Array.isArray(courses) ? normalizeData(courses) : []);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = packages.filter(pkg => {
    const matchesSearch = pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pkg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = async () => {
    try {
      const packageData = {
        id: editingPackage?.id || `pkg_${Date.now()}`,
        name: formData.name,
        description: formData.description,
        courses: formData.courses.split(',').map(c => c.trim()).filter(c => c),
        price: parseFloat(formData.price) || 0,
        status: formData.status as 'active' | 'inactive'
      };

      if (editingPackage) {
        await packagesAPI.update(editingPackage.id, packageData);
        showToast('Package updated successfully!');
      } else {
        await packagesAPI.create(packageData);
        showToast('Package created successfully!');
      }

      setShowEditDrawer(false);
      setEditingPackage(null);
      setFormData({ name: '', description: '', courses: '', price: '', status: 'active' });
      loadData();
    } catch (error) {
      showToast('Failed to save package', 'error');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmAction({
      title: 'Delete Product',
      desc: 'Are you sure you want to delete this product? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await packagesAPI.delete(id);
          showToast('Package deleted successfully!');
          loadData();
        } catch (error) {
          showToast('Failed to delete package', 'error');
        }
        setShowConfirmDrawer(false);
      }
    });
    setShowConfirmDrawer(true);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreDropdownRef.current && !moreDropdownRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
      const target = event.target as HTMLElement;
      if (!target.closest('.row-action-menu-container')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openEditDrawer = (pkg: Package) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description,
      courses: pkg.courses.join(', '),
      price: pkg.price.toString(),
      status: pkg.status
    });
    setShowEditDrawer(true);
    setOpenActionMenuId(null);
  };

  const handleToggleStatus = async (pkg: Package) => {
    try {
      const newStatus = pkg.status === 'active' ? 'inactive' : 'active';
      await packagesAPI.update(pkg.id, { ...pkg, status: newStatus });
      showToast(`Product ${newStatus === 'active' ? 'enabled' : 'disabled'} successfully`, 'success');
      loadData();
    } catch (error) {
      showToast('Failed to toggle status', 'error');
    }
  };

  const handleDuplicate = (pkg: Package) => {
    setConfirmAction({
      title: 'Duplicate Product',
      desc: `Are you sure you want to create a copy of "${pkg.name}"?`,
      onConfirm: async () => {
        try {
          const duplicateData = {
            ...pkg,
            id: `pkg_${Date.now()}`,
            name: `${pkg.name} (Copy)`
          };
          delete (duplicateData as any)._id; // Let API generate new _id
          await packagesAPI.create(duplicateData);
          showToast('Product duplicated successfully', 'success');
          loadData();
        } catch (error) {
          showToast('Failed to duplicate product', 'error');
        }
        setShowConfirmDrawer(false);
      }
    });
    setShowConfirmDrawer(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    );
  }

  if (isAddingCourse) {
    return <AddCourse onClose={() => setIsAddingCourse(false)} />;
  }

  return (
    <div className="space-y-4 animate-fade-in pb-10">
      {/* Navigation Tabs Container */}
      <div className="bg-white px-8 py-1 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-10 overflow-x-auto scrollbar-hide">
        {['Products', 'Live & Upcoming', 'Forum', 'Content'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 text-[13px] font-bold transition-all relative shrink-0 ${activeTab === tab
              ? 'text-gray-900 border-b-2 border-gray-900'
              : 'text-gray-400 hover:text-gray-600'
              }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Live & Upcoming' ? (
        <LiveSessions showHeader={false} />
      ) : activeTab === 'Forum' ? (
        <ForumManager />
      ) : activeTab === 'Content' ? (
        <ContentManager />
      ) : (
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          {/* Header Section */}
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50 bg-white">
            <h3 className="text-[20px] font-bold text-gray-900 tracking-tight">Products</h3>
            <div className="flex items-center gap-3">
              <div className="relative group flex-1 md:flex-none">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] group-focus-within:text-navy transition-colors">search</span>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-[320px] pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all shadow-sm placeholder:text-gray-400"
                />
              </div>

              <div className="relative" ref={filterDropdownRef}>
                <button
                  onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                  className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${isFilterDropdownOpen || statusFilter !== 'all' ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  {statusFilter === 'all' ? 'Advanced Filters' : statusFilter === 'active' ? 'Published' : 'Draft'}
                  {statusFilter !== 'all' && (
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  )}
                </button>

                {isFilterDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[200] p-5 animate-in fade-in zoom-in duration-200 origin-top-right">
                    <div className="flex justify-between items-center mb-5">
                      <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Filter Products</h4>
                      <button
                        onClick={() => { setStatusFilter('all'); setIsFilterDropdownOpen(false); }}
                        className="text-[10px] font-bold text-blue-600 hover:underline"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Publish Status</label>
                      <div className="flex flex-col gap-1">
                        {[
                          { id: 'all', label: 'All Products', icon: 'inventory_2' },
                          { id: 'active', label: 'Published', icon: 'check_circle', color: 'text-green-500' },
                          { id: 'inactive', label: 'Drafts', icon: 'pending', color: 'text-amber-500' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => { setStatusFilter(item.id); setIsFilterDropdownOpen(false); }}
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
              <button
                onClick={() => setIsAddingCourse(true)}
                className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-all shadow-md active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[24px]">add</span>
              </button>
              <div className="relative" ref={bulkDropdownRef}>
                <button
                  onClick={() => setIsBulkDropdownOpen(!isBulkDropdownOpen)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-600 border border-transparent hover:border-gray-200 transition-all active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">more_vert</span>
                </button>

                {isBulkDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-[240px] bg-white border border-gray-100 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.12)] z-[200] p-5 animate-in fade-in zoom-in duration-200 origin-top-right max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="mb-6">
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] mb-4 ml-1">Table View</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setViewMode('list'); setIsBulkDropdownOpen(false); }}
                          className={`flex-1 h-[48px] flex items-center justify-center rounded-[14px] transition-all ${viewMode === 'list' ? 'bg-[#1a237e] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                          <span className="material-symbols-outlined text-[22px]">list</span>
                        </button>
                        <button
                          onClick={() => { setViewMode('grid'); setIsBulkDropdownOpen(false); }}
                          className={`flex-1 h-[48px] flex items-center justify-center rounded-[14px] transition-all ${viewMode === 'grid' ? 'bg-[#1a237e] text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
                        >
                          <span className="material-symbols-outlined text-[22px]">grid_view</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.1em] mb-4 ml-1">Bulk Actions</h4>
                      <div className="flex flex-col gap-0.5">
                        {[
                          { id: 'folder', icon: 'create_new_folder', label: 'Add Folder' },
                          { id: 'link', icon: 'link', label: 'Add Link' },
                          { id: 'video', icon: 'videocam', label: 'Add Video' },
                          { id: 'pdf', icon: 'picture_as_pdf', label: 'Add PDF' },
                          { id: 'test', icon: 'quiz', label: 'Add Test' },
                          { id: 'quiz', icon: 'help_outline', label: 'Add Quiz' },
                          { id: 'image', icon: 'image', label: 'Add Image' },
                          { id: 'live_stream', icon: 'sensors', label: 'Add Live Stream' },
                          { id: 'youtube_zoom', icon: 'video_camera_front', label: 'Add YouTube/Zoom Video' },
                          { id: 'webinar_gg', icon: 'podcasts', label: 'Add Webinar.gg Live' },
                          { id: 'document', icon: 'description', label: 'Add Document' }
                        ].map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setIsBulkDropdownOpen(false);
                              switch (item.id) {
                                case 'folder': setShowFolderDrawer(true); break;
                                case 'link': setShowLinkDrawer(true); break;
                                case 'video':
                                  setUploadType({ title: 'Add Video File(s)', subtitle: 'Upload Video', accept: 'video/*' });
                                  setShowUploadDrawer(true);
                                  break;
                                case 'pdf':
                                  setUploadType({ title: 'Add PDF File(s)', subtitle: 'Upload PDF', accept: '.pdf,application/pdf' });
                                  setShowUploadDrawer(true);
                                  break;
                                case 'test': setShowTestDrawer(true); break;
                                case 'quiz': setShowQuizDrawer(true); break;
                                case 'image':
                                  setUploadType({ title: 'Add Image File(s)', subtitle: 'Upload Image', accept: 'image/*' });
                                  setShowUploadDrawer(true);
                                  break;
                                case 'live_stream': setShowLiveStreamDrawer(true); break;
                                case 'youtube_zoom': setShowVideoDrawer(true); break;
                                case 'webinar_gg': setShowWebinarDrawer(true); break;
                                case 'document':
                                  setUploadType({ title: 'Add Documents', subtitle: 'Upload Doc/PDF', accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt' });
                                  setShowUploadDrawer(true);
                                  break;
                              }
                            }}
                            className="flex items-center gap-4 w-full px-4 py-3.5 rounded-2xl text-[14px] font-bold text-[#37474f] hover:bg-[#f0f4ff] hover:text-[#1a237e] transition-all group"
                          >
                            <span className="material-symbols-outlined text-[20px] text-[#4285f4] opacity-70 group-hover:opacity-100">{item.icon}</span>
                            <span className="text-left leading-tight">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {viewMode === 'list' ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/10 border-b border-gray-100">
                    <th className="pl-8 pr-4 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        S. No. <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        Product Name <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        Category <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">Price</th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        Sort By <span className="material-symbols-outlined text-[14px]">unfold_more</span>
                      </div>
                    </th>
                    <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] whitespace-nowrap text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPackages.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-gray-300 text-[32px]">inventory_2</span>
                          </div>
                          <p className="text-gray-400 text-[14px] font-bold tracking-tight uppercase">No products found matching your criteria</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredPackages.map((pkg, idx) => (
                      <tr key={pkg.id} onClick={() => onCourseSelect(pkg)} className="hover:bg-blue-50/5 transition-colors group border-b border-gray-50 last:border-0 cursor-pointer">
                        <td className="pl-8 pr-4 py-8 text-[13px] font-bold text-gray-400">{packages.length - idx}</td>
                        <td className="px-6 py-8">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex flex-col">
                              <span className="text-[14px] font-bold text-gray-900 group-hover:text-black transition-colors uppercase tracking-tight">{pkg.name}</span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${pkg.status === 'active' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                  {pkg.status === 'active' ? 'Published' : 'Draft'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex flex-col max-w-xs gap-1">
                            {pkg.courses.map((course, i) => (
                              <span key={i} className="text-[13px] font-semibold text-gray-500/80 leading-normal">
                                {course}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-8">
                          <span className={`text-[14px] font-bold ${!pkg.price ? 'text-gray-300' : 'text-gray-900'}`}>
                            {!pkg.price ? 'Inactive' : `₹${pkg.price}`}
                          </span>
                        </td>
                        <td className="px-6 py-8 text-[13px] font-bold text-gray-400/60">
                          -{(152 - idx * 10).toFixed(2)}
                        </td>
                        <td className="px-6 py-8">
                          <div className="flex items-center gap-3 row-action-menu-container">
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPkgForAction(pkg);
                                  setShowProductActionDrawer(true);
                                }}
                                className={`px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-[12px] font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center gap-2 group/btn shadow-sm`}
                              >
                                Actions
                                <span className="material-symbols-outlined text-[18px] text-gray-400 group-hover/btn:text-gray-600 transition-transform duration-200">expand_more</span>
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8 bg-gray-50/30">
              {filteredPackages.length === 0 ? (
                <div className="col-span-full py-20 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="material-icons-outlined text-3xl text-slate-200">inventory_2</span>
                  </div>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No products found matching your criteria</p>
                </div>
              ) : (
                filteredPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => onCourseSelect(pkg)}
                    className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 cursor-pointer group flex flex-col"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-blue-500">inventory_2</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${pkg.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                          {pkg.status === 'active' ? 'Published' : 'Draft'}
                        </span>
                      </div>
                    </div>
                    <h4 className="text-[16px] font-bold text-gray-900 mb-2 uppercase tracking-tight">{pkg.name}</h4>
                    <p className="text-[13px] text-gray-500 line-clamp-2 mb-4">{pkg.description || 'No description provided'}</p>
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                      <span className="text-[15px] font-black text-gray-900">₹{pkg.price}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPkgForAction(pkg);
                          setShowProductActionDrawer(true);
                        }}
                        className="px-4 py-2 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 border border-transparent hover:border-gray-200 flex items-center gap-2"
                      >
                        Action
                        <span className="material-symbols-outlined text-[16px]">expand_more</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div >
      )}

      {/* --- EDIT PRODUCT DRAWER --- */}
      <RightSideDrawer isOpen={showEditDrawer} onClose={() => { setShowEditDrawer(false); setEditingPackage(null); }}>
        <DrawerHeader
          title={editingPackage ? 'Refine Product' : 'Create New Product'}
          onClose={() => { setShowEditDrawer(false); setEditingPackage(null); }}
        />
        <DrawerBody className="pb-10">
          <div className="space-y-6 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Product Title</label>
              <input
                type="text"
                placeholder="Enter product name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-50 transition-all placeholder:text-gray-300 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Product Description</label>
              <textarea
                placeholder="Tell students what's inside..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none resize-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-50 transition-all placeholder:text-gray-300 shadow-sm"
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Connect Existing Courses</label>
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-2 max-h-52 overflow-y-auto custom-scrollbar shadow-inner">
                {availableCourses.length === 0 ? (
                  <p className="text-[10px] text-gray-400 p-4 italic text-center">No courses found in database</p>
                ) : (
                  <div className="grid grid-cols-1 gap-1">
                    {availableCourses.map((course) => {
                      const courseName = course.name || course.title;
                      const isSelected = formData.courses.split(',').map(c => c.trim()).includes(courseName);
                      return (
                        <button
                          key={course.id || course._id}
                          onClick={() => {
                            const current = formData.courses.split(',').map(c => c.trim()).filter(c => c);
                            const next = isSelected
                              ? current.filter(c => c !== courseName)
                              : [...current, courseName];
                            setFormData({ ...formData, courses: next.join(', ') });
                          }}
                          className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${isSelected ? 'bg-white text-black ring-1 ring-gray-100 shadow-sm' : 'hover:bg-white text-gray-500'}`}
                        >
                          <span className={`material-symbols-outlined text-[20px] ${isSelected ? 'text-blue-500' : 'text-gray-300'}`}>
                            {isSelected ? 'check_circle' : 'radio_button_unchecked'}
                          </span>
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold leading-none">{courseName}</span>
                            <span className="text-[10px] opacity-60 mt-1 uppercase tracking-tight">{course.category || 'General'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Market Price (₹)</label>
                <input
                  type="number"
                  placeholder="999"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-gray-200 focus:ring-4 focus:ring-gray-50 transition-all placeholder:text-gray-300 shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Visibility</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                  {['active', 'inactive'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFormData({ ...formData, status: s as any })}
                      className={`py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${formData.status === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      {s === 'active' ? 'Public' : 'Draft'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 flex gap-4">
              <button
                onClick={() => { setShowEditDrawer(false); setEditingPackage(null); }}
                className="flex-1 py-4 bg-white border border-gray-100 text-gray-400 font-black rounded-full uppercase tracking-[0.2em] text-[10px] hover:bg-gray-50 transition-all active:scale-95"
              >
                Discard
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-4 bg-gray-900 text-white font-black rounded-full uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-gray-200/50 hover:bg-black transition-all active:scale-95"
              >
                {editingPackage ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </div>
        </DrawerBody>
      </RightSideDrawer>

      {/* --- COURSE OVERVIEW MODAL --- */}
      {/* --- COURSE OVERVIEW DRAWER --- */}
      <RightSideDrawer isOpen={showOverviewDrawer} onClose={() => { setShowOverviewDrawer(false); setEditingPackage(null); }}>
        {editingPackage && (
          <>
            <DrawerHeader title="Product Overview" onClose={() => { setShowOverviewDrawer(false); setEditingPackage(null); }} />
            <DrawerBody className="pb-10">
              <div className="space-y-8 py-2">
                {/* Product Banner Style */}
                <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl shadow-slate-200/50">
                  <div className="relative z-10">
                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/20">
                      <span className="material-symbols-outlined text-white text-[28px]">inventory_2</span>
                    </div>
                    <h2 className="text-[22px] font-black text-white uppercase tracking-tight leading-tight">{editingPackage.name}</h2>
                    <span className={`mt-3 inline-block text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${editingPackage.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-gray-500/20 text-gray-300 border-gray-500/30'}`}>
                      {editingPackage.status === 'active' ? 'Published' : 'Draft'}
                    </span>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50/80 border border-gray-100 rounded-[1.5rem] p-6 transition-all hover:bg-white hover:border-blue-100 hover:shadow-md group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-blue-500 transition-colors">Current Price</p>
                    <p className="text-[22px] font-black text-gray-900">{editingPackage.price ? `₹${editingPackage.price}` : 'Free'}</p>
                  </div>
                  <div className="bg-gray-50/80 border border-gray-100 rounded-[1.5rem] p-6 transition-all hover:bg-white hover:border-amber-100 hover:shadow-md group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-amber-500 transition-colors">Courses Linked</p>
                    <p className="text-[22px] font-black text-gray-900">{editingPackage.courses?.length || 0}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50/50 border border-gray-100 rounded-[1.5rem] p-6">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Product Description</p>
                  <p className="text-[14px] text-gray-600 font-medium leading-relaxed italic line-clamp-6">
                    "{editingPackage.description || 'No description provided for this digital product.'}"
                  </p>
                </div>

                {/* Linked Courses */}
                {editingPackage.courses?.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Included Courses</p>
                    <div className="flex flex-wrap gap-2">
                      {editingPackage.courses.map((c, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 text-gray-700 text-[12px] font-bold rounded-xl shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-all cursor-default">
                          <span className="material-symbols-outlined text-[18px] text-indigo-400">check_circle</span>
                          {c}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons Integrated in Body (Not Sticky) */}
                <div className="flex gap-4 w-full pt-8">
                  <button
                    onClick={() => { setShowOverviewDrawer(false); openEditDrawer(editingPackage); }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black shadow-xl shadow-gray-200/50 transition-all active:scale-95 group"
                  >
                    <span className="material-symbols-outlined text-[16px] group-hover:rotate-12 transition-transform">edit</span>
                    Edit Product
                  </button>
                  <button
                    onClick={() => { setShowOverviewDrawer(false); setEditingPackage(null); onCourseSelect(editingPackage); }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:bg-black shadow-xl shadow-gray-200/50 transition-all active:scale-95 group"
                  >
                    <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">add_circle</span>
                    Manage Content
                  </button>
                </div>
              </div>
            </DrawerBody>
          </>
        )}
      </RightSideDrawer>

      {/* --- DRAWERS INTEGRATION --- */}

      <AddFolderDrawer
        isOpen={showFolderDrawer}
        onClose={() => setShowFolderDrawer(false)}
        onUploadImage={async (file) => URL.createObjectURL(file)}
        onSubmit={(data) => {
          showToast('Folder created successfully', 'success');
          setShowFolderDrawer(false);
        }}
      />

      <LinkDrawer
        isOpen={showLinkDrawer}
        onClose={() => setShowLinkDrawer(false)}
        onSubmit={() => {
          showToast('Link added successfully', 'success');
          setShowLinkDrawer(false);
        }}
      />

      <UploadDrawer
        isOpen={showUploadDrawer}
        onClose={() => setShowUploadDrawer(false)}
        title={uploadType.title}
        subtitle={uploadType.subtitle}
        accept={uploadType.accept}
        onSubmit={() => {
          showToast('File uploaded successfully', 'success');
          setShowUploadDrawer(false);
        }}
      />

      <OMRTestDrawer
        isOpen={showOMRDrawer}
        onClose={() => setShowOMRDrawer(false)}
        testSeriesList={testSeriesList}
        isSeriesLoading={isSeriesLoading}
        onSeriesChange={(id) => fetchTestsBySeries(id, 'omr')}
        availableTests={omrTests}
        isTestsLoading={isTestsLoading}
        onSubmit={() => {
          showToast('OMR Tests added successfully', 'success');
          setShowOMRDrawer(false);
        }}
      />

      <TestDrawer
        isOpen={showTestDrawer}
        onClose={() => setShowTestDrawer(false)}
        testSeriesList={testSeriesList}
        isSeriesLoading={isSeriesLoading}
        onSeriesChange={(id) => fetchTestsBySeries(id, 'standard')}
        availableTests={standardTests}
        isTestsLoading={isTestsLoading}
        onSubmit={() => {
          showToast('Tests added successfully', 'success');
          setShowTestDrawer(false);
        }}
      />

      <QuizDrawer
        isOpen={showQuizDrawer}
        onClose={() => setShowQuizDrawer(false)}
        onSubmit={() => {
          showToast('Quiz added successfully', 'success');
          setShowQuizDrawer(false);
        }}
      />

      <VideoDrawer
        isOpen={showVideoDrawer}
        onClose={() => setShowVideoDrawer(false)}
        onSubmit={() => {
          showToast('Video added successfully', 'success');
          setShowVideoDrawer(false);
        }}
      />

      <LiveStreamDrawer
        isOpen={showLiveStreamDrawer}
        onClose={() => setShowLiveStreamDrawer(false)}
        onSubmit={() => {
          showToast('Live stream scheduled successfully', 'success');
          setShowLiveStreamDrawer(false);
        }}
      />

      <WebinarDrawer
        isOpen={showWebinarDrawer}
        onClose={() => setShowWebinarDrawer(false)}
        onSubmit={() => {
          showToast('Webinar connected successfully', 'success');
          setShowWebinarDrawer(false);
        }}
      />

      <RightSideDrawer isOpen={showConfirmDrawer} onClose={() => setShowConfirmDrawer(false)}>
        {confirmAction && (
          <div className="h-full flex flex-col">
            <DrawerHeader title={confirmAction.title} onClose={() => setShowConfirmDrawer(false)} />
            <DrawerBody>
              <div className="py-10 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <span className="material-symbols-outlined text-red-500 text-[40px]">
                    {confirmAction.title.includes('Delete') ? 'delete_forever' : 'content_copy'}
                  </span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3 tracking-tight">{confirmAction.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium px-4">{confirmAction.desc}</p>

                {/* Confirm Buttons Integrated in Body */}
                <div className="flex gap-4 w-full mt-10">
                  <button
                    onClick={() => setShowConfirmDrawer(false)}
                    className="flex-1 py-4 bg-white border border-gray-100 text-gray-400 font-black rounded-full uppercase tracking-[0.2em] text-[10px] hover:bg-gray-50 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction.onConfirm}
                    className={`flex-1 py-4 text-white font-black rounded-full uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all active:scale-95 ${confirmAction.title.includes('Delete') ? 'bg-red-500 hover:bg-red-600 shadow-red-200/50' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200/50'}`}
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </DrawerBody>
          </div>
        )}
      </RightSideDrawer>

      {/* --- BULK ACTION REMOVED - REPLACED WITH DROPDOWN --- */}

      {/* --- PRODUCT ACTION DRAWER --- */}
      <RightSideDrawer isOpen={showProductActionDrawer} onClose={() => setShowProductActionDrawer(false)}>
        {selectedPkgForAction && (
          <>
            <DrawerHeader title="Product Actions" onClose={() => setShowProductActionDrawer(false)} />
            <DrawerBody className="pb-10">
              <div className="space-y-8 py-2">
                {/* Mini Profile */}
                <div className="bg-gray-50 border border-gray-100 rounded-[2rem] p-6 flex items-center gap-5">
                  <div className="w-16 h-16 bg-white border border-gray-100 rounded-[1.5rem] flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-[32px] text-gray-400 uppercase tracking-tight">inventory_2</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-black text-gray-900 uppercase tracking-tight">{selectedPkgForAction.name}</h3>
                    <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">₹{selectedPkgForAction.price}</p>
                  </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <BigActionTile
                    icon="visibility"
                    label="Overview"
                    desc="Digital Preview"
                    color="bg-slate-100 text-slate-600"
                    onClick={() => { setShowProductActionDrawer(false); setEditingPackage(selectedPkgForAction); setShowOverviewDrawer(true); }}
                  />
                  <BigActionTile
                    icon="edit"
                    label="Edit"
                    desc="Update Details"
                    color="bg-blue-50 text-blue-500"
                    onClick={() => { setShowProductActionDrawer(false); openEditDrawer(selectedPkgForAction); }}
                  />
                  <BigActionTile
                    icon="add_circle"
                    label="Content"
                    desc="Manage Media"
                    color="bg-indigo-50 text-indigo-500"
                    onClick={() => { setShowProductActionDrawer(false); onCourseSelect(selectedPkgForAction); }}
                  />
                  <BigActionTile
                    icon="content_copy"
                    label="Duplicate"
                    desc="Clone Product"
                    color="bg-amber-50 text-amber-500"
                    onClick={() => { setShowProductActionDrawer(false); handleDuplicate(selectedPkgForAction); }}
                  />
                  <BigActionTile
                    icon="delete_forever"
                    label="Delete"
                    desc="Remove Items"
                    color="bg-red-50 text-red-500"
                    onClick={() => { setShowProductActionDrawer(false); handleDelete(selectedPkgForAction.id); }}
                  />
                </div>

                <div className="pt-8">
                  <button
                    onClick={() => setShowProductActionDrawer(false)}
                    className="w-full py-4 bg-gray-50 text-gray-400 font-black rounded-full uppercase tracking-[0.2em] text-[10px] hover:bg-gray-100 transition-all active:scale-95"
                  >
                    Close Menu
                  </button>
                </div>
              </div>
            </DrawerBody>
          </>
        )}
      </RightSideDrawer>

    </div >
  );
};

export default Packages;
