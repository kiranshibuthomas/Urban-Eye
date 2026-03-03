const axios = require('axios');

class SMSService {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.smsProvider = process.env.SMS_PROVIDER || 'console'; // 'twilio', 'textlocal', 'msg91', 'console'
    
    // Initialize based on provider
    this.initializeProvider();
  }

  initializeProvider() {
    switch (this.smsProvider) {
      case 'twilio':
        this.twilioClient = require('twilio')(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        break;
      case 'textlocal':
        this.textlocalApiKey = process.env.TEXTLOCAL_API_KEY;
        this.textlocalSender = process.env.TEXTLOCAL_SENDER || 'URBANEYE';
        break;
      case 'msg91':
        this.msg91ApiKey = process.env.MSG91_API_KEY;
        this.msg91TemplateId = process.env.MSG91_TEMPLATE_ID;
        break;
      default:
    console.log('SMS Service: Using console mode (development)');
    }
  }

  async sendOTP(phoneNumber, otp, purpose = 'verification') {
    const message = this.formatOTPMessage(otp, purpose);
    
    try {
      switch (this.smsProvider) {
        case 'twilio':
          return await this.sendViaTwilio(phoneNumber, message);
        case 'textlocal':
          return await this.sendViaTextLocal(phoneNumber, message);
        case 'msg91':
          return await this.sendViaMsg91(phoneNumber, otp);
        default:
          return this.sendViaConsole(phoneNumber, otp, message);
      }
    } catch (error) {
      console.error('SMS Service Error:', error);
      
      // Fallback to console in development
      if (this.isDevelopment) {
        return this.sendViaConsole(phoneNumber, otp, message);
      }
      
      throw error;
    }
  }

  formatOTPMessage(otp, purpose) {
    const messages = {
      'complaint_verification': `Your UrbanEye complaint verification OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`,
      'verification': `Your UrbanEye verification OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`,
      'password_reset': `Your UrbanEye password reset OTP is: ${otp}. Valid for 10 minutes. Do not share this code.`
    };
    
    return messages[purpose] || messages['verification'];
  }

  async sendViaTwilio(phoneNumber, message) {
    if (!this.twilioClient) {
      throw new Error('Twilio client not initialized');
    }

    const result = await this.twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${phoneNumber}`
    });

    return {
      success: true,
      provider: 'twilio',
      messageId: result.sid
    };
  }

  async sendViaTextLocal(phoneNumber, message) {
    if (!this.textlocalApiKey) {
      throw new Error('TextLocal API key not configured');
    }

    const params = new URLSearchParams({
      apikey: this.textlocalApiKey,
      numbers: phoneNumber,
      message: message,
      sender: this.textlocalSender
    });

    const response = await axios.post('https://api.textlocal.in/send/', params);
    
    if (response.data.status === 'success') {
      return {
        success: true,
        provider: 'textlocal',
        messageId: response.data.batch_id
      };
    } else {
      throw new Error(`TextLocal error: ${response.data.errors[0].message}`);
    }
  }

  async sendViaMsg91(phoneNumber, otp) {
    if (!this.msg91ApiKey) {
      throw new Error('MSG91 API key not configured');
    }

    const params = {
      authkey: this.msg91ApiKey,
      template_id: this.msg91TemplateId,
      mobile: phoneNumber,
      otp: otp
    };

    const response = await axios.post('https://api.msg91.com/api/v5/otp', params);
    
    if (response.data.type === 'success') {
      return {
        success: true,
        provider: 'msg91',
        messageId: response.data.request_id
      };
    } else {
      throw new Error(`MSG91 error: ${response.data.message}`);
    }
  }

  sendViaConsole(phoneNumber, otp, message) {
    console.log('\n=== SMS SERVICE (DEVELOPMENT MODE) ===');
    console.log(`Phone: +91${phoneNumber}`);
    console.log(`OTP: ${otp}`);
    console.log(`Message: ${message}`);
    console.log('=====================================\n');
    
    return {
      success: true,
      provider: 'console',
      messageId: 'dev_' + Date.now(),
      developmentMode: true,
      otp: this.isDevelopment ? otp : undefined // Only include OTP in development
    };
  }

  // Method to validate phone number format
  validatePhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid Indian mobile number
    const indianMobileRegex = /^[6-9]\d{9}$/;
    
    if (!indianMobileRegex.test(cleaned)) {
      return {
        isValid: false,
        message: 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9'
      };
    }
    
    return {
      isValid: true,
      cleaned: cleaned
    };
  }

  // Get provider status
  getProviderStatus() {
    return {
      provider: this.smsProvider,
      isDevelopment: this.isDevelopment,
      isConfigured: this.isProviderConfigured()
    };
  }

  isProviderConfigured() {
    switch (this.smsProvider) {
      case 'twilio':
        return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
      case 'textlocal':
        return !!process.env.TEXTLOCAL_API_KEY;
      case 'msg91':
        return !!(process.env.MSG91_API_KEY && process.env.MSG91_TEMPLATE_ID);
      default:
        return true; // Console mode is always available
    }
  }
}

module.exports = new SMSService();