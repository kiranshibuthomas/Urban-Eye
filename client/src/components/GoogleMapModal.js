import React, { useEffect, useRef, useState } from 'react';
import { FiX, FiMapPin, FiNavigation, FiExternalLink } from 'react-icons/fi';

const GoogleMapModal = ({ isOpen, onClose, latitude, longitude, address, title }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [directionsUrl, setDirectionsUrl] = useState('');
  const [googleMapsAvailable, setGoogleMapsAvailable] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (isOpen && latitude && longitude) {
      // Generate Google Maps directions URL
      const directions = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      setDirectionsUrl(directions);

      // Check if Google Maps is available
      if (window.google && window.google.maps) {
        setGoogleMapsAvailable(true);
        setMapError(false);
        initializeMap();
      } else {
        setGoogleMapsAvailable(false);
        setMapError(true);
      }
    }
  }, [isOpen, latitude, longitude]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

    const mapOptions = {
      center: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
      zoom: 15,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };

    const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
    setMap(newMap);

    // Add marker
    const newMarker = new window.google.maps.Marker({
      position: { lat: parseFloat(latitude), lng: parseFloat(longitude) },
      map: newMap,
      title: title || 'Complaint Location',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
            <circle cx="20" cy="20" r="18" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>
            <path d="M20 8c-4.4 0-8 3.6-8 8 0 6 8 16 8 16s8-10 8-16c0-4.4-3.6-8-8-8zm0 11c-1.7 0-3-1.3-3-3s1.3-3 3-3 3 1.3 3 3-1.3 3-3 3z" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20)
      }
    });
    setMarker(newMarker);

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
            ${title || 'Complaint Location'}
          </h3>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.4;">
            ${address || 'Location coordinates: ' + latitude + ', ' + longitude}
          </p>
        </div>
      `
    });

    newMarker.addListener('click', () => {
      infoWindow.open(newMap, newMarker);
    });

    // Open info window by default
    infoWindow.open(newMap, newMarker);
  };

  const handleDirections = () => {
    if (directionsUrl) {
      window.open(directionsUrl, '_blank');
    }
  };

  const handleCopyCoordinates = () => {
    const coordinates = `${latitude}, ${longitude}`;
    navigator.clipboard.writeText(coordinates).then(() => {
      // You could add a toast notification here
      alert('Coordinates copied to clipboard!');
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FiMapPin className="h-6 w-6 text-red-500 mr-3" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Complaint Location</h2>
              <p className="text-sm text-gray-600">{address}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <FiX className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Map Container */}
        <div className="relative">
          {googleMapsAvailable ? (
            <>
              <div
                ref={mapRef}
                className="w-full h-96"
                style={{ minHeight: '400px' }}
              />
              
              {/* Map Controls Overlay */}
              <div className="absolute top-4 right-4 flex flex-col space-y-2">
                <button
                  onClick={handleDirections}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md border border-gray-200 flex items-center space-x-2 transition-colors duration-200"
                >
                  <FiNavigation className="h-4 w-4" />
                  <span className="text-sm font-medium">Directions</span>
                </button>
                <button
                  onClick={handleCopyCoordinates}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md border border-gray-200 text-sm font-medium transition-colors duration-200"
                >
                  Copy Coords
                </button>
              </div>
            </>
          ) : (
            /* Fallback when Google Maps is not available */
            <div className="w-full h-96 bg-gray-100 flex flex-col items-center justify-center" style={{ minHeight: '400px' }}>
              <div className="text-center p-8">
                <FiMapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Interactive Map Unavailable</h3>
                <p className="text-gray-500 mb-4">
                  Google Maps API key is not configured. You can still view the location using external maps.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={handleDirections}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <FiExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </button>
                  <button
                    onClick={handleCopyCoordinates}
                    className="flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                  >
                    <FiMapPin className="h-4 w-4 mr-2" />
                    Copy Coordinates
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p><strong>Coordinates:</strong> {latitude}, {longitude}</p>
              {address && <p><strong>Address:</strong> {address}</p>}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDirections}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <FiNavigation className="h-4 w-4 mr-2" />
                Get Directions
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleMapModal;
