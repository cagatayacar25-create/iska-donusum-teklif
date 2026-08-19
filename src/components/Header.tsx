import React from 'react';
import { 
  FileText, 
  PlusCircle, 
  Building2, 
  Settings, 
  Download, 
  Upload, 
  Calculator,
  Search,
  Menu,
  X,
  BarChart3,
  Lock,
  FileSpreadsheet,
  Cloud,
  CloudCheck
} from 'lucide-react';
import { ISKA_LOGO_DATA_URL } from '../assets/iskaLogo';

interface HeaderProps {
  activeTab: 'list' | 'form' | 'settings';
  setActiveTab: (tab: 'list' | 'form' | 'settings') => void;
  onNewProposal: () => void;
  onOpenCalculator: () => void;
  onOpenAnalytics?: () => void;
  onLogout?: () => void;
  companyName: string;
  proposalCount: number;
  onExportData: () => void;
  onImportData: () => void;
  onExportExcel?: () => void;
  isCloudSynced?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewProposal,
  onOpenCalculator,
  onOpenAnalytics,
  onLogout,
  companyName,
  proposalCount,
  onExportData,
  onImportData,
  onExportExcel,
  isCloudSynced = true,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-30 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveTab('list')}
              className="flex items-center gap-3 text-left group transition"
            >
              <div className="h-10 px-2.5 rounded-xl bg-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform border border-slate-700 shrink-0">
                <img src={ISKA_LOGO_DATA_URL} alt="İSKA Logo" className="h-7 w-auto object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-extrabold text-slate-100 tracking-tight leading-none group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                    <span>Riskli Bina & Performans Teklifi</span>
                    <img src={ISKA_LOGO_DATA_URL} alt="İSKA" className="h-4 sm:h-5 w-auto inline-block bg-white px-1 py-0.5 rounded shadow-sm border border-slate-700" />
                  </h1>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[200px] sm:max-w-xs font-medium">
                  {companyName || 'İSKA Dönüşüm Yapı Laboratuvarı'}
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                activeTab === 'list' 
                  ? 'bg-amber-500 text-slate-950 shadow' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              Tekliflerim
              <span className="ml-1 bg-slate-950/20 text-xs px-2 py-0.5 rounded-full font-semibold">
                {proposalCount}
              </span>
            </button>

            <button
              onClick={onNewProposal}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Hızlı Teklif Oluştur
            </button>

            <button
              onClick={onOpenCalculator}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition flex items-center gap-1.5"
              title="Saha Fiyat Hesaplama Robotu"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              <span className="hidden lg:inline">Hesaplama Robotu</span>
            </button>

            {onOpenAnalytics && (
              <button
                onClick={onOpenAnalytics}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-emerald-400 hover:bg-slate-800 hover:text-emerald-300 transition flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/80 shadow-sm"
                title="Aylık Ciro ve İş Analizi"
              >
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span className="hidden lg:inline">Aylık Ciro & Analiz</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('settings')}
              className={`p-2 rounded-lg transition ${
                activeTab === 'settings' 
                  ? 'bg-slate-800 text-amber-400' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
              title="Firma & Başlık Ayarları"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Cloud Status Indicator */}
            <div 
              className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isCloudSynced 
                  ? 'bg-emerald-950/50 border-emerald-800/60 text-emerald-300' 
                  : 'bg-amber-950/50 border-amber-800/60 text-amber-300'
              }`}
              title={isCloudSynced ? 'Firebase Firestore Bulut Veritabanı Aktif ve Senkronize' : 'Bulut Veritabanına Bağlanıyor...'}
            >
              <Cloud className={`w-3.5 h-3.5 ${isCloudSynced ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
              <span>{isCloudSynced ? 'Bulut Aktif' : 'Bulut Beklemede'}</span>
            </div>

            <div className="h-5 w-px bg-slate-800 my-auto mx-1" />

            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition"
                title="Tüm Teklifleri Excel Olarak İndir (.xlsx)"
              >
                <FileSpreadsheet className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={onExportData}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              title="Verileri Yedekle (JSON İndir)"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onImportData}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              title="Yedek Yükle (JSON)"
            >
              <Upload className="w-4 h-4" />
            </button>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-red-400/80 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                title="Sistemden Çıkış Yap / Kilitle"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onNewProposal}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white shadow transition flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Teklif Ekle
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-2 animate-in slide-in-from-top duration-200">
          <button
            onClick={() => {
              setActiveTab('list');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-between ${
              activeTab === 'list' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Teklif Listesi
            </div>
            <span className="bg-slate-950/20 px-2 py-0.5 rounded-full text-xs">
              {proposalCount}
            </span>
          </button>

          <button
            onClick={() => {
              onNewProposal();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 hover:bg-slate-800 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Yeni Teklif Oluştur
          </button>

          {onOpenAnalytics && (
            <button
              onClick={() => {
                onOpenAnalytics();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold text-emerald-300 hover:bg-slate-800 flex items-center gap-2 bg-emerald-950/40 border border-emerald-800/60"
            >
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              Aylık Gelir ve İş Analizi
            </button>
          )}

          <button
            onClick={() => {
              onOpenCalculator();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:bg-slate-800 flex items-center gap-2"
          >
            <Calculator className="w-4 h-4" />
            Fiyat Hesaplama Robotu
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 ${
              activeTab === 'settings' ? 'bg-slate-800 text-amber-400' : 'text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            Firma & Başlık Ayarları
          </button>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-around text-xs text-slate-400">
            {onExportExcel && (
              <button 
                onClick={() => {
                  onExportExcel();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 py-1 font-semibold"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel İndir
              </button>
            )}
            <button 
              onClick={() => {
                onExportData();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1 hover:text-white py-1"
            >
              <Download className="w-3.5 h-3.5" />
              Yedekle
            </button>
            <button 
              onClick={() => {
                onImportData();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1 hover:text-white py-1"
            >
              <Upload className="w-3.5 h-3.5" />
              Yedek Yükle
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
