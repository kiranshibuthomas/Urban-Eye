# Team Collaboration Feature Guide

## Overview
The Team Collaboration feature allows field staff to form teams for complex tasks, work together, and enables admins to track their live locations and progress in real-time.

## Features

### For Field Staff

#### 1. Team Formation
- **Create Team**: When assigned a task, field staff can create a team
- **Set Team Size**: Choose maximum team members (2-5)
- **Custom Team Name**: Give your team a meaningful name

#### 2. Member Invitation
- **Search Available Staff**: Find nearby field staff by name, department, or skills
- **Distance-Based Sorting**: See how far each staff member is from the task location
- **Role Assignment**: Assign roles (leader, member, specialist, trainee)
- **Skill Matching**: View staff skills to find the right expertise

#### 3. Team Communication
- **In-Team Chat**: Real-time messaging between team members
- **Read Receipts**: See who has read your messages
- **Activity Log**: Track all team actions and events

#### 4. Location Sharing
- **Real-Time GPS**: Automatically share location with team and admin
- **Battery Status**: Monitor device battery levels
- **Movement Detection**: Show if members are moving or stationary
- **Location Accuracy**: Display GPS accuracy for reliability

#### 5. Collaborative Work
- **Shared Work Session**: All team members contribute to the same task
- **Progress Updates**: Any member can add progress notes
- **Team Statistics**: View combined work time and achievements

### For Admins

#### 1. Live Team Tracking Dashboard
- **Active Teams Overview**: See all teams currently working
- **Real-Time Map**: View live locations of all team members
- **Geofence Visualization**: See task location boundaries
- **Auto-Refresh**: Updates every 10 seconds automatically

#### 2. Team Statistics
- **Work Duration**: Total time team has been working
- **Team Size**: Number of active members
- **Messages Exchanged**: Communication activity
- **Progress Updates**: Number of status updates

#### 3. Team Management
- **Team Details**: View complete team information
- **Member Status**: See each member's current status
- **Battery Monitoring**: Check device battery levels
- **Activity Status**: See who's moving vs stationary

## API Endpoints

### Team Management
```
POST   /api/teams/create                    - Create new team
GET    /api/teams/:teamId                   - Get team details
GET    /api/teams/my/teams                  - Get my teams
GET    /api/teams/:teamId/available-staff   - Get available field staff
```

### Team Operations
```
POST   /api/teams/:teamId/invite            - Invite member to team
POST   /api/teams/:teamId/respond           - Respond to invitation
POST   /api/teams/:teamId/remove-member     - Remove team member
POST   /api/teams/:teamId/start-work        - Start team work
```

### Communication & Tracking
```
POST   /api/teams/:teamId/message           - Send team message
POST   /api/teams/:teamId/update-location   - Update member location
GET    /api/teams/:teamId/statistics        - Get team statistics
```

### Admin Endpoints
```
GET    /api/teams/admin/active-teams        - Get all active teams (admin only)
```

## Database Models

### WorkTeam Model
```javascript
{
  teamName: String,
  complaint: ObjectId (ref: Complaint),
  teamLeader: ObjectId (ref: User),
  members: [{
    fieldStaff: ObjectId,
    role: String (leader/member/specialist/trainee),
    status: String (invited/accepted/declined/active/left),
    joinedAt: Date
  }],
  status: String (forming/ready/active/paused/completed/disbanded),
  lastKnownLocations: [{
    fieldStaff: ObjectId,
    location: Point,
    accuracy: Number,
    timestamp: Date,
    battery: Number,
    isMoving: Boolean
  }],
  messages: [{
    sender: ObjectId,
    message: String,
    timestamp: Date,
    readBy: [{ user: ObjectId, readAt: Date }]
  }],
  stats: {
    totalWorkTime: Number,
    progressUpdates: Number,
    messagesExchanged: Number
  }
}
```

## Usage Flow

### Creating a Team

1. **Field Staff Receives Task Assignment**
   - Task appears in their dashboard
   - Option to "Create Team" is available

2. **Team Formation**
   ```javascript
   // Step 1: Create team
   POST /api/teams/create
   {
     complaintId: "task_id",
     teamName: "Road Repair Team Alpha",
     maxMembers: 3
   }
   ```

3. **Invite Members**
   ```javascript
   // Step 2: Invite field staff
   POST /api/teams/:teamId/invite
   {
     fieldStaffId: "staff_id",
     role: "member"
   }
   ```

4. **Members Respond**
   ```javascript
   // Step 3: Accept/decline invitation
   POST /api/teams/:teamId/respond
   {
     accept: true
   }
   ```

5. **Start Team Work**
   ```javascript
   // Step 4: Begin work session
   POST /api/teams/:teamId/start-work
   {
     location: {
       latitude: 10.8505,
       longitude: 76.2711,
       accuracy: 10
     }
   }
   ```

### Location Tracking

