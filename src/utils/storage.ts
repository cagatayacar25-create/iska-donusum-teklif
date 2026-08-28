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

export function sanitizeProposal(p: Proposal): Proposal {
  if (!p) return p;
  const prop: Proposal = JSON.parse(JSON.stringify(p));

  if (prop.type === 'riskli_yapi') {
    const buildingCount = Math.max(1, Number(prop.property?.buildingCount) || 1);
    let unitPrice = Number(prop.pricing?.unitPrice);
    if (!unitPrice || unitPrice <= 0) {
      unitPrice = 45000;
    }
    const kollukIncluded = Boolean(prop.pricing?.kollukKuvvetiIncluded);
    const kollukPrice = kollukIncluded ? Number(prop.pricing?.kollukKuvvetiPrice ?? 25000) : 0;
    const baseSubtotal = Math.round(unitPrice * buildingCount);
    const subtotal = Number(prop.pricing?.subtotal) || (baseSubtotal + kollukPrice);
    const discount = Math.max(0, Number(prop.pricing?.discount) || 0);
    const afterDiscount = Math.max(0, subtotal - discount);
    const isWithoutVat = Boolean(
      prop.pricing?.isWithoutVat || 
      prop.pricing?.invoiceType === 'faturasiz' || 
      prop.pricing?.vatRate === 0
    );
    const vatRate = isWithoutVat ? 0 : (Number(prop.pricing?.vatRate) ?? 20);
    const vatAmount = (afterDiscount * vatRate) / 100;
    const totalAmount = Number(prop.pricing?.totalAmount) || (isWithoutVat ? afterDiscount : Math.round(afterDiscount + vatAmount));

    // Installments: Kullanıcının girdiği özel oranlar (ör. %37), tutarlar ve açıklamalar KESİNLİKLE korunmalıdır!
    let installments: PaymentInstallment[] = [];
    if (prop.paymentTerms?.installments && Array.isArray(prop.paymentTerms.installments) && prop.paymentTerms.installments.length > 0) {
      installments = prop.paymentTerms.installments.map((inst, idx) => ({
        id: inst.id || `inst_${idx + 1}`,
        name: inst.name || `${idx + 1}. Taksit`,
        percentage: typeof inst.percentage === 'number' ? inst.percentage : (Number(inst.percentage) || 0),
        amount: typeof inst.amount === 'number' ? inst.amount : (Number(inst.amount) || 0),
        isPaid: Boolean(inst.isPaid),
        paidAt: inst.paidAt,
        paymentMethod: inst.paymentMethod || 'havale_eft',
        notes: inst.notes,
      }));
    } else {
      const advanceRatio = prop.paymentTerms?.advanceRatio || 30;
      installments = generateDefaultInstallments('riskli_yapi', totalAmount, advanceRatio);
    }

    const calculatedPaid = installments
      .filter((i) => i.isPaid)
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const calculatedRemaining = Math.max(0, totalAmount - calculatedPaid);
    const firstPct = installments[0]?.percentage ?? prop.paymentTerms?.advanceRatio ?? 30;

    prop.property = {
      ...prop.property,
      buildingCount,
    };
    prop.pricing = {
      ...prop.pricing,
      pricingMethod: 'bina_basi',
      unitPrice,
      subtotal,
      discount,
      isWithoutVat,
      vatRate,
      totalAmount,
    };
    prop.paymentTerms = {
      ...prop.paymentTerms,
      advanceRatio: firstPct,
      uponDeliveryRatio: 100 - firstPct,
      totalPaidAmount: calculatedPaid,
      remainingAmount: calculatedRemaining,
      installments,
    };
  } else if (prop.paymentTerms?.installments && Array.isArray(prop.paymentTerms.installments) && prop.paymentTerms.installments.length > 0) {
    // Diğer tüm teklif tipleri için de mevcut taksitleri normalize et ve koru
    const grandTotal = Number(prop.pricing?.totalAmount) || 0;
    const installments = prop.paymentTerms.installments.map((inst, idx) => ({
      id: inst.id || `inst_${idx + 1}`,
      name: inst.name || `${idx + 1}. Taksit`,
      percentage: typeof inst.percentage === 'number' ? inst.percentage : (Number(inst.percentage) || 0),
      amount: typeof inst.amount === 'number' ? inst.amount : (Number(inst.amount) || 0),
      isPaid: Boolean(inst.isPaid),
      paidAt: inst.paidAt,
      paymentMethod: inst.paymentMethod || 'havale_eft',
      notes: inst.notes,
    }));

    const calculatedPaid = installments
      .filter((i) => i.isPaid)
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    const calculatedRemaining = Math.max(0, grandTotal - calculatedPaid);
    const firstPct = installments[0]?.percentage ?? prop.paymentTerms?.advanceRatio ?? 50;

    prop.paymentTerms = {
      ...prop.paymentTerms,
      advanceRatio: firstPct,
      uponDeliveryRatio: 100 - firstPct,
      totalPaidAmount: calculatedPaid,
      remainingAmount: calculatedRemaining,
      installments,
    };
  }

  return prop;
}

