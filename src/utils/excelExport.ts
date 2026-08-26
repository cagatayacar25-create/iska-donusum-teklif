import * as XLSX from 'xlsx';
import { Proposal } from '../types';
import { getProposalPaymentSummary } from './storage';
import { PAYMENT_STATUS_LABELS } from '../data/defaultTemplates';

/**
 * Exports all proposals (or filtered proposals) into a formatted Excel (.xlsx) file
 */
export function exportProposalsToExcel(
  proposals: Proposal[],
  fileNamePrefix = 'ISKA_Teklif_Listesi'
): void {
  if (!proposals || proposals.length === 0) {
    alert('Dışa aktarılacak teklif bulunamadı.');
    return;
  }

  // 1. Data rows for Sheet 1
  const rows = proposals.map((p) => {
    const isRiskli = p.type === 'riskli_yapi';
    const isKolluk = Boolean(p.pricing?.kollukKuvvetiIncluded);
    const kollukPrice = isKolluk ? (p.pricing?.kollukKuvvetiPrice || 25000) : 0;
    const subtotal = p.pricing?.subtotal || 0;
    const discount = p.pricing?.discount || 0;
    const netSubtotal = Math.max(0, subtotal - discount);
    const isFaturasiz = Boolean(
      p.pricing?.isWithoutVat || 
      p.pricing?.invoiceType === 'faturasiz' || 
      p.pricing?.vatRate === 0
    );
    const vatRate = isFaturasiz ? 0 : (p.pricing?.vatRate || 20);
    const vatAmount = Math.round((netSubtotal * vatRate) / 100);
    const totalAmount = p.pricing?.totalAmount || (netSubtotal + vatAmount);

    let typeLabel = 'Riskli Yapı Tespiti (6306 Sayılı Kanun)';
    if (p.type === 'orta_katli_risk') typeLabel = 'Orta Katlı Yapı Risk Tespiti (2019 RYTEİE)';
    else if (p.type === 'performans_raporu') typeLabel = 'Bina Deprem Performans Raporu (TBDY 2018)';
    else if (p.type === 'statik_guclendirme') typeLabel = 'Statik Güçlendirme Proje Teklifi (TBDY 2018)';

    let statusLabel = 'Taslak';
    if (p.status === 'teklif_verildi') statusLabel = 'Teklif Verildi';
    else if (p.status === 'onaylandi') statusLabel = 'Kabul Edildi';
    else if (p.status === 'revize') statusLabel = 'Revize Edildi';
    else if (p.status === 'iptal') statusLabel = 'İptal Edildi';

    const paymentSummary = getProposalPaymentSummary(p);
    const paymentLabel = PAYMENT_STATUS_LABELS[paymentSummary.paymentStatus]?.label || 'Ödeme Bekliyor';

    const formattedDate = p.createdAt
      ? new Date(p.createdAt).toLocaleDateString('tr-TR')
      : '-';

    return {
      'Teklif No': p.proposalNumber || '-',
      'Tarih': formattedDate,
      'Durum': statusLabel,
      'Ödeme Durumu': paymentLabel,
      'Tahsil Edilen (TL)': paymentSummary.totalPaid,
      'Kalan Alacak (TL)': paymentSummary.remaining,
      'Dosya / Rapor Durumu': paymentSummary.fileCompleted ? 'Dosya / Rapor Hazırlandı' : 'Süreç Devam Ediyor',
      'Teklif Türü': typeLabel,
      'Fatura Durumu': isFaturasiz ? 'Faturasız (%0 KDV Net)' : 'Faturalı (+%20 KDV)',
      'Müşteri / Yapı Sahibi': p.client?.name || '-',
      'Yetkili Kişi': p.client?.contactPerson || '-',
      'Telefon': p.client?.phone || '-',
      'E-Posta': p.client?.email || '-',
      'İl': p.property?.city || 'İstanbul',
      'İlçe': p.property?.district || '-',
      'Mahalle': p.property?.neighborhood || '-',
      'Ada': p.property?.ada || '-',
      'Parsel': p.property?.parsel || '-',
      'Bina / Yapı Sayısı': p.property?.buildingCount || 1,
      'Kat Sayısı': p.property?.totalFloors ? `${p.property.totalFloors} Kat` : '-',
      'Yapı Tipi': p.property?.buildingType || 'Betonarme',
      'Kullanım Amacı': p.property?.usagePurpose || 'Konut',
      'Röleve / Proje Durumu': p.property?.hasAsBuiltProject || '-',
      'Kolluk Kuvveti Eşliğinde': isRiskli ? (isKolluk ? 'Evet (+25.000 TL)' : 'Hayır') : '-',
      'Kolluk Ek Tutarı (TL)': isRiskli && isKolluk ? kollukPrice : 0,
      'Birim Fiyat (TL)': p.pricing?.unitPrice || 0,
      'Temel / Liste Bedeli (TL)': subtotal,
      'İskonto Tutarı (TL)': discount,
      'Ana Para (KDV Hariç Net TL)': netSubtotal,
      'KDV Oranı (%)': isFaturasiz ? '%0 (Muaf)' : `%${vatRate}`,
      'KDV Tutarı (TL)': vatAmount,
      'GENEL TOPLAM (TL)': totalAmount,
      'Ödeme Şartı (Peşinat %)': `%${p.paymentTerms?.advanceRatio || 30}`,
      'Teslim Süresi (İş Günü)': `${p.paymentTerms?.completionWorkDays || 7} İş Günü`,
      'Geçerlilik Süresi (Gün)': `${p.paymentTerms?.validityDays || 15} Gün`,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Format columns widths
  const colWidths = [
    { wch: 14 }, // Teklif No
    { wch: 12 }, // Tarih
    { wch: 15 }, // Durum
    { wch: 28 }, // Ödeme Durumu
    { wch: 18 }, // Tahsil Edilen
    { wch: 18 }, // Kalan Alacak
    { wch: 24 }, // Dosya Durumu
    { wch: 38 }, // Teklif Türü
    { wch: 22 }, // Fatura Durumu
    { wch: 30 }, // Müşteri / Yapı Sahibi
    { wch: 20 }, // Yetkili Kişi
    { wch: 16 }, // Telefon
    { wch: 24 }, // E-Posta
    { wch: 12 }, // İl
    { wch: 16 }, // İlçe
    { wch: 20 }, // Mahalle
    { wch: 10 }, // Ada
    { wch: 10 }, // Parsel
    { wch: 12 }, // Kat Sayısı
    { wch: 14 }, // Yapı Tipi
    { wch: 16 }, // Kullanım Amacı
    { wch: 22 }, // Röleve / Proje Durumu
    { wch: 24 }, // Kolluk Kuvveti
    { wch: 18 }, // Kolluk Ek Tutarı
    { wch: 24 }, // Liste Bedeli
    { wch: 18 }, // İskonto Tutarı
    { wch: 26 }, // Ana Para (KDV Hariç Net TL)
    { wch: 14 }, // KDV Oranı
    { wch: 18 }, // KDV Tutarı
    { wch: 24 }, // GENEL TOPLAM
    { wch: 20 }, // Ödeme Şartı
    { wch: 20 }, // Teslim Süresi
    { wch: 20 }, // Geçerlilik Süresi
  ];
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Teklif Listesi');

  // Summary Sheet
  const approvedProposals = proposals.filter((p) => p.status === 'onaylandi');
  const approvedTotal = approvedProposals.reduce(
    (sum, p) => sum + (p.pricing?.totalAmount || 0),
    0
  );
  
  let totalPaidAll = 0;
  let totalRemainingAll = 0;
  let fileReadyPendingCount = 0;
  let fileReadyPendingTotal = 0;

  proposals.forEach((p) => {
    const s = getProposalPaymentSummary(p);
    totalPaidAll += s.totalPaid;
    totalRemainingAll += s.remaining;
    if (s.paymentStatus === 'dosya_bitti_odeme_bekliyor') {
      fileReadyPendingCount += 1;
      fileReadyPendingTotal += s.remaining;
    }
  });

  const totalBaseAll = proposals.reduce(
    (sum, p) => sum + Math.max(0, (p.pricing?.subtotal || 0) - (p.pricing?.discount || 0)),
    0
  );
  const totalVatAll = proposals.reduce((sum, p) => {
    const isFz = Boolean(p.pricing?.isWithoutVat || p.pricing?.invoiceType === 'faturasiz' || p.pricing?.vatRate === 0);
    if (isFz) return sum;
    const net = Math.max(0, (p.pricing?.subtotal || 0) - (p.pricing?.discount || 0));
    return sum + Math.round((net * (p.pricing?.vatRate || 20)) / 100);
  }, 0);
  const grandTotalAll = proposals.reduce(
    (sum, p) => sum + (p.pricing?.totalAmount || 0),
    0
  );

  const faturasizCount = proposals.filter(p => p.pricing?.isWithoutVat || p.pricing?.invoiceType === 'faturasiz' || p.pricing?.vatRate === 0).length;
  const faturaliCount = proposals.length - faturasizCount;

  const summaryRows = [
    { 'METRİK': 'TOPLAM TEKLİF ADEDİ', 'DEĞER': proposals.length },
    { 'METRİK': 'Faturalı Teklif Sayısı', 'DEĞER': faturaliCount },
    { 'METRİK': 'Faturasız / KDV Muaf Teklif Sayısı', 'DEĞER': faturasizCount },
    {
      'METRİK': 'Kabul Edilen Teklif Adedi',
      'DEĞER': approvedProposals.length,
    },
    {
      'METRİK': 'Teklif Verildi (Beklemede)',
      'DEĞER': proposals.filter((p) => p.status === 'teklif_verildi').length,
    },
    {
      'METRİK': 'Taslak Teklif Adedi',
      'DEĞER': proposals.filter((p) => p.status === 'taslak').length,
    },
    {
      'METRİK': 'Revize Edilen Teklif Adedi',
      'DEĞER': proposals.filter((p) => p.status === 'revize').length,
    },
    {
      'METRİK': 'İptal Edilen Teklif Adedi',
      'DEĞER': proposals.filter((p) => p.status === 'iptal').length,
    },
    { 'METRİK': '----------------------------------', 'DEĞER': '----------------' },
    {
      'METRİK': 'FİİLİ TAHSİL EDİLEN TUTAR (KASA)',
      'DEĞER': `${totalPaidAll.toLocaleString('tr-TR')} TL`,
    },
    {
      'METRİK': 'KALAN BEKLEYEN ALACAK (TL)',
      'DEĞER': `${totalRemainingAll.toLocaleString('tr-TR')} TL`,
    },
    {
      'METRİK': 'Dosya Bitti Ödeme Bekleyen İş Adedi',
      'DEĞER': `${fileReadyPendingCount} Dosya`,
    },
    {
      'METRİK': 'Dosya Bitti Bekleyen Alacak Tutarı',
      'DEĞER': `${fileReadyPendingTotal.toLocaleString('tr-TR')} TL`,
    },
    { 'METRİK': '----------------------------------', 'DEĞER': '----------------' },
    {
      'METRİK': '6306 Riskli Yapı Teklifleri',
      'DEĞER': proposals.filter((p) => p.type === 'riskli_yapi').length,
    },
    {
      'METRİK': 'Orta Katlı Yapı Tespiti Teklifleri',
      'DEĞER': proposals.filter((p) => p.type === 'orta_katli_risk').length,
    },
    {
      'METRİK': 'Deprem Performans Raporu Teklifleri',
      'DEĞER': proposals.filter((p) => p.type === 'performans_raporu').length,
    },
    {
      'METRİK': 'Statik Güçlendirme Teklifleri',
      'DEĞER': proposals.filter((p) => p.type === 'statik_guclendirme').length,
    },
    { 'METRİK': '----------------------------------', 'DEĞER': '----------------' },
    {
      'METRİK': 'TOPLAM ANA PARA (KDV Hariç Net TL)',
      'DEĞER': `${totalBaseAll.toLocaleString('tr-TR')} TL`,
    },
    {
      'METRİK': 'TOPLAM HESAPLANAN KDV (TL)',
      'DEĞER': `${totalVatAll.toLocaleString('tr-TR')} TL`,
    },
    {
      'METRİK': 'TÜM TEKLİFLER GENEL TOPLAMI (TL)',
      'DEĞER': `${grandTotalAll.toLocaleString('tr-TR')} TL`,
    },
    {
      'METRİK': 'KABUL EDİLEN NET CİRO (TL)',
      'DEĞER': `${approvedTotal.toLocaleString('tr-TR')} TL`,
    },
  ];

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryRows);
  summaryWorksheet['!cols'] = [{ wch: 42 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Özet İstatistikler');

  // Trigger download
  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${fileNamePrefix}_${todayStr}.xlsx`);
}
