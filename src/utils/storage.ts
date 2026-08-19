import { Proposal, CompanyProfile, ProposalType, PaymentStatus, PaymentInstallment } from '../types';
import { DEFAULT_COMPANY_PROFILE, DEFAULT_SCOPES, DEFAULT_GUCLENDIRME_PARAMS } from '../data/defaultTemplates';
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
      return {
        ...DEFAULT_COMPANY_PROFILE,
        ...parsed,
        logoUrl: parsed.logoUrl || DEFAULT_COMPANY_PROFILE.logoUrl,
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
    // Asynchronously sync to Firebase Firestore
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
      // Clean up and ensure Istanbul proposals have valid districts/neighborhoods
      let modified = false;
      const cleaned = parsed.map((p) => {
        if (!p.property) return p;
        if (p.property.city?.toLowerCase().includes('istanbul')) {
          let dist = p.property.district;
          if (dist === 'Karaköy / Beyoğlu') {
            dist = 'Beyoğlu';
            modified = true;
          }
          if (!dist) {
            dist = 'Kadıköy';
            modified = true;
          }
          return {
            ...p,
            property: {
              ...p.property,
              city: 'İstanbul',
              district: dist,
              neighborhood: p.property.neighborhood || 'Göztepe Mah.',
            },
          };
        }
        return p;
      });
      if (modified) {
        saveProposals(cleaned);
      }
      return cleaned;
    }
  } catch (e) {
    console.error('Error loading proposals:', e);
  }
  // If empty, initialize with mock proposals for a great first-time demo
  const initial = getInitialMockProposals();
  saveProposals(initial);
  return initial;
}

export function saveProposals(proposals: Proposal[]): void {
  try {
    localStorage.setItem(PROPOSALS_KEY, JSON.stringify(proposals));
  } catch (e) {
    console.error('Error saving proposals:', e);
  }
}

export function saveProposal(proposal: Proposal): void {
  const proposals = getProposals();
  const existingIndex = proposals.findIndex((p) => p.id === proposal.id);
  const updatedProposal = {
    ...proposal,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    proposals[existingIndex] = updatedProposal;
  } else {
    proposals.unshift(updatedProposal);
  }
  saveProposals(proposals);

  // Asynchronously sync to Firebase Firestore
  syncSaveProposalToCloud(updatedProposal).catch((err) => {
    console.warn('Could not sync proposal to cloud:', err);
  });
}

export function deleteProposal(id: string): void {
  const proposals = getProposals().filter((p) => p.id !== id);
  saveProposals(proposals);

  // Asynchronously remove from Firebase Firestore
  syncDeleteProposalFromCloud(id).catch((err) => {
    console.warn('Could not delete proposal from cloud:', err);
  });
}

export function duplicateProposal(id: string): Proposal | null {
  const proposals = getProposals();
  const target = proposals.find((p) => p.id === id);
  if (!target) return null;

  const newRevisionNumber = (target.revisionNumber || 1) + 1;
  const now = new Date();
  const year = now.getFullYear();
  const randomSuffix = Math.floor(100 + Math.random() * 900);

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
  const count = proposals.length + 1;
  const numFormatted = String(count).padStart(3, '0');
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
    // Infer based on paymentStatus if not explicit
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

  let paymentStatus = proposal.paymentTerms?.paymentStatus || 'odeme_bekliyor';

  return {
    grandTotal,
    totalPaid,
    remaining,
    paymentStatus,
    percentagePaid,
    fileCompleted,
  };
}

