// Utility functions for location-based operations

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

/**
 * Format distance for display
 * @param {number} distance - Distance in meters
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (distance < 1000) {
    return `${Math.round(distance)}m`;
  } else {
    return `${(distance / 1000).toFixed(1)}km`;
  }
};

/**
 * Check if location is within allowed radius
 * @param {Object} currentLocation - Current location {latitude, longitude}
 * @param {Object} targetLocation - Target location {coordinates: [lng, lat]}
 * @param {number} allowedRadius - Allowed radius in meters
 * @returns {Object} Validation result {isValid, distance}
 */
export const validateLocationRadius = (currentLocation, targetLocation, allowedRadius = 150) => {
  if (!currentLocation || !targetLocation?.coordinates) {
    return { isValid: false, distance: null };
  }

  const distance = calculateDistance(
    currentLocation.latitude,
    currentLocation.longitude,
    targetLocation.coordinates[1], // lat
    targetLocation.coordinates[0]  // lng
  );

  return {
    isValid: distance <= allowedRadius,
    distance: Math.round(distance)
  };
};

/**
 * Get current position using Geolocation API
 * @param {Object} options - Geolocation options
 * @returns {Promise} Promise resolving to location object
 */
export const getCurrentPosition = (options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000,
    ...options
  };

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date()
        });
      },
      (error) => {
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
        reject(new Error(errorMessage));
      },
      defaultOptions
    );
  });
};

/**
 * Open location in maps application
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {string} label - Optional label for the location
 */
export const openInMaps = (lat, lng, label = '') => {
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try to open in native maps app
    const url = `geo:${lat},${lng}${label ? `?q=${encodeURIComponent(label)}` : ''}`;
    window.open(url, '_blank');
  } else {
    // Open in Google Maps
    const url = `https://www.google.com/maps?q=${lat},${lng}${label ? `&label=${encodeURIComponent(label)}` : ''}`;
    window.open(url, '_blank');
  }
};

/**
 * Get directions to a location
 * @param {number} lat - Destination latitude
 * @param {number} lng - Destination longitude
 * @param {Object} currentLocation - Current location {latitude, longitude}
 */
export const getDirections = (lat, lng, currentLocation = null) => {
  let url = `https://www.google.com/maps/dir/`;
  
  if (currentLocation) {
    url += `${currentLocation.latitude},${currentLocation.longitude}/`;
  }
  
  url += `${lat},${lng}`;
  
  window.open(url, '_blank');
};

/**
 * Format duration in milliseconds to human readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
export const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Check if location accuracy is acceptable
 * @param {number} accuracy - GPS accuracy in meters
 * @param {number} threshold - Acceptable threshold in meters (default: 100)
 * @returns {Object} Accuracy check result
 */
export const checkLocationAccuracy = (accuracy, threshold = 100) => {
  return {
    isAcceptable: accuracy <= threshold,
    accuracy: Math.round(accuracy),
    message: accuracy <= threshold 
      ? `Good accuracy (±${Math.round(accuracy)}m)`
      : `Low accuracy (±${Math.round(accuracy)}m). Consider moving to an open area.`
  };
};

/**
 * Watch position with automatic updates
 * @param {Function} onUpdate - Callback for position updates
 * @param {Function} onError - Callback for errors
 * @param {Object} options - Watch options
 * @returns {number} Watch ID for clearing
 */
export const watchPosition = (onUpdate, onError, options = {}) => {
  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000,
    ...options
  };

  if (!navigator.geolocation) {
    onError(new Error('Geolocation is not supported by this browser'));
    return null;
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      onUpdate({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date()
      });
    },
    (error) => {
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
      onError(new Error(errorMessage));
    },
    defaultOptions
  );
};

/**
 * Clear position watch
 * @param {number} watchId - Watch ID returned by watchPosition
 */
export const clearWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};