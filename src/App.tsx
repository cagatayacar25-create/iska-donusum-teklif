import React, { useState, useEffect } from 'react';
import { Proposal, CompanyProfile, ProposalType, ProposalStatus, PaymentStatus } from './types';
import { 
  getProposals, 
  saveProposal, 
  deleteProposal, 
  duplicateProposal, 
  getCompanyProfile, 
  saveCompanyProfile, 
  createEmptyProposal,
  getInitialMockProposals,
  saveProposals,
  sanitizeProposal
} from './utils/storage';

import { Header } from './components/Header';
import { ProposalList } from './components/ProposalList';
import { ProposalForm } from './components/ProposalForm';
import { ProposalPreviewModal } from './components/ProposalPreviewModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { QuickPriceCalculatorModal } from './components/QuickPriceCalculatorModal';
import { MonthlyAnalyticsModal } from './components/MonthlyAnalyticsModal';
import { PasswordLogin } from './components/PasswordLogin';
import { exportProposalsToExcel } from './utils/excelExport';
import { 
  testFirestoreConnection, 
  subscribeProposalsFromCloud, 
  subscribeCompanyProfileFromCloud,
  syncSaveProposalToCloud, 
  syncDeleteProposalFromCloud,
  syncBatchSaveProposalsToCloud,
  syncSaveCompanyProfileToCloud,
  fetchProposalsFromCloud,
  fetchCompanyProfileFromCloud
} from './firebase';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('iska_auth_session') === 'authenticated' ||
           sessionStorage.getItem('iska_auth_session') === 'authenticated';
  });

  const [proposals, setProposals] = useState<Proposal[]>(() => getProposals());
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => getCompanyProfile());
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'settings'>('list');
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  
  // Modals
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('iska_auth_session');
    sessionStorage.removeItem('iska_auth_session');
    setIsAuthenticated(false);
  };

  // =========================================================================
  // REAL-TIME FIRESTORE SUBSCRIPTIONS (Live updates across all devices)
  // =========================================================================
  useEffect(() => {
    // 1. Connection check
    testFirestoreConnection().then((connected) => {
      if (connected) {
        setIsCloudSynced(true);
      }
    });

    // 2. Real-time Listener for Company Profile
    const unsubCompany = subscribeCompanyProfileFromCloud((cloudProfile) => {
      if (cloudProfile && cloudProfile.name) {
        setCompanyProfile(cloudProfile);
        localStorage.setItem('bina_teklif_company_v1', JSON.stringify(cloudProfile));
      }
    });

    // If cloud profile is missing on first boot, sync local defaults up
    fetchCompanyProfileFromCloud().then((cloudProf) => {
      if (!cloudProf || !cloudProf.name) {
        const localProf = getCompanyProfile();
        syncSaveCompanyProfileToCloud(localProf).catch(() => {});
      }
    });

    // 3. Real-time Listener for Proposals (onSnapshot)
    const unsubProposals = subscribeProposalsFromCloud((cloudList, isSnapshotEmpty) => {
      if (!isSnapshotEmpty && cloudList.length > 0) {
        // Cloud has active proposals -> Cloud is the single real-time source of truth!
        const sanitizedList = cloudList.map(sanitizeProposal);
        setProposals(sanitizedList);
        saveProposals(sanitizedList);
        setIsCloudSynced(true);
      } else if (isSnapshotEmpty) {
        // Cloud collection is currently empty
        const cachedLocal = getProposals();
        if (cachedLocal.length > 0) {
          // Upload local proposals (e.g. user's 14 proposals) to Firestore so all devices can see them!
          syncBatchSaveProposalsToCloud(cachedLocal).then(() => {
            setIsCloudSynced(true);
          });
        } else {
          // Brand new installation with 0 items: seed initial mock proposals to Firestore
          const initialMocks = getInitialMockProposals();
          setProposals(initialMocks);
          saveProposals(initialMocks);
          syncBatchSaveProposalsToCloud(initialMocks).then(() => {
            setIsCloudSynced(true);
          });
        }
      }
    });

    return () => {
      unsubCompany();
      unsubProposals();
    };
  }, []);

  // Save Company Profile updates in Real-Time
  const handleSaveCompany = async (updated: CompanyProfile) => {
    setCompanyProfile(updated);
    saveCompanyProfile(updated);
    await syncSaveCompanyProfileToCloud(updated);
  };

  // Start creating a new proposal
  const handleNewProposal = (type: ProposalType = 'riskli_yapi') => {
    const fresh = createEmptyProposal(type);
    setCurrentProposal(fresh);
    setActiveTab('form');
  };

  // Start editing existing proposal
  const handleEditProposal = (p: Proposal) => {
    setCurrentProposal(p);
    setPreviewModalOpen(false);
    setActiveTab('form');
  };

  // Save proposal from form (Real-time Firestore push)
  const handleSaveProposal = async (updated: Proposal, previewAfterSave: boolean = false) => {
    const updatedProposal: Proposal = {
      ...updated,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic local state update
    setProposals((prev) => {
      const idx = prev.findIndex((p) => p.id === updatedProposal.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = updatedProposal;
        return next;
      }
      return [updatedProposal, ...prev];
    });

    // Save to Firestore (broadcasts immediately to all devices)
    saveProposal(updatedProposal);

    if (previewAfterSave) {
      setPreviewProposal(updatedProposal);
      setPreviewModalOpen(true);
    } else {
      setActiveTab('list');
    }
  };

  // Duplicate / Revise (Real-time Firestore push)
  const handleDuplicateProposal = (id: string) => {
    const copy = duplicateProposal(id);
    if (copy) {
      setProposals((prev) => [copy, ...prev]);
    }
  };

  // Delete (Real-time Firestore delete)
  const handleDeleteProposal = async (id: string) => {
    // Optimistic UI removal
    setProposals((prev) => prev.filter((p) => p.id !== id));
    deleteProposal(id);
  };

  // Quick Status change (Real-time Firestore update)
  const handleStatusChange = async (id: string, newStatus: ProposalStatus) => {
    const found = proposals.find((p) => p.id === id);
    if (found) {
      const updated: Proposal = { 
        ...found, 
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      saveProposal(updated);
    }
  };

  // Quick Payment Status change (Real-time Firestore update)
  const handlePaymentStatusChange = async (id: string, newPaymentStatus: PaymentStatus) => {
    const found = proposals.find((p) => p.id === id);
    if (found) {
      const isWithoutVat = Boolean(found.pricing?.isWithoutVat || found.pricing?.invoiceType === 'faturasiz' || found.pricing?.vatRate === 0);
      const subtotal = Math.max(0, (found.pricing?.subtotal || 0) - (found.pricing?.discount || 0));
      const totalAmount = isWithoutVat ? subtotal : Math.round(subtotal * (1 + (found.pricing?.vatRate || 20) / 100));
      const advRatio = (found.paymentTerms?.advanceRatio || 50) / 100;
      
      const updatedInstallments = (found.paymentTerms?.installments || []).map((inst, idx) => {
        if (newPaymentStatus === 'tamami_odendi') return { ...inst, isPaid: true };
        if (newPaymentStatus === 'odeme_bekliyor') return { ...inst, isPaid: false };
        if (newPaymentStatus === 'ilk_taksit_odendi') return { ...inst, isPaid: idx === 0 };
        if (newPaymentStatus === 'ara_odeme_odendi') return { ...inst, isPaid: idx <= 1 };
        if (newPaymentStatus === 'dosya_bitti_odeme_bekliyor') return { ...inst, isPaid: idx === 0 };
        return inst;
      });

      let newPaid = 0;
      if (updatedInstallments.length > 0) {
        newPaid = updatedInstallments.filter((i) => i.isPaid).reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      } else {
        if (newPaymentStatus === 'tamami_odendi') {
          newPaid = totalAmount;
        } else if (newPaymentStatus === 'ilk_taksit_odendi' || newPaymentStatus === 'dosya_bitti_odeme_bekliyor') {
          newPaid = Math.round(totalAmount * advRatio);
        } else if (newPaymentStatus === 'ara_odeme_odendi') {
          newPaid = Math.round(totalAmount * 0.75);
        }
      }

      const updated: Proposal = {
        ...found,
        paymentTerms: {
          ...found.paymentTerms,
          paymentStatus: newPaymentStatus,
          fileCompleted: newPaymentStatus === 'dosya_bitti_odeme_bekliyor' ? true : found.paymentTerms?.fileCompleted,
          totalPaidAmount: newPaid,
          remainingAmount: Math.max(0, totalAmount - newPaid),
          installments: updatedInstallments.length > 0 ? updatedInstallments : found.paymentTerms?.installments,
        },
        updatedAt: new Date().toISOString(),
      };

      setProposals((prev) => prev.map((p) => (p.id === id ? updated : p)));
      saveProposal(updated);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (p: Proposal) => {
    setPreviewProposal(p);
    setPreviewModalOpen(true);
  };

  // Apply quick calculated price from calculator modal
  const handleApplyCalculatedPrice = (price: number, type: ProposalType, notes: string) => {
    let target = currentProposal;
    if (!target || activeTab !== 'form') {
      target = createEmptyProposal(type);
    } else {
      target = { ...target, type };
    }

    target.pricing = {
      ...target.pricing,
      unitPrice: price,
      subtotal: price,
      totalAmount: Math.round(price * (1 + target.pricing.vatRate / 100)),
    };

    target.paymentTerms = {
      ...target.paymentTerms,
      customNotes: notes ? `${target.paymentTerms.customNotes} (${notes})` : target.paymentTerms.customNotes,
    };

    setCurrentProposal(target);
    setActiveTab('form');
  };

  // Backup Data Export JSON
  const handleExportData = () => {
    const data = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      companyProfile,
      proposals,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bina_Teklif_Yedek_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Backup Data Import JSON & Firestore Sync
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.proposals && Array.isArray(parsed.proposals)) {
            setProposals(parsed.proposals);
            saveProposals(parsed.proposals);
            await syncBatchSaveProposalsToCloud(parsed.proposals);
          }
          if (parsed.companyProfile) {
            setCompanyProfile(parsed.companyProfile);
            saveCompanyProfile(parsed.companyProfile);
            await syncSaveCompanyProfileToCloud(parsed.companyProfile);
          }
          alert('✅ Teklifler ve firma verileri başarıyla Firestore buluta ve uygulamaya yüklendi!');
        } catch (err) {
          alert('⚠️ Geçersiz yedek dosyası formatı!');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Manual Force-Refresh & Push/Pull from Cloud
  const handleRefreshCloud = async () => {
    try {
      const [cloudList, cloudProfile] = await Promise.all([
        fetchProposalsFromCloud(),
        fetchCompanyProfileFromCloud(),
      ]);

      if (cloudList && cloudList.length > 0) {
        setProposals(cloudList);
        saveProposals(cloudList);
      } else {
        // If cloud was empty, push local state to cloud
        const local = getProposals();
        if (local.length > 0) {
          await syncBatchSaveProposalsToCloud(local);
        }
      }

      if (cloudProfile && cloudProfile.name) {
        setCompanyProfile(cloudProfile);
        localStorage.setItem('bina_teklif_company_v1', JSON.stringify(cloudProfile));
      }

      setIsCloudSynced(true);
      alert(`✅ Canlı Bulut Bağlantısı Aktif!\n\nFirestore veritabanı ile tüm cihazlarınız anlık senkronizedir.\nToplam ${proposals.length} adet teklif canlı izlenmektedir.`);
    } catch (e: any) {
      console.warn('Manual cloud refresh error:', e);
      alert(`⚠️ Bulut Durumu: Çevrimdışı veya bağlantı bekleniyor.\n(${e?.message || 'Bağlantı hatası'})`);
    }
  };

  // If not authenticated, render Password Login screen
  if (!isAuthenticated) {
    return (
      <PasswordLogin
        onSuccess={() => setIsAuthenticated(true)}
        savedLogoUrl={companyProfile?.logoUrl}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'settings') {
            setSettingsOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onNewProposal={() => handleNewProposal('riskli_yapi')}
        onOpenCalculator={() => setCalculatorOpen(true)}
        onOpenAnalytics={() => setAnalyticsOpen(true)}
        companyName={companyProfile.name}
        proposalCount={proposals.length}
        onExportData={handleExportData}
        onImportData={handleImportData}
        onExportExcel={() => exportProposalsToExcel(proposals)}
        onLogout={handleLogout}
        isCloudSynced={isCloudSynced}
        onRefreshCloud={handleRefreshCloud}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'list' && (
          <ProposalList
            proposals={proposals}
            onSelect={handleOpenPreview}
            onEdit={handleEditProposal}
            onDuplicate={handleDuplicateProposal}
            onDelete={handleDeleteProposal}
            onNewProposal={() => handleNewProposal('riskli_yapi')}
            onStatusChange={handleStatusChange}
            onPaymentStatusChange={handlePaymentStatusChange}
            onOpenAnalytics={() => setAnalyticsOpen(true)}
          />
        )}

        {activeTab === 'form' && currentProposal && (
          <ProposalForm
            proposal={currentProposal}
            onSave={handleSaveProposal}
            onCancel={() => setActiveTab('list')}
            onOpenCalculator={() => setCalculatorOpen(true)}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center mt-12 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium text-slate-300">
            <span>Bina Risk Tespiti & Performans Raporu Teklif Uygulaması</span>
          </div>
          <div className="text-slate-500">
            6306 Kentsel Dönüşüm & TBDY 2018 Formatlarına Uygun PDF Hazırlayıcı
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProposalPreviewModal
        proposal={previewProposal}
        companyProfile={companyProfile}
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onEdit={(p) => handleEditProposal(p)}
      />

      <CompanySettingsModal
        companyProfile={companyProfile}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveCompany}
      />

      <QuickPriceCalculatorModal
        isOpen={calculatorOpen}
        onClose={() => setCalculatorOpen(false)}
        onApplyPrice={handleApplyCalculatedPrice}
      />

      <MonthlyAnalyticsModal
        proposals={proposals}
        isOpen={analyticsOpen}
        onClose={() => setAnalyticsOpen(false)}
      />

    </div>
  );
}
