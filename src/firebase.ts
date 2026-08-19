import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Proposal, CompanyProfile } from './types';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore with firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test helper
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, using offline cache / localStorage.');
    }
    return false;
  }
}

// Helper to sanitize payload for Firestore (removes any undefined properties)
function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Error handling helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

// Proposals Database Helpers
export async function syncSaveProposalToCloud(proposal: Proposal): Promise<boolean> {
  try {
    const docRef = doc(db, 'proposals', proposal.id);
    const cleanData = cleanForFirestore(proposal);
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `proposals/${proposal.id}`);
    return false;
  }
}

export async function syncDeleteProposalFromCloud(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, 'proposals', id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `proposals/${id}`);
    return false;
  }
}

export async function fetchProposalsFromCloud(): Promise<Proposal[] | null> {
  try {
    const colRef = collection(db, 'proposals');
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    
    const list: Proposal[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Proposal);
    });

    // Sort by createdAt descending
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'proposals');
    return null;
  }
}

export function subscribeProposalsFromCloud(callback: (proposals: Proposal[]) => void): () => void {
  try {
    const colRef = collection(db, 'proposals');
    return onSnapshot(colRef, (snapshot) => {
      const list: Proposal[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Proposal);
      });
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      callback(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'proposals');
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'proposals');
    return () => {};
  }
}

// Merge local and cloud proposals without losing any records
export function mergeProposals(localList: Proposal[], cloudList: Proposal[]): Proposal[] {
  const map = new Map<string, Proposal>();

  // Add all local proposals
  localList.forEach((p) => {
    if (p && p.id) {
      map.set(p.id, p);
    }
  });

  // Merge cloud proposals (taking whichever has newer updatedAt/createdAt)
  cloudList.forEach((p) => {
    if (p && p.id) {
      const existing = map.get(p.id);
      if (!existing) {
        map.set(p.id, p);
      } else {
        const localTime = new Date(existing.updatedAt || existing.createdAt).getTime();
        const cloudTime = new Date(p.updatedAt || p.createdAt).getTime();
        if (cloudTime >= localTime) {
          map.set(p.id, p);
        }
      }
    }
  });

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// Company Profile Database Helpers
export async function syncSaveCompanyProfileToCloud(profile: CompanyProfile): Promise<boolean> {
  try {
    const docRef = doc(db, 'settings', 'companyProfile');
    const cleanData = cleanForFirestore(profile);
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/companyProfile');
    return false;
  }
}

export async function fetchCompanyProfileFromCloud(): Promise<CompanyProfile | null> {
  try {
    const docRef = doc(db, 'settings', 'companyProfile');
    const docSnap = await getDocFromServer(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CompanyProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'settings/companyProfile');
    return null;
  }
}
