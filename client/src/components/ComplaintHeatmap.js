import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import L from 'leaflet';
import { 
  FiFilter, 
  FiRefreshCw, 
  FiDownload, 
  FiInfo,
  FiMapPin,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiClock,
  FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';

// Fix for default markers in react-leaflet
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Complaint markers component
const ComplaintMarkers = ({ data }) => {
  const getMarkerColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc2626'; // red
      case 'high': return '#ea580c'; // orange
      case 'medium': return '#d97706'; // amber
      case 'low': return '#16a34a'; // green
      default: return '#6b7280'; // gray
    }
  };

  const getMarkerSize = (priority) => {
    switch (priority) {
      case 'urgent': return 12;
      case 'high': return 10;
      case 'medium': return 8;
      case 'low': return 6;
      default: return 6;
    }
  };

  return (
    <>
      {data.map((point, index) => {
        const markerColor = getMarkerColor(point.priority);
        const markerSize = getMarkerSize(point.priority);
        
        const customIcon = new L.DivIcon({
          html: `<div style="
            background-color: ${markerColor};
            width: ${markerSize}px;
            height: ${markerSize}px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>`,
          className: 'custom-marker',
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2]
        });

        return (
          <Marker
            key={index}
            position={[point.lat, point.lng]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-gray-900 mb-2">
                  {point.category.replace('_', ' ').toUpperCase()}
                </h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Priority:</strong> 
                    <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                      point.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      point.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      point.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {point.priority.toUpperCase()}
                    </span>
                  </p>
                  <p><strong>Status:</strong> {point.status.replace('_', ' ')}</p>
                  <p><strong>Address:</strong> {point.address}</p>
                  <p><strong>Date:</strong> {new Date(point.submittedAt).toLocaleDateString()}</p>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

// Filter panel component
const FilterPanel = ({ filters, onFiltersChange, onApplyFilters, onResetFilters, isOpen, onClose }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
  };

  const handleReset = () => {
    const resetFilters = {
      category: '',
      status: '',
      priority: '',
      startDate: '',
      endDate: '',
      includeDeleted: false
    };
    setLocalFilters(resetFilters);
    onFiltersChange(resetFilters);
    onApplyFilters();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-80">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Map Filters</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <FiX className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Categories</option>
            <option value="road_issues">Road Issues</option>
            <option value="water_supply">Water Supply</option>
            <option value="electricity">Electricity</option>
            <option value="waste_management">Waste Management</option>
            <option value="public_transport">Public Transport</option>
            <option value="parks_recreation">Parks & Recreation</option>
            <option value="street_lighting">Street Lighting</option>
            <option value="drainage">Drainage</option>
            <option value="noise_pollution">Noise Pollution</option>
            <option value="air_pollution">Air Pollution</option>
            <option value="safety_security">Safety & Security</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={localFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="work_completed">Work Completed</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <select
            value={localFilters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
          <div className="space-y-2">
            <input
              type="date"
              value={localFilters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={localFilters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="End Date"
            />
          </div>
        </div>

        {/* Include Deleted */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="includeDeleted"
            checked={localFilters.includeDeleted}
            onChange={(e) => handleFilterChange('includeDeleted', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="includeDeleted" className="ml-2 block text-sm text-gray-900">
            Include Deleted Complaints
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-4">
          <button
            onClick={handleApply}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
          >
            <FiFilter className="h-4 w-4 mr-2" />
            Apply Filters
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

// Statistics panel component
const StatisticsPanel = ({ statistics, isOpen, onClose }) => {
  if (!isOpen || !statistics) return null;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiClock className="h-4 w-4 text-yellow-500" />;
      case 'in_progress': return <FiTrendingUp className="h-4 w-4 text-blue-500" />;
      case 'resolved': return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <FiAlertCircle className="h-4 w-4 text-red-500" />;
      default: return <FiMapPin className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-80 max-h-96 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <FiX className="h-5 w-5 text-gray-500" />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Total Complaints */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center">
            <FiMapPin className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">Total Complaints</span>
          </div>
          <p className="text-2xl font-bold text-blue-900 mt-1">{statistics.totalComplaints}</p>
        </div>

        {/* Status Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">By Status</h4>
          <div className="space-y-1">
            {Object.entries(statistics.statusStats || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  {getStatusIcon(status)}
                  <span className="ml-2 capitalize">{status.replace('_', ' ')}</span>
                </div>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">By Priority</h4>
          <div className="space-y-1">
            {Object.entries(statistics.priorityStats || {}).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between text-sm">
                <span className="capitalize">{priority}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priority)}`}>
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">By Category</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {Object.entries(statistics.categoryStats || {}).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="capitalize">{category.replace('_', ' ')}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const ComplaintHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    priority: '',
    startDate: '',
    endDate: '',
    includeDeleted: false
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [mapCenter, setMapCenter] = useState([9.5916, 76.5222]); // Kanjirapally coordinates
  const [mapZoom, setMapZoom] = useState(13);

  // Load heatmap data
  const loadHeatmapData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          queryParams.append(key, value);
        }
      });

      const url = `/api/complaints/heatmap-data?${queryParams}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch heatmap data: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Heatmap data loaded:', result.data.heatmapData.length, 'points');
        setHeatmapData(result.data.heatmapData);
        setStatistics(result.data.statistics);
        
        // Update map center if we have data
        if (result.data.heatmapData.length > 0) {
          const avgLat = result.data.heatmapData.reduce((sum, point) => sum + point.lat, 0) / result.data.heatmapData.length;
          const avgLng = result.data.heatmapData.reduce((sum, point) => sum + point.lng, 0) / result.data.heatmapData.length;
          console.log('Setting map center to:', avgLat, avgLng);
          setMapCenter([avgLat, avgLng]);
        }
      } else {
        throw new Error(result.message || 'Failed to load heatmap data');
      }
    } catch (err) {
      console.error('Error loading heatmap data:', err);
      setError(err.message);
      toast.error('Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    loadHeatmapData();
  }, []);

  // Force map re-render when data changes
  useEffect(() => {
    if (heatmapData.length > 0) {
      // Small delay to ensure map container is ready
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 100);
    }
  }, [heatmapData]);

  const handleApplyFilters = () => {
    loadHeatmapData();
    setShowFilters(false);
  };

  const handleRefresh = () => {
    loadHeatmapData();
  };

  const handleExportData = () => {
    if (heatmapData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const csvContent = [
      ['Latitude', 'Longitude', 'Intensity', 'Category', 'Status', 'Priority', 'Address', 'City', 'Submitted At'],
      ...heatmapData.map(point => [
        point.lat,
        point.lng,
        point.intensity,
        point.category,
        point.status,
        point.priority,
        point.address,
        point.city,
        new Date(point.submittedAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaint-heatmap-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Heatmap data exported successfully');
  };

  console.log('ComplaintHeatmap render - heatmapData length:', heatmapData.length, 'loading:', loading, 'error:', error);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Complaint Map</h2>
          <p className="text-sm text-gray-600">Visualize complaint locations and priorities across the panchayath</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowStatistics(!showStatistics)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            <FiInfo className="h-4 w-4 mr-2" />
            Statistics
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors duration-200"
          >
            <FiFilter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors duration-200 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExportData}
            disabled={heatmapData.length === 0}
            className="flex items-center px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors duration-200 disabled:opacity-50"
          >
            <FiDownload className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-red-50 border border-red-200 rounded-lg p-4 max-w-md">
            <div className="flex items-center">
              <FiAlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <FiRefreshCw className="h-5 w-5 text-blue-600 mr-2 animate-spin" />
              <p className="text-blue-800">Loading complaint data...</p>
            </div>
          </div>
        )}

        {!loading && heatmapData.length === 0 && !error && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
            <div className="flex items-center">
              <FiInfo className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-blue-800 font-medium">No complaint data found</p>
                <p className="text-blue-600 text-sm mt-1">This could mean:</p>
                <ul className="text-blue-600 text-sm mt-1 list-disc list-inside">
                  <li>No complaints have been submitted yet</li>
                  <li>All complaints are outside the current filters</li>
                  <li>Try adjusting your filter settings</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div style={{ height: '100%', width: '100%', minHeight: '400px', position: 'relative' }}>
          {heatmapData.length > 0 ? (
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%', minHeight: '400px' }}
              className="z-0"
              key={`map-${heatmapData.length}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ComplaintMarkers data={heatmapData} />
            </MapContainer>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
              <div className="text-center">
                <FiMapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Map will appear when complaint data is loaded</p>
              </div>
            </div>
          )}
        </div>

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onApplyFilters={handleApplyFilters}
          onResetFilters={() => setFilters({
            category: '',
            status: '',
            priority: '',
            startDate: '',
            endDate: '',
            includeDeleted: false
          })}
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
        />

        {/* Statistics Panel */}
        <StatisticsPanel
          statistics={statistics}
          isOpen={showStatistics}
          onClose={() => setShowStatistics(false)}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-10">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Complaint Priority Legend</h4>
          <div className="space-y-1">
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span>Urgent Priority</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span>High Priority</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
              <span>Medium Priority</span>
            </div>
            <div className="flex items-center text-xs">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Low Priority</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Marker size and color indicate priority level
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComplaintHeatmap;