export function getProposals(): Proposal[] {
  try {
    const saved = localStorage.getItem(PROPOSALS_KEY);
    if (saved) {
      const parsed: Proposal[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeProposal);
      }
    }
  } catch (e) {
    console.error('Error loading proposals from cache:', e);
  }
  // Default to the 14 complete initial proposals on first run
  return INITIAL_PROPOSALS.map(sanitizeProposal);
}

export function saveProposals(proposals: Proposal[]): void {
  try {
    const sanitized = proposals.map(sanitizeProposal);
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(sanitized));
  } catch (e) {
    console.error('Error caching proposals:', e);
  }
}

export function saveProposal(proposal: Proposal): void {
  const sanitized = sanitizeProposal(proposal);
  const proposals = getProposals();
  const existingIndex = proposals.findIndex((p) => p.id === sanitized.id);
  const updatedProposal: Proposal = {
    ...sanitized,
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
  const currentStatus = proposal.paymentTerms?.paymentStatus || 'odeme_bekliyor';
  const hasInst = proposal.paymentTerms?.installments && proposal.paymentTerms.installments.length > 0;

  if (hasInst) {
    const paidSum = proposal.paymentTerms.installments
      .filter((inst) => inst.isPaid)
      .reduce((sum, inst) => sum + (Number(inst.amount) || 0), 0);
    
    if (paidSum > 0) {
      totalPaid = paidSum;
    } else if (currentStatus === 'tamami_odendi') {
      totalPaid = grandTotal;
    } else if (currentStatus === 'ilk_taksit_odendi' || currentStatus === 'dosya_bitti_odeme_bekliyor') {
      totalPaid = Number(proposal.paymentTerms.installments[0]?.amount) || Math.round(grandTotal * ((proposal.paymentTerms.advanceRatio || 30) / 100));
    } else if (currentStatus === 'ara_odeme_odendi') {
      const inst1 = Number(proposal.paymentTerms.installments[0]?.amount) || 0;
      const inst2 = Number(proposal.paymentTerms.installments[1]?.amount) || 0;
      totalPaid = inst1 + inst2 > 0 ? inst1 + inst2 : Math.round(grandTotal * 0.75);
    } else if (typeof proposal.paymentTerms?.totalPaidAmount === 'number') {
      totalPaid = proposal.paymentTerms.totalPaidAmount;
    }
  } else if (typeof proposal.paymentTerms?.totalPaidAmount === 'number' && proposal.paymentTerms.totalPaidAmount > 0) {
    totalPaid = proposal.paymentTerms.totalPaidAmount;
  } else {
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
  const isRiskli = type === 'riskli_yapi';
  const isGuclendirme = type === 'statik_guclendirme';
  const isPerformans = type === 'performans_raporu';
  const isOrtaKatli = type === 'orta_katli_risk';
  const defaultFloors = isOrtaKatli ? 10 : (isGuclendirme ? 4 : 6);
  const defaultUnitPrice = (isOrtaKatli || isPerformans) ? 30000 : (isGuclendirme ? 600000 : 45000);
  const defaultPricingMethod = isRiskli ? 'bina_basi' : ((isOrtaKatli || isPerformans) ? 'kat_basi' : 'toplam_sabit');
  const defaultBuildingCount = isGuclendirme ? 2 : 1;
  const subtotal = isGuclendirme 
    ? DEFAULT_GUCLENDIRME_PARAMS.stage1Total 
    : isRiskli
    ? defaultUnitPrice * defaultBuildingCount
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
