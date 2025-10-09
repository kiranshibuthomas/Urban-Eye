const express = require('express');
const GeofenceConfig = require('../models/GeofenceConfig');
const AuditLog = require('../models/AuditLog');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/geofence-config
// @desc    Get active geofence configuration (Public for frontend)
// @access  Public (needed for report issue page)
router.get('/', async (req, res) => {
  try {
    const config = await GeofenceConfig.getActiveConfig();
    
    res.json({
      success: true,
      config: config.toClientConfig()
    });
  } catch (error) {
    console.error('Get geofence config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geofence configuration'
    });
  }
});

// @route   GET /api/geofence-config/admin
// @desc    Get geofence configuration for admin (with full details)
// @access  Private (Admin only)
router.get('/admin', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const config = await GeofenceConfig.getActiveConfig();
    
    res.json({
      success: true,
      config: config
    });
  } catch (error) {
    console.error('Get admin geofence config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch geofence configuration'
    });
  }
});

// @route   PUT /api/geofence-config
// @desc    Update geofence configuration
// @access  Private (Admin only)
router.put('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const {
      panchayathName,
      district,
      state,
      country,
      centerLatitude,
      centerLongitude,
      radiusKm,
      bufferKm,
      strictMode,
      warningMessage,
      successMessage
    } = req.body;

    // Validate required fields
    if (!panchayathName || !centerLatitude || !centerLongitude || !radiusKm) {
      return res.status(400).json({
        success: false,
        message: 'Panchayath name, center coordinates, and radius are required'
      });
    }

    // Validate coordinate ranges
    if (centerLatitude < -90 || centerLatitude > 90) {
      return res.status(400).json({
        success: false,
        message: 'Latitude must be between -90 and 90'
      });
    }

    if (centerLongitude < -180 || centerLongitude > 180) {
      return res.status(400).json({
        success: false,
        message: 'Longitude must be between -180 and 180'
      });
    }

    // Validate radius
    if (radiusKm < 0.1 || radiusKm > 100) {
      return res.status(400).json({
        success: false,
        message: 'Radius must be between 0.1 and 100 km'
      });
    }

    let config = await GeofenceConfig.findOne({ isActive: true });
    
    if (!config) {
      // Create new config
      config = new GeofenceConfig({
        panchayathName,
        district: district || 'Kottayam',
        state: state || 'Kerala',
        country: country || 'India',
        centerLatitude: parseFloat(centerLatitude),
        centerLongitude: parseFloat(centerLongitude),
        radiusKm: parseFloat(radiusKm),
        bufferKm: bufferKm ? parseFloat(bufferKm) : 2,
        strictMode: strictMode !== undefined ? strictMode : true,
        warningMessage: warningMessage || undefined,
        successMessage: successMessage || undefined,
        lastUpdatedBy: req.user._id,
        isActive: true
      });
    } else {
      // Update existing config
      config.panchayathName = panchayathName;
      config.district = district || config.district;
      config.state = state || config.state;
      config.country = country || config.country;
      config.centerLatitude = parseFloat(centerLatitude);
      config.centerLongitude = parseFloat(centerLongitude);
      config.radiusKm = parseFloat(radiusKm);
      config.bufferKm = bufferKm ? parseFloat(bufferKm) : config.bufferKm;
      config.strictMode = strictMode !== undefined ? strictMode : config.strictMode;
      if (warningMessage) config.warningMessage = warningMessage;
      if (successMessage) config.successMessage = successMessage;
      config.lastUpdatedBy = req.user._id;
    }

    await config.save();

    // Log the configuration change
    try {
      await AuditLog.logAction({
        action: 'update_geofence_config',
        entityType: 'geofence_config',
        entityId: config._id,
        performedBy: req.user._id,
        performedByEmail: req.user.email,
        details: {
          panchayathName,
          center: { latitude: centerLatitude, longitude: centerLongitude },
          radiusKm,
          bufferKm
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (auditError) {
      console.error('Failed to log geofence config update:', auditError);
    }

    res.json({
      success: true,
      message: 'Geofence configuration updated successfully',
      config: config.toClientConfig()
    });

  } catch (error) {
    console.error('Update geofence config error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update geofence configuration'
    });
  }
});

// @route   POST /api/geofence-config/test
// @desc    Test if coordinates are within configured geofence
// @access  Private (Admin only)
router.post('/test', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const config = await GeofenceConfig.getActiveConfig();
    
    // Quick bounding box check
    const withinBoundingBox = (
      latitude >= config.boundingBox.minLat &&
      latitude <= config.boundingBox.maxLat &&
      longitude >= config.boundingBox.minLng &&
      longitude <= config.boundingBox.maxLng
    );

    // Calculate distance from center
    const R = 6371; // Earth's radius in km
    const dLat = (latitude - config.centerLatitude) * Math.PI / 180;
    const dLng = (longitude - config.centerLongitude) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(config.centerLatitude * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const withinRadius = distance <= config.radiusKm;

    res.json({
      success: true,
      result: {
        withinBoundingBox,
        withinRadius,
        distance: distance.toFixed(2),
        radiusKm: config.radiusKm,
        isInside: withinBoundingBox && withinRadius,
        center: {
          latitude: config.centerLatitude,
          longitude: config.centerLongitude
        }
      }
    });

  } catch (error) {
    console.error('Test geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test geofence'
    });
  }
});

module.exports = router;

