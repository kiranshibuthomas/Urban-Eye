import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiUsers,
  FiUserPlus,
  FiSettings,
  FiCheck,
  FiX,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiKey,
  FiEyeOff
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const FieldStaffManagement = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [fieldStaff, setFieldStaff] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    jobRole: '',
    experience: 0,
    maxWorkload: 10,
    phone: '',
    address: '',
    city: '',
    zipCode: ''
  });

  const { user } = useAuth();
  const navigate = useNavigate();

  const departments = [
    { 
      value: 'sanitation', 
      label: 'Sanitation', 
      icon: '🧹', 
      color: 'bg-green-100 text-green-800',
      jobRoles: [
        { value: 'sanitation_worker', label: 'Sanitation Worker' },
        { value: 'waste_collector', label: 'Waste Collector' },
        { value: 'cleanup_specialist', label: 'Cleanup Specialist' }
      ]
    },
    { 
      value: 'water_supply', 
      label: 'Water Supply', 
      icon: '💧', 
      color: 'bg-blue-100 text-blue-800',
      jobRoles: [
        { value: 'water_technician', label: 'Water Technician' },
        { value: 'plumber', label: 'Plumber' },
        { value: 'pipe_specialist', label: 'Pipe Specialist' }
      ]
    },
    { 
      value: 'electricity', 
      label: 'Electricity', 
      icon: '⚡', 
      color: 'bg-yellow-100 text-yellow-800',
      jobRoles: [
        { value: 'electrician', label: 'Electrician' },
        { value: 'power_technician', label: 'Power Technician' },
        { value: 'lighting_technician', label: 'Lighting Technician' },
        { value: 'street_light_specialist', label: 'Street Light Specialist' }
      ]
    },
    { 
      value: 'public_works', 
      label: 'Public Works', 
      icon: '🔧', 
      color: 'bg-purple-100 text-purple-800',
      jobRoles: [
        { value: 'road_worker', label: 'Road Worker' },
        { value: 'asphalt_specialist', label: 'Asphalt Specialist' },
        { value: 'pavement_technician', label: 'Pavement Technician' },
        { value: 'drainage_specialist', label: 'Drainage Specialist' },
        { value: 'sewer_technician', label: 'Sewer Technician' },
        { value: 'park_maintenance', label: 'Park Maintenance' },
        { value: 'safety_inspector', label: 'Safety Inspector' },
        { value: 'environmental_specialist', label: 'Environmental Specialist' },
        { value: 'transport_coordinator', label: 'Transport Coordinator' },
        { value: 'general_worker', label: 'General Worker' }
      ]
    }
  ];

  useEffect(() => {
    fetchFieldStaff();
  }, []);

  const fetchFieldStaff = async () => {
    setIsLoading(true);
    try {
      const url = departmentFilter 
        ? `/api/users/field-staff?department=${departmentFilter}`
        : '/api/users/field-staff';
      
      const response = await fetch(url, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFieldStaff(data.fieldStaff);
        } else {
          toast.error('Failed to fetch field staff');
        }
      } else {
        toast.error('Failed to fetch field staff');
      }
    } catch (error) {
      console.error('Fetch field staff error:', error);
      toast.error('Failed to fetch field staff');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    
    if (newStaff.password !== newStaff.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!newStaff.department) {
      toast.error('Please select a department');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...newStaff,
          role: 'field_staff'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Field staff created successfully');
          setIsCreateModalOpen(false);
          setNewStaff({
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
            department: '',
            jobRole: '',
            experience: 0,
            maxWorkload: 10,
            phone: '',
            address: '',
            city: '',
            zipCode: ''
          });
          fetchFieldStaff();
        } else {
          toast.error(data.message || 'Failed to create field staff');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to create field staff');
      }
    } catch (error) {
      console.error('Create field staff error:', error);
      toast.error('Failed to create field staff');
    }
  };

  const handleEditStaff = async (e) => {
    e.preventDefault();
    
    if (!selectedStaff) return;

    try {
      const response = await fetch(`/api/users/${selectedStaff._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          name: selectedStaff.name,
          email: selectedStaff.email,
          department: selectedStaff.department,
          phone: selectedStaff.phone,
          address: selectedStaff.address,
          city: selectedStaff.city,
          zipCode: selectedStaff.zipCode,
          isActive: selectedStaff.isActive
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Field staff updated successfully');
          setIsEditModalOpen(false);
          setSelectedStaff(null);
          fetchFieldStaff();
        } else {
          toast.error(data.message || 'Failed to update field staff');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Failed to update field staff');
      }
    } catch (error) {
      console.error('Update field staff error:', error);
      toast.error('Failed to update field staff');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to deactivate this field staff member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${staffId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success('Field staff deactivated successfully');
          fetchFieldStaff();
        }
      }
    } catch (error) {
      console.error('Delete field staff error:', error);
      toast.error('Failed to deactivate field staff');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!resetPasswordData.newPassword || !resetPasswordData.confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (resetPasswordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    // Password strength validation
    const passwordChecks = {
      hasLowercase: /[a-z]/.test(resetPasswordData.newPassword),
      hasUppercase: /[A-Z]/.test(resetPasswordData.newPassword),
      hasNumber: /[0-9]/.test(resetPasswordData.newPassword),
      hasSpecial: /[^A-Za-z0-9]/.test(resetPasswordData.newPassword)
    };

    const passwordScore = Object.values(passwordChecks).filter(Boolean).length;
    
    if (passwordScore < 3) {
      toast.error('Password must contain at least 3 of: lowercase, uppercase, number, special character');
      return;
    }

    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`/api/users/${selectedStaff._id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          newPassword: resetPasswordData.newPassword
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`Password reset successfully for ${selectedStaff.name}`);
        setIsResetPasswordModalOpen(false);
        setResetPasswordData({ newPassword: '', confirmPassword: '' });
        setSelectedStaff(null);
        setShowNewPassword(false);
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error('Failed to reset password');
    }
  };

  const filteredStaff = fieldStaff.filter(staff => {
    const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getDepartmentInfo = (department) => {
    return departments.find(dept => dept.value === department) || departments[0];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading field staff..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Field Staff Management</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage field staff members and their department assignments
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <FiUserPlus className="h-4 w-4 mr-2" />
              Add Field Staff
            </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department Filter
              </label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.icon} {dept.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Field Staff List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Field Staff ({filteredStaff.length})
            </h3>
          </div>
          
          {filteredStaff.length === 0 ? (
            <div className="text-center py-12">
              <FiUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No field staff found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || departmentFilter ? 'Try adjusting your search criteria.' : 'Get started by adding a new field staff member.'}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Staff Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department & Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience & Workload
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStaff.map((staff) => {
                    const deptInfo = getDepartmentInfo(staff.department);
                    return (
                      <tr key={staff._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={staff.avatar || `https://ui-avatars.com/api/?name=${staff.name}&size=40&background=random`}
                              alt={staff.name}
                              className="h-10 w-10 rounded-full"
                            />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                              <div className="text-sm text-gray-500">{staff.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${deptInfo.color}`}>
                              {deptInfo.icon} {deptInfo.label}
                            </span>
                            {staff.jobRole && (
                              <div className="text-xs text-gray-600">
                                {departments
                                  .find(dept => dept.value === staff.department)
                                  ?.jobRoles.find(role => role.value === staff.jobRole)?.label || staff.jobRole}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center">
                              <span className="font-medium">{staff.experience || 0} years</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Max: {staff.maxWorkload || 10} complaints
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {staff.phone && (
                              <div className="flex items-center">
                                <FiPhone className="h-4 w-4 mr-1 text-gray-400" />
                                {staff.phone}
                              </div>
                            )}
                            {staff.address && (
                              <div className="flex items-center mt-1">
                                <FiMapPin className="h-4 w-4 mr-1 text-gray-400" />
                                <span className="truncate max-w-xs">{staff.address}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            staff.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {staff.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <FiCalendar className="h-4 w-4 mr-1 text-gray-400" />
                            {formatDate(staff.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedStaff(staff);
                                setIsEditModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit Staff"
                            >
                              <FiEdit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedStaff(staff);
                                setIsResetPasswordModalOpen(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Reset Password"
                            >
                              <FiKey className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff._id)}
                              className="text-red-600 hover:text-red-900"
                              title="Deactivate Staff"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Staff Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Add New Field Staff</h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStaff.name}
                      onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newStaff.email}
                      onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={newStaff.password}
                      onChange={(e) => setNewStaff({...newStaff, password: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={newStaff.confirmPassword}
                      onChange={(e) => setNewStaff({...newStaff, confirmPassword: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={newStaff.department}
                    onChange={(e) => setNewStaff({...newStaff, department: e.target.value, jobRole: ''})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.value} value={dept.value}>
                        {dept.icon} {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                {newStaff.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Role *
                    </label>
                    <select
                      required
                      value={newStaff.jobRole}
                      onChange={(e) => setNewStaff({...newStaff, jobRole: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select Job Role</option>
                      {departments
                        .find(dept => dept.value === newStaff.department)
                        ?.jobRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (Years) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="50"
                      value={newStaff.experience}
                      onChange={(e) => setNewStaff({...newStaff, experience: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Workload (Complaints) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="50"
                      value={newStaff.maxWorkload}
                      onChange={(e) => setNewStaff({...newStaff, maxWorkload: parseInt(e.target.value) || 10})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="10-digit phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={newStaff.address}
                    onChange={(e) => setNewStaff({...newStaff, address: e.target.value})}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={newStaff.city}
                      onChange={(e) => setNewStaff({...newStaff, city: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={newStaff.zipCode}
                      onChange={(e) => setNewStaff({...newStaff, zipCode: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Create Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {isEditModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Edit Field Staff</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleEditStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedStaff.name}
                      onChange={(e) => setSelectedStaff({...selectedStaff, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={selectedStaff.email}
                      onChange={(e) => setSelectedStaff({...selectedStaff, email: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department *
                  </label>
                  <select
                    required
                    value={selectedStaff.department}
                    onChange={(e) => setSelectedStaff({...selectedStaff, department: e.target.value, jobRole: ''})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    {departments.map(dept => (
                      <option key={dept.value} value={dept.value}>
                        {dept.icon} {dept.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedStaff.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Role *
                    </label>
                    <select
                      required
                      value={selectedStaff.jobRole || ''}
                      onChange={(e) => setSelectedStaff({...selectedStaff, jobRole: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="">Select Job Role</option>
                      {departments
                        .find(dept => dept.value === selectedStaff.department)
                        ?.jobRoles.map(role => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience (Years) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max="50"
                      value={selectedStaff.experience || 0}
                      onChange={(e) => setSelectedStaff({...selectedStaff, experience: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Workload (Complaints) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="50"
                      value={selectedStaff.maxWorkload || 10}
                      onChange={(e) => setSelectedStaff({...selectedStaff, maxWorkload: parseInt(e.target.value) || 10})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={selectedStaff.phone || ''}
                    onChange={(e) => setSelectedStaff({...selectedStaff, phone: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="10-digit phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={selectedStaff.address || ''}
                    onChange={(e) => setSelectedStaff({...selectedStaff, address: e.target.value})}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={selectedStaff.city || ''}
                      onChange={(e) => setSelectedStaff({...selectedStaff, city: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={selectedStaff.zipCode || ''}
                      onChange={(e) => setSelectedStaff({...selectedStaff, zipCode: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedStaff.isActive}
                      onChange={(e) => setSelectedStaff({...selectedStaff, isActive: e.target.checked})}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Active</span>
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Update Staff
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && selectedStaff && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Reset Password</h3>
                <button
                  onClick={() => {
                    setIsResetPasswordModalOpen(false);
                    setResetPasswordData({ newPassword: '', confirmPassword: '' });
                    setSelectedStaff(null);
                    setShowNewPassword(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Staff Member:</strong> {selectedStaff.name}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  {selectedStaff.email}
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={resetPasswordData.newPassword}
                      onChange={(e) => setResetPasswordData({
                        ...resetPasswordData,
                        newPassword: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                    >
                      {showNewPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Must be at least 8 characters with 3 of: lowercase, uppercase, number, special character
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={resetPasswordData.confirmPassword}
                    onChange={(e) => setResetPasswordData({
                      ...resetPasswordData,
                      confirmPassword: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Confirm new password"
                    required
                  />
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Note:</strong> This will immediately change the staff member's password. 
                    Make sure to securely communicate the new password to them.
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetPasswordModalOpen(false);
                      setResetPasswordData({ newPassword: '', confirmPassword: '' });
                      setSelectedStaff(null);
                      setShowNewPassword(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Reset Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldStaffManagement;
