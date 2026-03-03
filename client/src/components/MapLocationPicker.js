import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import { motion } from 'framer-motion';
import { FiMapPin, FiCheckCircle, FiAlertTriangle, FiX, FiNavigation } from 'react-icons/fi';
import { isWithinGeofence, fetchGeofenceConfig } from '../services/geofenceService';
import toast from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="
          color: white;
          font-size: 12px;
          transform: rotate(45deg);
          font-weight: bold;
        ">📍</div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
    popupAnchor: [0, -24]
  });
};

const validLocationIcon = createCustomIcon('#10B981'); // Green
const invalidLocationIcon = createCustomIcon('#EF4444'); // Red

// Map click handler component
const MapClickHandler = ({ onLocationSelect, geofenceConfig }) => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      // Validate location against geofence
      const geofenceCheck = await isWithinGeofence(lat, lng, geofenceConfig);
      
      onLocationSelect({
        latitude: lat,
        longitude: lng,
        isValid: geofenceCheck.isInside,
        message: geofenceCheck.message
      });
    }
  });
  
  return null;
};

const MapLocationPicker = ({ 
  isOpen, 
  onClose, 
  onLocationSelect,
  initialLocation = null 
}) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [geofenceConfig, setGeofenceConfig] = useState(null);
  const [mapCenter, setMapCenter] = useState([9.5595, 76.7874]); // Default to Kanjirapally
  const [mapZoom, setMapZoom] = useState(13);
  const [isLoading, setIsLoading] = useState(true);
  const [gettingCurrentLocation, setGettingCurrentLocation] = useState(false);

  // Load geofence configuration
  useEffect(() => {
    const loadGeofenceConfig = async () => {
      try {
        const config = await fetchGeofenceConfig();
        setGeofenceConfig(config);
        
        // Set map center to panchayath center
        if (config.center) {
          setMapCenter([config.center.latitude, config.center.longitude]);
        }
        
        // Calculate appropriate zoom level based on radius
        const zoomLevel = config.radiusKm > 20 ? 11 : config.radiusKm > 10 ? 12 : 13;
        setMapZoom(zoomLevel);
        
      } catch (error) {
        console.error('Failed to load geofence config:', error);
        toast.error('Failed to load map configuration');
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadGeofenceConfig();
    }
  }, [isOpen]);

  const handleLocationSelect = (locationData) => {
    setSelectedLocation(locationData);
    
    if (locationData.isValid) {
      toast.success('Location selected within service area!');
    } else {
      toast.error('Selected location is outside service area');
    }
  };

  // Get current GPS location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setGettingCurrentLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Validate location against geofence
        const geofenceCheck = await isWithinGeofence(latitude, longitude, geofenceConfig);
        
        // Set the location on map
        const locationData = {
          latitude,
          longitude,
          isValid: geofenceCheck.isInside,
          message: geofenceCheck.message
        };
        
        setSelectedLocation(locationData);
        
        // Center map on current location
        setMapCenter([latitude, longitude]);
        setMapZoom(15); // Zoom in closer for current location
        
        if (geofenceCheck.isInside) {
          toast.success('Current location detected and verified!');
        } else {
          toast.error('Current location is outside service area');
        }
        
        setGettingCurrentLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        toast.error(errorMessage);
        setGettingCurrentLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleConfirmLocation = async () => {
    if (!selectedLocation) {
      toast.error('Please select a location on the map');
      return;
    }

    if (!selectedLocation.isValid) {
      toast.error('Please select a location within the service area');
      return;
    }

    // Enhanced reverse geocode to get detailed address with pincode
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${selectedLocation.latitude}&longitude=${selectedLocation.longitude}&localityLanguage=en`
      );
      const data = await response.json();
      
      // Build detailed address
      const addressParts = [];
      if (data.locality) addressParts.push(data.locality);
      if (data.city && data.city !== data.locality) addressParts.push(data.city);
      if (data.principalSubdivision) addressParts.push(data.principalSubdivision);
      if (data.countryName) addressParts.push(data.countryName);
      
      const detailedAddress = addressParts.join(', ');
      
      const addressInfo = {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: detailedAddress || `Lat: ${selectedLocation.latitude.toFixed(6)}, Lng: ${selectedLocation.longitude.toFixed(6)}`,
        city: data.city || data.locality || '',
        pincode: data.postcode || '',
        isValid: selectedLocation.isValid,
        message: selectedLocation.message
      };

      onLocationSelect(addressInfo);
      // Don't automatically close - let the parent component handle the flow
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      // Fallback with coordinates if reverse geocoding fails
      onLocationSelect({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: `Location: ${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`,
        city: '',
        pincode: '',
        isValid: selectedLocation.isValid,
        message: selectedLocation.message
      });
      // Don't automatically close - let the parent component handle the flow
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gradient-to-r from-[#84A98C] to-[#52796F] rounded-xl flex items-center justify-center flex-shrink-0">
              <FiMapPin className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Select Issue Location</h2>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Click on the map to mark the exact location</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0 ml-2"
          >
            <FiX className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#52796F] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading map...</p>
              </div>
            </div>
          ) : (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="rounded-none z-0"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
              {/* Geofence boundary circle */}
              {geofenceConfig && (
                <Circle
                  center={[geofenceConfig.center.latitude, geofenceConfig.center.longitude]}
                  radius={geofenceConfig.radiusKm * 1000} // Convert km to meters
                  pathOptions={{
                    color: '#52796F',
                    fillColor: '#84A98C',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '5, 5'
                  }}
                />
              )}

              {/* Selected location marker */}
              {selectedLocation && (
                <Marker
                  position={[selectedLocation.latitude, selectedLocation.longitude]}
                  icon={selectedLocation.isValid ? validLocationIcon : invalidLocationIcon}
                />
              )}

              {/* Map click handler */}
              <MapClickHandler 
                onLocationSelect={handleLocationSelect}
                geofenceConfig={geofenceConfig}
              />
            </MapContainer>
          )}

          {/* Selected location info - Bottom Overlay */}
          {selectedLocation && (
            <div className="absolute bottom-4 left-4 right-4 z-30 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg border-2 pointer-events-auto ${
                  selectedLocation.isValid 
                    ? 'border-green-200 bg-green-50/50' 
                    : 'border-red-200 bg-red-50/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  {selectedLocation.isValid ? (
                    <FiCheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FiAlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      selectedLocation.isValid ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {selectedLocation.message}
                    </p>
                    <p className="text-xs text-gray-600 mt-1 break-all">
                      Coordinates: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
          {/* Use Current Location Button */}
          <button
            onClick={getCurrentLocation}
            disabled={gettingCurrentLocation}
            className="w-full bg-gradient-to-r from-[#84A98C] to-[#52796F] text-white py-3 rounded-lg font-medium hover:from-[#52796F] hover:to-[#354F52] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
          >
            {gettingCurrentLocation ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Getting Current Location...
              </>
            ) : (
              <>
                <FiNavigation className="h-5 w-5 mr-3" />
                Use My Current Location
              </>
            )}
          </button>
          
          {/* Confirm/Cancel Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
            <button
              onClick={onClose}
              className="order-2 sm:order-1 px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmLocation}
              disabled={!selectedLocation || !selectedLocation.isValid}
              className="order-1 sm:order-2 px-4 sm:px-6 py-2 bg-gradient-to-r from-[#52796F] to-[#354F52] text-white rounded-lg hover:from-[#354F52] hover:to-[#2F3E46] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm sm:text-base font-medium"
            >
              Confirm Location
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MapLocationPicker;