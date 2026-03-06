import React, { useState, useEffect } from 'react';
import { testSeriesAPI, coursesAPI } from '../../src/services/apiClient';

interface TestSeriesItem {
  id: string;
  seriesName: string;
  totalTests: number;
  course: string;
  courseId: string;
  courseName: string;
  description: string;
  studentsEnrolled: number;
  status: 'active' | 'inactive' | 'draft';
  createdDate: string;
  completionRate: number;
}

interface Course {
  id: string;
  name: string;
  title?: string;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const TestSeries: React.FC<Props> = ({ showToast }) => {
  const [series, setSeries] = useState<TestSeriesItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<TestSeriesItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    seriesName: '',
    courseId: '',
    totalTests: '',
    description: '',
    status: 'draft' as 'active' | 'inactive' | 'draft'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [seriesData, courseData] = await Promise.all([
        testSeriesAPI.getAll().catch(() => []),
        coursesAPI.getAll().catch(() => [])
      ]);
      setSeries(Array.isArray(seriesData) ? seriesData : []);
      setCourses(Array.isArray(courseData) ? courseData : []);
    } catch (error) {
      console.log('Starting with empty state');
      setSeries([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const getCourseName = (item: any) => {
    if (item.courseName) return item.courseName;
    if (item.courseId) {
      const course = courses.find(c => c.id === item.courseId);
      return course ? (course.name || course.title) : item.courseId;
    }
    return item.course || 'Unlinked';
  };

  const filteredSeries = series.filter(item => {
    const matchesSearch = !searchQuery || (item.seriesName && item.seriesName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = !filterStatus || item.status === filterStatus;
    const matchesCourse = !filterCourse || item.courseId === filterCourse;
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const totalPages = Math.ceil(filteredSeries.length / itemsPerPage);
  const paginatedSeries = filteredSeries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleOpenModal = (item?: TestSeriesItem) => {
    if (item) {
      setEditingSeries(item);
      setFormData({
        seriesName: item.seriesName,
        courseId: item.courseId || '',
        totalTests: item.totalTests.toString(),
        description: item.description,
        status: item.status
      });
    } else {
      setEditingSeries(null);
      setFormData({ seriesName: '', courseId: '', totalTests: '', description: '', status: 'draft' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSeries(null);
    setFormData({ seriesName: '', courseId: '', totalTests: '', description: '', status: 'draft' });
  };

  const handleSubmit = async () => {
    if (!formData.seriesName || !formData.courseId || !formData.totalTests) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    const selectedCourse = courses.find(c => c.id === formData.courseId);

    try {
      const seriesData: any = {
        id: editingSeries?.id || `series_${Date.now()}`,
        seriesName: formData.seriesName,
        totalTests: parseInt(formData.totalTests),
        courseId: formData.courseId,
        courseName: selectedCourse ? (selectedCourse.name || selectedCourse.title) : '',
        course: selectedCourse ? (selectedCourse.name || selectedCourse.title) : '',
        description: formData.description,
        studentsEnrolled: editingSeries?.studentsEnrolled || 0,
        status: formData.status,
        createdDate: editingSeries?.createdDate || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        completionRate: editingSeries?.completionRate || 0
      };

      if (editingSeries) {
        try {
          await testSeriesAPI.update(editingSeries.id, seriesData);
          setSeries(series.map(s => s.id === editingSeries.id ? seriesData : s));
          showToast('Series updated successfully!');
        } catch (apiError) {
          console.error('API update error:', apiError);
          setSeries(series.map(s => s.id === editingSeries.id ? seriesData : s));
          showToast('Series updated (local only)');
        }
      } else {
        try {
          await testSeriesAPI.create(seriesData);
          setSeries([...series, seriesData]);
          showToast('Series created successfully!');
        } catch (apiError) {
          console.error('API create error:', apiError);
          setSeries([...series, seriesData]);
          showToast('Series created (local only)');
        }
      }

      handleCloseModal();
    } catch (error) {
      console.error('Series save error:', error);
      showToast(`Error: ${error instanceof Error ? error.message : 'Failed to save series'}`, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this series?')) {
      try {
        await testSeriesAPI.delete(id);
        setSeries(series.filter(s => s.id !== id));
        showToast('Series deleted successfully!');
      } catch (error) {
        showToast('Failed to delete series', 'error');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedSeries.length === paginatedSeries.length) {
      setSelectedSeries([]);
    } else {
      setSelectedSeries(paginatedSeries.map(s => s.id));
    }
  };

  const toggleSelectSeries = (id: string) => {
    setSelectedSeries(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedSeries.length === 0) return;
    if (confirm(`Delete ${selectedSeries.length} selected series?`)) {
      try {
        await Promise.all(selectedSeries.map(id => testSeriesAPI.delete(id)));
        setSeries(series.filter(s => !selectedSeries.includes(s.id)));
        setSelectedSeries([]);
        showToast(`${selectedSeries.length} series deleted!`);
      } catch (error) {
        showToast('Failed to delete series', 'error');
      }
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
          <h2 className="text-2xl font-black text-navy">Test Series</h2>
          <p className="text-sm text-gray-500 mt-1">Create and manage test bundles (linked to courses)</p>
        </div>
        <div className="flex gap-3">
          {selectedSeries.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <span className="material-icons-outlined text-lg">delete</span>
              Delete ({selectedSeries.length})
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="bg-navy text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-navy/90 transition-colors flex items-center gap-2"
          >
            <span className="material-icons-outlined text-lg">add</span>
            Create Series
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy/20"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          <select
            value={filterCourse}
            onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy/20 min-w-[180px]"
          >
            <option value="">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name || course.title}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            className="border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy/20 min-w-[150px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>

          <div className="flex-1"></div>

          <div className="relative">
            <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
            <input
              type="text"
              placeholder="Search series..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy/20 w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedSeries.length === paginatedSeries.length && paginatedSeries.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Series Name</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Tests</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Students</th>
                <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Completion</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSeries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <span className="material-icons-outlined text-6xl text-gray-200 mb-2 block">playlist_add</span>
                    <p className="text-gray-400 font-medium">No test series found</p>
                  </td>
                </tr>
              ) : (
                paginatedSeries.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSeries.includes(item.id)}
                        onChange={() => toggleSelectSeries(item.id)}
                        className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-600">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-navy">{item.seriesName}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{getCourseName(item)}</span>
                      {!item.courseId && <span className="block text-[10px] text-orange-500 font-bold">Not linked</span>}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-block bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">{item.totalTests}</span>
                    </td>
                    <td className="px-4 py-4 text-center text-sm font-bold text-gray-600">{item.studentsEnrolled}</td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${item.completionRate}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-600">{item.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.status === 'active'
                          ? 'bg-green-100 text-green-600'
                          : item.status === 'draft'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-red-100 text-red-600'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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

        {filteredSeries.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSeries.length)} of {filteredSeries.length} entries
            </p>
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
                {editingSeries ? 'Edit Series' : 'Create Series'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Series Name *</label>
                <input
                  type="text"
                  placeholder="Enter series name"
                  value={formData.seriesName}
                  onChange={(e) => setFormData({ ...formData, seriesName: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Course * (Link)</label>
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Total Tests *</label>
                  <input
                    type="number"
                    placeholder="Number of tests"
                    value={formData.totalTests}
                    onChange={(e) => setFormData({ ...formData, totalTests: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Description</label>
                <textarea
                  placeholder="Enter series description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                {editingSeries ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestSeries;
