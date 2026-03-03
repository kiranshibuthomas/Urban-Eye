# Team Collaboration Feature - Quick Setup Guide

## 🚀 Quick Start

### 1. Run Setup Script

```bash
cd server
node scripts/setupTeamCollaboration.js
```

This script will:
- ✅ Create necessary database indexes
- ✅ Configure field staff users
- ✅ Verify system readiness
- ✅ Display current statistics

### 2. Restart Server

```bash
# From project root
npm run dev

# Or if running separately
cd server && npm start
cd client && npm start
```

### 3. Test the Feature

#### As Field Staff:
1. Login as field staff user
2. Navigate to dashboard
3. Look for assigned tasks
4. Click "Create Team" button
5. Follow the wizard to form a team

#### As Admin:
1. Login as admin user
2. Navigate to `/admin/live-teams`
3. View active teams on the map
4. Monitor real-time locations and statistics

## 📋 Prerequisites

### Backend Dependencies
All required dependencies are already in package.json:
- ✅ mongoose (database)
- ✅ express (API)
- ✅ uuid (session IDs)

### Frontend Dependencies
All required dependencies are already in package.json:
- ✅ react-leaflet (maps)
- ✅ leaflet (map library)
- ✅ framer-motion (animations)
- ✅ react-icons (icons)
- ✅ react-hot-toast (notifications)

### Browser Requirements
- ✅ Modern browser with Geolocation API support
- ✅ HTTPS connection (required for geolocation)
- ✅ GPS/location permissions enabled

## 🔧 Configuration

### Environment Variables

No additional environment variables needed! The feature uses existing configuration.

### Geofence Settings

Default geofence radius: **150 meters**

To change, modify in `server/services/teamCollaborationService.js`:

```javascript
static validateLocation(currentLocation, complaintLocation, allowedRadius = 150) {
  // Change 150 to your desired radius in meters
}
```

### Location Update Frequency

Default: **30 seconds**

To change, modify in field staff dashboard:

```javascript
// In client/src/pages/ProfessionalFieldStaffDashboard.js
const interval = setInterval(() => {
  updateTeamLocation(...);
}, 30000); // Change 30000 to desired milliseconds
```

### Admin Dashboard Refresh Rate

Default: **10 seconds**

To change, modify in admin tracking page:

```javascript
// In client/src/pages/AdminLiveTeamTracking.js
const interval = setInterval(() => {
  fetchActiveTeams();
}, 10000); // Change 10000 to desired milliseconds
```

## 🧪 Testing Checklist

### Field Staff Tests
- [ ] Can see "Create Team" button on assigned tasks
- [ ] Can create a team with custom name
- [ ] Can search for available field staff
- [ ] Can see distance from task location
- [ ] Can invite team members
- [ ] Can see pending invitations
- [ ] Can accept/decline invitations
- [ ] Can start team work
- [ ] Location updates automatically

### Admin Tests
- [ ] Can access `/admin/live-teams` route
- [ ] Can see list of active teams
- [ ] Can view team on map
- [ ] Can see member locations
- [ ] Can see geofence circle
- [ ] Can view team statistics
- [ ] Auto-refresh works
- [ ] Manual refresh works
- [ ] Can see battery levels
- [ ] Can see movement status

## 🎯 Sample Test Data

### Create Test Field Staff Users

```javascript
// Run in MongoDB shell or create via admin panel
db.users.insertMany([
  {
    name: "John Doe",
    email: "john@example.com",
    role: "field_staff",
    department: "Roads",
    skills: ["road_repair", "drainage"],
    isAvailable: true,
    currentLocation: {
      type: "Point",
      coordinates: [76.2711, 10.8505]
    }
  },
  {
    name: "Jane Smith",
    email: "jane@example.com",
    role: "field_staff",
    department: "Sanitation",
    skills: ["waste_management", "cleaning"],
    isAvailable: true,
    currentLocation: {
      type: "Point",
      coordinates: [76.2720, 10.8510]
    }
  }
]);
```

### Create Test Task

