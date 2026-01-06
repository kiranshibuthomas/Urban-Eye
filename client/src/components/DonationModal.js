import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { FaTimes, FaHeart, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';

const DonationModal = ({ campaign, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [customAmount, setCustomAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const predefinedAmounts = [100, 500, 1000, 2000, 5000, 10000];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleAmountSelect = (selectedAmount) => {
    setAmount(selectedAmount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d+$/.test(value)) {
      setCustomAmount(value);
      setAmount(value ? parseInt(value) : '');
    }
  };

  const getDonationAmount = () => {
    return customAmount ? parseInt(customAmount) : amount;
  };

  const handleDonate = async () => {
    const donationAmount = getDonationAmount();
    
    if (!donationAmount || donationAmount < 1) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    if (donationAmount > 500000) {
      toast.error('Maximum donation amount is ₹5,00,000');
      return;
    }

    try {
      setLoading(true);

      // Create Razorpay order
      const orderResponse = await axios.post('/donations/create-order', {
        campaignId: campaign._id,
        amount: donationAmount,
        isAnonymous,
        message: message.trim()
      });

      const { orderId, amount: orderAmount, currency, donationId } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderAmount,
        currency: currency,
        name: 'UrbanEye Fundraising',
        description: `Donation for: ${campaign.title}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verifyResponse = await axios.post('/donations/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              donationId: donationId
            });

            toast.success('Donation successful! Thank you for your contribution.');
            onSuccess();
          } catch (error) {
            console.error('Payment verification failed:', error);
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        notes: {
          campaign_id: campaign._id,
          campaign_title: campaign.title
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error creating donation order:', error);
      toast.error(error.response?.data?.message || 'Failed to process donation');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <FaHeart className="mr-2 text-red-500" />
            Make a Donation
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Campaign Info */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">{campaign.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Goal: {formatCurrency(campaign.targetAmount)}</span>
              <span>Raised: {formatCurrency(campaign.raisedAmount)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ 
                  width: `${Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Amount Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select donation amount
            </label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {predefinedAmounts.map((preAmount) => (
                <button
                  key={preAmount}
                  onClick={() => handleAmountSelect(preAmount)}
                  className={`p-3 text-sm font-medium rounded-lg border transition-colors ${
                    amount === preAmount && !customAmount
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {formatCurrency(preAmount)}
                </button>
              ))}
            </div>
            
            {/* Custom Amount */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <input
                type="text"
                placeholder="Enter custom amount"
                value={customAmount}
                onChange={handleCustomAmountChange}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {getDonationAmount() && (
              <p className="mt-2 text-sm text-gray-600">
                You're donating: <span className="font-semibold text-green-600">
                  {formatCurrency(getDonationAmount())}
                </span>
              </p>
            )}
          </div>

          {/* Anonymous Option */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 flex items-center">
                {isAnonymous ? <FaEyeSlash className="mr-1" /> : <FaEye className="mr-1" />}
                Donate anonymously
              </span>
            </label>
            <p className="mt-1 text-xs text-gray-500">
              {isAnonymous 
                ? 'Your name will not be shown in the donations list'
                : 'Your name will be visible to other donors'
              }
            </p>
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Leave a message (optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share why this cause matters to you..."
              rows={3}
              maxLength={500}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">
              {message.length}/500 characters
            </p>
          </div>

          {/* Donor Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
              <FaUser className="mr-2" />
              Donor Information
            </h4>
            <div className="text-sm text-gray-600">
              <p><strong>Name:</strong> {isAnonymous ? 'Anonymous' : user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <FaLock className="text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Secure Payment</p>
                <p>Your payment is processed securely through Razorpay. We don't store your payment information.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDonate}
              disabled={!getDonationAmount() || loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <FaHeart className="mr-2" />
                  Donate {getDonationAmount() ? formatCurrency(getDonationAmount()) : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;