export function generateDefaultInstallments(grandTotal: number, advanceRatio: number = 50): PaymentInstallment[] {
  const advPercent = advanceRatio > 0 && advanceRatio < 100 ? advanceRatio : 50;
  const remainPercent = 100 - advPercent;
  const firstAmount = Math.round(grandTotal * (advPercent / 100));
  const secondAmount = Math.max(0, grandTotal - firstAmount);

  return [
    {
      id: 'inst_1',
      name: `1. Taksit (Peşinat / Başlangıç - %${advPercent})`,
      percentage: advPercent,
      amount: firstAmount,
      isPaid: false,
      paymentMethod: 'havale_eft',
    },
    {
      id: 'inst_2',
      name: `2. Taksit (Dosya / Rapor Teslimi - %${remainPercent})`,
      percentage: remainPercent,
      amount: secondAmount,
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
  const defaultAdvanceRatio = 50;

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
      contactPerson: isGuclendirme ? 'Fabrika / Tesis Yönetimi' : 'Ahmet Yılmaz (Yönetici)',
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
        : 'Saha incelemesi esnasında elektrik ve su imkanı sağlanmalıdır.',
      paymentStatus: 'odeme_bekliyor',
      fileCompleted: false,
      installments: generateDefaultInstallments(totalAmount, defaultAdvanceRatio),
      totalPaidAmount: 0,
      remainingAmount: totalAmount,
    },
    revisionNumber: 1,
    guclendirme: isGuclendirme ? JSON.parse(JSON.stringify(DEFAULT_GUCLENDIRME_PARAMS)) : undefined,
  };
}