```javascript
// Assign a complaint to field staff
db.complaints.updateOne(
  { _id: ObjectId("your_complaint_id") },
  { 
    $set: { 
      assignedToFieldStaff: ObjectId("field_staff_id"),
      status: "assigned"
    }
  }
);
```

## 🔍 Verification

### Check Database Collections

```javascript
// Check if WorkTeam collection exists
db.workteams.find().pretty()

// Check field staff users
db.users.find({ role: "field_staff" }).pretty()

// Check indexes
db.workteams.getIndexes()
```

### Check API Endpoints

```bash
# Test team creation (requires authentication)
curl -X POST http://localhost:5000/api/teams/create \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{"complaintId":"task_id","teamName":"Test Team","maxMembers":3}'

# Test admin endpoint
curl http://localhost:5000/api/teams/admin/active-teams \
  -H "Cookie: admin-session-cookie"
```

## 🐛 Common Issues

### Issue: "Create Team" button not showing
**Solution:** 
- Verify user is logged in as field staff
- Check if task is assigned to the user
- Ensure task status is "assigned"

### Issue: No available field staff found
**Solution:**
- Run setup script to configure field staff users
- Verify field staff have `isAvailable: true`
- Check if other field staff are logged in

### Issue: Location not updating
**Solution:**
- Check browser location permissions
- Ensure HTTPS connection
- Verify GPS is enabled on device
- Check browser console for errors

### Issue: Map not loading
**Solution:**
- Check internet connection
- Verify Leaflet CSS is imported
- Clear browser cache
- Check console for tile loading errors

### Issue: "Team already exists" error
**Solution:**
- Check if team already created for this task
- Complete or disband existing team first
- Or assign task to different field staff

## 📊 Monitoring

### Database Queries

```javascript
// Count active teams
db.workteams.countDocuments({ status: { $in: ["ready", "active"] } })

// Find teams with location data
db.workteams.find({ "lastKnownLocations.0": { $exists: true } })

// Get team statistics
db.workteams.aggregate([
  { $match: { status: "active" } },
  { $group: {
    _id: null,
    totalTeams: { $sum: 1 },
    avgMembers: { $avg: { $size: "$members" } },
    totalMessages: { $sum: "$stats.messagesExchanged" }
  }}
])
```

### Server Logs

Monitor these logs for team operations:
```
Create team error:
Fetch teams error:
Invite member error:
Update location error:
```

## 🎨 Customization

### Change Team Colors

In `client/src/pages/AdminLiveTeamTracking.js`:

```javascript
const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
// Add more colors or change existing ones
```

### Modify Team Size Limits

In `client/src/components/TeamFormationModal.js`:

```javascript
<select value={maxMembers} onChange={(e) => setMaxMembers(Number(e.target.value))}>
  <option value={2}>2 members</option>
  <option value={3}>3 members</option>
  <option value={4}>4 members</option>
  <option value={5}>5 members</option>
  <option value={10}>10 members</option> // Add more options
</select>
```

### Add Custom Team Roles

In `server/models/WorkTeam.js`:

```javascript
role: {
  type: String,
  enum: ['leader', 'member', 'specialist', 'trainee', 'supervisor'], // Add new roles
  default: 'member'
}
```

## 📚 Additional Resources

- [Complete Feature Guide](./TEAM_COLLABORATION_GUIDE.md)
- [Implementation Details](./TEAM_COLLABORATION_IMPLEMENTATION.md)
- [API Documentation](./TEAM_COLLABORATION_GUIDE.md#api-endpoints)

## 🆘 Support

If you encounter issues:

1. Check server logs: `server/logs/`
2. Check browser console for errors
3. Verify database connection
4. Run setup script again
5. Check API responses in Network tab

## ✅ Success Indicators

You'll know the feature is working when:

- ✅ Field staff can see "Create Team" button
- ✅ Team formation modal opens and works
- ✅ Team invitations appear in dashboard
- ✅ Admin can access live tracking page
- ✅ Map shows team member locations
- ✅ Statistics update in real-time
- ✅ No errors in console or server logs

## 🎉 You're All Set!

The team collaboration feature is now ready to use. Field staff can form teams and work together, while admins can monitor their progress in real-time!

Happy collaborating! 🚀
