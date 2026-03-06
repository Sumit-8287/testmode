import React, { useState, useEffect } from 'react';
import { testsAPI, coursesAPI } from '../../src/services/apiClient';

interface Test {
  id: string;
  name: string;
  course: string;
  courseId: string;
  courseName: string;
  questions: number;
  status: 'active' | 'inactive' | 'scheduled' | 'draft';
  date: string;
  openDate?: string;
  closeDate?: string;
  duration?: number;
  featured?: boolean;
  totalAttempts?: number;
  avgScore?: number;
}

interface Course {
  id: string;
  name: string;
  title?: string;
  categoryId?: string;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const Tests: React.FC<Props> = ({ showToast }) => {
  const [tests, setTests] = useState<Test[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    courseId: '',
    questions: '',
    duration: '180',
    status: 'draft' as 'active' | 'inactive' | 'scheduled' | 'draft',
    openDate: '',
    closeDate: '',
    featured: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [testData, courseData] = await Promise.all([
        testsAPI.getAll().catch(() => []),
        coursesAPI.getAll().catch(() => [])
      ]);
      setTests(Array.isArray(testData) ? testData : []);
      setCourses(Array.isArray(courseData) ? courseData : []);
    } catch (error) {
      console.log('Starting with empty state');
      setTests([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (test: any) => {
    if (test.courseName) return test.courseName;
    if (test.courseId) {
      const course = courses.find(c => c.id === test.courseId);
      return course ? (course.name || course.title) : test.courseId;
    }
    return test.course || 'Unlinked';
  };

  const filteredTests = tests.filter(test => {
    const matchesSearch = !searchQuery || (test.name && test.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCourse = !filterCourse || (test.courseId === filterCourse) || (!test.courseId && test.course === filterCourse);
    const matchesStatus = !filterStatus || (test.status === filterStatus);
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const paginatedTests = filteredTests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (test?: Test) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        name: test.name,
        courseId: test.courseId || '',
        questions: (Array.isArray(test.questions) ? test.questions.length : (test.questions || 0)).toString(),
        duration: test.duration?.toString() || '180',
        status: test.status,
        openDate: test.openDate || '',
        closeDate: test.closeDate || '',
        featured: test.featured || false
      });
    } else {
      setEditingTest(null);
      setFormData({
        name: '',
        courseId: '',
        questions: '',
        duration: '180',
        status: 'draft',
        openDate: '',
        closeDate: '',
        featured: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTest(null);
    setFormData({
      name: '',
      courseId: '',
      questions: '',
      duration: '180',
      status: 'draft',
      openDate: '',
      closeDate: '',
      featured: false
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.courseId) {
      showToast('Please fill Test Title and select Course', 'error');
      return;
    }

    const selectedCourse = courses.find(c => c.id === formData.courseId);

    try {
      const testData: any = {
        id: editingTest?.id || `test_${Date.now()}`,
        name: formData.name,
        courseId: formData.courseId,
        courseName: selectedCourse ? (selectedCourse.name || selectedCourse.title) : '',
        course: selectedCourse ? (selectedCourse.name || selectedCourse.title) : '',
        questions: parseInt(formData.questions) || 0,
        duration: parseInt(formData.duration),
        status: formData.status,
        openDate: formData.openDate,
        closeDate: formData.closeDate,
        featured: formData.featured,
        date: editingTest?.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };

      if (editingTest) {
        try {
          await testsAPI.update(editingTest.id, testData);
          setTests(tests.map(t => t.id === editingTest.id ? testData : t));
          showToast('Test updated successfully!');
        } catch (apiError) {
          console.error('API update error:', apiError);
          setTests(tests.map(t => t.id === editingTest.id ? testData : t));
          showToast('Test updated (local only)');
        }
      } else {
        try {
          await testsAPI.create(testData);
          setTests([...tests, testData]);
          showToast('Test created successfully!');
        } catch (apiError) {
          console.error('API create error:', apiError);
          setTests([...tests, testData]);
          showToast('Test created (local only)');
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error('Test save error:', error);
      showToast(`Error: ${error instanceof Error ? error.message : 'Failed to save test'}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this test?')) {
      try {
        await testsAPI.delete(id);
        setTests(tests.filter(t => t.id !== id));
        showToast('Test deleted successfully!');
      } catch (error) {
        showToast('Failed to delete test', 'error');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTests.length === 0) return;
    if (confirm(`Delete ${selectedTests.length} selected tests?`)) {
      try {
        await Promise.all(selectedTests.map(id => testsAPI.delete(id)));
        setTests(tests.filter(t => !selectedTests.includes(t.id)));
        setSelectedTests([]);
        showToast(`${selectedTests.length} tests deleted!`);
      } catch (error) {
        showToast('Failed to delete tests', 'error');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedTests.length === paginatedTests.length) {
      setSelectedTests([]);
    } else {
      setSelectedTests(paginatedTests.map(t => t.id));
    }
  };

  const toggleSelectTest = (id: string) => {
    setSelectedTests(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const toggleFeatured = async (test: Test) => {
    try {
      const updatedTest = { ...test, featured: !test.featured };
      await testsAPI.update(test.id, updatedTest);
      setTests(tests.map(t => t.id === test.id ? updatedTest : t));
      showToast(test.featured ? 'Removed from featured!' : 'Added to featured!');
    } catch (error) {
      showToast('Failed to update test', 'error');
    }
  };

  const toggleStatus = async (test: Test) => {
    const newStatus = test.status === 'active' ? 'inactive' : 'active';
    try {
      const updatedTest = { ...test, status: newStatus as any };
      await testsAPI.update(test.id, updatedTest);
      setTests(tests.map(t => t.id === test.id ? updatedTest : t));
      showToast(`Test ${newStatus}!`);
    } catch (error) {
      showToast('Failed to update status', 'error');
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">Mock Tests</h2>
          <p className="text-sm text-gray-500 mt-1">Manage and publish exams (linked to courses)</p>
        </div>
        <div className="flex gap-3">
          {selectedTests.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <span className="material-icons-outlined text-lg">delete</span>
              Delete ({selectedTests.length})
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="bg-navy text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-navy/90 transition-colors flex items-center gap-2"
          >
            <span className="material-icons-outlined text-lg">add</span>
            Create Test
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center bg-white">
          <div className="flex-1 relative group">
            <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-navy transition-colors">search</span>
            <input
              type="text"
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-gray-200 transition-all shadow-sm focus:shadow-md"
            />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-6 py-3.5 border rounded-2xl text-[12px] font-black uppercase tracking-wider transition-all shadow-sm ${isFilterOpen ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300'}`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Filters
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-3 w-80 bg-white border border-gray-100 rounded-3xl shadow-2xl z-[100] p-6 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest">Advanced Filters</h4>
                  <button onClick={() => { setFilterCourse(''); setFilterStatus(''); setIsFilterOpen(false); }} className="text-[10px] font-bold text-blue-600 hover:underline">Reset</button>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Exam Status</label>
                    <div className="grid grid-cols-2 gap-2">
                      {['', 'active', 'inactive', 'scheduled', 'draft'].map((status) => (
                        <button
                          key={status}
                          onClick={() => { setFilterStatus(status); setIsFilterOpen(false); }}
                          className={`text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${filterStatus === status ? 'bg-navy/5 border-navy/10 text-navy' : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-100'}`}
                        >
                          {status === '' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Select Course</label>
                    <select
                      value={filterCourse}
                      onChange={(e) => { setFilterCourse(e.target.value); setIsFilterOpen(false); }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-bold text-gray-700 outline-none focus:bg-white transition-all shadow-sm"
                    >
                      <option value="">All Courses</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>{course.name || course.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent text-xs font-black text-navy outline-none cursor-pointer"
            >
              <option value={10}>10 Items</option>
              <option value={25}>25 Items</option>
              <option value={50}>50 Items</option>
              <option value={100}>100 Items</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedTests.length === paginatedTests.length && paginatedTests.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Test Title</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Open Date</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Close Date</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Questions</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Featured</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTests.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <span className="material-icons-outlined text-6xl text-gray-200 mb-2 block">quiz</span>
                    <p className="text-gray-400 font-medium">No tests found</p>
                  </td>
                </tr>
              ) : (
                paginatedTests.map((test, index) => (
                  <tr key={test.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test.id)}
                        onChange={() => toggleSelectTest(test.id)}
                        className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-600">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-navy uppercase">{test.name}</span>
                      <p className="text-xs text-gray-400 mt-0.5">Added: {test.date}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{getCourseName(test)}</span>
                      {!test.courseId && <span className="block text-[10px] text-orange-500 font-bold">Not linked</span>}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{test.openDate || 'N/A'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{test.closeDate || 'N/A'}</td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">{Array.isArray(test.questions) ? test.questions.length : (test.questions || 0)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleStatus(test)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${test.status === 'active'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                          }`}
                      >
                        {test.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={() => toggleFeatured(test)}
                        className={`transition-colors ${test.featured ? 'text-yellow-500' : 'text-gray-300'}`}
                        title={test.featured ? 'Remove from featured' : 'Add to featured'}
                      >
                        <span className="material-icons-outlined text-lg">star</span>
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(test)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(test.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <span className="material-icons-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredTests.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredTests.length)} of {filteredTests.length} entries
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                First
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 text-sm font-bold rounded-lg ${currentPage === pageNum
                        ? 'bg-navy text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-navy uppercase tracking-wide">
                {editingTest ? 'Edit Test' : 'Create Test'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Test Title *</label>
                <input
                  type="text"
                  placeholder="Enter test title"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Course * (Link to Course)</label>
                <select
                  value={formData.courseId}
                  onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                >
                  <option value="">Select Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>{course.name || course.title}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Test will appear under this course in the hierarchy</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Questions</label>
                  <input
                    type="number"
                    placeholder="Number of questions"
                    value={formData.questions}
                    onChange={(e) => setFormData({ ...formData, questions: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Duration (mins)</label>
                  <input
                    type="number"
                    placeholder="Duration in minutes"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-navy focus:ring-navy"
                    />
                    <span className="text-sm font-medium text-gray-700">Featured</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Open Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.openDate}
                    onChange={(e) => setFormData({ ...formData, openDate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Close Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formData.closeDate}
                    onChange={(e) => setFormData({ ...formData, closeDate: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-4">
              <button
                onClick={handleCloseModal}
                className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold text-sm uppercase hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 bg-navy text-white py-3.5 rounded-xl font-bold text-sm uppercase hover:bg-navy/90 transition-colors"
              >
                {editingTest ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;
