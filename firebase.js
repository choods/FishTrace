import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAJJ7xwR-XtFN5FB10jE4tIc4ZoHoEpx0o",
  authDomain: "fishtrace-c3957.firebaseapp.com",
  projectId: "fishtrace-c3957",
  storageBucket: "fishtrace-c3957.appspot.com",
  messagingSenderId: "746136949109",
  appId: "1:746136949109:android:b1db102814e757e5f9433c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };