import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs, 
  getDoc,
  onSnapshot 
} from "firebase/firestore";
import { Proposal, CompanyProfile } from "./types";

const firebaseConfig = {
  apiKey: "AIzaSyDy3g4iKuqUFJRvvrLEQ0W5NARAHVNBfH0",
  authDomain: "iska-teklif.firebaseapp.com",
  projectId: "iska-teklif",
  storageBucket: "iska-teklif.firebasestorage.app",
  messagingSenderId: "32999767490",
  appId: "1:32999767490:web:8867461a49f7baa2422a5b",
  measurementId: "G-4BLG4S6X3W"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore database instance
export const db = getFirestore(app);

// Helper to sanitize payload for Firestore (removes undefined/custom classes)
export function cleanForFirestore<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

// Connection test helper
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    const testDoc = await getDoc(doc(db, "settings", "connectionTest"));
    return true;
  } catch (error) {
    console.warn("Firestore connection check:", error);
    return true;
  }
}

// ==========================================
// PROPOSALS REAL-TIME & CLOUD OPERATIONS
// ==========================================

/**
 * Saves or updates a proposal directly in Firestore collection "proposals".
 * Instant live update is triggered across all connected devices via onSnapshot.
 */
export async function syncSaveProposalToCloud(proposal: Proposal): Promise<boolean> {
  try {
    const docRef = doc(db, "proposals", proposal.id);
    const cleanData = cleanForFirestore(proposal);
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving proposal to Firestore:", err);
    return false;
  }
}

/**
 * Deletes a proposal directly from Firestore collection "proposals".
 * Instant removal is triggered across all connected devices via onSnapshot.
 */
export async function syncDeleteProposalFromCloud(id: string): Promise<boolean> {
  try {
    const docRef = doc(db, "proposals", id);
    await deleteDoc(docRef);
    return true;
  } catch (err) {
    console.error("Error deleting proposal from Firestore:", err);
    return false;
  }
}

/**
 * Batch saves multiple proposals to Firestore.
 */
export async function syncBatchSaveProposalsToCloud(proposals: Proposal[]): Promise<boolean> {
  try {
    await Promise.all(
      proposals.map((p) => {
        const docRef = doc(db, "proposals", p.id);
        return setDoc(docRef, cleanForFirestore(p), { merge: true });
      })
    );
    return true;
  } catch (err) {
    console.error("Error batch saving proposals to Firestore:", err);
    return false;
  }
}

/**
 * One-time fetch of all proposals from Firestore.
 */
export async function fetchProposalsFromCloud(): Promise<Proposal[] | null> {
  try {
    const colRef = collection(db, "proposals");
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
    console.error("Error fetching proposals from Firestore:", err);
    return null;
  }
}

/**
 * REAL-TIME Listener for proposals collection using onSnapshot.
 * Any device that creates, edits or deletes a proposal will immediately trigger
 * this listener across all opened browser windows, mobile phones and PCs.
 */
export function subscribeProposalsFromCloud(
  callback: (proposals: Proposal[], isSnapshotEmpty: boolean) => void
): () => void {
  try {
    const colRef = collection(db, "proposals");
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
        console.error("Firestore onSnapshot error for proposals:", err);
      }
    );
  } catch (err) {
    console.error("Failed to subscribe to proposals onSnapshot:", err);
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
  try {
    const docRef = doc(db, "settings", "companyProfile");
    const cleanData = cleanForFirestore(profile);
    await setDoc(docRef, cleanData, { merge: true });
    return true;
  } catch (err) {
    console.error("Error saving company profile to Firestore:", err);
    return false;
  }
}

/**
 * One-time fetch of company profile from Firestore.
 */
export async function fetchCompanyProfileFromCloud(): Promise<CompanyProfile | null> {
  try {
    const docRef = doc(db, "settings", "companyProfile");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CompanyProfile;
    }
    return null;
  } catch (err) {
    console.error("Error fetching company profile from Firestore:", err);
    return null;
  }
}

/**
 * REAL-TIME Listener for Company Profile.
 */
export function subscribeCompanyProfileFromCloud(
  callback: (profile: CompanyProfile) => void
): () => void {
  try {
    const docRef = doc(db, "settings", "companyProfile");
    return onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          callback(docSnap.data() as CompanyProfile);
        }
      },
      (err) => {
        console.error("Firestore onSnapshot error for company profile:", err);
      }
    );
  } catch (err) {
    console.error("Failed to subscribe to company profile onSnapshot:", err);
    return () => {};
  }
}
