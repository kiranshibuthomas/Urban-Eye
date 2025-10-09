const Complaint = require('../models/Complaint');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const AIService = require('./aiService');
const { 
  sendComplaintAssignedToFieldStaffEmail,
  sendComplaintInProgressEmail 
} = require('./emailService');

class AutomationService {
  /**
   * Process a new complaint automatically
   * @param {Object} complaint - The complaint object
   * @returns {Object} Processing result
   */
  static async processComplaint(complaint) {
    try {
      console.log(`Starting automated processing for complaint: ${complaint._id}`);
      
      // Step 1: AI Analysis
      const analysisResult = await this.performAIAnalysis(complaint);
      
      // Step 2: Update complaint with AI results
      await this.updateComplaintWithAnalysis(complaint, analysisResult);
      
      // Step 3: Auto-assign to field staff
      const assignmentResult = await this.autoAssignToFieldStaff(complaint, analysisResult);
      
      // Step 4: Log the automation
      await this.logAutomation(complaint, analysisResult, assignmentResult);
      
      return {
        success: true,
        analysisResult,
        assignmentResult,
        message: 'Complaint processed automatically'
      };
      
    } catch (error) {
      console.error('Automated processing error:', error);
      
      // Log the error
      await this.logAutomationError(complaint, error);
      
      return {
        success: false,
        error: error.message,
        message: 'Automated processing failed, manual review required'
      };
    }
  }

