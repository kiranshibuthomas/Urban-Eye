const fs = require('fs').promises;
const path = require('path');

/**
 * AI-powered complaint categorization service
 * Analyzes title, description, and images to determine complaint category
 */

// Define the 4 main categories with their keywords and characteristics
const CATEGORIES = {
  public_works: {
    keywords: [
      'road', 'street', 'pothole', 'crack', 'pavement', 'asphalt', 'highway', 'lane',
      'traffic', 'intersection', 'crosswalk', 'sidewalk', 'curb', 'bridge', 'tunnel',
      'construction', 'repair', 'maintenance', 'surface', 'damaged', 'broken',
      'uneven', 'rough', 'hole', 'bump', 'barrier', 'sign', 'marking', 'paint',
      'drain', 'drainage', 'sewer', 'sewage', 'overflow', 'flooding', 'blockage', 'clog',
      'infrastructure', 'public', 'works', 'building', 'structure'
    ],
    description: 'Roads, infrastructure, drainage, construction issues',
    department: 'public_works',
    priority_indicators: {
      high: ['dangerous', 'accident', 'major', 'blocked', 'impassable'],
      medium: ['damaged', 'cracked', 'uneven', 'needs repair'],
      low: ['minor', 'small', 'cosmetic']
    }
  },
  electricity: {
    keywords: [
      'electricity', 'power', 'electric', 'wire', 'cable', 'pole', 'transformer',
      'outage', 'blackout', 'voltage', 'current', 'shock', 'sparking', 'burning',
      'light', 'lighting', 'street light', 'lamp', 'bulb', 'switch', 'meter',
      'connection', 'supply', 'grid', 'line', 'overhead', 'underground'
    ],
    description: 'Electrical issues, power outages, street lighting problems',
    department: 'electricity',
    priority_indicators: {
      urgent: ['fire', 'burning', 'sparking', 'shock', 'dangerous'],
      high: ['outage', 'blackout', 'no power', 'major'],
      medium: ['flickering', 'dim', 'intermittent'],
      low: ['bulb', 'minor']
    }
  },
  water_supply: {
    keywords: [
      'water', 'pipe', 'leak', 'burst', 'supply', 'pressure', 'flow', 'tap',
      'faucet', 'valve', 'meter', 'connection', 'dirty', 'contaminated',
      'quality', 'taste', 'smell', 'color', 'brown', 'yellow', 'muddy',
      'no water', 'low pressure', 'pipeline', 'plumbing', 'hydrant'
    ],
    description: 'Water supply issues, pipe leaks, water quality problems',
    department: 'water_supply',
    priority_indicators: {
      urgent: ['burst', 'major leak', 'contaminated', 'no water'],
      high: ['leak', 'low pressure', 'dirty water'],
      medium: ['slow leak', 'pressure issue', 'minor leak'],
      low: ['taste', 'smell', 'color']
    }
  },
  sanitation: {
    keywords: [
      'waste', 'garbage', 'trash', 'rubbish', 'bin', 'container', 'collection',
      'pickup', 'disposal', 'dump', 'litter', 'scattered', 'overflowing',
      'smell', 'odor', 'dirty', 'hygiene', 'sanitation', 'cleaning',
      'sweeping', 'maintenance', 'recycling', 'compost', 'organic'
    ],
    description: 'Waste collection, garbage disposal, sanitation issues',
    department: 'sanitation',
    priority_indicators: {
      high: ['overflowing', 'scattered', 'health hazard', 'smell'],
      medium: ['full', 'missed collection', 'dirty'],
      low: ['maintenance', 'cleaning needed']
    }
  }
};

/**
 * Analyze text content for category classification
 */
function analyzeTextContent(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const categoryScores = {};

  // Initialize scores
  Object.keys(CATEGORIES).forEach(category => {
    categoryScores[category] = 0;
  });

  // Score based on keyword matches
  Object.entries(CATEGORIES).forEach(([category, config]) => {
    config.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        categoryScores[category] += matches.length;
      }
    });
  });

  return categoryScores;
}

/**
 * Enhanced priority determination based on content analysis
 */
