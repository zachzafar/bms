'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { client } from '@/lib/api/publicClient';
import Link from 'next/link';

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const subdomain = params.subdomain as string;
  const bookingId = params.bookingId as string;
  const updateToken = params.updateToken as string;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch booking details
  const { data: bookingResponse, isLoading: bookingLoading, error: bookingError } = client.booking.getBooking.useQuery({
    queryKey: ['booking', bookingId],
    queryData: {
      params: { id: bookingId },
    },
  });

  const booking = bookingResponse?.status === 200 ? bookingResponse.body : null;

  // Update booking mutation
  const { mutate: updateBookingMutation } = client.booking.updateBookingByToken.useMutation();

  // Initialize form data when booking is loaded
  useEffect(() => {
    if (booking) {
      const startDate = new Date(booking.startDate);
      const endDate = new Date(booking.endDate);

      setFormData({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      });
    }
  }, [booking]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.startDate) errors.startDate = 'Start date is required';
    if (!formData.endDate) errors.endDate = 'End date is required';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !booking) {
      return;
    }

    setSubmitting(true);
    setError(null);

    updateBookingMutation(
      {
        params: {
          token: updateToken,
          bookingId: bookingId,
        },
        body: {
          id: bookingId,
          assetId: booking.asset.id,
          startDate: new Date(formData.startDate),
          endDate: new Date(formData.endDate),
          status: booking.status ?? 'confirmed',
          totalPrice: booking.totalPrice ?? '0',
        },
      },
      {
        onSuccess: (response) => {
          setSubmitting(false);
          if (response.status === 200) {
            setSuccess(true);
          } else if (response.status === 403) {
            setError('This update link has expired or is invalid. Please contact support.');
          } else {
            setError('Failed to update booking. Please try again.');
          }
        },
        onError: (err: any) => {
          setSubmitting(false);
          setError(err.message || 'Failed to update booking. Please try again.');
          console.error(err);
        },
      }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  if (bookingLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (bookingError || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">
            We couldn't find the booking you're trying to update. The link may be invalid or expired.
          </p>
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Updated!</h2>
          <p className="text-gray-600 mb-6">
            Your booking has been successfully updated. You'll receive a confirmation email with the new details.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2"><strong>Updated Booking Details:</strong></p>
            <p className="text-sm text-gray-600">
              {new Date(formData.startDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            <p className="text-sm text-gray-600 mb-1">to</p>
            <p className="text-sm text-gray-600">
              {new Date(formData.endDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Update Your Booking</h1>
            <p className="text-gray-600">Modify your reservation dates below</p>
          </div>

          {/* Current Booking Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Booking Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Booking ID:</span>
                <span className="font-medium text-gray-900">{booking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Asset:</span>
                <span className="font-medium text-gray-900">{booking.asset.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Customer:</span>
                <span className="font-medium text-gray-900">{booking.user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Price:</span>
                <span className="font-medium text-gray-900">${booking.totalPrice}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  New Start Date *
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
                  New End Date *
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

            {/* Warning Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="text-sm text-yellow-700">
                  <p className="font-medium mb-1">Please note:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Changing your dates may affect the total price</li>
                    <li>New dates are subject to availability</li>
                    <li>You'll receive an updated confirmation email</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Updating Booking...' : 'Update Booking'}
              </button>
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
