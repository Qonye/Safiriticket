'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, MapPin, Calendar, DollarSign, Users, Eye, EyeOff } from 'lucide-react';

interface Safari {
  _id: string;
  name: string;
  description: string;
  destination: string;
  duration: number;
  maxPax: number;
  basePrice: number;
  inclusions: string[];
  exclusions: string[];
  itinerary: Array<{
    day: number;
    title: string;
    description: string;
    activities: string[];
  }>;
  accommodation: Array<{
    name: string;
    location: string;
    type: string;
    nights: number;
    price: number;
  }>;
  activities: Array<{
    name: string;
    description: string;
    duration: string;
    price: number;
  }>;
  transportation: Array<{
    type: string;
    description: string;
    price: number;
  }>;
  meals: Array<{
    type: string;
    description: string;
    price: number;
  }>;
  parkFees: Array<{
    park: string;
    description: string;
    price: number;
  }>;
  guides: Array<{
    name: string;
    type: string;
    price: number;
  }>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SafarisPage() {
  const [safaris, setSafaris] = useState<Safari[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSafari, setEditingSafari] = useState<Safari | null>(null);

  // Fetch safaris
  const fetchSafaris = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/safaris?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setSafaris(data.data);
      }
    } catch (error) {
      console.error('Error fetching safaris:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafaris();
  }, [searchTerm]);

  const handleCreateSafari = async (safariData: any) => {
    try {
      const response = await fetch('/api/safaris', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(safariData),
      });

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        fetchSafaris(); // Refresh the list
      } else {
        alert(data.error || 'Failed to create safari');
      }
    } catch (error) {
      console.error('Error creating safari:', error);
      alert('Failed to create safari');
    }
  };

  const handleUpdateSafari = async (safariData: any) => {
    try {
      const response = await fetch(`/api/safaris/${editingSafari?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(safariData),
      });

      const data = await response.json();
      
      if (data.success) {
        setEditingSafari(null);
        fetchSafaris(); // Refresh the list
      } else {
        alert(data.error || 'Failed to update safari');
      }
    } catch (error) {
      console.error('Error updating safari:', error);
      alert('Failed to update safari');
    }
  };

  const handleDeleteSafari = async (safariId: string) => {
    if (!confirm('Are you sure you want to delete this safari?')) {
      return;
    }

    try {
      const response = await fetch(`/api/safaris/${safariId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        fetchSafaris(); // Refresh the list
      } else {
        alert(data.error || 'Failed to delete safari');
      }
    } catch (error) {
      console.error('Error deleting safari:', error);
      alert('Failed to delete safari');
    }
  };

  const handleOpenModal = () => {
    setShowCreateModal(true);
    setTimeout(() => {
      const modalElement = document.querySelector('[data-modal="create-safari"]');
      if (modalElement) {
        modalElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleEditSafari = (safari: Safari) => {
    setEditingSafari(safari);
    setTimeout(() => {
      const modalElement = document.querySelector('[data-modal="edit-safari"]');
      if (modalElement) {
        modalElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Safari Management
        </h1>
        <p className="text-gray-600">
          Create and manage custom à la carte safari packages
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
              Create Safari
            </button>
          </div>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search safaris..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Safaris Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Loading safaris...
          </div>
        ) : safaris.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg mb-2">No safaris found</p>
            <p className="text-sm">Create your first safari package to get started</p>
          </div>
        ) : (
          safaris.map((safari) => (
            <div key={safari._id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {safari.name}
                    </h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {safari.destination}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditSafari(safari)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit safari"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSafari(safari._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete safari"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {safari.description}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {safari.duration} days
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    Max {safari.maxPax} pax
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center text-lg font-semibold text-green-600">
                    <DollarSign className="h-5 w-5 mr-1" />
                    ${safari.basePrice.toLocaleString()}
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    safari.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {safari.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Inclusions: {safari.inclusions.length}</span>
                    <span>Itinerary: {safari.itinerary.length} days</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Safari Modal */}
      {showCreateModal && (
        <div className="mt-6">
          <SafariModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateSafari}
            data-modal="create-safari"
          />
        </div>
      )}

      {/* Edit Safari Modal */}
      {editingSafari && (
        <div className="mt-6">
          <SafariModal
            safari={editingSafari}
            onClose={() => setEditingSafari(null)}
            onSubmit={handleUpdateSafari}
            data-modal="edit-safari"
          />
        </div>
      )}
    </div>
  );
}

// Safari Modal Component
function SafariModal({ 
  safari, 
  onClose, 
  onSubmit, 
  ...props 
}: { 
  safari?: Safari; 
  onClose: () => void; 
  onSubmit: (data: any) => void;
  [key: string]: any;
}) {
  const [formData, setFormData] = useState({
    name: safari?.name || '',
    description: safari?.description || '',
    destination: safari?.destination || '',
    duration: safari?.duration?.toString() || '',
    maxPax: safari?.maxPax?.toString() || '',
    basePrice: safari?.basePrice?.toString() || '',
    inclusions: safari?.inclusions || [],
    exclusions: safari?.exclusions || [],
    itinerary: safari?.itinerary || [],
    accommodation: safari?.accommodation || [],
    activities: safari?.activities || [],
    transportation: safari?.transportation || [],
    meals: safari?.meals || [],
    parkFees: safari?.parkFees || [],
    guides: safari?.guides || [],
    isActive: safari?.isActive !== undefined ? safari.isActive : true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Safari name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.destination.trim()) {
      newErrors.destination = 'Destination is required';
    }

    if (!formData.duration || parseInt(formData.duration) < 1) {
      newErrors.duration = 'Duration must be at least 1 day';
    }

    if (!formData.maxPax || parseInt(formData.maxPax) < 1) {
      newErrors.maxPax = 'Max pax must be at least 1';
    }

    if (!formData.basePrice || parseFloat(formData.basePrice) < 0) {
      newErrors.basePrice = 'Base price must be 0 or greater';
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
      if (!safari) {
        // Reset form for new safari
        setFormData({
          name: '',
          description: '',
          destination: '',
          duration: '',
          maxPax: '',
          basePrice: '',
          inclusions: [],
          exclusions: [],
          itinerary: [],
          accommodation: [],
          activities: [],
          transportation: [],
          meals: [],
          parkFees: [],
          guides: [],
          isActive: true
        });
      }
      setErrors({});
    } catch (error) {
      console.error('Error submitting safari:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const addArrayItem = (field: keyof typeof formData, item: any) => {
    const currentArray = formData[field] as any[];
    setFormData({ ...formData, [field]: [...currentArray, item] });
  };

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    const currentArray = formData[field] as any[];
    setFormData({ 
      ...formData, 
      [field]: currentArray.filter((_: any, i: number) => i !== index) 
    });
  };

  const updateArrayItem = (field: keyof typeof formData, index: number, item: any) => {
    const currentArray = formData[field] as any[];
    const newArray = [...currentArray];
    newArray[index] = item;
    setFormData({ ...formData, [field]: newArray });
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 w-full max-w-6xl mx-auto" {...props}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {safari ? 'Edit Safari Package' : 'Create New Safari Package'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {safari ? 'Update safari package details' : 'Create a custom à la carte safari package'}
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'basic', name: 'Basic Info' },
            { id: 'content', name: 'Content' },
            { id: 'itinerary', name: 'Itinerary' },
            { id: 'pricing', name: 'Pricing' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        {activeTab === 'basic' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Safari Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                    errors.name
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-green-500 bg-white'
                  }`}
                  placeholder="Enter safari name"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination *
                </label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                    errors.destination
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-green-500 bg-white'
                  }`}
                  placeholder="Enter destination"
                />
                {errors.destination && (
                  <p className="mt-1 text-sm text-red-600">{errors.destination}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (days) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                    errors.duration
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-green-500 bg-white'
                  }`}
                  placeholder="Enter duration in days"
                />
                {errors.duration && (
                  <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Pax *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxPax}
                  onChange={(e) => handleInputChange('maxPax', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                    errors.maxPax
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-green-500 bg-white'
                  }`}
                  placeholder="Enter maximum pax"
                />
                {errors.maxPax && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxPax}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (USD) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange('basePrice', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                    errors.basePrice
                      ? 'border-red-300 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-green-500 bg-white'
                  }`}
                  placeholder="Enter base price"
                />
                {errors.basePrice && (
                  <p className="mt-1 text-sm text-red-600">{errors.basePrice}</p>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Active Safari
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors text-gray-900 ${
                  errors.description
                    ? 'border-red-300 focus:ring-red-500 bg-red-50'
                    : 'border-gray-300 focus:ring-green-500 bg-white'
                }`}
                placeholder="Enter safari description"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Inclusions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Inclusions
              </label>
              <div className="space-y-2">
                {formData.inclusions.map((inclusion, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inclusion}
                      onChange={(e) => updateArrayItem('inclusions', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      placeholder="Enter inclusion item"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('inclusions', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('inclusions', '')}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  + Add Inclusion
                </button>
              </div>
            </div>

            {/* Exclusions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exclusions
              </label>
              <div className="space-y-2">
                {formData.exclusions.map((exclusion, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={exclusion}
                      onChange={(e) => updateArrayItem('exclusions', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      placeholder="Enter exclusion item"
                    />
                    <button
                      type="button"
                      onClick={() => removeArrayItem('exclusions', index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('exclusions', '')}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  + Add Exclusion
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Daily Itinerary</h3>
              <button
                type="button"
                onClick={() => addArrayItem('itinerary', { day: formData.itinerary.length + 1, title: '', description: '', activities: [] })}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                + Add Day
              </button>
            </div>

            {formData.itinerary.map((day, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">Day {day.day}</h4>
                  <button
                    type="button"
                    onClick={() => removeArrayItem('itinerary', index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day Title
                    </label>
                    <input
                      type="text"
                      value={day.title}
                      onChange={(e) => updateArrayItem('itinerary', index, { ...day, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                      placeholder="Enter day title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day Number
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={day.day}
                      onChange={(e) => updateArrayItem('itinerary', index, { ...day, day: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={day.description}
                    onChange={(e) => updateArrayItem('itinerary', index, { ...day, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                    placeholder="Enter day description"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600">
              Configure detailed pricing for different components of your safari package.
            </p>
            
            {/* Accommodation */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Accommodation</h3>
              <div className="space-y-4">
                {formData.accommodation.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-gray-900">Accommodation {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeArrayItem('accommodation', index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateArrayItem('accommodation', index, { ...item, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="Name"
                      />
                      <input
                        type="text"
                        value={item.location}
                        onChange={(e) => updateArrayItem('accommodation', index, { ...item, location: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="Location"
                      />
                      <input
                        type="text"
                        value={item.type}
                        onChange={(e) => updateArrayItem('accommodation', index, { ...item, type: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="Type"
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateArrayItem('accommodation', index, { ...item, price: parseFloat(e.target.value) || 0 })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-gray-900"
                        placeholder="Price"
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('accommodation', { name: '', location: '', type: '', nights: 1, price: 0 })}
                  className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-500 hover:text-green-600 transition-colors"
                >
                  + Add Accommodation
                </button>
              </div>
            </div>

            {/* Similar sections for Activities, Transportation, Meals, Park Fees, Guides */}
            <div className="text-center text-gray-500 py-8">
              <p>Additional pricing sections (Activities, Transportation, Meals, Park Fees, Guides) will be implemented in the next iteration.</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
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
                {safari ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              safari ? 'Update Safari' : 'Create Safari'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}