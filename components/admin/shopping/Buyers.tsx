import React, { useState, useEffect } from 'react';
import { buyersAPI } from '../../../src/services/apiClient';

interface Buyer {
  id: string;
  date: string;
  studentName: string;
  studentMobile: string;
  email: string;
  paymentMethod: string;
  amount: number;
  payoutAmount: number;
  coupon: string;
  method: string;
  status: 'successful' | 'failed' | 'pending';
}

interface Props {
  showToast: (m: string, type?: 'success' | 'error') => void;
}

const Buyers: React.FC<Props> = ({ showToast }) => {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [filteredBuyers, setFilteredBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedBuyers, setSelectedBuyers] = useState<string[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);
  
  const [formData, setFormData] = useState({
    studentName: '',
    studentMobile: '',
    email: '',
    paymentMethod: '',
    amount: '',
    payoutAmount: '',
    coupon: '',
    method: 'online',
    status: 'successful' as 'successful' | 'failed' | 'pending'
  });

  useEffect(() => {
    loadBuyers();
  }, []);

  useEffect(() => {
    let filtered = buyers;

    if (searchQuery) {
      filtered = filtered.filter(b =>
        b.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.studentMobile.includes(searchQuery) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(b => b.status === statusFilter);
    }

    setFilteredBuyers(filtered);
    setCurrentPage(1);
  }, [buyers, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredBuyers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBuyers = filteredBuyers.slice(startIndex, endIndex);

  const loadBuyers = async () => {
    try {
      setLoading(true);
      const data = await buyersAPI.getAll();
      setBuyers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.log('Starting with empty state - MongoDB may not have data yet');
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBuyer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentName || !formData.studentMobile || !formData.email || !formData.amount) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      const newBuyer: Buyer = {
        id: `BUY-${String(Date.now()).slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        studentName: formData.studentName,
        studentMobile: formData.studentMobile,
        email: formData.email,
        paymentMethod: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        payoutAmount: parseFloat(formData.payoutAmount) || parseFloat(formData.amount),
        coupon: formData.coupon,
        method: formData.method,
        status: formData.status
      };

      console.log('Adding new buyer:', newBuyer);
      await buyersAPI.create(newBuyer);
      setBuyers([...buyers, newBuyer]);
      resetForm();
      setShowAddModal(false);
      showToast(`Buyer ${newBuyer.studentName} added successfully!`, 'success');
    } catch (error) {
      console.error('Error adding buyer:', error);
      showToast('Failed to add buyer', 'error');
    }
  };

  const handleEditBuyer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBuyer) return;

    try {
      const updatedBuyer: Buyer = {
        ...selectedBuyer,
        studentName: formData.studentName,
        studentMobile: formData.studentMobile,
        email: formData.email,
        paymentMethod: formData.paymentMethod,
        amount: parseFloat(formData.amount),
        payoutAmount: parseFloat(formData.payoutAmount),
        coupon: formData.coupon,
        method: formData.method,
        status: formData.status
      };

      console.log('Updating buyer:', updatedBuyer);
      await buyersAPI.update(selectedBuyer.id, updatedBuyer);
      setBuyers(buyers.map(b => b.id === selectedBuyer.id ? updatedBuyer : b));
      resetForm();
      setShowEditModal(false);
      setSelectedBuyer(null);
      showToast('Buyer updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating buyer:', error);
      showToast('Failed to update buyer', 'error');
    }
  };

  const handleDeleteBuyer = async (buyerId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return;
    }

    try {
      console.log('Deleting buyer:', buyerId);
      await buyersAPI.delete(buyerId);
      setBuyers(buyers.filter(b => b.id !== buyerId));
      showToast(`${name} has been deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting buyer:', error);
      showToast('Failed to delete buyer', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBuyers.length === 0) return;
    if (!confirm(`Delete ${selectedBuyers.length} selected buyer(s)?`)) return;

    try {
      await Promise.all(selectedBuyers.map(id => buyersAPI.delete(id)));
      setBuyers(buyers.filter(b => !selectedBuyers.includes(b.id)));
      setSelectedBuyers([]);
      showToast(`${selectedBuyers.length} buyer(s) deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting buyers:', error);
      showToast('Failed to delete buyers', 'error');
    }
  };

  const handleEditClick = (buyer: Buyer) => {
    setSelectedBuyer(buyer);
    setFormData({
      studentName: buyer.studentName,
      studentMobile: buyer.studentMobile,
      email: buyer.email,
      paymentMethod: buyer.paymentMethod,
      amount: buyer.amount.toString(),
      payoutAmount: buyer.payoutAmount.toString(),
      coupon: buyer.coupon,
      method: buyer.method,
      status: buyer.status
    });
    setShowEditModal(true);
  };

  const toggleSelectAll = () => {
    if (selectedBuyers.length === paginatedBuyers.length) {
      setSelectedBuyers([]);
    } else {
      setSelectedBuyers(paginatedBuyers.map(b => b.id));
    }
  };

  const toggleSelectBuyer = (id: string) => {
    setSelectedBuyers(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setFormData({
      studentName: '',
      studentMobile: '',
      email: '',
      paymentMethod: '',
      amount: '',
      payoutAmount: '',
      coupon: '',
      method: 'online',
      status: 'successful'
    });
  };

  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Date', 'Student Name', 'Mobile', 'Email', 'Payment Method', 'Amount', 'Payout Amount', 'Coupon', 'Method', 'Status'];
      const rows = filteredBuyers.map(b => [
        b.id,
        b.date,
        b.studentName,
        b.studentMobile,
        b.email,
        b.paymentMethod,
        b.amount,
        b.payoutAmount,
        b.coupon,
        b.method,
        b.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `buyers-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showToast(`Exported ${filteredBuyers.length} buyer(s) to CSV`, 'success');
    } catch (error) {
      console.error('Export error:', error);
      showToast('Failed to export CSV', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-navy">Buyers List</h2>
          <p className="text-sm text-gray-500 mt-1">Manage all customer transactions</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          {selectedBuyers.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors flex items-center gap-2"
            >
              <span className="material-icons-outlined text-lg">delete</span>
              Delete ({selectedBuyers.length})
            </button>
          )}
          <button onClick={handleExportCSV} className="px-6 py-3 bg-white border border-gray-200 text-navy text-sm font-bold rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-2">
            <span className="material-icons-outlined text-lg">download</span>
            Export CSV
          </button>
          <button onClick={() => { resetForm(); setShowAddModal(true); }} className="px-6 py-3 bg-navy text-white text-sm font-bold rounded-xl hover:bg-navy/90 transition-colors flex items-center gap-2">
            <span className="material-icons-outlined text-lg">add</span>
            Add Buyer
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-wrap gap-4 items-center">
        <div className="flex-1 relative min-w-[250px]">
          <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20 transition-all"
            placeholder="Search by name, mobile, email..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 outline-none focus:ring-2 focus:ring-navy/20"
        >
          <option value="all">All Status</option>
          <option value="successful">Successful</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy mx-auto mb-2"></div>
              Loading buyers...
            </div>
          ) : filteredBuyers.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <span className="material-icons-outlined text-6xl text-gray-200 mb-2 block">shopping_cart</span>
              No buyers found
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedBuyers.length === paginatedBuyers.length && paginatedBuyers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-navy"
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payout Amount</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Coupon</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-4 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedBuyers.map((buyer, index) => (
                  <tr key={buyer.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedBuyers.includes(buyer.id)}
                        onChange={() => toggleSelectBuyer(buyer.id)}
                        className="w-4 h-4 rounded border-gray-300 text-navy"
                      />
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-gray-600">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-navy">{buyer.date}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-semibold text-navy">{buyer.studentName}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{buyer.studentMobile}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{buyer.email}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-blue-600">₹{buyer.amount}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm font-bold text-green-600">₹{buyer.payoutAmount}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">{buyer.coupon || 'N/A'}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block bg-blue-100 text-blue-600 px-2 py-1 rounded text-xs font-bold">{buyer.method}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                        buyer.status === 'successful' ? 'bg-green-100 text-green-600' :
                        buyer.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {buyer.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(buyer)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons-outlined text-lg">edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteBuyer(buyer.id, buyer.studentName)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <span className="material-icons-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {filteredBuyers.length > 0 && (
          <div className="p-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
            <p className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredBuyers.length)} of {filteredBuyers.length} entries
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-gray-100 text-navy text-sm font-bold rounded-lg disabled:opacity-50"
              >
                First
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-10 h-10 text-sm font-bold rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-navy text-white'
                        : 'bg-gray-100 text-navy hover:bg-gray-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-gray-100 text-navy text-sm font-bold rounded-lg disabled:opacity-50"
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Buyer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-black text-navy uppercase">Add New Buyer</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddBuyer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder="Enter student name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mobile *</label>
                  <input
                    type="tel"
                    value={formData.studentMobile}
                    onChange={(e) => setFormData({ ...formData, studentMobile: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder="Enter mobile number"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder="Enter email address"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Method</label>
                  <input
                    type="text"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder="E.g., UPI, Credit Card"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder="Enter amount"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payout Amount</label>
                  <input
                    type="number"
                    value={formData.payoutAmount}
                    onChange={(e) => setFormData({ ...formData, payoutAmount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder="Enter payout amount"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Coupon Code</label>
                  <input
                    type="text"
                    value={formData.coupon}
                    onChange={(e) => setFormData({ ...formData, coupon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    placeholder="Enter coupon code"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'successful' | 'pending' | 'failed' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                  >
                    <option value="successful">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy/90 transition-colors"
                >
                  Add Buyer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Buyer Modal */}
      {showEditModal && selectedBuyer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-black text-navy uppercase">Edit Buyer</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleEditBuyer} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Buyer ID</label>
                  <input
                    type="text"
                    disabled
                    value={selectedBuyer.id}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium bg-gray-50 cursor-not-allowed"
                  />
                </div>
                <div></div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Student Name *</label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mobile *</label>
                  <input
                    type="tel"
                    value={formData.studentMobile}
                    onChange={(e) => setFormData({ ...formData, studentMobile: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payment Method</label>
                  <input
                    type="text"
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Amount *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Payout Amount</label>
                  <input
                    type="number"
                    value={formData.payoutAmount}
                    onChange={(e) => setFormData({ ...formData, payoutAmount: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Coupon Code</label>
                  <input
                    type="text"
                    value={formData.coupon}
                    onChange={(e) => setFormData({ ...formData, coupon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Method</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'successful' | 'pending' | 'failed' })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm font-medium outline-none focus:ring-2 focus:ring-navy/20"
                  >
                    <option value="successful">Successful</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy/90 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buyers;
