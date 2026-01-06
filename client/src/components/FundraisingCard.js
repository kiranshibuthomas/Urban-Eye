import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaUsers, FaClock } from 'react-icons/fa';

const FundraisingCard = ({ campaign }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const progressPercentage = Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100);
  const daysRemaining = Math.max(0, Math.ceil((new Date(campaign.endDate) - new Date()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
      {campaign.images && campaign.images.length > 0 && (
        <div className="h-32 bg-gray-200 overflow-hidden">
          <img
            src={campaign.images[0]}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
            {campaign.title}
          </h3>
          {campaign.isUrgent && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium ml-2">
              Urgent
            </span>
          )}
        </div>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-medium text-gray-700">
              {formatCurrency(campaign.raisedAmount)}
            </span>
            <span className="text-xs text-gray-500">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-green-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs text-gray-600">
            <span>Goal: {formatCurrency(campaign.targetAmount)}</span>
            <span className="flex items-center">
              <FaUsers className="mr-1" />
              {campaign.donorCount}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <div className="flex items-center">
            <FaClock className="mr-1" />
            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ended'}
          </div>
        </div>

        <Link
          to={`/fundraising/${campaign._id}`}
          className="w-full bg-blue-600 text-white py-2 px-3 rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center text-sm font-medium"
        >
          <FaHeart className="mr-2" />
          Donate Now
        </Link>
      </div>
    </div>
  );
};

export default FundraisingCard;