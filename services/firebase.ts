import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, query, orderBy, onSnapshot, serverTimestamp, getDocFromServer, addDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login error:", error);
    throw error;
  }
};

export const logout = () => auth.signOut();

export const syncUserProfile = async (user: FirebaseUser) => {
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      email: user.email || 'no-email@provided.com',
      name: user.displayName || 'Anonymous User',
      photoURL: user.photoURL || null,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      subscriptionStatus: 'free',
      trialEndsAt: null
    });
  } else {
    // If trial is expired, switch back to free
    const data = userDoc.data();
    if (data.subscriptionStatus === 'trial' && data.trialEndsAt) {
      const trialEndsAt = data.trialEndsAt.toDate();
      if (new Date() > trialEndsAt) {
        await updateDoc(userRef, {
          subscriptionStatus: 'free',
          lastActive: serverTimestamp()
        });
        return;
      }
    }
    
    await updateDoc(userRef, {
      lastActive: serverTimestamp()
    });
  }
};

export const upgradeSubscription = async (userId: string, plan: 'monthly' | 'yearly' | 'trial') => {
  const userRef = doc(db, 'users', userId);
  const now = new Date();
  
  if (plan === 'trial') {
    now.setDate(now.getDate() + 3);
    await updateDoc(userRef, {
      subscriptionStatus: 'trial',
      trialEndsAt: now
    });
  } else if (plan === 'monthly') {
    now.setDate(now.getDate() + 30);
    await updateDoc(userRef, {
      subscriptionStatus: 'premium',
      trialEndsAt: now // using this field as expiry too
    });
  } else if (plan === 'yearly') {
    now.setFullYear(now.getFullYear() + 1);
    await updateDoc(userRef, {
      subscriptionStatus: 'premium',
      trialEndsAt: now
    });
  }
};

// Connection test as required by instructions
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
