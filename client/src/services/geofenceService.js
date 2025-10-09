/**
 * Geofence Service - Fetches dynamic configuration from API
 */

let cachedConfig = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch geofence configuration from API
 * @returns {Promise<Object>} Configuration object
 */
export async function fetchGeofenceConfig() {
  // Return cached config if still valid
  if (cachedConfig && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
    return cachedConfig;
  }

  try {
    const response = await fetch('/api/geofence-config');
    const data = await response.json();
    
    if (data.success && data.config) {
      cachedConfig = data.config;
      cacheTime = Date.now();
      return data.config;
    }
    
    // Return default if API fails
    return getDefaultConfig();
  } catch (error) {
    console.error('Error fetching geofence config:', error);
    return getDefaultConfig();
  }
}

/**
 * Get default configuration (fallback)
 */
function getDefaultConfig() {
  return {
    panchayathName: 'Kanjirapally',
    center: {
      latitude: 9.5595,
      longitude: 76.7874
    },
    radiusKm: 18,
    boundaryPoints: [],
    boundingBox: {
      minLat: 9.3795,
      maxLat: 9.7395,
      minLng: 76.6074,
      maxLng: 76.9674
    },
    warningMessage: 'Your location is outside the service area.',
    successMessage: 'Your location is verified.',
    strictMode: true
  };
}

/**
 * Point-in-polygon algorithm using ray casting
 */
function isPointInPolygon(lat, lng, polygon) {
  if (!polygon || polygon.length < 3) return false;
  
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].longitude;
    const yi = polygon[i].latitude;
    const xj = polygon[j].longitude;
    const yj = polygon[j].latitude;
    
    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate distance between two points in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Check if coordinates are within configured geofence
 * @param {number} latitude - Latitude to check
 * @param {number} longitude - Longitude to check
 * @param {Object} config - Optional pre-fetched config
 * @returns {Promise<Object>} - { isInside: boolean, message: string, config: Object }
 */
export async function isWithinGeofence(latitude, longitude, config = null) {
  // Fetch config if not provided
  if (!config) {
    config = await fetchGeofenceConfig();
  }
  
  const { center, radiusKm, boundingBox, boundaryPoints, warningMessage, successMessage } = config;
  
  // Quick bounding box check
  if (
    latitude < boundingBox.minLat ||
    latitude > boundingBox.maxLat ||
    longitude < boundingBox.minLng ||
    longitude > boundingBox.maxLng
  ) {
    return {
      isInside: false,
      message: warningMessage,
      config
    };
  }
  
  // If we have boundary points, use polygon check
  if (boundaryPoints && boundaryPoints.length > 0) {
    const isInside = isPointInPolygon(latitude, longitude, boundaryPoints);
    return {
      isInside,
      message: isInside ? successMessage : warningMessage,
      config
    };
  }
  
  // Fallback: circular distance check
  const distance = calculateDistance(latitude, longitude, center.latitude, center.longitude);
  const isInside = distance <= radiusKm;
  
  return {
    isInside,
    message: isInside ? successMessage : warningMessage,
    config
  };
}

/**
 * Clear cached configuration (useful after admin updates)
 */
export function clearGeofenceCache() {
  cachedConfig = null;
  cacheTime = null;
}

/**
 * Backward compatibility exports
 */
export const isWithinKottayam = isWithinGeofence;
export const isWithinKanjirapally = isWithinGeofence;

export default {
  fetchGeofenceConfig,
  isWithinGeofence,
  isWithinKottayam,
  isWithinKanjirapally,
  calculateDistance,
  clearGeofenceCache
};

