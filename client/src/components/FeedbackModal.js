import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FaStar, FaTimes } from 'react-icons/fa';

const FeedbackModal = ({ complaint, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    overallSatisfaction: 0,
    responseTime: 0,
    workQuality: 0,
    communication: 0,
    professionalism: 0,
    comment: '',
    wouldRecommend: true,
    isAnonymous: false
  });
  const [hoveredRating, setHoveredRating] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const ratingCategories = [
    { key: 'overallSatisfaction', label: 'Overall Satisfaction', required: true },
    { key: 'responseTime', label: 'Response Time', required: false },
    { key: 'workQuality', label: 'Work Quality', required: false },
    { key: 'communication', label: 'Communication', required: false },
    { key: 'professionalism', label: 'Professionalism', required: false }
  ];

  const handleRatingClick = (category, rating) => {
    setFormData(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.overallSatisfaction === 0) {
      toast.error('Please provide an overall satisfaction rating');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/analytics/feedback`,
        {
          complaintId: complaint._id,
          ...formData
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success('Thank you for your feedback!');
        onSubmit && onSubmit(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error(error.response?.data?.message || 'Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ category, value, required }) => {
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {category.label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(category.key, star)}
              onMouseEnter={() => setHoveredRating({ ...hoveredRating, [category.key]: star })}
              onMouseLeave={() => setHoveredRating({ ...hoveredRating, [category.key]: 0 })}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <FaStar
                size={32}
                className={
                  star <= (hoveredRating[category.key] || value)
                    ? 'text-yellow-400'
                    : 'text-gray-300'
                }
              />
            </button>
          ))}
          {value > 0 && (
            <span className="ml-2 text-sm text-gray-600 self-center">
              {value}/5
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rate Your Experience</h2>
            <p className="text-sm text-gray-600 mt-1">
              Help us improve by sharing your feedback
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Complaint Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-1">{complaint.title}</h3>
            <p className="text-sm text-gray-600">
              Category: <span className="capitalize">{complaint.category?.replace('_', ' ')}</span>
            </p>
          </div>

          {/* Rating Categories */}
          <div className="space-y-4 mb-6">
            {ratingCategories.map((category) => (
              <StarRating
                key={category.key}
                category={category}
                value={formData[category.key]}
                required={category.required}
              />
            ))}
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments
            </label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Share your experience in detail..."
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.comment.length}/1000 characters
            </p>
          </div>

          {/* Would Recommend */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.wouldRecommend}
                onChange={(e) => setFormData({ ...formData, wouldRecommend: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                I would recommend this service to others
              </span>
            </label>
          </div>

          {/* Anonymous */}
          <div className="mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                Submit feedback anonymously
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting || formData.overallSatisfaction === 0}
            >
              {submitting ? 'Submitting...' : 'Submit Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackModal;
