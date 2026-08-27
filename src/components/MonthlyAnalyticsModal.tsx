import React, { useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Proposal, ProposalType, ProposalStatus } from '../types';
import { PROPOSAL_TYPE_LABELS } from '../data/defaultTemplates';
import { exportProposalsToExcel } from '../utils/excelExport';
import { getProposalPaymentSummary } from '../utils/storage';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Building2, 
  Calendar, 
  X, 
  CheckCircle2, 
  Layers, 
  Filter,
  FileCheck2,
  PieChart,
  HelpCircle,
  FileSpreadsheet,
  Receipt,
  FileText,
  Percent,
  Clock,
  Wallet
} from 'lucide-react';

interface MonthlyAnalyticsModalProps {
  proposals: Proposal[];
  isOpen: boolean;
  onClose: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  onClose: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

// Error Boundary Component to prevent modal crashes from breaking the whole UI
class ModalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorMsg: ''
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, errorMsg: error?.message || 'Bilinmeyen bir hata oluştu.' };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MonthlyAnalyticsModal Error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <X className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Analiz Modülü Yüklenirken Hata Oluştu</h3>
            <p className="text-xs text-slate-600 font-mono bg-slate-100 p-2 rounded text-left overflow-x-auto">
              {this.state.errorMsg}
            </p>
            <button
              onClick={this.props.onClose}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl shadow hover:bg-slate-800 transition"
            >
              Kapat
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MonthlyAnalyticsContent: React.FC<MonthlyAnalyticsModalProps> = ({
  proposals = [],
  isOpen,
  onClose,
}) => {
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'YYYY-MM'
  const [selectedStatus, setSelectedStatus] = useState<string>('all'); // 'all', 'onaylandi', 'teklif_verildi'
  const [selectedInvoiceFilter, setSelectedInvoiceFilter] = useState<string>('all'); // 'all', 'faturali', 'faturasiz'

  // Safe helper to extract numbers
  const safeNumber = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val.replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Safe helper to extract integer floor count
  const safeFloors = (val: any): number => {
    if (typeof val === 'number') return isNaN(val) ? 0 : Math.floor(val);
    if (typeof val === 'string') {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Check if a proposal is without VAT (faturasız)
  const isWithoutVatProposal = (p: Proposal): boolean => {
    if (!p || !p.pricing) return false;
    return Boolean(
      p.pricing.isWithoutVat || 
      p.pricing.invoiceType === 'faturasiz' || 
      p.pricing.vatRate === 0
    );
  };

  // Calculate Base Amount (Ana Para / Net) for a single proposal
  const getProposalBaseAmount = (p: Proposal): number => {
    if (!p || !p.pricing) return 0;
    const subtotal = safeNumber(p.pricing.subtotal);
    const discount = safeNumber(p.pricing.discount);
    return Math.max(0, subtotal - discount);
  };

  // Calculate VAT Amount for a single proposal
  const getProposalVatAmount = (p: Proposal): number => {
    if (!p || !p.pricing) return 0;
    if (isWithoutVatProposal(p)) return 0;
    const base = getProposalBaseAmount(p);
    const vatRate = safeNumber(p.pricing.vatRate) || 20;
    return Math.round((base * vatRate) / 100);
  };

  // Calculate Grand Total for a single proposal
  const getProposalGrandTotal = (p: Proposal): number => {
    if (!p || !p.pricing) return 0;
    const directTotal = safeNumber(p.pricing.totalAmount);
    if (directTotal > 0) return directTotal;
    const base = getProposalBaseAmount(p);
    const vat = getProposalVatAmount(p);
    return base + vat;
  };

  // Safe format month label in Turkish
  const formatMonthLabel = (yyyyMm: string): string => {
    if (!yyyyMm || yyyyMm === 'all') return 'Tüm Zamanlar';
    if (typeof yyyyMm !== 'string' || !yyyyMm.includes('-')) return String(yyyyMm);
    const parts = yyyyMm.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return String(yyyyMm);
    try {
      const date = new Date(y, m - 1, 1);
      if (isNaN(date.getTime())) return String(yyyyMm);
      return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
    } catch {
      return String(yyyyMm);
    }
  };

  // Extract all available YYYY-MM options from proposals
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    if (Array.isArray(proposals)) {
      proposals.forEach((p) => {
        if (p?.createdAt) {
          try {
            const date = new Date(p.createdAt);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              if (!isNaN(year) && month !== 'NaN') {
                set.add(`${year}-${month}`);
              }
            }
          } catch {
            // ignore date parse errors
          }
        }
      });
    }
    return Array.from(set).sort().reverse();
  }, [proposals]);

  // Filter proposals based on selected month, status & invoice type
  const filteredProposals = useMemo(() => {
    if (!Array.isArray(proposals)) return [];
    return proposals.filter((p) => {
      if (!p) return false;

      // Month match
      let monthMatch = true;
      if (selectedMonth !== 'all') {
        if (!p.createdAt) {
          monthMatch = false;
        } else {
          try {
            const date = new Date(p.createdAt);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              monthMatch = `${year}-${month}` === selectedMonth;
            } else {
              monthMatch = false;
            }
          } catch {
            monthMatch = false;
          }
        }
      }

      // Status match
      let statusMatch = true;
      if (selectedStatus === 'onaylandi') {
        statusMatch = p.status === 'onaylandi';
      } else if (selectedStatus === 'teklif_verildi') {
        statusMatch = p.status === 'teklif_verildi' || p.status === 'onaylandi';
      } else if (selectedStatus !== 'all') {
        statusMatch = p.status === selectedStatus;
      }

      // Invoice filter match
      let invoiceMatch = true;
      const isFaturasiz = isWithoutVatProposal(p);
      if (selectedInvoiceFilter === 'faturali') {
        invoiceMatch = !isFaturasiz;
      } else if (selectedInvoiceFilter === 'faturasiz') {
        invoiceMatch = isFaturasiz;
      }

      return monthMatch && statusMatch && invoiceMatch;
    });
  }, [proposals, selectedMonth, selectedStatus, selectedInvoiceFilter]);

  // Compute breakdown for all 4 proposal types
  const breakdownByType = useMemo(() => {
    const allTypes: ProposalType[] = ['riskli_yapi', 'orta_katli_risk', 'performans_raporu', 'statik_guclendirme'];
    
    return allTypes.map((type) => {
      const typeProps = filteredProposals.filter((p) => p && p.type === type);
      const count = typeProps.length;
      
      const totalBaseAmount = typeProps.reduce((sum, p) => sum + getProposalBaseAmount(p), 0);
      const totalVatAmount = typeProps.reduce((sum, p) => sum + getProposalVatAmount(p), 0);
      const totalRevenueWithVat = typeProps.reduce((sum, p) => sum + getProposalGrandTotal(p), 0);
      const totalFloors = typeProps.reduce((sum, p) => sum + safeFloors(p?.property?.totalFloors), 0);
      const faturaliCount = typeProps.filter((p) => !isWithoutVatProposal(p)).length;
      const faturasizCount = typeProps.filter((p) => isWithoutVatProposal(p)).length;

      const typeInfo = PROPOSAL_TYPE_LABELS[type];
      const typeLabel = typeof typeInfo === 'string' ? typeInfo : (typeInfo?.name || type);

      return {
        type,
        label: typeLabel,
        count,
        faturaliCount,
        faturasizCount,
        totalBaseAmount,
        totalVatAmount,
        totalRevenueWithVat,
        totalFloors,
        avgPrice: count > 0 ? Math.round(totalRevenueWithVat / count) : 0,
      };
    });
  }, [filteredProposals]);

  // Overall Financial Aggregates
  const totalCount = filteredProposals.length;
  const grandTotalBaseAmount = filteredProposals.reduce((sum, p) => sum + getProposalBaseAmount(p), 0);
  const grandTotalVatAmount = filteredProposals.reduce((sum, p) => sum + getProposalVatAmount(p), 0);
  const grandTotalRevenue = filteredProposals.reduce((sum, p) => sum + getProposalGrandTotal(p), 0);
  const grandTotalPaid = filteredProposals.reduce((sum, p) => sum + getProposalPaymentSummary(p).totalPaid, 0);
  const grandTotalRemaining = filteredProposals.reduce((sum, p) => sum + getProposalPaymentSummary(p).remaining, 0);
  const grandCollectionPercentage = grandTotalRevenue > 0 ? Math.round((grandTotalPaid / grandTotalRevenue) * 100) : 0;
  const totalFloorsAll = filteredProposals.reduce((sum, p) => sum + safeFloors(p?.property?.totalFloors), 0);

  // Invoice Breakdown Stats
  const faturaliProposals = filteredProposals.filter((p) => !isWithoutVatProposal(p));
  const faturasizProposals = filteredProposals.filter((p) => isWithoutVatProposal(p));

  const faturaliBase = faturaliProposals.reduce((sum, p) => sum + getProposalBaseAmount(p), 0);
  const faturaliVat = faturaliProposals.reduce((sum, p) => sum + getProposalVatAmount(p), 0);
  const faturaliTotal = faturaliProposals.reduce((sum, p) => sum + getProposalGrandTotal(p), 0);

  const faturasizTotal = faturasizProposals.reduce((sum, p) => sum + getProposalBaseAmount(p), 0);

  // Grouping history month by month for the detailed table
  const monthlyHistory = useMemo(() => {
    const map = new Map<string, {
      monthKey: string;
      label: string;
      count: number;
      approvedCount: number;
      faturaliCount: number;
      faturasizCount: number;
      baseAmount: number;
      vatAmount: number;
      revenue: number;
      paidAmount: number;
      remainingAmount: number;
      riskliRev: number;
      ortaRev: number;
      perfRev: number;
      gucRev: number;
    }>();

    if (Array.isArray(proposals)) {
      proposals.forEach((p) => {
        if (!p || !p.createdAt) return;
        try {
          const date = new Date(p.createdAt);
          if (isNaN(date.getTime())) return;
          const year = date.getFullYear();
          const monthNum = date.getMonth() + 1;
          if (isNaN(year) || isNaN(monthNum)) return;
          const month = String(monthNum).padStart(2, '0');
          const monthKey = `${year}-${month}`;
          
          if (!map.has(monthKey)) {
            map.set(monthKey, {
              monthKey,
              label: formatMonthLabel(monthKey),
              count: 0,
              approvedCount: 0,
              faturaliCount: 0,
              faturasizCount: 0,
              baseAmount: 0,
              vatAmount: 0,
              revenue: 0,
              paidAmount: 0,
              remainingAmount: 0,
              riskliRev: 0,
              ortaRev: 0,
              perfRev: 0,
              gucRev: 0,
            });
          }

          const item = map.get(monthKey)!;

          // Status & Invoice Filter check
          let includeInAnalytics = true;
          if (selectedStatus === 'onaylandi' && p.status !== 'onaylandi') {
            includeInAnalytics = false;
          } else if (selectedStatus === 'teklif_verildi' && p.status !== 'onaylandi' && p.status !== 'teklif_verildi') {
            includeInAnalytics = false;
          }

          const isFaturasiz = isWithoutVatProposal(p);
          if (selectedInvoiceFilter === 'faturali' && isFaturasiz) {
            includeInAnalytics = false;
          } else if (selectedInvoiceFilter === 'faturasiz' && !isFaturasiz) {
            includeInAnalytics = false;
          }

          if (includeInAnalytics) {
            item.count += 1;
            if (p.status === 'onaylandi') item.approvedCount += 1;
            if (isFaturasiz) item.faturasizCount += 1;
            else item.faturaliCount += 1;

            const base = getProposalBaseAmount(p);
            const vat = getProposalVatAmount(p);
            const total = getProposalGrandTotal(p);
            const pSummary = getProposalPaymentSummary(p);

            item.baseAmount += base;
            item.vatAmount += vat;
            item.revenue += total;
            item.paidAmount += pSummary.totalPaid;
            item.remainingAmount += pSummary.remaining;

            if (p.type === 'riskli_yapi') item.riskliRev += total;
            else if (p.type === 'orta_katli_risk') item.ortaRev += total;
            else if (p.type === 'performans_raporu') item.perfRev += total;
            else if (p.type === 'statik_guclendirme') item.gucRev += total;
          }
        } catch {
          // ignore date format error
        }
      });
    }

    return Array.from(map.values())
      .filter((m) => m.count > 0)
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [proposals, selectedStatus, selectedInvoiceFilter]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Aylık Gelir, Ana Para ve KDV Analiz Paneli
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Ana Para (Net), KDV ve Faturalı / Faturasız Finansal Dağılım Raporu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-100/90 border-b border-slate-200 p-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Month Selector */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm w-full sm:w-auto">
              <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-slate-600">Dönem:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer pr-2"
              >
                <option value="all">Tüm Zamanlar ({proposals.length} Teklif)</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthLabel(m)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm w-full sm:w-auto">
              <Filter className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-600">Durum:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer pr-2"
              >
                <option value="all">Tüm Teklifler (Taslaklar Dahil)</option>
                <option value="onaylandi">Sadece Kabul Edilenler (Gerçekleşen Ciro)</option>
                <option value="teklif_verildi">Kabul Edilen + Teklif Verilenler</option>
              </select>
            </div>

            {/* Fatura Durumu Filtresi */}
            <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm w-full sm:w-auto">
              <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-slate-600">Fatura:</span>
              <select
                value={selectedInvoiceFilter}
                onChange={(e) => setSelectedInvoiceFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 outline-none cursor-pointer pr-2"
              >
                <option value="all">Tümü (Faturalı + Faturasız)</option>
                <option value="faturali">Sadece Faturalı (+%20 KDV)</option>
                <option value="faturasiz">Sadece Faturasız (%0 KDV Net)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
              Filtrelenen: <span className="text-slate-900 font-extrabold">{totalCount} İş</span>
            </div>

            <button
              onClick={() => exportProposalsToExcel(filteredProposals, 'ISKA_Aylik_Analiz_Teklifler')}
              title="Bu analize dahil olan teklifleri Excel formatında indir"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 shrink-0 active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Raporu</span>
            </button>
          </div>

        </div>

        {/* Modal Body Scrollable */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* Top 5 Financial KPI Cards (ANA PARA, KDV, GENEL CİRO, TAHSİL EDİLEN, BEKLEYEN ALACAK) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
            
            {/* 1. ANA PARA (NET CİRO) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-blue-200 flex flex-col justify-between relative overflow-hidden">
              <div className="h-1 bg-blue-600 absolute top-0 left-0 right-0" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold text-blue-900 uppercase tracking-wider block">
                    ANA PARA (KDV HARİÇ)
                  </span>
                  <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                    <DollarSign className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-blue-950 mt-1">
                  ₺{grandTotalBaseAmount.toLocaleString('tr-TR')}
                </div>
                <p className="text-[10.5px] text-slate-500 mt-1 font-medium">
                  KDV hariç net hizmet bedeli toplamı
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10.5px] text-slate-600 flex justify-between font-semibold">
                <span>Toplam İşlem:</span>
                <strong className="text-slate-900 font-bold">{totalCount} Adet</strong>
              </div>
            </div>

            {/* 2. KDV TUTARI */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-amber-200 flex flex-col justify-between relative overflow-hidden">
              <div className="h-1 bg-amber-500 absolute top-0 left-0 right-0" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold text-amber-900 uppercase tracking-wider block">
                    HESAPLANAN KDV
                  </span>
                  <span className="p-1.5 bg-amber-100 text-amber-800 rounded-lg">
                    <Percent className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-950 mt-1">
                  ₺{grandTotalVatAmount.toLocaleString('tr-TR')}
                </div>
                <p className="text-[10.5px] text-slate-500 mt-1 font-medium">
                  Faturalı tekliflerden hesaplanan KDV
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10.5px] text-slate-600 flex justify-between font-semibold">
                <span>Faturalı İş Sayısı:</span>
                <strong className="text-slate-900 font-bold">{faturaliProposals.length} Teklif</strong>
              </div>
            </div>

            {/* 3. GENEL TOPLAM CİRO */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-md border border-slate-800 flex flex-col justify-between relative overflow-hidden">
              <div className="h-1 bg-amber-400 absolute top-0 left-0 right-0" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">
                    GENEL TOPLAM CİRO
                  </span>
                  <span className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white mt-1">
                  ₺{grandTotalRevenue.toLocaleString('tr-TR')}
                </div>
                <p className="text-[10.5px] text-slate-300 mt-1 font-medium">
                  Ana Para + KDV toplam iş tutarı
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-700 text-[10.5px] text-slate-300 flex justify-between font-medium">
                <span>Ortalama İş Bedeli:</span>
                <strong className="text-white font-mono">₺{(totalCount > 0 ? Math.round(grandTotalRevenue / totalCount) : 0).toLocaleString('tr-TR')}</strong>
              </div>
            </div>

            {/* 4. TAHSİL EDİLEN (KASA) */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-emerald-200 flex flex-col justify-between relative overflow-hidden">
              <div className="h-1 bg-emerald-500 absolute top-0 left-0 right-0" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                    TAHSİL EDİLEN (KASA)
                  </span>
                  <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-1">
                  ₺{grandTotalPaid.toLocaleString('tr-TR')}
                </div>
                <p className="text-[10.5px] text-slate-500 mt-1 font-medium">
                  Kasaya giren peşinat ve ödemeler
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10.5px] text-emerald-800 flex justify-between font-bold">
                <span>Tahsilat Başarısı:</span>
                <strong className="text-emerald-700">%{grandCollectionPercentage}</strong>
              </div>
            </div>

            {/* 5. BEKLEYEN ALACAK */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border-2 border-blue-300 flex flex-col justify-between relative overflow-hidden">
              <div className="h-1 bg-blue-700 absolute top-0 left-0 right-0" />
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold text-blue-950 uppercase tracking-wider block">
                    BEKLEYEN ALACAK
                  </span>
                  <span className="p-1.5 bg-blue-100 text-blue-800 rounded-lg">
                    <Clock className="w-3.5 h-3.5" />
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-blue-950 mt-1">
                  ₺{grandTotalRemaining.toLocaleString('tr-TR')}
                </div>
                <p className="text-[10.5px] text-slate-500 mt-1 font-medium">
                  Kabul edilen işlerin kalan bakiyesi
                </p>
              </div>
              <div className="mt-2.5 pt-2 border-t border-slate-100 text-[10.5px] text-slate-600 flex justify-between font-semibold">
                <span>Fatura Dağılımı:</span>
                <span>{faturaliProposals.length} Fat. / {faturasizProposals.length} Fsz.</span>
              </div>
            </div>

          </div>

          {/* 4 Main Services Breakdown Section with ANA PARA and KDV Separation */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                Hizmet Türlerine Göre Ayrı Ayrı Ana Para ve KDV Dağılımı
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {breakdownByType.map((item) => {
                const percent = grandTotalRevenue > 0 ? Math.round((item.totalRevenueWithVat / grandTotalRevenue) * 100) : 0;
                
                let badgeBg = 'bg-blue-50 text-blue-900 border-blue-200';
                let accentColor = 'from-blue-600 to-indigo-700';

                if (item.type === 'orta_katli_risk') {
                  badgeBg = 'bg-emerald-50 text-emerald-900 border-emerald-200';
                  accentColor = 'from-emerald-600 to-teal-700';
                } else if (item.type === 'performans_raporu') {
                  badgeBg = 'bg-indigo-50 text-indigo-900 border-indigo-200';
                  accentColor = 'from-indigo-600 to-purple-800';
                } else if (item.type === 'statik_guclendirme') {
                  badgeBg = 'bg-purple-50 text-purple-900 border-purple-200';
                  accentColor = 'from-purple-600 to-pink-700';
                }

                return (
                  <div
                    key={item.type}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition relative overflow-hidden"
                  >
                    {/* Top Stripe */}
                    <div className={`h-1.5 absolute top-0 left-0 right-0 bg-gradient-to-r ${accentColor}`} />

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-lg border ${badgeBg} truncate max-w-[170px]`}>
                          {item.label}
                        </span>
                        <span className="text-[11px] font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md shrink-0">
                          %{percent} Pay
                        </span>
                      </div>

                      {/* Main Big Numbers */}
                      <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                        <div>
                          <div className="text-[10px] font-bold uppercase text-slate-500">Ana Para (KDV Hariç Net):</div>
                          <div className="text-lg font-black font-mono text-slate-900">
                            ₺{item.totalBaseAmount.toLocaleString('tr-TR')}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200">
                          <span className="text-slate-500 font-semibold">KDV Tutarı:</span>
                          <span className="font-mono font-bold text-amber-700">₺{item.totalVatAmount.toLocaleString('tr-TR')}</span>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-200 font-black text-emerald-950">
                          <span>Genel Toplam:</span>
                          <span className="font-mono text-sm">₺{item.totalRevenueWithVat.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>

                      {/* Job Count & Stats */}
                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">İş Adedi</div>
                          <div className="text-sm font-extrabold text-slate-900">{item.count} Teklif</div>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Fatura Dağılımı</div>
                          <div className="text-[11px] font-bold text-slate-700">
                            {item.faturaliCount} Fat. / {item.faturasizCount} Fsz.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>Ortalama İş:</span>
                        <span className="font-mono">₺{item.avgPrice.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${accentColor} transition-all duration-500`}
                          style={{ width: `${Math.max(percent, 3)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Historical Trend Table (With Ana Para, KDV, Ciro, Tahsilat & Alacak) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Aylara Göre Ana Para, KDV, Ciro, Tahsilat ve Bekleyen Alacak Tablosu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Her ay gerçekleşen işlerin fatura, ciro, tahsil edilen kasa girişi ve kalan alacak ayrımı
                </p>
              </div>
            </div>

            {monthlyHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Seçilen kriterlere uygun teklif verisi bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="p-3 rounded-l-xl">Dönem (Ay)</th>
                      <th className="p-3 text-center">Toplam / Onay</th>
                      <th className="p-3 text-center">Fatura Durumu</th>
                      <th className="p-3 text-right">Ana Para (Net)</th>
                      <th className="p-3 text-right">KDV</th>
                      <th className="p-3 text-right">Toplam Ciro</th>
                      <th className="p-3 text-right">Tahsil Edilen</th>
                      <th className="p-3 text-right">Bekleyen Alacak</th>
                      <th className="p-3 text-right rounded-r-xl">Tahsilat %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {monthlyHistory.map((row) => {
                      const rate = row.revenue > 0 ? Math.round((row.paidAmount / row.revenue) * 100) : 0;
                      return (
                        <tr key={row.monthKey} className="hover:bg-slate-50 transition">
                          <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {row.label}
                          </td>
                          <td className="p-3 text-center">
                            <span className="font-bold text-slate-900">{row.count} Teklif</span>
                            <span className="text-[10px] text-emerald-700 font-extrabold ml-1.5 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {row.approvedCount} Onay
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[11px] text-slate-600 font-semibold">
                              {row.faturaliCount > 0 && <span className="text-blue-700 font-bold">{row.faturaliCount} Fat.</span>}
                              {row.faturaliCount > 0 && row.faturasizCount > 0 && <span> / </span>}
                              {row.faturasizCount > 0 && <span className="text-amber-700 font-bold">{row.faturasizCount} Fsz.</span>}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-blue-950">
                            ₺{row.baseAmount.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            ₺{row.vatAmount.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-mono font-black text-slate-900">
                            ₺{row.revenue.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700 bg-emerald-50/50">
                            ₺{row.paidAmount.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-blue-900 bg-blue-50/50">
                            ₺{row.remainingAmount.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-bold">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                              rate >= 100 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : rate > 0 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              %{rate}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    {(() => {
                      const totalBase = monthlyHistory.reduce((s, h) => s + h.baseAmount, 0);
                      const totalVat = monthlyHistory.reduce((s, h) => s + h.vatAmount, 0);
                      const totalRev = monthlyHistory.reduce((s, h) => s + h.revenue, 0);
                      const totalPaid = monthlyHistory.reduce((s, h) => s + h.paidAmount, 0);
                      const totalRem = monthlyHistory.reduce((s, h) => s + h.remainingAmount, 0);
                      const totalRate = totalRev > 0 ? Math.round((totalPaid / totalRev) * 100) : 0;
                      return (
                        <tr className="bg-slate-100 font-extrabold text-slate-900 text-xs border-t-2 border-slate-300">
                          <td className="p-3">GENEL TOPLAM</td>
                          <td className="p-3 text-center">
                            {monthlyHistory.reduce((s, h) => s + h.count, 0)} İş ({monthlyHistory.reduce((s, h) => s + h.approvedCount, 0)} Onay)
                          </td>
                          <td className="p-3 text-center text-[11px] text-slate-600">
                            {monthlyHistory.reduce((s, h) => s + h.faturaliCount, 0)} Fat. / {monthlyHistory.reduce((s, h) => s + h.faturasizCount, 0)} Fsz.
                          </td>
                          <td className="p-3 text-right font-mono text-blue-950">
                            ₺{totalBase.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-mono text-amber-700">
                            ₺{totalVat.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-950">
                            ₺{totalRev.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-mono text-emerald-800 bg-emerald-100">
                            ₺{totalPaid.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-mono text-blue-950 bg-blue-100">
                            ₺{totalRem.toLocaleString('tr-TR')}
                          </td>
                          <td className="p-3 text-right font-mono text-slate-900">
                            %{totalRate}
                          </td>
                        </tr>
                      );
                    })()}
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-slate-300 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Teklifler anlık olarak Ana Para (Net) ve KDV tutarlarına göre analiz edilmektedir.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};

export const MonthlyAnalyticsModal: React.FC<MonthlyAnalyticsModalProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <ModalErrorBoundary onClose={props.onClose}>
      <MonthlyAnalyticsContent {...props} />
    </ModalErrorBoundary>
  );
};
