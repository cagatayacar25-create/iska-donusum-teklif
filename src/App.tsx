import React, { useState, useEffect } from 'react';
import { Proposal, CompanyProfile, ProposalType, ProposalStatus } from './types';
import { 
  getProposals, 
  saveProposal, 
  deleteProposal, 
  duplicateProposal, 
  getCompanyProfile, 
  saveCompanyProfile, 
  createEmptyProposal 
} from './utils/storage';

import { Header } from './components/Header';
import { ProposalList } from './components/ProposalList';
import { ProposalForm } from './components/ProposalForm';
import { ProposalPreviewModal } from './components/ProposalPreviewModal';
import { CompanySettingsModal } from './components/CompanySettingsModal';
import { QuickPriceCalculatorModal } from './components/QuickPriceCalculatorModal';
import { MonthlyAnalyticsModal } from './components/MonthlyAnalyticsModal';
import { PasswordLogin } from './components/PasswordLogin';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('iska_auth_session') === 'authenticated' ||
           sessionStorage.getItem('iska_auth_session') === 'authenticated';
  });

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(getCompanyProfile());
  const [activeTab, setActiveTab] = useState<'list' | 'form' | 'settings'>('list');
  const [currentProposal, setCurrentProposal] = useState<Proposal | null>(null);
  
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

  // If not authenticated, render Password Login screen
  if (!isAuthenticated) {
    return (
      <PasswordLogin
        onSuccess={() => setIsAuthenticated(true)}
        savedLogoUrl={companyProfile?.logoUrl}
      />
    );
  }

  // Load initial proposals from localStorage
  useEffect(() => {
    const loaded = getProposals();
    setProposals(loaded);
  }, []);

  // Save Company Profile updates
  const handleSaveCompany = (updated: CompanyProfile) => {
    saveCompanyProfile(updated);
    setCompanyProfile(updated);
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

  // Save proposal from form
  const handleSaveProposal = (updated: Proposal, previewAfterSave: boolean = false) => {
    saveProposal(updated);
    const updatedList = getProposals();
    setProposals(updatedList);

    if (previewAfterSave) {
      setPreviewProposal(updated);
      setPreviewModalOpen(true);
    } else {
      setActiveTab('list');
    }
  };

  // Duplicate / Revise
  const handleDuplicateProposal = (id: string) => {
    const copy = duplicateProposal(id);
    if (copy) {
      const updatedList = getProposals();
      setProposals(updatedList);
    }
  };

  // Delete
  const handleDeleteProposal = (id: string) => {
    deleteProposal(id);
    setProposals(getProposals());
  };

  // Quick Status change
  const handleStatusChange = (id: string, newStatus: ProposalStatus) => {
    const found = proposals.find((p) => p.id === id);
    if (found) {
      const updated = { ...found, status: newStatus };
      saveProposal(updated);
      setProposals(getProposals());
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
      version: '1.0',
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

  // Backup Data Import JSON
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.proposals && Array.isArray(parsed.proposals)) {
            localStorage.setItem('bina_teklif_proposals_v1', JSON.stringify(parsed.proposals));
            setProposals(parsed.proposals);
          }
          if (parsed.companyProfile) {
            saveCompanyProfile(parsed.companyProfile);
            setCompanyProfile(parsed.companyProfile);
          }
          alert('Teklifler ve firma verileri başarıyla yüklendi!');
        } catch (err) {
          alert('Geçersiz yedek dosyası formatı!');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

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
        onLogout={handleLogout}
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