function determinePriority(title, description, category) {
  const text = `${title} ${description}`.toLowerCase();
  let priorityScore = 0;
  let priorityReasons = [];

  // Safety and emergency keywords (highest priority)
  const emergencyKeywords = [
    'fire', 'explosion', 'gas leak', 'electrical hazard', 'exposed wire', 'sparking',
    'collapse', 'structural damage', 'dangerous', 'emergency', 'accident', 'injury',
    'flooding', 'burst pipe', 'major leak', 'contaminated water', 'sewage overflow',
    'blocked road', 'impassable', 'traffic hazard', 'unsafe', 'risk', 'danger'
  ];

  // High impact keywords
  const highImpactKeywords = [
    'no water', 'power outage', 'blackout', 'major', 'large', 'deep', 'widespread',
    'affecting many', 'school', 'hospital', 'main road', 'busy street', 'public area',
    'overflowing', 'health hazard', 'smell', 'odor', 'pest', 'rats', 'insects'
  ];

  // Medium priority keywords
  const mediumKeywords = [
    'broken', 'damaged', 'not working', 'needs repair', 'maintenance', 'leak',
    'flickering', 'dim', 'slow', 'partial', 'intermittent', 'clogged', 'blocked'
  ];

  // Low priority keywords
  const lowKeywords = [
    'minor', 'small', 'cosmetic', 'aesthetic', 'paint', 'faded', 'old', 'worn',
    'cleaning needed', 'maintenance due', 'replacement needed'
  ];

  // Check for emergency/safety issues
  emergencyKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      priorityScore += 100;
      priorityReasons.push(`Safety concern: ${keyword}`);
    }
  });

  // Check for high impact issues
  highImpactKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      priorityScore += 50;
      priorityReasons.push(`High impact: ${keyword}`);
    }
  });

  // Check for medium priority issues
  mediumKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      priorityScore += 25;
      priorityReasons.push(`Standard issue: ${keyword}`);
    }
  });

  // Check for low priority indicators
  lowKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      priorityScore += 10;
      priorityReasons.push(`Minor issue: ${keyword}`);
    }
  });

  // Category-specific priority adjustments
  const categoryPriorityBonus = {
    electricity: 20, // Electrical issues can be dangerous
    water_supply: 15, // Water issues affect daily life
    public_works: 10, // Infrastructure is important
    sanitation: 5    // Sanitation issues are usually less urgent
  };

  priorityScore += categoryPriorityBonus[category] || 0;

  // Location-based priority (if near sensitive areas)
  const sensitiveLocationKeywords = [
    'school', 'hospital', 'clinic', 'playground', 'park', 'market', 'bus stop',
    'main road', 'highway', 'bridge', 'intersection', 'crossing'
  ];

  sensitiveLocationKeywords.forEach(location => {
    if (text.includes(location)) {
      priorityScore += 30;
      priorityReasons.push(`Near sensitive location: ${location}`);
    }
  });

  // Time-sensitive keywords
  const timeKeywords = [
    'urgent', 'immediate', 'asap', 'emergency', 'now', 'today', 'quickly'
  ];

  timeKeywords.forEach(keyword => {
    if (text.includes(keyword)) {
      priorityScore += 15;
      priorityReasons.push(`Time-sensitive: ${keyword}`);
    }
  });

  // Determine final priority based on score
  let finalPriority;
  let confidence;

  if (priorityScore >= 100) {
    finalPriority = 'urgent';
    confidence = 0.9;
  } else if (priorityScore >= 60) {
    finalPriority = 'high';
    confidence = 0.8;
  } else if (priorityScore >= 30) {
    finalPriority = 'medium';
    confidence = 0.7;
  } else {
    finalPriority = 'low';
    confidence = 0.6;
  }

  return {
    priority: finalPriority,
    confidence: confidence,
    score: priorityScore,
    reasoning: priorityReasons.slice(0, 3), // Top 3 reasons
    analysis: {
      safetyScore: emergencyKeywords.filter(k => text.includes(k)).length * 100,
      impactScore: highImpactKeywords.filter(k => text.includes(k)).length * 50,
      locationScore: sensitiveLocationKeywords.filter(k => text.includes(k)).length * 30,
      categoryBonus: categoryPriorityBonus[category] || 0
    }
  };
}

/**
 * Analyze images for category hints (basic implementation)
 * In a real-world scenario, you would use computer vision APIs like Google Vision, AWS Rekognition, etc.
 */
