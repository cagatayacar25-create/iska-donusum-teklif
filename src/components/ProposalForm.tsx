import React, { useState, useEffect } from 'react';
import { Proposal, ProposalType, ScopeItem, GuclendirmeParams, PaymentStatus, PaymentInstallment } from '../types';
import { PROPOSAL_TYPE_LABELS, DEFAULT_SCOPES, DEFAULT_GUCLENDIRME_PARAMS, PAYMENT_STATUS_LABELS } from '../data/defaultTemplates';
import { CITIES, ISTANBUL_DISTRICTS, ISTANBUL_NEIGHBORHOODS } from '../data/istanbulData';
import { 
  Building2, 
  MapPin, 
  User, 
  CheckSquare, 
  Calculator, 
  Save, 
  Eye, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  AlertCircle,
  FileCheck,
  Check,
  Layers,
  Wrench,
  Sparkles,
  CreditCard,
  Clock,
  CheckCircle2,
  FolderCheck,
  Calendar
} from 'lucide-react';

interface ProposalFormProps {
  proposal: Proposal;
  onSave: (updated: Proposal, previewAfterSave: boolean) => void;
  onCancel: () => void;
  onOpenCalculator: () => void;
}

const normalizeTr = (str?: string): string => {
  if (!str) return '';
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'c')
    .toLowerCase();
};

const isIstanbulCity = (cityName?: string): boolean => {
  if (!cityName) return true;
  const c = cityName.trim();
  if (c === 'İstanbul' || c === 'istanbul' || c === 'ISTANBUL') return true;
  const norm = normalizeTr(c);
  return norm.includes('istanb') || norm.includes('ist');
};

const matchIstanbulDistrict = (distStr?: string): string => {
  if (!distStr) return 'Kadıköy';
  if (ISTANBUL_DISTRICTS.includes(distStr)) return distStr;
  const normTarget = normalizeTr(distStr);
  const match = ISTANBUL_DISTRICTS.find((d) => {
    const normD = normalizeTr(d);
    return normTarget.includes(normD) || normD.includes(normTarget);
  });
  return match || 'Kadıköy';
};

const matchIstanbulNeighborhood = (distStr?: string, neighStr?: string): string => {
  const matchedDist = matchIstanbulDistrict(distStr);
  const neighs = ISTANBUL_NEIGHBORHOODS[matchedDist] || [];
  if (neighs.length === 0) return neighStr || '';
  if (neighStr && neighs.includes(neighStr)) return neighStr;
  if (neighStr) {
    const normTarget = normalizeTr(neighStr);
    const match = neighs.find((m) => {
      const normM = normalizeTr(m);
      return normTarget.includes(normM) || normM.includes(normTarget);
    });
    if (match) return match;
  }
  return neighs[0] || '';
};

