# UrbanEye - Visual Mockup Guide

## 🎨 Creating the Figma Design

### Step 1: Set Up the Figma File

**File Structure:**
```
UrbanEye Design System
├── 🎨 Design System
│   ├── Colors
│   ├── Typography
│   ├── Components
│   └── Icons
├── 📱 Screens
│   ├── Authentication
│   ├── Citizen Dashboard
│   └── Admin Dashboard
└── 📐 Layouts
    ├── Desktop (1440px)
    ├── Tablet (768px)
    └── Mobile (375px)
```

---

## 🎨 DESIGN SYSTEM SETUP

### Colors Frame
Create a frame with color swatches:

**Primary Colors:**
- `#10B981` (Emerald-500) - Primary Green
- `#14B8A6` (Teal-500) - Primary Teal  
- `#3B82F6` (Blue-500) - Primary Blue

**Status Colors:**
- `#22C55E` (Green-500) - Success
- `#F59E0B` (Amber-500) - Warning
- `#EF4444` (Red-500) - Error
- `#06B6D4` (Cyan-500) - Info

**Neutral Colors:**
- `#FFFFFF` - White
- `#F9FAFB` - Gray-50
- `#F3F4F6` - Gray-100
- `#E5E7EB` - Gray-200
- `#4B5563` - Gray-600
- `#1F2937` - Gray-800
- `#111827` - Gray-900

### Typography Frame
Create text styles:

**Headings:**
- H1: Inter Bold, 32px/40px
- H2: Inter Bold, 24px/32px
- H3: Inter Bold, 20px/28px
- H4: Inter Bold, 18px/24px

**Body:**
- Body: Inter Regular, 16px/24px
- Small: Inter Regular, 14px/20px
- XSmall: Inter Regular, 12px/16px

---

## 📱 SCREEN DESIGNS

### 1. LOGIN PAGE (1440x900px)

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────┐
│                    HEADER (if any)                      │
├─────────────────────┬───────────────────────────────────┤
│                     │                                   │
│    LOGIN FORM       │        WELCOME SECTION            │
│    (50% width)      │        (50% width)                │
│                     │                                   │
│  ┌─────────────┐    │  ┌─────────────────────────────┐  │
│  │   Logo      │    │  │    Gradient Background      │  │
│  │  UrbanEye   │    │  │   (Emerald to Blue)         │  │
│  └─────────────┘    │  │                             │  │
│                     │  │  "Hello, Citizen!"          │  │
│  ┌─────────────┐    │  │  "Join our smart city..."   │  │
│  │   Google    │    │  │                             │  │
│  │   OAuth     │    │  │  [JOIN NOW] button          │  │
│  └─────────────┘    │  │                             │  │
│                     │  │  City skyline silhouette    │  │
│  ┌─────────────┐    │  │  at bottom                  │  │
│  │   Email     │    │  └─────────────────────────────┘  │
│  └─────────────┘    │                                   │
│                     │                                   │
│  ┌─────────────┐    │                                   │
│  │  Password   │    │                                   │
│  └─────────────┘    │                                   │
│                     │                                   │
│  ┌─────────────┐    │                                   │
│  │  Sign In    │    │                                   │
│  └─────────────┘    │                                   │
│                     │                                   │
└─────────────────────┴───────────────────────────────────┘
```

**Visual Details:**
- **Left Side Background:** White with subtle gradient overlay
- **Right Side Background:** Linear gradient from `#10B981` to `#3B82F6`
- **Logo:** City icon (building silhouette) with "UrbanEye" text
- **Google Button:** White background, Google colors, rounded corners
- **Form Fields:** Gray-100 background, 12px border radius, focus ring
- **Sign In Button:** Gradient background, white text, 12px border radius
- **City Skyline:** Dark silhouette at bottom of right section

