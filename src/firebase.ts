import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  getDoc,
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot
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
      console.warn('Firebase client is offline, using offline cache.');
    }
    return false;
  }
}

// Helper to sanitize payload for Firestore (removes undefined, circular properties)
export function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Standard Firestore Error handling helper
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
    },
  };
  console.warn('Firestore Operation Notice:', JSON.stringify(errInfo));
}

// ==========================================
// PROPOSALS REAL-TIME & CLOUD OPERATIONS
// ==========================================

/**
 * Saves or updates a single proposal in Firestore in real-time.
 */
export async function syncSaveProposalToCloud(proposal: Proposal): Promise<boolean> {
  const path = `proposals/${proposal.id}`;
  try {
    const docRef = doc(db, 'proposals', proposal.id);
    const cleanData = cleanForFirestore(proposal);
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

/**
 * Deletes a proposal from Firestore in real-time.
 */
export async function syncDeleteProposalFromCloud(id: string): Promise<boolean> {
  const path = `proposals/${id}`;
  try {
    const docRef = doc(db, 'proposals', id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
    return false;
  }
}

/**
 * Batch saves multiple proposals to Firestore (useful for initial migration & sync).
 */
export async function syncBatchSaveProposalsToCloud(proposals: Proposal[]): Promise<boolean> {
  try {
    await Promise.all(
      proposals.map((p) => {
        const docRef = doc(db, 'proposals', p.id);
        return setDoc(docRef, cleanForFirestore(p), { merge: true });
      })
    );
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'proposals');
    return false;
  }
}

/**
 * One-time fetch of proposals from Firestore.
 */
export async function fetchProposalsFromCloud(): Promise<Proposal[] | null> {
  const path = 'proposals';
  try {
    const colRef = collection(db, path);
    const snapshot = await getDocs(colRef);
    if (snapshot.empty) return [];
    
    const list: Proposal[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Proposal;
      if (data && data.id) {
        list.push(data);
      }
    });

    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
    return null;
  }
}

/**
 * REAL-TIME Listener for proposals collection using onSnapshot.
 * Triggers callback instantly across all connected devices when any document is added, updated, or removed.
 */
export function subscribeProposalsFromCloud(
  callback: (proposals: Proposal[], isSnapshotEmpty: boolean) => void
): () => void {
  const pathForOnSnapshot = 'proposals';
  try {
    const colRef = collection(db, pathForOnSnapshot);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: Proposal[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Proposal;
          if (data && data.id) {
            list.push(data);
          }
        });
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        callback(list, snapshot.empty);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, pathForOnSnapshot);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, pathForOnSnapshot);
    return () => {};
  }
}

// ==========================================
// COMPANY PROFILE REAL-TIME & CLOUD OPERATIONS
// ==========================================

/**
 * Saves company profile in Firestore.
 */
export async function syncSaveCompanyProfileToCloud(profile: CompanyProfile): Promise<boolean> {
  const path = 'settings/companyProfile';
  try {
    const docRef = doc(db, 'settings', 'companyProfile');
    const cleanData = cleanForFirestore(profile);
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
    return false;
  }
}

/**
 * One-time fetch of company profile from Firestore.
 */
export async function fetchCompanyProfileFromCloud(): Promise<CompanyProfile | null> {
  const path = 'settings/companyProfile';
  try {
    const docRef = doc(db, 'settings', 'companyProfile');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CompanyProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * REAL-TIME Listener for Company Profile.
 */
export function subscribeCompanyProfileFromCloud(
  callback: (profile: CompanyProfile) => void
): () => void {
  const path = 'settings/companyProfile';
  try {
    const docRef = doc(db, 'settings', 'companyProfile');
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as CompanyProfile);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, path);
      }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return () => {};
  }
}
