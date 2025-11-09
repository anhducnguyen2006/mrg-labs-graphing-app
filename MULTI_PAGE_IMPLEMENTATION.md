# Multi-Page Dashboard Implementation

## Overview

Successfully created a 3-page dashboard with routing and sidebar navigation.

## Pages Created

### 1. **Dashboard** (`/dashboard`)

- **Purpose**: Main page for file uploads and graph exports
- **Features**:
  - FileUploadBox components for baseline and sample CSV files
  - Export Graphs functionality
  - GraphPreview component
  - Sidebar navigation
  - User profile menu with change password and logout

### 2. **Sample Search** (`/sample-search`)

- **Purpose**: Search and analyze sample data
- **Features**:
  - GraphPreview component for data visualization
  - Sidebar navigation
  - Sample file list in sidebar
  - User profile menu

### 3. **Alerts** (`/alerts`)

- **Purpose**: View system alerts and notifications
- **Features**:
  - Alert cards (info, success, warning status)
  - Placeholder alerts for demonstration
  - Sidebar navigation
  - User profile menu

## Common Components

### Sidebar Navigation

All three pages include the same sidebar (`SampleSidebar`) with:

- **Navigation Menu**:
  - Dashboard (home icon)
  - Sample Search (search icon)
  - Alerts (bell icon)
- **Sample Files Section**:
  - Search functionality
  - List of uploaded samples
  - Remove sample option

### Layout

All pages use `DashboardLayout` which includes:

- Navbar with title and user profile menu
- Sidebar
- Main content area
- Responsive design

## Routes

```
/dashboard       → Dashboard page (default)
/sample-search   → Sample Search page
/alerts          → Alerts page
/login           → Login page (public)
/signup          → Signup page (public)
/                → Redirects to /dashboard
```

## Files Modified/Created

### Created:

- `frontend/src/pages/SampleSearch.tsx`
- `frontend/src/pages/Alerts.tsx`

### Modified:

- `frontend/src/App.tsx` - Added new routes
- `frontend/src/components/SampleSidebar.tsx` - Added navigation menu

## How to Use

1. **Start the development server**:

   ```bash
   cd frontend
   npm run dev
   ```

2. **Access the application**:

   - Open browser to `http://localhost:5173`
   - Login with your credentials
   - Navigate between pages using the sidebar

3. **Navigation**:
   - Click Dashboard to upload files and export graphs
   - Click Sample Search to view and analyze uploaded samples
   - Click Alerts to view system notifications

## Future Enhancements

### Dashboard

- Add more graph customization options
- Implement batch processing
- Add data summary statistics

### Sample Search

- Add advanced filtering options
- Implement search by metadata
- Add comparison tools

### Alerts

- Connect to real-time notification system
- Add alert severity filters
- Implement alert history
- Add email/SMS notification settings

## Notes

- All backend functionality remains unchanged
- Components are preserved for future use
- Authentication and user management work as before
- The sidebar appears on all three pages for consistent navigation
