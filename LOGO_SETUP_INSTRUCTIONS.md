# Logo Setup Instructions

## Overview
The login page has been updated to include both logos with a professional layout.

## Logo Files Required

Please replace the placeholder logo files in `frontend/src/Assets/` with your actual logo files:

1. **`logl.png`** - Main WorkstationOS logo
   - Recommended size: 320x320px or higher
   - Format: PNG with transparent background
   - Should be your primary application logo

2. **`LOGO-WEB4JOBS-Jobintech.png`** - Web4Jobs logo  
   - Recommended size: 256x256px or higher
   - Format: PNG with transparent background
   - The purple design matches our #412977 color theme perfectly

## File Locations

```
frontend/src/Assets/
├── logl.png                    (Replace with your WorkstationOS logo)
├── LOGO-WEB4JOBS-Jobintech.png (Replace with your Web4Jobs logo)
└── logo.png                    (Original logo - can keep as backup)
```

## Login Page Features

The updated login page now includes:

- **Dual Logo Display**: Both logos side by side with elegant separator
- **Brand Integration**: Uses the new #412977 purple color theme
- **Responsive Design**: Logos scale appropriately on different screen sizes
- **Hover Effects**: Subtle animations when hovering over logos
- **Partnership Footer**: Shows the collaboration between WorkstationOS and Web4Jobs
- **Professional Layout**: Clean, modern design that reflects both brands

## Steps to Update

1. Save your logo files as:
   - `logl.png` for WorkstationOS
   - `LOGO-WEB4JOBS-Jobintech.png` for Web4Jobs

2. Copy them to: `frontend/src/Assets/`

3. Restart the development server:
   ```bash
   cd frontend
   npm run dev
   ```

4. Check the login page at: `http://localhost:5173/login`

## Color Theme Integration

The logos work perfectly with the new purple theme (#412977) we implemented. The design creates a cohesive brand experience that represents the partnership between WorkstationOS and Web4Jobs.