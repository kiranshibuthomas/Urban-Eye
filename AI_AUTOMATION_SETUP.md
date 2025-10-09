# AI-Powered Complaint Management Automation Setup

This guide explains how to set up the AI-powered complaint management automation system for UrbanEye.

## Overview

The automation system provides:
- **AI-powered categorization**: Automatically categorizes complaints based on text and image analysis
- **Intelligent priority detection**: Determines complaint priority based on content analysis
- **Automatic field staff assignment**: Assigns complaints to appropriate field staff based on category and workload
- **Automated workflow**: Streamlines the entire complaint processing workflow
- **Scheduled processing**: Automatically processes pending complaints every 5 minutes

## Prerequisites

1. **OpenAI API Key**: You need an OpenAI API key to use GPT-3.5-turbo for text analysis and GPT-4-vision for image analysis
2. **Node.js Dependencies**: The system uses `openai` and `sharp` packages for AI processing

## Environment Variables

Add the following environment variable to your `server/config.env` file:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
```

### Getting an OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your environment variables

**Note**: OpenAI API usage is paid. Monitor your usage to avoid unexpected charges.

## Installation

1. **Install Dependencies**:
   ```bash
   cd server
   npm install openai sharp
   ```

2. **Set Environment Variables**:
   Add your OpenAI API key to `server/config.env`

3. **Restart the Server**:
   ```bash
   npm run dev
   ```

## How It Works

### 1. Complaint Submission
When a user submits a complaint:
- The system automatically triggers AI analysis
- Text and images are analyzed using OpenAI's models
- Category and priority are determined automatically

### 2. AI Analysis Process
- **Text Analysis**: Uses GPT-3.5-turbo to analyze title and description
- **Image Analysis**: Uses GPT-4-vision to analyze uploaded images
- **Combined Analysis**: Merges text and image results with weighted scoring

### 3. Automatic Assignment
- Finds available field staff based on complaint category
- Considers staff workload and department matching
- Automatically assigns the most suitable field staff

### 4. Scheduled Processing
- Processes pending complaints every 5 minutes
- Handles batch processing for efficiency
- Includes error handling and logging

## API Endpoints

### Automation Management (Admin Only)

- `POST /api/complaints/process-pending` - Process pending complaints
- `GET /api/complaints/automation-stats` - Get automation statistics
- `POST /api/complaints/:id/reprocess` - Reprocess a specific complaint

### Scheduler Management (Admin Only)

- `GET /api/scheduler/status` - Get scheduler status
- `POST /api/scheduler/start` - Start scheduler service
- `POST /api/scheduler/stop` - Stop scheduler service
- `POST /api/scheduler/trigger/:jobName` - Manually trigger a job

## Category Mapping

The system maps complaint categories to field staff departments:

| Category | Department | Description |
|----------|------------|-------------|
| waste_management | sanitation | Garbage, trash, waste disposal |
| water_supply | water_supply | Water leaks, pipe issues |
| electricity | electricity | Power outages, electrical issues |
| street_lighting | electricity | Street light problems |
| road_issues | public_works | Potholes, road damage |
| drainage | public_works | Drainage, sewer issues |
| parks_recreation | public_works | Park, playground issues |
| safety_security | public_works | Safety concerns |
| noise_pollution | public_works | Noise complaints |
| air_pollution | public_works | Air quality issues |
| public_transport | public_works | Bus, transit issues |

## Priority Detection

The system automatically determines priority based on:

### Urgent (High Priority)
- Keywords: emergency, urgent, immediate, dangerous, hazard, safety risk
- Categories: safety_security, electricity, water_supply

### High Priority
- Keywords: important, serious, major, significant, affecting, disruption
- Categories: road_issues, drainage

### Medium Priority
- Keywords: issue, problem, concern, needs attention
- Default for most categories

### Low Priority
- Keywords: minor, small, cosmetic, improvement, suggestion
- Categories: parks_recreation

## Monitoring and Logging

### Audit Logs
All automation actions are logged in the audit system:
- `automated_processing` - Successful automation
- `automation_error` - Failed automation attempts

### Statistics
Monitor automation performance:
- Total automated complaints
- Success rate
- Error count
- Processing times

## Error Handling

The system includes comprehensive error handling:
- Fallback to keyword-based analysis if AI fails
- Graceful degradation when OpenAI API is unavailable
- Detailed error logging for debugging
- Manual override capabilities for admins

## Cost Considerations

### OpenAI API Costs
- **GPT-3.5-turbo**: ~$0.001-0.002 per complaint (text analysis)
- **GPT-4-vision**: ~$0.01-0.02 per image (image analysis)
- **Estimated monthly cost**: $10-50 for moderate usage

### Optimization Tips
1. Limit image analysis to first 3 images per complaint
2. Resize large images before processing
3. Use fallback keyword analysis for cost reduction
4. Monitor API usage regularly

## Troubleshooting

### Common Issues

1. **OpenAI API Key Not Working**
   - Verify the key is correct and active
   - Check if you have sufficient credits
   - Ensure the key has proper permissions

2. **Image Analysis Failing**
   - Check image file formats (JPEG, PNG supported)
   - Verify image files exist in uploads directory
   - Check file permissions

3. **Automation Not Running**
   - Verify scheduler service is started
   - Check server logs for errors
   - Ensure field staff are available and active

4. **High API Costs**
   - Monitor usage in OpenAI dashboard
   - Consider implementing rate limiting
   - Use fallback analysis for non-critical complaints

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

This will provide more detailed error messages and processing logs.

## Security Considerations

1. **API Key Security**: Never commit API keys to version control
2. **Rate Limiting**: Implement rate limiting to prevent abuse
3. **Input Validation**: All user inputs are validated before AI processing
4. **Error Handling**: Sensitive information is not exposed in error messages

## Future Enhancements

Potential improvements for the automation system:
- Machine learning model training on historical data
- Integration with external APIs for weather/event data
- Advanced workload balancing algorithms
- Real-time notifications for urgent complaints
- Integration with IoT sensors for automatic issue detection

## Support

For issues or questions about the automation system:
1. Check server logs for error details
2. Verify environment configuration
3. Test API endpoints manually
4. Review audit logs for processing history
