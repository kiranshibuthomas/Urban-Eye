/**
 * Geofencing utility for Kanjirapally Panchayath, Kottayam District, Kerala, India
 * 
 * This utility validates if a given location is within the Kanjirapally panchayath boundaries.
 * Center: 9.5595° N, 76.7874° E
 * Coverage: ~18km radius (15-20km range)
 */

// Kanjirapally Panchayath boundary coordinates (approximate polygon)
// Center: 9.5595° N, 76.7874° E with ~18km radius coverage
// 1 degree latitude ≈ 111 km, so ~18km ≈ 0.162 degrees
// At this latitude, 1 degree longitude ≈ 111 km * cos(9.5595°) ≈ 109.5 km, so ~18km ≈ 0.164 degrees
const KANJIRAPALLY_BOUNDARY = [
  { lat: 9.7215, lng: 76.7874 },  // North (18km)
  { lat: 9.6740, lng: 76.9034 },  // Northeast (18km)
  { lat: 9.5595, lng: 76.9514 },  // East (18km)
  { lat: 9.4450, lng: 76.9034 },  // Southeast (18km)
  { lat: 9.3975, lng: 76.7874 },  // South (18km)
  { lat: 9.4450, lng: 76.6714 },  // Southwest (18km)
  { lat: 9.5595, lng: 76.6234 },  // West (18km)
  { lat: 9.6740, lng: 76.6714 },  // Northwest (18km)
];

// Bounding box for quick preliminary check (more efficient)
// Covers approximately 20km in all directions from center
const BOUNDING_BOX = {
  minLat: 9.3795,  // South boundary (~20km)
  maxLat: 9.7395,  // North boundary (~20km)
  minLng: 76.6074, // West boundary (~20km)
  maxLng: 76.9674  // East boundary (~20km)
};

/**
 * Point-in-polygon algorithm using ray casting
 * @param {number} lat - Latitude to check
 * @param {number} lng - Longitude to check
 * @param {Array} polygon - Array of {lat, lng} coordinates forming the polygon
 * @returns {boolean} - True if point is inside polygon
 */
function isPointInPolygon(lat, lng, polygon) {
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    
    const intersect = ((yi > lat) !== (yj > lat))
      && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
    
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Check if coordinates are within Kanjirapally panchayath
 * @param {number} latitude - Latitude to check
 * @param {number} longitude - Longitude to check
 * @returns {Object} - { isInside: boolean, message: string }
 */
export function isWithinKanjirapally(latitude, longitude) {
  // First, quick bounding box check
  if (
    latitude < BOUNDING_BOX.minLat ||
    latitude > BOUNDING_BOX.maxLat ||
    longitude < BOUNDING_BOX.minLng ||
    longitude > BOUNDING_BOX.maxLng
  ) {
    return {
      isInside: false,
      message: 'Your location is outside Kanjirapally panchayath. This service is only available for residents within Kanjirapally panchayath area.'
    };
  }
  
  // Then, precise polygon check
  const isInside = isPointInPolygon(latitude, longitude, KANJIRAPALLY_BOUNDARY);
  
  return {
    isInside,
    message: isInside 
      ? 'Your location is verified within Kanjirapally panchayath.'
      : 'Your location is outside Kanjirapally panchayath. This service is only available for residents within Kanjirapally panchayath area.'
  };
}

/**
 * Get the center coordinates of Kanjirapally panchayath
 * @returns {Object} - { latitude, longitude }
 */
export function getKanjirapallyCentre() {
  return {
    latitude: 9.5595,  // Kanjirapally center
    longitude: 76.7874
  };
}

// Backward compatibility - keeping old function names
export const isWithinKottayam = isWithinKanjirapally;
export const getKottayamCenter = getKanjirapallyCentre;

/**
 * Calculate distance between two points in kilometers
 * @param {number} lat1 - First latitude
 * @param {number} lng1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lng2 - Second longitude
 * @returns {number} - Distance in kilometers
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
 * Get the boundary coordinates for map visualization
 * @returns {Array} - Array of {lat, lng} coordinates
 */
export function getKanjirappallyBoundary() {
  return [...KANJIRAPALLY_BOUNDARY];
}

// Backward compatibility
export const getKottayamBoundary = getKanjirappallyBoundary;

/**
 * Get bounding box coordinates
 * @returns {Object} - Bounding box with min/max lat/lng
 */
export function getBoundingBox() {
  return { ...BOUNDING_BOX };
}

export default {
  isWithinKanjirapally,
  isWithinKottayam, // Backward compatibility
  getKanjirapallyCentre,
  getKottayamCenter, // Backward compatibility
  calculateDistance,
  getKanjirappallyBoundary,
  getKottayamBoundary, // Backward compatibility
  getBoundingBox
};

