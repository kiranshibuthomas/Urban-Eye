# UrbanEye - Figma Design Specification

## Project Overview
**UrbanEye** - Smart City Complaint Management System
A comprehensive civic engagement platform for citizens to report issues and administrators to manage urban infrastructure.

---

## 🎨 Design System

### Color Palette
**Primary Colors:**
- Primary Green: `#10B981` (Emerald-500)
- Primary Teal: `#14B8A6` (Teal-500)
- Primary Blue: `#3B82F6` (Blue-500)

**Secondary Colors:**
- Success: `#22C55E` (Green-500)
- Warning: `#F59E0B` (Amber-500)
- Error: `#EF4444` (Red-500)
- Info: `#06B6D4` (Cyan-500)

**Neutral Colors:**
- White: `#FFFFFF`
- Gray-50: `#F9FAFB`
- Gray-100: `#F3F4F6`
- Gray-200: `#E5E7EB`
- Gray-300: `#D1D5DB`
- Gray-600: `#4B5563`
- Gray-700: `#374151`
- Gray-800: `#1F2937`
- Gray-900: `#111827`

### Typography
**Font Family:** Inter (Google Fonts)
- **Headings:** Inter Bold
- **Body:** Inter Regular
- **Buttons:** Inter Medium

**Font Sizes:**
- H1: 32px/40px (2rem/2.5rem)
- H2: 24px/32px (1.5rem/2rem)
- H3: 20px/28px (1.25rem/1.75rem)
- H4: 18px/24px (1.125rem/1.5rem)
- Body: 16px/24px (1rem/1.5rem)
- Small: 14px/20px (0.875rem/1.25rem)
- XSmall: 12px/16px (0.75rem/1rem)

### Spacing System
- 4px (0.25rem)
- 8px (0.5rem)
- 12px (0.75rem)
- 16px (1rem)
- 20px (1.25rem)
- 24px (1.5rem)
- 32px (2rem)
- 40px (2.5rem)
- 48px (3rem)
- 64px (4rem)

### Border Radius
- Small: 8px (0.5rem)
- Medium: 12px (0.75rem)
- Large: 16px (1rem)
- XL: 24px (1.5rem)
- 2XL: 32px (2rem)

