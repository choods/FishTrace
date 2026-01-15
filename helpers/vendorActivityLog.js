import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * 
 * @param {string} vendorId 
 * @param {string} action 
 * @param {string} details
 */
export async function addVendorActivityLog(vendorId, action, details) {
  try {
    const logRef = collection(db, 'vendors', vendorId, 'activityLog');
    await addDoc(logRef, {
      action,
      details,
      timestamp: serverTimestamp(),
    });
    console.log('Activity logged:', action);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
