import React, { useState } from 'react';
import { Proposal, ProposalStatus, ProposalType, PaymentStatus } from '../types';
import { PROPOSAL_TYPE_LABELS, PAYMENT_STATUS_LABELS } from '../data/defaultTemplates';
import { getProposalPaymentSummary } from '../utils/storage';
import { exportProposalsToExcel } from '../utils/excelExport';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  FileText, 
  Eye, 
  Edit3, 
  Copy, 
  Trash2, 
  Share2, 
  MapPin, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MoreVertical,
  Download,
  Tag,
  BarChart3,
  TrendingUp,
  DollarSign,
  FileSpreadsheet,
  CreditCard,
  FolderCheck,
  CheckCircle,
  AlertCircle,
  Percent
} from 'lucide-react';

interface ProposalListProps {
  proposals: Proposal[];
  onSelect: (proposal: Proposal) => void;
  onEdit: (proposal: Proposal) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onNewProposal: () => void;
  onStatusChange: (id: string, newStatus: ProposalStatus) => void;
  onPaymentStatusChange?: (id: string, newPaymentStatus: PaymentStatus) => void;
  onOpenAnalytics?: () => void;
}

const STATUS_BADGES: Record<ProposalStatus, { label: string; color: string; icon: any }> = {
  taslak: { label: 'Taslak', color: 'bg-slate-100 text-slate-700 border-slate-300', icon: Clock },
  teklif_verildi: { label: 'Teklif Verildi', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
  onaylandi: { label: 'Kabul Edildi', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: CheckCircle2 },
  revize: { label: 'Revize Edildi', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Copy },
  iptal: { label: 'İptal Edildi', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
};

export const ProposalList: React.FC<ProposalListProps> = ({
  proposals,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  onNewProposal,
  onStatusChange,
  onPaymentStatusChange,
  onOpenAnalytics,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedPaymentFilter, setSelectedPaymentFilter] = useState<string>('all');

  // State for Financial View Mode (KDV Dahil vs KDV Hariç & Tüm Zamanlar vs Bu Ay)
  const [showNetWithoutVat, setShowNetWithoutVat] = useState(false);
  const [timePeriodMode, setTimePeriodMode] = useState<'all' | 'this_month'>('all');

  // Helper for Net & VAT
  const isWithoutVatProposal = (p: Proposal) => {
    return Boolean(
      p.pricing?.isWithoutVat || 
      p.pricing?.invoiceType === 'faturasiz' || 
      p.pricing?.vatRate === 0
    );
  };

  const getProposalBase = (p: Proposal) => {
    const sub = Number(p.pricing?.subtotal) || 0;
    const disc = Number(p.pricing?.discount) || 0;
    return Math.max(0, sub - disc);
  };

  const getProposalVat = (p: Proposal) => {
    if (isWithoutVatProposal(p)) return 0;
    const base = getProposalBase(p);
    const rate = Number(p.pricing?.vatRate) || 20;
    return Math.round((base * rate) / 100);
  };

  const getProposalTotal = (p: Proposal) => {
    if (p.pricing?.totalAmount) return Number(p.pricing.totalAmount);
    return getProposalBase(p) + getProposalVat(p);
  };

  // Current Month Key (e.g. "2026-08")
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthLabel = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });

  // 1. ALL ACCEPTED PROPOSALS (Kabul Edilenler)
  const acceptedProposals = proposals.filter((p) => p.status === 'onaylandi');
  const totalAcceptedWithVat = acceptedProposals.reduce((sum, p) => sum + getProposalTotal(p), 0);
  const totalAcceptedBase = acceptedProposals.reduce((sum, p) => sum + getProposalBase(p), 0);
  const totalAcceptedVat = acceptedProposals.reduce((sum, p) => sum + getProposalVat(p), 0);

  // 2. THIS MONTH ACCEPTED PROPOSALS (Bu Ay Kabul Edilenler)
  const thisMonthAcceptedProposals = acceptedProposals.filter((p) => {
    if (!p.createdAt) return false;
    const d = new Date(p.createdAt);
    if (isNaN(d.getTime())) return false;
    const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    return mKey === currentMonthKey;
  });

  const monthAcceptedWithVat = thisMonthAcceptedProposals.reduce((sum, p) => sum + getProposalTotal(p), 0);
  const monthAcceptedBase = thisMonthAcceptedProposals.reduce((sum, p) => sum + getProposalBase(p), 0);

  // 3. COLLECTIONS & RECEIVABLES (Sadece Kabul Edilen İşler Üzerinden Gerçek Alacak ve Tahsilat)
  let totalAcceptedPaid = 0;
  let totalAcceptedRemaining = 0; // KABUL EDİLENLERDEN BEKLEYEN ALACAK (GERÇEK ALACAK)
  let monthAcceptedPaid = 0;
  let monthAcceptedRemaining = 0;
  let fileReadyPendingPaymentCount = 0;
  let fileReadyPendingPaymentAmount = 0;

  acceptedProposals.forEach((p) => {
    const summary = getProposalPaymentSummary(p);
    totalAcceptedPaid += summary.totalPaid;
    totalAcceptedRemaining += summary.remaining;

    // Check if this proposal belongs to current month
    let isThisMonth = false;
    if (p.createdAt) {
      const d = new Date(p.createdAt);
      if (!isNaN(d.getTime())) {
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        isThisMonth = mKey === currentMonthKey;
      }
    }

    if (isThisMonth) {
      monthAcceptedPaid += summary.totalPaid;
      monthAcceptedRemaining += summary.remaining;
    }

    if (summary.paymentStatus === 'dosya_bitti_odeme_bekliyor' || summary.fileCompleted) {
      if (summary.remaining > 0) {
        fileReadyPendingPaymentCount += 1;
        fileReadyPendingPaymentAmount += summary.remaining;
      }
    }
  });

  // Active Display Numbers based on Period Mode
  const activeAcceptedWithVat = timePeriodMode === 'this_month' ? monthAcceptedWithVat : totalAcceptedWithVat;
  const activeAcceptedBase = timePeriodMode === 'this_month' ? monthAcceptedBase : totalAcceptedBase;
  const activeAcceptedCount = timePeriodMode === 'this_month' ? thisMonthAcceptedProposals.length : acceptedProposals.length;
  const activePaid = timePeriodMode === 'this_month' ? monthAcceptedPaid : totalAcceptedPaid;
  const activeRemaining = timePeriodMode === 'this_month' ? monthAcceptedRemaining : totalAcceptedRemaining;
  const activeRevenueDisplay = showNetWithoutVat ? activeAcceptedBase : activeAcceptedWithVat;
  const collectionPercentage = activeAcceptedWithVat > 0 ? Math.round((activePaid / activeAcceptedWithVat) * 100) : 0;

  // Potential Pipeline (Taslak & Görüşülen Teklifler)
  const pipelineProposals = proposals.filter((p) => p.status === 'taslak' || p.status === 'teklif_verildi' || p.status === 'revize');
  const pipelineTotalWithVat = pipelineProposals.reduce((sum, p) => sum + getProposalTotal(p), 0);
  const pipelineTotalBase = pipelineProposals.reduce((sum, p) => sum + getProposalBase(p), 0);

  // Filter proposals
  const filtered = proposals.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.proposalNumber.toLowerCase().includes(q) ||
      p.client.name.toLowerCase().includes(q) ||
      p.client.contactPerson.toLowerCase().includes(q) ||
      p.property.ada.toLowerCase().includes(q) ||
      p.property.parsel.toLowerCase().includes(q) ||
      p.property.district.toLowerCase().includes(q) ||
      p.property.city.toLowerCase().includes(q) ||
      p.property.fullAddress.toLowerCase().includes(q);

    const matchesType = selectedTypeFilter === 'all' || p.type === selectedTypeFilter;
    const matchesStatus = selectedStatusFilter === 'all' || p.status === selectedStatusFilter;
    
    const paymentSummary = getProposalPaymentSummary(p);
    const matchesPayment = selectedPaymentFilter === 'all' || paymentSummary.paymentStatus === selectedPaymentFilter;

    return matchesSearch && matchesType && matchesStatus && matchesPayment;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Financial Control & View Switcher Bar */}
      <div className="bg-slate-900 text-white p-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="p-2 bg-amber-500 text-slate-950 rounded-xl font-black text-xs">
            ₺
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span>Finans & Tahsilat Göstergeleri</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Canlı Bakiye
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Bekleyen alacak sadece <strong>kabul edilen ({acceptedProposals.length}) işin</strong> kalan bakiyesini gösterir.
            </div>
          </div>
        </div>

        {/* Period & VAT Toggle Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Period Toggle */}
          <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700 text-xs font-bold">
            <button
              onClick={() => setTimePeriodMode('all')}
              className={`px-3 py-1 rounded-lg transition ${
                timePeriodMode === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Tüm Zamanlar
            </button>
            <button
              onClick={() => setTimePeriodMode('this_month')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                timePeriodMode === 'this_month'
                  ? 'bg-amber-500 text-slate-950 font-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Bu Ay ({currentMonthLabel})</span>
            </button>
          </div>

          {/* KDV Toggle Button */}
          <button
            onClick={() => setShowNetWithoutVat(!showNetWithoutVat)}
            title={showNetWithoutVat ? 'KDV Dahil Gösterime Geç' : 'KDV Hariç Net Gösterime Geç'}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition border flex items-center gap-1.5 cursor-pointer ${
              showNetWithoutVat
                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>{showNetWithoutVat ? 'KDV Hariç (Net)' : 'KDV Dahil (Genel)'}</span>
          </button>
        </div>
      </div>

      {/* 4 Main KPI Cards: KABUL EDİLEN CİRO, TAHSİL EDİLEN (KASA), BEKLEYEN ALACAK, DOSYA BİTTİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. KABUL EDİLEN CİRO (TOPLAM İŞ HACMİ) */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 sm:p-5 rounded-2xl shadow-md border border-slate-800 flex flex-col justify-between relative overflow-hidden">
          <div className="h-1 bg-amber-400 absolute top-0 left-0 right-0" />
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
                {timePeriodMode === 'this_month' ? 'BU AY KABUL EDİLEN CİRO' : 'KABUL EDİLEN TOPLAM CİRO'}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                {activeAcceptedCount} Onaylı İş
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1">
              ₺{activeRevenueDisplay.toLocaleString('tr-TR')}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between font-medium">
              <span>{showNetWithoutVat ? 'KDV Hariç Net Bedel' : 'KDV Dahil Genel Toplam'}</span>
              <span className="text-amber-300 font-bold text-[10.5px]">
                {showNetWithoutVat ? `(KDV Dahil: ₺${activeAcceptedWithVat.toLocaleString('tr-TR')})` : `(Net: ₺${activeAcceptedBase.toLocaleString('tr-TR')})`}
              </span>
            </div>
          </div>
          
          <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10.5px] text-slate-400">
            <span>Potansiyel Teklif Havuzu:</span>
            <strong className="text-slate-200 font-mono">₺{(showNetWithoutVat ? pipelineTotalBase : pipelineTotalWithVat).toLocaleString('tr-TR')} ({pipelineProposals.length})</strong>
          </div>
        </div>

        {/* 2. TAHSİL EDİLEN (KASA GİRİŞİ) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between relative overflow-hidden">
          <div className="h-1 bg-emerald-500 absolute top-0 left-0 right-0" />
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-700">
                {timePeriodMode === 'this_month' ? 'BU AY TAHSİL EDİLEN (KASA)' : 'TAHSİL EDİLEN (KASA)'}
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1">
              ₺{activePaid.toLocaleString('tr-TR')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between font-medium">
              <span>Alınan peşinat ve ödemeler</span>
              <span className="font-bold text-emerald-700 text-[10.5px]">
                Tahsilat: %{collectionPercentage}
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500 font-medium">
            <span>{timePeriodMode === 'this_month' ? 'Tüm Zamanlar Tahsilat:' : 'Bu Ay Tahsil Edilen:'}</span>
            <strong className="text-slate-800 font-mono">
              ₺{(timePeriodMode === 'this_month' ? totalAcceptedPaid : monthAcceptedPaid).toLocaleString('tr-TR')}
            </strong>
          </div>
        </div>

        {/* 3. BEKLEYEN ALACAK (KABUL EDİLİP TAHSİL EDİLEMEYEN) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border-2 border-blue-200 flex flex-col justify-between relative overflow-hidden">
          <div className="h-1 bg-blue-600 absolute top-0 left-0 right-0" />
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-900">
                BEKLEYEN ALACAK
              </span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-blue-950 mt-1">
              ₺{activeRemaining.toLocaleString('tr-TR')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Kabul edilen işlerin kalan tahsilat bakiyesi
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-blue-100 flex items-center justify-between text-[10.5px] text-blue-900 font-semibold">
            <span>{timePeriodMode === 'this_month' ? 'Tüm Zamanlar Kalan Alacak:' : 'Bu Ay Kalan Alacak:'}</span>
            <strong className="font-mono text-slate-900">
              ₺{(timePeriodMode === 'this_month' ? totalAcceptedRemaining : monthAcceptedRemaining).toLocaleString('tr-TR')}
            </strong>
          </div>
        </div>

        {/* 4. DOSYA BİTTİ, ÖDEME BEKLİYOR ALERT CARD */}
        <div className={`p-4 sm:p-5 rounded-2xl shadow-sm border flex flex-col justify-between transition relative overflow-hidden ${
          fileReadyPendingPaymentCount > 0 
            ? 'bg-amber-50/90 border-amber-300 text-amber-950 ring-1 ring-amber-400' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {fileReadyPendingPaymentCount > 0 && <div className="h-1 bg-amber-500 absolute top-0 left-0 right-0" />}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-900 flex items-center gap-1">
                <FolderCheck className="w-3.5 h-3.5 text-amber-600" />
                DOSYA BİTTİ, ÖDEME BEKLİYOR
              </span>
              {fileReadyPendingPaymentCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black animate-pulse">
                  {fileReadyPendingPaymentCount} DOSYA
                </span>
              )}
            </div>
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-900 mt-1">
              ₺{fileReadyPendingPaymentAmount.toLocaleString('tr-TR')}
            </div>
            <div className="text-[11px] text-amber-800 font-medium mt-1">
              {fileReadyPendingPaymentCount > 0 ? 'Rapor/dosya hazır, son teslim ödemesi' : 'Bekleyen acil dosya yok'}
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex items-center justify-between text-[10.5px] text-amber-900 font-bold">
            <span>Toplam Teklif Sayısı:</span>
            <span className="text-slate-800 font-black">{proposals.length} Teklif</span>
          </div>
        </div>

      </div>

      {/* Monthly Revenue Analytics Banner */}
      {onOpenAnalytics && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 shadow-lg border border-emerald-800/50 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 w-full lg:w-auto">
            <div className="p-3 bg-emerald-500/20 text-emerald-300 rounded-2xl border border-emerald-500/30 shrink-0">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  AYLIK GELİR & İŞ RÖNTGENİ
                </span>
                <span className="text-xs text-emerald-200 font-medium">Ana Para, KDV ve Tahsilat Dağılımı</span>
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                <div>
                  Kabul Edilen Ciro: <span className="font-black text-white font-mono">₺{totalAcceptedWithVat.toLocaleString('tr-TR')}</span>
                  <span className="text-[11px] text-slate-400 ml-1">(Net: ₺{totalAcceptedBase.toLocaleString('tr-TR')})</span>
                </div>
                <div className="text-emerald-300 font-bold">
                  Tahsilat: <span className="font-mono">₺{totalAcceptedPaid.toLocaleString('tr-TR')}</span>
                </div>
                <div className="text-blue-300 font-bold">
                  Bekleyen Alacak: <span className="font-mono">₺{totalAcceptedRemaining.toLocaleString('tr-TR')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end">
            <button
              onClick={onNewProposal}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow transition flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>Yeni Teklif</span>
            </button>
            <button
              onClick={onOpenAnalytics}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0 cursor-pointer"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Aylık Gelir ve İş Analizini Aç</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ada / Parsel, Müşteri Adı, İlçe veya Teklif No..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        {/* Filters & Export */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto flex-wrap sm:flex-nowrap">
          {/* Ödeme Durumu Filtresi */}
          <select
            value={selectedPaymentFilter}
            onChange={(e) => setSelectedPaymentFilter(e.target.value)}
            className="px-3 py-2 bg-amber-50/70 border border-amber-300 rounded-xl text-xs font-bold text-amber-950 outline-none"
            title="Ödeme & Tahsilat Durumuna Göre Filtrele"
          >
            <option value="all">💳 Tüm Ödeme Durumları</option>
            <option value="odeme_bekliyor">⏳ Ödeme Bekliyor</option>
            <option value="ilk_taksit_odendi">🔹 1. Taksit Ödendi</option>
            <option value="ara_odeme_odendi">🔷 2. Taksit Ödendi</option>
            <option value="dosya_bitti_odeme_bekliyor">📁 Dosya Bitti, Ödeme Bekliyor</option>
            <option value="tamami_odendi">✅ Tamamı Ödendi</option>
          </select>

          {/* Teklif Durum Filtresi */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">Tüm Durumlar</option>
            <option value="taslak">Taslak</option>
            <option value="teklif_verildi">Teklif Verildi</option>
            <option value="onaylandi">Kabul Edildi</option>
            <option value="revize">Revize</option>
            <option value="iptal">İptal</option>
          </select>

          {/* Hizmet Türü Filtresi */}
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none hidden sm:inline-block"
          >
            <option value="all">Tüm Teklif Türleri</option>
            <option value="riskli_yapi">Riskli Yapı Tespiti</option>
            <option value="orta_katli_risk">Orta Katlı Yapı</option>
            <option value="performans_raporu">Performans Raporu</option>
            <option value="statik_guclendirme">Statik Güçlendirme</option>
          </select>

          {/* Toplu Excel İndirme Butonu */}
          <button
            onClick={() => exportProposalsToExcel(filtered.length > 0 ? filtered : proposals)}
            title="Tüm teklifleri veya filtrelenen listeyi Excel (.xlsx) olarak indir"
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm transition flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel İndir {filtered.length > 0 && `(${filtered.length})`}</span>
          </button>
        </div>

      </div>

      {/* Proposal Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Teklif Bulunamadı</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Arama veya ödeme filtresine uygun teklif bulunamadı.
          </p>
          <button
            onClick={onNewProposal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow transition inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            İlk Teklifinizi Oluşturun
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const typeInfo = PROPOSAL_TYPE_LABELS[item.type];
            const statusInfo = STATUS_BADGES[item.status] || STATUS_BADGES.taslak;
            const paymentSummary = getProposalPaymentSummary(item);
            const paymentInfo = PAYMENT_STATUS_LABELS[paymentSummary.paymentStatus] || PAYMENT_STATUS_LABELS.odeme_bekliyor;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                
                {/* Card Top */}
                <div className="p-5 space-y-3">
                  
                  {/* Header & Badges */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {item.proposalNumber}
                    </span>

                    {/* Status Dropdown Badge */}
                    <div className="relative">
                      <select
                        value={item.status}
                        onChange={(e) => onStatusChange(item.id, e.target.value as ProposalStatus)}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border outline-none cursor-pointer ${statusInfo.color}`}
                      >
                        <option value="taslak">Taslak</option>
                        <option value="teklif_verildi">Teklif Verildi</option>
                        <option value="onaylandi">Kabul Edildi</option>
                        <option value="revize">Revize</option>
                        <option value="iptal">İptal</option>
                      </select>
                    </div>
                  </div>

                  {/* Title & Client */}
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-amber-700 transition line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-600 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{item.client.name}</span>
                    </p>
                  </div>

                  {/* Ada / Parsel Highlight Pill */}
                  <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-950 font-bold">
                      <MapPin className="w-3.5 h-3.5 text-amber-700" />
                      <span>Ada: <strong className="font-mono text-slate-900">{item.property.ada || '-'}</strong></span>
                      <span className="mx-0.5">•</span>
                      <span>Parsel: <strong className="font-mono text-slate-900">{item.property.parsel || '-'}</strong></span>
                    </div>
                    <span className="text-[10px] text-amber-800 font-semibold truncate max-w-[100px]">
                      {item.property.district}
                    </span>
                  </div>

                  {/* ÖDEME & TAHSİLAT KONTROL ALANI (Önemli İstek) */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-slate-400" />
                        Ödeme Durumu
                      </span>

                      {/* Ödeme Durumu Seçicisi (Tek Tıkla Değiştir) */}
                      <select
                        value={paymentSummary.paymentStatus}
                        onChange={(e) => {
                          if (onPaymentStatusChange) {
                            onPaymentStatusChange(item.id, e.target.value as PaymentStatus);
                          }
                        }}
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border outline-none cursor-pointer transition ${paymentInfo.badgeColor}`}
                      >
                        <option value="odeme_bekliyor">⏳ Ödeme Bekliyor</option>
                        <option value="ilk_taksit_odendi">🔹 1. Taksit Ödendi</option>
                        <option value="ara_odeme_odendi">🔷 2. Taksit Ödendi</option>
                        <option value="dosya_bitti_odeme_bekliyor">📁 Dosya Bitti, Ödeme Bekliyor</option>
                        <option value="tamami_odendi">✅ Tamamı Ödendi</option>
                      </select>
                    </div>

                    {/* Progress Bar & Amount Numbers */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-700">
                          Tahsilat: ₺{paymentSummary.totalPaid.toLocaleString('tr-TR')}
                        </span>
                        <span className="font-semibold text-slate-500">
                          Kalan: <strong className="font-mono text-slate-800">₺{paymentSummary.remaining.toLocaleString('tr-TR')}</strong>
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            paymentSummary.paymentStatus === 'tamami_odendi' 
                              ? 'bg-emerald-500' 
                              : paymentSummary.paymentStatus === 'dosya_bitti_odeme_bekliyor'
                              ? 'bg-amber-500'
                              : paymentSummary.percentagePaid > 0
                              ? 'bg-blue-500'
                              : 'bg-slate-300'
                          }`}
                          style={{ width: `${Math.max(5, paymentSummary.percentagePaid)}%` }}
                        />
                      </div>
                    </div>

                    {/* Special Notice if File Ready & Pending Payment */}
                    {paymentSummary.paymentStatus === 'dosya_bitti_odeme_bekliyor' && (
                      <div className="text-[10px] font-bold text-amber-900 bg-amber-100/80 px-2 py-1 rounded-md border border-amber-300 flex items-center gap-1">
                        <FolderCheck className="w-3 h-3 text-amber-700 shrink-0" />
                        <span>Dosya hazırlandı, son ödeme bekleniyor.</span>
                      </div>
                    )}
                  </div>

                  {/* Property Details Pill */}
                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-1">
                    <span>Kat: <strong>{item.property.totalFloors || '-'} Kat</strong></span>
                    <span>•</span>
                    <span>Tipi: <strong>{item.property.buildingType}</strong></span>
                    <span>•</span>
                    <span>Tarih: {new Date(item.createdAt).toLocaleDateString('tr-TR')}</span>
                  </div>

                </div>

                {/* Card Bottom / Financial & Action Buttons */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">TOPLAM TUTAR</div>
                    <div className="text-base font-black font-mono text-slate-900">
                      {item.pricing.totalAmount.toLocaleString('tr-TR')} {item.pricing.currency}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelect(item)}
                      className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                      title="PDF Önizle & İndir"
                    >
                      <Eye className="w-4 h-4 text-amber-400" />
                      Önizle
                    </button>

                    <button
                      onClick={() => onEdit(item)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
                      title="Teklifi Düzenle"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDuplicate(item.id)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
                      title="Revizyon / Kopyasını Oluştur"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`${item.proposalNumber} numaralı teklifi silmek istediğinize emin misiniz?`)) {
                          onDelete(item.id);
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
