export type ProposalType = 'riskli_yapi' | 'orta_katli_risk' | 'performans_raporu' | 'statik_guclendirme';

export type ProposalStatus = 'taslak' | 'teklif_verildi' | 'onaylandi' | 'revize' | 'iptal';

export interface ScopeItem {
  id: string;
  title: string;
  description: string;
  included: boolean;
  quantity?: number;
  unit?: string;
}

export interface ClientInfo {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  notes?: string;
}

export interface PropertyInfo {
  city: string;
  district: string;
  neighborhood: string;
  fullAddress: string;
  ada: string;
  parsel: string;
  pafta?: string;
  totalFloors?: number | string;
  buildingCount?: number;
  totalArea?: number;
  buildingType: 'Betonarme' | 'Yığma' | 'Çelik' | 'Karma' | 'Diğer';
  usagePurpose: 'Konut' | 'İşyeri' | 'Karma' | 'Kamu/Okul/Hastane' | 'Diğer';
  hasAsBuiltProject: 'Evet var' | 'Hayır yok (Röleve Alınacak)' | 'Kısmen var';
}

export interface GuclendirmeParams {
  buildingCount: number; // Yapı Sayısı (Adet)
  totalArea: number; // Toplam İnşaat Alanı (m²)
  
  // 1. Aşama Parametreleri
  sondajCount: number;
  sondajUnitPrice: number;
  sondajIncluded: boolean;
  sondajTotal: number;

  temelCukuruCount: number;
  temelCukuruUnitPrice: number;
  temelCukuruIncluded: boolean;
  temelCukuruTotal: number;

  avanProjeCalcType: 'building' | 'area' | 'fixed';
  avanProjeUnitPrice: number;
  avanProjeIncluded: boolean;
  avanProjeTotal: number;

  stage1Total: number;

  // 2. Aşama Parametreleri (Opsiyonel / Checkbox ile seçilebilir)
  statikDetayEnabled: boolean;
  statikDetayCalcType: 'area' | 'fixed';
  statikDetayUnitPrice: number;
  statikDetayTotal: number;

  elektrikMekanikEnabled: boolean;
  elektrikMekanikCalcType: 'area' | 'fixed';
  elektrikMekanikUnitPrice: number;
  elektrikMekanikTotal: number;

  mimariTadilatEnabled: boolean;
  mimariTadilatCalcType: 'area' | 'fixed';
  mimariTadilatUnitPrice: number;
  mimariTadilatTotal: number;

  ituOnayEnabled: boolean;
  ituOnayCalcType: 'fixed' | 'area';
  ituOnayUnitPrice: number;
  ituOnayTotal: number;

  stage2Total: number;
  grandTotal: number; // 1. Aşama + 2. Aşama Toplamı (KDV Hariç)

  // Ekstra Aliases (Geniş uyumluluk için)
  sondajAdedi?: number;
  sondajBirimFiyat?: number;
  temelCukuruAdedi?: number;
  temelCukuruBirimFiyat?: number;
  avanProjeBirimFiyat?: number;
  statikDetayBirimM2Fiyat?: number;
  mekanikElektrikSecili?: boolean;
  mekanikElektrikBirimM2Fiyat?: number;
  mimariTadilatSecili?: boolean;
  mimariTadilatBirimM2Fiyat?: number;
  ituOnaySecili?: boolean;
  ituOnayTutari?: number;
}

export interface PricingInfo {
  unitPrice: number;
  pricingMethod: 'toplam_sabit' | 'kat_basi';
  subtotal: number;
  vatRate: number; // e.g. 20 or 10
  discount: number;
  totalAmount: number;
  currency: string;
}

export interface PaymentTerms {
  advanceRatio: number; // e.g. 50 (%)
  uponDeliveryRatio: number; // e.g. 50 (%)
  completionWorkDays: number; // e.g. 7
  validityDays: number; // e.g. 15
  customNotes: string;
}

export interface Proposal {
  id: string;
  proposalNumber: string; // e.g. T-2026-001
  type: ProposalType;
  title: string;
  status: ProposalStatus;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
  client: ClientInfo;
  property: PropertyInfo;
  scopeItems: ScopeItem[];
  pricing: PricingInfo;
  paymentTerms: PaymentTerms;
  revisionNumber: number;
  guclendirme?: GuclendirmeParams;
}

export interface CompanyProfile {
  name: string;
  title: string;
  imoNumber: string; // İMO / ODTÜ / Mimar Oda Sicil No
  phone: string;
  email: string;
  address: string;
  website: string;
  logoUrl?: string; // Base64 or URL
  stampUrl?: string; // Signature/Stamp image
  bankInfo?: string; // IBAN etc.
  defaultNote?: string;
}
