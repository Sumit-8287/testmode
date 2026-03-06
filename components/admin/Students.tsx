import React, { useState, useEffect } from 'react';
import { studentsAPI } from '../../src/services/apiClient';

interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  course: string;
  city: string;
  registrationDate: string;
  registrationType: string;
  status: 'active' | 'inactive';
  paymentStatus: 'paid' | 'pending' | 'failed';
  notes?: string;
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const Students: React.FC<Props> = ({ showToast }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [registrationFilter, setRegistrationFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    course: '',
    city: '',
    registrationDate: new Date().toISOString().split('T')[0],
    registrationType: 'regular',
    status: 'active' as 'active' | 'inactive',
    paymentStatus: 'pending' as 'paid' | 'pending' | 'failed',
    notes: ''
  });

  // Load students on mount
  useEffect(() => {
    loadStudents();
  }, []);

  // Filter students based on search and status
  useEffect(() => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (registrationFilter !== 'all') {
      filtered = filtered.filter(s => s.registrationType === registrationFilter);
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(s => s.paymentStatus === paymentFilter);
    }

    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [students, searchQuery, statusFilter, registrationFilter, paymentFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  const loadStudents = async () => {
    try {
      setLoading(true);
      console.log('Loading students...');
      const data = await studentsAPI.getAll();
      console.log('Students loaded successfully:', data);
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Failed to load students:', errorMsg, error);
      showToast(`Failed to load students: ${errorMsg}`, 'error');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const generateStudentId = () => {
    const maxId = Math.max(0, ...students.map(s => {
      const num = parseInt(s.id.replace('ST-', ''));
      return isNaN(num) ? 0 : num;
    }));
    return `ST-${String(maxId + 1).padStart(4, '0')}`;
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.course) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      const newStudent: Student = {
        id: generateStudentId(),
        ...formData
      };

      await studentsAPI.create(newStudent);
      setStudents([...students, newStudent]);
      resetForm();
      setShowAddModal(false);
      showToast(`Student ${newStudent.name} added successfully`, 'success');
    } catch (error) {
      console.error('Add student error:', error);
      showToast('Failed to add student to database. Please try again.', 'error');
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudent) return;

    try {
      const updatedStudent: Student = {
        ...selectedStudent,
        ...formData
      };

      await studentsAPI.update(selectedStudent.id, updatedStudent);
      setStudents(students.map(s => s.id === selectedStudent.id ? updatedStudent : s));
      resetForm();
      setShowEditModal(false);
      setSelectedStudent(null);
      showToast('Student updated successfully', 'success');
    } catch (error) {
      console.error('Update student error:', error);
      showToast('Failed to update student. Please try again.', 'error');
    }
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to delete ${studentName}?`)) {
      return;
    }

    try {
      await studentsAPI.delete(studentId);
      setStudents(students.filter(s => s.id !== studentId));
      showToast(`${studentName} has been deleted`, 'success');
    } catch (error) {
      console.error('Delete student error:', error);
      showToast('Failed to delete student. Please try again.', 'error');
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowViewModal(true);
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      phone: student.phone,
      dob: student.dob,
      course: student.course,
      city: student.city,
      registrationDate: student.registrationDate,
      registrationType: student.registrationType,
      status: student.status,
      paymentStatus: student.paymentStatus,
      notes: student.notes || ''
    });
    setShowEditModal(true);
  };

  const handleFeesClick = (student: Student) => {
    setSelectedStudent(student);
    setShowFeesModal(true);
  };

  const handleNotesClick = (student: Student) => {
    setSelectedStudent(student);
    setFormData(prev => ({ ...prev, notes: student.notes || '' }));
    setShowNotesModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      dob: '',
      course: '',
      city: '',
      registrationDate: new Date().toISOString().split('T')[0],
      registrationType: 'regular',
      status: 'active',
      paymentStatus: 'pending',
      notes: ''
    });
  };

  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Name', 'Email', 'Phone', 'DOB', 'Course', 'City', 'Reg Date', 'Reg Type', 'Status', 'Payment'];
      const rows = filteredStudents.map(s => [
        s.id,
        s.name,
        s.email,
        s.phone,
        s.dob,
        s.course,
        s.city,
        s.registrationDate,
        s.registrationType,
        s.status,
        s.paymentStatus
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(`Exported ${filteredStudents.length} student(s) to CSV`, 'success');
    } catch (error) {
      showToast('Failed to export CSV', 'error');
    }
  };

  const updatePaymentStatus = async (studentId: string, status: 'paid' | 'pending' | 'failed') => {
    const student = students.find(s => s.id === studentId);
    if (student) {
      const updated = { ...student, paymentStatus: status };
      try {
        await studentsAPI.update(studentId, updated);
        setStudents(students.map(s => s.id === studentId ? updated : s));
        showToast(`Payment status updated to ${status}`, 'success');
      } catch (error) {
        console.error('Update payment status error:', error);
        showToast('Failed to update payment status', 'error');
      }
    }
  };

  const saveNotes = async () => {
    if (!selectedStudent) return;

    try {
      const updated = { ...selectedStudent, notes: formData.notes };
      await studentsAPI.update(selectedStudent.id, updated);
      setStudents(students.map(s => s.id === selectedStudent.id ? updated : s));
      setShowNotesModal(false);
      showToast('Notes saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save notes', 'error');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 animate-fade-in flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50/30 gap-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px] font-light">school</span>
            </div>
            Student Directory
          </h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 ml-13">Total: {students.length} students enrolled</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={loadStudents} className="px-4 py-2.5 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold rounded-xl uppercase tracking-wider hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
          <button onClick={handleExportCSV} className="px-4 py-2.5 bg-white border border-gray-200 text-green-600 text-[10px] font-bold rounded-xl uppercase tracking-wider hover:bg-green-50 transition-all shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="px-5 py-2.5 bg-gray-900 text-white text-[10px] font-bold rounded-xl shadow-md uppercase tracking-wider hover:bg-gray-800 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            Add Student
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap gap-4 items-center bg-white shrink-0">
        <div className="flex-1 relative min-w-[300px] group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px] group-focus-within:text-navy transition-colors">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-gray-100 rounded-2xl text-[14px] font-bold outline-none focus:bg-white focus:border-navy focus:ring-4 focus:ring-navy/5 transition-all shadow-sm placeholder:text-gray-400"
            placeholder="Search by student name, email, ID or mobile..."
          />
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-6 py-3 border rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm ${isFilterOpen || statusFilter !== 'all' || registrationFilter !== 'all' || paymentFilter !== 'all' ? 'bg-navy text-white border-navy shadow-lg shadow-navy/20' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Advanced Filters
              {(statusFilter !== 'all' || registrationFilter !== 'all' || paymentFilter !== 'all') && (
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              )}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] p-5 animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="flex justify-between items-center mb-5">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Filter Students</h4>
                  <button
                    onClick={() => { setStatusFilter('all'); setRegistrationFilter('all'); setPaymentFilter('all'); }}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Reset All
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Account Status</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['all', 'active', 'inactive'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${statusFilter === status ? 'bg-navy text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Registration Type</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['all', 'regular', 'bulk', 'referral'].map((type) => (
                        <button
                          key={type}
                          onClick={() => setRegistrationFilter(type)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${registrationFilter === type ? 'bg-navy text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-2">Payment Status</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['all', 'paid', 'pending', 'failed'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setPaymentFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${paymentFilter === status ? 'bg-navy text-white shadow-md' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-50">
                  <button onClick={() => setIsFilterOpen(false)} className="w-full py-2.5 bg-gray-50 text-navy text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-gray-100 transition-all">
                    Show {filteredStudents.length} Results
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="h-8 w-px bg-gray-200 mx-1"></div>

          <div className="text-[11px] font-black text-gray-400 bg-gray-50 px-4 py-3 rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-navy">{filteredStudents.length}</span> / {students.length}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <div className="animate-spin w-10 h-10 border-4 border-navy/20 border-t-navy rounded-full mb-4"></div>
            <p className="text-sm font-medium">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="material-icons-outlined text-6xl mb-4 text-gray-200">school</span>
            <p className="text-sm font-medium mb-2">No students found</p>
            <p className="text-xs text-gray-400">Add your first student to get started</p>
            <button onClick={() => { resetForm(); setShowAddModal(true); }} className="mt-4 px-4 py-2 bg-navy text-white text-xs font-bold rounded-lg">
              + Add Student
            </button>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50/50 font-bold text-gray-400 uppercase text-[9px] tracking-widest sticky top-0 z-10">
              <tr>
                <th className="px-4 py-4 border-b border-gray-100 font-bold">Student</th>
                <th className="px-4 py-4 border-b border-gray-100 font-bold">Contact</th>
                <th className="px-4 py-4 border-b border-gray-100 font-bold">Course</th>
                <th className="px-4 py-4 border-b border-gray-100 font-bold">Registration</th>
                <th className="px-4 py-4 border-b border-gray-100 text-center font-bold">Status</th>
                <th className="px-4 py-4 border-b border-gray-100 text-center font-bold">Payment</th>
                <th className="px-4 py-3 border-b border-gray-200 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedStudents.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center font-bold text-gray-700 text-sm border border-gray-200/50 overflow-hidden">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm tracking-tight">{s.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{s.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <span className="material-icons-outlined text-xs text-gray-400">email</span>
                        {s.email}
                      </p>
                      <p className="text-xs font-bold text-navy flex items-center gap-1">
                        <span className="material-icons-outlined text-xs text-gray-400">phone</span>
                        {s.phone}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase rounded-lg inline-block">
                      {s.course}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-xs text-gray-600">{new Date(s.registrationDate).toLocaleDateString('en-IN')}</p>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 font-medium text-[9px] uppercase rounded">
                        {s.registrationType}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase inline-flex items-center gap-1 ${s.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${s.paymentStatus === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : s.paymentStatus === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                      {s.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleViewStudent(s)} title="View Details" className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all">
                        <span className="material-icons-outlined text-sm">visibility</span>
                      </button>
                      <button onClick={() => handleEditClick(s)} title="Edit Student" className="p-2 bg-teal-100 text-teal-600 hover:bg-teal-600 hover:text-white rounded-lg transition-all">
                        <span className="material-icons-outlined text-sm">edit</span>
                      </button>
                      <button onClick={() => handleFeesClick(s)} title="Manage Fees" className="p-2 bg-green-100 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all">
                        <span className="material-icons-outlined text-sm">payments</span>
                      </button>
                      <button onClick={() => handleNotesClick(s)} title="Add Notes" className="p-2 bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all">
                        <span className="material-icons-outlined text-sm">sticky_note_2</span>
                      </button>
                      <button onClick={() => handleDeleteStudent(s.id, s.name)} title="Delete Student" className="p-2 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all">
                        <span className="material-icons-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredStudents.length > 0 && (
        <div className="p-4 border-t border-gray-200 flex flex-wrap justify-between items-center gap-4 bg-gray-50 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 outline-none cursor-pointer hover:border-navy/30 transition-all"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
            <span className="text-xs font-medium text-gray-500">per page</span>
          </div>

          <div className="text-xs font-medium text-gray-500">
            Showing <span className="font-bold text-navy">{startIndex + 1}</span> to <span className="font-bold text-navy">{Math.min(endIndex, filteredStudents.length)}</span> of <span className="font-bold text-navy">{filteredStudents.length}</span> students
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-200 text-navy rounded-lg hover:bg-navy hover:text-white hover:border-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="First Page"
            >
              <span className="material-icons-outlined text-sm">first_page</span>
            </button>
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-gray-200 text-navy rounded-lg hover:bg-navy hover:text-white hover:border-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-icons-outlined text-sm">chevron_left</span>
            </button>

            <div className="flex gap-1 mx-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else {
                  if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                      ? 'bg-navy text-white shadow-md'
                      : 'bg-white border border-gray-200 text-navy hover:bg-gray-100'
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-gray-200 text-navy rounded-lg hover:bg-navy hover:text-white hover:border-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-icons-outlined text-sm">chevron_right</span>
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-gray-200 text-navy rounded-lg hover:bg-navy hover:text-white hover:border-navy transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last Page"
            >
              <span className="material-icons-outlined text-sm">last_page</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-black text-navy uppercase">Add New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">DOB</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Course *</label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter course name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Reg. Type</label>
                  <select
                    value={formData.registrationType}
                    onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                  >
                    <option value="regular">Regular</option>
                    <option value="bulk">Bulk</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-navy text-[10px] font-black rounded-xl uppercase hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-navy text-white text-[10px] font-black rounded-xl uppercase hover:bg-blue-900 transition-all"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-black text-navy uppercase">Edit Student</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditStudent} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Student ID</label>
                  <input
                    type="text"
                    disabled
                    value={selectedStudent.id}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div></div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter email"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">DOB</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Course *</label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter course name"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Reg. Type</label>
                  <select
                    value={formData.registrationType}
                    onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                  >
                    <option value="regular">Regular</option>
                    <option value="bulk">Bulk</option>
                    <option value="referral">Referral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-navy text-[10px] font-black rounded-xl uppercase hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-navy text-white text-[10px] font-black rounded-xl uppercase hover:bg-blue-900 transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Student Modal */}
      {showViewModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-navy uppercase">Student Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-navy/10 rounded-xl flex items-center justify-center font-black text-navy text-lg">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="font-black text-navy uppercase tracking-tight">{selectedStudent.name}</p>
                  <p className="text-[10px] font-bold text-gray-300">{selectedStudent.id}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Email</p>
                  <p className="text-sm font-bold text-navy">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Phone</p>
                  <p className="text-sm font-bold text-navy">{selectedStudent.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">DOB</p>
                  <p className="text-sm font-bold text-navy">{new Date(selectedStudent.dob).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Course</p>
                  <p className="text-sm font-bold text-navy">{selectedStudent.course}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Reg. Date</p>
                  <p className="text-sm font-bold text-navy">{new Date(selectedStudent.registrationDate).toLocaleDateString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Reg. Type</p>
                  <p className="text-sm font-bold text-navy">{selectedStudent.registrationType}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-md text-[9px] font-black uppercase ${selectedStudent.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {selectedStudent.status}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Payment</p>
                  <span className={`inline-block px-3 py-1 rounded-md text-[9px] font-black uppercase ${selectedStudent.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : selectedStudent.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                    {selectedStudent.paymentStatus}
                  </span>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { handleEditClick(selectedStudent); setShowViewModal(false); }}
                  className="flex-1 px-4 py-3 bg-teal-100 text-teal-600 text-[10px] font-black rounded-xl uppercase hover:bg-teal-200 transition-all"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-navy text-[10px] font-black rounded-xl uppercase hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fees Management Modal */}
      {showFeesModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-navy uppercase">Manage Fees - {selectedStudent.name}</h3>
              <button onClick={() => setShowFeesModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Current Status</p>
                <span className={`inline-block px-4 py-2 rounded-lg text-[10px] font-black uppercase ${selectedStudent.paymentStatus === 'paid' ? 'bg-green-100 text-green-600' : selectedStudent.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                  {selectedStudent.paymentStatus}
                </span>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => updatePaymentStatus(selectedStudent.id, 'paid')}
                  className="w-full px-4 py-3 bg-green-100 text-green-600 text-[10px] font-black rounded-xl uppercase hover:bg-green-600 hover:text-white transition-all"
                >
                  Mark as Paid
                </button>
                <button
                  onClick={() => updatePaymentStatus(selectedStudent.id, 'pending')}
                  className="w-full px-4 py-3 bg-yellow-100 text-yellow-600 text-[10px] font-black rounded-xl uppercase hover:bg-yellow-600 hover:text-white transition-all"
                >
                  Mark as Pending
                </button>
                <button
                  onClick={() => updatePaymentStatus(selectedStudent.id, 'failed')}
                  className="w-full px-4 py-3 bg-red-100 text-red-600 text-[10px] font-black rounded-xl uppercase hover:bg-red-600 hover:text-white transition-all"
                >
                  Mark as Failed
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowFeesModal(false)}
                className="w-full px-4 py-3 bg-gray-100 text-navy text-[10px] font-black rounded-xl uppercase hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-black text-navy uppercase">Notes - {selectedStudent.name}</h3>
              <button onClick={() => setShowNotesModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-3 border border-gray-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-navy/5 resize-none h-32"
                placeholder="Add notes about this student..."
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNotesModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-navy text-[10px] font-black rounded-xl uppercase hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveNotes}
                  className="flex-1 px-4 py-3 bg-navy text-white text-[10px] font-black rounded-xl uppercase hover:bg-blue-900 transition-all"
                >
                  Save Notes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