async function analyzeImages(imagePaths) {
  // This is a placeholder for image analysis
  // In production, you would integrate with AI services like:
  // - Google Cloud Vision API
  // - AWS Rekognition
  // - Azure Computer Vision
  // - Custom trained models

  const imageAnalysis = {
    detectedObjects: [],
    confidence: 0,
    suggestedCategory: null
  };

  try {
    // For now, we'll do basic filename analysis as a placeholder
    for (const imagePath of imagePaths) {
      const filename = path.basename(imagePath).toLowerCase();
      
      // Basic keyword detection in filenames
      if (filename.includes('road') || filename.includes('street') || filename.includes('pothole')) {
        imageAnalysis.suggestedCategory = 'public_works';
        imageAnalysis.confidence = 0.7;
      } else if (filename.includes('electric') || filename.includes('power') || filename.includes('light')) {
        imageAnalysis.suggestedCategory = 'electricity';
        imageAnalysis.confidence = 0.7;
      } else if (filename.includes('water') || filename.includes('pipe') || filename.includes('leak')) {
        imageAnalysis.suggestedCategory = 'water_supply';
        imageAnalysis.confidence = 0.7;
      } else if (filename.includes('waste') || filename.includes('garbage') || filename.includes('trash')) {
        imageAnalysis.suggestedCategory = 'sanitation';
        imageAnalysis.confidence = 0.7;
      }
    }

    // TODO: Implement actual image analysis
    // Example integration with Google Vision API:
    /*
    const vision = require('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();
    
    for (const imagePath of imagePaths) {
      const [result] = await client.labelDetection(imagePath);
      const labels = result.labelAnnotations;
      
      // Analyze labels to determine category
      labels.forEach(label => {
        // Match labels to categories
        if (label.description.toLowerCase().includes('road')) {
          imageAnalysis.suggestedCategory = 'public_works';
          imageAnalysis.confidence = label.score;
        }
        // ... more label matching logic
      });
    }
    */

  } catch (error) {
    console.error('Image analysis error:', error);
  }

  return imageAnalysis;
}

/**
 * Main categorization function
 */
async function categorizeComplaint(title, description, imagePaths = []) {
  try {
    // Analyze text content
    const textScores = analyzeTextContent(title, description);
    
    // Analyze images (if any)
    const imageAnalysis = await analyzeImages(imagePaths);
    
    // Combine text and image analysis
    let finalCategory = 'road_issues'; // Default category
    let maxScore = 0;
    let confidence = 0;

    // Find category with highest text score
    Object.entries(textScores).forEach(([category, score]) => {
      if (score > maxScore) {
        maxScore = score;
        finalCategory = category;
        confidence = Math.min(score * 0.2, 0.9); // Convert to confidence score
      }
    });

    // If image analysis suggests a category with high confidence, use it
    if (imageAnalysis.suggestedCategory && imageAnalysis.confidence > 0.6) {
      finalCategory = imageAnalysis.suggestedCategory;
      confidence = Math.max(confidence, imageAnalysis.confidence);
    }

    // If no clear category found, default to road_issues
    if (maxScore === 0 && !imageAnalysis.suggestedCategory) {
      finalCategory = 'road_issues';
      confidence = 0.3;
    }

    // Determine priority with enhanced analysis
    const priorityAnalysis = determinePriority(title, description, finalCategory);

    return {
      category: finalCategory,
      priority: priorityAnalysis.priority,
      confidence: Math.max(confidence, priorityAnalysis.confidence),
      analysis: {
        textScores,
        imageAnalysis,
        priorityAnalysis,
        reasoning: `Categorized as ${finalCategory} with ${priorityAnalysis.priority} priority (score: ${priorityAnalysis.score})`
      }
    };

  } catch (error) {
    console.error('Categorization error:', error);
    
    // Return default categorization on error
    return {
      category: 'road_issues',
      priority: 'medium',
      confidence: 0.1,
      analysis: {
        error: error.message,
        reasoning: 'Default categorization due to analysis error'
      }
    };
  }
}

/**
 * Get department for a category
 */
function getDepartmentForCategory(category) {
  return CATEGORIES[category]?.department || 'public_works';
}

/**
 * Get available categories
 */
function getAvailableCategories() {
  return Object.keys(CATEGORIES).map(key => ({
    key,
    description: CATEGORIES[key].description,
    department: CATEGORIES[key].department
  }));
}

module.exports = {
  categorizeComplaint,
  getDepartmentForCategory,
  getAvailableCategories,
  CATEGORIES
};