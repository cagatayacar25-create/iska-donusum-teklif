import { Proposal, CompanyProfile, ProposalType, PaymentStatus, PaymentInstallment } from '../types';
import { DEFAULT_COMPANY_PROFILE, DEFAULT_SCOPES, DEFAULT_GUCLENDIRME_PARAMS } from '../data/defaultTemplates';
import { INITIAL_PROPOSALS } from '../data/defaultProposals';
import { ISKA_LOGO_DATA_URL } from '../assets/iskaLogo';
import { 
  syncSaveProposalToCloud, 
  syncDeleteProposalFromCloud, 
  syncSaveCompanyProfileToCloud 
} from '../firebase';

const PROPOSALS_KEY = 'bina_teklif_proposals_v1';
const COMPANY_KEY = 'bina_teklif_company_v1';

export function getCompanyProfile(): CompanyProfile {
  try {
    const saved = localStorage.getItem(COMPANY_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      let logoUrl = parsed.logoUrl || DEFAULT_COMPANY_PROFILE.logoUrl;
      // Upgrade legacy URL-encoded SVG or empty string to modern base64 SVG data URL
      if (
        !logoUrl ||
        typeof logoUrl !== 'string' ||
        logoUrl.includes('charset=utf-8') ||
        logoUrl.includes('%3Csvg') ||
        logoUrl.includes('%20')
      ) {
        logoUrl = ISKA_LOGO_DATA_URL;
      }
      return {
        ...DEFAULT_COMPANY_PROFILE,
        ...parsed,
        logoUrl,
      };
    }
  } catch (e) {
    console.error('Error loading company profile:', e);
  }
  return DEFAULT_COMPANY_PROFILE;
}

export function saveCompanyProfile(profile: CompanyProfile): void {
  try {
    localStorage.setItem(COMPANY_KEY, JSON.stringify(profile));
    // Push immediately to Firestore / Cloud
    syncSaveCompanyProfileToCloud(profile).catch((err) => {
      console.warn('Could not sync company profile to cloud:', err);
    });
  } catch (e) {
    console.error('Error saving company profile:', e);
  }
}

