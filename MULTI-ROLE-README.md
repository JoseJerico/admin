# AirCon Hub - Multi-Role PWA Application

A comprehensive Progressive Web App (PWA) for air conditioning services with three distinct user roles: **Admin**, **Customer**, and **Technician**. Built with React, Supabase, and PWA technologies.

## 🎯 Overview

AirCon Hub is a complete ecosystem for AC service management:
- **Admin Portal**: Manage schedules, approve/reject bookings, assign technicians
- **Customer App**: Browse products, get AI recommendations, book services
- **Technician App**: View assigned jobs, document work with photos, track progress

## 📱 User Roles

### 👨‍💼 Admin
**Purpose**: Manage the entire business operations

**Features**:
- View all appointment requests
- Approve or reject appointments
- Assign technicians to jobs
- Edit appointment details
- View statistics & analytics
- Filter by status (pending, approved, assigned, rejected)

**Access**: `http://localhost:1234` → Select "Admin" → Login

### 👤 Customer
**Purpose**: Browse products and book AC services

**Features**:
- **eCommerce Catalog**: Browse available AC units with specs & pricing
- **Services Menu**: View installation, maintenance, repair options
- **Room Measurement**: Use phone camera to measure room dimensions
- **AI Recommendation**: Get suggested AC unit based on room size
- **Shopping Cart**: Add products/services to cart
- **Smart Calculation**: Room measurements auto-calculate area in sqm
- **Booking System**: Schedule appointments

**Access**: `http://localhost:1234` → Select "Customer" → Login

**Camera Features**:
- Take photos of room for documentation
- Input width × length to calculate area
- Automatic BTU recommendation based on area

### 🔧 Technician
**Purpose**: Execute service jobs and document work

**Features**:
- **Job Dashboard**: View all assigned appointments
- **Appointment Details**: Customer info, location, phone, unit specs
- **Work Documentation**: Take before/during/after photos
- **Photo Gallery**: Organize photos by type (before/during/after)
- **Work Notes**: Document what was done, issues found, parts used
- **Job Completion**: Mark jobs as complete with documentation
- **Call Integration**: Direct dial customer from appointment details

**Access**: `http://localhost:1234` → Select "Technician" → Login

**Camera Features**:
- Capture before/during/after work photos
- Track maintenance/repair documentation
- Photo timestamps for verification

## 📁 Project Structure

```
src/
├── App.jsx                    # Main router & role selector
├── App.css                    # Global styles
├── RoleSelector.jsx           # Role selection UI
├── RoleSelector.css           # Role selector styles

├── Admin/
│   ├── AdminApp.jsx          # Admin dashboard
│   └── AdminApp.css          # Admin styles
│
├── User/
│   ├── UserApp.jsx           # Customer eCommerce app
│   └── UserApp.css           # Customer styles
│
├── Technician/
│   ├── TechnicianApp.jsx     # Technician dashboard
│   └── TechnicianApp.css     # Technician styles
│
├── shared/
│   ├── Camera.jsx            # Reusable camera component
│   └── Camera.css            # Camera styles
│
├── Login.jsx                 # Authentication component
├── Login.css                 # Login styles
│
├── EditAppointment.jsx       # Admin edit modal
├── EditAppointment.css       # Modal styles
│
├── InstallPrompt.jsx         # PWA install UI
├── InstallPrompt.css         # Install prompt styles
│
├── manifest.json             # PWA manifest
├── sw.js                     # Service Worker
├── pwaUtils.js               # PWA utilities
├── index.html                # HTML entry point
└── index.jsx                 # React entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js v14+
- npm or yarn

### Installation

```bash
# Clone or navigate to project
cd c:\admin

# Install dependencies
npm install

# Start development server
npm start

# App opens at http://localhost:1234
```

### Build for Production

```bash
npm run build
# Output: dist/ folder
```

## 🔐 Authentication

**Demo Credentials** (any role):
- **Email**: Any valid email (e.g., `admin@aircon.com`, `customer@aircon.com`, `tech@aircon.com`)
- **Password**: Any password with minimum 6 characters

**Session Management**:
- User data stored in `localStorage` as `appUser`
- Role stored in `localStorage` as `appRole`
- Auto-login on page refresh if session exists
- Logout clears all session data

For **production**, integrate:
- Supabase Auth
- JWT tokens
- Role-based access control (RBAC)
- Password reset flows

## 📐 Camera Features

### Customer Room Measurement
1. Home screen → "Measure Room"
2. Allow camera access
3. Take photo of room
4. Enter room width (feet)
5. Enter room length (feet)
6. App auto-calculates area (m²)
7. Get AI recommendation for AC unit

### Technician Work Documentation
1. Appointments → Select job
2. "Take Work Photos & Notes"
3. Take **Before** photo
4. Take **During** photo
5. Take **After** photo
6. Add detailed work notes
7. Complete job

**Camera Specifications**:
- Supports front and rear cameras
- High-resolution photo capture
- Safe area handling for notched devices
- Canvas-based image processing
- Photo timestamps

## 🛍️ Products & Services

### AC Units (Sample)
- 1 Ton Window AC - ₱15,000 (120-150 sq ft)
- 1.5 Ton Split AC - ₱28,000 (150-200 sq ft)
- 2 Ton Split AC - ₱35,000 (200-250 sq ft)
- 2.5 Ton Split AC - ₱42,000 (250-300 sq ft)
- 3 Ton Split AC - ₱52,000 (300-400 sq ft)
- 5 Ton Central AC - ₱95,000 (500+ sq ft)

### Services (Sample)
- AC Installation - ₱5,000 (2-3 hours)
- AC Maintenance - ₱2,000 (1 hour)
- AC Repair - ₱3,000 (Varies)
- Annual Service - ₱4,500 (1.5 hours)
- Refrigerant Refill - ₱1,500 (30 mins)
- Ductwork Cleaning - ₱2,500 (1-2 hours)

## 🧠 Room Size Recommendation Algorithm

```
Area (m²) = (Width_ft × Length_ft) / 10.764

