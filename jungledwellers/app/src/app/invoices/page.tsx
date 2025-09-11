'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Download, Eye, DollarSign, Calendar, User, MapPin, Printer, X, Save } from 'lucide-react';
import { previewPDF as previewPDFUtil, downloadPDF as downloadPDFUtil } from '@/lib/pdf-download';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
}

interface Safari {
  _id: string;
  title: string;
  duration: number;
  basePrice: number;
}

interface Booking {
  _id: string;
  bookingNumber: string;
  startDate: string;
  endDate: string;
  pax: number;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: 'accommodation' | 'activities' | 'transportation' | 'meals' | 'park_fees' | 'guides' | 'other';
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  client: Client;
  booking?: Booking;
  safari?: Safari;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'KES' | 'CAD' | 'AUD';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  paidDate?: string;
  paymentMethod?: string;
  notes?: string;
  termsAndConditions?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [loadingPDF, setLoadingPDF] = useState<string | null>(null);
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInvoices, setTotalInvoices] = useState(0);

  // Debounced search state
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term to reduce API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Reset to first page when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Fetch invoices
  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (debouncedSearchTerm) params.append('search', debouncedSearchTerm);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', currentPage.toString());
      params.append('limit', '20'); // Load 20 invoices per page
      
      const response = await fetch(`/api/invoices?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setInvoices(data.data);
        setTotalPages(data.pagination?.pages || 1);
        setTotalInvoices(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, statusFilter, currentPage]);

  // Fetch bookings for invoice generation (only essential data)
  const fetchBookings = async () => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '100'); // Limit to recent bookings
      params.append('status', 'confirmed'); // Only confirmed bookings
      
      const response = await fetch(`/api/bookings?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  // Fetch invoices on mount and when debounced search or filters change
  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Fetch bookings only when needed (when modal opens)
  const handleOpenCreateModal = async () => {
    setShowCreateModal(true);
    if (bookings.length === 0) {
      await fetchBookings();
    }
  };

  const handleGenerateFromBooking = async (bookingId: string, currency?: string, paymentPresetId?: string) => {
    try {
      setGeneratingInvoice(bookingId);
      const response = await fetch('/api/invoices/generate-from-booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          bookingId, 
          currency, 
          paymentPresetId 
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        fetchInvoices(); // Refresh the list
        alert('Invoice generated successfully!');
      } else {
        alert(data.error || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice');
    } finally {
      setGeneratingInvoice(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) {
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${invoiceId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchInvoices(); // Refresh the list
      } else {
        alert(data.error || 'Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    }
  };

  const generatePDF = async (invoice: Invoice) => {
    try {
      setLoadingPDF(invoice._id);
      const response = await fetch('/api/invoices/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const html = await response.text();
      
      // Download PDF using html2pdf.js
      const filename = `${invoice.invoiceNumber || 'invoice'}.pdf`;
      await downloadPDFUtil(html, filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoadingPDF(null);
    }
  };

  const previewPDF = async (invoice: Invoice) => {
    try {
      setLoadingPDF(invoice._id + '_preview');
      const response = await fetch('/api/invoices/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoice._id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const html = await response.text();
      
      // Preview PDF using html2pdf.js
      await previewPDFUtil(html);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoadingPDF(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Invoice Management
        </h1>
        <p className="text-gray-600">
          Create and manage invoices for your safari bookings
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button 
              onClick={handleOpenCreateModal}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Invoice
            </button>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Safari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No invoices found</p>
                    <p className="text-sm">Create your first invoice to get started</p>
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.invoiceNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(invoice.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.client.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.safari?.title || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {invoice.safari?.title || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {invoice.booking ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.booking.bookingNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {invoice.booking.pax} pax
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </div>
                      {invoice.taxAmount > 0 && (
                        <div className="text-sm text-gray-500">
                          + {formatCurrency(invoice.taxAmount)} tax
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(invoice.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingInvoice(invoice)}
                          className="flex items-center px-3 py-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium"
                          title="View/Edit invoice"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => generatePDF(invoice)}
                          disabled={loadingPDF === invoice._id}
                          className="flex items-center px-3 py-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Download PDF"
                        >
                          {loadingPDF === invoice._id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-1"></div>
                              PDF...
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3 mr-1" />
                              PDF
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => previewPDF(invoice)}
                          disabled={loadingPDF === invoice._id + '_preview'}
                          className="flex items-center px-3 py-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Preview PDF"
                        >
                          {loadingPDF === invoice._id + '_preview' ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-purple-600 mr-1"></div>
                              Preview...
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteInvoice(invoice._id)}
                          className="flex items-center px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs font-medium"
                          title="Delete invoice"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center text-sm text-gray-700">
              Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalInvoices)} of {totalInvoices} invoices
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generate from Booking Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <GenerateInvoiceModal
            bookings={bookings}
            onClose={() => setShowCreateModal(false)}
            onGenerate={handleGenerateFromBooking}
            isGenerating={generatingInvoice}
            data-modal="generate-invoice"
          />
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <InvoiceModal
            invoice={editingInvoice}
            onClose={() => setEditingInvoice(null)}
            onUpdate={() => {
              setEditingInvoice(null);
              fetchInvoices();
            }}
            loadingPDF={loadingPDF}
            onGeneratePDF={generatePDF}
            onPreviewPDF={previewPDF}
            data-modal="edit-invoice"
          />
        </div>
      )}
    </div>
  );
}

// Generate Invoice Modal Component
function GenerateInvoiceModal({ 
  bookings, 
  onClose, 
  onGenerate,
  isGenerating,
  ...props 
}: { 
  bookings: Booking[];
  onClose: () => void; 
  onGenerate: (bookingId: string, currency?: string, paymentPresetId?: string) => void;
  isGenerating: string | null;
  [key: string]: any;
}) {
  const [selectedBooking, setSelectedBooking] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [selectedPaymentPreset, setSelectedPaymentPreset] = useState('');
  const [paymentPresets, setPaymentPresets] = useState<any[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);

  // Available currencies
  const currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'KES', label: 'KES - Kenyan Shilling' },
    { value: 'CAD', label: 'CAD - Canadian Dollar' },
    { value: 'AUD', label: 'AUD - Australian Dollar' }
  ];

  // Fetch payment presets when currency changes
  const fetchPaymentPresets = async (currency: string) => {
    try {
      setLoadingPresets(true);
      const response = await fetch(`/api/payment-presets?currency=${currency}&active=true`);
      const data = await response.json();
      
      if (data.success) {
        setPaymentPresets(data.data);
        // Auto-select default preset if available
        const defaultPreset = data.data.find((preset: any) => preset.isDefault);
        if (defaultPreset) {
          setSelectedPaymentPreset(defaultPreset._id);
        } else if (data.data.length > 0) {
          setSelectedPaymentPreset(data.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching payment presets:', error);
    } finally {
      setLoadingPresets(false);
    }
  };

  // Load presets when component mounts or currency changes
  useEffect(() => {
    fetchPaymentPresets(selectedCurrency);
  }, [selectedCurrency]);

  const handleGenerate = () => {
    if (selectedBooking) {
      onGenerate(selectedBooking, selectedCurrency, selectedPaymentPreset);
      if (!isGenerating) {
        onClose();
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 w-full max-w-2xl mx-auto" {...props}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Generate Invoice from Booking
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Select a booking to automatically generate an invoice
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Booking
          </label>
          <select
            value={selectedBooking}
            onChange={(e) => setSelectedBooking(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
          >
            <option value="">Choose a booking...</option>
            {bookings.map((booking) => (
              <option key={booking._id} value={booking._id}>
                {booking.bookingNumber} - {new Date(booking.startDate).toLocaleDateString()} to {new Date(booking.endDate).toLocaleDateString()} ({booking.pax} pax)
              </option>
            ))}
          </select>
        </div>

        {/* Currency Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
          >
            {currencies.map((currency) => (
              <option key={currency.value} value={currency.value}>
                {currency.label}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Preset Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Details
          </label>
          <select
            value={selectedPaymentPreset}
            onChange={(e) => setSelectedPaymentPreset(e.target.value)}
            disabled={loadingPresets || paymentPresets.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            {loadingPresets ? (
              <option value="">Loading payment options...</option>
            ) : paymentPresets.length === 0 ? (
              <option value="">No payment options available for {selectedCurrency}</option>
            ) : (
              <>
                <option value="">Choose payment details...</option>
                {paymentPresets.map((preset) => (
                  <option key={preset._id} value={preset._id}>
                    {preset.name} - {preset.accountNumber}
                  </option>
                ))}
              </>
            )}
          </select>
          
          {/* Payment Details Preview */}
          {selectedPaymentPreset && !loadingPresets && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Payment Details:</h4>
              {(() => {
                const preset = paymentPresets.find(p => p._id === selectedPaymentPreset);
                return preset ? (
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><span className="font-medium">Account:</span> {preset.accountName}</div>
                    <div><span className="font-medium">Number:</span> {preset.accountNumber}</div>
                    <div><span className="font-medium">Bank:</span> {preset.bankName}</div>
                    <div><span className="font-medium">SWIFT:</span> {preset.swiftCode}</div>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Automatic Invoice Generation
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>The invoice will be automatically generated with:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Client information from the booking</li>
                  <li>Safari package details and pricing</li>
                  <li>All inclusions, activities, and additional services</li>
                  <li>Calculated totals based on pax count</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!selectedBooking || isGenerating === selectedBooking}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isGenerating === selectedBooking ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              'Generate Invoice'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Invoice Modal Component (for viewing/editing)
function InvoiceModal({ 
  invoice,
  onClose, 
  onUpdate,
  loadingPDF,
  onGeneratePDF,
  onPreviewPDF,
  ...props 
}: { 
  invoice: Invoice;
  onClose: () => void; 
  onUpdate: () => void;
  loadingPDF: string | null;
  onGeneratePDF: (invoice: Invoice) => void;
  onPreviewPDF: (invoice: Invoice) => void;
  [key: string]: any;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    status: invoice.status,
    notes: invoice.notes || '',
    termsAndConditions: invoice.termsAndConditions || ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', 
      currency: 'USD',
    }).format(amount);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/invoices/${invoice._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();
      
      if (data.success) {
        setIsEditing(false);
        onUpdate();
        alert('Invoice updated successfully!');
      } else {
        alert(data.error || 'Failed to update invoice');
      }
    } catch (error) {
      console.error('Error updating invoice:', error);
      alert('Failed to update invoice');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 w-full max-w-4xl mx-auto" {...props}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Invoice {invoice.invoiceNumber}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {invoice.client.name} - {invoice.safari?.title || 'N/A'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
              isEditing 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Client Info */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bill To</h3>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{invoice.client.name}</p>
              <p>{invoice.client.email}</p>
              {invoice.client.phone && <p>{invoice.client.phone}</p>}
              {invoice.client.company && <p>{invoice.client.company}</p>}
            </div>
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Invoice Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Invoice #:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-medium">Date:</span> {new Date(invoice.createdAt).toLocaleDateString()}</p>
              <p><span className="font-medium">Due Date:</span> {new Date(invoice.dueDate).toLocaleDateString()}</p>
              <div className="flex items-center">
                <span className="font-medium mr-2">Status:</span>
                {isEditing ? (
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value as any})}
                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="sent">Sent</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                ) : (
                  <span className="capitalize">{invoice.status}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Items</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item, index) => {
                  const isInformational = item.total === 0 && item.unitPrice === 0;
                  const isSubItem = item.description.startsWith('  ');
                  
                  return (
                    <tr key={index} className={isSubItem ? 'bg-gray-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isSubItem ? 'text-gray-600 ml-4' : 'text-gray-900'}`}>
                          {item.description}
                        </div>
                        {!isSubItem && (
                          <div className="text-sm text-gray-500">{item.category}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isInformational ? '-' : item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {isInformational ? '-' : formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {isInformational ? '-' : formatCurrency(item.total)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax ({invoice.taxRate}%):</span>
                  <span className="text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-medium border-t border-gray-200 pt-2">
                <span className="text-gray-900">Total:</span>
                <span className="text-gray-900">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes and Terms */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Notes</h3>
            {isEditing ? (
              <textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
                placeholder="Add notes..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="text-sm text-gray-600">{invoice.notes || 'No notes'}</p>
            )}
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Terms & Conditions</h3>
            {isEditing ? (
              <textarea
                value={editFormData.termsAndConditions}
                onChange={(e) => setEditFormData({...editFormData, termsAndConditions: e.target.value})}
                placeholder="Add terms and conditions..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            ) : (
              <p className="text-sm text-gray-600">{invoice.termsAndConditions || 'No terms and conditions'}</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={() => onPreviewPDF(invoice)}
              disabled={loadingPDF === invoice._id + '_preview'}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPDF === invoice._id + '_preview' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Previewing...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview PDF
                </>
              )}
            </button>
            <button
              onClick={() => onGeneratePDF(invoice)}
              disabled={loadingPDF === invoice._id}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingPDF === invoice._id ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Download PDF
                </>
              )}
            </button>
          </div>
          <div className="flex space-x-3">
            {isEditing && (
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