  /**
   * Perform AI analysis on the complaint
   * @param {Object} complaint - The complaint object
   * @returns {Object} Analysis result
   */
  static async performAIAnalysis(complaint) {
    try {
      const complaintData = {
        title: complaint.title,
        description: complaint.description,
        images: complaint.images
      };

      const analysisResult = await AIService.analyzeComplaint(complaintData);
      
      console.log(`AI Analysis completed for complaint ${complaint._id}:`, {
        category: analysisResult.category,
        priority: analysisResult.priority,
        confidence: analysisResult.confidence
      });

      return analysisResult;
      
    } catch (error) {
      console.error('AI Analysis error:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  /**
   * Update complaint with AI analysis results
   * @param {Object} complaint - The complaint object
   * @param {Object} analysisResult - AI analysis result
   */
  static async updateComplaintWithAnalysis(complaint, analysisResult) {
    try {
      // Update category if AI confidence is high enough
      if (analysisResult.confidence > 0.6 && analysisResult.category !== 'other') {
        complaint.category = analysisResult.category;
      }

      // Update priority if AI confidence is high enough
      if (analysisResult.confidence > 0.5) {
        complaint.priority = analysisResult.priority;
      }

      // Add AI analysis as admin note
      const aiNote = `AI Analysis: Category: ${analysisResult.category} (${Math.round(analysisResult.confidence * 100)}% confidence), Priority: ${analysisResult.priority}. ${analysisResult.reasoning}`;
      
      // Find a system admin user for the note (or create a system user ID)
      const systemAdmin = await User.findOne({ role: 'admin' });
      const addedBy = systemAdmin ? systemAdmin._id : null;
      
      if (addedBy) {
        complaint.adminNotes.push({
          note: aiNote,
          addedBy: addedBy,
          addedAt: new Date()
        });
      }

      complaint.lastUpdated = new Date();
      await complaint.save();
      
      console.log(`Updated complaint ${complaint._id} with AI analysis`);
      
    } catch (error) {
      console.error('Error updating complaint with analysis:', error);
      throw new Error(`Failed to update complaint: ${error.message}`);
    }
  }

  /**
   * Automatically assign complaint to field staff
   * @param {Object} complaint - The complaint object
   * @param {Object} analysisResult - AI analysis result
   * @returns {Object} Assignment result
   */
  static async autoAssignToFieldStaff(complaint, analysisResult) {
    try {
      // Get available field staff
      const availableStaff = await this.getAvailableFieldStaff(complaint.category);
      
      if (availableStaff.length === 0) {
        console.log(`No available field staff for category: ${complaint.category}`);
        return {
          success: false,
          message: 'No available field staff for this category',
          assignedTo: null
        };
      }

      // Find best field staff using AI service
      const bestStaff = AIService.findBestFieldStaff(complaint.category, availableStaff);
      
      if (!bestStaff) {
        console.log(`No suitable field staff found for category: ${complaint.category}`);
        return {
          success: false,
          message: 'No suitable field staff found',
          assignedTo: null
        };
      }

      // Assign to field staff
      await complaint.assignToFieldStaff(bestStaff._id, null); // null = system assignment
      
      // Populate field staff info for email
      await complaint.populate('assignedToFieldStaff', 'name email department');
      
      // Send notification email
      try {
        await complaint.populate('citizen', 'name email preferences');
        await sendComplaintAssignedToFieldStaffEmail(
          complaint, 
          complaint.citizen, 
          bestStaff.name, 
          bestStaff.department
        );
        console.log(`Assignment email sent to citizen: ${complaint.citizen.email}`);
      } catch (emailError) {
        console.error('Failed to send assignment email:', emailError);
        // Don't fail the assignment if email fails
      }

      console.log(`Auto-assigned complaint ${complaint._id} to field staff: ${bestStaff.name}`);
      
      return {
        success: true,
        message: `Assigned to ${bestStaff.name} (${bestStaff.department})`,
        assignedTo: bestStaff._id,
        fieldStaffName: bestStaff.name,
        department: bestStaff.department
      };
      
    } catch (error) {
      console.error('Auto-assignment error:', error);
      throw new Error(`Auto-assignment failed: ${error.message}`);
    }
  }

  /**
   * Get available field staff for a category
   * @param {string} category - Complaint category
   * @returns {Array} Available field staff
   */
  static async getAvailableFieldStaff(category) {
    try {
      const categoryToDepartmentMap = {
        'waste_management': 'sanitation',
        'water_supply': 'water_supply',
        'electricity': 'electricity',
        'street_lighting': 'electricity',
        'road_issues': 'public_works',
        'drainage': 'public_works',
        'parks_recreation': 'public_works',
        'safety_security': 'public_works',
        'noise_pollution': 'public_works',
        'air_pollution': 'public_works',
        'public_transport': 'public_works',
        'other': 'public_works'
      };

      const targetDepartment = categoryToDepartmentMap[category] || 'public_works';

      // Get field staff with their current workload
      const fieldStaff = await User.find({
        role: 'field_staff',
        department: targetDepartment,
        isActive: true,
        isOnLeave: { $ne: true } // Exclude staff on leave
      }).populate({
        path: 'assignedComplaints',
        match: { 
          status: { $in: ['assigned', 'in_progress'] },
          isDeleted: { $ne: true }
        }
      });

      // Filter out staff who have reached their maximum workload
      const availableStaff = fieldStaff.filter(staff => {
        const currentWorkload = staff.assignedComplaints ? staff.assignedComplaints.length : 0;
        const maxWorkload = staff.maxWorkload || 10; // Default max workload
        
        console.log(`Staff ${staff.name}: ${currentWorkload}/${maxWorkload} workload`);
        return currentWorkload < maxWorkload;
      });

      console.log(`Found ${availableStaff.length} available staff in ${targetDepartment} department`);
      return availableStaff;
      
    } catch (error) {
      console.error('Error getting available field staff:', error);
      return [];
    }
  }

  /**
   * Log automation actions
   * @param {Object} complaint - The complaint object
   * @param {Object} analysisResult - AI analysis result
   * @param {Object} assignmentResult - Assignment result
   */
  static async logAutomation(complaint, analysisResult, assignmentResult) {
    try {
      // Find a system admin user for logging
      const systemAdmin = await User.findOne({ role: 'admin' });
      
      await AuditLog.logAction({
        action: 'automated_processing',
        entityType: 'complaint',
        entityId: complaint._id,
        performedBy: systemAdmin ? systemAdmin._id : null,
        performedByEmail: systemAdmin ? systemAdmin.email : 'system@urbaneye.com',
        details: {
          complaintTitle: complaint.title,
          complaintCategory: complaint.category,
          complaintPriority: complaint.priority,
          aiCategory: analysisResult.category,
          aiPriority: analysisResult.priority,
          aiConfidence: analysisResult.confidence,
          aiReasoning: analysisResult.reasoning,
          assignedTo: assignmentResult.assignedTo,
          fieldStaffName: assignmentResult.fieldStaffName,
          department: assignmentResult.department,
          assignmentSuccess: assignmentResult.success
        },
        ipAddress: '127.0.0.1',
        userAgent: 'UrbanEye-Automation-System'
      });
      
      console.log(`Logged automation for complaint: ${complaint._id}`);
      
    } catch (error) {
      console.error('Error logging automation:', error);
      // Don't throw error for logging failures
    }
  }

  /**
   * Log automation errors
   * @param {Object} complaint - The complaint object
   * @param {Error} error - The error that occurred
   */
  static async logAutomationError(complaint, error) {
    try {
      // Find a system admin user for logging
      const systemAdmin = await User.findOne({ role: 'admin' });
      
      await AuditLog.logAction({
        action: 'automation_error',
        entityType: 'complaint',
        entityId: complaint._id,
        performedBy: systemAdmin ? systemAdmin._id : null,
        performedByEmail: systemAdmin ? systemAdmin.email : 'system@urbaneye.com',
        reason: error.message,
        details: {
          complaintTitle: complaint.title,
          errorType: error.name,
          errorMessage: error.message,
          stack: error.stack
        },
        ipAddress: '127.0.0.1',
        userAgent: 'UrbanEye-Automation-System'
      });
      
    } catch (logError) {
      console.error('Error logging automation error:', logError);
    }
  }

  /**
   * Process pending complaints that need automation
   * @returns {Object} Processing summary
   */
  static async processPendingComplaints() {
    try {
      console.log('Starting batch processing of pending complaints...');
      
      // Find complaints that are pending and haven't been processed by AI
      const pendingComplaints = await Complaint.find({
        status: 'pending',
        isDeleted: { $ne: true },
        'adminNotes.note': { $not: { $regex: /AI Analysis:/ } }
      }).limit(10); // Process max 10 at a time

      console.log(`Found ${pendingComplaints.length} complaints to process`);

      const results = {
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const complaint of pendingComplaints) {
        try {
          const result = await this.processComplaint(complaint);
          results.processed++;
          
          if (result.success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push({
              complaintId: complaint._id,
              error: result.error
            });
          }
          
          // Small delay between processing to avoid overwhelming the system
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          results.processed++;
          results.failed++;
          results.errors.push({
            complaintId: complaint._id,
            error: error.message
          });
          console.error(`Error processing complaint ${complaint._id}:`, error);
        }
      }

      console.log('Batch processing completed:', results);
      return results;
      
    } catch (error) {
      console.error('Batch processing error:', error);
      throw error;
    }
  }

  /**
   * Get automation statistics
   * @returns {Object} Automation statistics
   */
  static async getAutomationStats() {
    try {
      const stats = await AuditLog.aggregate([
        {
          $match: {
            action: { $in: ['automated_processing', 'automation_error'] },
            entityType: 'complaint'
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 }
          }
        }
      ]);

      const result = {
        totalAutomated: 0,
        totalErrors: 0,
        successRate: 0
      };

      for (const stat of stats) {
        if (stat._id === 'automated_processing') {
          result.totalAutomated = stat.count;
        } else if (stat._id === 'automation_error') {
          result.totalErrors = stat.count;
        }
      }

      const total = result.totalAutomated + result.totalErrors;
      result.successRate = total > 0 ? (result.totalAutomated / total) * 100 : 0;

      return result;
      
    } catch (error) {
      console.error('Error getting automation stats:', error);
      return {
        totalAutomated: 0,
        totalErrors: 0,
        successRate: 0
      };
    }
  }
}

module.exports = AutomationService;