Recommendations:
- 0-150 m²  → 1-1.5 Ton AC (8000-10000 BTU)
- 150-200   → 1.5-2 Ton AC (12000-15000 BTU)
- 200-250   → 2 Ton AC (18000 BTU)
- 250-300   → 2.5 Ton AC (24000 BTU)
- 300-400   → 3 Ton AC (30000 BTU)
- 400+      → 5 Ton Central AC (50000 BTU)
```

## 🔧 API Integration (Supabase)

### Tables Used
```sql
-- schedules table
CREATE TABLE schedules (
  id BIGINT PRIMARY KEY,
  customer_name TEXT,
  requested_date TIMESTAMP,
  status TEXT (pending|approved|assigned|rejected|completed),
  notes TEXT,
  created_at TIMESTAMP
);

-- jobs table
CREATE TABLE jobs (
  id BIGINT PRIMARY KEY,
  schedule_id BIGINT,
  technician_id TEXT,
  status TEXT (assigned|in-progress|completed),
  created_at TIMESTAMP
);
```

### Real-time Operations
- Get schedules: `supabase.from('schedules').select('*')`
- Update status: `supabase.from('schedules').update({status})`
- Create job: `supabase.from('jobs').insert({...})`
- Real-time subscriptions available

## 📱 PWA Features

### Installation
**Desktop (Chrome/Edge)**:
1. Visit `http://localhost:1234`
2. Click install icon in address bar
3. Or use "Install app" prompt at bottom

**Mobile (Android)**:
1. Open in Chrome
2. Tap menu → "Install app"
3. Or use "Install app" prompt

**Mobile (iOS)**:
1. Open in Safari
2. Share → "Add to Home Screen"
3. App appears on home screen

### Offline Capabilities
- Service Worker caches assets
- App works without internet
- Supabase sync requires connection
- Graceful offline handling

### Features
- ✅ Installable on home screen
- ✅ Works offline (with cache)
- ✅ Fast loading (optimal bundle size)
- ✅ App-like experience (fullscreen)
- ✅ Safe area support (notched devices)
- ✅ Push notifications ready
- ✅ Camera integration
- ✅ Touch-optimized UI

## 🎨 Customization

### Colors
Update in `RoleSelector.css` and role-specific CSS:
```css
.admin { --role-color: #667eea; }
.customer { --role-color: #10b981; }
.technician { --role-color: #3b82f6; }
```

### Branding
Update in `manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "YourApp",
  "description": "Your description",
  "theme_color": "#667eea"
}
```

### Products & Services
Edit sample data in:
- `User/UserApp.jsx` → `SAMPLE_PRODUCTS` & `SERVICES`
- `Technician/TechnicianApp.jsx` → `SAMPLE_APPOINTMENTS`

## 🔒 Security Considerations

### Current Demo Features
- Simple email/password login (for demo)
- Session stored in `localStorage`
- No encryption (demo only)

### Production Recommendations
1. **Authentication**: Use Supabase Auth or Firebase
2. **Encryption**: Enable HTTPS & SSL
3. **Data Protection**: Use RLS (Row Level Security) in Supabase
4. **Rate Limiting**: Implement on API endpoints
5. **Input Validation**: Validate all user inputs
6. **Permissions**: Role-based access control (RBAC)
7. **Audit Logs**: Track all admin actions

## 📊 Performance Metrics

**Target Metrics**:
- First Contentful Paint (FCP): < 2s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms

**Lighthouse Score Target**: 90+

## 🐛 Troubleshooting

### App won't load
```
❌ Check browser console for errors (F12)
✓ Clear cache: DevTools → Application → Clear storage
✓ Restart dev server: npm start
```

### Camera not working
```
❌ Check camera permissions
✓ HTTPS required (enforced in production)
✓ Test in Chrome/Safari (best support)
✓ Check DevTools console
```

### Photos not saving
```
❌ Check localStorage quota (5MB limit)
✓ Clear browser storage
✓ Use IndexedDB for large files
```

### Service Worker issues
```
❌ Check Application tab in DevTools
✓ Unregister old workers
✓ Clear cache storage
✓ Restart app
```

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers](https://mdn.io/service-worker-api)
- [Camera API](https://mdn.io/mediadevices-getusermedia)
- [React Docs](https://react.dev/)
- [Supabase](https://supabase.com/docs)
- [Parcel](https://parceljs.org/)

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

### Requirements
- HTTPS enabled
- Service Worker support
- Manifest.json accessible
- Valid SSL certificate

## 📝 Changelog

### Version 1.0.0
- ✅ Multi-role authentication system
- ✅ Admin appointment management
- ✅ Customer eCommerce app
- ✅ Technician job tracking
- ✅ Camera integration (measurement & documentation)
- ✅ PWA support
- ✅ Offline functionality
- ✅ Mobile-optimized UI

## 👥 Support

For issues or questions:
1. Check console (F12)
2. Review Lighthouse audit
3. Verify network requests
4. Check PWA criteria
5. Test in incognito mode

## 📄 License

MIT - Feel free to use and modify

---

**Made with ❄️ by AirCon Hub Team**
