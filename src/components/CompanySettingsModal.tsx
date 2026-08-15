import React, { useState } from 'react';
import { CompanyProfile } from '../types';
import { Building2, Save, Upload, X, Check, Award, FileText, Image as ImageIcon } from 'lucide-react';

interface CompanySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  companyProfile: CompanyProfile;
  onSave: (updated: CompanyProfile) => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsProps> = ({
  isOpen,
  onClose,
  companyProfile,
  onSave,
}) => {
  const [formData, setFormData] = useState<CompanyProfile>(companyProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleImageUpload = (field: 'logoUrl' | 'stampUrl', file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        [field]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Firma & Teklif Başlığı Ayarları</h3>
              <p className="text-xs text-slate-400">PDF tekliflerin üst ve alt bilgi şablonu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Firma Unvanı / Adı *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                placeholder="Örn: ÖZDEMİR MÜHENDİSLİK LTD. ŞTİ."
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Hizmet Alt Başlığı
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Örn: İnşaat Mühendisliği & Yapı Sağlığı Hizmetleri"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                İMO / Oda Sicil No
              </label>
              <input
                type="text"
                value={formData.imoNumber}
                onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Örn: İMO Sicil No: 64821"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Telefon *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Örn: 0532 555 01 99"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                E-posta Adresi
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="info@ozdemirmuhendislik.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Web Sitesi
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="www.ozdemirmuhendislik.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Açık Adres
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none"
              placeholder="Örn: Atatürk Cad. No:142 Kadıköy / İstanbul"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Banka IBAN & Ödeme Bilgisi (PDF Altına Eklenecek)
            </label>
            <input
              type="text"
              value={formData.bankInfo}
              onChange={(e) => setFormData({ ...formData, bankInfo: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-mono text-xs"
              placeholder="TR00 0000 0000 0000 0000 0000 00 (Ziraat Bankası)"
            />
          </div>

          {/* Logo & Stamp upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Firma Logosu
              </label>
              <div className="flex items-center gap-3">
                {formData.logoUrl ? (
                  <div className="w-16 h-16 border rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-1 relative">
                    <img src={formData.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logoUrl: '' })}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 bg-slate-50">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                )}
                <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  Logo Seç
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload('logoUrl', e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kaşe / İmza Görseli
              </label>
              <div className="flex items-center gap-3">
                {formData.stampUrl ? (
                  <div className="w-16 h-16 border rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center p-1 relative">
                    <img src={formData.stampUrl} alt="Kaşe" className="max-h-full max-w-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, stampUrl: '' })}
                      className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-slate-400 bg-slate-50">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <label className="cursor-pointer px-3 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5" />
                  Kaşe/İmza Seç
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload('stampUrl', e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Kapat
            </button>
            <button
              type="submit"
              className={`px-6 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md transition flex items-center gap-2 ${
                savedSuccess ? 'bg-emerald-500 text-white' : ''
              }`}
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" /> Kaydedildi!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Bilgileri Kaydet
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
