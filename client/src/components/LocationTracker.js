import React, { useState, useEffect, useCallback } from 'react';
import { FiMapPin, FiNavigation, FiRefreshCw, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LocationTracker = ({ 
  onLocationUpdate, 
  autoUpdate = false, 
  updateInterval = 300000, // 5 minutes
  showAccuracy = true,
  className = ""
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const getCurrentLocation = useCallback(() => {
    setIsLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      const errorMsg = 'Geolocation is not supported by this browser';
      setError(errorMsg);
      setIsLoading(false);
      toast.error(errorMsg);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        };
        
        setCurrentLocation(location);
        setLastUpdate(new Date());
        setError(null);
        setIsLoading(false);
        
        // Call the callback if provided
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
        
        toast.success('Location updated successfully');
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location services.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        
        setError(errorMessage);
        setIsLoading(false);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 60000
      }
    );
  }, [onLocationUpdate]);

  // Auto-update location
  useEffect(() => {
    if (autoUpdate) {
      // Get initial location
      getCurrentLocation();
      
      // Set up interval for updates
      const interval = setInterval(getCurrentLocation, updateInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoUpdate, updateInterval, getCurrentLocation]);

  const getLocationStatusColor = () => {
    if (error) return 'text-red-600';
    if (currentLocation) return 'text-green-600';
    return 'text-gray-500';
  };

  const getLocationStatusText = () => {
    if (isLoading) return 'Getting location...';
    if (error) return error;
    if (currentLocation) {
      const accuracy = Math.round(currentLocation.accuracy);
      return `Location accurate to ±${accuracy}m`;
    }
    return 'Location not available';
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center">
        {isLoading ? (
          <FiRefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
        ) : error ? (
          <FiAlertCircle className="h-4 w-4 text-red-600" />
        ) : currentLocation ? (
          <FiCheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <FiMapPin className="h-4 w-4 text-gray-500" />
        )}
        
        <div className="ml-2">
          <p className={`text-xs font-medium ${getLocationStatusColor()}`}>
            {getLocationStatusText()}
          </p>
          {lastUpdate && (
            <p className="text-xs text-gray-500">
              Updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
      
      <button
        onClick={getCurrentLocation}
        disabled={isLoading}
        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors"
        title="Update location"
      >
        <FiRefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};

export default LocationTracker;