import { Proposal, CompanyProfile } from '../types';
import { 
  db, 
  syncSaveProposalToCloud as firestoreSaveProposal, 
  syncDeleteProposalFromCloud as firestoreDeleteProposal,
  syncBatchSaveProposalsToCloud as firestoreBatchSaveProposals,
  syncSaveCompanyProfileToCloud as firestoreSaveCompanyProfile,
  fetchProposalsFromCloud as firestoreFetchProposals,
  fetchCompanyProfileFromCloud as firestoreFetchCompanyProfile,
  subscribeProposalsFromCloud as firestoreSubscribeProposals,
  subscribeCompanyProfileFromCloud as firestoreSubscribeCompanyProfile
} from '../firebase';
import { INITIAL_PROPOSALS } from '../data/defaultProposals';

// Universal Cloud Synchronization Engine
// Synchronizes data in real-time across all devices (Firebase Firestore + Unified State Management)

export class UniversalCloudSync {
  private static instance: UniversalCloudSync;
  private isConnected: boolean = false;
  private listeners: Array<(proposals: Proposal[]) => void> = [];
  private profileListeners: Array<(profile: CompanyProfile) => void> = [];

  private constructor() {
    this.initRealtime();
  }

  public static getInstance(): UniversalCloudSync {
    if (!UniversalCloudSync.instance) {
      UniversalCloudSync.instance = new UniversalCloudSync();
    }
    return UniversalCloudSync.instance;
  }

  private initRealtime() {
    try {
      // 1. Subscribe to real-time changes
      firestoreSubscribeProposals((cloudList, isSnapshotEmpty) => {
        if (!isSnapshotEmpty && cloudList.length > 0) {
          this.isConnected = true;
          this.notifyProposals(cloudList);
        } else if (isSnapshotEmpty) {
          // If Firestore is brand new/empty, seed the 14 standard proposals immediately!
          firestoreBatchSaveProposals(INITIAL_PROPOSALS).then(() => {
            this.isConnected = true;
            this.notifyProposals(INITIAL_PROPOSALS);
          });
        }
      });

      // 2. Subscribe to company profile
      firestoreSubscribeCompanyProfile((profile) => {
        if (profile && profile.name) {
          this.notifyProfile(profile);
        }
      });
    } catch (e) {
      console.warn('Cloud sync initialization notice:', e);
    }
  }

  public onProposalsUpdate(callback: (proposals: Proposal[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  public onProfileUpdate(callback: (profile: CompanyProfile) => void): () => void {
    this.profileListeners.push(callback);
    return () => {
      this.profileListeners = this.profileListeners.filter((l) => l !== callback);
    };
  }

  private notifyProposals(proposals: Proposal[]) {
    this.listeners.forEach((callback) => callback(proposals));
  }

  private notifyProfile(profile: CompanyProfile) {
    this.profileListeners.forEach((callback) => callback(profile));
  }

  public async saveProposal(proposal: Proposal): Promise<boolean> {
    return await firestoreSaveProposal(proposal);
  }

  public async deleteProposal(id: string): Promise<boolean> {
    return await firestoreDeleteProposal(id);
  }

  public async batchSaveProposals(proposals: Proposal[]): Promise<boolean> {
    return await firestoreBatchSaveProposals(proposals);
  }

  public async saveCompanyProfile(profile: CompanyProfile): Promise<boolean> {
    return await firestoreSaveCompanyProfile(profile);
  }

  public async forceFetchAll(): Promise<{ proposals: Proposal[] | null; profile: CompanyProfile | null }> {
    const [proposals, profile] = await Promise.all([
      firestoreFetchProposals(),
      firestoreFetchCompanyProfile(),
    ]);
    return { proposals, profile };
  }
}

export const cloudSync = UniversalCloudSync.getInstance();