Team members automatically send location updates:

```javascript
// Sent every 30 seconds while working
POST /api/teams/:teamId/update-location
{
  location: {
    latitude: 10.8505,
    longitude: 76.2711
  },
  accuracy: 10,
  battery: 85,
  isMoving: true
}
```

### Admin Monitoring

Admins can view all active teams:

```javascript
// Get all active teams with locations
GET /api/teams/admin/active-teams

Response:
{
  success: true,
  teams: [{
    _id: "team_id",
    teamName: "Road Repair Team Alpha",
    status: "active",
    members: [...],
    lastKnownLocations: [{
      fieldStaff: {...},
      location: { coordinates: [76.2711, 10.8505] },
      timestamp: "2024-01-15T10:30:00Z",
      battery: 85,
      isMoving: true
    }],
    complaint: {...}
  }]
}
```

## UI Components

### 1. TeamFormationModal
**Location**: `client/src/components/TeamFormationModal.js`
- Two-step wizard for team creation
- Search and select field staff
- Distance-based sorting
- Skill display

### 2. TeamInvitationsPanel
**Location**: `client/src/components/TeamInvitationsPanel.js`
- Shows pending team invitations
- Accept/decline functionality
- Task details preview
- Auto-refresh every 30 seconds

### 3. AdminLiveTeamTracking
**Location**: `client/src/pages/AdminLiveTeamTracking.js`
- Live map with team member locations
- Team statistics dashboard
- Auto-refresh toggle
- Battery and movement status

## Integration Points

### In Field Staff Dashboard
```javascript
import TeamFormationModal from '../components/TeamFormationModal';
import TeamInvitationsPanel from '../components/TeamInvitationsPanel';

// Show team formation button for assigned tasks
<button onClick={() => setShowTeamModal(true)}>
  <FiUsers /> Create Team
</button>

// Show pending invitations
<TeamInvitationsPanel onInvitationResponse={handleRefresh} />
```

### In Admin Dashboard
```javascript
import AdminLiveTeamTracking from '../pages/AdminLiveTeamTracking';

// Add to admin navigation
<Route path="/admin/live-teams" element={<AdminLiveTeamTracking />} />
```

## Location Tracking Implementation

### Client-Side (Field Staff)
```javascript
// Start location tracking when team work begins
useEffect(() => {
  if (activeTeam && activeTeam.status === 'active') {
    const locationInterval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateTeamLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            battery: navigator.getBattery?.()?.level * 100,
            isMoving: calculateMovement(position)
          });
        },
        (error) => console.error('Location error:', error),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }, 30000); // Every 30 seconds

    return () => clearInterval(locationInterval);
  }
}, [activeTeam]);
```

### Server-Side Validation
```javascript
// Validate location is within geofence
const locationValidation = validateLocation(
  memberLocation,
  taskLocation,
  allowedRadius = 150 // meters
);

if (!locationValidation.isValid) {
  throw new Error('Member too far from task location');
}
```

## Security Considerations

1. **Authorization**
   - Only team leader can invite members
   - Only team members can access team data
   - Admin-only endpoints protected

2. **Location Privacy**
   - Locations only shared during active work
   - Automatic cleanup after work completion
   - Geofence validation for security

3. **Data Validation**
   - Location accuracy checks
   - Battery level validation
   - Timestamp verification

## Performance Optimization

1. **Location Updates**
   - Batched updates every 30 seconds
   - Only send when location changes significantly
   - Compress location data

2. **Map Rendering**
   - Lazy load map components
   - Cluster markers for many teams
   - Optimize tile loading

3. **Real-Time Updates**
   - WebSocket for instant updates (future enhancement)
   - Polling fallback with smart intervals
   - Conditional rendering based on visibility

## Future Enhancements

1. **Voice Communication**
   - Push-to-talk functionality
   - Voice messages in team chat

2. **Route Optimization**
   - Suggest optimal meeting points
   - Calculate travel time between members

3. **Task Distribution**
   - Split tasks among team members
   - Individual progress tracking

4. **Performance Analytics**
   - Team efficiency metrics
   - Collaboration patterns
   - Best team compositions

5. **Offline Support**
   - Queue location updates when offline
   - Sync when connection restored
   - Offline messaging

## Troubleshooting

### Location Not Updating
- Check GPS permissions
- Verify network connectivity
- Ensure battery saver mode is off
- Check location accuracy settings

### Team Invitations Not Received
- Verify field staff is available
- Check notification settings
- Ensure user is not already in another team
- Refresh the dashboard

### Map Not Loading
- Check internet connection
- Verify map tile service is accessible
- Clear browser cache
- Check console for errors

## Support

For issues or questions:
1. Check server logs: `server/logs/`
2. Review browser console for client errors
3. Verify database connections
4. Check API endpoint responses

## License

This feature is part of the UrbanEye Complaint Management System.
