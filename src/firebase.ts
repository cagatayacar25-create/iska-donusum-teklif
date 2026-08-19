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
export async function syncSaveProposalToCloud(proposal: Proposal): Promise<void> {
  try {
    const docRef = doc(db, 'proposals', proposal.id);
    await setDoc(docRef, proposal, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `proposals/${proposal.id}`);
  }
}

export async function syncDeleteProposalFromCloud(id: string): Promise<void> {
  try {
    const docRef = doc(db, 'proposals', id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `proposals/${id}`);
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

// Company Profile Database Helpers
export async function syncSaveCompanyProfileToCloud(profile: CompanyProfile): Promise<void> {
  try {
    const docRef = doc(db, 'settings', 'companyProfile');
    await setDoc(docRef, profile, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'settings/companyProfile');
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