### 2. CITIZEN DASHBOARD - OVERVIEW (1440x900px)

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  [Menu] UrbanEye [Bell] [User Profile]                 │
├─────────┬───────────────────────────────────────────────┤
│         │                                               │
│ SIDEBAR │              MAIN CONTENT                     │
│         │                                               │
│ Overview│  ┌─────────────────────────────────────────┐  │
│ [Active]│  │        WELCOME BANNER                   │  │
│         │  │  "Welcome back, [Name]! 👋"             │  │
│ Submit  │  │  Gradient background                    │  │
│         │  │  [Report New Issue] button              │  │
│ My      │  └─────────────────────────────────────────┘  │
│         │                                               │
│ Analytics│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│         │  │Total│ │Pen- │ │In   │ │Res- │           │
│         │  │Issues│ │ding │ │Prog │ │olved│           │
│         │  └─────┘ └─────┘ └─────┘ └─────┘           │
│         │                                               │
│         │  ┌─────────────────────────────────────────┐  │
│         │  │        RECENT ISSUES                    │  │
│         │  │  [Issue Card] [Issue Card] [Issue Card] │  │
│         │  └─────────────────────────────────────────┘  │
│         │                                               │
└─────────┴───────────────────────────────────────────────┘
```

**Visual Details:**
- **Header:** White background, subtle border, logo + notifications
- **Sidebar:** White background, 288px width, gradient active state
- **Welcome Banner:** Gradient background, white text, rounded corners
- **Stats Cards:** White background, colored icons, gradient text
- **Issue Cards:** Status-colored backgrounds, rounded corners

### 3. CITIZEN DASHBOARD - SUBMIT COMPLAINT (1440x900px)

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  [Menu] UrbanEye [Bell] [User Profile]                 │
├─────────┬───────────────────────────────────────────────┤
│         │                                               │
│ SIDEBAR │              FORM CONTAINER                   │
│         │                                               │
│ Overview│  ┌─────────────────────────────────────────┐  │
│         │  │  [Icon] Submit New Complaint            │  │
│ Submit  │  │  "Help us improve your city..."         │  │
│ [Active]│  │                                         │  │
│         │  │  ┌─────────────┐ ┌─────────────┐       │  │
│ My      │  │  │Issue Title  │ │Category     │       │  │
│         │  │  └─────────────┘ └─────────────┘       │  │
│ Analytics│  │                                         │  │
│         │  │  ┌─────────────────────────────────┐   │  │
│         │  │  │        Location                 │   │  │
│         │  │  └─────────────────────────────────┘   │  │
│         │  │                                         │  │
│         │  │  ┌─────────────────────────────────┐   │  │
│         │  │  │        Description              │   │  │
│         │  │  │        (textarea)               │   │  │
│         │  │  └─────────────────────────────────┘   │  │
│         │  │                                         │  │
│         │  │  [Submit Complaint] [Cancel]           │  │
│         │  └─────────────────────────────────────────┘  │
│         │                                               │
└─────────┴───────────────────────────────────────────────┘
```

**Visual Details:**
- **Form Container:** White background, 24px border radius, shadow
- **Form Fields:** Gray-50 background, 12px border radius, focus states
- **Submit Button:** Gradient background, white text
- **Cancel Button:** White background, gray border