function getInitialMockProposals(): Proposal[] {
  const now = new Date();
  const date1 = new Date(now.getTime() - 86400000 * 1).toISOString();
  const date2 = new Date(now.getTime() - 86400000 * 3).toISOString();
  const date3 = new Date(now.getTime() - 86400000 * 6).toISOString();

  return [
    {
      id: 'demo_prop_1',
      proposalNumber: 'TKL-2026-001',
      type: 'riskli_yapi',
      title: 'Huzur Apartmanı Riskli Yapı Tespiti',
      status: 'teklif_verildi',
      createdAt: date1,
      updatedAt: date1,
      client: {
        name: 'Huzur Apt. Kat Malikleri',
        contactPerson: 'Mehmet Demir',
        phone: '0532 987 65 43',
        email: 'huzurapt.yonetim@gmail.com',
        notes: '6306 sayılı kanun kapsamında kentsel dönüşüm başvurusu yapılacak.',
      },
      property: {
        city: 'İstanbul',
        district: 'Beyoğlu',
        neighborhood: 'Cihangir Mah.',
        fullAddress: 'Mumhane Cad. No: 18, Beyoğlu / İstanbul',
        ada: '412',
        parsel: '8',
        totalFloors: 5,
        buildingType: 'Betonarme',
        usagePurpose: 'Karma',
        hasAsBuiltProject: 'Hayır yok (Röleve Alınacak)',
      },
      scopeItems: DEFAULT_SCOPES.riskli_yapi,
      pricing: {
        unitPrice: 38000,
        pricingMethod: 'toplam_sabit',
        subtotal: 38000,
        vatRate: 20,
        discount: 3000,
        totalAmount: 42000,
        currency: 'TL',
      },
      paymentTerms: {
        advanceRatio: 50,
        uponDeliveryRatio: 50,
        completionWorkDays: 5,
        validityDays: 15,
        customNotes: 'Laboratuvar sonuçları Çevre ve Şehircilik Bakanlığı sistemine işlenecektir.',
        paymentStatus: 'dosya_bitti_odeme_bekliyor',
        fileCompleted: true,
        installments: [
          {
            id: 'inst_1',
            name: '1. Taksit (Peşinat - %50)',
            percentage: 50,
            amount: 21000,
            isPaid: true,
            paidAt: date1.split('T')[0],
            paymentMethod: 'havale_eft',
            notes: 'Ziraat Bankası hesabına ödendi.',
          },
          {
            id: 'inst_2',
            name: '2. Taksit (Dosya Teslimi - %50)',
            percentage: 50,
            amount: 21000,
            isPaid: false,
            paymentMethod: 'havale_eft',
            notes: 'Rapor hazır, onay ve teslim bekleniyor.',
          },
        ],
        totalPaidAmount: 21000,
        remainingAmount: 21000,
      },
      revisionNumber: 1,
    },
    {
      id: 'demo_prop_2',
      proposalNumber: 'TKL-2026-002',
      type: 'performans_raporu',
      title: 'Ege Plaza Deprem Performans Analizi',
      status: 'onaylandi',
      createdAt: date2,
      updatedAt: date2,
      client: {
        name: 'Ege Gayrimenkul A.Ş.',
        contactPerson: 'Selin Arslan',
        phone: '0212 444 01 23',
        email: 'selin.arslan@egegayrimenkul.com',
        notes: 'Banka kredi ve sigorta işlemleri için performans raporu istendi.',
      },
      property: {
        city: 'İstanbul',
        district: 'Kadıköy',
        neighborhood: 'Göztepe Mah.',
        fullAddress: 'Bağdat Cad. No: 142, Kadıköy / İstanbul',
        ada: '2045',
        parsel: '12',
        totalFloors: 8,
        buildingType: 'Betonarme',
        usagePurpose: 'İşyeri',
        hasAsBuiltProject: 'Evet var',
      },
      scopeItems: DEFAULT_SCOPES.performans_raporu,
      pricing: {
        unitPrice: 30000,
        pricingMethod: 'kat_basi',
        subtotal: 240000,
        vatRate: 20,
        discount: 10000,
        totalAmount: 276000,
        currency: 'TL',
      },
      paymentTerms: {
        advanceRatio: 50,
        uponDeliveryRatio: 50,
        completionWorkDays: 10,
        validityDays: 30,
        customNotes: 'Gerekli statik projeler idareden temin edilip tarafımıza iletilmiştir.',
        paymentStatus: 'ilk_taksit_odendi',
        fileCompleted: false,
        installments: [
          {
            id: 'inst_1',
            name: '1. Taksit (Peşinat - %50)',
            percentage: 50,
            amount: 138000,
            isPaid: true,
            paidAt: date2.split('T')[0],
            paymentMethod: 'havale_eft',
            notes: 'Şirket hesabına fatura karşılığı ödendi.',
          },
          {
            id: 'inst_2',
            name: '2. Taksit (Rapor Teslimi - %50)',
            percentage: 50,
            amount: 138000,
            isPaid: false,
            paymentMethod: 'havale_eft',
          },
        ],
        totalPaidAmount: 138000,
        remainingAmount: 138000,
      },
      revisionNumber: 1,
    },
    {
      id: 'demo_prop_3',
      proposalNumber: 'TKL-2026-003',
      type: 'orta_katli_risk',
      title: 'Marmara İş Merkezi Orta Katlı Risk İncelemesi',
      status: 'taslak',
      createdAt: date3,
      updatedAt: date3,
      client: {
        name: 'Marmara İş Merkezi Site Yönetimi',
        contactPerson: 'Caner Kaya',
        phone: '0533 555 12 34',
        email: 'caner.kaya@marmarais.com',
        notes: '12 katlı iş merkezi için hızlı risk değerlendirmesi talep edildi.',
      },
      property: {
        city: 'İstanbul',
        district: 'Şişli',
        neighborhood: 'Mecidiyeköy Mah.',
        fullAddress: 'Büyükdere Cad. No: 75, Şişli / İstanbul',
        ada: '1088',
        parsel: '24',
        totalFloors: 12,
        buildingType: 'Betonarme',
        usagePurpose: 'İşyeri',
        hasAsBuiltProject: 'Evet var',
      },
      scopeItems: DEFAULT_SCOPES.orta_katli_risk,
      pricing: {
        unitPrice: 28000,
        pricingMethod: 'kat_basi',
        subtotal: 336000,
        vatRate: 20,
        discount: 16000,
        totalAmount: 384000,
        currency: 'TL',
      },
      paymentTerms: {
        advanceRatio: 50,
        uponDeliveryRatio: 50,
        completionWorkDays: 8,
        validityDays: 15,
        customNotes: 'İncelemeler mesai saatleri dışında gerçekleştirilecektir.',
        paymentStatus: 'odeme_bekliyor',
        fileCompleted: false,
        installments: [
          {
            id: 'inst_1',
            name: '1. Taksit (Peşinat - %50)',
            percentage: 50,
            amount: 192000,
            isPaid: false,
            paymentMethod: 'havale_eft',
          },
          {
            id: 'inst_2',
            name: '2. Taksit (Teslimat - %50)',
            percentage: 50,
            amount: 192000,
            isPaid: false,
            paymentMethod: 'havale_eft',
          },
        ],
        totalPaidAmount: 0,
        remainingAmount: 384000,
      },
      revisionNumber: 1,
    },
  ];
}
