import React, { useState, useEffect } from 'react';
import { pdfsAPI, coursesAPI } from '../../src/services/apiClient';

interface PDF {
  id: string;
  title: string;
  subject: string;
  course: string;
  fileUrl: string;
  fileSize?: string;
  allowDownload?: boolean;
  status?: 'active' | 'inactive';
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const PDFs: React.FC<Props> = ({ showToast }) => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPdf, setEditingPdf] = useState<PDF | null>(null);
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    course: '',
    fileUrl: '',
    fileSize: '',
    allowDownload: false,
    status: 'active' as 'active' | 'inactive'
  });

  // Filter & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPdfs, setSelectedPdfs] = useState<string[]>([]);
  const filterDropdownRef = React.useRef<HTMLDivElement>(null);

  const subjects = ['Physics', 'Chemistry', 'Biology', 'Zoology', 'Botany', 'General'];

  useEffect(() => {
    loadData();
    const handleClickOutside = (event: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      const [pdfData, courseData] = await Promise.all([
        pdfsAPI.getAll(),
        coursesAPI.getAll()
      ]);
      setPdfs(pdfData);
      setCourses(courseData);
    } catch (error) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredPdfs = pdfs.filter(pdf => {
    const matchesSearch = pdf.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pdf.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = !filterCourse || pdf.course === filterCourse;
    const matchesSubject = !filterSubject || pdf.subject === filterSubject;
    return matchesSearch && matchesCourse && matchesSubject;
  });

  const totalPages = Math.ceil(filteredPdfs.length / itemsPerPage);
  const paginatedPdfs = filteredPdfs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // File upload handlers
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const uploadToCloudStorage = async (file: File): Promise<string> => {
    // Using FormData to simulate file upload
    // In production, replace with actual cloud storage (Firebase, AWS S3, Cloudinary, etc.)
    try {
      setUploadProgress(30);

      // Simulating upload delay - in real app, upload to cloud
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a data URL (for demo) - replace with actual cloud URL in production
      const reader = new FileReader();

      return new Promise((resolve, reject) => {
        reader.onload = () => {
          // In production: return actual cloud storage URL
          // For now, we'll use the filename with a base URL
          const cloudUrl = `https://storage.example.com/pdfs/${file.name}`;
          setUploadProgress(100);
          resolve(cloudUrl);
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    } catch (error) {
      showToast('File upload failed', 'error');
      throw error;
    }
  };

  const handleFileSelect = async (file: File) => {
    if (file.type !== 'application/pdf') {
      showToast('Please select a PDF file', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      showToast('File size exceeds 50MB limit', 'error');
      return;
    }

    setSelectedFile(file);
    setFormData({
      ...formData,
      fileSize: formatFileSize(file.size)
    });
    setUploadProgress(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleOpenModal = (pdf?: PDF) => {
    if (pdf) {
      setEditingPdf(pdf);
      setFormData({
        title: pdf.title,
        subject: pdf.subject,
        course: pdf.course,
        fileUrl: pdf.fileUrl,
        fileSize: pdf.fileSize || '',
        allowDownload: pdf.allowDownload || false,
        status: pdf.status || 'active'
      });
    } else {
      setEditingPdf(null);
      setFormData({ title: '', subject: '', course: '', fileUrl: '', fileSize: '', allowDownload: false, status: 'active' });
      setSelectedFile(null);
      setUploadProgress(0);
      setUploadMode('url');
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPdf(null);
    setFormData({ title: '', subject: '', course: '', fileUrl: '', fileSize: '', allowDownload: false, status: 'active' });
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadMode('url');
  };

  const handleSubmit = async () => {
    if (!formData.title) {
      showToast('Please enter PDF title', 'error');
      return;
    }

    let finalFileUrl = formData.fileUrl;

    // Handle file upload if selected
    if (uploadMode === 'file' && selectedFile) {
      if (!finalFileUrl) {
        try {
          showToast('Uploading PDF...', 'success');
          finalFileUrl = await uploadToCloudStorage(selectedFile);
        } catch (error) {
          showToast('Failed to upload PDF file', 'error');
          return;
        }
      }
    } else if (uploadMode === 'url' && !formData.fileUrl) {
      showToast('Please enter PDF URL or upload a file', 'error');
      return;
    }

    try {
      const submitData = {
        ...formData,
        fileUrl: finalFileUrl
      };

      if (editingPdf) {
        await pdfsAPI.update(editingPdf.id, {
          ...editingPdf,
          ...submitData
        });
        showToast('PDF updated successfully!');
      } else {
        const pdfData = {
          id: `pdf_${Date.now()}`,
          ...submitData,
          createdAt: new Date().toISOString()
        };
        await pdfsAPI.create(pdfData);
        showToast('PDF uploaded successfully!');
      }

      handleCloseModal();
      loadData();
    } catch (error) {
      showToast('Failed to save PDF', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this PDF?')) {
      try {
        await pdfsAPI.delete(id);
        showToast('PDF deleted successfully!');
        loadData();
      } catch (error) {
        showToast('Failed to delete PDF', 'error');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPdfs.length === 0) return;
    if (confirm(`Delete ${selectedPdfs.length} selected PDFs?`)) {
      try {
        await Promise.all(selectedPdfs.map(id => pdfsAPI.delete(id)));
        showToast(`${selectedPdfs.length} PDFs deleted!`);
        setSelectedPdfs([]);
        loadData();
      } catch (error) {
        showToast('Failed to delete PDFs', 'error');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedPdfs.length === paginatedPdfs.length) {
      setSelectedPdfs([]);
    } else {
      setSelectedPdfs(paginatedPdfs.map(p => p.id));
    }
  };

  const toggleSelectPdf = (id: string) => {
    setSelectedPdfs(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleStatus = async (pdf: PDF) => {
    try {
      const newStatus = pdf.status === 'active' ? 'inactive' : 'active';
      await pdfsAPI.update(pdf.id, { ...pdf, status: newStatus });
      showToast(`PDF ${newStatus === 'active' ? 'activated' : 'deactivated'}!`);
      loadData();
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">PDFs</h2>
          <p className="text-sm text-gray-500 mt-1">PDF List</p>
        </div>
        <div className="flex gap-3">
          {selectedPdfs.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <span className="material-icons-outlined text-lg">delete</span>
              Delete ({selectedPdfs.length})
            </button>
          )}
          <button
            onClick={() => handleOpenModal()}
            className="bg-navy text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-navy/90 transition-colors flex items-center gap-2"
          >
            <span className="material-icons-outlined text-lg">add</span>
            Upload PDF
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters Row */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center bg-gray-50/30">
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="bg-transparent text-[13px] font-bold text-navy outline-none cursor-pointer pr-2"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="relative group flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] group-focus-within:text-navy transition-colors">search</span>
            <input
              type="text"
              placeholder="Search PDFs by title or subject..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all shadow-sm placeholder:text-gray-400"
            />
          </div>

          <div className="relative" ref={filterDropdownRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${isFilterOpen || filterCourse || filterSubject ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Advanced Filters
              {(filterCourse || filterSubject) && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[200] p-6 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Filter PDFs</h4>
                  <button
                    onClick={() => { setFilterCourse(''); setFilterSubject(''); }}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Reset All
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Subject</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['Physics', 'Chemistry', 'Biology', 'General'].map((sub) => (
                        <button
                          key={sub}
                          onClick={() => setFilterSubject(filterSubject === sub ? '' : sub)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterSubject === sub ? 'bg-navy text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                          {sub}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Linked Course</label>
                    <select
                      value={filterCourse}
                      onChange={(e) => { setFilterCourse(e.target.value); setCurrentPage(1); }}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[12px] font-bold text-gray-700 outline-none focus:bg-white focus:border-navy transition-all appearance-none cursor-pointer"
                    >
                      <option value="">All Courses</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.title}>{course.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-gray-50">
                  <button onClick={() => setIsFilterOpen(false)} className="w-full py-3 bg-gray-50 text-navy text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-gray-100 transition-all">
                    Show {filteredPdfs.length} Results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedPdfs.length === paginatedPdfs.length && paginatedPdfs.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">PDF Title</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">PDF File</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Allow Download</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPdfs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <span className="material-icons-outlined text-6xl text-gray-200 mb-2 block">picture_as_pdf</span>
                    <p className="text-gray-400 font-medium">No PDFs found</p>
                  </td>
                </tr>
              ) : (
                paginatedPdfs.map((pdf, index) => (
                  <tr key={pdf.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedPdfs.includes(pdf.id)}
                        onChange={() => toggleSelectPdf(pdf.id)}
                        className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-600">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-navy">{pdf.title}</span>
                    </td>
                    <td className="px-4 py-4">
                      <a
                        href={pdf.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-500 hover:underline font-medium"
                      >
                        Download
                      </a>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{pdf.course || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{pdf.subject || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{pdf.allowDownload ? 'yes' : 'no'}</td>
                    <td className="px-4 py-4">
                      <button
                        onClick={() => toggleStatus(pdf)}
                        className={`px-3 py-1 rounded-full text-xs font-bold ${pdf.status === 'active'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-red-100 text-red-600'
                          }`}
                      >
                        {pdf.status === 'active' ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(pdf)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(pdf.id)}
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

        {/* Pagination */}
        {filteredPdfs.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredPdfs.length)} of {filteredPdfs.length} entries
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

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

          {/* Modal Content */}
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-navy uppercase tracking-wide">
                {editingPdf ? 'Edit PDF' : 'Upload PDF'}
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Document Title *</label>
                <input
                  type="text"
                  placeholder="Enter PDF title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Subject</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Course</label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                  >
                    <option value="">Select Course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.title}>{course.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Mode Tabs */}
              <div className="flex gap-2 border-b border-gray-200 mb-4">
                <button
                  onClick={() => { setUploadMode('url'); setSelectedFile(null); setUploadProgress(0); }}
                  className={`px-4 py-3 text-sm font-bold uppercase transition-colors ${uploadMode === 'url'
                      ? 'text-navy border-b-2 border-navy'
                      : 'text-gray-500 hover:text-gray-600'
                    }`}
                >
                  URL Link
                </button>
                <button
                  onClick={() => { setUploadMode('file'); setFormData({ ...formData, fileUrl: '' }); }}
                  className={`px-4 py-3 text-sm font-bold uppercase transition-colors ${uploadMode === 'file'
                      ? 'text-navy border-b-2 border-navy'
                      : 'text-gray-500 hover:text-gray-600'
                    }`}
                >
                  Upload File
                </button>
              </div>

              {/* URL Mode */}
              {uploadMode === 'url' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">PDF URL *</label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/... or https://example.com/file.pdf"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
                  />
                  <p className="text-xs text-gray-400 mt-2">Supports Google Drive, Dropbox, or direct PDF links</p>
                </div>
              )}

              {/* File Upload Mode */}
              {uploadMode === 'file' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Upload PDF File *</label>
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${isDragging
                        ? 'border-navy bg-navy/5'
                        : 'border-gray-300 bg-gray-50 hover:border-navy/50'
                      }`}
                  >
                    <input
                      ref={(input) => {
                        if (input) (input as any).accept = '.pdf';
                      }}
                      type="file"
                      accept=".pdf"
                      onChange={handleFileInputChange}
                      className="hidden"
                      id="pdf-input"
                    />
                    <label htmlFor="pdf-input" className="cursor-pointer block">
                      <span className="material-icons-outlined text-5xl text-navy/60 mb-3 block">
                        upload_file
                      </span>
                      {selectedFile ? (
                        <div>
                          <p className="text-sm font-bold text-navy mb-1">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-gray-700 mb-1">
                            Drag & drop your PDF here
                          </p>
                          <p className="text-xs text-gray-500">or click to browse (Max 50MB)</p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-600">Uploading...</span>
                        <span className="text-xs font-bold text-navy">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-navy h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {uploadProgress === 100 && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
                      <span className="material-icons-outlined text-green-600">check_circle</span>
                      <span className="text-xs font-medium text-green-600">Upload successful!</span>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">File Size (Auto-filled)</label>
                <input
                  type="text"
                  placeholder="Auto-calculated"
                  value={formData.fileSize}
                  readOnly
                  className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl text-sm font-medium outline-none text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowDownload}
                    onChange={(e) => setFormData({ ...formData, allowDownload: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span className="text-sm font-medium text-gray-700">Allow Download</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.status === 'active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                    className="w-5 h-5 rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
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
                {editingPdf ? 'Update' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFs;