### Shadows
- Small: `0 1px 2px 0 rgba(0, 0, 0, 0.05)`
- Medium: `0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- Large: `0 10px 15px -3px rgba(0, 0, 0, 0.1)`
- XL: `0 20px 25px -5px rgba(0, 0, 0, 0.1)`

---

## 📱 Screen Designs

### 1. LOGIN PAGE
**Frame Size:** 1440x900px (Desktop)

**Layout:**
- Split screen design
- Left: Login form (50%)
- Right: Welcome section with city theme (50%)

**Left Side - Login Form:**
- Background: White with subtle gradient
- Logo: UrbanEye with city icon (top center)
- Form elements:
  - Google OAuth button (full width)
  - Divider with "or use your email password"
  - Email input field
  - Password input field with show/hide toggle
  - "Forgot Password?" link
  - Sign In button (gradient background)
- Footer: "Don't have an account? Join Now"

**Right Side - Welcome Section:**
- Background: Gradient from emerald-500 to blue-600
- City skyline silhouette at bottom
- Floating smart city icons (animated)
- Welcome text: "Hello, Citizen!"
- Subtitle: "Join our smart city initiative..."
- CTA button: "JOIN NOW"

**Responsive Breakpoints:**
- Mobile: 375x667px (stacked layout)
- Tablet: 768x1024px (adjusted proportions)

---

### 2. REGISTRATION PAGE
**Frame Size:** 1440x900px (Desktop)

**Layout:**
- Similar to login page but with registration form
- Form fields:
  - Full Name
  - Email
  - Phone Number (with country code)
  - Password
  - Confirm Password
  - Role Selection (Citizen/Admin)
  - Terms & Conditions checkbox
  - Register button

**Right Side:**
- Same welcome section as login
- Updated copy: "Start your civic journey today"

---

### 3. CITIZEN DASHBOARD - OVERVIEW
**Frame Size:** 1440x900px (Desktop)

**Header:**
- Logo and app name (left)
- Notification bell with indicator
- User profile dropdown
- Collapsible sidebar toggle

**Sidebar:**
- Navigation items:
  - Overview (active)
  - Submit Complaint
  - My Complaints
  - Analytics
- Quick tip section at bottom

**Main Content:**
- Welcome banner with gradient background
- Stats grid (4 cards):
  - Total Issues
  - Pending Review
  - In Progress
  - Resolved
- Recent Issues section with status cards

**Cards Design:**
- White background with subtle shadow
- Rounded corners (24px)
- Status indicators with colors
- Hover effects

---

### 4. CITIZEN DASHBOARD - SUBMIT COMPLAINT
**Frame Size:** 1440x900px (Desktop)

**Form Layout:**
- Header with icon and title
- Form fields:
  - Issue Title
  - Category (dropdown)
  - Location
  - Description (textarea)
  - Priority Level
  - Photo Upload
- Action buttons: Submit & Cancel

**Form Styling:**
- Clean, spacious layout
- Clear labels and placeholders
- Validation states
- File upload area with drag & drop

---

### 5. CITIZEN DASHBOARD - MY COMPLAINTS
**Frame Size:** 1440x900px (Desktop)

**Layout:**
- Header with title and filter options
- Complaint cards list:
  - Status badges
  - Priority indicators
  - Location and date
  - Progress indicators
  - Action buttons

**Card States:**
- Pending: Yellow theme
- In Progress: Blue theme
- Resolved: Green theme

---

### 6. ADMIN DASHBOARD - OVERVIEW
**Frame Size:** 1440x900px (Desktop)

**Header:**
- Same as citizen dashboard
- Admin-specific navigation

**Sidebar:**
- Overview (active)
- All Complaints
- Manage Staff
- Send Alerts

**Main Content:**
- Statistics grid (6 cards):
  - Total Complaints
  - Pending
  - In Progress
  - Resolved
  - Total Users
  - Active Staff
- High Priority Complaints section
- Recent activity feed

---

### 7. ADMIN DASHBOARD - ALL COMPLAINTS
**Frame Size:** 1440x900px (Desktop)

**Layout:**
- Header with title and advanced filters
- Filter bar:
  - Status dropdown
  - Category dropdown
  - Date range
  - Search box
- Complaint list with detailed cards
- Pagination controls

**Complaint Cards:**
- Citizen information
- Location and category
- Priority and status
- Assignment information
- Action buttons (View, Assign, Update)

---

### 8. ADMIN DASHBOARD - STAFF MANAGEMENT
**Frame Size:** 1440x900px (Desktop)

**Layout:**
- Header with "Add New Staff" button
- Staff member cards:
  - Profile picture/avatar
  - Name and role
  - Active status indicator
  - Assignment count
  - Action buttons (View, Edit, Activate/Deactivate)

---

### 9. ADMIN DASHBOARD - SEND ALERTS
**Frame Size:** 1440x900px (Desktop)

**Layout:**
- Form container (max-width: 600px)
- Form fields:
  - Alert Type (dropdown)
  - Alert Title
  - Message (textarea)
  - Target Audience
  - Priority Level
  - Notification options (SMS, Email checkboxes)
- Action buttons: Save Draft & Send Alert

---

### 10. EMAIL VERIFICATION PAGE
**Frame Size:** 1440x900px (Desktop)

**Layout:**
- Centered card design
- Success/Error state illustrations
- Verification message
- Action buttons (Resend, Continue)

---

## 🎯 Component Library

### Buttons
**Primary Button:**
- Background: Gradient (emerald-500 to teal-500)
- Text: White, Medium weight
- Padding: 12px 24px
- Border radius: 12px
- Hover: Darker gradient

**Secondary Button:**
- Background: White
- Border: Gray-200
- Text: Gray-700
- Same padding and border radius

**Ghost Button:**
- Background: Transparent
- Text: Primary color
- Hover: Light background

### Input Fields
**Standard Input:**
- Border: Gray-200
- Border radius: 12px
- Padding: 12px 16px
- Focus: Ring with primary color

**Search Input:**
- Icon on left
- Placeholder text
- Clear button on right

### Cards
**Standard Card:**
- Background: White
- Border radius: 24px
- Shadow: Medium
- Padding: 24px

**Status Card:**
- Colored background based on status
- Icon and text
- Hover effects

### Navigation
**Sidebar Item:**
- Icon and text
- Active state with gradient background
- Hover effects

**Breadcrumb:**
- Separated by chevron icons
- Current page highlighted

### Modals
**Standard Modal:**
- Backdrop blur
- Centered card
- Close button
- Action buttons at bottom

---

## 📐 Layout Grids

### Desktop (1440px)
- 12-column grid
- 24px gutters
- 80px margins

### Tablet (768px)
- 8-column grid
- 20px gutters
- 40px margins

### Mobile (375px)
- 4-column grid
- 16px gutters
- 16px margins

---

## 🎨 Visual Elements

### Icons
**Icon Set:** Feather Icons + Custom
- Home, File, Clock, Check, Alert
- Map Pin, Calendar, Eye, Send
- Users, Shield, Target, Menu
- User, Bell, Settings, Logout

### Illustrations
**City Theme:**
- Building silhouettes
- Smart city icons
- Abstract geometric patterns
- Gradient overlays

### Animations
**Micro-interactions:**
- Button hover effects
- Card hover states
- Loading spinners
- Page transitions
- Form validation feedback

---

## 📱 Responsive Design

### Breakpoints
- Mobile: 375px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Mobile Adaptations
- Stacked layouts
- Full-width buttons
- Simplified navigation
- Touch-friendly targets (44px minimum)

### Tablet Adaptations
- Adjusted grid systems
- Sidebar becomes overlay
- Optimized touch interactions

---

## 🚀 Implementation Notes

### Accessibility
- Color contrast ratios (WCAG AA compliant)
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators

### Performance
- Optimized images and icons
- Efficient CSS animations
- Lazy loading for content
- Progressive enhancement

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- Progressive Web App ready

---

## 📋 Design Deliverables

### Figma File Structure
1. **Design System**
   - Colors
   - Typography
   - Components
   - Icons

2. **Screens**
   - Authentication
   - Citizen Dashboard
   - Admin Dashboard
   - Responsive variants

3. **Components**
   - Buttons
   - Forms
   - Cards
   - Navigation
   - Modals

4. **Assets**
   - Icons
   - Illustrations
   - Images

### Export Specifications
- **Icons:** SVG format
- **Images:** PNG/WebP format
- **Components:** Figma components with variants
- **Screens:** High-fidelity mockups

---

This design specification provides a comprehensive foundation for creating a professional, modern, and user-friendly interface for the UrbanEye smart city complaint management system. The design emphasizes accessibility, usability, and visual appeal while maintaining consistency across all user roles and screen sizes.