### 4. ADMIN DASHBOARD - OVERVIEW (1440x900px)

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  [Menu] UrbanEye [Bell] [User Profile]                 │
├─────────┬───────────────────────────────────────────────┤
│         │                                               │
│ SIDEBAR │              MAIN CONTENT                     │
│         │                                               │
│ Overview│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ │
│ [Active]│  │Total│ │Pen- │ │In   │ │Res- │ │Total│ │Active│ │
│         │  │Comp │ │ding │ │Prog │ │olved│ │Users│ │Staff │ │
│ All     │  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ │
│         │                                               │
│ Staff   │  ┌─────────────────────────────────────────┐  │
│         │  │        HIGH PRIORITY COMPLAINTS         │  │
│ Alerts  │  │  [Urgent Card] [High Priority Card]     │  │
│         │  └─────────────────────────────────────────┘  │
│         │                                               │
└─────────┴───────────────────────────────────────────────┘
```

**Visual Details:**
- **Stats Grid:** 6 cards in 3x2 grid, different colored icons
- **Priority Cards:** Red/orange backgrounds for urgent items
- **Same header/sidebar structure as citizen dashboard**

### 5. ADMIN DASHBOARD - ALL COMPLAINTS (1440x900px)

**Layout Structure:**
```
┌─────────────────────────────────────────────────────────┐
│  [Menu] UrbanEye [Bell] [User Profile]                 │
├─────────┬───────────────────────────────────────────────┤
│         │                                               │
│ SIDEBAR │              COMPLAINTS LIST                  │
│         │                                               │
│ Overview│  ┌─────────────────────────────────────────┐  │
│         │  │  All Complaints              [Filters]  │  │
│ All     │  │                                         │  │
│ [Active]│  │  ┌─────────────────────────────────────┐ │  │
│         │  │  │  [Status] [Priority]                │ │  │
│ Staff   │  │  │  "Broken streetlight on Main St"    │ │  │
│         │  │  │  📍 Main Street, Block A            │ │  │
│ Alerts  │  │  │  👤 By: John Doe                    │ │  │
│         │  │  │  [View] [Assign] [Update]           │ │  │
│         │  │  └─────────────────────────────────────┘ │  │
│         │  │                                         │  │
│         │  │  ┌─────────────────────────────────────┐ │  │
│         │  │  │  [Status] [Priority]                │ │  │
│         │  │  │  "Pothole near city center"         │ │  │
│         │  │  │  📍 City Center Avenue              │ │  │
│         │  │  │  👤 By: Jane Smith                  │ │  │
│         │  │  │  [View] [Assign] [Update]           │ │  │
│         │  │  └─────────────────────────────────────┘ │  │
│         │  │                                         │  │
│         │  │  [Pagination Controls]                  │  │
│         │  └─────────────────────────────────────────┘  │
│         │                                               │
└─────────┴───────────────────────────────────────────────┘
```

**Visual Details:**
- **Filter Bar:** White background, dropdown menus, search box
- **Complaint Cards:** White background, status badges, action buttons
- **Status Badges:** Color-coded (yellow=pending, blue=in-progress, green=resolved)
- **Priority Badges:** Color-coded (red=urgent, orange=high, yellow=medium, green=low)

---

## 🎯 COMPONENT SPECIFICATIONS

### Button Components

**Primary Button:**
```
┌─────────────────────────┐
│    [Gradient Background] │
│        Button Text      │
└─────────────────────────┘
```
- Background: Linear gradient `#10B981` to `#14B8A6`
- Text: White, Inter Medium, 16px
- Padding: 12px 24px
- Border radius: 12px
- Hover: Darker gradient

**Secondary Button:**
```
┌─────────────────────────┐
│    [White Background]   │
│    [Gray Border]        │
│        Button Text      │
└─────────────────────────┘
```

### Input Field Components

**Standard Input:**
```
┌─────────────────────────────────┐
│  Label                          │
│  ┌─────────────────────────────┐ │
│  │        Input Text           │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```
- Border: `#E5E7EB`
- Border radius: 12px
- Padding: 12px 16px
- Focus ring: `#10B981`

### Card Components

**Status Card:**
```
┌─────────────────────────────────┐
│  [Status Color Background]      │
│  ┌─────┐  Title                │
│  │ Icon│  Description          │
│  └─────┘  [Status Badge]       │
└─────────────────────────────────┘
```

---

## 📱 RESPONSIVE BREAKPOINTS

### Mobile (375px)
- Stacked layout
- Full-width components
- Simplified navigation
- Touch-friendly targets (44px minimum)

### Tablet (768px)
- Adjusted grid systems
- Sidebar becomes overlay
- Optimized touch interactions

### Desktop (1440px)
- Full layout as specified above
- Hover states and interactions

---

## 🎨 VISUAL ELEMENTS

### Icons
Use Feather Icons style:
- Simple, clean line icons
- 24px default size
- Consistent stroke width (2px)

### Illustrations
**City Theme Elements:**
- Building silhouettes
- Smart city icons (WiFi, sensors, etc.)
- Abstract geometric patterns
- Gradient overlays

### Animations (Figma Prototypes)
- Button hover effects
- Card hover states
- Page transitions
- Form validation feedback

---

## 📋 IMPLEMENTATION CHECKLIST

### Design System
- [ ] Color palette defined
- [ ] Typography styles created
- [ ] Component library built
- [ ] Icon set established

### Screens
- [ ] Login page
- [ ] Registration page
- [ ] Citizen dashboard (all tabs)
- [ ] Admin dashboard (all tabs)
- [ ] Email verification page

### Components
- [ ] Buttons (all variants)
- [ ] Form fields
- [ ] Cards
- [ ] Navigation
- [ ] Modals

### Responsive
- [ ] Mobile layouts
- [ ] Tablet layouts
- [ ] Desktop layouts

### Prototypes
- [ ] User flows
- [ ] Interactions
- [ ] Animations

---

This visual mockup guide provides detailed instructions for creating a professional Figma design for the UrbanEye project. Follow these specifications to create a cohesive, modern, and user-friendly interface that matches the existing codebase functionality.


