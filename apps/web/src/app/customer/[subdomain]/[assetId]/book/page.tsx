'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';

export default function CustomerBookingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const assetId = params.assetId as string;

  const { data: response, isLoading, error: queryError } = client.assets.getAssetDetailsBySubdomain.useQuery({
    queryKey: ['asset-details', subdomain, assetId],
    queryData: {
      params: { subdomain, assetId },
    },
  });

  const asset = response?.status === 200 ? {
    id: response.body.id,
    name: response.body.name,
    description: response.body.description,
  } : null;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.endDate) errors.endDate = 'End date is required';
    if (!formData.customerName) errors.customerName = 'Name is required';
    if (!formData.customerEmail) {
      errors.customerEmail = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      errors.customerEmail = 'Invalid email format';
    }
    if (!formData.customerPhone) errors.customerPhone = 'Phone number is required';

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        errors.endDate = 'End date must be after start date';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Note: This is a simplified version. In a real implementation, you'd need to:
      // 1. Create or find the customer record first
      // 2. Then create the booking with the customer ID

      // For now, this is a placeholder that shows the structure
      // You'll need to implement the actual customer creation endpoint

      alert('Booking functionality requires customer management to be implemented first. This is a UI demo.');

      // Example of what the actual implementation would look like:
      /*
      const bookingResponse = await client.booking.createBooking({
        body: {
          booking: {
            assetId,
            startDate: new Date(formData.startDate),
            endDate: new Date(formData.endDate),
          },
          customers: [customerId], // You'd get this from customer creation
        },
      });

      if (bookingResponse.status === 201) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/customer/${subdomain}`);
        }, 2000);
      }
      */
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (queryError || !asset) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg">Failed to load asset information.</p>
          <Link
            href={`/customer/${subdomain}`}
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Assets
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-6">
            You'll receive a confirmation email shortly with your booking details.
          </p>
          <Link
            href={`/customer/${subdomain}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse More Assets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link
          href={`/customer/${subdomain}/${assetId}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to asset details
        </Link>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book {asset?.name}</h1>
          <p className="text-gray-600 mb-8">Fill out the form below to make a reservation</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date *
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.startDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.startDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.startDate}</p>
                )}
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date *
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.endDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.endDate && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.endDate}</p>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Information</h2>

              {/* Customer Name */}
              <div className="mb-4">
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.customerName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.customerName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customerName}</p>
                )}
              </div>

              {/* Customer Email */}
              <div className="mb-4">
                <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="customerEmail"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.customerEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.customerEmail && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customerEmail}</p>
                )}
              </div>

              {/* Customer Phone */}
              <div className="mb-4">
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="customerPhone"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.customerPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formErrors.customerPhone && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.customerPhone}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Processing...' : 'Confirm Booking'}
              </button>
              <Link
                href={`/customer/${subdomain}/${assetId}`}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center"
              >
                Cancel
              </Link>
            </div>

            <p className="text-sm text-gray-500 text-center">
              * Required fields
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