export const ProposalForm: React.FC<ProposalFormProps> = ({
  proposal,
  onSave,
  onCancel,
  onOpenCalculator,
}) => {
  const [formData, setFormData] = useState<Proposal>(proposal);
  const [activeTab, setActiveTab] = useState<'client' | 'property' | 'scope' | 'pricing'>('property');
  const [newScopeTitle, setNewScopeTitle] = useState('');
  const [newScopeDesc, setNewScopeDesc] = useState('');

  // Sync state if proposal prop changes & auto-assign valid Istanbul district/neighborhood if city is Istanbul
  useEffect(() => {
    let prop = { ...proposal };
    if (!prop.property?.city || isIstanbulCity(prop.property.city)) {
      const validCity = 'İstanbul';
      const validDistrict = matchIstanbulDistrict(prop.property?.district);
      const validNeigh = matchIstanbulNeighborhood(validDistrict, prop.property?.neighborhood);
      prop = {
        ...prop,
        property: {
          ...prop.property,
          city: validCity,
          district: validDistrict,
          neighborhood: validNeigh,
        },
      };
    }
    if (prop.type === 'statik_guclendirme' && !prop.guclendirme) {
      prop = {
        ...prop,
        guclendirme: { ...DEFAULT_GUCLENDIRME_PARAMS },
      };
    }
    setFormData(prop);
  }, [proposal]);

  // Recalculate Guclendirme totals helper
  const calcGuclendirmeState = (
    currentGuc: GuclendirmeParams,
    buildingCount: number,
    totalArea: number,
    vatRate: number = 20,
    discount: number = 0
  ) => {
    const sondajTotal = currentGuc.sondajIncluded ? (currentGuc.sondajCount || 0) * (currentGuc.sondajUnitPrice || 0) : 0;
    const temelCukuruTotal = currentGuc.temelCukuruIncluded ? (currentGuc.temelCukuruCount || 0) * (currentGuc.temelCukuruUnitPrice || 0) : 0;
    
    let avanProjeTotal = 0;
    if (currentGuc.avanProjeIncluded) {
      if (currentGuc.avanProjeCalcType === 'building') {
        avanProjeTotal = (buildingCount || 1) * (currentGuc.avanProjeUnitPrice || 0);
      } else if (currentGuc.avanProjeCalcType === 'area') {
        avanProjeTotal = (totalArea || 0) * (currentGuc.avanProjeUnitPrice || 0);
      } else {
        avanProjeTotal = currentGuc.avanProjeUnitPrice || 0;
      }
    }

    const stage1Total = sondajTotal + temelCukuruTotal + avanProjeTotal;

    const statikDetayTotal = currentGuc.statikDetayEnabled 
      ? (currentGuc.statikDetayCalcType === 'area' ? (totalArea || 0) * (currentGuc.statikDetayUnitPrice || 0) : (currentGuc.statikDetayUnitPrice || 0))
      : 0;

    const elektrikMekanikTotal = currentGuc.elektrikMekanikEnabled
      ? (currentGuc.elektrikMekanikCalcType === 'area' ? (totalArea || 0) * (currentGuc.elektrikMekanikUnitPrice || 0) : (currentGuc.elektrikMekanikUnitPrice || 0))
      : 0;

    const mimariTadilatTotal = currentGuc.mimariTadilatEnabled
      ? (currentGuc.mimariTadilatCalcType === 'area' ? (totalArea || 0) * (currentGuc.mimariTadilatUnitPrice || 0) : (currentGuc.mimariTadilatUnitPrice || 0))
      : 0;

    const ituOnayTotal = currentGuc.ituOnayEnabled
      ? (currentGuc.ituOnayCalcType === 'area' ? (totalArea || 0) * (currentGuc.ituOnayUnitPrice || 0) : (currentGuc.ituOnayUnitPrice || 0))
      : 0;

    const stage2Total = statikDetayTotal + elektrikMekanikTotal + mimariTadilatTotal + ituOnayTotal;
    const grandTotal = stage1Total + stage2Total;

    const finalGuclendirme: GuclendirmeParams = {
      ...currentGuc,
      buildingCount,
      totalArea,
      sondajTotal,
      temelCukuruTotal,
      avanProjeTotal,
      stage1Total,
      statikDetayTotal,
      elektrikMekanikTotal,
      mimariTadilatTotal,
      ituOnayTotal,
      stage2Total,
      grandTotal,
    };

    const subtotal = grandTotal;
    const afterDiscount = Math.max(0, subtotal - discount);
    const totalAmount = Math.round(afterDiscount * (1 + vatRate / 100));

    return {
      finalGuclendirme,
      subtotal,
      totalAmount,
    };
  };

  // Update Guclendirme Field
  const updateGuclendirme = (changes: Partial<GuclendirmeParams>) => {
    setFormData((prev) => {
      const guc = prev.guclendirme || { ...DEFAULT_GUCLENDIRME_PARAMS };
      const merged: GuclendirmeParams = { ...guc, ...changes };
      const bCount = merged.buildingCount ?? prev.property.buildingCount ?? 2;
      const tArea = merged.totalArea ?? prev.property.totalArea ?? 4500;
      const vat = prev.pricing.vatRate !== undefined ? prev.pricing.vatRate : 20;
      const disc = prev.pricing.discount || 0;

      const { finalGuclendirme, subtotal, totalAmount } = calcGuclendirmeState(
        merged,
        bCount,
        tArea,
        vat,
        disc
      );

      return {
        ...prev,
        property: {
          ...prev.property,
          buildingCount: bCount,
          totalArea: tArea,
        },
        guclendirme: finalGuclendirme,
        pricing: {
          ...prev.pricing,
          unitPrice: finalGuclendirme.avanProjeUnitPrice,
          subtotal,
          totalAmount,
        },
      };
    });
  };

  // Handle Proposal Type change and auto-update default scope if user confirms
  const handleTypeChange = (newType: ProposalType) => {
    if (newType === formData.type) return;
    
    const confirmChange = window.confirm(
      'Teklif türünü değiştirmek varsayılan hizmet kapsamını güncelleyecektir. Devam etmek istiyor musunuz?'
    );
    if (!confirmChange) return;

    const defaultTitle = newType === 'riskli_yapi'
      ? 'Riskli Yapı Tespiti Teklifi'
      : newType === 'orta_katli_risk'
      ? 'Orta Katlı Bina Risk İnceleme Teklifi'
      : newType === 'statik_guclendirme'
      ? 'Statik Güçlendirme Avan ve Detay Projeleri Teklifi'
      : 'Bina Deprem Performans Raporu Teklifi';

    if (newType === 'statik_guclendirme') {
      const initialGuc = formData.guclendirme || { ...DEFAULT_GUCLENDIRME_PARAMS };
      const bCount = formData.property.buildingCount || initialGuc.buildingCount || 2;
      const tArea = formData.property.totalArea || initialGuc.totalArea || 4500;
      const { finalGuclendirme, subtotal, totalAmount } = calcGuclendirmeState(
        initialGuc,
        bCount,
        tArea,
        formData.pricing.vatRate || 20,
        formData.pricing.discount || 0
      );

      setFormData((prev) => ({
        ...prev,
        type: newType,
        title: defaultTitle,
        property: {
          ...prev.property,
          buildingCount: bCount,
          totalArea: tArea,
        },
        guclendirme: finalGuclendirme,
        scopeItems: JSON.parse(JSON.stringify(DEFAULT_SCOPES[newType])),
        pricing: {
          ...prev.pricing,
          pricingMethod: 'toplam_sabit',
          unitPrice: finalGuclendirme.avanProjeUnitPrice,
          subtotal,
          totalAmount,
        },
      }));
      return;
    }

    const isPerformans = newType === 'performans_raporu';
    const isOrtaKatli = newType === 'orta_katli_risk';
    const defaultPricingMethod = (isOrtaKatli || isPerformans) ? 'kat_basi' : 'toplam_sabit';
    const defaultUnitPrice = (isOrtaKatli || isPerformans) ? 30000 : 45000;
    let floors = Number(formData.property.totalFloors) || (isOrtaKatli ? 10 : 6);
    if (isOrtaKatli && floors < 10) {
      floors = 10;
    }
    const subtotal = defaultPricingMethod === 'kat_basi' ? defaultUnitPrice * floors : defaultUnitPrice;
    const discount = formData.pricing.discount || 0;
    const vatRate = formData.pricing.vatRate || 20;
    const afterDiscount = Math.max(0, subtotal - discount);
    const totalAmount = Math.round(afterDiscount * (1 + vatRate / 100));

    setFormData((prev) => ({
      ...prev,
      type: newType,
      title: defaultTitle,
      property: {
        ...prev.property,
        totalFloors: floors,
      },
      scopeItems: JSON.parse(JSON.stringify(DEFAULT_SCOPES[newType])),
      pricing: {
        ...prev.pricing,
        pricingMethod: defaultPricingMethod,
        unitPrice: defaultUnitPrice,
        subtotal,
        discount,
        totalAmount,
      },
    }));
  };

  const handleSaveProposal = (previewAfterSave: boolean) => {
    if (formData.type === 'orta_katli_risk' && (Number(formData.property.totalFloors) < 10)) {
      alert('Orta katlı bina riskli yapı tespiti için bina en az 10 katlı olmalıdır! Lütfen kat sayısını en az 10 olarak düzenleyiniz.');
      return;
    }
    onSave(formData, previewAfterSave);
  };

  // Recalculate totals whenever pricing fields, floor count, or method change
  const updatePricing = (field: string, value: any) => {
    setFormData((prev) => {
      const newPricing = { ...prev.pricing };
      let updatedFloors = Number(prev.property.totalFloors) || 1;

      if (field === 'floors') {
        updatedFloors = Number(value) || 0;
      } else {
        (newPricing as Record<string, any>)[field] = value;
      }

      if (field === 'invoiceType') {
        const isFaturasiz = value === 'faturasiz';
        newPricing.invoiceType = value;
        newPricing.isWithoutVat = isFaturasiz;
        newPricing.vatRate = isFaturasiz ? 0 : 20;
      } else if (field === 'isWithoutVat') {
        const isFaturasiz = Boolean(value);
        newPricing.isWithoutVat = isFaturasiz;
        newPricing.invoiceType = isFaturasiz ? 'faturasiz' : 'faturali';
        newPricing.vatRate = isFaturasiz ? 0 : 20;
      } else if (field === 'vatRate') {
        const rate = Number(value);
        newPricing.vatRate = rate;
        newPricing.isWithoutVat = rate === 0;
        newPricing.invoiceType = rate === 0 ? 'faturasiz' : 'faturali';
      }

      const unitPrice = field === 'unitPrice' ? Number(value) || 0 : newPricing.unitPrice || 0;
      const method = field === 'pricingMethod' ? value : newPricing.pricingMethod;
      const isRiskli = prev.type === 'riskli_yapi';
      const kollukIncluded = field === 'kollukKuvvetiIncluded' 
        ? Boolean(value) 
        : Boolean(newPricing.kollukKuvvetiIncluded);
      const kollukPrice = field === 'kollukKuvvetiPrice'
        ? Number(value) || 0
        : Number(newPricing.kollukKuvvetiPrice ?? 25000);

      newPricing.kollukKuvvetiIncluded = kollukIncluded;
      newPricing.kollukKuvvetiPrice = kollukPrice;

      let baseSubtotal = 0;
      if (method === 'kat_basi') {
        baseSubtotal = Math.round(unitPrice * (updatedFloors || 1));
      } else {
        baseSubtotal = Math.round(unitPrice);
      }

      if (isRiskli && kollukIncluded) {
        newPricing.subtotal = baseSubtotal + kollukPrice;
      } else {
        newPricing.subtotal = baseSubtotal;
      }

      if (field === 'discountedPrice') {
        const discountedVal = Math.max(0, Number(value) || 0);
        newPricing.discount = Math.max(0, newPricing.subtotal - discountedVal);
      } else if (field === 'discount') {
        newPricing.discount = Math.max(0, Number(value) || 0);
      }

      const afterDiscount = Math.max(0, newPricing.subtotal - (newPricing.discount || 0));
      const vatRate = newPricing.isWithoutVat ? 0 : (newPricing.vatRate || 0);
      const vatAmount = (afterDiscount * vatRate) / 100;
      newPricing.totalAmount = Math.round(afterDiscount + vatAmount);

      // Sync scope item ry10 with kollukKuvvetiIncluded if it exists in scopeItems
      let updatedScopeItems = prev.scopeItems;
      if (field === 'kollukKuvvetiIncluded' && isRiskli) {
        const hasRy10 = prev.scopeItems.some(i => i.id === 'ry10');
        if (hasRy10) {
          updatedScopeItems = prev.scopeItems.map(i => 
            i.id === 'ry10' ? { ...i, included: kollukIncluded } : i
          );
        }
      }

      return {
        ...prev,
        property: {
          ...prev.property,
          totalFloors: field === 'floors' ? (updatedFloors || '') : prev.property.totalFloors,
        },
        scopeItems: updatedScopeItems,
        pricing: newPricing,
      };
    });
  };

  // Toggle scope item
  const toggleScopeItem = (id: string) => {
    setFormData((prev) => {
      const nextIncluded = !prev.scopeItems.find(i => i.id === id)?.included;
      const updatedScope = prev.scopeItems.map((item) =>
        item.id === id ? { ...item, included: nextIncluded } : item
      );

      if (id === 'ry10' && prev.type === 'riskli_yapi') {
        const newPricing = { ...prev.pricing };
        newPricing.kollukKuvvetiIncluded = nextIncluded;
        const kollukPrice = Number(newPricing.kollukKuvvetiPrice ?? 25000);
        newPricing.kollukKuvvetiPrice = kollukPrice;
        const baseSubtotal = Math.round(newPricing.unitPrice || 0);
        newPricing.subtotal = nextIncluded ? baseSubtotal + kollukPrice : baseSubtotal;
        const afterDiscount = Math.max(0, newPricing.subtotal - (newPricing.discount || 0));
        const vatAmount = (afterDiscount * (newPricing.vatRate || 0)) / 100;
        newPricing.totalAmount = Math.round(afterDiscount + vatAmount);

        return {
          ...prev,
          scopeItems: updatedScope,
          pricing: newPricing,
        };
      }

      return {
        ...prev,
        scopeItems: updatedScope,
      };
    });
  };

  // Add custom scope item
  const handleAddScopeItem = () => {
    if (!newScopeTitle.trim()) return;
    const newItem: ScopeItem = {
      id: 'custom_' + Date.now(),
      title: newScopeTitle.trim(),
      description: newScopeDesc.trim() || 'Saha sözleşmesi kapsamında özel hizmet.',
      included: true,
    };
    setFormData((prev) => ({
      ...prev,
      scopeItems: [...prev.scopeItems, newItem],
    }));
    setNewScopeTitle('');
    setNewScopeDesc('');
  };

  // Delete scope item
  const handleDeleteScopeItem = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      scopeItems: prev.scopeItems.filter((i) => i.id !== id),
    }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition"
            title="Listeye Dön"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-amber-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded">
                {formData.proposalNumber}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {formData.id.startsWith('demo') ? 'Örnek Teklif' : 'Teklif Düzenleyici'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mt-0.5">
              {formData.title || 'Yeni Teklif Hazırla'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => handleSaveProposal(false)}
            className="flex-1 md:flex-none px-4 py-2 text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Taslak Kaydet
          </button>

          <button
            type="button"
            onClick={() => handleSaveProposal(true)}
            className="flex-1 md:flex-none px-5 py-2 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Kaydet & PDF Önizle
          </button>
        </div>
      </div>

      {/* 1. Proposal Type Selection Tabs */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
          1. Teklif Türünü Seçin *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(['riskli_yapi', 'orta_katli_risk', 'performans_raporu', 'statik_guclendirme'] as ProposalType[]).map((type) => {
            const info = PROPOSAL_TYPE_LABELS[type];
            const isSelected = formData.type === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => handleTypeChange(type)}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isSelected 
                    ? 'border-amber-500 bg-amber-50/60 ring-2 ring-amber-500/30 shadow-sm' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border inline-block mb-1.5 ${info.tagColor}`}>
                    {type === 'riskli_yapi' ? '6306 Kanunu' : type === 'orta_katli_risk' ? 'Orta Katlı' : type === 'statik_guclendirme' ? 'Güçlendirme' : 'TBDY 2018'}
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 leading-snug">{info.name}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{info.description}</p>
                </div>
                {isSelected && (
                  <div className="mt-2 flex items-center text-[11px] font-bold text-amber-800">
                    <Check className="w-3.5 h-3.5 mr-1" /> Seçili Şablon
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Form Step Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-2xl px-2 pt-2">
        <button
          onClick={() => setActiveTab('property')}
          className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'property'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4 text-amber-600" />
          Konum & Ada / Parsel
          <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded text-[10px]">Önemli</span>
        </button>

        <button
          onClick={() => setActiveTab('client')}
          className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'client'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4 text-blue-600" />
          Müşteri Bilgileri
        </button>

        <button
          onClick={() => setActiveTab('scope')}
          className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'scope'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-emerald-600" />
          Hizmet Kapsamı ({formData.scopeItems.filter(i => i.included).length})
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`py-3 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeTab === 'pricing'
              ? 'border-amber-500 text-amber-900 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calculator className="w-4 h-4 text-purple-600" />
          Fiyat & Şartlar ({formData.pricing.totalAmount.toLocaleString('tr-TR')} TL)
        </button>
      </div>

      {/* 3. Form Content Panels */}
      <div className="bg-white rounded-b-2xl p-6 shadow-sm border-x border-b border-slate-200">
        
        {/* PANEL A: Konum & Ada / Parsel Bilgileri */}
        {activeTab === 'property' && (
          <div className="space-y-6">
            
            {/* Ada / Parsel Highlight Card */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-900 mb-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700" />
                Tapu & Taşınmaz Kimlik Bilgileri (Resmî Evrak İçin)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    ADA NO *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.property.ada}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        property: { ...formData.property, ada: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-black font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Örn: 1248"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                    PARSEL NO *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.property.parsel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        property: { ...formData.property, parsel: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg text-sm font-black font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Örn: 15"
                  />
                </div>
              </div>
            </div>

            {/* Address fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* İl (City) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">İl *</label>
                <select
                  required
                  value={
                    isIstanbulCity(formData.property.city)
                      ? 'İstanbul'
                      : CITIES.includes(formData.property.city)
                      ? formData.property.city
                      : 'İstanbul'
                  }
                  onChange={(e) => {
                    const newCity = e.target.value;
                    const isIst = isIstanbulCity(newCity);
                    const matchedDist = isIst ? matchIstanbulDistrict(formData.property.district) : formData.property.district;
                    const matchedNeigh = isIst ? matchIstanbulNeighborhood(matchedDist, formData.property.neighborhood) : formData.property.neighborhood;
                    setFormData((prev) => ({
                      ...prev,
                      property: {
                        ...prev.property,
                        city: newCity,
                        district: matchedDist,
                        neighborhood: matchedNeigh,
                      },
                    }));
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* İlçe (District) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">İlçe *</label>
                  {isIstanbulCity(formData.property.city) && (
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      39 İlçe Otomatik
                    </span>
                  )}
                </div>

                {isIstanbulCity(formData.property.city) ? (
                  <select
                    required
                    value={matchIstanbulDistrict(formData.property.district)}
                    onChange={(e) => {
                      const newDistrict = e.target.value;
                      const defaultNeigh = matchIstanbulNeighborhood(newDistrict, '');
                      setFormData((prev) => ({
                        ...prev,
                        property: {
                          ...prev.property,
                          district: newDistrict,
                          neighborhood: defaultNeigh,
                        },
                      }));
                    }}
                    className="w-full px-3 py-2 bg-amber-50/50 border border-amber-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
                  >
                    {ISTANBUL_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={formData.property.district}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        property: { ...formData.property, district: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Kadıköy"
                  />
                )}
              </div>

              {/* Mahalle (Neighborhood) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase">Mahalle</label>
                  {isIstanbulCity(formData.property.city) && (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {(ISTANBUL_NEIGHBORHOODS[matchIstanbulDistrict(formData.property.district)] || []).length} Mahalle
                    </span>
                  )}
                </div>

                {isIstanbulCity(formData.property.city) ? (
                  <select
                    value={matchIstanbulNeighborhood(
                      formData.property.district,
                      formData.property.neighborhood
                    )}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        property: { ...formData.property, neighborhood: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none shadow-sm"
                  >
                    {(
                      ISTANBUL_NEIGHBORHOODS[
                        matchIstanbulDistrict(formData.property.district)
                      ] || []
                    ).map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData.property.neighborhood}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        property: { ...formData.property, neighborhood: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Göztepe Mah."
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Açık Adres *</label>
              <textarea
                rows={2}
                required
                value={formData.property.fullAddress}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    property: { ...formData.property, fullAddress: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Caddesi, Sokak No, Apartman Adı"
              />
            </div>

            {/* Building Technical Traits */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-600" />
                Bina Yapısal ve Boyutsal Özellikleri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                {/* Yapı Sayısı (Adet) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Yapı Sayısı (Adet) {formData.type === 'statik_guclendirme' && <span className="text-amber-600">*</span>}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.property.buildingCount || (formData.type === 'statik_guclendirme' ? 2 : 1)}
                    onChange={(e) => {
                      const count = Number(e.target.value) || 1;
                      if (formData.type === 'statik_guclendirme') {
                        updateGuclendirme({ buildingCount: count });
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          property: { ...prev.property, buildingCount: count }
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="2"
                  />
                </div>

                {/* Toplam İnşaat Alanı (m2) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Toplam İnşaat Alanı (m²) {formData.type === 'statik_guclendirme' && <span className="text-amber-600">*</span>}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.property.totalArea || (formData.type === 'statik_guclendirme' ? 4500 : '')}
                    onChange={(e) => {
                      const area = Number(e.target.value) || 0;
                      if (formData.type === 'statik_guclendirme') {
                        updateGuclendirme({ totalArea: area });
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          property: { ...prev.property, totalArea: area }
                        }));
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="4500"
                  />
                </div>

                {/* Kat Sayısı */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Kat Sayısı {formData.type === 'orta_katli_risk' && <span className="text-amber-700 font-bold">(En az 10 Kat)</span>}
                    {formData.type === 'riskli_yapi' && <span className="text-blue-700 font-semibold text-[10px] ml-1">(Konu/Raporda yer alır)</span>}
                  </label>
                  <input
                    type="number"
                    min={formData.type === 'orta_katli_risk' ? 10 : 1}
                    value={formData.property.totalFloors || ''}
                    onChange={(e) => updatePricing('floors', Number(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none ${
                      formData.type === 'orta_katli_risk' && Number(formData.property.totalFloors) < 10
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-slate-300'
                    }`}
                    placeholder="8"
                  />
                  {formData.type === 'orta_katli_risk' && Number(formData.property.totalFloors) < 10 && (
                    <p className="text-[10px] font-bold text-amber-700 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      Orta katlı için en az 10 kat gereklidir.
                    </p>
                  )}
                  {formData.type === 'riskli_yapi' && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      * Riskli yapıda fiyat toplam götürü verilir, hesap tablosunda kat çarpımı yapılmaz.
                    </p>
                  )}
                </div>

                {/* Pafta / Bölge */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Pafta / Sanayi Bölgesi
                  </label>
                  <input
                    type="text"
                    value={formData.property.pafta || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        property: { ...formData.property, pafta: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="Örn: 24-N-II veya OSB 3. Cad."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Yapı Taşıyıcı Tipi</label>
                  <select
                    value={formData.property.buildingType}
                    onChange={(e: any) =>
                      setFormData({
                        ...formData,
                        property: { ...formData.property, buildingType: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="Betonarme">Betonarme Karkas</option>
                    <option value="Yığma">Yığma (Tuğla/Taş)</option>
                    <option value="Çelik">Çelik Yapı</option>
                    <option value="Karma">Karma / Ahşap</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Kullanım Amacı</label>
                  <select
                    value={formData.property.usagePurpose}
                    onChange={(e: any) =>
                      setFormData({
                        ...formData,
                        property: { ...formData.property, usagePurpose: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="Konut">Konut (Apartman/Müstakil)</option>
                    <option value="İşyeri">İşyeri / Plaza / Ticari</option>
                    <option value="Karma">Karma (Konut + Dükkan)</option>
                    <option value="Kamu/Okul/Hastane">Kamu / Okul / Hastane</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Mevcut Proje Durumu</label>
                  <select
                    value={formData.property.hasAsBuiltProject}
                    onChange={(e: any) =>
                      setFormData({
                        ...formData,
                        property: { ...formData.property, hasAsBuiltProject: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="Hayır yok (Röleve Alınacak)">Hayır yok (Röleve Çizilecek)</option>
                    <option value="Evet var">Evet var (Statik Proje Mevcut)</option>
                    <option value="Kısmen var">Kısmen var (Sadece Mimari Var)</option>
                  </select>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* PANEL B: Müşteri Bilgileri */}
        {activeTab === 'client' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Müşteri / Firma / Site Adı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.client.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Örn: Yılmaz Apartmanı Kat Malikleri"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Muhatap / Yetkili Kişi
                </label>
                <input
                  type="text"
                  value={formData.client.contactPerson}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, contactPerson: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Örn: Ahmet Yılmaz (Bina Yöneticisi)"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Telefon Numarası *
                </label>
                <input
                  type="text"
                  required
                  value={formData.client.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, phone: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="0532 123 45 67"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  value={formData.client.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      client: { ...formData.client, email: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="ahmet@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Özel Müşteri / Görüşme Notları
              </label>
              <textarea
                rows={3}
                value={formData.client.notes || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    client: { ...formData.client, notes: e.target.value },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Örn: 2. kat karot örneği için bina sakini randevulu gelebileceğini iletti."
              />
            </div>
          </div>
        )}

        {/* PANEL C: Hizmet Kapsamı Checkbox'ları */}
        {activeTab === 'scope' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Teklife Dahil Edilecek İş Kalemleri</h3>
                <p className="text-xs text-slate-500">Müşteriye sunulacak saha ve laboratuvar işlemlerini işaretleyin.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({
                    ...formData,
                    scopeItems: JSON.parse(JSON.stringify(DEFAULT_SCOPES[formData.type])),
                  })
                }
                className="text-xs text-amber-700 hover:underline font-semibold"
              >
                Varsayılana Sıfırla
              </button>
            </div>

            <div className="space-y-2.5">
              {formData.scopeItems.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => toggleScopeItem(item.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    item.included
                      ? 'bg-emerald-50/50 border-emerald-300 text-slate-900'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={item.included}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-bold">{item.title}</div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{item.description}</div>
                  </div>
                  {item.id.startsWith('custom_') && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScopeItem(item.id);
                      }}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Custom scope item adder */}
            <div className="pt-4 border-t border-slate-200 bg-slate-50 p-4 rounded-xl">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Özel Hizmet Kalemi Ekle</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  value={newScopeTitle}
                  onChange={(e) => setNewScopeTitle(e.target.value)}
                  placeholder="Başlık (Örn: Zemin Sismik Kırılma Testi)"
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                />
                <input
                  type="text"
                  value={newScopeDesc}
                  onChange={(e) => setNewScopeDesc(e.target.value)}
                  placeholder="Açıklama"
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleAddScopeItem}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Listeye Ekle
              </button>
            </div>

          </div>
        )}

        {/* PANEL D: Fiyatlandırma & Şartlar */}
        {activeTab === 'pricing' && (
          <div className="space-y-6">
            
            {/* Quick Estimator Trigger (for Risk/Performans) */}
            {formData.type !== 'statik_guclendirme' && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-bold text-amber-950">Fiyat Hesabından Emin Değil Misiniz?</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenCalculator}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
                >
                  Saha Robotunu Çalıştır
                </button>
              </div>
            )}

            {formData.type === 'statik_guclendirme' ? (
              /* ======================================================== */
              /* STATİK GÜÇLENDİRME PROJESİ AŞAMALI FİYAT HESAPLAMA PANELİ */
              /* ======================================================== */
              <div className="space-y-6">
                
                {/* Proje Özet Bilgi Şeridi */}
                <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                        Güçlendirme Projesi Hesap Parametreleri
                      </h4>
                      <p className="text-xs text-slate-300">
                        {formData.property.buildingCount || 2} Adet Yapı | {formData.property.totalArea ? `${formData.property.totalArea.toLocaleString('tr-TR')} m² Toplam Alan` : 'Alan Belirtilmemiş'} | {formData.property.city} / {formData.property.district}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">1. Aşama + 2. Aşama Toplamı</span>
                    <span className="text-lg font-black font-mono text-amber-400">
                      {formData.pricing.subtotal.toLocaleString('tr-TR')} TL
                    </span>
                  </div>
                </div>

                {/* 1. AŞAMA KUTUSU */}
                <div className="border-2 border-blue-900 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="bg-blue-950 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-400 text-blue-950 text-xs font-black px-2 py-0.5 rounded">1. AŞAMA</span>
                      <h3 className="text-xs font-black tracking-wide uppercase">
                        Bina Güçlendirme Avan Projesine İlişkin İşlemler
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-amber-400">
                        {(formData.guclendirme?.stage1Total || 0).toLocaleString('tr-TR')} TL
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 divide-y divide-slate-100">
                    
                    {/* 1.1 Sondaj ve Zemin Raporu */}
                    <div className="pt-2 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5 flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="sondajInc"
                          checked={formData.guclendirme?.sondajIncluded ?? true}
                          onChange={(e) => updateGuclendirme({ sondajIncluded: e.target.checked })}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="sondajInc" className="cursor-pointer">
                          <span className="text-xs font-bold text-slate-900 block">
                            1. Sondaja Dayalı Zemin ve Geoteknik Rapor
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Zemin sondajı ve laboratuvar geoteknik raporu
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Sondaj Adedi</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.guclendirme?.sondajCount ?? 6}
                          onChange={(e) => updateGuclendirme({ sondajCount: Number(e.target.value) || 0 })}
                          disabled={!formData.guclendirme?.sondajIncluded}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="6"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Birim Fiyat (TL/Adet)</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={formData.guclendirme?.sondajUnitPrice ?? 0}
                          onChange={(e) => updateGuclendirme({ sondajUnitPrice: Number(e.target.value) || 0 })}
                          disabled={!formData.guclendirme?.sondajIncluded}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0 (Fiyat Belirlenmedi)"
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Kalem Tutarı</span>
                        <span className="text-xs font-black font-mono text-slate-900">
                          {formData.guclendirme?.sondajIncluded && (formData.guclendirme?.sondajTotal || 0) > 0
                            ? `${(formData.guclendirme?.sondajTotal || 0).toLocaleString('tr-TR')} TL`
                            : '………… TL'}
                        </span>
                      </div>
                    </div>

                    {/* 1.2 Temel Muayene Çukuru */}
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5 flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="temelInc"
                          checked={formData.guclendirme?.temelCukuruIncluded ?? true}
                          onChange={(e) => updateGuclendirme({ temelCukuruIncluded: e.target.checked })}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="temelInc" className="cursor-pointer">
                          <span className="text-xs font-bold text-slate-900 block">
                            2. Temel Çukuru Açılarak Temel Sisteminin Belirlenmesi
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Temel tipi, donatı ve korozyon tespiti muayene çukuru
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Çukur Sayısı (Adet)</label>
                        <input
                          type="number"
                          min="0"
                          value={formData.guclendirme?.temelCukuruCount ?? 6}
                          onChange={(e) => updateGuclendirme({ temelCukuruCount: Number(e.target.value) || 0 })}
                          disabled={!formData.guclendirme?.temelCukuruIncluded}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="6"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Birim Fiyat (TL/Adet)</label>
                        <input
                          type="number"
                          min="0"
                          step="1000"
                          value={formData.guclendirme?.temelCukuruUnitPrice ?? 25000}
                          onChange={(e) => updateGuclendirme({ temelCukuruUnitPrice: Number(e.target.value) || 0 })}
                          disabled={!formData.guclendirme?.temelCukuruIncluded}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="25000"
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Kalem Tutarı</span>
                        <span className="text-xs font-black font-mono text-slate-900">
                          {formData.guclendirme?.temelCukuruIncluded && (formData.guclendirme?.temelCukuruTotal || 0) > 0
                            ? `${(formData.guclendirme?.temelCukuruTotal || 0).toLocaleString('tr-TR')} TL`
                            : '………… TL'}
                        </span>
                      </div>
                    </div>

                    {/* 1.3 Statik Avan Projelerinin Hazırlanması */}
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5 flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="avanInc"
                          checked={formData.guclendirme?.avanProjeIncluded ?? true}
                          onChange={(e) => updateGuclendirme({ avanProjeIncluded: e.target.checked })}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="avanInc" className="cursor-pointer">
                          <span className="text-xs font-bold text-slate-900 block">
                            3. Statik Güçlendirme Avan Projelerinin Hazırlanması
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Güçlendirme modelleri, keşif, yaklaşık maliyet & şartname
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Hesaplama Türü</label>
                        <select
                          value={formData.guclendirme?.avanProjeCalcType ?? 'building'}
                          onChange={(e: any) => updateGuclendirme({ avanProjeCalcType: e.target.value })}
                          disabled={!formData.guclendirme?.avanProjeIncluded}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="building">Yapı Başı Fiyat ({formData.property.buildingCount || 2} Yapı)</option>
                          <option value="area">m² Alan Başı ({formData.property.totalArea || 4500} m²)</option>
                          <option value="fixed">Götürü Toplam Sabit Fiyat</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          {formData.guclendirme?.avanProjeCalcType === 'area' ? 'Birim Fiyat (TL/m²)' : formData.guclendirme?.avanProjeCalcType === 'building' ? 'Birim Fiyat (TL/Yapı)' : 'Sabit Tutar (TL)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="5000"
                          value={formData.guclendirme?.avanProjeUnitPrice ?? 225000}
                          onChange={(e) => updateGuclendirme({ avanProjeUnitPrice: Number(e.target.value) || 0 })}
                          disabled={!formData.guclendirme?.avanProjeIncluded}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="225000"
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Kalem Tutarı</span>
                        <span className="text-xs font-black font-mono text-slate-900">
                          {formData.guclendirme?.avanProjeIncluded && (formData.guclendirme?.avanProjeTotal || 0) > 0
                            ? `${(formData.guclendirme?.avanProjeTotal || 0).toLocaleString('tr-TR')} TL`
                            : '………… TL'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* 1. Aşama Alt Toplam Çizgisi */}
                  <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">1. AŞAMA TOPLAM TEKLİF TUTARI:</span>
                    <span className="text-blue-950 font-mono font-black text-sm">
                      {(formData.guclendirme?.stage1Total || 0).toLocaleString('tr-TR')} TL
                    </span>
                  </div>
                </div>

                {/* 2. AŞAMA KUTUSU (OPSİYONEL / SEÇİLEBİLİR) */}
                <div className="border-2 border-slate-400 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="bg-slate-800 text-white px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-200 text-slate-900 text-xs font-black px-2 py-0.5 rounded">2. AŞAMA</span>
                      <h3 className="text-xs font-black tracking-wide uppercase">
                        Statik Detay Sürecine İlişkin İşlemler (Opsiyonel / Seçmeli)
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-amber-300">
                        {(formData.guclendirme?.stage2Total || 0) > 0 
                          ? `${(formData.guclendirme?.stage2Total || 0).toLocaleString('tr-TR')} TL` 
                          : '………… TL (Teklife Dahil Edilmedi)'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5 space-y-4 divide-y divide-slate-100">
                    
                    {/* 2.1 Statik Detay Projeleri */}
                    <div className="pt-2 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5 flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="statikDetayCheck"
                          checked={formData.guclendirme?.statikDetayEnabled ?? false}
                          onChange={(e) => updateGuclendirme({ statikDetayEnabled: e.target.checked })}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="statikDetayCheck" className="cursor-pointer">
                          <span className="text-xs font-bold text-slate-900 block">
                            1. Statik Güçlendirme Detay Projelerinin Hazırlanması
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Uygulama paftaları, detay çizimleri ve onay projeleri
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Hesaplama Şekli</label>
                        <select
                          value={formData.guclendirme?.statikDetayCalcType ?? 'area'}
                          onChange={(e: any) => updateGuclendirme({ statikDetayCalcType: e.target.value })}
                          disabled={!formData.guclendirme?.statikDetayEnabled}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="area">m² Birim Fiyatı ({formData.property.totalArea || 4500} m²)</option>
                          <option value="fixed">Götürü Sabit Fiyat</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          {formData.guclendirme?.statikDetayCalcType === 'area' ? 'TL / m²' : 'Tutar (TL)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.guclendirme?.statikDetayUnitPrice ?? 0}
                          onChange={(e) => updateGuclendirme({ statikDetayUnitPrice: Number(e.target.value) || 0 })}
                          disabled={!formData.guclendirme?.statikDetayEnabled}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Örn: 80 TL/m²"
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Kalem Tutarı</span>
                        <span className="text-xs font-black font-mono text-slate-900">
                          {formData.guclendirme?.statikDetayEnabled && (formData.guclendirme?.statikDetayTotal || 0) > 0
                            ? `${(formData.guclendirme?.statikDetayTotal || 0).toLocaleString('tr-TR')} TL`
                            : '………… TL'}
                        </span>
                      </div>
                    </div>

                    {/* 2.2 Elektrik ve Mekanik Projeleri */}
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5 flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="elkMekCheck"
                          checked={formData.guclendirme?.elektrikMekanikEnabled ?? false}
                          onChange={(e) => updateGuclendirme({ elektrikMekanikEnabled: e.target.checked })}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="elkMekCheck" className="cursor-pointer">
                          <span className="text-xs font-bold text-slate-900 block">
                            2. Elektrik ve Mekanik Projeleri
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Güçlendirme tadilatı elektrik ve mekanik deplase/uygulama projeleri
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Hesaplama Şekli</label>
                        <select
                          value={formData.guclendirme?.elektrikMekanikCalcType ?? 'area'}
                          onChange={(e: any) => updateGuclendirme({ elektrikMekanikCalcType: e.target.value })}
                          disabled={!formData.guclendirme?.elektrikMekanikEnabled}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="area">m² Birim Fiyatı ({formData.property.totalArea || 4500} m²)</option>
                          <option value="fixed">Götürü Sabit Fiyat</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          {formData.guclendirme?.elektrikMekanikCalcType === 'area' ? 'TL / m²' : 'Tutar (TL)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.guclendirme?.elektrikMekanikUnitPrice ?? 0}
                          onChange={(e) => updateGuclendirme({ elektrikMekanikUnitPrice: Number(e.target.value) || 0 })}
                          disabled={!formData.guclendirme?.elektrikMekanikEnabled}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Örn: 40 TL/m²"
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Kalem Tutarı</span>
                        <span className="text-xs font-black font-mono text-slate-900">
                          {formData.guclendirme?.elektrikMekanikEnabled && (formData.guclendirme?.elektrikMekanikTotal || 0) > 0
                            ? `${(formData.guclendirme?.elektrikMekanikTotal || 0).toLocaleString('tr-TR')} TL`
                            : '………… TL'}
                        </span>
                      </div>
                    </div>

                    {/* 2.3 Mimari Tadilat Projeleri */}
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5 flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="mimariCheck"
                          checked={formData.guclendirme?.mimariTadilatEnabled ?? false}
                          onChange={(e) => updateGuclendirme({ mimariTadilatEnabled: e.target.checked })}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="mimariCheck" className="cursor-pointer">
                          <span className="text-xs font-bold text-slate-900 block">
                            3. Mimari Tadilat Projeleri
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Güçlendirme perdeleri ve kolon mantolarına uygun mimari revizyon
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Hesaplama Şekli</label>
                        <select
                          value={formData.guclendirme?.mimariTadilatCalcType ?? 'area'}
                          onChange={(e: any) => updateGuclendirme({ mimariTadilatCalcType: e.target.value })}
                          disabled={!formData.guclendirme?.mimariTadilatEnabled}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="area">m² Birim Fiyatı ({formData.property.totalArea || 4500} m²)</option>
                          <option value="fixed">Götürü Sabit Fiyat</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">
                          {formData.guclendirme?.mimariTadilatCalcType === 'area' ? 'TL / m²' : 'Tutar (TL)'}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.guclendirme?.mimariTadilatUnitPrice ?? 0}
                          onChange={(e) => updateGuclendirme({ mimariTadilatUnitPrice: Number(e.target.value) || 0 })}
                          disabled={!formData.guclendirme?.mimariTadilatEnabled}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Örn: 30 TL/m²"
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Kalem Tutarı</span>
                        <span className="text-xs font-black font-mono text-slate-900">
                          {formData.guclendirme?.mimariTadilatEnabled && (formData.guclendirme?.mimariTadilatTotal || 0) > 0
                            ? `${(formData.guclendirme?.mimariTadilatTotal || 0).toLocaleString('tr-TR')} TL`
                            : '………… TL'}
                        </span>
                      </div>
                    </div>

                    {/* 2.4 İTÜ / Üniversite Onayı */}
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                      <div className="md:col-span-5 flex items-start gap-2.5">
                        <input
                          type="checkbox"
                          id="ituCheck"
                          checked={formData.guclendirme?.ituOnayEnabled ?? false}
                          onChange={(e) => updateGuclendirme({ ituOnayEnabled: e.target.checked })}
                          className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor="ituCheck" className="cursor-pointer">
                          <span className="text-xs font-bold text-slate-900 block">
                            4. İTÜ / Üniversite Onay Bedeli
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Yetkili üniversite heyetince proje onay ve rapor hizmeti
                          </span>
                        </label>
                      </div>

                      <div className="md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Hesaplama Şekli</label>
                        <select
                          value={formData.guclendirme?.ituOnayCalcType ?? 'fixed'}
                          onChange={(e: any) => updateGuclendirme({ ituOnayCalcType: e.target.value })}
                          disabled={!formData.guclendirme?.ituOnayEnabled}
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="fixed">Sabit / Özel Tutar</option>
                          <option value="area">m² Başı Tutar</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-0.5">Tutar (TL)</label>
                        <input
                          type="number"
                          min="0"
                          step="10000"
                          value={formData.guclendirme?.ituOnayUnitPrice ?? 0}
                          onChange={(e) => updateGuclendirme({ ituOnayUnitPrice: Number(e.target.value) || 0 })}
                          disabled={!formData.guclendirme?.ituOnayEnabled}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold font-mono disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Örn: 120000"
                        />
                      </div>

                      <div className="md:col-span-2 text-right">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Kalem Tutarı</span>
                        <span className="text-xs font-black font-mono text-slate-900">
                          {formData.guclendirme?.ituOnayEnabled && (formData.guclendirme?.ituOnayTotal || 0) > 0
                            ? `${(formData.guclendirme?.ituOnayTotal || 0).toLocaleString('tr-TR')} TL`
                            : '………… TL'}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* 2. Aşama Alt Toplam Çizgisi */}
                  <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-700">2. AŞAMA TOPLAM TEKLİF TUTARI:</span>
                    <span className="text-slate-900 font-mono font-black text-sm">
                      {(formData.guclendirme?.stage2Total || 0) > 0
                        ? `${(formData.guclendirme?.stage2Total || 0).toLocaleString('tr-TR')} TL`
                        : '………… TL'}
                    </span>
                  </div>
                </div>

              </div>
            ) : formData.type === 'riskli_yapi' ? (
              /* ======================================================== */
              /* RİSKLİ YAPI TESPİTİ (6306) GÖTÜRÜ / TOPLAM FİYAT         */
              /* ======================================================== */
              <div className="space-y-4">
                <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-950">
                      Riskli Yapı Tespiti Temel Hizmet Bedeli
                    </span>
                    <span className="text-[11px] font-bold bg-blue-100 text-blue-900 px-2 py-0.5 rounded">
                      Götürü / Sabit Fiyat
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mb-3">
                    6306 sayılı kanun kapsamında kat sayısı ile çarpım yapılmaz; tek ve net bir toplam teklif bedeli girilir. Bina kat sayısı (<strong>{formData.property.totalFloors || 'Belirtilmemiş'} Kat</strong>) raporda ve konu başlığında yer alır.
                  </p>

                  <div className="max-w-md">
                    <label className="block text-xs font-bold text-slate-800 uppercase mb-1">
                      Temel Hizmet Bedeli (KDV Hariç - TL) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="500"
                        required
                        value={formData.pricing.unitPrice}
                        onChange={(e) => updatePricing('unitPrice', Number(e.target.value) || 0)}
                        className="w-full px-3.5 py-2.5 bg-white border-2 border-blue-400 rounded-xl text-base font-black font-mono text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Örn: 166667"
                      />
                      <span className="absolute right-3.5 top-3 text-xs font-bold text-slate-400 font-mono">
                        TL + KDV
                      </span>
                    </div>
                  </div>
                </div>

                {/* KOLLUK KUVVETLERİ / KAYMAKAMLIK REFİKATI SEÇENEĞİ */}
                <div className={`p-4 rounded-xl border transition-all ${
                  formData.pricing.kollukKuvvetiIncluded
                    ? 'bg-amber-50/90 border-amber-400 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="kollukKuvvetiCheck"
                        checked={formData.pricing.kollukKuvvetiIncluded || false}
                        onChange={(e) => updatePricing('kollukKuvvetiIncluded', e.target.checked)}
                        className="mt-0.5 w-5 h-5 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="kollukKuvvetiCheck" className="text-xs font-black uppercase text-slate-900 cursor-pointer flex items-center gap-2">
                          <span>Kolluk Kuvvetleri & Kaymakamlık Eşliğinde İşlem</span>
                          <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                            +25.000 TL
                          </span>
                        </label>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Numune alımı ve saha tespitlerinde izin verilmemesi durumunda resmî polis/zabıta ve Kaymakamlık refakatiyle operasyon yürütme bedelini fiyata ilave eder.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:self-center shrink-0 pl-8 sm:pl-0">
                      <span className="text-xs font-semibold text-slate-600">Ek Bedel:</span>
                      <div className="relative w-32">
                        <input
                          type="number"
                          step="1000"
                          disabled={!formData.pricing.kollukKuvvetiIncluded}
                          value={formData.pricing.kollukKuvvetiPrice ?? 25000}
                          onChange={(e) => updatePricing('kollukKuvvetiPrice', Number(e.target.value) || 0)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-black font-mono text-slate-900 disabled:bg-slate-100 outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="absolute right-2 top-2 text-[10px] text-slate-400 font-bold">TL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ======================================================== */
              /* DİĞER TEKLİF TÜRLERİ İÇİN STANDART FİYATLANDIRMA         */
              /* ======================================================== */
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Hesaplama Metodu
                  </label>
                  <select
                    value={formData.pricing.pricingMethod}
                    onChange={(e) => updatePricing('pricingMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="kat_basi">Kat Başı Birim Fiyat (TL/Kat)</option>
                    <option value="toplam_sabit">Götürü Sabit Fiyat (TL)</option>
                  </select>
                </div>

                {formData.pricing.pricingMethod === 'kat_basi' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Toplam Kat Sayısı
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.property.totalFloors || ''}
                      onChange={(e) => updatePricing('floors', Number(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="6"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    {formData.pricing.pricingMethod === 'toplam_sabit' 
                      ? 'Götürü Fiyat (TL) *' 
                      : 'Kat Başı Birim Fiyat (TL) *'}
                  </label>
                  <input
                    type="number"
                    step="500"
                    required
                    value={formData.pricing.unitPrice}
                    onChange={(e) => updatePricing('unitPrice', Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-black font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>
            )}

            {/* FATURA & KDV SEÇENEĞİ (FATURALI / FATURASIZ İŞLEM) */}
            <div className="bg-white border-2 border-slate-200 p-4 sm:p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    Fatura & KDV Seçeneği *
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Müşterinin fatura talebine göre vergi durumunu belirleyin.
                  </p>
                </div>
                <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                  formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-blue-100 text-blue-900 border-blue-300'
                }`}>
                  {formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz'
                    ? 'Faturasız (%0 KDV Net)'
                    : 'Faturalı (+%20 KDV)'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Faturalı Seçeneği */}
                <button
                  type="button"
                  onClick={() => updatePricing('invoiceType', 'faturali')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    (!formData.pricing.isWithoutVat && formData.pricing.invoiceType !== 'faturasiz')
                      ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                    (!formData.pricing.isWithoutVat && formData.pricing.invoiceType !== 'faturasiz')
                      ? 'border-blue-600 bg-blue-600'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {(!formData.pricing.isWithoutVat && formData.pricing.invoiceType !== 'faturasiz') && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black">Faturalı İşlem (+%20 KDV)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Resmî e-fatura kesilir, yasal %20 KDV fiyata dahil edilir.
                    </div>
                  </div>
                </button>

                {/* Faturasız Seçeneği */}
                <button
                  type="button"
                  onClick={() => updatePricing('invoiceType', 'faturasiz')}
                  className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                    (formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz')
                      ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-500/20 text-amber-950 shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                    (formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz')
                      ? 'border-amber-600 bg-amber-600'
                      : 'border-slate-300 bg-white'
                  }`}>
                    {(formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz') && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-black flex items-center gap-1.5">
                      <span>Faturasız İşlem (%0 KDV)</span>
                      <span className="bg-amber-200 text-amber-950 text-[10px] font-black px-1.5 py-0.5 rounded">
                        KDV'siz Net
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Fatura düzenlenmeyen durumlar için KDV eklenmez, sadece net ana para geçerli olur.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Subtotal Calculation Display */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {formData.type === 'statik_guclendirme' ? 'Hesaplanan Liste Toplamı (Ana Para):' : 'Mevcut Olması Gereken Rakam (Ana Para / Liste Bedeli):'}
                </span>
                <div className="text-xl font-black font-mono text-slate-900">
                  {formData.pricing.subtotal.toLocaleString('tr-TR')} TL
                </div>
                {formData.type === 'statik_guclendirme' ? (
                  <p className="text-xs text-slate-500 mt-0.5">
                    (1. Aşama: {(formData.guclendirme?.stage1Total || 0).toLocaleString('tr-TR')} TL + 2. Aşama: {(formData.guclendirme?.stage2Total || 0).toLocaleString('tr-TR')} TL)
                  </p>
                ) : formData.type === 'riskli_yapi' ? (
                  <p className="text-xs text-slate-500 mt-0.5 font-medium text-slate-600">
                    {formData.pricing.kollukKuvvetiIncluded
                      ? `(Temel Bedel: ${formData.pricing.unitPrice.toLocaleString('tr-TR')} TL + Kolluk Kuvveti: ${(formData.pricing.kollukKuvvetiPrice || 25000).toLocaleString('tr-TR')} TL)`
                      : '(6306 Sayılı Kanun Kapsamında Götürü Sabit Hizmet Bedeli)'}
                  </p>
                ) : formData.pricing.pricingMethod === 'kat_basi' && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    ({formData.property.totalFloors || 0} Kat × {formData.pricing.unitPrice.toLocaleString('tr-TR')} TL / Kat)
                  </p>
                )}
              </div>

              {/* VAT Selector */}
              <div className="w-full sm:w-48">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  KDV Durumu & Oranı
                </label>
                <select
                  value={formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz' ? 0 : (formData.pricing.vatRate || 20)}
                  onChange={(e) => updatePricing('vatRate', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value={20}>%20 KDV (Faturalı)</option>
                  <option value={10}>%10 KDV (İndirimli)</option>
                  <option value={0}>%0 KDV (Faturasız / Muaf)</option>
                </select>
              </div>
            </div>

            {/* İSKONTO (DISCOUNT) SECTION WITH TOGGLE BUTTON */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    %
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">İskonto / Özel İndirim Ayarları</h4>
                    <p className="text-xs text-slate-500">
                      İskonto tanımlandığında teklifte Liste Fiyatı ve İskontolu Fiyat gösterilir. İskonto yoksa teklifte hiç gözükmez.
                    </p>
                  </div>
                </div>

                {formData.pricing.discount > 0 ? (
                  <button
                    type="button"
                    onClick={() => updatePricing('discount', 0)}
                    className="px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
                  >
                    İskontoyu Kaldır
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => updatePricing('discount', Math.round(formData.pricing.subtotal * 0.1))}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    İskonto Uygula
                  </button>
                )}
              </div>

              {/* Active Discount Controls */}
              {formData.pricing.discount > 0 && (
                <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-xl space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-emerald-950 uppercase mb-1">
                        İskontolu Hizmet Bedeli (Manuel Girilebilir - TL) *
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={formData.pricing.subtotal - formData.pricing.discount}
                        onChange={(e) => updatePricing('discountedPrice', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border-2 border-emerald-400 rounded-lg text-sm font-black font-mono text-emerald-950 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="Örn: 150000"
                      />
                      <p className="text-[11px] text-emerald-800 mt-1 font-medium">
                        KDV hariç direkt vermek istediğiniz net iskontolu tutarı buraya yazabilirsiniz.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        İskonto Tutarı (TL)
                      </label>
                      <input
                        type="number"
                        step="500"
                        value={formData.pricing.discount}
                        onChange={(e) => updatePricing('discount', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold font-mono text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                        placeholder="Örn: 30000"
                      />
                      <p className="text-[11px] text-slate-600 mt-1 font-medium">
                        Veya düşülecek indirim tutarını doğrudan girebilirsiniz.
                      </p>
                    </div>
                  </div>

                  <div className="text-xs bg-white p-3 rounded-lg border border-emerald-200 flex items-center justify-between font-medium text-slate-700">
                    <span>Mevcut Olması Gereken Liste Fiyatı: <strong>{formData.pricing.subtotal.toLocaleString('tr-TR')} TL</strong></span>
                    <span>→</span>
                    <span className="text-emerald-800 font-bold">İskontolu Net Fiyat: <strong>{(formData.pricing.subtotal - formData.pricing.discount).toLocaleString('tr-TR')} TL</strong></span>
                  </div>
                </div>
              )}
            </div>

            {/* Total Display */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex items-center justify-between shadow-lg">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold tracking-wider text-amber-400">
                    {formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz'
                      ? (formData.pricing.discount > 0 ? 'İskontolu ' : '') + 'Faturasız Net Toplam (KDV Muaf):'
                      : (formData.pricing.discount > 0 ? 'İskontolu ' : '') + 'KDV Dahil Genel Toplam:'}
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                    formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                  }`}>
                    {formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz' ? 'Faturasız (%0 KDV)' : 'Faturalı (+%20 KDV)'}
                  </span>
                </div>

                <div className="text-3xl font-black font-mono text-white mt-1">
                  {formData.pricing.totalAmount.toLocaleString('tr-TR')} {formData.pricing.currency}
                </div>

                <div className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-medium">
                  <span>
                    Ana Para (Net): <strong className="text-white font-mono">{Math.max(0, formData.pricing.subtotal - (formData.pricing.discount || 0)).toLocaleString('tr-TR')} TL</strong>
                  </span>
                  <span>•</span>
                  <span>
                    KDV: <strong className="text-amber-300 font-mono">
                      {formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz' 
                        ? '0 TL (Muaf/Faturasız)' 
                        : `${Math.round((Math.max(0, formData.pricing.subtotal - (formData.pricing.discount || 0)) * (formData.pricing.vatRate || 20)) / 100).toLocaleString('tr-TR')} TL`}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-2xl shrink-0">
                ₺
              </div>
            </div>

            {/* Payment & Terms */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-3">
                Sözleşme & Ödeme Koşulları
              </h3>

              {formData.type === 'statik_guclendirme' ? (
                <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-xl space-y-2 mb-4 text-xs text-blue-950 font-medium">
                  <div className="font-bold text-blue-900 uppercase text-[11px] mb-1">
                    Statik Güçlendirme Teklifi Standart Hükümleri:
                  </div>
                  <p>1. <strong>Ödeme Cetveli:</strong> İş başlangıcında %50, Avan proje tesliminde %50 olarak yapılacaktır.</p>
                  <p>2. <strong>Vergi:</strong> Fiyatlarımıza KDV dahil değildir.</p>
                  <p>3. <strong>Geçerlilik:</strong> Bu fiyat teklifinin geçerlilik süresi {formData.paymentTerms.validityDays || 15} takvim günüdür.</p>
                  <p>4. <strong>Standart:</strong> Projeler 2018 TBDY standartlarına uygun olarak Kontrollü Hasar seviyesi hedeflenerek hazırlanacaktır.</p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Peşinat Oranı (%)</label>
                  <input
                    type="number"
                    value={formData.paymentTerms.advanceRatio}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentTerms: {
                          ...formData.paymentTerms,
                          advanceRatio: Number(e.target.value) || 0,
                          uponDeliveryRatio: 100 - (Number(e.target.value) || 0),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Rapor / Avan Teslim Süresi (İş Günü)</label>
                  <input
                    type="number"
                    value={formData.paymentTerms.completionWorkDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentTerms: {
                          ...formData.paymentTerms,
                          completionWorkDays: Number(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Teklif Geçerlilik Süresi (Gün)</label>
                  <input
                    type="number"
                    value={formData.paymentTerms.validityDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        paymentTerms: {
                          ...formData.paymentTerms,
                          validityDays: Number(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Teklif Altındaki Özel Notlar</label>
                <textarea
                  rows={2}
                  value={formData.paymentTerms.customNotes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentTerms: {
                        ...formData.paymentTerms,
                        customNotes: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="Saha çalışması esnasında elektrik ve su imkanı sağlanmalıdır."
                />
              </div>

            </div>

            {/* Tahsilat ve Ödeme Takip Masası (İş Akışı) */}
            <div className="pt-6 border-t-2 border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-700 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Ödeme ve Tahsilat Takip Masası
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Taksit ödemeleri, peşinat ve dosya teslimat aşamalarını buradan yönetin
                    </p>
                  </div>
                </div>

                {/* Dosya Bitti Checkbox */}
                <label className="inline-flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 transition">
                  <input
                    type="checkbox"
                    checked={Boolean(formData.paymentTerms.fileCompleted || formData.paymentTerms.paymentStatus === 'dosya_bitti_odeme_bekliyor')}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        paymentTerms: {
                          ...formData.paymentTerms,
                          fileCompleted: checked,
                          paymentStatus: checked && formData.paymentTerms.paymentStatus !== 'tamami_odendi'
                            ? 'dosya_bitti_odeme_bekliyor'
                            : formData.paymentTerms.paymentStatus || 'odeme_bekliyor',
                        },
                      });
                    }}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <FolderCheck className="w-3.5 h-3.5 text-amber-600" />
                    Dosya / Rapor Bitti
                  </span>
                </label>
              </div>

              {/* 5 Big Action Buttons for Payment Status */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {(['odeme_bekliyor', 'ilk_taksit_odendi', 'ara_odeme_odendi', 'dosya_bitti_odeme_bekliyor', 'tamami_odendi'] as PaymentStatus[]).map((st) => {
                  const info = PAYMENT_STATUS_LABELS[st];
                  const isSelected = (formData.paymentTerms.paymentStatus || 'odeme_bekliyor') === st;

                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => {
                        const calculatedSubtotal = Math.max(0, formData.pricing.subtotal - (formData.pricing.discount || 0));
                        const calculatedTotal = formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz'
                          ? calculatedSubtotal
                          : Math.round(calculatedSubtotal * (1 + (formData.pricing.vatRate || 20) / 100));

                        let newPaid = 0;
                        if (st === 'tamami_odendi') {
                          newPaid = calculatedTotal;
                        } else if (st === 'ilk_taksit_odendi' || st === 'dosya_bitti_odeme_bekliyor') {
                          newPaid = Math.round(calculatedTotal * ((formData.paymentTerms.advanceRatio || 50) / 100));
                        } else if (st === 'ara_odeme_odendi') {
                          newPaid = Math.round(calculatedTotal * 0.75);
                        }

                        // Update installments isPaid states
                        const updatedInst = (formData.paymentTerms.installments || []).map((inst, idx) => {
                          if (st === 'tamami_odendi') return { ...inst, isPaid: true };
                          if (st === 'odeme_bekliyor') return { ...inst, isPaid: false };
                          if (idx === 0) return { ...inst, isPaid: true };
                          return inst;
                        });

                        setFormData({
                          ...formData,
                          paymentTerms: {
                            ...formData.paymentTerms,
                            paymentStatus: st,
                            fileCompleted: st === 'dosya_bitti_odeme_bekliyor' ? true : formData.paymentTerms.fileCompleted,
                            totalPaidAmount: newPaid,
                            remainingAmount: Math.max(0, calculatedTotal - newPaid),
                            installments: updatedInst.length > 0 ? updatedInst : formData.paymentTerms.installments,
                          },
                        });
                      }}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between gap-1.5 ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/20 shadow-sm' 
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`w-2.5 h-2.5 rounded-full ${info.dot}`} />
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-amber-600" />}
                      </div>
                      <div className="font-extrabold text-xs text-slate-900 leading-tight">
                        {info.label}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Installments & Payment Details Table */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Taksit & Tahsilat Girişleri
                  </h4>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Ödenen taksitlerin kutucuğunu işaretleyin
                  </span>
                </div>

                <div className="space-y-2">
                  {/* Taksit 1 */}
                  {(() => {
                    const calculatedSubtotal = Math.max(0, formData.pricing.subtotal - (formData.pricing.discount || 0));
                    const calculatedTotal = formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz'
                      ? calculatedSubtotal
                      : Math.round(calculatedSubtotal * (1 + (formData.pricing.vatRate || 20) / 100));
                    const advPercent = formData.paymentTerms.advanceRatio || 50;
                    const inst1Amount = Math.round(calculatedTotal * (advPercent / 100));
                    const inst2Amount = Math.max(0, calculatedTotal - inst1Amount);
                    const is1Paid = ['ilk_taksit_odendi', 'ara_odeme_odendi', 'dosya_bitti_odeme_bekliyor', 'tamami_odendi'].includes(
                      formData.paymentTerms.paymentStatus || ''
                    );
                    const is2Paid = formData.paymentTerms.paymentStatus === 'tamami_odendi';

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        
                        {/* 1. Taksit Kartı */}
                        <div className={`p-3 rounded-xl border transition ${
                          is1Paid ? 'bg-emerald-50/60 border-emerald-300' : 'bg-white border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={is1Paid}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const newStatus: PaymentStatus = checked 
                                    ? (is2Paid ? 'tamami_odendi' : 'ilk_taksit_odendi')
                                    : 'odeme_bekliyor';
                                  setFormData({
                                    ...formData,
                                    paymentTerms: {
                                      ...formData.paymentTerms,
                                      paymentStatus: newStatus,
                                      totalPaidAmount: checked ? (is2Paid ? calculatedTotal : inst1Amount) : 0,
                                      remainingAmount: checked ? (is2Paid ? 0 : inst2Amount) : calculatedTotal,
                                    },
                                  });
                                }}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-xs font-extrabold text-slate-900">
                                1. Taksit (Peşinat - %{advPercent})
                              </span>
                            </label>
                            <span className="font-mono font-bold text-xs text-slate-900">
                              ₺{inst1Amount.toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {is1Paid ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 1. Taksit Tahsil Edildi
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium">Ödeme Bekliyor</span>
                            )}
                          </div>
                        </div>

                        {/* 2. Taksit Kartı */}
                        <div className={`p-3 rounded-xl border transition ${
                          is2Paid ? 'bg-emerald-50/60 border-emerald-300' : (
                            formData.paymentTerms.paymentStatus === 'dosya_bitti_odeme_bekliyor'
                              ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400'
                              : 'bg-white border-slate-200'
                          )
                        }`}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={is2Paid}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const newStatus: PaymentStatus = checked 
                                    ? 'tamami_odendi'
                                    : (is1Paid ? (formData.paymentTerms.fileCompleted ? 'dosya_bitti_odeme_bekliyor' : 'ilk_taksit_odendi') : 'odeme_bekliyor');
                                  setFormData({
                                    ...formData,
                                    paymentTerms: {
                                      ...formData.paymentTerms,
                                      paymentStatus: newStatus,
                                      totalPaidAmount: checked ? calculatedTotal : (is1Paid ? inst1Amount : 0),
                                      remainingAmount: checked ? 0 : (is1Paid ? inst2Amount : calculatedTotal),
                                    },
                                  });
                                }}
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-xs font-extrabold text-slate-900">
                                2. Taksit (Kalan - %{100 - advPercent})
                              </span>
                            </label>
                            <span className="font-mono font-bold text-xs text-slate-900">
                              ₺{inst2Amount.toLocaleString('tr-TR')}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {is2Paid ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Tamamı Tahsil Edildi
                              </span>
                            ) : formData.paymentTerms.paymentStatus === 'dosya_bitti_odeme_bekliyor' ? (
                              <span className="text-amber-800 font-bold flex items-center gap-1">
                                <FolderCheck className="w-3.5 h-3.5 text-amber-600" /> Dosya Hazır, Kalan Bakiye Bekleniyor
                              </span>
                            ) : (
                              <span className="text-slate-500 font-medium">Teslimat / Son Aşama</span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>

                {/* Live Payment Summary Box */}
                {(() => {
                  const calculatedSubtotal = Math.max(0, formData.pricing.subtotal - (formData.pricing.discount || 0));
                  const calculatedTotal = formData.pricing.isWithoutVat || formData.pricing.invoiceType === 'faturasiz'
                    ? calculatedSubtotal
                    : Math.round(calculatedSubtotal * (1 + (formData.pricing.vatRate || 20) / 100));
                  const currentSt = formData.paymentTerms.paymentStatus || 'odeme_bekliyor';
                  const advRatio = (formData.paymentTerms.advanceRatio || 50) / 100;
                  
                  let paid = 0;
                  if (currentSt === 'tamami_odendi') paid = calculatedTotal;
                  else if (currentSt === 'ilk_taksit_odendi' || currentSt === 'dosya_bitti_odeme_bekliyor') paid = Math.round(calculatedTotal * advRatio);
                  else if (currentSt === 'ara_odeme_odendi') paid = Math.round(calculatedTotal * 0.75);
                  
                  const remaining = Math.max(0, calculatedTotal - paid);

                  return (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200 text-center">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <div className="text-[10px] uppercase font-bold text-slate-400">Toplam Tutar</div>
                        <div className="text-xs sm:text-sm font-black text-slate-900 font-mono">
                          ₺{calculatedTotal.toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                        <div className="text-[10px] uppercase font-bold text-emerald-800">Tahsil Edilen</div>
                        <div className="text-xs sm:text-sm font-black text-emerald-700 font-mono">
                          ₺{paid.toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                        <div className="text-[10px] uppercase font-bold text-amber-800">Kalan Alacak</div>
                        <div className="text-xs sm:text-sm font-black text-amber-700 font-mono">
                          ₺{remaining.toLocaleString('tr-TR')}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              </div>

            </div>

          </div>
        )}

      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition"
        >
          İptal Et
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSave(formData, false)}
            className="px-4 py-2 text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Taslak Kaydet
          </button>

          <button
            type="button"
            onClick={() => onSave(formData, true)}
            className="px-6 py-2.5 text-xs font-extrabold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg transition flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Kaydet & Önizle
          </button>
        </div>
      </div>

    </div>
  );
};
