'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Calendar, Users, DollarSign, MapPin, Eye, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

interface Safari {
  _id: string;
  name: string;
  destination: string;
  duration: number;
  basePrice: number;
}

interface Booking {
  _id: string;
  bookingNumber: string;
  client: Client;
  safari: Safari;
  startDate: string;
  endDate: string;
  pax: number;
  totalPrice: number;
  depositAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string;
  specialRequests: string;
  createdAt: string;
  updatedAt: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [safaris, setSafaris] = useState<Safari[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  // Fetch bookings
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await fetch(`/api/bookings?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setBookings(data.data);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch clients and safaris for dropdowns
  const fetchClientsAndSafaris = async () => {
    try {
      const [clientsRes, safarisRes] = await Promise.all([
        fetch('/api/clients'),
        fetch('/api/safaris')
      ]);
      
      const [clientsData, safarisData] = await Promise.all([
        clientsRes.json(),
        safarisRes.json()
      ]);
      
      if (clientsData.success) setClients(clientsData.data);
      if (safarisData.success) setSafaris(safarisData.data);
    } catch (error) {
      console.error('Error fetching clients and safaris:', error);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchClientsAndSafaris();
  }, [searchTerm, statusFilter]);

  const handleCreateBooking = async (bookingData: any) => {
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        fetchBookings(); // Refresh the list
      } else {
        alert(data.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    }
  };

  const handleUpdateBooking = async (bookingData: any) => {
    try {
      const response = await fetch(`/api/bookings/${editingBooking?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingBooking(null);
        fetchBookings(); // Refresh the list
      } else {
        alert(data.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Failed to update booking');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchBookings(); // Refresh the list
      } else {
        alert(data.error || 'Failed to delete booking');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const handleOpenModal = () => {
    setShowCreateModal(true);
    setTimeout(() => {
      const modalElement = document.querySelector('[data-modal="create-booking"]');
      if (modalElement) {
        modalElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setTimeout(() => {
      const modalElement = document.querySelector('[data-modal="edit-booking"]');
      if (modalElement) {
        modalElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Booking Management
        </h1>
        <p className="text-gray-600">
          Manage client bookings and safari reservations
        </p>
      </div>

      {/* Action Bar */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <button 
              onClick={handleOpenModal}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </button>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
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
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Booking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Safari
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pax
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
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
                    Loading bookings...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">No bookings found</p>
                    <p className="text-sm">Create your first booking to get started</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.bookingNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.client.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.safari.name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {booking.safari.destination}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        to {new Date(booking.endDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Users className="h-4 w-4 mr-1" />
                        {booking.pax}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${booking.totalPrice.toLocaleString()}
                      </div>
                      {booking.depositAmount > 0 && (
                        <div className="text-sm text-gray-500">
                          Deposit: ${booking.depositAmount.toLocaleString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditBooking(booking)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit booking"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete booking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Booking Modal */}
      {showCreateModal && (
        <div className="mt-6">
          <BookingModal
            clients={clients}
            safaris={safaris}
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateBooking}
            data-modal="create-booking"
          />
        </div>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="mt-6">
          <BookingModal
            booking={editingBooking}
            clients={clients}
            safaris={safaris}
            onClose={() => setEditingBooking(null)}
            onSubmit={handleUpdateBooking}
            data-modal="edit-booking"
          />
        </div>
      )}
    </div>
  );
}

// Booking Modal Component
function BookingModal({ 
  booking, 
  clients,
  safaris,
  onClose, 
  onSubmit, 
  ...props 
}: { 
  booking?: Booking; 
  clients: Client[];
  safaris: Safari[];
  onClose: () => void; 
  onSubmit: (data: any) => void;
  [key: string]: any;
}) {
  const [formData, setFormData] = useState({
    clientId: booking?.client?._id || '',
    safariId: booking?.safari?._id || '',
    startDate: booking?.startDate ? new Date(booking.startDate).toISOString().split('T')[0] : '',
    endDate: booking?.endDate ? new Date(booking.endDate).toISOString().split('T')[0] : '',
    pax: booking?.pax?.toString() || '',
    totalPrice: booking?.totalPrice?.toString() || '',
    depositAmount: booking?.depositAmount?.toString() || '',
    status: booking?.status || 'pending',
    notes: booking?.notes || '',
    specialRequests: booking?.specialRequests || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSafari, setSelectedSafari] = useState<Safari | null>(null);

  // Update selected safari when safariId changes
  useEffect(() => {
    if (formData.safariId) {
      const safari = safaris.find(s => s._id === formData.safariId);
      setSelectedSafari(safari || null);
      
      // Auto-calculate total price based on safari base price and pax
      if (safari && formData.pax) {
        const paxCount = parseInt(formData.pax);
        const calculatedPrice = safari.basePrice * paxCount;
        setFormData(prev => ({ ...prev, totalPrice: calculatedPrice.toString() }));
      }
    }
  }, [formData.safariId, formData.pax, safaris]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.safariId) {
      newErrors.safariId = 'Safari is required';
    }

    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required';
    }

    if (!formData.endDate) {
      newErrors.endDate = 'End date is required';
    } else if (formData.startDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    if (!formData.pax || parseInt(formData.pax) < 1) {
      newErrors.pax = 'Pax must be at least 1';
    }

    if (!formData.totalPrice || parseFloat(formData.totalPrice) < 0) {
      newErrors.totalPrice = 'Total price must be 0 or greater';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      if (!booking) {
        // Reset form for new booking
        setFormData({
          clientId: '',
          safariId: '',
          startDate: '',
          endDate: '',
          pax: '',
          totalPrice: '',
          depositAmount: '',
          status: 'pending',
          notes: '',
          specialRequests: ''
        });
        setSelectedSafari(null);
      }
      setErrors({});
    } catch (error) {
      console.error('Error submitting booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 w-full max-w-4xl mx-auto" {...props}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {booking ? 'Edit Booking' : 'Create New Booking'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {booking ? 'Update booking details' : 'Create a new booking for a client'}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client *
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => handleInputChange('clientId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                errors.clientId
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-green-500 bg-white'
              }`}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name} - {client.email}
                </option>
              ))}
            </select>
            {errors.clientId && (
              <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
            )}
          </div>

          {/* Safari Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Safari Package *
            </label>
            <select
              value={formData.safariId}
              onChange={(e) => handleInputChange('safariId', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                errors.safariId
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-green-500 bg-white'
              }`}
            >
              <option value="">Select a safari</option>
              {safaris.map((safari) => (
                <option key={safari._id} value={safari._id}>
                  {safari.name} - {safari.destination} (${safari.basePrice})
                </option>
              ))}
            </select>
            {errors.safariId && (
              <p className="mt-1 text-sm text-red-600">{errors.safariId}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange('startDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                errors.startDate
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-green-500 bg-white'
              }`}
            />
            {errors.startDate && (
              <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleInputChange('endDate', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                errors.endDate
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-green-500 bg-white'
              }`}
            />
            {errors.endDate && (
              <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>
            )}
          </div>

          {/* Pax */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Pax *
            </label>
            <input
              type="number"
              min="1"
              value={formData.pax}
              onChange={(e) => handleInputChange('pax', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                errors.pax
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-green-500 bg-white'
              }`}
              placeholder="Enter number of people"
            />
            {errors.pax && (
              <p className="mt-1 text-sm text-red-600">{errors.pax}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Total Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Price (USD) *
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.totalPrice}
              onChange={(e) => handleInputChange('totalPrice', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                errors.totalPrice
                  ? 'border-red-300 focus:ring-red-500 bg-red-50'
                  : 'border-gray-300 focus:ring-green-500 bg-white'
              }`}
              placeholder="Enter total price"
            />
            {errors.totalPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.totalPrice}</p>
            )}
            {selectedSafari && (
              <p className="mt-1 text-xs text-gray-500">
                Base price: ${selectedSafari.basePrice} × {formData.pax || 0} pax = ${(selectedSafari.basePrice * (parseInt(formData.pax) || 0)).toLocaleString()}
              </p>
            )}
          </div>

          {/* Deposit Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deposit Amount (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.depositAmount}
              onChange={(e) => handleInputChange('depositAmount', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
              placeholder="Enter deposit amount"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
            placeholder="Additional notes about the booking"
          />
        </div>

        {/* Special Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Requests
          </label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => handleInputChange('specialRequests', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
            placeholder="Any special requests from the client"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {booking ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              booking ? 'Update Booking' : 'Create Booking'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}