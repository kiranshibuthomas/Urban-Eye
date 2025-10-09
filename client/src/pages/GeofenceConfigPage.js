import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSession } from '../context/SessionContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiMap,
  FiMapPin,
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
  FiCheckCircle,
  FiTarget,
  FiSettings,
  FiInfo,
  FiUser,
  FiLogOut,
  FiChevronDown,
  FiArrowLeft
} from 'react-icons/fi';

const GeofenceConfigPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { logout: sessionLogout } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  
  const [config, setConfig] = useState({
    panchayathName: '',
    district: '',
    state: '',
    country: '',
    centerLatitude: '',
    centerLongitude: '',
    radiusKm: '',
    bufferKm: '',
    strictMode: true,
    warningMessage: '',
    successMessage: ''
  });

  const [testCoords, setTestCoords] = useState({
    latitude: '',
    longitude: ''
  });

  const [testResult, setTestResult] = useState(null);
  const [calculatedBoundary, setCalculatedBoundary] = useState(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchConfig();
  }, [user, navigate]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await sessionLogout();
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/geofence-config/admin', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConfig({
          panchayathName: data.config.panchayathName || '',
          district: data.config.district || '',
          state: data.config.state || '',
          country: data.config.country || '',
          centerLatitude: data.config.centerLatitude || '',
          centerLongitude: data.config.centerLongitude || '',
          radiusKm: data.config.radiusKm || '',
          bufferKm: data.config.bufferKm || '',
          strictMode: data.config.strictMode !== false,
          warningMessage: data.config.warningMessage || '',
          successMessage: data.config.successMessage || ''
        });
        
        if (data.config.boundaryPoints) {
          setCalculatedBoundary(data.config);
        }
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/geofence-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Geofence configuration updated successfully!');
        if (data.config) {
          setCalculatedBoundary(data.config);
        }
        // Refresh config to get calculated boundaries
        await fetchConfig();
      } else {
        toast.error(data.message || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestGeofence = async () => {
    if (!testCoords.latitude || !testCoords.longitude) {
      toast.error('Please enter test coordinates');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch('/api/geofence-config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          latitude: parseFloat(testCoords.latitude),
          longitude: parseFloat(testCoords.longitude)
        })
      });

      const data = await response.json();

      if (data.success) {
        setTestResult(data.result);
        if (data.result.isInside) {
          toast.success(`Location is INSIDE (${data.result.distance} km from center)`);
        } else {
          toast.error(`Location is OUTSIDE (${data.result.distance} km from center)`);
        }
      } else {
        toast.error(data.message || 'Test failed');
      }
    } catch (error) {
      console.error('Error testing geofence:', error);
      toast.error('Failed to test geofence');
    } finally {
      setTesting(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    toast.loading('Getting your location...');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        toast.dismiss();
        setTestCoords({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        });
        toast.success('Location obtained!');
      },
      (error) => {
        toast.dismiss();
        toast.error('Unable to get location');
        console.error('Geolocation error:', error);
      }
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Matching AdminDashboard */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title and Back Button */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/admin-settings')}
                className="p-3 rounded-xl hover:bg-gray-100 transition-all duration-150"
              >
                <FiArrowLeft className="h-5 w-5 text-gray-600" />
              </motion.button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Geofence Configuration</h1>
                <p className="text-base text-gray-600 mt-1">Configure service area and boundaries</p>
              </div>
            </div>

            {/* Right: User Menu */}
            <div className="relative user-menu-dropdown group" ref={userMenuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setUserMenuOpen(!userMenuOpen);
                }}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-100 transition-all duration-150"
              >
                <img
                  src={user?.avatar}
                  alt={user?.name || 'User'}
                  className="h-8 w-8 rounded-full object-cover bg-gradient-to-r from-blue-500 to-indigo-500"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="hidden h-8 w-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full items-center justify-center text-white text-xs font-semibold">
                  {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-base font-medium text-gray-900">{user?.name || 'Admin'}</p>
                  <p className="text-sm text-gray-500">Administrator</p>
                </div>
                <FiChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-150 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-200/50 py-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-base font-medium text-gray-900">{user?.name || 'Admin'}</p>
                    </div>

                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => navigate('/profile')}
                        className="w-full px-4 py-2 text-left text-base text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                      >
                        <FiUser className="h-4 w-4 mr-3" />
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/admin-settings')}
                        className="w-full px-4 py-2 text-left text-base text-gray-700 hover:bg-gray-50 flex items-center transition-colors duration-200"
                      >
                        <FiSettings className="h-4 w-4 mr-3" />
                        Admin Settings
                      </button>
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-base text-red-600 hover:bg-red-50 flex items-center transition-colors duration-200"
                      >
                        <FiLogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-6xl mx-auto">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration Form */}
          <div className="lg:col-span-2">
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSave}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-6"
            >
              {/* Panchayath Details */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiSettings className="mr-2" />
                  Panchayath Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Panchayath Name *
                    </label>
                    <input
                      type="text"
                      name="panchayathName"
                      value={config.panchayathName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Kanjirapally"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      District
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={config.district}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Kottayam"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      name="state"
                      value={config.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Kerala"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={config.country}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., India"
                    />
                  </div>
                </div>
              </div>

              {/* Center Coordinates */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiMapPin className="mr-2" />
                  Center Coordinates
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Latitude * <span className="text-gray-500 text-xs">(-90 to 90)</span>
                    </label>
                    <input
                      type="number"
                      name="centerLatitude"
                      value={config.centerLatitude}
                      onChange={handleInputChange}
                      required
                      step="0.000001"
                      min="-90"
                      max="90"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 9.5595"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitude * <span className="text-gray-500 text-xs">(-180 to 180)</span>
                    </label>
                    <input
                      type="number"
                      name="centerLongitude"
                      value={config.centerLongitude}
                      onChange={handleInputChange}
                      required
                      step="0.000001"
                      min="-180"
                      max="180"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 76.7874"
                    />
                  </div>
                </div>
              </div>

              {/* Radius Configuration */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiTarget className="mr-2" />
                  Coverage Radius
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Radius (km) * <span className="text-gray-500 text-xs">(0.1 to 100)</span>
                    </label>
                    <input
                      type="number"
                      name="radiusKm"
                      value={config.radiusKm}
                      onChange={handleInputChange}
                      required
                      step="0.1"
                      min="0.1"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 18"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buffer (km) <span className="text-gray-500 text-xs">(0 to 10)</span>
                    </label>
                    <input
                      type="number"
                      name="bufferKm"
                      value={config.bufferKm}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      max="10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 2"
                    />
                    <p className="text-xs text-gray-500 mt-1">Extra space for bounding box check</p>
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiInfo className="mr-2" />
                  Advanced Settings
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="strictMode"
                      name="strictMode"
                      checked={config.strictMode}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="strictMode" className="ml-2 block text-sm text-gray-700">
                      <strong>Strict Mode</strong> - Reject complaints outside geofence
                      <p className="text-xs text-gray-500">If disabled, only warnings are shown</p>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warning Message
                    </label>
                    <textarea
                      name="warningMessage"
                      value={config.warningMessage}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#52796F] focus:border-transparent resize-none"
                      placeholder="Use {panchayath} as placeholder"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use <code className="bg-gray-100 px-1 rounded">{'{panchayath}'}</code> for dynamic name
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Success Message
                    </label>
                    <textarea
                      name="successMessage"
                      value={config.successMessage}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#52796F] focus:border-transparent resize-none"
                      placeholder="Use {panchayath} as placeholder"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={fetchConfig}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
                >
                  <FiRefreshCw className="mr-2" />
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center font-medium"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      Save Configuration
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          </div>

          {/* Test & Info Panel */}
          <div className="space-y-6">
            {/* Test Geofence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-md border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FiMapPin className="mr-2 text-blue-600" />
                Test Geofence
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={testCoords.latitude}
                    onChange={(e) => setTestCoords(prev => ({ ...prev, latitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#52796F] focus:border-transparent text-sm"
                    placeholder="9.5595"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={testCoords.longitude}
                    onChange={(e) => setTestCoords(prev => ({ ...prev, longitude: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#52796F] focus:border-transparent text-sm"
                    placeholder="76.7874"
                  />
                </div>
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                >
                  Use My Location
                </button>
                <button
                  type="button"
                  onClick={handleTestGeofence}
                  disabled={testing}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm font-medium"
                >
                  {testing ? 'Testing...' : 'Test Location'}
                </button>
              </div>

              {testResult && (
                <div className={`mt-4 p-4 rounded-lg ${testResult.isInside ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  {testResult.isInside ? (
                    <div className="flex items-start">
                      <FiCheckCircle className="h-5 w-5 text-green-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900">Inside Geofence</p>
                        <p className="text-xs text-green-700 mt-1">
                          Distance: {testResult.distance} km from center
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <FiAlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Outside Geofence</p>
                        <p className="text-xs text-red-700 mt-1">
                          Distance: {testResult.distance} km from center
                          <br />
                          (Radius: {testResult.radiusKm} km)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Current Configuration Info */}
            {calculatedBoundary && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-200 p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Panchayath:</span>
                    <span className="font-medium text-gray-900">{calculatedBoundary.panchayathName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Radius:</span>
                    <span className="font-medium text-gray-900">{calculatedBoundary.radiusKm} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Coverage Area:</span>
                    <span className="font-medium text-gray-900">
                      ~{(Math.PI * calculatedBoundary.radiusKm * calculatedBoundary.radiusKm).toFixed(0)} km²
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Boundary Points:</span>
                    <span className="font-medium text-gray-900">{calculatedBoundary.boundaryPoints?.length || 8}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-blue-200">
                    <p className="text-xs text-gray-600">
                      Last updated: {new Date(calculatedBoundary.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default GeofenceConfigPage;

