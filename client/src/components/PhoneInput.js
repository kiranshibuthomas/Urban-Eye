import React, { useState, useRef, useEffect } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const PhoneInput = ({ value, onChange, className, placeholder, error }) => {
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ code: '+91', name: 'India' });
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const countryCodes = [
    { code: '+91', name: 'India' },
    { code: '+1', name: 'USA/Canada' },
    { code: '+44', name: 'UK' },
    { code: '+61', name: 'Australia' },
    { code: '+86', name: 'China' },
    { code: '+81', name: 'Japan' },
    { code: '+49', name: 'Germany' },
    { code: '+33', name: 'France' },
    { code: '+39', name: 'Italy' },
    { code: '+34', name: 'Spain' },
    { code: '+31', name: 'Netherlands' },
    { code: '+46', name: 'Sweden' },
    { code: '+47', name: 'Norway' },
    { code: '+45', name: 'Denmark' },
    { code: '+358', name: 'Finland' },
    { code: '+48', name: 'Poland' },
    { code: '+420', name: 'Czech Republic' },
    { code: '+36', name: 'Hungary' },
    { code: '+43', name: 'Austria' },
    { code: '+41', name: 'Switzerland' },
    { code: '+32', name: 'Belgium' },
    { code: '+351', name: 'Portugal' },
    { code: '+30', name: 'Greece' },
    { code: '+90', name: 'Turkey' },
    { code: '+7', name: 'Russia' },
    { code: '+380', name: 'Ukraine' },
    { code: '+55', name: 'Brazil' },
    { code: '+54', name: 'Argentina' },
    { code: '+56', name: 'Chile' },
    { code: '+57', name: 'Colombia' },
    { code: '+58', name: 'Venezuela' },
    { code: '+593', name: 'Ecuador' },
    { code: '+51', name: 'Peru' },
    { code: '+52', name: 'Mexico' },
    { code: '+971', name: 'UAE' },
    { code: '+966', name: 'Saudi Arabia' },
    { code: '+972', name: 'Israel' },
    { code: '+20', name: 'Egypt' },
    { code: '+27', name: 'South Africa' },
    { code: '+234', name: 'Nigeria' },
    { code: '+254', name: 'Kenya' },
    { code: '+233', name: 'Ghana' },
    { code: '+256', name: 'Uganda' },
    { code: '+255', name: 'Tanzania' },
    { code: '+251', name: 'Ethiopia' },
    { code: '+880', name: 'Bangladesh' },
    { code: '+92', name: 'Pakistan' },
    { code: '+94', name: 'Sri Lanka' },
    { code: '+95', name: 'Myanmar' },
    { code: '+66', name: 'Thailand' },
    { code: '+84', name: 'Vietnam' },
    { code: '+65', name: 'Singapore' },
    { code: '+60', name: 'Malaysia' },
    { code: '+62', name: 'Indonesia' },
    { code: '+63', name: 'Philippines' },
    { code: '+82', name: 'South Korea' },
    { code: '+852', name: 'Hong Kong' },
    { code: '+886', name: 'Taiwan' },
    { code: '+853', name: 'Macau' },
    { code: '+977', name: 'Nepal' },
    { code: '+975', name: 'Bhutan' },
    { code: '+960', name: 'Maldives' },
    { code: '+976', name: 'Mongolia' },
    { code: '+856', name: 'Laos' },
    { code: '+855', name: 'Cambodia' },
    { code: '+673', name: 'Brunei' },
    { code: '+670', name: 'East Timor' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCountryCodes(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setShowCountryCodes(false);
    
    // Extract only the digits from current value (remove country code and spaces)
    const digitsOnly = value.replace(/[^\d]/g, '');
    
    // Create new value with selected country code
    const newValue = digitsOnly ? `${country.code} ${digitsOnly}` : '';
    
    onChange({ target: { name: 'phone', value: newValue } });
    
    // Focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    let inputValue = e.target.value;
    
    // Remove all non-digit characters except + and space
    const cleanValue = inputValue.replace(/[^\d+\s]/g, '');
    
    // If it starts with a country code, keep it
    if (cleanValue.startsWith('+')) {
      // Find the country code
      const countryCode = countryCodes.find(country => 
        cleanValue.startsWith(country.code)
      );
      
      if (countryCode) {
        // Extract digits after country code
        const digitsAfterCode = cleanValue.substring(countryCode.code.length).replace(/\s/g, '');
        
        // Only allow 10 digits after country code
        if (digitsAfterCode.length <= 10) {
          const formattedValue = digitsAfterCode ? `${countryCode.code} ${digitsAfterCode}` : countryCode.code;
          onChange({ target: { name: 'phone', value: formattedValue } });
        }
      } else {
        // Invalid country code, just pass the value
        onChange(e);
      }
    } else {
      // No country code, treat as plain digits
      const digitsOnly = cleanValue.replace(/\s/g, '');
      
      if (digitsOnly.length <= 10) {
        onChange({ target: { name: 'phone', value: digitsOnly } });
      }
    }
  };

  const handleInputKeyDown = (e) => {
    // Allow all navigation and editing keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End', 'PageUp', 'PageDown', 'Insert'
    ];
    
    if (allowedKeys.includes(e.key)) {
      return; // Allow these keys
    }
    
    // Allow digits, +, and space
    if (/[\d+\s]/.test(e.key)) {
      return; // Allow these characters
    }
    
    // Prevent all other keys
    e.preventDefault();
  };

  const getDisplayValue = () => {
    if (!value) return '';
    
    // If value already has a country code, extract only the digits
    if (value.startsWith('+')) {
      const digitsOnly = value.replace(/[^\d]/g, '');
      return digitsOnly;
    }
    
    // If value is just digits, return as is
    return value;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex">
        {/* Country Code Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowCountryCodes(!showCountryCodes)}
            className="px-3 py-3 bg-gray-100 border-r border-gray-200 rounded-l-md hover:bg-gray-200 transition-colors duration-200 flex items-center space-x-1"
          >
            <span className="text-sm font-medium text-gray-700">{selectedCountry.code}</span>
            <FiChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          
          {/* Country Codes Dropdown */}
          {showCountryCodes && (
            <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
              <div className="max-h-48 overflow-y-auto">
                {countryCodes.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountrySelect(country)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span className="text-sm">{country.name}</span>
                    <span className="text-sm font-medium text-gray-600">{country.code}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Phone Number Input */}
        <input
          ref={inputRef}
          type="tel"
          value={getDisplayValue()}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className={`flex-1 px-4 py-3 bg-gray-100 border-0 rounded-r-md focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${
            error ? 'focus:ring-red-500' : 'focus:ring-emerald-500'
          } ${className}`}
          placeholder={placeholder || "9876543210"}
          autoComplete="tel"
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default PhoneInput;
