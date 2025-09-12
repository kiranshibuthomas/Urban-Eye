# Google Maps API Setup Guide

## Issue
If you're seeing "Oops! Something went wrong. This page didn't load Google Maps correctly" error, it means the Google Maps API key is not properly configured.

## Solution

### Option 1: Set up Google Maps API (Recommended for production)

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Maps JavaScript API
     - Places API (optional, for autocomplete)
     - Geocoding API (optional, for address lookup)

2. **Create API Key:**
   - Go to "Credentials" in the Google Cloud Console
   - Click "Create Credentials" → "API Key"
   - Copy the generated API key

3. **Configure the API Key:**
   - Open `client/.env` file
   - Replace `your_google_maps_api_key_here` with your actual API key:
   ```
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

4. **Restart the development server:**
   ```bash
   npm start
   ```

### Option 2: Use without Google Maps API (Current fallback)

The application now includes a fallback that works without Google Maps API:

- **View Location**: Shows coordinates and address information
- **Open in Google Maps**: Opens the location in Google Maps website
- **Copy Coordinates**: Copies coordinates to clipboard

This fallback is automatically used when the Google Maps API key is not configured.

## Features Available

### With Google Maps API:
- Interactive embedded map
- Custom markers
- Info windows
- Map controls
- Directions integration

### Without Google Maps API (Fallback):
- Location information display
- External Google Maps link
- Coordinate copying
- Address display

## Security Notes

- Never commit your actual API key to version control
- Add `.env` to your `.gitignore` file
- Consider restricting your API key to specific domains in production
- Monitor your API usage in Google Cloud Console

## Troubleshooting

1. **API Key Invalid**: Check if the API key is correct and APIs are enabled
2. **Quota Exceeded**: Check your Google Cloud Console for usage limits
3. **Domain Restrictions**: Ensure your domain is allowed in API key restrictions
4. **Billing**: Ensure billing is enabled for your Google Cloud project

## Cost Considerations

- Google Maps API has usage-based pricing
- Free tier includes $200 credit per month
- Monitor usage in Google Cloud Console
- Consider implementing usage limits for production

