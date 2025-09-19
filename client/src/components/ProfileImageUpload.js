import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { motion } from 'framer-motion';
import { FiUpload, FiX, FiCamera, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ProfileImageUpload = forwardRef(({ user, onAvatarUpdate }, ref) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    uploadAvatar: handleUpload,
    hasChanges: () => selectedFile !== null || isDeleting,
    handleCancel: handleCancel
  }));

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      // Store the selected file
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return { success: false, message: 'No image selected' };
    }

    const formData = new FormData();
    formData.append('avatar', selectedFile);

    try {
      const response = await fetch('/api/auth/upload-avatar', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (data.success) {
        setPreview(null);
        setSelectedFile(null);
        if (onAvatarUpdate) {
          onAvatarUpdate(data.user);
        }
        // Reset file input
        fileInputRef.current.value = '';
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Failed to upload avatar' };
      }
    } catch (error) {
      console.error('Upload error:', error);
      return { success: false, message: 'Failed to upload avatar' };
    }
  };

  const handleDelete = async () => {
    if (!user.customAvatar) {
      return { success: false, message: 'No custom avatar to delete' };
    }

    setIsDeleting(true);
    try {
      const response = await fetch('/api/auth/delete-avatar', {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        if (onAvatarUpdate) {
          onAvatarUpdate(data.user);
        }
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Failed to delete avatar' };
      }
    } catch (error) {
      console.error('Delete error:', error);
      return { success: false, message: 'Failed to delete avatar' };
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Avatar Display */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="h-20 w-20 object-cover"
              />
            ) : user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="h-20 w-20 object-cover"
              />
            ) : (
              <FiCamera className="h-8 w-8 text-gray-400" />
            )}
          </div>
          {user?.customAvatar && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <FiTrash2 className="h-3 w-3" />
            </button>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
          <p className="text-sm text-gray-500">
            {user?.customAvatar ? 'Custom uploaded image' : 'Using default avatar'}
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload New Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center justify-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors"
          >
            <FiUpload className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">Choose image file</span>
          </button>
        </div>

        {/* Preview Info */}
        {preview && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              ✓ New image selected. Click "Save" to upload.
            </p>
            <button
              onClick={handleCancel}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Remove selection
            </button>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="text-xs text-gray-500">
        <p>• Supported formats: JPG, PNG, GIF</p>
        <p>• Maximum file size: 5MB</p>
        <p>• Recommended size: 400x400 pixels</p>
      </div>
    </div>
  );
});

export default ProfileImageUpload;
