// AI Configuration for UrbanEye
// This file allows you to control AI usage and costs

const aiConfig = {
  // Enable/disable AI analysis
  enabled: true,
  
  // Cost control settings
  costControl: {
    // Maximum daily cost in USD
    maxDailyCost: 10,
    
    // Maximum monthly cost in USD
    maxMonthlyCost: 50,
    
    // Cost per complaint (estimated)
    costPerComplaint: 0.02,
    
    // Maximum complaints per day
    maxComplaintsPerDay: 500
  },
  
  // Rate limiting
  rateLimiting: {
    // Maximum requests per minute
    maxRequestsPerMinute: 10,
    
    // Delay between requests (ms)
    requestDelay: 1000
  },
  
  // Fallback settings
  fallback: {
    // Use fallback when AI fails
    useFallbackOnError: true,
    
    // Use fallback for certain categories
    useFallbackForCategories: ['other'],
    
    // Minimum confidence threshold for AI results
    minConfidenceThreshold: 0.6
  },
  
  // Image analysis settings
  imageAnalysis: {
    // Enable image analysis
    enabled: true,
    
    // Maximum images to analyze per complaint
    maxImagesPerComplaint: 3,
    
    // Maximum image size (MB)
    maxImageSize: 5,
    
    // Skip image analysis if text analysis confidence is high
    skipIfTextConfident: true,
    textConfidenceThreshold: 0.8
  },
  
  // Time-based restrictions
  timeRestrictions: {
    // Enable time-based restrictions
    enabled: false,
    
    // Only use AI during business hours (9 AM - 6 PM)
    businessHoursOnly: false,
    
    // Business hours (24-hour format)
    businessHours: {
      start: 9,
      end: 18
    }
  }
};

// Helper functions
const helpers = {
  // Check if AI should be used based on current settings
  shouldUseAI() {
    if (!aiConfig.enabled) {
      return false;
    }
    
    // Check time restrictions
    if (aiConfig.timeRestrictions.enabled) {
      const now = new Date();
      const currentHour = now.getHours();
      
      if (aiConfig.timeRestrictions.businessHoursOnly) {
        const { start, end } = aiConfig.timeRestrictions.businessHours;
        if (currentHour < start || currentHour >= end) {
          return false;
        }
      }
    }
    
    return true;
  },
  
  // Check if we should analyze images
  shouldAnalyzeImages(textConfidence = 0) {
    if (!aiConfig.imageAnalysis.enabled) {
      return false;
    }
    
    if (aiConfig.imageAnalysis.skipIfTextConfident && 
        textConfidence >= aiConfig.imageAnalysis.textConfidenceThreshold) {
      return false;
    }
    
    return true;
  },
  
  // Get estimated cost for a complaint
  getEstimatedCost(hasImages = false) {
    let cost = aiConfig.costControl.costPerComplaint;
    
    if (hasImages) {
      cost += 0.01; // Additional cost for image analysis
    }
    
    return cost;
  },
  
  // Check if we're within cost limits
  isWithinCostLimits(dailyUsage = 0, monthlyUsage = 0) {
    const dailyCost = dailyUsage * aiConfig.costControl.costPerComplaint;
    const monthlyCost = monthlyUsage * aiConfig.costControl.costPerComplaint;
    
    return dailyCost <= aiConfig.costControl.maxDailyCost &&
           monthlyCost <= aiConfig.costControl.maxMonthlyCost;
  }
};

module.exports = {
  config: aiConfig,
  helpers
};

