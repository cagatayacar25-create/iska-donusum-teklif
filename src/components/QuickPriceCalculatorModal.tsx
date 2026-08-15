import React, { useState } from 'react';
import { Calculator, X, Check, Building2, Layers, MapPin, DollarSign } from 'lucide-react';
import { ProposalType } from '../types';
import { PROPOSAL_TYPE_LABELS } from '../data/defaultTemplates';

interface QuickPriceCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPrice: (price: number, type: ProposalType, notes: string) => void;
}

export const QuickPriceCalculatorModal: React.FC<QuickPriceCalculatorProps> = ({
  isOpen,
  onClose,
  onApplyPrice,
}) => {
  const [selectedType, setSelectedType] = useState<ProposalType>('riskli_yapi');
  const [floors, setFloors] = useState<number>(5);
  const [ratePerFloor, setRatePerFloor] = useState<number>(7500);

  if (!isOpen) return null;

  const handleTypeSelect = (type: ProposalType) => {
    setSelectedType(type);
    if (type === 'orta_katli_risk') {
      if (floors < 10) setFloors(10);
      setRatePerFloor(30000);
    } else if (type === 'performans_raporu') {
      setRatePerFloor(30000);
    } else {
      setRatePerFloor(7500);
    }
  };

  let multiplier = 1;
  if (selectedType === 'orta_katli_risk') multiplier = 1.0; // Kat başı 30.000 TL olarak direkt hesaplanır
  if (selectedType === 'performans_raporu') multiplier = 1.0;
  
  const effectiveFloors = selectedType === 'orta_katli_risk' ? Math.max(10, floors) : floors;
  const estimatedPrice = Math.round(effectiveFloors * ratePerFloor * multiplier);
  const calcExplain = `${effectiveFloors} Kat x ${ratePerFloor.toLocaleString('tr-TR')} TL (Kat Başı)`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Saha Fiyat Tahmin Robotu</h3>
              <p className="text-xs text-slate-400">Kat sayısına göre hızlı teklif tutarı hesaplayıcı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-slate-800">
          
          {/* Proposal Type Choice */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Teklif Türü
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['riskli_yapi', 'orta_katli_risk', 'performans_raporu'] as ProposalType[]).map((type) => {
                const info = PROPOSAL_TYPE_LABELS[type];
                const isSelected = selectedType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTypeSelect(type)}
                    className={`p-2.5 rounded-xl text-left border transition text-xs font-medium flex flex-col justify-between ${
                      isSelected 
                        ? 'border-amber-500 bg-amber-50/80 text-amber-950 font-semibold ring-2 ring-amber-500/30' 
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="line-clamp-2">{info.name.split('(')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inputs */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Toplam Kat Sayısı
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={floors}
                  onChange={(e) => setFloors(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Kat Başı Birim (TL)
                </label>
                <input
                  type="number"
                  step="500"
                  value={ratePerFloor}
                  onChange={(e) => setRatePerFloor(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Result Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 rounded-xl text-slate-950 flex items-center justify-between shadow-md">
            <div>
              <div className="text-xs uppercase font-bold tracking-wider opacity-80">Tahmini Teklif Tutarı</div>
              <div className="text-2xl font-black tracking-tight">
                {estimatedPrice.toLocaleString('tr-TR')} TL
              </div>
              <div className="text-xs font-medium opacity-90 mt-0.5">{calcExplain}</div>
            </div>
            <div className="w-12 h-12 bg-slate-950/10 rounded-full flex items-center justify-center font-bold text-xl">
              ₺
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyPrice(estimatedPrice, selectedType, calcExplain);
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg shadow transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            Teklife Aktar
          </button>
        </div>

      </div>
    </div>
  );
};
