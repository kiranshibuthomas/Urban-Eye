// Load environment variables
require('dotenv').config({ path: './config.env' });

// Try to load OpenAI, but don't fail if it's not available
let OpenAI;
try {
  OpenAI = require('openai');
} catch (error) {
  // OpenAI module not available - AI features disabled
  OpenAI = null;
}

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

const { config: aiConfig, helpers } = require('../config/aiConfig');

// Initialize OpenAI only if API key is available and module is loaded
let openai = null;
if (OpenAI && process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

// Category mapping for better organization
const CATEGORY_MAPPING = {
  'road_issues': {
    keywords: ['pothole', 'road damage', 'crack', 'bump', 'asphalt', 'pavement', 'street', 'highway', 'road surface', 'pavement damage'],
    description: 'Road infrastructure issues including potholes, cracks, and surface damage'
  },
  'waste_management': {
    keywords: ['garbage', 'trash', 'waste', 'litter', 'dump', 'rubbish', 'refuse', 'bin', 'container', 'cleanup'],
    description: 'Waste collection, disposal, and management issues'
  },
  'water_supply': {
    keywords: ['water leak', 'pipe burst', 'water supply', 'leakage', 'flooding', 'drainage', 'sewer', 'water pressure', 'pipe damage'],
    description: 'Water supply, leaks, and drainage issues'
  },
  'electricity': {
    keywords: ['power outage', 'electrical', 'wire', 'cable', 'transformer', 'electricity', 'power line', 'electrical hazard'],
    description: 'Electrical infrastructure and power supply issues'
  },
  'street_lighting': {
    keywords: ['street light', 'lamp post', 'lighting', 'dark', 'illumination', 'bulb', 'light fixture'],
    description: 'Street lighting and public illumination issues'
  },
  'drainage': {
    keywords: ['drain', 'sewer', 'flooding', 'water logging', 'blocked drain', 'overflow', 'drainage system'],
    description: 'Drainage and sewer system issues'
  },
  'parks_recreation': {
    keywords: ['park', 'playground', 'recreation', 'garden', 'bench', 'equipment', 'facility', 'amenity'],
    description: 'Parks, playgrounds, and recreational facility issues'
  },
  'safety_security': {
    keywords: ['safety', 'security', 'dangerous', 'hazard', 'unsafe', 'crime', 'vandalism', 'theft'],
    description: 'Safety and security concerns'
  },
  'noise_pollution': {
    keywords: ['noise', 'loud', 'disturbance', 'sound', 'music', 'construction noise', 'traffic noise'],
    description: 'Noise pollution and disturbance issues'
  },
  'air_pollution': {
    keywords: ['air pollution', 'smoke', 'dust', 'emission', 'fumes', 'air quality', 'pollution'],
    description: 'Air quality and pollution issues'
  },
  'public_transport': {
    keywords: ['bus', 'transport', 'public transport', 'transit', 'stop', 'station', 'route', 'schedule'],
    description: 'Public transportation issues'
  }
};

// Priority mapping based on content analysis
const PRIORITY_INDICATORS = {
  'urgent': {
    keywords: ['emergency', 'urgent', 'immediate', 'dangerous', 'hazard', 'safety risk', 'blocking', 'flooding', 'fire', 'gas leak'],
    weight: 10
  },
  'high': {
    keywords: ['important', 'serious', 'major', 'significant', 'affecting', 'disruption', 'broken', 'damaged', 'not working'],
    weight: 7
  },
  'medium': {
    keywords: ['issue', 'problem', 'concern', 'needs attention', 'maintenance', 'repair'],
    weight: 5
  },
  'low': {
    keywords: ['minor', 'small', 'cosmetic', 'improvement', 'enhancement', 'suggestion'],
    weight: 2
  }
};

class AIService {
  /**
   * Analyze complaint content and images to determine category and priority
   * @param {Object} complaintData - The complaint data including title, description, and images
   * @returns {Object} Analysis result with category, priority, and confidence scores
   */
  static async analyzeComplaint(complaintData) {
    try {
      const { title, description, images } = complaintData;
      
      // Combine text content for analysis
      const textContent = `${title} ${description}`.toLowerCase();
      
      // Check if we should use AI or fallback
      const shouldUseAI = this.shouldUseAI();
      
      let textAnalysis;
      if (shouldUseAI) {
        try {
          // Try AI analysis first
          textAnalysis = await this.analyzeTextContent(textContent);
        } catch (aiError) {
          // AI analysis failed, using fallback
          textAnalysis = this.fallbackTextAnalysis(textContent);
        }
      } else {
        // Use fallback analysis directly
        // Using fallback analysis (AI quota exceeded or disabled)
        textAnalysis = this.fallbackTextAnalysis(textContent);
      }
      
      // Analyze images if available and AI is working
      let imageAnalysis = null;
      if (images && images.length > 0 && shouldUseAI) {
        try {
          imageAnalysis = await this.analyzeImages(images);
        } catch (imageError) {
          // Image analysis failed, skipping
        }
      }
      
      // Combine results
      const finalCategory = this.combineAnalysisResults(textAnalysis, imageAnalysis);
      const priority = this.determinePriority(textContent, finalCategory);
      
      return {
        category: finalCategory.category,
        priority: priority,
        confidence: finalCategory.confidence,
        reasoning: finalCategory.reasoning,
        imageAnalysis: imageAnalysis,
        usedAI: shouldUseAI
      };
      
    } catch (error) {
      console.error('AI analysis error:', error);
      // Fallback to default category
      return {
        category: 'other',
        priority: 'medium',
        confidence: 0.5,
        reasoning: 'Analysis failed, using default category',
        imageAnalysis: null,
        usedAI: false
      };
    }
  }

  /**
   * Determine if we should use AI or fallback analysis
   * @returns {boolean} Whether to use AI analysis
   */
  static shouldUseAI() {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY || !openai) {
      // AI not available: OpenAI API key missing or invalid
      return false;
    }
    
    // Use configuration helper
    return helpers.shouldUseAI();
  }

  /**
   * Analyze text content using OpenAI
   * @param {string} textContent - The text to analyze
   * @returns {Object} Text analysis result
   */
  static async analyzeTextContent(textContent) {
    try {
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }

      const prompt = `
        Analyze the following complaint text and determine the most appropriate category from these options:
        ${Object.keys(CATEGORY_MAPPING).map(key => `- ${key}: ${CATEGORY_MAPPING[key].description}`).join('\n')}
        
        Text: "${textContent}"
        
        Respond with a JSON object containing:
        {
          "category": "most_appropriate_category",
          "confidence": 0.0-1.0,
          "reasoning": "brief explanation of why this category was chosen",
          "keywords_found": ["list", "of", "relevant", "keywords"]
        }
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at categorizing urban infrastructure complaints. Analyze the text and determine the most appropriate category with high accuracy."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      });

      const result = JSON.parse(response.choices[0].message.content);
      
      // Validate category
      if (!CATEGORY_MAPPING[result.category]) {
        result.category = 'other';
        result.confidence = 0.5;
      }
      
      return result;
      
    } catch (error) {
      console.error('Text analysis error:', error);
      // Fallback to keyword-based analysis
      return this.fallbackTextAnalysis(textContent);
    }
  }

  /**
   * Fallback text analysis using keyword matching
   * @param {string} textContent - The text to analyze
   * @returns {Object} Fallback analysis result
   */
  static fallbackTextAnalysis(textContent) {
    let bestCategory = 'other';
    let bestScore = 0;
    let foundKeywords = [];

    for (const [category, data] of Object.entries(CATEGORY_MAPPING)) {
      let score = 0;
      const categoryKeywords = [];
      
      for (const keyword of data.keywords) {
        if (textContent.includes(keyword.toLowerCase())) {
          score += 1;
          categoryKeywords.push(keyword);
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
        foundKeywords = categoryKeywords;
      }
    }

    return {
      category: bestCategory,
      confidence: Math.min(bestScore / 3, 1.0), // Normalize confidence
      reasoning: `Keyword-based analysis found ${foundKeywords.length} relevant keywords`,
      keywords_found: foundKeywords
    };
  }

  /**
   * Analyze images using OpenAI Vision
   * @param {Array} images - Array of image objects
   * @returns {Object} Image analysis result
   */
  static async analyzeImages(images) {
    try {
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }

      const imageAnalysisResults = [];
      
      for (const image of images.slice(0, 3)) { // Limit to first 3 images
        try {
          const imagePath = path.join(__dirname, '../uploads/complaints', image.filename);
          
          // Check if image exists
          await fs.access(imagePath);
          
          // Resize image if too large (OpenAI has size limits)
          const resizedImagePath = await this.resizeImageIfNeeded(imagePath);
          
          // Convert to base64
          const base64Image = await this.imageToBase64(resizedImagePath);
          
          // Analyze with OpenAI Vision
          const analysis = await this.analyzeImageWithOpenAI(base64Image);
          imageAnalysisResults.push(analysis);
          
          // Clean up resized image if it was created
          if (resizedImagePath !== imagePath) {
            await fs.unlink(resizedImagePath);
          }
          
        } catch (imageError) {
          console.error(`Error analyzing image ${image.filename}:`, imageError);
        }
      }
      
      // Combine image analysis results
      return this.combineImageAnalysis(imageAnalysisResults);
      
    } catch (error) {
      console.error('Image analysis error:', error);
      return null;
    }
  }

  /**
   * Resize image if it's too large for OpenAI
   * @param {string} imagePath - Path to the image
   * @returns {string} Path to the (possibly resized) image
   */
  static async resizeImageIfNeeded(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      
      // If image is larger than 1024x1024, resize it
      if (metadata.width > 1024 || metadata.height > 1024) {
        const resizedPath = imagePath.replace(/(\.[^.]+)$/, '_resized$1');
        
        await sharp(imagePath)
          .resize(1024, 1024, { 
            fit: 'inside',
            withoutEnlargement: true 
          })
          .jpeg({ quality: 85 })
          .toFile(resizedPath);
        
        return resizedPath;
      }
      
      return imagePath;
    } catch (error) {
      console.error('Image resize error:', error);
      return imagePath;
    }
  }

  /**
   * Convert image to base64
   * @param {string} imagePath - Path to the image
   * @returns {string} Base64 encoded image
   */
  static async imageToBase64(imagePath) {
    const imageBuffer = await fs.readFile(imagePath);
    return `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
  }

  /**
   * Analyze image with OpenAI Vision
   * @param {string} base64Image - Base64 encoded image
   * @returns {Object} Image analysis result
   */
  static async analyzeImageWithOpenAI(base64Image) {
    try {
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this image and determine what type of urban infrastructure issue it shows. 
                Look for: potholes, road damage, waste/garbage, water leaks, electrical issues, 
                street lighting problems, drainage issues, park/playground problems, safety hazards, etc.
                
                Respond with a JSON object:
                {
                  "category": "most_likely_category",
                  "confidence": 0.0-1.0,
                  "description": "what you see in the image",
                  "objects_detected": ["list", "of", "objects", "seen"]
                }`
              },
              {
                type: "image_url",
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 300
      });

      return JSON.parse(response.choices[0].message.content);
      
    } catch (error) {
      console.error('OpenAI Vision analysis error:', error);
      return {
        category: 'other',
        confidence: 0.3,
        description: 'Image analysis failed',
        objects_detected: []
      };
    }
  }

  /**
   * Combine image analysis results
   * @param {Array} imageResults - Array of image analysis results
   * @returns {Object} Combined image analysis
   */
  static combineImageAnalysis(imageResults) {
    if (!imageResults || imageResults.length === 0) {
      return null;
    }

    // Count category occurrences
    const categoryCounts = {};
    let totalConfidence = 0;
    const allObjects = [];

    for (const result of imageResults) {
      if (result.category) {
        categoryCounts[result.category] = (categoryCounts[result.category] || 0) + 1;
      }
      totalConfidence += result.confidence || 0;
      if (result.objects_detected) {
        allObjects.push(...result.objects_detected);
      }
    }

    // Find most common category
    const mostCommonCategory = Object.keys(categoryCounts).reduce((a, b) => 
      categoryCounts[a] > categoryCounts[b] ? a : b, 'other'
    );

    return {
      category: mostCommonCategory,
      confidence: totalConfidence / imageResults.length,
      totalImages: imageResults.length,
      objects_detected: [...new Set(allObjects)],
      individualResults: imageResults
    };
  }

  /**
   * Combine text and image analysis results
   * @param {Object} textAnalysis - Text analysis result
   * @param {Object} imageAnalysis - Image analysis result
   * @returns {Object} Combined analysis result
   */
  static combineAnalysisResults(textAnalysis, imageAnalysis) {
    if (!imageAnalysis) {
      return textAnalysis;
    }

    // Weight text analysis more heavily (70% text, 30% image)
    const textWeight = 0.7;
    const imageWeight = 0.3;

    let finalCategory = textAnalysis.category;
    let finalConfidence = textAnalysis.confidence * textWeight;
    let reasoning = textAnalysis.reasoning;

    // If image analysis suggests a different category with high confidence
    if (imageAnalysis.confidence > 0.7 && imageAnalysis.category !== textAnalysis.category) {
      // Check if image category is more specific
      const textCategoryScore = this.getCategorySpecificityScore(textAnalysis.category);
      const imageCategoryScore = this.getCategorySpecificityScore(imageAnalysis.category);
      
      if (imageCategoryScore > textCategoryScore) {
        finalCategory = imageAnalysis.category;
        reasoning += ` Image analysis suggests ${imageAnalysis.category} with high confidence.`;
      }
    }

    // Adjust confidence based on image analysis
    finalConfidence += imageAnalysis.confidence * imageWeight;
    finalConfidence = Math.min(finalConfidence, 1.0);

    return {
      category: finalCategory,
      confidence: finalConfidence,
      reasoning: reasoning,
      imageAnalysis: imageAnalysis
    };
  }

  /**
   * Get category specificity score (higher = more specific)
   * @param {string} category - Category name
   * @returns {number} Specificity score
   */
  static getCategorySpecificityScore(category) {
    const specificityScores = {
      'road_issues': 8,
      'waste_management': 7,
      'water_supply': 8,
      'electricity': 7,
      'street_lighting': 6,
      'drainage': 7,
      'parks_recreation': 6,
      'safety_security': 5,
      'noise_pollution': 5,
      'air_pollution': 5,
      'public_transport': 6,
      'other': 1
    };
    
    return specificityScores[category] || 1;
  }

  /**
   * Determine priority based on content analysis
   * @param {string} textContent - The text content
   * @param {Object} categoryAnalysis - Category analysis result
   * @returns {string} Priority level
   */
  static determinePriority(textContent, categoryAnalysis) {
    let priorityScore = 0;
    let matchedIndicators = [];

    // Check for priority indicators
    for (const [priority, data] of Object.entries(PRIORITY_INDICATORS)) {
      for (const keyword of data.keywords) {
        if (textContent.includes(keyword.toLowerCase())) {
          priorityScore += data.weight;
          matchedIndicators.push({ priority, keyword, weight: data.weight });
        }
      }
    }

    // Category-based priority adjustments
    const categoryPriorityAdjustments = {
      'safety_security': 3,
      'electricity': 2,
      'water_supply': 2,
      'road_issues': 1,
      'waste_management': 0,
      'parks_recreation': -1,
      'other': 0
    };

    priorityScore += categoryPriorityAdjustments[categoryAnalysis.category] || 0;

    // Determine final priority
    if (priorityScore >= 8) return 'urgent';
    if (priorityScore >= 5) return 'high';
    if (priorityScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Find the best available field staff for a category
   * @param {string} category - Complaint category
   * @param {Array} availableStaff - Array of available field staff
   * @returns {Object} Best field staff match
   */
  static findBestFieldStaff(category, availableStaff) {
    // Enhanced category to department mapping with specific job roles
    const categoryToDepartmentMap = {
      'waste_management': {
        department: 'sanitation',
        jobRoles: ['sanitation_worker', 'waste_collector', 'cleanup_specialist'],
        description: 'Waste collection, garbage disposal, and sanitation services'
      },
      'water_supply': {
        department: 'water_supply',
        jobRoles: ['water_technician', 'plumber', 'pipe_specialist'],
        description: 'Water leaks, pipe repairs, and water supply issues'
      },
      'electricity': {
        department: 'electricity',
        jobRoles: ['electrician', 'power_technician', 'electrical_specialist'],
        description: 'Power outages, electrical repairs, and electrical safety'
      },
      'street_lighting': {
        department: 'electricity',
        jobRoles: ['electrician', 'lighting_technician', 'street_light_specialist'],
        description: 'Street light repairs, lighting maintenance, and electrical fixtures'
      },
      'road_issues': {
        department: 'public_works',
        jobRoles: ['road_worker', 'asphalt_specialist', 'pavement_technician'],
        description: 'Potholes, road repairs, pavement maintenance, and road construction'
      },
      'drainage': {
        department: 'public_works',
        jobRoles: ['drainage_specialist', 'sewer_technician', 'flood_control_worker'],
        description: 'Drainage issues, sewer problems, and flood control'
      },
      'parks_recreation': {
        department: 'public_works',
        jobRoles: ['park_maintenance', 'recreation_specialist', 'landscaper'],
        description: 'Park maintenance, playground equipment, and recreational facilities'
      },
      'safety_security': {
        department: 'public_works',
        jobRoles: ['safety_inspector', 'security_specialist', 'public_safety_officer'],
        description: 'Safety hazards, security concerns, and public safety issues'
      },
      'noise_pollution': {
        department: 'public_works',
        jobRoles: ['noise_control_specialist', 'environmental_officer'],
        description: 'Noise complaints and sound pollution control'
      },
      'air_pollution': {
        department: 'public_works',
        jobRoles: ['environmental_specialist', 'air_quality_technician'],
        description: 'Air quality issues and environmental pollution'
      },
      'public_transport': {
        department: 'public_works',
        jobRoles: ['transport_coordinator', 'bus_maintenance', 'transit_specialist'],
        description: 'Public transportation, bus stops, and transit services'
      },
      'other': {
        department: 'public_works',
        jobRoles: ['general_worker', 'maintenance_technician'],
        description: 'General maintenance and miscellaneous issues'
      }
    };

    const categoryInfo = categoryToDepartmentMap[category] || categoryToDepartmentMap['other'];
    const targetDepartment = categoryInfo.department;
    const targetJobRoles = categoryInfo.jobRoles;

    // Looking for staff for category

    // Filter staff by department and active status
    const departmentStaff = availableStaff.filter(staff => 
      staff.department === targetDepartment && 
      staff.isActive &&
      !staff.isOnLeave // Add this field to User model if needed
    );

    if (departmentStaff.length === 0) {
      // No active staff found in target department
      // Fallback to any active staff from any department
      const fallbackStaff = availableStaff.find(staff => staff.isActive);
      if (fallbackStaff) {
        // Using fallback staff
      }
      return fallbackStaff || null;
    }

    // Sort by workload and expertise
    departmentStaff.sort((a, b) => {
      // First priority: staff with matching job role (if jobRole field exists)
      const aHasMatchingRole = a.jobRole && targetJobRoles.includes(a.jobRole);
      const bHasMatchingRole = b.jobRole && targetJobRoles.includes(b.jobRole);
      
      if (aHasMatchingRole && !bHasMatchingRole) return -1;
      if (!aHasMatchingRole && bHasMatchingRole) return 1;
      
      // Second priority: workload (fewer assigned complaints = higher priority)
      const aWorkload = a.assignedComplaints ? a.assignedComplaints.length : 0;
      const bWorkload = b.assignedComplaints ? b.assignedComplaints.length : 0;
      
      if (aWorkload !== bWorkload) {
        return aWorkload - bWorkload;
      }
      
      // Third priority: experience (if experience field exists)
      const aExperience = a.experience || 0;
      const bExperience = b.experience || 0;
      
      return bExperience - aExperience;
    });

    const selectedStaff = departmentStaff[0];
    // Selected staff for category
    
    return selectedStaff;
  }
}

module.exports = AIService;
