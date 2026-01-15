# FishTrace — A REAL-TIME FISH IDENTIFICATION AND QUANTITY AVAILABILITY MONITORING SYSTEM FOR LOCAL FISH MARKETS

A React Native mobile application for real-time fish market inventory management, vendor stall tracking, and user browsing. Built with Expo, Firebase, and a modern design system.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [System Architecture](#system-architecture)
4. [Project Structure](#project-structure)
5. [Setup & Installation](#setup--installation)
6. [Design System](#design-system)
7. [User Roles & Features](#user-roles--features)
8. [Key Components](#key-components)
9. [Database Schema](#database-schema)
10. [Development](#development)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**FishTrace** is a capstone project that bridges fish vendors and consumers through a real-time inventory management system. Vendors manage their stalls and fish listings; admins oversee fish catalogs and vendor activity; users browse available fish by location and price.

**Tech Stack:**
- **Frontend:** React Native (Expo)
- **Backend:** Firebase Firestore, Authentication
- **State Management:** React Hooks
- **Styling:** React Native StyleSheet + Custom Design System
- **Icons:** Expo Vector Icons (Ionicons)

---

## ✨ Features

### User Features
- 🔍 **Browse Fish Catalog** — Search and filter by fish type, price, availability
- 📍 **Location-based Discovery** — Find fish by vendor stall location
- 💰 **Real-time Pricing** — Live price updates from vendors
- 📊 **Stock Status** — See available/unavailable fish at a glance
- 🔔 **Activity Logging** — Track all actions (for audit trail)

### Vendor Features
- 🏪 **Stall Management** — Add/edit/delete fish listings
- ⏱️ **Session Management** — Start/end selling sessions with timestamps
- 💵 **Price Updates** — Update fish pricing in real-time
- 📈 **Inventory Control** — Manage quantity and stock status
- 📋 **Activity Log** — View history of all stall actions
- ⚙️ **Stall Settings** — Configure stall name, location, contact, hours

### Admin Features
- 🐟 **Fish Catalog Management** — Add/edit/disable fish types globally
- 🏢 **Vendor Management** — Create, edit vendor accounts
- 📊 **Activity Monitoring** — View all system activity logs
- 🔒 **Access Control** — Manage vendor/admin credentials
- 📈 **System Analytics** — Track vendor sessions and inventory changes

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   React Native (Expo)                   │
│  ┌──────────────┬──────────────┬──────────────────────┐ │
│  │   User App   │  Vendor App  │   Admin Dashboard    │ │
│  └──────────────┴──────────────┴──────────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │     Firebase (Backend)       │
        ├──────────────┬───────────────┤
        │  Firestore   │ Authentication│
        │  (Database)  │ (Auth)        │
        └──────────────┴───────────────┘
```

### Data Flow
1. **User** browses fish → queries `vendors` collection for fish listings
2. **Vendor** manages stall → updates `vendors/{vendorId}/fishList`
3. **Admin** oversees system → manages `fishCatalog` and vendor accounts
4. **Activity Logs** tracked in `vendors/{vendorId}/activityLog` subcollection
5. **Real-time Listeners** (onSnapshot) keep all screens in sync

---

## 📁 Project Structure

```
FishTraceMod/
├── App.js                          # Root navigation setup
├── firebase.js                     # Firebase config & initialization
├── metro.config.js                 # Expo Metro config
├── package.json                    # Dependencies
├── README.md                       # This file
│
├── screens/
│   ├── user/                       # User-facing screens
│   │   ├── DashboardScreen.js      # Browse fish catalog
│   │   ├── FishInfo.js             # Fish detail view
│   │   ├── LocationScreen.js       # Find fish by location
│   │   ├── StallScreen.js          # View vendor stall
│   │   └── SplashScreen.js         # App splash screen
│   │
│   ├── vendor/                     # Vendor management screens
│   │   ├── VendorDashboard.js      # Vendor home (tabs: Stall, Log, Settings)
│   │   ├── StallTab.js             # Manage fish inventory + session control
│   │   ├── ActivityLogTab.js       # View stall activity history
│   │   ├── StallSettingsTab.js     # Edit stall info
│   │   ├── EditFishModal.js        # Edit fish price modal
│   │   ├── VendorLogin.js          # Vendor authentication
│   │   └── VendorSplashScreen.js   # Vendor splash
│   │
│   └── admin/                      # Admin management screens
│       ├── AdminDashboard.js       # Admin home (tabs: Fish Mgr, Vendors, Logs)
│       ├── AdminFishManager.js     # Manage global fish catalog
│       ├── VendorManagement.js     # Manage vendor accounts
│       ├── ActivityLogs.js         # View system activity log
│       ├── AddVendor.js            # Create new vendor
│       ├── EditVendor.js           # Edit vendor info
│       ├── AdminLogin.js           # Admin authentication
│       └── AdminSplashScreen.js    # Admin splash (if exists)
│
├── helpers/
│   └── vendorActivityLog.js        # Helper function to log vendor activities
│
├── assets/
│   └── *.png, *.jpg                # Images (stall icon, fish images, etc.)
│
└── styles/
    └── designSystem.js             # (Optional) Centralized design tokens
```

---

## 🚀 Setup & Installation

### Prerequisites
- **Node.js** (v14+) and npm/yarn installed
- **Expo CLI** installed: `npm install -g expo-cli`
- **Firebase Project** set up at [console.firebase.google.com](https://console.firebase.google.com)
- **Git** for version control

### Installation Steps

1. **Clone the Repository**
   ```bash
   cd "d:\a.School 4thyr\za_CAPSTONE Project and Research 2"
   ```

2. **Install Dependencies**
   ```bash
   cd FishTraceMod
   npm install
   ```

3. **Configure Firebase**
   - Update `firebase.js` with your Firebase project credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID",
   };
   ```

4. **Start the Development Server**
   ```bash
   npx expo start
   ```
   - Press `i` for iOS Simulator or `a` for Android Emulator
   - Or scan QR code with **Expo Go** app on your device

5. **Build for Distribution** (optional)
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

---

## 🎨 Design System

The project uses a **centralized design system** for consistency across User, Vendor, and Admin interfaces.

### Tokens & Standards

- **Colors:** Primary `#103461` (navy), Secondary `#28a745` (green), Status colors
- **Typography:** H1 `32px` bold, H2 `24px` bold, H3 `20px` bold, Body `16px` regular
- **Spacing:** 8-point grid — `xs: 4`, `sm: 8`, `md: 12`, `lg: 16`, `xl: 24`, `xxl: 32`
- **Shadows:** Subtle (`sm`), standard (`md`), elevated (`lg`)
- **Radius:** `sm: 4`, `md: 8`, `lg: 12`, `xl: 16`, `full: 999` (circles)

### Layout Standards by Role

| Role | Container | Header | Cards | Modal |
|------|-----------|--------|-------|-------|
| **User** | `16px` padding | `h2` 24px | Full-width, shadow `sm` | Width `90%` mobile → `500px` |
| **Vendor** | `16px` padding | `h2` 24px | Compact, actions visible | Width `90%` mobile → `500px` |
| **Admin** | `16–24px` padding | `h1/h2` 32/24px | Dense rows ~56px | Width `90%` → `900–1100px` |

For detailed design system, see `DESIGN_SYSTEM.md` (if available).

---

## 👥 User Roles & Features

### **User (Customer)**
- **Access:** DashboardScreen → Browse fish
- **Actions:** Search, filter by name, view locations, check availability & pricing
- **Navigation:** Dashboard → LocationScreen → StallScreen → FishInfo
- **Authentication:** Not required (public access)

### **Vendor (Fish Seller)**
- **Access:** VendorLogin → VendorDashboard
- **Actions:** 
  - Add fish from catalog to stall
  - Update fish prices in real-time
  - View activity log
  - Edit stall info (name, location, contact, hours)
- **Authentication:** Username/password login

### **Admin (System Manager)**
- **Access:** AdminLogin → AdminDashboard
- **Actions:**
  - Manage global fish catalog (add/edit/disable fish types)
  - Manage vendor accounts (create/edit vendors)
  - View system activity logs (all vendors)
  - Monitor vendor activity
- **Authentication:** Username/password login
- **Permissions:** Full control over system configuration

---

## 🔧 Key Components

### **VendorDashboard (Tabbed Navigation)**
Hub for vendor operations with three tabs:
- **Stall Tab** (`StallTab.js`) — Add/edit/delete fish, start/end sessions
- **Activity Log Tab** (`ActivityLogTab.js`) — Real-time activity history
- **Stall Settings Tab** (`StallSettingsTab.js`) — Update stall metadata

### **StallTab (Session Management)**
New feature that persists session state:
- **Start Session** → writes `session: { active: true, start: serverTimestamp() }` to vendor doc
- **End Session** → writes `session: { active: false, end: serverTimestamp() }`
- **Real-time Sync** — onSnapshot listener updates UI instantly on all devices
- **Activity Logging** — each session start/end logged to `activityLog` subcollection

### **DashboardScreen (User Catalog)**
Displays available fish from all vendors:
- Real-time filter: hides fish already added to vendor's stall
- Queries `fishCatalog` + merges with vendor `fishList` data
- Shows pricing, quantity, status for each fish

### **ActivityLogTab / ActivityLogs**
Records all actions in `vendors/{vendorId}/activityLog`:
- Action type (Add Fish, Delete Fish, Edit Price, Session, Update Stall)
- Details (which fish, new price, etc.)
- Timestamp (auto-generated by Firestore)

---

## 🗄️ Database Schema

### Collections

**`fishCatalog`** — Global fish types
```javascript
{
  id: "fish-001",
  name: "Bangus",
  image: "https://...",
  description: "Milkfish..."
}
```

**`vendors`** — Vendor accounts & stalls
```javascript
{
  id: "vendor-001",
  username: "john_vendor",
  password: "hashed...",
  stallName: "Fresh Fish Stall #1",
  location: "Market 3, Row A",
  stallContact: "09121234567",
  stallHours: "6:00 AM - 6:00 PM",
  session: {
    active: true,
    start: Timestamp,
    end: Timestamp (if ended)
  },
  fishList: [
    {
      id: "fish-001",
      name: "Bangus",
      quantity: 50,
      price: 150,
      status: "Available"
    }
  ],
  lastActiveTab: "Stall"  // Persisted dashboard tab
}
```

**`vendors/{vendorId}/activityLog`** — Vendor activity history
```javascript
{
  action: "Add Fish",
  details: "Added Bangus to stall",
  timestamp: Timestamp
}
```

**`settings`** — Global system config
```javascript
// settings/fishStatus
{
  disabledFish: ["FishName1", "FishName2"]  // Globally disabled fish
}
```

**`adminLog`** (optional) — System-wide activity log
```javascript
{
  action: "Vendor Created",
  user: "admin@example.com",
  details: "Created vendor John",
  timestamp: Timestamp
}
```

---

## 🛠️ Development

### Common Tasks

**Add a New Fish Type**
1. Admin Dashboard → Fish Manager → "Add Fish" button
2. Enter name, upload image
3. Fish automatically appears in vendor "Add Fish" catalog

**Create a New Vendor**
1. Admin Dashboard → Vendor Management → "Add Vendor"
2. Fill in username, password, stall name, location
3. Vendor can immediately log in

**Update Fish Price (Vendor)**
1. Vendor Dashboard → Stall Tab → tap fish card → "Edit"
2. Update price, save
3. Price updates in real-time on user dashboard

**View Activity Log**
- Vendor: Dashboard → Activity Log Tab
- Admin: Dashboard → Activity Logs

### Running Tests (if available)
```bash
npm test
```

### Linting
```bash
npm run lint
```
or
```bash
npx eslint screens/ helpers/
```

---

## 🐛 Troubleshooting

### **App Won't Start / Metro Bundler Error**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npx expo start -c
```

### **Firebase Connection Issues**
- Verify `firebase.js` credentials
- Check Firebase project has Firestore & Auth enabled
- Ensure network connectivity
- Check Firestore security rules allow read/write

### **Session Not Persisting**
- Verify `session` field is saved to vendor doc in Firestore
- Check onSnapshot listener is active (check DevTools)
- Ensure `serverTimestamp()` is used for Firestore timestamps

### **Fish Not Appearing in Add Modal**
- Confirm fish exists in `fishCatalog` collection
- Verify fish is not already in vendor's `fishList`
- Check `disabledFish` array in `settings/fishStatus` (globally disabled fish are hidden)

### **Activity Log Not Updating**
- Verify `activityLog` subcollection exists under vendor doc
- Check Firestore security rules allow subcollection writes
- Ensure `addVendorActivityLog()` is being called after actions

### **Performance Issues on Large Inventory**
- Paginate vendor lists with Firestore `.limit(20).startAfter(...)`
- Use `.orderBy()` efficiently
- Consider denormalizing frequently-accessed data

---

## 📞 Support & Contribution

For issues, questions, or improvements:
1. Check this README and `DESIGN_SYSTEM.md`
2. Review inline code comments
3. Check Firestore rules and security settings
4. Consult Firebase documentation: https://firebase.google.com/docs

---

## 📝 License

This is a capstone project for educational purposes. Proprietary — not licensed for external use.

---

## 🎓 Credits

**Project:** FishTrace Capstone (CAPSTONE Project and Research 2)  
**Team:** [Your School / Institution]  
**Built with:** React Native, Expo, Firebase

---

**Last Updated:** November 29, 2025  
**Version:** 1.0.0