export function getProposals(): Proposal[] {
  try {
    const saved = localStorage.getItem(PROPOSALS_KEY);
    if (saved) {
      const parsed: Proposal[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading proposals from cache:', e);
  }
  // Default to the 14 complete initial proposals on first run
  return INITIAL_PROPOSALS;
}

export function saveProposals(proposals: Proposal[]): void {
  try {
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
  } catch (e) {
    console.error('Error caching proposals:', e);
  }
}

export function saveProposal(proposal: Proposal): void {
  const proposals = getProposals();
  const existingIndex = proposals.findIndex((p) => p.id === proposal.id);
  const updatedProposal: Proposal = {
    ...proposal,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    proposals[existingIndex] = updatedProposal;
  } else {
    proposals.unshift(updatedProposal);
  }
  saveProposals(proposals);

  // Directly push to Firestore for real-time live distribution to all devices
  syncSaveProposalToCloud(updatedProposal).catch((err) => {
    console.warn('Could not sync proposal to Firestore:', err);
  });
}

export function deleteProposal(id: string): void {
  const proposals = getProposals().filter((p) => p.id !== id);
  saveProposals(proposals);

  // Directly remove from Firestore for real-time live removal on all devices
  syncDeleteProposalFromCloud(id).catch((err) => {
    console.warn('Could not delete proposal from Firestore:', err);
  });
}

export function duplicateProposal(id: string): Proposal | null {
  const proposals = getProposals();
  const target = proposals.find((p) => p.id === id);
  if (!target) return null;

  const newRevisionNumber = (target.revisionNumber || 1) + 1;
  const now = new Date();

  const copy: Proposal = {
    ...JSON.parse(JSON.stringify(target)),
    id: 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    proposalNumber: `${target.proposalNumber}-R${newRevisionNumber}`,
    title: `${target.title} (Revizyon ${newRevisionNumber})`,
    status: 'revize',
    revisionNumber: newRevisionNumber,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  saveProposal(copy);
  return copy;
}

export function generateNewProposalNumber(): string {
  const proposals = getProposals();
  const year = new Date().getFullYear();
  
  // Find max numeric proposal number
  let maxNum = proposals.length;
  proposals.forEach((p) => {
    const match = p.proposalNumber.match(/TKL-\d{4}-(\d+)/);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (!isNaN(val) && val > maxNum) {
        maxNum = val;
      }
    }
  });

  const nextNum = maxNum + 1;
  const numFormatted = String(nextNum).padStart(3, '0');
  return `TKL-${year}-${numFormatted}`;
}

export function getProposalPaymentSummary(proposal: Proposal): {
  grandTotal: number;
  totalPaid: number;
  remaining: number;
  paymentStatus: PaymentStatus;
  percentagePaid: number;
  fileCompleted: boolean;
} {
  const isWithoutVat = Boolean(
    proposal.pricing?.isWithoutVat || 
    proposal.pricing?.invoiceType === 'faturasiz' || 
    proposal.pricing?.vatRate === 0
  );
  
  const subtotal = Number(proposal.pricing?.subtotal) || 0;
  const discount = Number(proposal.pricing?.discount) || 0;
  const base = Math.max(0, subtotal - discount);
  const vatRate = isWithoutVat ? 0 : (Number(proposal.pricing?.vatRate) || 20);
  const grandTotal = isWithoutVat ? base : Math.round(base * (1 + vatRate / 100));

  let totalPaid = 0;
  if (proposal.paymentTerms?.installments && proposal.paymentTerms.installments.length > 0) {
    totalPaid = proposal.paymentTerms.installments
      .filter((inst) => inst.isPaid)
      .reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
  } else if (typeof proposal.paymentTerms?.totalPaidAmount === 'number') {
    totalPaid = proposal.paymentTerms.totalPaidAmount;
  } else {
    const currentStatus = proposal.paymentTerms?.paymentStatus || 'odeme_bekliyor';
    if (currentStatus === 'tamami_odendi') {
      totalPaid = grandTotal;
    } else if (currentStatus === 'ilk_taksit_odendi' || currentStatus === 'dosya_bitti_odeme_bekliyor') {
      const advRatio = (proposal.paymentTerms?.advanceRatio || 50) / 100;
      totalPaid = Math.round(grandTotal * advRatio);
    } else if (currentStatus === 'ara_odeme_odendi') {
      totalPaid = Math.round(grandTotal * 0.75);
    } else {
      totalPaid = 0;
    }
  }

  const remaining = Math.max(0, grandTotal - totalPaid);
  const percentagePaid = grandTotal > 0 ? Math.min(100, Math.round((totalPaid / grandTotal) * 100)) : 0;
  const fileCompleted = Boolean(
    proposal.paymentTerms?.fileCompleted || 
    proposal.paymentTerms?.paymentStatus === 'dosya_bitti_odeme_bekliyor' ||
    proposal.paymentTerms?.paymentStatus === 'tamami_odendi'
  );

  const paymentStatus = proposal.paymentTerms?.paymentStatus || 'odeme_bekliyor';

  return {
    grandTotal,
    totalPaid,
    remaining,
    paymentStatus,
    percentagePaid,
    fileCompleted,
  };
}

export function generateDefaultInstallments(type: ProposalType, grandTotal: number, advanceRatio?: number): PaymentInstallment[] {
  if (type === 'statik_guclendirme') {
    const advPercent = advanceRatio && advanceRatio > 0 && advanceRatio < 100 ? advanceRatio : 50;
    const remainPercent = 100 - advPercent;
    const firstAmount = Math.round(grandTotal * (advPercent / 100));
    const secondAmount = Math.max(0, grandTotal - firstAmount);

    return [
      {
        id: 'inst_1',
        name: `1. Taksit (İş Başlangıcı / Peşinat - %${advPercent})`,
        percentage: advPercent,
        amount: firstAmount,
        isPaid: false,
        paymentMethod: 'havale_eft',
      },
      {
        id: 'inst_2',
        name: `2. Taksit (Avan / Detay Proje Teslimi - %${remainPercent})`,
        percentage: remainPercent,
        amount: secondAmount,
        isPaid: false,
        paymentMethod: 'havale_eft',
      },
    ];
  }

  // Riskli Yapı, Orta Katlı Risk ve Performans Raporu için %30 - %30 - %40 taksit planı
  const inst1Amount = Math.round(grandTotal * 0.30);
  const inst2Amount = Math.round(grandTotal * 0.30);
  const inst3Amount = Math.max(0, grandTotal - inst1Amount - inst2Amount);

  let name1 = '1. Taksit (Randevu / Ön Ödeme - %30)';
  let name2 = '2. Taksit (Numune Alımı / Saha Sonu - %30)';
  let name3 = '3. Taksit (Rapor / Onay Teslimi - %40)';

  if (type === 'riskli_yapi' || type === 'orta_katli_risk') {
    name1 = '1. Taksit (Numune Günü Belirlendiğinde - %30)';
    name2 = '2. Taksit (Numuneler Alındığı Gün - %30)';
    name3 = '3. Taksit (Resmî/Belediye Rapor Onayı - %40)';
  } else if (type === 'performans_raporu') {
    name1 = '1. Taksit (İş Başlangıcı / Randevu - %30)';
    name2 = '2. Taksit (Saha Numuneleri Alımı - %30)';
    name3 = '3. Taksit (Performans Rapor Teslimi - %40)';
  }

  return [
    {
      id: 'inst_1',
      name: name1,
      percentage: 30,
      amount: inst1Amount,
      isPaid: false,
      paymentMethod: 'havale_eft',
    },
    {
      id: 'inst_2',
      name: name2,
      percentage: 30,
      amount: inst2Amount,
      isPaid: false,
      paymentMethod: 'havale_eft',
    },
    {
      id: 'inst_3',
      name: name3,
      percentage: 40,
      amount: inst3Amount,
      isPaid: false,
      paymentMethod: 'havale_eft',
    },
  ];
}

export function createEmptyProposal(type: ProposalType): Proposal {
  const now = new Date().toISOString();
  const isGuclendirme = type === 'statik_guclendirme';
  const isPerformans = type === 'performans_raporu';
  const isOrtaKatli = type === 'orta_katli_risk';
  const defaultFloors = isOrtaKatli ? 10 : (isGuclendirme ? 4 : 6);
  const defaultUnitPrice = (isOrtaKatli || isPerformans) ? 30000 : (isGuclendirme ? 600000 : 45000);
  const defaultPricingMethod = (isOrtaKatli || isPerformans) ? 'kat_basi' : 'toplam_sabit';
  const subtotal = isGuclendirme 
    ? DEFAULT_GUCLENDIRME_PARAMS.stage1Total 
    : (defaultPricingMethod === 'kat_basi' ? defaultUnitPrice * defaultFloors : defaultUnitPrice);
  const vatRate = 20;
  const totalAmount = Math.round(subtotal * (1 + vatRate / 100));
  const defaultAdvanceRatio = isGuclendirme ? 50 : 30;

  return {
    id: 'prop_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    proposalNumber: generateNewProposalNumber(),
    type,
    title: type === 'riskli_yapi' 
      ? 'Riskli Yapı Tespiti Teklifi' 
      : type === 'orta_katli_risk' 
      ? 'Orta Katlı Bina Risk İnceleme Teklifi' 
      : type === 'statik_guclendirme'
      ? 'Statik Güçlendirme Avan ve Detay Projeleri Teklifi'
      : 'Bina Deprem Performans Raporu Teklifi',
    status: 'taslak',
    createdAt: now,
    updatedAt: now,
    client: {
      name: isGuclendirme ? 'Kopuzlar San.A.Ş.' : 'Yılmaz Apartmanı Yönetimi',
      contactPerson: 'Çağatay Acar',
      phone: '0533 123 45 67',
      email: isGuclendirme ? 'info@kopuzlar.com' : 'ahmet.yilmaz@gmail.com',
      notes: isGuclendirme ? '2018 TBDY kapsamında Avan ve Detay Güçlendirme Projesi' : 'Bina sakinleri karot alımı konusunda bilgilendirildi.',
    },
    property: {
      city: 'İstanbul',
      district: isGuclendirme ? 'Ümraniye' : 'Kadıköy',
      neighborhood: isGuclendirme ? 'Dudullu OSB' : 'Göztepe Mah.',
      fullAddress: isGuclendirme ? 'Dudullu Organize Sanayi Bölgesi, Ümraniye / İstanbul' : 'Tütüncü Mehmet Efendi Cad. No: 48, Kadıköy / İstanbul',
      ada: '6436',
      parsel: '1',
      buildingCount: isGuclendirme ? 2 : 1,
      totalArea: isGuclendirme ? 4500 : undefined,
      totalFloors: defaultFloors,
      buildingType: 'Betonarme',
      usagePurpose: isGuclendirme ? 'İşyeri' : 'Konut',
      hasAsBuiltProject: 'Hayır yok (Röleve Alınacak)',
    },
    scopeItems: JSON.parse(JSON.stringify(DEFAULT_SCOPES[type])),
    pricing: {
      unitPrice: defaultUnitPrice,
      pricingMethod: defaultPricingMethod,
      subtotal,
      vatRate,
      discount: 0,
      totalAmount,
      currency: 'TL',
    },
    paymentTerms: {
      advanceRatio: defaultAdvanceRatio,
      uponDeliveryRatio: 100 - defaultAdvanceRatio,
      completionWorkDays: isGuclendirme ? 20 : 7,
      validityDays: 15,
      customNotes: isGuclendirme 
        ? 'İş başlangıcında %50, Avan proje tesliminde %50 olarak ödenecektir.'
        : (type === 'performans_raporu'
          ? 'İş başlangıcında %30, saha numuneleri alımında %30, performans rapor tesliminde %40 tahsil edilecektir.'
          : 'Numune için gün belirlendiğinde %30, numune alındığı gün %30, resmî/belediye rapor onayında %40 tahsil edilecektir.'),
      paymentStatus: 'odeme_bekliyor',
      fileCompleted: false,
      installments: generateDefaultInstallments(type, totalAmount, defaultAdvanceRatio),
      totalPaidAmount: 0,
      remainingAmount: totalAmount,
    },
    revisionNumber: 1,
    guclendirme: isGuclendirme ? JSON.parse(JSON.stringify(DEFAULT_GUCLENDIRME_PARAMS)) : undefined,
  };
}

export function getInitialMockProposals(): Proposal[] {
  return INITIAL_PROPOSALS;
}
