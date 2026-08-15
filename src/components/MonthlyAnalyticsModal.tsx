import React, { useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { Proposal, ProposalType, ProposalStatus } from '../types';
import { PROPOSAL_TYPE_LABELS } from '../data/defaultTemplates';
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
  HelpCircle
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

  if (!isOpen) return null;

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

  // Filter proposals based on selected month & status
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

      return monthMatch && statusMatch;
    });
  }, [proposals, selectedMonth, selectedStatus]);

  // Compute breakdown for the 3 proposal types
  const breakdownByType = useMemo(() => {
    const types: ProposalType[] = ['riskli_yapi', 'orta_katli_risk', 'performans_raporu'];
    
    return types.map((type) => {
      const typeProps = filteredProposals.filter((p) => p && p.type === type);
      const count = typeProps.length;
      
      const totalRevenueWithVat = typeProps.reduce((sum, p) => sum + safeNumber(p?.pricing?.totalAmount), 0);
      const totalSubtotalNoVat = typeProps.reduce((sum, p) => sum + (safeNumber(p?.pricing?.subtotal) - safeNumber(p?.pricing?.discount)), 0);
      const totalFloors = typeProps.reduce((sum, p) => sum + safeFloors(p?.property?.totalFloors), 0);

      const typeInfo = PROPOSAL_TYPE_LABELS[type];
      const typeLabel = typeof typeInfo === 'string' ? typeInfo : (typeInfo?.name || type);

      return {
        type,
        label: typeLabel,
        count,
        totalRevenueWithVat,
        totalSubtotalNoVat,
        totalFloors,
        avgPrice: count > 0 ? Math.round(totalRevenueWithVat / count) : 0,
      };
    });
  }, [filteredProposals]);

  // Grand totals
  const totalCount = filteredProposals.length;
  const grandTotalRevenue = filteredProposals.reduce((sum, p) => sum + safeNumber(p?.pricing?.totalAmount), 0);
  const grandTotalNoVat = filteredProposals.reduce((sum, p) => sum + (safeNumber(p?.pricing?.subtotal) - safeNumber(p?.pricing?.discount)), 0);
  const totalFloorsAll = filteredProposals.reduce((sum, p) => sum + safeFloors(p?.property?.totalFloors), 0);

  // Grouping history month by month for the detailed table
  const monthlyHistory = useMemo(() => {
    const map = new Map<string, {
      monthKey: string;
      label: string;
      count: number;
      approvedCount: number;
      revenue: number;
      riskliCount: number;
      riskliRev: number;
      ortaCount: number;
      ortaRev: number;
      perfCount: number;
      perfRev: number;
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
              revenue: 0,
              riskliCount: 0,
              riskliRev: 0,
              ortaCount: 0,
              ortaRev: 0,
              perfCount: 0,
              perfRev: 0,
            });
          }

          const item = map.get(monthKey)!;
          item.count += 1;
          
          const rev = safeNumber(p?.pricing?.totalAmount);

          // Filter check based on selected status
          let includeRev = false;
          if (selectedStatus === 'onaylandi') {
            if (p.status === 'onaylandi') includeRev = true;
          } else if (selectedStatus === 'teklif_verildi') {
            if (p.status === 'onaylandi' || p.status === 'teklif_verildi') includeRev = true;
          } else {
            includeRev = true;
          }

          if (p.status === 'onaylandi') {
            item.approvedCount += 1;
          }

          if (includeRev) {
            item.revenue += rev;
            if (p.type === 'riskli_yapi') {
              item.riskliCount += 1;
              item.riskliRev += rev;
            } else if (p.type === 'orta_katli_risk') {
              item.ortaCount += 1;
              item.ortaRev += rev;
            } else if (p.type === 'performans_raporu') {
              item.perfCount += 1;
              item.perfRev += rev;
            }
          }
        } catch {
          // ignore date format error
        }
      });
    }

    return Array.from(map.values()).sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [proposals, selectedStatus]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-md">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                Aylık İş Sayısı & Gelir Analiz Paneli
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                3 Farklı İnceleme Türüne Göre Finansal Performans ve İstatistikler
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
        <div className="bg-slate-100/90 border-b border-slate-200 p-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Month Selector */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm w-full sm:w-auto">
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
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-300 shadow-sm w-full sm:w-auto">
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
          </div>

          <div className="text-xs font-bold text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
            Seçilen Filtreye Göre: <span className="text-slate-900 font-extrabold">{totalCount} İş</span>
          </div>

        </div>

        {/* Modal Body Scrollable */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Total Jobs */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block mb-1">
                  TOPLAM İŞ / TEKLİF SAYISI
                </span>
                <div className="text-3xl font-black text-white">{totalCount} <span className="text-sm font-semibold text-slate-400">Adet</span></div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Toplam Kat Hacmi: <strong className="text-white">{totalFloorsAll} Kat</strong>
                </div>
              </div>
              <div className="p-3 bg-amber-500/20 rounded-2xl text-amber-400 border border-amber-500/30">
                <FileCheck2 className="w-7 h-7" />
              </div>
            </div>

            {/* Total Revenue (With VAT) */}
            <div className="bg-gradient-to-br from-emerald-900 to-teal-900 text-white p-5 rounded-2xl shadow-md border border-emerald-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-emerald-300 uppercase tracking-wider block mb-1">
                  TOPLAM GELİR / CİRO (KDV DAHİL)
                </span>
                <div className="text-3xl font-black text-white">
                  ₺{grandTotalRevenue.toLocaleString('tr-TR')}
                </div>
                <div className="text-[11px] text-emerald-200 mt-1">
                  KDV Hariç Net: <strong>₺{grandTotalNoVat.toLocaleString('tr-TR')}</strong>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-300 border border-emerald-500/30">
                <DollarSign className="w-7 h-7" />
              </div>
            </div>

            {/* Average Revenue Per Job */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
                  ORTALAMA İŞ BAŞINA CİRO
                </span>
                <div className="text-2xl font-black text-slate-900">
                  ₺{(totalCount > 0 ? Math.round(grandTotalRevenue / totalCount) : 0).toLocaleString('tr-TR')}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {selectedMonth === 'all' ? 'Tüm dönem ortalaması' : `${formatMonthLabel(selectedMonth)} ortalaması`}
                </div>
              </div>
              <div className="p-3 bg-slate-100 rounded-2xl text-slate-700">
                <TrendingUp className="w-7 h-7" />
              </div>
            </div>

          </div>

          {/* 3 Main Services Breakdown Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                3 Farklı İnceleme Türüne Göre Ayrı Ayrı Detaylı Gelir Dağılımı
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {breakdownByType.map((item) => {
                const percent = grandTotalRevenue > 0 ? Math.round((item.totalRevenueWithVat / grandTotalRevenue) * 100) : 0;
                
                let badgeBg = 'bg-blue-50 text-blue-900 border-blue-200';
                let accentColor = 'from-blue-600 to-indigo-700';

                if (item.type === 'orta_katli_risk') {
                  badgeBg = 'bg-amber-50 text-amber-900 border-amber-200';
                  accentColor = 'from-amber-500 to-orange-600';
                } else if (item.type === 'performans_raporu') {
                  badgeBg = 'bg-purple-50 text-purple-900 border-purple-200';
                  accentColor = 'from-purple-600 to-indigo-800';
                }

                return (
                  <div
                    key={item.type}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition relative overflow-hidden"
                  >
                    {/* Top Stripe */}
                    <div className={`h-1.5 absolute top-0 left-0 right-0 bg-gradient-to-r ${accentColor}`} />

                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg border ${badgeBg}`}>
                          {item.label}
                        </span>
                        <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          %{percent} Pay
                        </span>
                      </div>

                      {/* Main Big Numbers */}
                      <div className="space-y-1 mb-4">
                        <div className="text-xs font-bold text-slate-500">Aylık / Toplam Gelir:</div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                          ₺{item.totalRevenueWithVat.toLocaleString('tr-TR')}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-500">
                          (KDV Hariç Net: ₺{item.totalSubtotalNoVat.toLocaleString('tr-TR')})
                        </div>
                      </div>

                      {/* Job Count & Stats */}
                      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Tamamlanan İş</div>
                          <div className="text-base font-extrabold text-slate-900">{item.count} Adet</div>
                        </div>
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Toplam Kat</div>
                          <div className="text-base font-extrabold text-slate-900">{item.totalFloors} Kat</div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1">
                        <span>Ortalama İş Fiyatı:</span>
                        <span>₺{item.avgPrice.toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
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

          {/* Monthly Historical Trend Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  Aylara Göre Geçmiş İş ve Ciro Tablosu
                </h3>
                <p className="text-xs text-slate-500">Her ay için yapılan toplam iş adedi ve ciro dağılımı</p>
              </div>
            </div>

            {monthlyHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Henüz kayıtlı teklif verisi bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
                      <th className="p-3 rounded-l-xl">Dönem (Ay)</th>
                      <th className="p-3 text-center">Toplam İş</th>
                      <th className="p-3 text-center">Kabul Edilen</th>
                      <th className="p-3 text-right">6306 Risk Tespiti</th>
                      <th className="p-3 text-right">Orta Katlı Risk</th>
                      <th className="p-3 text-right">Performans Raporu</th>
                      <th className="p-3 text-right rounded-r-xl">Aylık Toplam Ciro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                    {monthlyHistory.map((row) => (
                      <tr key={row.monthKey} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {row.label}
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                            {row.count} İş
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center justify-center gap-1 w-fit mx-auto">
                            <CheckCircle2 className="w-3 h-3" />
                            {row.approvedCount} Onay
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">
                          {row.riskliCount > 0 ? (
                            <span>₺{row.riskliRev.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-500 font-sans">({row.riskliCount})</span></span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {row.ortaCount > 0 ? (
                            <span>₺{row.ortaRev.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-500 font-sans">({row.ortaCount})</span></span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {row.perfCount > 0 ? (
                            <span>₺{row.perfRev.toLocaleString('tr-TR')} <span className="text-[10px] text-slate-500 font-sans">({row.perfCount})</span></span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono font-black text-emerald-700 bg-emerald-50/50">
                          ₺{row.revenue.toLocaleString('tr-TR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 font-extrabold text-slate-900 text-xs border-t-2 border-slate-300">
                      <td className="p-3">GENEL TOPLAM</td>
                      <td className="p-3 text-center">{monthlyHistory.reduce((s, h) => s + h.count, 0)} İş</td>
                      <td className="p-3 text-center">{monthlyHistory.reduce((s, h) => s + h.approvedCount, 0)} Onay</td>
                      <td className="p-3 text-right font-mono">₺{monthlyHistory.reduce((s, h) => s + h.riskliRev, 0).toLocaleString('tr-TR')}</td>
                      <td className="p-3 text-right font-mono">₺{monthlyHistory.reduce((s, h) => s + h.ortaRev, 0).toLocaleString('tr-TR')}</td>
                      <td className="p-3 text-right font-mono">₺{monthlyHistory.reduce((s, h) => s + h.perfRev, 0).toLocaleString('tr-TR')}</td>
                      <td className="p-3 text-right font-mono text-sm text-emerald-800 bg-emerald-100">
                        ₺{monthlyHistory.reduce((s, h) => s + h.revenue, 0).toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 text-slate-300 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Veriler oluşturulmuş ve kabul edilmiş teklifler üzerinden anlık hesaplanmaktadır.
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
  return (
    <ModalErrorBoundary onClose={props.onClose}>
      <MonthlyAnalyticsContent {...props} />
    </ModalErrorBoundary>
  );
};
