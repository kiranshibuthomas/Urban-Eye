import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import { FiX, FiMapPin, FiNavigation, FiExternalLink, FiCopy } from 'react-icons/fi';

// Fix for default markers in react-leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LeafletMapModal = ({ isOpen, onClose, latitude, longitude, address, title }) => {
  const [directionsUrl, setDirectionsUrl] = useState('');
  const [osmDirectionsUrl, setOsmDirectionsUrl] = useState('');

  useEffect(() => {
    if (isOpen && latitude && longitude) {
      // Generate Google Maps directions URL (as fallback)
      const googleDirections = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
      setDirectionsUrl(googleDirections);

      // Generate OpenStreetMap directions URL
      const osmDirections = `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${latitude},${longitude}`;
      setOsmDirectionsUrl(osmDirections);
    }
  }, [isOpen, latitude, longitude]);

  const handleDirections = () => {
    if (directionsUrl) {
      window.open(directionsUrl, '_blank');
    }
  };

  const handleOSMDirections = () => {
    if (osmDirectionsUrl) {
      window.open(osmDirectionsUrl, '_blank');
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
          <div className="w-full h-96" style={{ minHeight: '400px' }}>
            <MapContainer
              center={[parseFloat(latitude), parseFloat(longitude)]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[parseFloat(latitude), parseFloat(longitude)]}>
                <Popup>
                  <div className="p-2">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {title || 'Complaint Location'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {address || `Location coordinates: ${latitude}, ${longitude}`}
                    </p>
                    <div className="flex space-x-2 mt-3">
                      <button
                        onClick={handleDirections}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                      >
                        Google Maps
                      </button>
                      <button
                        onClick={handleOSMDirections}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 transition-colors"
                      >
                        OSM Directions
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
          
          {/* Map Controls Overlay */}
          <div className="absolute top-4 right-4 flex flex-col space-y-2">
            <button
              onClick={handleDirections}
              className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md border border-gray-200 flex items-center space-x-2 transition-colors duration-200"
            >
              <FiNavigation className="h-4 w-4" />
              <span className="text-sm font-medium">Google Maps</span>
            </button>
            <button
              onClick={handleOSMDirections}
              className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md border border-gray-200 flex items-center space-x-2 transition-colors duration-200"
            >
              <FiExternalLink className="h-4 w-4" />
              <span className="text-sm font-medium">OSM Directions</span>
            </button>
            <button
              onClick={handleCopyCoordinates}
              className="bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg shadow-md border border-gray-200 text-sm font-medium transition-colors duration-200"
            >
              Copy Coords
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <p><strong>Coordinates:</strong> {latitude}, {longitude}</p>
              {address && <p><strong>Address:</strong> {address}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Powered by <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">OpenStreetMap</a>
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleDirections}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <FiNavigation className="h-4 w-4 mr-2" />
                Google Maps
              </button>
              <button
                onClick={handleOSMDirections}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                <FiExternalLink className="h-4 w-4 mr-2" />
                OSM Directions
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

export default LeafletMapModal;
