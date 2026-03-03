// Form validation utilities for the citizen report form

export const validateReportForm = {
  category: (value) => {
    if (!value) {
      return 'Please select an issue category';
    }
    return null;
  },

  description: (value) => {
    if (!value.trim()) {
      return 'Description is required';
    }
    if (value.trim().length < 10) {
      return 'Description must be at least 10 characters long';
    }
    if (value.trim().length > 1000) {
      return 'Description must not exceed 1000 characters';
    }
    return null;
  },

  address: (value) => {
    if (!value.trim()) {
      return 'Address is required';
    }
    if (value.trim().length < 5) {
      return 'Please provide a more detailed address';
    }
    return null;
  },

  city: (value) => {
    if (!value.trim()) {
      return 'City is required';
    }
    if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
      return 'City name should only contain letters and spaces';
    }
    return null;
  },

  pincode: (value) => {
    if (!value.trim()) {
      return 'Pincode is required';
    }
    if (!/^\d{6}$/.test(value.trim())) {
      return 'Pincode must be exactly 6 digits';
    }
    return null;
  },

  issueType: (value) => {
    if (!value) {
      return 'Please select an issue type';
    }
    return null;
  },

  images: (images) => {
    if (!images || images.length === 0) {
      return 'At least one image is required';
    }
    return null;
  },

  location: (selectedLocation, isLocationValid) => {
    if (!selectedLocation || !isLocationValid) {
      return 'Please select a valid location';
    }
    return null;
  }
};

// Validate a single field
export const validateField = (fieldName, value, additionalData = {}) => {
  const validator = validateReportForm[fieldName];
  if (!validator) return null;
  
  if (fieldName === 'images') {
    return validator(value);
  }
  
  if (fieldName === 'location') {
    return validator(value, additionalData.isLocationValid);
  }
  
  return validator(value);
};

// Validate entire form
export const validateEntireForm = (formData, images, selectedLocation, isLocationValid) => {
  const errors = {};
  
  // Validate location first
  const locationError = validateField('location', selectedLocation, { isLocationValid });
  if (locationError) {
    errors.location = locationError;
  }
  
  // Validate images
  const imagesError = validateField('images', images);
  if (imagesError) {
    errors.images = imagesError;
  }
  
  // Validate form fields
  const fieldsToValidate = ['category', 'description', 'address', 'city', 'pincode', 'issueType'];
  fieldsToValidate.forEach(field => {
    const error = validateField(field, formData[field]);
    if (error) {
      errors[field] = error;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// File validation utilities
export const validateImageFile = (file) => {
  const errors = [];
  
  if (file.size > 5 * 1024 * 1024) {
    errors.push(`File ${file.name} is too large. Maximum size is 5MB.`);
  }
  
  if (!file.type.startsWith('image/')) {
    errors.push(`File ${file.name} is not an image.`);
  }
  
  return errors;
};

export const validateVideoFile = (file) => {
  const errors = [];
  
  if (file.size > 50 * 1024 * 1024) {
    errors.push('Video file is too large. Maximum size is 50MB.');
  }
  
  if (!file.type.startsWith('video/')) {
    errors.push('Please select a valid video file.');
  }
  
  return errors;
};