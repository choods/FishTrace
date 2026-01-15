# FishTrace API Documentation — Quick Reference

**Database:** Firebase Firestore | **Project:** fishtrace-capstone

---

## Collections

- **vendors** — Vendor profiles, stalls, fish lists, sessions, activity logs
- **fishCatalog** — Available fish types (admin managed)
- **settings** — Global disabled fish array
- **activityLog** — Subcollection under each vendor

---

## Authentication

**Login (Vendor/Admin):** Query `vendors` where `username` and `password` match.  
Returns vendor document with ID, stallName, fishList, session status.

⚠️ **Production Note:** Replace username/password with Firebase Authentication.

---

## Vendor Operations

**Get Vendor:** `onSnapshot(doc(db, 'vendors', vendorId))` → Returns stall info + fish list + session status  
**Update Settings:** `updateDoc(vendorRef, { stallName, location, stallContact, stallHours })`  
**Start Session:** `updateDoc(vendorRef, { session: { active: true, start: serverTimestamp() } })` + log activity  
**End Session:** `updateDoc(vendorRef, { session: { active: false, end: serverTimestamp() } })` + log activity  
**Add Fish:** `updateDoc(vendorRef, { fishList: arrayUnion(fishObject) })` + log activity  
**Update Price:** Fetch fishList, map and update price, write back + log activity  
**Delete Fish:** Filter out fish by ID, write updated list + log activity

---

## Fish Catalog (Admin)

**Get All Fish:** `onSnapshot(collection(db, 'fishCatalog'))` → List of all available fish types  
**Add Fish Type:** `addDoc(collection(db, 'fishCatalog'), { name, image, description })`  
**Disable Fish:** `updateDoc(doc(db, 'settings', 'fishStatus'), { disabledFish: arrayUnion("FishName") })`  
**Enable Fish:** `updateDoc(doc(db, 'settings', 'fishStatus'), { disabledFish: arrayRemove("FishName") })`

---

## Activity Logging

**Helper Function:** `addVendorActivityLog(vendorId, action, details)`  
**Location:** `helpers/vendorActivityLog.js`  
**What it does:** Logs every action (Add Fish, Delete Fish, Session started/ended, Price update) to `vendors/{vendorId}/activityLog`

**Get Activity Log (Vendor):** `onSnapshot(collection(db, 'vendors', vendorId, 'activityLog'), orderBy('timestamp', 'desc'))`  
**Get All Activities (Admin):** Query all vendors' activityLog subcollections and merge results

---

## User Queries

**Get All Vendors:** `onSnapshot(collection(db, 'vendors'))` → Lists all vendors with their fish, prices, session status  
**Get Fish by Vendor:** `doc(db, 'vendors', vendorId).fishList` → Fish at specific stall + location info  
**Search Fish:** Query all vendors, collect their fishList arrays, filter by name (client-side) and excluded fish

---

## Admin Operations

**Create Vendor:** `addDoc(collection(db, 'vendors'), { username, password, stallName, location, stallContact, stallHours, fishList: [], session: { active: false } })`  
**Edit Vendor:** `updateDoc(doc(db, 'vendors', vendorId), { stallName, location, stallContact, stallHours })`  
**Get All Vendors:** `getDocs(collection(db, 'vendors'))` → Returns all vendor records for management

---

## Error Handling

| Code | Issue |
|------|-------|
| `AUTH_FAILED` | Invalid username/password |
| `VENDOR_NOT_FOUND` | Vendor ID doesn't exist |
| `PERMISSION_DENIED` | Access denied |
| `INVALID_INPUT` | Missing required fields |
| `FIREBASE_ERROR` | Network or database issue |
| `DUPLICATE_ENTRY` | Fish already in stall |

Wrap Firestore calls in try/catch and show user-friendly alerts.

---

## Security Rules (Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /fishCatalog/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
    match /vendors/{vendorId} {
      allow read: if true;
      allow write: if request.auth.uid == vendorId;
      match /activityLog/{document=**} {
        allow read, write: if request.auth.uid == vendorId;
      }
    }
    match /settings/{document=**} {
      allow read: if true;
      allow write: if isAdmin();
    }
  }
  function isAdmin() {
    return request.auth.customClaims.role == 'admin';
  }
}
```

⚠️ **Important:** Implement Firebase Authentication before production.

---

## Quick Links

- [Firebase Firestore Docs](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)
- [Expo Docs](https://docs.expo.dev/)

**Version:** 1.0.0 | **Updated:** November 29, 2025
