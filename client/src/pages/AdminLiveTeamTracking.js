import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiMapPin,
  FiActivity,
  FiClock,
  FiRefreshCw,
  FiMaximize2,
  FiMessageSquare,
  FiTrendingUp,
  FiBattery,
  FiNavigation
} from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AdminLiveTeamTracking = () => {
  const [activeTeams, setActiveTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch active teams
  const fetchActiveTeams = useCallback(async () => {
    try {
      const response = await fetch('/api/teams/admin/active-teams', {
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        setActiveTeams(data.teams);
        
        // If a team is selected, update its data
        if (selectedTeam) {
          const updatedTeam = data.teams.find(t => t._id === selectedTeam._id);
          if (updatedTeam) {
            setSelectedTeam(updatedTeam);
          }
        }
      }
    } catch (error) {
      console.error('Fetch teams error:', error);
      toast.error('Failed to fetch team data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTeam]);

  // Manual refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchActiveTeams();
  };

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchActiveTeams();

    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchActiveTeams();
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchActiveTeams]);

  // Calculate team statistics
  const getTeamStats = (team) => {
    const activeMembers = team.members.filter(
      m => m.status === 'active' || m.status === 'accepted'
    ).length;

    const workDuration = team.workSession?.totalDuration || 0;
    const hours = Math.floor(workDuration / (1000 * 60 * 60));
    const minutes = Math.floor((workDuration % (1000 * 60 * 60)) / (1000 * 60));

    return {
      activeMembers,
      workDuration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
      messagesExchanged: team.stats?.messagesExchanged || 0,
      progressUpdates: team.stats?.progressUpdates || 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-600">Loading team data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <FiUsers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Live Team Tracking</h1>
                <p className="text-gray-600 mt-1">
                  {activeTeams.length} active team{activeTeams.length !== 1 ? 's' : ''} in the field
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Auto-refresh toggle */}
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Auto-refresh</span>
              </label>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <FiRefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTeams.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Teams List */}
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Active Teams</h2>
              {activeTeams.map((team) => (
                <TeamCard
                  key={team._id}
                  team={team}
                  isSelected={selectedTeam?._id === team._id}
                  onClick={() => setSelectedTeam(team)}
                  stats={getTeamStats(team)}
                />
              ))}
            </div>

            {/* Team Details & Map */}
            <div className="lg:col-span-2">
              {selectedTeam ? (
                <TeamDetailsPanel team={selectedTeam} stats={getTeamStats(selectedTeam)} />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                  <FiUsers className="mx-auto h-16 w-16 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    Select a team to view details
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Click on a team from the list to see live locations and statistics
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FiUsers className="mx-auto h-16 w-16 text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No active teams</h3>
            <p className="mt-2 text-gray-500">
              There are currently no teams working in the field
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Team Card Component
const TeamCard = ({ team, isSelected, onClick, stats }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'bg-blue-50 border-2 border-blue-500 shadow-lg'
          : 'bg-white border-2 border-gray-200 hover:border-blue-300 shadow'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 truncate">{team.teamName}</h3>
          <p className="text-sm text-gray-600 truncate mt-1">{team.complaint?.title}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          team.status === 'active'
            ? 'bg-green-100 text-green-800'
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {team.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <FiUsers className="h-4 w-4" />
          <span>{stats.activeMembers} members</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <FiClock className="h-4 w-4" />
          <span>{stats.workDuration}</span>
        </div>
      </div>
    </motion.div>
  );
};

// Team Details Panel Component
const TeamDetailsPanel = ({ team, stats }) => {
  const [mapCenter, setMapCenter] = useState([10.8505, 76.2711]); // Default: Kerala

  useEffect(() => {
    if (team.complaint?.location?.coordinates) {
      setMapCenter([
        team.complaint.location.coordinates[1],
        team.complaint.location.coordinates[0]
      ]);
    }
  }, [team]);

  // Create custom icons for team members
  const createMemberIcon = (color, initial) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${initial}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  };

  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={FiUsers}
          label="Team Members"
          value={stats.activeMembers}
          color="blue"
        />
        <StatCard
          icon={FiClock}
          label="Work Duration"
          value={stats.workDuration}
          color="green"
        />
        <StatCard
          icon={FiMessageSquare}
          label="Messages"
          value={stats.messagesExchanged}
          color="purple"
        />
        <StatCard
          icon={FiTrendingUp}
          label="Updates"
          value={stats.progressUpdates}
          color="orange"
        />
      </div>

      {/* Map */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <FiMapPin className="h-5 w-5 mr-2 text-blue-600" />
            Live Team Locations
          </h3>
        </div>
        <div className="h-96">
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            />

            {/* Task Location */}
            {team.complaint?.location?.coordinates && (
              <>
                <Circle
                  center={[
                    team.complaint.location.coordinates[1],
                    team.complaint.location.coordinates[0]
                  ]}
                  radius={150}
                  pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1 }}
                />
                <Marker
                  position={[
                    team.complaint.location.coordinates[1],
                    team.complaint.location.coordinates[0]
                  ]}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-semibold">Task Location</h4>
                      <p className="text-sm text-gray-600">{team.complaint.address}</p>
                    </div>
                  </Popup>
                </Marker>
              </>
            )}

            {/* Team Member Locations */}
            {team.lastKnownLocations?.map((loc, index) => {
              const member = team.members.find(
                m => m.fieldStaff._id === loc.fieldStaff._id
              );
              
              if (!loc.location?.coordinates || !member) return null;

              return (
                <Marker
                  key={loc.fieldStaff._id}
                  position={[loc.location.coordinates[1], loc.location.coordinates[0]]}
                  icon={createMemberIcon(
                    colors[index % colors.length],
                    member.fieldStaff.name.charAt(0).toUpperCase()
                  )}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-semibold">{member.fieldStaff.name}</h4>
                      <p className="text-sm text-gray-600">{member.role}</p>
                      <div className="mt-2 space-y-1 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <FiClock className="h-3 w-3" />
                          <span>{new Date(loc.timestamp).toLocaleTimeString()}</span>
                        </div>
                        {loc.battery && (
                          <div className="flex items-center space-x-1">
                            <FiBattery className="h-3 w-3" />
                            <span>{loc.battery}%</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <FiNavigation className="h-3 w-3" />
                          <span>{loc.isMoving ? 'Moving' : 'Stationary'}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Team Members</h3>
        <div className="space-y-3">
          {team.members
            .filter(m => m.status === 'active' || m.status === 'accepted')
            .map((member, index) => {
              const location = team.lastKnownLocations?.find(
                loc => loc.fieldStaff._id === member.fieldStaff._id
              );

              return (
                <div
                  key={member.fieldStaff._id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-semibold"
                      style={{ background: colors[index % colors.length] }}
                    >
                      {member.fieldStaff.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{member.fieldStaff.name}</h4>
                      <p className="text-sm text-gray-600">{member.role}</p>
                    </div>
                  </div>

                  {location && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      {location.battery && (
                        <div className="flex items-center space-x-1">
                          <FiBattery className="h-4 w-4" />
                          <span>{location.battery}%</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-1">
                        <FiActivity className={`h-4 w-4 ${location.isMoving ? 'text-green-600' : 'text-gray-400'}`} />
                        <span>{location.isMoving ? 'Active' : 'Idle'}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[color]} rounded-xl flex items-center justify-center`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default AdminLiveTeamTracking;
