import React, { useState, useEffect } from 'react';
import { categoriesAPI, subcategoriesAPI } from '../../src/services/apiClient';
import FileUploadButton from '../shared/FileUploadButton';

interface Category {
  _id?: string;
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  description: string;
  tag: string;
  order: number;
  isActive: boolean;
  imageUrl?: string;
}

interface SubCategory {
  _id?: string;
  id: string;
  categoryId: string;
  title: string;
  parentPath: string;
  icon: string;
  color: string;
  description?: string;
  order: number;
  isActive: boolean;
  imageUrl?: string;
}

interface Props {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const gradientOptions = [
  'from-blue-600 to-indigo-700',
  'from-orange-500 to-red-600',
  'from-teal-500 to-emerald-600',
  'from-purple-500 to-violet-600',
  'from-pink-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
  'from-green-500 to-teal-600',
];

const colorOptions = [
  'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-orange-500',
  'bg-purple-500', 'bg-teal-500', 'bg-amber-500', 'bg-indigo-500',
  'bg-pink-500', 'bg-cyan-500',
];

const iconOptions = [
  'biotech', 'engineering', 'local_hospital', 'menu_book', 'school',
  'science', 'calculate', 'language', 'public', 'bolt', 'video_library',
  'cast_for_education', 'speed', 'quiz', 'medical_services', 'health_and_safety',
  'medication', 'local_pharmacy', 'auto_stories', 'translate', 'workspace_premium',
  'psychology', 'architecture', 'sports_esports', 'palette', 'music_note',
];

const Categories: React.FC<Props> = ({ showToast }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'categories' | 'subcategories'>('categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCatModal, setShowCatModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingSub, setEditingSub] = useState<SubCategory | null>(null);

  const [catForm, setCatForm] = useState<Partial<Category>>({
    id: '', title: '', subtitle: '', icon: 'school', gradient: gradientOptions[0],
    description: '', tag: '', order: 1, isActive: true, imageUrl: '',
  });

  const [subForm, setSubForm] = useState<Partial<SubCategory>>({
    id: '', categoryId: '', title: '', parentPath: '', icon: 'video_library',
    color: colorOptions[0], description: '', order: 1, isActive: true, imageUrl: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [cats, subs] = await Promise.all([
        categoriesAPI.getAll(),
        subcategoriesAPI.getAll(),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setSubcategories(Array.isArray(subs) ? subs : []);
      if (cats.length === 0) {
        await categoriesAPI.seed();
        const [seededCats, seededSubs] = await Promise.all([
          categoriesAPI.getAll(),
          subcategoriesAPI.getAll(),
        ]);
        setCategories(Array.isArray(seededCats) ? seededCats : []);
        setSubcategories(Array.isArray(seededSubs) ? seededSubs : []);
        showToast('Default categories loaded');
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCategory = async () => {
    try {
      if (!catForm.title || !catForm.id) {
        showToast('Title and ID are required', 'error');
        return;
      }
      if (editingCat) {
        await categoriesAPI.update(editingCat._id || editingCat.id, catForm);
        showToast('Category updated');
      } else {
        await categoriesAPI.create(catForm);
        showToast('Category created');
      }
      setShowCatModal(false);
      setEditingCat(null);
      loadData();
    } catch (error) {
      showToast('Failed to save category', 'error');
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`Delete "${cat.title}" and all its subcategories?`)) return;
    try {
      await categoriesAPI.delete(cat._id || cat.id);
      showToast('Category deleted');
      loadData();
    } catch (error) {
      showToast('Failed to delete category', 'error');
    }
  };

  const handleSaveSubcategory = async () => {
    try {
      if (!subForm.title || !subForm.categoryId) {
        showToast('Title and Category are required', 'error');
        return;
      }
      const dataToSave = {
        ...subForm,
        id: subForm.id || `${subForm.categoryId}_${subForm.title?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '')}`,
      };
      if (editingSub) {
        await subcategoriesAPI.update(editingSub._id || editingSub.id, dataToSave);
        showToast('Subcategory updated');
      } else {
        await subcategoriesAPI.create(dataToSave);
        showToast('Subcategory created');
      }
      setShowSubModal(false);
      setEditingSub(null);
      loadData();
    } catch (error) {
      showToast('Failed to save subcategory', 'error');
    }
  };

  const handleDeleteSubcategory = async (sub: SubCategory) => {
    if (!confirm(`Delete "${sub.title}"?`)) return;
    try {
      await subcategoriesAPI.delete(sub._id || sub.id);
      showToast('Subcategory deleted');
      loadData();
    } catch (error) {
      showToast('Failed to delete subcategory', 'error');
    }
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatForm({ ...cat });
    setShowCatModal(true);
  };

  const openAddCategory = () => {
    setEditingCat(null);
    setCatForm({ id: '', title: '', subtitle: '', icon: 'school', gradient: gradientOptions[0], description: '', tag: '', order: categories.length + 1, isActive: true, imageUrl: '' });
    setShowCatModal(true);
  };

  const openEditSubcategory = (sub: SubCategory) => {
    setEditingSub(sub);
    setSubForm({ ...sub });
    setShowSubModal(true);
  };

  const openAddSubcategory = () => {
    setEditingSub(null);
    setSubForm({ id: '', categoryId: selectedCategory || categories[0]?.id || '', title: '', parentPath: '', icon: 'video_library', color: colorOptions[0], description: '', order: filteredSubs.length + 1, isActive: true, imageUrl: '' });
    setShowSubModal(true);
  };

  const filteredCategories = categories.filter(cat =>
    cat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubs = subcategories.filter(s => {
    const matchesCategory = !selectedCategory || s.categoryId === selectedCategory;
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Categories Manager</h2>
          <p className="text-sm text-gray-500 mt-1">Manage course categories and subcategories stored in MongoDB</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
          >
            <span className="material-icons-outlined text-sm mr-1 align-middle">category</span>
            Categories ({filteredCategories.length})
          </button>
          <button
            onClick={() => setActiveTab('subcategories')}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'subcategories' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50 border'}`}
          >
            <span className="material-icons-outlined text-sm mr-1 align-middle">account_tree</span>
            Subcategories ({filteredSubs.length})
          </button>
        </div>

        <div className="relative max-w-xs w-full">
          <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
          />
        </div>
      </div>

      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={openAddCategory} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg">
              <span className="material-icons-outlined text-lg">add</span>
              Add Category
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCategories.map(cat => (
              <div key={cat._id || cat.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                <div className={`bg-gradient-to-r ${cat.gradient} p-5 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <span className="material-icons-outlined text-2xl">{cat.icon}</span>
                      </div>
                      <div>
                        <h3 className="font-black text-lg">{cat.title}</h3>
                        <p className="text-white/70 text-xs">{cat.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEditCategory(cat)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-all">
                        <span className="material-icons-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleDeleteCategory(cat)} className="p-2 bg-white/20 rounded-lg hover:bg-red-500/50 transition-all">
                        <span className="material-icons-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500">{cat.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs">
                    <span className={`px-2 py-1 rounded-full ${cat.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} font-bold`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {cat.tag && <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-full font-bold">{cat.tag}</span>}
                    <span className="text-gray-400">Order: {cat.order}</span>
                    <span className="text-gray-400">ID: {cat.id}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {subcategories.filter(s => s.categoryId === cat.id).length} subcategories
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'subcategories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!selectedCategory ? 'bg-blue-100 text-blue-600 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedCategory === cat.id ? 'bg-blue-100 text-blue-600 border-2 border-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {cat.title}
                </button>
              ))}
            </div>
            <button onClick={openAddSubcategory} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shrink-0">
              <span className="material-icons-outlined text-lg">add</span>
              Add Subcategory
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Icon</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Title</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Category</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Path</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                  <th className="text-left p-4 text-xs font-bold text-gray-500 uppercase">Order</th>
                  <th className="text-right p-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map(sub => {
                  const parentCat = categories.find(c => c.id === sub.categoryId);
                  return (
                    <tr key={sub._id || sub.id} className="border-b hover:bg-gray-50 transition-all">
                      <td className="p-4">
                        <div className={`w-10 h-10 ${sub.color} rounded-lg flex items-center justify-center`}>
                          <span className="material-icons-outlined text-white text-lg">{sub.icon}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-gray-800">{sub.title}</p>
                        {sub.description && <p className="text-xs text-gray-400 mt-0.5">{sub.description}</p>}
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 bg-gradient-to-r ${parentCat?.gradient || 'from-gray-400 to-gray-500'} text-white text-xs font-bold rounded-full`}>
                          {parentCat?.title || sub.categoryId}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-gray-500">{sub.parentPath || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${sub.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {sub.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">{sub.order}</td>
                      <td className="p-4 text-right">
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => openEditSubcategory(sub)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all">
                            <span className="material-icons-outlined text-sm">edit</span>
                          </button>
                          <button onClick={() => handleDeleteSubcategory(sub)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-all">
                            <span className="material-icons-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredSubs.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400 text-sm">No subcategories found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowCatModal(false); setEditingCat(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-black">{editingCat ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={() => { setShowCatModal(false); setEditingCat(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Category ID</label>
                  <input
                    value={catForm.id || ''}
                    onChange={e => setCatForm({ ...catForm, id: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. neet"
                    disabled={!!editingCat}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Order</label>
                  <input
                    type="number"
                    value={catForm.order || 1}
                    onChange={e => setCatForm({ ...catForm, order: parseInt(e.target.value) })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Title</label>
                <input
                  value={catForm.title || ''}
                  onChange={e => setCatForm({ ...catForm, title: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. NEET"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Subtitle</label>
                <input
                  value={catForm.subtitle || ''}
                  onChange={e => setCatForm({ ...catForm, subtitle: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Medical Entrance"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Description</label>
                <input
                  value={catForm.description || ''}
                  onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Biology, Chemistry, Physics"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Tag</label>
                  <input
                    value={catForm.tag || ''}
                    onChange={e => setCatForm({ ...catForm, tag: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g. Most Popular"
                  />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <label className="text-xs font-bold text-gray-500">Active</label>
                  <button
                    onClick={() => setCatForm({ ...catForm, isActive: !catForm.isActive })}
                    className={`w-12 h-6 rounded-full transition-all ${catForm.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${catForm.isActive ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setCatForm({ ...catForm, icon })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${catForm.icon === icon ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      <span className="material-icons-outlined text-lg">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">Gradient</label>
                <div className="flex flex-wrap gap-2">
                  {gradientOptions.map(g => (
                    <button
                      key={g}
                      onClick={() => setCatForm({ ...catForm, gradient: g })}
                      className={`w-20 h-10 bg-gradient-to-r ${g} rounded-lg transition-all ${catForm.gradient === g ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                    ></button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Category Image</label>
                <div className="flex gap-2 items-center">
                  <input
                    value={catForm.imageUrl || ''}
                    onChange={e => setCatForm({ ...catForm, imageUrl: e.target.value })}
                    className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Paste URL or upload image"
                  />
                  <FileUploadButton
                    accept="image/*"
                    label="Upload"
                    icon="cloud_upload"
                    onUpload={(url) => setCatForm({ ...catForm, imageUrl: url })}
                  />
                </div>
                {catForm.imageUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border-2 border-dashed border-gray-200">
                    <img src={catForm.imageUrl} alt="Preview" className="w-full h-32 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    <button
                      onClick={() => setCatForm({ ...catForm, imageUrl: '' })}
                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow"
                    >
                      <span className="material-icons-outlined text-sm">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => { setShowCatModal(false); setEditingCat(null); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200">Cancel</button>
              <button onClick={handleSaveCategory} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg">
                {editingCat ? 'Update' : 'Create'} Category
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowSubModal(false); setEditingSub(null); }}>
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-lg font-black">{editingSub ? 'Edit Subcategory' : 'Add Subcategory'}</h3>
              <button onClick={() => { setShowSubModal(false); setEditingSub(null); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Parent Category</label>
                <select
                  value={subForm.categoryId || ''}
                  onChange={e => setSubForm({ ...subForm, categoryId: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Title</label>
                <input
                  value={subForm.title || ''}
                  onChange={e => setSubForm({ ...subForm, title: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Class 11th - Recorded Batch"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Parent Path (Breadcrumb)</label>
                <input
                  value={subForm.parentPath || ''}
                  onChange={e => setSubForm({ ...subForm, parentPath: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Class 11th or CBSE Board > Class 9th"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Description (Optional)</label>
                <input
                  value={subForm.description || ''}
                  onChange={e => setSubForm({ ...subForm, description: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Pre-recorded video lectures"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Order</label>
                  <input
                    type="number"
                    value={subForm.order || 1}
                    onChange={e => setSubForm({ ...subForm, order: parseInt(e.target.value) })}
                    className="w-full border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 pt-5">
                  <label className="text-xs font-bold text-gray-500">Active</label>
                  <button
                    onClick={() => setSubForm({ ...subForm, isActive: !subForm.isActive })}
                    className={`w-12 h-6 rounded-full transition-all ${subForm.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${subForm.isActive ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setSubForm({ ...subForm, icon })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${subForm.icon === icon ? 'bg-blue-600 text-white ring-2 ring-blue-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      <span className="material-icons-outlined text-lg">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(c => (
                    <button
                      key={c}
                      onClick={() => setSubForm({ ...subForm, color: c })}
                      className={`w-10 h-10 ${c} rounded-lg transition-all ${subForm.color === c ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`}
                    ></button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Subcategory Image</label>
                <div className="flex gap-2 items-center">
                  <input
                    value={subForm.imageUrl || ''}
                    onChange={e => setSubForm({ ...subForm, imageUrl: e.target.value })}
                    className="flex-1 border rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Paste URL or upload image"
                  />
                  <FileUploadButton
                    accept="image/*"
                    label="Upload"
                    icon="cloud_upload"
                    onUpload={(url) => setSubForm({ ...subForm, imageUrl: url })}
                  />
                </div>
                {subForm.imageUrl && (
                  <div className="mt-2 relative rounded-xl overflow-hidden border-2 border-dashed border-gray-200">
                    <img src={subForm.imageUrl} alt="Preview" className="w-full h-32 object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    <button
                      onClick={() => setSubForm({ ...subForm, imageUrl: '' })}
                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow"
                    >
                      <span className="material-icons-outlined text-sm">close</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t flex gap-3 justify-end">
              <button onClick={() => { setShowSubModal(false); setEditingSub(null); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200">Cancel</button>
              <button onClick={handleSaveSubcategory} className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg">
                {editingSub ? 'Update' : 'Create'} Subcategory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
