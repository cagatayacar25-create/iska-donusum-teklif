import React, { useState } from 'react';
import { Proposal, CompanyProfile } from '../types';
import { PROPOSAL_TYPE_LABELS } from '../data/defaultTemplates';
import { exportProposalToPdf } from '../utils/pdfGenerator';
import { ISKA_LOGO_DATA_URL, CompanyLogoDisplay } from '../assets/iskaLogo';
import { 
  Download, 
  Printer, 
  Share2, 
  X, 
  Edit3, 
  Building2, 
  MapPin, 
  CheckCircle2, 
  Calendar, 
  Phone, 
  Mail, 
  AlertCircle,
  FileText,
  Copy
} from 'lucide-react';

interface ProposalPreviewModalProps {
  proposal: Proposal | null;
  companyProfile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (proposal: Proposal) => void;
}

export const ProposalPreviewModal: React.FC<ProposalPreviewModalProps> = ({
  proposal,
  companyProfile,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  if (!isOpen || !proposal) return null;

  const typeInfo = PROPOSAL_TYPE_LABELS[proposal.type];
  const pdfContainerId = `pdf-proposal-${proposal.id}`;

  const handleDownloadPdf = async () => {
    setIsExporting(true);
    const cleanAddress = (proposal.property.district || 'Adres').replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ]/g, '_');
    const filename = `Teklif_${proposal.proposalNumber}_${cleanAddress}_${proposal.property.ada || 'Ada'}-${proposal.property.parsel || 'Parsel'}`;
    await exportProposalToPdf(pdfContainerId, filename);
    setIsExporting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsapp = () => {
    const text = `Merhaba Sayın ${proposal.client.contactPerson || proposal.client.name},

${proposal.property.district} / ${proposal.property.city} adresindeki (Ada: ${proposal.property.ada}, Parsel: ${proposal.property.parsel}) taşınmazınız için hazırladığımız *"${proposal.title}"* teklifi hazır detaylar aşağıdadır:

📋 *Teklif No:* ${proposal.proposalNumber}
🏢 *Teklif Konusu:* ${typeInfo.name}
📍 *Ada / Parsel:* ${proposal.property.ada} / ${proposal.property.parsel}
💰 *Toplam Tutar:* ${proposal.pricing.totalAmount.toLocaleString('tr-TR')} ${proposal.pricing.currency} (KDV Dahil)
⏱️ *Teslim Süresi:* ${proposal.paymentTerms.completionWorkDays} İş Günü
 Validasyon Süresi: ${proposal.paymentTerms.validityDays} Gün

Detaylı resmi teklif belgesini incelemek için bizimle iletişime geçebilirsiniz.
${companyProfile.name}
📞 Tel: ${companyProfile.phone}`;

    const encoded = encodeURIComponent(text);
    let phoneClean = proposal.client.phone.replace(/[^0-9]/g, '');
    if (phoneClean.startsWith('0')) {
      phoneClean = '90' + phoneClean.slice(1);
    } else if (!phoneClean.startsWith('90')) {
      phoneClean = '90' + phoneClean;
    }

    const waUrl = `https://wa.me/${phoneClean}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  const handleCopySummary = () => {
    const text = `Teklif No: ${proposal.proposalNumber}\nMüşteri: ${proposal.client.name}\nAda/Parsel: ${proposal.property.ada}/${proposal.property.parsel}\nTutar: ${proposal.pricing.totalAmount.toLocaleString('tr-TR')} TL`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Modal Container */}
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-700 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Action Bar (Hidden on Print) */}
        <div className="bg-slate-900 px-4 sm:px-6 py-3 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 no-print print:hidden shrink-0">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-400 font-mono font-bold text-xs px-2.5 py-1 rounded border border-amber-500/30">
              {proposal.proposalNumber}
            </span>
            <span className="text-xs text-slate-300 font-medium hidden sm:inline">
              | {proposal.client.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(proposal)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              Düzenle
            </button>

            <button
              onClick={handleShareWhatsapp}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition flex items-center gap-1.5"
              title="Müşteriye WhatsApp İle Gönder"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp Paylaş
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'PDF Hazırlanıyor...' : 'PDF İndir'}
            </button>

            <button
              onClick={handlePrint}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Yazdır"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable A4 Document View */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-200 print:bg-white print:p-0 flex justify-center">
          
          <div
            id={pdfContainerId}
            className="printable-document bg-white text-slate-900 w-full max-w-[794px] min-h-[1123px] shadow-xl p-8 sm:p-10 font-sans border border-slate-200 print:shadow-none print:border-none print:p-8 print:w-full"
          >
            {/* Check proposal type: Statik Güçlendirme vs Performans Raporu vs Orta Katlı vs Riskli Yapı */}
            {proposal.type === 'statik_guclendirme' ? (
              /* ================================================================ */
              /* STATİK GÜÇLENDİRME PROJE TEKLİFİ FORMAT (EXACT DOCUMENT MATCH)   */
              /* ================================================================ */
              <div className="space-y-12 font-sans text-slate-900">
                {/* ============================================================= */}
                {/* --- SAYFA 1: BAŞLIK, KONU, 1. KAPSAM & 1. VE 2. AŞAMA TABLOLARI --- */}
                {/* ============================================================= */}
                <div className="min-h-[1050px] flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-5">
                      <div className="flex items-center gap-3">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-16 w-auto object-contain" 
                        />
                        <div>
                          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {companyProfile.name}
                          </h1>
                          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                          </p>
                          <p className="text-[9.5px] font-bold text-blue-950 tracking-tight mt-0.5">
                            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-medium">
                            Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-bold text-xs text-slate-900 pt-2">
                        <div>{new Date(proposal.createdAt).toLocaleDateString('tr-TR')}</div>
                        <div className="text-[11px] font-mono text-blue-950 mt-1">Ref: {proposal.proposalNumber}</div>
                      </div>
                    </div>

                    {/* Sayı & Konu Header */}
                    <div className="mb-4 bg-slate-50 p-3.5 rounded-lg border border-slate-300 text-xs text-slate-900 space-y-1.5">
                      <div className="flex items-baseline">
                        <span className="w-16 font-extrabold text-slate-950 shrink-0">Sayı :</span>
                        <span className="font-mono font-bold text-blue-950">{proposal.proposalNumber}</span>
                      </div>
                      <div className="flex items-baseline">
                        <span className="w-16 font-extrabold text-slate-950 shrink-0">Konu :</span>
                        <div className="font-medium leading-relaxed">
                          <strong>{proposal.property.city || 'İstanbul'}</strong> İli,{' '}
                          <strong>{proposal.property.district || 'Ümraniye'}</strong> İlçesi,{' '}
                          <strong>{proposal.property.neighborhood || proposal.property.pafta || 'Dudullu Organize Sanayi Bölgesi'}</strong>,{' '}
                          <strong>{proposal.property.parsel ? `${proposal.property.parsel} numaralı parsel` : (proposal.property.ada ? `${proposal.property.ada} Ada / ${proposal.property.parsel} Parsel` : 'ilgili taşınmaz')}</strong> yer alan{' '}
                          <strong>{proposal.client.name || 'İşveren Kuruluş'}</strong>'ne ait{' '}
                          <strong>{proposal.property.buildingCount || (proposal.guclendirme?.buildingCount || 2)} adet yapı</strong>
                          {proposal.property.totalArea ? ` (${proposal.property.totalArea.toLocaleString('tr-TR')} m² inşaat alanı)` : ''} için{' '}
                          <strong>2018 Türkiye Bina Deprem Yönetmeliğine uygun olarak Statik Güçlendirme Avan ve Detay Projelerinin Hazırlanması İşi Fiyat Teklifi</strong>
                        </div>
                      </div>
                    </div>

                    {/* Giriş Paragrafı */}
                    <p className="text-xs text-slate-800 leading-relaxed mb-4 text-justify px-0.5">
                      Bu doküman yürürlükteki yönetmelikler çerçevesinde 50 yılda aşılma olasılığı <strong>%10</strong> olan deprem düzeyine göre <strong>“Kontrollü Hasar”</strong> seviyesine ulaşmalarını sağlayacak nitelikte ve yeterlikte güçlendirme projelerinin hazırlanmasına yönelik hazırladığımız fiyat teklifidir.
                    </p>

                    {/* 1. Fiyat Teklifi ve Kapsam */}
                    <div className="mb-4">
                      <h2 className="text-xs font-black text-slate-950 uppercase tracking-wide mb-1.5">
                        1. Fiyat Teklifi ve Kapsam
                      </h2>
                      <p className="text-xs text-slate-800 leading-relaxed text-justify mb-2 px-0.5">
                        Yapılacak işin birden çok aşamaya sahip olması, ödeme sürecinin daha kolay yönetilebilmesi ve sürecin tarifini kolaylaştıracak olması nedeniyle fiyat teklifimiz iş kalemlerine ayrılmıştır. Aşağıdaki tabloda ilgili yapınız için güçlendirme projelerine kadar olan tüm hizmetler sunulmaktadır. Dolayısıyla, hizmetimiz sonrasında sizlere teslim edilecek tüm doküman ve evraklar ile anlaşacak olduğunuz yüklenici veya kendi bünyenizde güçlendirme başvurusunu yapabilecek ve ihaleye çıkabilecek nitelikte doküman bütünlüğüne sahip olunabilecektir.
                      </p>
                      <div className="bg-slate-100/80 p-2 rounded border border-slate-200 text-xs text-slate-900 font-semibold mb-3">
                        <p className="font-bold text-slate-950 mb-0.5">2 aşamalı işlem gerçekleşecek olup,</p>
                        <p className="text-slate-800">• <strong>1. Aşama:</strong> Binanın güçlendirme Avan projesine ilişkin işlemler yer almaktadır.</p>
                        <p className="text-slate-800">• <strong>2. Aşamada ise:</strong> Statik Detay sürecine ilişkin işlemler yer almaktadır.</p>
                      </div>
                    </div>

                    {/* TABLO 1: 1. AŞAMA AVAN PROJE VE SAHA İŞLEMLERİ */}
                    <div className="mb-4">
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-t-lg flex justify-between items-center text-xs font-bold">
                        <span>İŞ KALEMİ (KAPSAM) 1. AŞAMA</span>
                        <span className="text-amber-400 font-mono">
                          {(proposal.guclendirme?.stage1Total || proposal.pricing.subtotal).toLocaleString('tr-TR')} TL
                        </span>
                      </div>

                      <div className="border-x-2 border-b-2 border-slate-900 text-xs overflow-hidden rounded-b-lg">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-900 text-[11px]">
                              <th className="py-2 px-3 w-1/12 text-center border-r border-slate-300">No</th>
                              <th className="py-2 px-3 w-7/12 border-r border-slate-300">Hizmet / İşlem Kalemi</th>
                              <th className="py-2 px-3 w-2/12 text-center border-r border-slate-300">Miktar</th>
                              <th className="py-2 px-3 w-2/12 text-right">Teklif Tutarı</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white text-[11px]">
                            {/* Sondaj */}
                            <tr>
                              <td className="py-2 px-3 text-center font-bold border-r border-slate-200">1</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900">Sondaja dayalı Zemin ve Geoteknik Rapor</div>
                                <div className="text-[10px] text-slate-600">Zemin sondajları ve laboratuvar parametreleri</div>
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-semibold">
                                {proposal.guclendirme?.sondajCount || 6} Adet
                              </td>
                              <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                                {proposal.guclendirme?.sondajIncluded && (proposal.guclendirme?.sondajTotal || 0) > 0
                                  ? `${(proposal.guclendirme.sondajTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>

                            {/* Temel Çukuru */}
                            <tr className="bg-slate-50/50">
                              <td className="py-2 px-3 text-center font-bold border-r border-slate-200">2</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900">Temel çukuru açılarak Temel sisteminin belirlenmesi</div>
                                <div className="text-[10px] text-slate-600">Temel tipi tespiti, paspayı sıyırma ve korozyon tespiti</div>
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-semibold">
                                {proposal.guclendirme?.temelCukuruCount || 6} Adet
                              </td>
                              <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                                {proposal.guclendirme?.temelCukuruIncluded && (proposal.guclendirme?.temelCukuruTotal || 0) > 0
                                  ? `${(proposal.guclendirme.temelCukuruTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>

                            {/* Statik Avan Proje */}
                            <tr>
                              <td className="py-2 px-3 text-center font-bold border-r border-slate-200">3</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900">Statik Güçlendirme Avan Projelerinin Hazırlanması</div>
                                <div className="text-[10px] text-slate-600">3B Taşıyıcı sistem analizi, güçlendirme modelleri, keşif özeti ve yaklaşık maliyet</div>
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200 font-mono font-semibold">
                                {proposal.guclendirme?.avanProjeCalcType === 'area'
                                  ? `${proposal.property.totalArea || 4500} m²`
                                  : `${proposal.property.buildingCount || (proposal.guclendirme?.buildingCount || 2)} Yapı`}
                              </td>
                              <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                                {proposal.guclendirme?.avanProjeIncluded && (proposal.guclendirme?.avanProjeTotal || 0) > 0
                                  ? `${(proposal.guclendirme.avanProjeTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>

                            {/* 1. Aşama Alt Toplam */}
                            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                              <td colSpan={3} className="py-2 px-3 text-right uppercase text-slate-900 font-black">
                                TOPLAM TEKLİF (1. AŞAMA - KDV HARİÇ):
                              </td>
                              <td className="py-2 px-3 text-right font-black font-mono text-blue-950 text-xs">
                                {(proposal.guclendirme?.stage1Total || proposal.pricing.subtotal).toLocaleString('tr-TR')} TL
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TABLO 2: 2. AŞAMA STATİK DETAY SÜRECİNE İLİŞKİN İŞLEMLER */}
                    <div>
                      <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t-lg flex justify-between items-center text-xs font-bold">
                        <span>İŞ KALEMİ (KAPSAM) 2. AŞAMA (Opsiyonel / Seçmeli Süreç)</span>
                        <span className="text-amber-300 font-mono">
                          {(proposal.guclendirme?.stage2Total || 0) > 0
                            ? `${(proposal.guclendirme?.stage2Total || 0).toLocaleString('tr-TR')} TL`
                            : '………… TL'}
                        </span>
                      </div>

                      <div className="border-x-2 border-b-2 border-slate-800 text-xs overflow-hidden rounded-b-lg">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-900 text-[11px]">
                              <th className="py-2 px-3 w-1/12 text-center border-r border-slate-300">No</th>
                              <th className="py-2 px-3 w-7/12 border-r border-slate-300">Hizmet Kalemi</th>
                              <th className="py-2 px-3 w-2/12 text-center border-r border-slate-300">Birim Fiyat</th>
                              <th className="py-2 px-3 w-2/12 text-right">Teklif Tutarı</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white text-[11px]">
                            {/* Statik Detay */}
                            <tr>
                              <td className="py-2 px-3 text-center font-bold border-r border-slate-200">1</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900">Statik Güçlendirme Detay Projelerinin Hazırlanması</div>
                                <div className="text-[10px] text-slate-600">Uygulama paftaları, detay çizimleri, kolon mantolama ve perde donatı planları</div>
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">
                                {proposal.guclendirme?.statikDetayEnabled && proposal.guclendirme?.statikDetayUnitPrice
                                  ? `${proposal.guclendirme.statikDetayUnitPrice} TL/m²`
                                  : '………… TL/m²'}
                              </td>
                              <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                                {proposal.guclendirme?.statikDetayEnabled && (proposal.guclendirme?.statikDetayTotal || 0) > 0
                                  ? `${(proposal.guclendirme.statikDetayTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>

                            {/* Elektrik & Mekanik */}
                            <tr className="bg-slate-50/50">
                              <td className="py-2 px-3 text-center font-bold border-r border-slate-200">2</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900">Elektrik ve Mekanik Projeleri</div>
                                <div className="text-[10px] text-slate-600">Güçlendirme tadilatı tesisat deplase ve uygulama projeleri</div>
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">
                                {proposal.guclendirme?.elektrikMekanikEnabled && proposal.guclendirme?.elektrikMekanikUnitPrice
                                  ? `${proposal.guclendirme.elektrikMekanikUnitPrice} TL/m²`
                                  : '………… TL/m²'}
                              </td>
                              <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                                {proposal.guclendirme?.elektrikMekanikEnabled && (proposal.guclendirme?.elektrikMekanikTotal || 0) > 0
                                  ? `${(proposal.guclendirme.elektrikMekanikTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>

                            {/* Mimari Tadilat */}
                            <tr>
                              <td className="py-2 px-3 text-center font-bold border-r border-slate-200">3</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900">Mimari Tadilat Projeleri</div>
                                <div className="text-[10px] text-slate-600">Güçlendirme perdeleri ve mantolara uygun mimari tadilat projesi</div>
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">
                                {proposal.guclendirme?.mimariTadilatEnabled && proposal.guclendirme?.mimariTadilatUnitPrice
                                  ? `${proposal.guclendirme.mimariTadilatUnitPrice} TL/m²`
                                  : '………… TL/m²'}
                              </td>
                              <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                                {proposal.guclendirme?.mimariTadilatEnabled && (proposal.guclendirme?.mimariTadilatTotal || 0) > 0
                                  ? `${(proposal.guclendirme.mimariTadilatTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>

                            {/* İTÜ / Üniversite Onayı */}
                            <tr className="bg-slate-50/50">
                              <td className="py-2 px-3 text-center font-bold border-r border-slate-200">4</td>
                              <td className="py-2 px-3 border-r border-slate-200">
                                <div className="font-bold text-slate-900">İTÜ / Üniversite Onay Bedeli</div>
                                <div className="text-[10px] text-slate-600">Yetkili Üniversite Akademik Heyeti Proje Onayı ve Raporu</div>
                              </td>
                              <td className="py-2 px-3 text-center border-r border-slate-200 font-mono">
                                {proposal.guclendirme?.ituOnayEnabled ? 'Sabit / Heyet' : '………… TL'}
                              </td>
                              <td className="py-2 px-3 text-right font-black font-mono text-slate-900">
                                {proposal.guclendirme?.ituOnayEnabled && (proposal.guclendirme?.ituOnayTotal || 0) > 0
                                  ? `${(proposal.guclendirme.ituOnayTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>

                            {/* 2. Aşama Alt Toplam */}
                            <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                              <td colSpan={3} className="py-2 px-3 text-right uppercase text-slate-900 font-black">
                                TOPLAM TEKLİF (2. AŞAMA - KDV HARİÇ):
                              </td>
                              <td className="py-2 px-3 text-right font-black font-mono text-slate-950 text-xs">
                                {(proposal.guclendirme?.stage2Total || 0) > 0
                                  ? `${(proposal.guclendirme?.stage2Total || 0).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Page 1 Footer */}
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-700 mt-4">
                    <div>
                      <span>{companyProfile.name} MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.</span>
                      <span className="font-normal text-slate-500 ml-2">| Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}</span>
                    </div>
                    <div>Sayfa 1 / 3</div>
                  </div>
                </div>

                {/* ============================================================= */}
                {/* --- SAYFA 2: SÜREÇ TARİFİ, ÖDEME KOŞULLARI, TEKLİF ÖZETİ & İMZA --- */}
                {/* ============================================================= */}
                <div className="min-h-[1050px] flex flex-col justify-between pt-8 border-t-2 border-slate-300 print:break-before-page">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-5">
                      <div className="flex items-center gap-3">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-16 w-auto object-contain" 
                        />
                        <div>
                          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {companyProfile.name}
                          </h1>
                          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                          </p>
                          <p className="text-[9.5px] font-bold text-blue-950 tracking-tight mt-0.5">
                            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-medium">
                            Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-bold text-xs text-slate-900 pt-2">
                        <div>{new Date(proposal.createdAt).toLocaleDateString('tr-TR')}</div>
                        <div className="text-[11px] font-mono text-blue-950 mt-1">Ref: {proposal.proposalNumber}</div>
                      </div>
                    </div>

                    {/* 2. Süreç Tarifi */}
                    <div className="mb-5">
                      <h2 className="text-xs font-black text-slate-950 uppercase tracking-wide mb-2">
                        2. Süreç Tarifi
                      </h2>
                      <div className="text-xs text-slate-800 leading-relaxed space-y-2.5 text-justify px-0.5">
                        <p>
                          Teklifimizin kabul edilmesine müteakip taraflar arasında sözleşme imzalanacaktır. Bu aşamada gerek bünyemizde bulunan konusunda deneyimli evrak takip uzmanı, mimar ve mühendisin gerek sizlerin veya yetki verilen diğer kişilerin de süreci takip etmesi için gerekli bilgilendirmeler yapılacaktır.
                        </p>
                        <p>
                          Hazırlanacak güçlendirme projeleri <strong>OSB'nin</strong> (veya ilgili Belediyenin / Yetkili İdarenin) onaylayabileceği nitelikte ve gerekli detaylara sahip nitelikte olacaktır. Ayrıca, yapılacak güçlendirmenin mevcut kullanımları en az şekilde etkileyecek, net alanı olabildiğince az daralmasına sebep olacak ve ekonomik olarak en uygun çözümler araştırılacaktır. Bu nedenle yapılarınız için <strong>betonarme, çelik, karbon lifli polimer güçlendirme yöntemlerinden</strong> en uygun olanı veya kompozit birliktelikleriyle çözüme gidilecektir. Hedef, hem yapıların kullanımlarını bozmamak, aynı zamanda güçlendirme sonrası onarım gereksinimini azaltmak, bir yandan da olabildiğince ekonomik bir çözümle depreme dayanıklı yapılar elde edilmesini sağlamak şeklindedir.
                        </p>
                        <p>
                          Bu aşamada işin maliyetinin belirlenebilmesi için proje üzerinden <strong>Keşif ve Yaklaşık Maliyet tabloları</strong> oluşturulacak, teknik şartname ve sözleşme taslağı oluşturularak işin yapımı aşamasında yüklenici (müteahhit) seçiminde kullanılabilecek tüm doneler de hazırlanmış olacaktır.
                        </p>
                      </div>
                    </div>

                    {/* 3. Ödeme Koşulları & Teklif Özeti */}
                    <div className="mb-5">
                      <h2 className="text-xs font-black text-slate-950 uppercase tracking-wide mb-2">
                        3. Ödeme Koşulları & Hükümler
                      </h2>

                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        {/* Sol: Standart Şartlar */}
                        <div className="md:col-span-7 bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2 text-xs text-slate-900">
                          <p className="leading-snug">
                            <strong>1.</strong> Ödeme Koşulları:{' '}
                            {proposal.paymentTerms?.installments && proposal.paymentTerms.installments.length > 0 ? (
                              proposal.paymentTerms.installments.map((inst, idx) => (
                                <span key={inst.id || idx}>
                                  {idx > 0 ? ', ' : ''}
                                  {inst.name || `${idx + 1}. Taksit`} (<strong>%{inst.percentage}</strong> - ₺{(Math.round(proposal.pricing.totalAmount * (inst.percentage / 100)) || inst.amount || 0).toLocaleString('tr-TR')})
                                </span>
                              ))
                            ) : (
                              <>Ödeme cetveli <strong>İş başlangıcında %50</strong>, <strong>Avan proje tesliminde %50</strong> olarak yapılacaktır.</>
                            )}
                          </p>
                          <p className="leading-snug">
                            <strong>2.</strong> Fiyatlarımıza KDV dahil değildir.
                          </p>
                          <p className="leading-snug">
                            <strong>3.</strong> İşin Teslim Süresi: Ödeme cetvelinde ve sözleşmede belirtildiği şekildedir ({proposal.paymentTerms.completionWorkDays || 20} iş günü).
                          </p>
                          <p className="leading-snug">
                            <strong>4.</strong> Projeler <strong>2018 TBDY standartlarına uygun</strong> olarak <strong>Kontrollü Hasar seviyesi</strong> hedeflenerek hazırlanacaktır.
                          </p>
                          <div className="pt-2 border-t border-slate-200 mt-2 text-[11px] text-slate-700 italic">
                            <strong>Not:</strong> Bu fiyat teklifinin geçerlilik süresi <strong>{proposal.paymentTerms.validityDays || 15} takvim günüdür</strong>. Bu sürenin aşılması durumunda teklifin tekrar revize edilmesi gerekmektedir.
                          </div>
                          {proposal.paymentTerms.customNotes && (
                            <p className="pt-1 text-[11px] text-blue-950 font-medium">
                              * {proposal.paymentTerms.customNotes}
                            </p>
                          )}
                        </div>

                        {/* Sağ: Fiyat Özeti Box */}
                        <div className="md:col-span-5 bg-white border-2 border-slate-900 rounded-xl p-4 text-xs space-y-2 shadow-sm">
                          <h4 className="font-black text-slate-900 uppercase text-center text-[11px] border-b border-slate-300 pb-1 mb-1">
                            TEKLİF FİYAT ÖZETİ
                          </h4>
                          <div className="flex justify-between text-slate-700">
                            <span>1. Aşama Toplamı:</span>
                            <span className="font-mono font-bold text-slate-900">
                              {(proposal.guclendirme?.stage1Total || proposal.pricing.subtotal).toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                          {(proposal.guclendirme?.stage2Total || 0) > 0 && (
                            <div className="flex justify-between text-slate-700">
                              <span>2. Aşama Toplamı:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {(proposal.guclendirme?.stage2Total || 0).toLocaleString('tr-TR')} TL
                              </span>
                            </div>
                          )}
                          {proposal.pricing.discount > 0 && (
                            <div className="flex justify-between text-emerald-700 text-[11px] font-bold">
                              <span>Özel İskonto:</span>
                              <span className="font-mono">-₺{proposal.pricing.discount.toLocaleString('tr-TR')}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1">
                            <span>Hizmet Bedeli (KDV Hariç):</span>
                            <span className="font-mono text-slate-950">
                              {(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600 text-[11px]">
                            <span>KDV (%{proposal.pricing.vatRate}):</span>
                            <span className="font-mono">
                              {Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * proposal.pricing.vatRate) / 100).toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                          <div className="flex justify-between font-black text-blue-950 border-t-2 border-slate-900 pt-1.5 text-xs sm:text-sm">
                            <span>GENEL TOPLAM:</span>
                            <span className="font-mono">
                              {proposal.pricing.totalAmount.toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Saygılarımızla & Kaşe-İmza */}
                    <div className="mb-2">
                      <p className="text-xs font-black text-slate-900 mb-3">Saygılarımızla,</p>
                      
                      <div className="border-t-2 border-slate-900 pt-3 grid grid-cols-2 gap-6 text-xs">
                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-300">
                          <p className="font-bold text-blue-950 uppercase text-[11px] mb-0.5">TEKLİF VEREN KURULUŞ</p>
                          <p className="font-bold text-slate-900 text-[11px]">{companyProfile.name}</p>
                          <p className="text-[10px] text-slate-600">İş Bankası IBAN: TR76 0006 4000 0011 0840 5410 74</p>
                          <div className="mt-8 border-b border-slate-400 w-36"></div>
                          <p className="text-[10px] text-slate-500 mt-1">Yetkili İmza & Kaşe</p>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-300 text-right flex flex-col items-end">
                          <p className="font-bold text-blue-950 uppercase text-[11px] mb-0.5">İŞVEREN / MÜŞTERİ</p>
                          <p className="font-bold text-slate-900 text-[11px]">{proposal.client.name}</p>
                          {proposal.client.contactPerson && (
                            <p className="text-[10px] font-semibold text-slate-700 mt-0.5">Muhatap: {proposal.client.contactPerson}</p>
                          )}
                          <p className="text-[10px] text-slate-600">Teklif Kabul & Onay</p>
                          <div className="mt-8 border-b border-slate-400 w-36"></div>
                          <p className="text-[10px] text-slate-500 mt-1">İmza & Tarih</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 2 Footer */}
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <div>
                      <span>{companyProfile.name} MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.</span>
                      <span className="font-normal text-slate-500 ml-2">| Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}</span>
                    </div>
                    <div>Sayfa 2 / 3</div>
                  </div>
                </div>

                {/* ============================================================= */}
                {/* --- SAYFA 3: KURUMSAL REFERANSLAR (GÜÇLENDİRME & RESMİ KURUMLAR) --- */}
                {/* ============================================================= */}
                <div className="min-h-[1050px] flex flex-col justify-between pt-8 border-t-2 border-slate-300 print:break-before-page">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-16 w-auto object-contain" 
                        />
                        <div>
                          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {companyProfile.name}
                          </h1>
                          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                          </p>
                          <p className="text-[9.5px] font-bold text-blue-950 tracking-tight mt-0.5">
                            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-medium">
                            Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-bold text-xs text-slate-900 pt-2">
                        <div>{new Date(proposal.createdAt).toLocaleDateString('tr-TR')}</div>
                        <div className="text-[11px] font-mono text-blue-950 mt-1">Ref: {proposal.proposalNumber}</div>
                      </div>
                    </div>

                    {/* Referanslarımız Header */}
                    <h2 className="font-black text-xs text-slate-900 mb-4 underline uppercase">
                      Kurumsal Referanslarımız & Tamamlanan Güçlendirme / Analiz Projeleri
                    </h2>

                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                      {/* Kurumlar */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <div className="bg-slate-900 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                          KAMU KURUMLARI & BAKANLIKLAR
                        </div>
                        <ul className="p-2.5 space-y-1 text-slate-700 italic">
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bakanlığı</li>
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bak. İSTANBUL İl Müd.</li>
                          <li>• İstanbul Altyapı ve Kentsel Dönüşüm Müdürlüğü</li>
                          <li>• İZMİR Altyapı ve Kentsel Dönüşüm Müdürlüğü</li>
                          <li>• AFAD (Afet ve Acil Durum Yönetimi Başkanlığı)</li>
                          <li>• GEDAŞ Gayrimenkul Değerleme A.Ş.</li>
                          <li>• Türk Telekom A.Ş.</li>
                          <li>• Çamlıca TRT Kulesi ve Tesis Binaları</li>
                          <li>• TOKİ Başkanlığı</li>
                          <li>• KİPTAŞ A.Ş.</li>
                          <li>• Türk Hava Yolları A.O.</li>
                        </ul>
                      </div>

                      {/* Belediye ve Üniversiteler */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <div className="bg-slate-900 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                          BELEDİYE VE ÜNİVERSİTELER
                        </div>
                        <ul className="p-2.5 space-y-1 text-slate-700 italic">
                          <li>• Eyüpsultan / Kağıthane / Kadıköy Belediyeleri</li>
                          <li>• Kartal / Tuzla / Pendik Belediyeleri</li>
                          <li>• Zeytinburnu / Şişli / Fatih Belediyeleri</li>
                          <li>• Maltepe / Beykoz / Güngören Belediyeleri</li>
                          <li>• Yıldız Teknik Üniversitesi (YTÜ)</li>
                          <li>• İstanbul Teknik Üniversitesi (İTÜ)</li>
                          <li>• İstanbul Kültür Üniversitesi</li>
                          <li>• Maltepe Üniversitesi</li>
                          <li>• Boğaziçi Üniversitesi</li>
                        </ul>
                      </div>

                      {/* Özel Kuruluşlar */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <div className="bg-slate-900 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                          SANAYİ VE ÖZEL KURULUŞLAR
                        </div>
                        <ul className="p-2.5 space-y-1 text-slate-700 italic">
                          <li>• Organik Kimya / Arup Mühendislik</li>
                          <li>• MESA ASL Ortaklığı / ÖZAK GYO</li>
                          <li>• Yeşil GYO / Metrocity Millennium</li>
                          <li>• Medical Park Hastanesi / Liv Hospital</li>
                          <li>• Türkiye Hahambaşılığı / Sur Yapı</li>
                          <li>• Ortadoğu İnşaat / Nef / Mint / İDO</li>
                          <li>• Kalyon İnşaat / RSY İnşaat / Nas Gayrimenkul</li>
                          <li>• Memorial Group / Koray GYO / Halkbank</li>
                          <li>• DAP YAPI / Anadolu Efes / Türk Tuborg</li>
                        </ul>
                      </div>

                      {/* Güçlendirme & Riskli Alan Çalışmaları */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <div className="bg-slate-900 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                          GÜÇLENDİRME & RİSKLİ ALAN ÇALIŞMALARI
                        </div>
                        <ul className="p-2.5 space-y-1 text-slate-700 italic">
                          <li>• TEDAŞ 5. Bölge Vaniköy Tesisleri Testleri & Güçlendirme</li>
                          <li>• Beşiktaş Karanfilköy 527 Bina Tespitleri</li>
                          <li>• Kağıthane Yahya Kemal Mah. Riskli Alanı</li>
                          <li>• Kartal Orhantepe Afet Alanı Bina Tespitleri</li>
                          <li>• Kastamonu Sel Afet Alanı Riskli Yapıları</li>
                          <li>• Bitlis Afet Alanı Riskli Yapı Çalışmaları</li>
                          <li>• 2020 Elazığ Depremi Riskli Alan Tespitleri</li>
                          <li>• 2019 İstanbul Depremi AFAD Binaları İncelemesi</li>
                          <li>• 2023 Kahramanmaraş Depremi İncelemeleri</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Page 3 Footer */}
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <div>
                      <span>{companyProfile.name} MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.</span>
                      <span className="font-normal text-slate-500 ml-2">| Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}</span>
                    </div>
                    <div>Sayfa 3 / 3</div>
                  </div>
                </div>
              </div>
            ) : proposal.type === 'performans_raporu' ? (
              /* ================================================================ */
              /* PERFORMANS RAPORU (TBDY 2018) FORMAT (Matching Uploaded PDF)     */
              /* ================================================================ */
              <div className="space-y-10">
                
                {/* --- PAGE 1 --- */}
                <div className="min-h-[1050px] flex flex-col justify-between">
                  <div>
                    {/* Header: Logo + Company Name/Title & Date */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-16 w-auto object-contain" 
                        />
                        <div>
                          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {companyProfile.name}
                          </h1>
                          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ
                          </p>
                          <p className="text-[9.5px] font-bold text-blue-950 tracking-tight mt-0.5">
                            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-medium">
                            Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-bold text-xs text-slate-900 pt-2">
                        {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>

                    {/* Subject (Konu) */}
                    <div className="mb-6 font-bold text-xs text-slate-900 leading-relaxed px-1">
                      <span className="font-extrabold">Konu : </span>
                      {proposal.property.city || 'İstanbul'} İli, {proposal.property.district || '-'} İlçesi, {proposal.property.neighborhood || '-'} Mahallesi, {proposal.property.pafta ? `Pafta: ${proposal.property.pafta}, ` : ''}Ada: {proposal.property.ada || '-'} / Parsel: {proposal.property.parsel || '-'}
                      {proposal.property.fullAddress ? `, ${proposal.property.fullAddress}` : ''} konumunda yer alan <span className="underline">Yapı</span> için taşıyıcı sistemlerinin 2018 TBDY uyarınca incelenerek deprem güvenliğinin belirlenmesi işi
                    </div>

                    {/* Intro text */}
                    <p className="text-xs text-slate-800 mb-4 px-1">
                      Yapının deprem güvenliğinin belirlenmesi amacıyla aşağıdaki tablolarda yapılacak çalışmalar, kapsamları ve ücretlendirme yer almaktadır.
                    </p>

                    {/* Table 1: Yapılacak İşlemler */}
                    <div className="mb-4">
                      <h2 className="font-black text-xs text-slate-900 mb-2">
                        Tablo:1. Yapılacak İşlemler
                      </h2>

                      <div className="border-2 border-slate-900 text-xs">
                        {/* Table Header */}
                        <div className="grid grid-cols-12 bg-slate-100 border-b-2 border-slate-900 font-black text-slate-900 py-2 px-3 text-center">
                          <div className="col-span-4 border-r border-slate-400">Deney Adı</div>
                          <div className="col-span-8">Açıklama</div>
                        </div>

                        {/* Outer Grid with Left Span Header and Right Item Rows */}
                        <div className="grid grid-cols-12 divide-x-2 divide-slate-900">
                          
                          {/* Left Rowspan Section Label */}
                          <div className="col-span-3 p-3 bg-slate-50/50 flex items-center justify-center text-center font-bold text-slate-900 leading-snug text-xs">
                            Mevcut Yapının Deprem Güvenliği Analizlerinin Yapılması (1)
                          </div>

                          {/* Right Content Rows */}
                          <div className="col-span-9 divide-y divide-slate-800">
                            {proposal.scopeItems
                              .filter((item) => item.included)
                              .map((item) => (
                                <div key={item.id} className="grid grid-cols-12 py-2.5 px-3">
                                  <div className="col-span-4 font-bold text-slate-900 pr-2 border-r border-slate-300">
                                    {item.title}
                                  </div>
                                  <div className="col-span-8 text-[11px] text-slate-800 pl-3 leading-relaxed">
                                    {item.description}
                                  </div>
                                </div>
                              ))}
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 1 Footer */}
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <div>
                      <span>{companyProfile.name} MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.</span>
                      <span className="font-normal text-slate-500 ml-2">| Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}</span>
                    </div>
                    <div>Sayfa 1 / 3</div>
                  </div>
                </div>

                {/* --- PAGE 2 --- */}
                <div className="min-h-[1050px] flex flex-col justify-between pt-12 border-t-2 border-slate-300 print:break-before-page">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-16 w-auto object-contain" 
                        />
                        <div>
                          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {companyProfile.name}
                          </h1>
                          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ
                          </p>
                          <p className="text-[9.5px] font-bold text-blue-950 tracking-tight mt-0.5">
                            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-medium">
                            Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-bold text-xs text-slate-900 pt-2">
                        {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>

                    {/* Fiyatlandırma */}
                    <div className="mb-6 space-y-2 text-xs text-slate-900">
                      <h2 className="font-black text-sm text-slate-900 underline mb-3">
                        Fiyatlandırma:
                      </h2>
                      <div className="space-y-2 pl-2">
                        <p className="flex items-start gap-2">
                          <span className="inline-block w-2 h-2 border border-slate-800 mt-1 shrink-0"></span>
                          <span><strong>Tablo 1</strong> de bahsi geçen işlemler yapılıp dosya halinde sunulacaktır.</span>
                        </p>

                        <p className="flex items-start gap-2">
                          <span className="inline-block w-2 h-2 border border-slate-800 mt-1 shrink-0"></span>
                          <span>
                            Bahsi geçen işlemler 2018 TBDY’ nin Sınırlı Bilgi Düzeyine göre yapılacaktır.
                          </span>
                        </p>

                        {/* Price Breakdown Box */}
                        {(() => {
                          const floors = Number(proposal.property.totalFloors) || 0;
                          const uPrice = Number(proposal.pricing.unitPrice) || (floors > 0 ? Math.round(proposal.pricing.subtotal / floors) : 0);
                          const calcText = floors > 0 && uPrice > 0 ? `${floors} Kat × ₺${uPrice.toLocaleString('tr-TR')} / Kat` : null;

                          return proposal.pricing.discount > 0 ? (
                            <div className="ml-4 my-3 p-3 bg-slate-50 border-2 border-slate-800 rounded-lg max-w-md space-y-1.5 font-sans">
                              {uPrice > 0 && (
                                <div className="flex justify-between text-slate-800 text-xs pb-1 border-b border-slate-300">
                                  <span>Kat Başı Birim Fiyat:</span>
                                  <span className="font-mono font-bold text-slate-900">
                                    ₺{uPrice.toLocaleString('tr-TR')} / Kat
                                  </span>
                                </div>
                              )}
                              {calcText && (
                                <div className="flex justify-between text-slate-700 text-[11px]">
                                  <span>Hesaplama ({floors} Kat):</span>
                                  <span className="font-mono font-semibold text-slate-900">
                                    {calcText} = ₺{proposal.pricing.subtotal.toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between text-slate-700">
                                <span>Mevcut Olması Gereken Rakam (Liste Bedeli):</span>
                                <span className="font-mono font-bold line-through text-slate-500">
                                  ₺{proposal.pricing.subtotal.toLocaleString('tr-TR')} + KDV
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-950 font-black text-xs border-t border-slate-300 pt-1">
                                <span>İskontolu Hizmet Bedeli (KDV Hariç):</span>
                                <span className="font-mono text-slate-950 font-extrabold">
                                  ₺{(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} + KDV
                                </span>
                              </div>
                              <div className="flex justify-between text-[11px] text-slate-600">
                                <span>Uygulanan Özel İskonto Tutarı:</span>
                                <span className="font-mono font-bold text-emerald-700">
                                  -₺{proposal.pricing.discount.toLocaleString('tr-TR')}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-950 font-black border-t-2 border-slate-900 pt-1 text-xs">
                                <span>GENEL TOPLAM (KDV Dahil %{proposal.pricing.vatRate}):</span>
                                <span className="font-mono text-sm">
                                  ₺{proposal.pricing.totalAmount.toLocaleString('tr-TR')}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="ml-4 my-2 p-2.5 bg-slate-50 border border-slate-400 rounded-lg max-w-md space-y-1.5 font-sans">
                              {uPrice > 0 && (
                                <div className="flex justify-between text-xs text-slate-800 pb-1 border-b border-slate-200">
                                  <span>Kat Başı Birim Fiyat:</span>
                                  <span className="font-mono font-bold text-slate-900">
                                    ₺{uPrice.toLocaleString('tr-TR')} / Kat
                                  </span>
                                </div>
                              )}
                              {calcText && (
                                <div className="flex justify-between text-[11px] text-slate-700">
                                  <span>Hesaplama ({floors} Kat):</span>
                                  <span className="font-mono font-semibold text-slate-900">
                                    {calcText} = ₺{proposal.pricing.subtotal.toLocaleString('tr-TR')}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between text-xs font-bold text-slate-900 pt-0.5">
                                <span>Hizmet Bedeli (KDV Hariç):</span>
                                <span className="font-mono">₺{proposal.pricing.subtotal.toLocaleString('tr-TR')} + KDV</span>
                              </div>
                              <div className="flex justify-between text-xs font-black text-slate-950 border-t border-slate-300 pt-1">
                                <span>GENEL TOPLAM (KDV Dahil %{proposal.pricing.vatRate}):</span>
                                <span className="font-mono">₺{proposal.pricing.totalAmount.toLocaleString('tr-TR')}</span>
                              </div>
                            </div>
                          );
                        })()}

                        <p className="flex items-start gap-2">
                          <span className="inline-block w-2 h-2 border border-slate-800 mt-1 shrink-0"></span>
                          <span>Teklifimiz <strong>{proposal.paymentTerms.validityDays || 15} gün</strong> geçerli olup verilen sürenin aşılması durumunda tekrar revize edilecektir.</span>
                        </p>
                      </div>
                    </div>

                    {/* 1. Sorumluluklar */}
                    <div className="mb-6 text-xs text-slate-900 space-y-2.5">
                      <h2 className="font-black text-sm text-slate-900">
                        1. Sorumluluklar
                      </h2>
                      <p className="leading-relaxed">
                        Teklifimizin ifade edilen tüm iş kalemleri tarafımızca gerçekleştirilecektir. Sahada yapılacak çalışmalar boyunca İşveren tarafından refakatçi sağlanacaktır. Çalışanların sigorta, iaşe, ibade, ulaşım masrafları tarafımızca karşılanacaktır. İşveren yapılacak çalışmalar öncesinde binaya ait proje ve dokümanları ilgili kurumlardan tedarik ederek Yükleniciye teslim edecektir. Elde edilen sonuç ve bulgular dijital ortamda İşverene teslim edilecektir.
                      </p>
                      <p className="leading-relaxed">
                        Çalışmalar esnasında erişimi mümkün olan tüm mahallere girilerek proje kontrolü ve rölöve çalışmaları gerçekleştirilecektir.
                      </p>
                      <p className="leading-relaxed">
                        Yapılacak çalışmaların tamamı dijital ortamda teslim edilecektir. Hazırlanacak çalışmalar İşverenin bilgisi haricinde 3. Taraflarla paylaşılmayacaktır.
                      </p>
                      <p className="leading-relaxed">
                        Sahada yapılacak çalışmaların kapsamı, yalnızca yapının depremselliği hakkında bilgi edinmek amacıyla yapıldığından ve zaman kazanmak adına, binanın yaşı, durumu, vb. etkenler göz önünde tutulduğundan azaltılarak planlanmıştır. Ancak; tüm değerlendirmeler TS500 ve TS498 Standartları ile 2018 TBDY’ye göre yapılacaktır.
                      </p>
                    </div>

                    {/* 2. Koşullar */}
                    <div className="mb-10 text-xs text-slate-900 space-y-2">
                      <h2 className="font-black text-sm text-slate-900">
                        2. Koşullar
                      </h2>
                      <p className="leading-relaxed font-bold">
                        {proposal.paymentTerms.customNotes || 'Rapor tesliminden sonra 30 gün içinde tüm ödeme yapılacaktır.'}
                      </p>
                    </div>

                    <div className="text-xs font-bold text-slate-900 mt-6 mb-3">
                      Saygılarımızla,
                    </div>

                    <div className="border-t-2 border-slate-900 pt-3 grid grid-cols-2 gap-6 text-xs">
                      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-300">
                        <p className="font-bold text-slate-950 uppercase text-[11px] mb-0.5">TEKLİF VEREN KURULUŞ</p>
                        <p className="font-bold text-slate-900 text-[11px]">{companyProfile.name}</p>
                        <p className="text-[10px] text-slate-600">{companyProfile.title || 'Mühendislik ve Mimarlık Hizmetleri Ltd. Şti.'}</p>
                        <div className="mt-8 border-b border-slate-400 w-36"></div>
                        <p className="text-[10px] text-slate-500 mt-1">Yetkili İmza & Kaşe</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-300 text-right flex flex-col items-end">
                        <p className="font-bold text-slate-950 uppercase text-[11px] mb-0.5">İŞVEREN / MÜŞTERİ</p>
                        <p className="font-bold text-slate-900 text-[11px]">{proposal.client.name}</p>
                        {proposal.client.contactPerson && (
                          <p className="text-[10px] font-semibold text-slate-700 mt-0.5">Muhatap: {proposal.client.contactPerson}</p>
                        )}
                        <p className="text-[10px] text-slate-600">Teklif Kabul & Onay</p>
                        <div className="mt-8 border-b border-slate-400 w-36"></div>
                        <p className="text-[10px] text-slate-500 mt-1">İmza & Tarih</p>
                      </div>
                    </div>
                  </div>

                  {/* Page 2 Footer */}
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <div>
                      <span>{companyProfile.name} MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.</span>
                      <span className="font-normal text-slate-500 ml-2">| Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}</span>
                    </div>
                    <div>Sayfa 2 / 3</div>
                  </div>
                </div>

                {/* --- PAGE 3 --- */}
                <div className="min-h-[1050px] flex flex-col justify-between pt-12 border-t-2 border-slate-300 print:break-before-page">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-slate-900 pb-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-16 w-auto object-contain" 
                        />
                        <div>
                          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {companyProfile.name}
                          </h1>
                          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ
                          </p>
                          <p className="text-[9.5px] font-bold text-blue-950 tracking-tight mt-0.5">
                            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-medium">
                            Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-bold text-xs text-slate-900 pt-2">
                        {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                    </div>

                    {/* Referanslarımız */}
                    <h2 className="font-black text-xs text-slate-900 mb-4 underline">
                      Referanslarımız aşağıda sunulmaktadır.
                    </h2>

                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                      {/* Kurumlar */}
                      <div className="border border-slate-300 rounded p-3">
                        <div className="font-black text-slate-900 uppercase mb-2 text-[11px]">
                          KURUMLAR
                        </div>
                        <ul className="space-y-1 text-slate-700 italic">
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bakanlığı</li>
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bak. İSTANBUL İl Müd.</li>
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bak. İSTANBUL Altyapı ve Kentsel Dönüşüm Müdürlüğü</li>
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bak. İZMİR Altyapı ve Kentsel Dönüşüm Müdürlüğü</li>
                          <li>• AFAD</li>
                          <li>• GEDAŞ</li>
                          <li>• Türk Telekom A.Ş.</li>
                          <li>• Çamlıca TRT Binası</li>
                          <li>• TOKİ</li>
                          <li>• KİPTAŞ</li>
                          <li>• Türk Hava Yolları</li>
                        </ul>
                      </div>

                      {/* Belediye ve Üniversiteler */}
                      <div className="border border-slate-300 rounded p-3">
                        <div className="font-black text-slate-900 uppercase mb-2 text-[11px]">
                          BELEDİYE VE ÜNİVERSİTELER
                        </div>
                        <ul className="space-y-1 text-slate-700 italic">
                          <li>• Eyüp Sultan Belediyesi</li>
                          <li>• Kağıthane Belediyesi</li>
                          <li>• Kadıköy Belediyesi</li>
                          <li>• Kartal Belediyesi</li>
                          <li>• Tuzla Belediyesi</li>
                          <li>• Pendik Belediyesi</li>
                          <li>• Zeytinburnu Belediyesi</li>
                          <li>• Şişli Belediyesi</li>
                          <li>• Fatih Belediyesi</li>
                          <li>• Maltepe Belediyesi</li>
                          <li>• Beykoz Belediyesi</li>
                          <li>• Güngören Belediyesi</li>
                          <li>• Yıldız Teknik Üniversitesi</li>
                          <li>• İstanbul Teknik Üniversitesi</li>
                          <li>• İstanbul Kültür Üniversitesi</li>
                          <li>• Maltepe Üniversitesi</li>
                          <li>• Boğaziçi Üniversitesi</li>
                        </ul>
                      </div>

                      {/* Özel Kuruluşlar */}
                      <div className="border border-slate-300 rounded p-3">
                        <div className="font-black text-slate-900 uppercase mb-2 text-[11px]">
                          ÖZEL KURULUŞLAR
                        </div>
                        <ul className="space-y-1 text-slate-700 italic">
                          <li>• Organik Kimya</li>
                          <li>• MESA ASL Adi Ortaklığı Ticaret İşletmesi</li>
                          <li>• ÖZAK GYO</li>
                          <li>• Yeşil GYO</li>
                          <li>• Metrocity Millenium</li>
                          <li>• Medical Park Hastanesi</li>
                          <li>• Liv Hospital</li>
                          <li>• Türkiye Hahambaşılığı</li>
                          <li>• Sur Yapı</li>
                          <li>• Ortadoğu İnşaat</li>
                          <li>• Nef</li>
                          <li>• Mint</li>
                          <li>• İDO</li>
                          <li>• Kalyon İnşaat</li>
                          <li>• Nas Gayrimenkul Yatırım</li>
                          <li>• Enka İnşaat ve Sanayi A.Ş.</li>
                          <li>• Memorial Group</li>
                          <li>• Koray GYO</li>
                          <li>• Halkbank</li>
                          <li>• DAP YAPI</li>
                          <li>• Anadolu Efes Grup</li>
                          <li>• Türk Tuborg</li>
                        </ul>
                      </div>

                      {/* Riskli Alan Çalışmaları */}
                      <div className="border border-slate-300 rounded p-3">
                        <div className="font-black text-slate-900 uppercase mb-2 text-[11px]">
                          RİSKLİ ANAN ÇALIŞMALARI
                        </div>
                        <ul className="space-y-1 text-slate-700 italic">
                          <li>• TEDAŞ 5. Bölge Müdürlüğü, Vaniköy Tesisleri Binalarında Deprem Testleri</li>
                          <li>• Beşiktaş İlçesi, Karanfilköy 527 Adet Riskli Bina Tespitleri</li>
                          <li>• Kağıthane İlçesi, Yahya Kemal Mah. Riskli Alan Çalışması</li>
                          <li>• Kartal Orhantepe Afet Alanı Riskli Bina Tespitleri</li>
                          <li>• Kastamonu Sel Afet Alanı – Riskli Yapı Çalışmaları</li>
                          <li>• Bitlis Afet Alanı – Riskli Yapı Çalışmaları</li>
                          <li>• 2020 Elazığ Depremi – Elazığ Riskli Alan çalışmaları</li>
                          <li>• 2019 İstanbul Depremi sonrası AFAD’ ın belirlediği İstanbul Genel Ağır Hasarlı Binaların Tespitleri</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Page 3 Footer */}
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <div>
                      <span>{companyProfile.name} MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.</span>
                      <span className="font-normal text-slate-500 ml-2">| Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}</span>
                    </div>
                    <div>Sayfa 3 / 3</div>
                  </div>
                </div>

              </div>
            ) : proposal.type === 'orta_katli_risk' ? (
              /* ================================================================ */
              /* ORTA KATLI YAPI RİSKLİ YAPI TESPİTİ (2019 RYTEİE) EMERALD THEME  */
              /* ================================================================ */
              <div className="font-sans text-slate-900 space-y-6">
                {/* PAGE 1 */}
                <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm relative">
                  {/* Header */}
                  <div className="border-b-2 border-emerald-800 pb-4 mb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-3 mb-1">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-14 w-auto object-contain max-w-[200px]" 
                        />
                      </div>
                      <h1 className="text-base font-black tracking-tight text-emerald-950 uppercase leading-snug">
                        {companyProfile.name}
                      </h1>
                      <p className="text-[11px] font-extrabold text-emerald-800 tracking-wide uppercase">
                        MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                      </p>
                      <p className="text-[10px] font-bold text-emerald-950 tracking-tight mt-0.5">
                        T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                      </p>
                    </div>

                    <div className="text-right sm:text-right w-full sm:w-auto bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 shrink-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                        <strong>Tarih:</strong> {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-xs font-black font-mono text-emerald-950 mt-1">
                        <strong>Ref:</strong> {proposal.proposalNumber}
                      </div>
                    </div>
                  </div>

                  {/* Konu Header */}
                  <div className="bg-emerald-50 border-2 border-emerald-300 text-emerald-950 p-3 rounded-xl mb-5 shadow-sm text-center sm:text-left">
                    <h2 className="text-xs sm:text-sm font-extrabold tracking-tight text-emerald-950 leading-relaxed">
                      <strong>Konu:</strong> {proposal.property.city || 'İstanbul'} İli {proposal.property.district || 'Kadıköy'} İlçesinde Yer Alan{' '}
                      {proposal.property.pafta ? `${proposal.property.pafta} pafta, ` : ''}
                      {proposal.property.ada ? `${proposal.property.ada} ada, ` : ''}
                      {proposal.property.parsel ? `${proposal.property.parsel} nolu parsel ` : ''}
                      için <strong>2019 RYTEİE Yönetmeliğinin Orta Katlı Betonarme binalara göre Rapor Hazırlanması</strong>
                    </h2>
                  </div>

                  {/* Tablo 1: Yapılacak İşlemler */}
                  <div className="mb-4">
                    <div className="border-2 border-emerald-900 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-emerald-900 text-white font-bold text-xs uppercase border-b border-emerald-950">
                            <th className="py-2.5 px-3 w-1/3 border-r border-emerald-800">Deney Adı</th>
                            <th className="py-2.5 px-3 w-2/3">Açıklama</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 bg-white">
                          {proposal.scopeItems
                            .filter((item) => item.included)
                            .map((item, idx) => (
                              <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-emerald-50/30'}>
                                <td className="py-2 px-3 font-bold text-emerald-950 w-1/3 align-top border-r border-slate-300 text-[11px]">
                                  {item.title}
                                </td>
                                <td className="py-2 px-3 text-[10.5px] text-slate-800 leading-relaxed w-2/3">
                                  {item.description}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-[10.5px] font-bold text-emerald-950 mt-1.5 text-center">Tablo: 1 Yapılacak İşlemler</p>
                  </div>

                  {/* Page 1 Footer */}
                  <div className="border-t border-slate-300 pt-2.5 mt-6 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 gap-1">
                    <span className="font-semibold text-emerald-900">www.iskamuhendislik.com</span>
                    <span>Gürsel Mah. Yankı Sk. No:25/2 - Kağıthane / İstanbul | Tel: +90 212 211 47 52</span>
                    <span className="text-slate-500">iska.donusumlab@gmail.com / www.iskamuhendislik.com</span>
                  </div>
                </div>

                {/* PAGE 2 */}
                <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm relative print:break-before-page">
                  {/* Header */}
                  <div className="border-b-2 border-emerald-800 pb-3 mb-4 flex justify-between items-start">
                    <div>
                      <h1 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                        {companyProfile.name}
                      </h1>
                      <p className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wide">
                        MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                      </p>
                    </div>
                    <div className="text-right text-xs font-bold font-mono text-emerald-900">
                      {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                    </div>
                  </div>

                  {/* Page Title */}
                  <div className="mb-5 pb-2 border-b border-emerald-700">
                    <h2 className="text-xs sm:text-sm font-black text-emerald-950 uppercase tracking-tight text-center sm:text-left underline">
                      2019 RYTEİE YÖNETMELİĞİNİN ORTA KATLI BETONARME BİNALARA GÖRE YAPILMASI GEREKEN ÇALIŞMALAR HAKKINDA;
                    </h2>
                  </div>

                  {/* Pricing & Conditions List */}
                  <div className="space-y-3 text-xs text-slate-800 mb-6">
                    <div className="flex items-start gap-2">
                      <span className="inline-block text-emerald-800 font-bold">•</span>
                      <span>Tablo 1 de bahsi geçen işlemler hazırlanıp dosya halinde teslim edilecektir.</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="inline-block text-emerald-800 font-bold">•</span>
                      <span className="font-bold text-slate-900">
                        {proposal.property.totalFloors || 10} katlı bina işlemleri (her kattan numune alımı dâhil) için teklif bedeli:{' '}
                        <strong className="text-emerald-950 text-xs sm:text-sm font-black font-mono">
                          {proposal.pricing.discount > 0 ? (
                            <>
                              Kat Başı ₺{(proposal.pricing.unitPrice || 30000).toLocaleString('tr-TR')} x {proposal.property.totalFloors || 10} Kat ={' '}
                              <span className="line-through text-slate-400 font-normal mr-1.5">
                                ₺{proposal.pricing.subtotal.toLocaleString('tr-TR')}
                              </span>
                              ₺{(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} TL + KDV'dir.
                            </>
                          ) : (
                            `Kat Başı ₺${(proposal.pricing.unitPrice || 30000).toLocaleString('tr-TR')} x ${proposal.property.totalFloors || 10} Kat = ₺${proposal.pricing.subtotal.toLocaleString('tr-TR')} TL + KDV’dir.`
                          )}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="inline-block text-emerald-800 font-bold">•</span>
                      <span>
                        <strong>Ödeme şekli;</strong> Numune için gün belirlendiğinde ödemenin <strong>%30’u</strong>, Numune alındığı gün ödemenin <strong>%30’u</strong>, belediye raporu onayladığında kalan <strong>%40’ı</strong> alınacaktır.
                      </span>
                    </div>
                  </div>

                  {/* Summary Pricing Breakdown Card (TEKLİF FİYAT TABLOSU) */}
                  <div className="bg-emerald-50/60 border border-emerald-300 rounded-xl p-4 max-w-md mx-auto my-6 text-xs space-y-2">
                    <h4 className="font-black text-emerald-950 text-center uppercase tracking-wider border-b border-emerald-200 pb-1.5 mb-2">
                      FİYAT & KDV DETAY TABLOSU
                    </h4>
                    <div className="flex justify-between text-slate-700 font-medium">
                      <span>Birim Hesaplama:</span>
                      <span className="font-mono font-bold text-slate-900">
                        Kat Başı ₺{(proposal.pricing.unitPrice || 30000).toLocaleString('tr-TR')} × {proposal.property.totalFloors || 10} Kat
                      </span>
                    </div>
                    {proposal.pricing.discount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Liste Bedeli:</span>
                        <span className="font-mono line-through">₺{proposal.pricing.subtotal.toLocaleString('tr-TR')} + KDV</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-slate-900">
                      <span>Net Hizmet Bedeli (KDV Hariç):</span>
                      <span className="font-mono text-emerald-950">₺{(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} + KDV</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>KDV (%{proposal.pricing.vatRate}):</span>
                      <span className="font-mono">₺{Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * proposal.pricing.vatRate) / 100).toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="flex justify-between font-black text-sm text-emerald-950 border-t border-emerald-300 pt-1.5">
                      <span>GENEL TOPLAM (KDV Dahil):</span>
                      <span className="font-mono">₺{proposal.pricing.totalAmount.toLocaleString('tr-TR')}</span>
                    </div>
                  </div>

                  {/* Special Warnings Box (Bold *** placed AFTER price offer) */}
                  <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-4 space-y-2 text-xs font-semibold text-slate-900 mb-4">
                    <p className="flex items-start gap-1.5">
                      <span className="font-black text-amber-800 shrink-0">***</span>
                      <span>Numune çalışmaları için ilk gidildiğinde izin verilmez ise tutanak tutulup Kaymakamlık aracılığı ile kolluk kuvvetleri desteğinin alınması ile numuneler alınacaktır. Kolluk kuvveti ile yapılması durumunda fiyatlarımız tekrar revize edilecektir.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="font-black text-amber-800 shrink-0">***</span>
                      <span>Belediye tarafından alınan harçlar fiyatlara dahil değildir.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="font-black text-amber-800 shrink-0">***</span>
                      <span>Numune işlemlerinden sonra tamirat-tadilat istenmesi fiyata dahil değildir.</span>
                    </p>
                  </div>

                  {/* Important Notes (Red Highlighted Text) */}
                  <div className="space-y-2 text-xs font-semibold text-red-700 italic border-t border-slate-200 pt-3 mb-6">
                    <p className="underline font-bold">
                      Not1: Numune için gün belirlendikten 1 hafta içerisinde %30’ luk ön ödeme yapılmaz ise program günü iptal edilecektir.
                    </p>
                    <p>
                      Not2: Bu Teklif geçerlilik süresi 15 gün olup onaylandığında taraflar için sözleşme hükmündedir.
                    </p>
                    <p className="font-bold text-red-800">
                      Firmamız Çevre Şehircilik ve İklim Değişikliği Bakanlığı Tarafından Lisanslı kuruluştur (İSKA DÖN. YAPI LAB. MÜH. VE MİM. HİZ. LTD. ŞTİ.)
                    </p>
                  </div>

                  {/* Signature Section */}
                  <div className="border-t-2 border-emerald-800 pt-4 grid grid-cols-2 gap-8 text-xs mt-8">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-bold text-emerald-950 uppercase mb-1">YÜKLENİCİ / FİRMA</p>
                      <p className="text-[11px] font-semibold text-slate-800">{companyProfile.name}</p>
                      <p className="text-[10px] text-slate-500">Müh. ve Mim. Hiz. Ltd. Şti.</p>
                      <div className="mt-8 border-b border-slate-400 w-36"></div>
                      <p className="text-[10px] text-slate-400 mt-1">İmza & Kaşe</p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-right flex flex-col items-end">
                      <p className="font-bold text-emerald-950 uppercase mb-1">İŞVEREN / MÜŞTERİ</p>
                      <p className="text-[11px] font-semibold text-slate-800">{proposal.client.name}</p>
                      {proposal.client.contactPerson && (
                        <p className="text-[10px] font-semibold text-slate-700 mt-0.5">Muhatap: {proposal.client.contactPerson}</p>
                      )}
                      <p className="text-[10px] text-slate-500">Adı Soyadı / Ünvanı</p>
                      <div className="mt-8 border-b border-slate-400 w-36"></div>
                      <p className="text-[10px] text-slate-400 mt-1">İmza & Tarih</p>
                    </div>
                  </div>

                  {/* Page 2 Footer */}
                  <div className="border-t border-slate-300 pt-2.5 mt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 gap-1">
                    <span className="font-semibold text-emerald-900">www.iskamuhendislik.com</span>
                    <span>Gürsel Mah. Yankı Sk. No:25/2 - Kağıthane / İstanbul | Tel: +90 212 211 47 52</span>
                    <span className="text-slate-500">iska.donusumlab@gmail.com / www.iskamuhendislik.com</span>
                  </div>
                </div>

                {/* PAGE 3 & 4: CORPORATE REFERENCES */}
                <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-sm relative print:break-before-page">
                  <div className="flex justify-between items-center border-b-2 border-emerald-900 pb-2 mb-4">
                    <div>
                      <h3 className="font-black text-sm text-emerald-950 uppercase">KURUMSAL REFERANSLARIMIZ VE BİTİRİLEN ÇALIŞMALAR</h3>
                      <p className="text-[10px] text-slate-500">{companyProfile.name}</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-900">Referans Listesi</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[11px]">
                    {/* Kurumlar */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-emerald-900 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                        KURUMLAR
                      </div>
                      <ul className="p-2.5 space-y-1 text-slate-700 bg-white">
                        <li>• Çevre, Şehircilik ve İklim Değişikliği Bakanlığı</li>
                        <li>• Çevre, Şehircilik ve İklim Değişikliği Bak. İSTANBUL İl Müd.</li>
                        <li>• İstanbul Altyapı ve Kentsel Dönüşüm Müdürlüğü</li>
                        <li>• İZMİR Altyapı ve Kentsel Dönüşüm Müdürlüğü</li>
                        <li>• AFAD (Afet ve Acil Durum Yönetimi Bşk.)</li>
                        <li>• GEDAŞ Gayrimenkul Değerleme A.Ş.</li>
                        <li>• Türk Telekom A.Ş.</li>
                        <li>• Çamlıca TRT Kulesi ve Binası</li>
                        <li>• TOKİ Başkanlığı</li>
                        <li>• KİPTAŞ A.Ş.</li>
                        <li>• Türk Hava Yolları A.O.</li>
                      </ul>
                    </div>

                    {/* Belediye ve Üniversiteler */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-emerald-900 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                        BELEDİYE VE ÜNİVERSİTELER
                      </div>
                      <ul className="p-2.5 space-y-1 text-slate-700 bg-white">
                        <li>• Eyüpsultan / Kağıthane / Kadıköy Belediyeleri</li>
                        <li>• Kartal / Tuzla / Pendik Belediyeleri</li>
                        <li>• Zeytinburnu / Şişli / Fatih Belediyeleri</li>
                        <li>• Maltepe / Beykoz / Güngören Belediyeleri</li>
                        <li>• Yıldız Teknik Üniversitesi</li>
                        <li>• İstanbul Teknik Üniversitesi (İTÜ)</li>
                        <li>• İstanbul Kültür Üni. / Boğaziçi Üni.</li>
                      </ul>
                    </div>

                    {/* Özel Kuruluşlar */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-emerald-900 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                        ÖZEL KURULUŞLAR
                      </div>
                      <ul className="p-2.5 space-y-1 text-slate-700 bg-white">
                        <li>• Organik Kimya / Arup Mühendislik</li>
                        <li>• MESA ASL Ortaklığı / ÖZAK GYO</li>
                        <li>• Dyo Boya Fabrikaları / Yaşar Holding</li>
                        <li>• Yeşil GYO / Metrocity Millennium</li>
                        <li>• Medical Park Hastanesi / Liv Hospital</li>
                        <li>• Türkiye Hahambaşılığı / Sur Yapı</li>
                        <li>• Ortadoğu İnşaat / Nef / Mint / İDO</li>
                        <li>• Kalyon İnşaat / RSY İnşaat / Nas Gayrimenkul</li>
                        <li>• Memorial Group / Koray GYO / Halkbank</li>
                        <li>• DAP YAPI / Anadolu Efes / Türk Tuborg</li>
                        <li>• 5M Yer Hizmetleri / 5G Yapı Grubu A.Ş.</li>
                      </ul>
                    </div>

                    {/* Riskli Alan ve Afet Çalışmaları */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <div className="bg-emerald-900 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                        RİSKLİ ALAN VE AFET ÇALIŞMALARI
                      </div>
                      <ul className="p-2.5 space-y-1 text-slate-700 bg-white">
                        <li>• TEDAŞ 5. Bölge Vaniköy Tesisleri Testleri</li>
                        <li>• Beşiktaş Karanfilköy 527 Bina Tespitleri</li>
                        <li>• Kağıthane Yahya Kemal Mah. Riskli Alanı</li>
                        <li>• Kartal Orhantepe Afet Alanı Bina Tespitleri</li>
                        <li>• Kastamonu Sel Afet Alanı Riskli Yapılar</li>
                        <li>• Bitlis Afet Alanı Riskli Yapı Çalışmaları</li>
                        <li>• 2020 Elazığ Depremi Riskli Alan Tespitleri</li>
                        <li>• 2019 İstanbul Depremi AFAD Ağır Hasarlı Binalar</li>
                        <li>• 2023 Kahramanmaraş Depremi İncelemeleri</li>
                      </ul>
                    </div>
                  </div>

                  {/* Page Footer */}
                  <div className="border-t border-slate-300 pt-2.5 mt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-600 gap-1">
                    <span className="font-semibold text-emerald-900">www.iskamuhendislik.com</span>
                    <span>Gürsel Mah. Yankı Sk. No:25/2 - Kağıthane / İstanbul | Tel: +90 212 211 47 52</span>
                    <span className="text-slate-500">iska.donusumlab@gmail.com / www.iskamuhendislik.com</span>
                  </div>
                </div>
              </div>
            ) : (
              /* ================================================================ */
              /* RİSKLİ YAPI TESPİTİ (6306 Sayılı Kanun) FORMAT                   */
              /* ================================================================ */
              <div className="space-y-10">
                {/* --- PAGE 1: KONU & TABLO 1 (YAPILACAK İŞLEMLER) --- */}
                <div className="min-h-[1050px] flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-blue-900 pb-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-16 w-auto object-contain" 
                        />
                        <div>
                          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {companyProfile.name}
                          </h1>
                          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                          </p>
                          <p className="text-[9.5px] font-bold text-blue-950 tracking-tight mt-0.5">
                            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-medium">
                            Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-bold text-xs text-slate-900 pt-2">
                        <div>{new Date(proposal.createdAt).toLocaleDateString('tr-TR')}</div>
                        <div className="text-[11px] font-mono text-blue-950 mt-1">Ref: {proposal.proposalNumber}</div>
                      </div>
                    </div>

                    {/* Konu Header */}
                    <div className="mb-6 font-bold text-xs text-slate-900 leading-relaxed px-1 bg-blue-50/80 p-3 rounded-xl border border-blue-200">
                      <span className="font-extrabold text-blue-950">Konu : </span>
                      {proposal.property.city || 'İstanbul'} İLİ, {proposal.property.district || '-'} İlçesi, {proposal.property.neighborhood || '-'} Mahallesi, {proposal.property.pafta ? `Pafta: ${proposal.property.pafta}, ` : ''}Ada: {proposal.property.ada || '-'} / Parsel: {proposal.property.parsel || '-'}{proposal.property.fullAddress ? `, ${proposal.property.fullAddress}` : ''} konumunda bulunan {Number(proposal.property.buildingCount) > 1 ? `(${proposal.property.buildingCount} Adet Bina${Number(proposal.property.totalFloors) > 0 ? `, ${proposal.property.totalFloors} Katlı` : ''}) ` : Number(proposal.property.totalFloors) > 0 ? `(${proposal.property.totalFloors} Katlı) ` : ''}Yapı İçin 6306 Sayılı Kanun Ve 2019 RYTEİE Yönetmeliğine Göre Riskli Yapı Tespiti Ve Rapor Hazırlanması
                    </div>

                    {/* Intro text */}
                    <p className="text-xs text-slate-800 mb-4 px-1">
                      Yapının riskli yapı tespiti amacıyla aşağıdaki tablolarda yapılacak çalışmalar, kapsamları ve ücretlendirme yer almaktadır.
                    </p>

                    {/* Table 1: Yapılacak İşlemler */}
                    <div className="mb-4">
                      <h2 className="font-black text-xs text-slate-900 mb-2">
                        Tablo 1: Yapılacak İşlemler (6306 Sayılı Kanun Kapsamında)
                      </h2>

                      <div className="border-2 border-slate-900 text-xs rounded-lg overflow-hidden">
                        <div className="grid grid-cols-12 bg-blue-950 text-white font-black py-2 px-3 text-center">
                          <div className="col-span-4 border-r border-blue-800">Deney / İnceleme Adı</div>
                          <div className="col-span-8">Açıklama & Uygulama Standartları</div>
                        </div>

                        <div className="divide-y divide-slate-300 bg-white">
                          {proposal.scopeItems
                            .filter((item) => item.included)
                            .map((item, idx) => (
                              <div key={item.id} className={`grid grid-cols-12 py-2.5 px-3 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                                <div className="col-span-4 font-bold text-blue-950 pr-2 border-r border-slate-300 text-[11px]">
                                  {item.title}
                                </div>
                                <div className="col-span-8 text-[11px] text-slate-800 pl-3 leading-relaxed">
                                  {item.description}
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Page 1 Footer */}
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <div>
                      <span>{companyProfile.name} MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.</span>
                      <span className="font-normal text-slate-500 ml-2">| Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}</span>
                    </div>
                    <div>Sayfa 1 / 3</div>
                  </div>
                </div>

                {/* --- PAGE 2: ÖDEME ŞARTLARI & FİYATLANDIRMA & İMZA PROTOKOLÜ --- */}
                <div className="min-h-[1050px] flex flex-col justify-between pt-12 border-t-2 border-slate-300 print:break-before-page">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-blue-900 pb-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-16 w-auto object-contain" 
                        />
                        <div>
                          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {companyProfile.name}
                          </h1>
                          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                          </p>
                          <p className="text-[9.5px] font-bold text-blue-950 tracking-tight mt-0.5">
                            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-medium">
                            Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-bold text-xs text-slate-900 pt-2">
                        <div>{new Date(proposal.createdAt).toLocaleDateString('tr-TR')}</div>
                        <div className="text-[11px] font-mono text-blue-950 mt-1">Ref: {proposal.proposalNumber}</div>
                      </div>
                    </div>

                    {/* Title */}
                    <h2 className="font-black text-sm text-blue-950 uppercase tracking-tight underline mb-4">
                      TEKLİF ŞARTLARI, ÖDEME VE İMZA PROTOKOLÜ
                    </h2>

                    {/* Ödeme Şartları Box */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-xs mb-5 space-y-2">
                      <h3 className="font-extrabold text-blue-950 uppercase text-xs">
                        2019 RYTEİE YÖNETMELİĞİ & ÖDEME KOŞULLARI
                      </h3>
                      <ul className="space-y-1.5 text-xs text-slate-800 list-disc pl-4">
                        <li>Tablo 1'de bahsi geçen işlemler yapılıp dosya halinde resmî kuruma sunulacaktır.</li>
                        <li>
                          <strong>Ödeme Şekli:</strong>{' '}
                          {proposal.paymentTerms?.installments && proposal.paymentTerms.installments.length > 0 ? (
                            proposal.paymentTerms.installments.map((inst, idx) => (
                              <span key={inst.id || idx}>
                                {idx > 0 ? ', ' : ''}
                                {inst.name || `${idx + 1}. Taksit`} (<strong>%{inst.percentage}</strong> - ₺{(Math.round(proposal.pricing.totalAmount * (inst.percentage / 100)) || inst.amount || 0).toLocaleString('tr-TR')})
                              </span>
                            ))
                          ) : (
                            <>Numune için gün belirlendiğinde ödemenin <strong>%30'u</strong>, Numune alındığı gün ödemenin <strong>%30'u</strong>, belediye/resmî kurum raporu onayladığında kalan <strong>%40'ı</strong> alınacaktır.</>
                          )}
                        </li>
                      </ul>
                    </div>

                    {/* Fiyatlandırma Tablosu / Box */}
                    <div className="bg-white border-2 border-slate-900 rounded-xl p-4 max-w-md mx-auto shadow-sm mb-5">
                      <h3 className="font-black text-slate-900 text-center uppercase tracking-wider text-xs border-b border-slate-300 pb-2 mb-3">
                        TEKLİF FİYAT ÖZETİ
                      </h3>

                      <div className="space-y-2 text-xs">
                        {Number(proposal.property.buildingCount) > 1 ? (
                          <>
                            <div className="flex justify-between text-slate-700 font-medium">
                              <span>Bina / Yapı Sayısı:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {proposal.property.buildingCount} Adet Bina
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-700 font-medium">
                              <span>Bina Başı Birim Fiyat:</span>
                              <span className="font-mono font-bold text-slate-900">
                                ₺{Number(proposal.pricing.unitPrice || 0).toLocaleString('tr-TR')} + KDV / Bina
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-800 font-bold bg-blue-50/70 px-2 py-1 rounded border border-blue-200">
                              <span>Riskli Yapı Tespiti Hizmet Bedeli ({proposal.property.buildingCount} Bina):</span>
                              <span className="font-mono font-extrabold text-blue-950">
                                ₺{(Number(proposal.property.buildingCount || 1) * Number(proposal.pricing.unitPrice || 0)).toLocaleString('tr-TR')} + KDV
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-slate-700 font-medium">
                            <span>Riskli Yapı Tespiti Hizmet Bedeli (1 Adet Bina):</span>
                            <span className="font-mono font-bold text-slate-900">
                              ₺{Number(proposal.pricing.unitPrice || 0).toLocaleString('tr-TR')} + KDV
                            </span>
                          </div>
                        )}

                        {proposal.pricing.kollukKuvvetiIncluded && (
                          <div className="flex justify-between text-amber-950 font-bold bg-amber-50/80 px-2 py-1 rounded border border-amber-200">
                            <span>Kolluk Kuvvetleri & Kaymakamlık Operasyon Bedeli:</span>
                            <span className="font-mono font-extrabold text-amber-900">
                              +₺{Number(proposal.pricing.kollukKuvvetiPrice || 25000).toLocaleString('tr-TR')} + KDV
                            </span>
                          </div>
                        )}

                        {proposal.pricing.discount > 0 ? (
                          <>
                            <div className="flex justify-between text-slate-700">
                              <span>Mevcut Olması Gereken Rakam (Liste Bedeli):</span>
                              <span className="font-mono font-bold text-slate-500 line-through">
                                ₺{proposal.pricing.subtotal.toLocaleString('tr-TR')} + KDV
                              </span>
                            </div>

                            <div className="flex justify-between text-slate-950 font-black">
                              <span>İskontolu Hizmet Bedeli (KDV Hariç):</span>
                              <span className="font-mono text-slate-950 font-extrabold">
                                ₺{(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} + KDV
                              </span>
                            </div>

                            <div className="flex justify-between text-emerald-700 text-[11px] font-bold">
                              <span>Uygulanan Özel İskonto Tutarı:</span>
                              <span className="font-mono">-₺{proposal.pricing.discount.toLocaleString('tr-TR')}</span>
                            </div>
                          </>
                        ) : (
                          <div className={`flex justify-between text-slate-800 font-bold ${proposal.pricing.kollukKuvvetiIncluded || Number(proposal.property.buildingCount) > 1 ? 'border-t border-slate-200 pt-1' : ''}`}>
                            <span>{proposal.pricing.kollukKuvvetiIncluded ? 'Toplam Hizmet Bedeli (KDV Hariç):' : 'Hizmet Bedeli (KDV Hariç):'}</span>
                            <span className="font-mono font-bold text-slate-900">₺{proposal.pricing.subtotal.toLocaleString('tr-TR')} + KDV</span>
                          </div>
                        )}

                        <div className="flex justify-between text-slate-700">
                          <span>Katma Değer Vergisi (%{proposal.pricing.vatRate} KDV):</span>
                          <span className="font-mono font-bold text-slate-800">
                            ₺{Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * proposal.pricing.vatRate) / 100).toLocaleString('tr-TR')}
                          </span>
                        </div>

                        <div className="flex justify-between text-sm font-black text-blue-950 border-t-2 border-slate-900 pt-2">
                          <span>GENEL TOPLAM (KDV Dahil):</span>
                          <span className="font-mono text-base">₺{proposal.pricing.totalAmount.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>

                      <div className="text-[10.5px] text-slate-600 italic text-center mt-3 pt-2 border-t border-slate-200">
                        * Ödeme Planı: %30 Randevu + %30 Numune Alımı + %40 Belediye/Resmî Onay
                      </div>
                    </div>

                    {/* Notlar & Uyarılar */}
                    <div className="space-y-1.5 text-xs text-slate-800 mb-6">
                      <p>*** Binalarda dilatasyon tespit edilmesi durumunda her dilatasyon ayrı bir yapı olarak değerlendirilecektir.</p>
                      {proposal.pricing.kollukKuvvetiIncluded ? (
                        <p className="text-blue-950 font-bold bg-blue-50/80 p-2 rounded-lg border border-blue-200">
                          *** Bu teklif, saha tespitlerinde izin verilmeyen / engellenen durumlarda Kaymakamlık resmî protokolü ve Kolluk Kuvvetleri (Polis/Zabıta) refakatinde numune alma operasyonunu (+25.000 TL) kapsayacak şekilde hazırlanmıştır.
                        </p>
                      ) : (
                        <p>
                          *** Numune çalışmaları için ilk gidildiğinde izin verilmez ise tutanak tutulup Kaymakamlık aracılığı ile kolluk kuvvetleri desteğinin alınması ile numuneler alınacaktır. Bu teklif standart numune alımını kapsamakta olup kolluk kuvveti ile işlem yapılması durumunda +25.000 TL operasyon bedeli ilave edilecektir.
                        </p>
                      )}
                      <p>*** Numune işlemlerinden sonra tamirat-tadilat istenmesi fiyata dahil değildir.</p>
                      <p className="text-rose-900 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200 mt-2">
                        Not 1: Numune için gün belirlendikten 1 hafta içerisinde %30'luk ön ödeme yapılmaz ise program günü iptal edilecektir.
                      </p>
                      <p className="text-amber-900 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200">
                        Not 2: Bu Teklif geçerlilik süresi {proposal.paymentTerms.validityDays || 15} gün olup onaylandığında taraflar için sözleşme hükmündedir.
                      </p>
                      <p className="text-slate-700 font-medium pt-1">
                        <strong>Lisans Beyanı:</strong> Firmamız Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Tarafından Lisanslı kuruluştur ({companyProfile.name}).
                      </p>
                    </div>

                    {/* İmza Bölümü */}
                    <div className="border-t-2 border-slate-900 pt-4 grid grid-cols-2 gap-8 text-xs">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300">
                        <p className="font-bold text-blue-950 uppercase mb-1">TEKLİF VEREN KURULUŞ</p>
                        <p className="text-[11px] font-semibold text-slate-800">{companyProfile.name}</p>
                        <p className="text-[10px] text-slate-500">{companyProfile.title}</p>
                        <div className="mt-8 border-b border-slate-400 w-36"></div>
                        <p className="text-[10px] text-slate-400 mt-1">İmza & Kaşe</p>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-right flex flex-col items-end">
                        <p className="font-bold text-blue-950 uppercase mb-1">MÜŞTERİ / YAPI SAHİBİ</p>
                        <p className="text-[11px] font-semibold text-slate-800">{proposal.client.name}</p>
                        {proposal.client.contactPerson && (
                          <p className="text-[10px] font-semibold text-slate-700 mt-0.5">Muhatap: {proposal.client.contactPerson}</p>
                        )}
                        <p className="text-[10px] text-slate-500">Kabul Ve Onay</p>
                        <div className="mt-8 border-b border-slate-400 w-36"></div>
                        <p className="text-[10px] text-slate-400 mt-1">İmza & Tarih</p>
                      </div>
                    </div>
                  </div>

                  {/* Page 2 Footer */}
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <div>
                      <span>{companyProfile.name} MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.</span>
                      <span className="font-normal text-slate-500 ml-2">| Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}</span>
                    </div>
                    <div>Sayfa 2 / 3</div>
                  </div>
                </div>

                {/* --- PAGE 3: KURUMSAL REFERANSLAR --- */}
                <div className="min-h-[1050px] flex flex-col justify-between pt-12 border-t-2 border-slate-300 print:break-before-page">
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-start border-b-2 border-blue-900 pb-3 mb-6">
                      <div className="flex items-center gap-3">
                        <CompanyLogoDisplay 
                          logoUrl={companyProfile.logoUrl} 
                          alt={companyProfile.name} 
                          className="h-16 w-auto object-contain" 
                        />
                        <div>
                          <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                            {companyProfile.name}
                          </h1>
                          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide">
                            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                          </p>
                          <p className="text-[9.5px] font-bold text-blue-950 tracking-tight mt-0.5">
                            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                          </p>
                          <p className="text-[9.5px] text-slate-600 font-medium">
                            Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-bold text-xs text-slate-900 pt-2">
                        <div>{new Date(proposal.createdAt).toLocaleDateString('tr-TR')}</div>
                        <div className="text-[11px] font-mono text-blue-950 mt-1">Ref: {proposal.proposalNumber}</div>
                      </div>
                    </div>

                    {/* Referanslarımız Header */}
                    <h2 className="font-black text-xs text-slate-900 mb-4 underline uppercase">
                      Referanslarımız ve Tamamlanan Çalışmalarımız
                    </h2>

                    <div className="grid grid-cols-2 gap-4 text-[11px]">
                      {/* Kurumlar */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <div className="bg-blue-950 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                          KURUMLAR
                        </div>
                        <ul className="p-2.5 space-y-1 text-slate-700 italic">
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bakanlığı</li>
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bak. İSTANBUL İl Müd.</li>
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bak. İSTANBUL Altyapı ve Kentsel Dönüşüm Müdürlüğü</li>
                          <li>• Çevre, Şehircilik ve İklim Değişikliği Bak. İZMİR Altyapı ve Kentsel Dönüşüm Müdürlüğü</li>
                          <li>• AFAD (Afet ve Acil Durum Yönetimi Bşk.)</li>
                          <li>• GEDAŞ Gayrimenkul Değerleme A.Ş.</li>
                          <li>• Türk Telekom A.Ş.</li>
                          <li>• Çamlıca TRT Kulesi ve Tesis Binaları</li>
                          <li>• TOKİ Başkanlığı</li>
                          <li>• KİPTAŞ A.Ş.</li>
                          <li>• Türk Hava Yolları A.O.</li>
                        </ul>
                      </div>

                      {/* Belediye ve Üniversiteler */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <div className="bg-blue-950 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                          BELEDİYE VE ÜNİVERSİTELER
                        </div>
                        <ul className="p-2.5 space-y-1 text-slate-700 italic">
                          <li>• Eyüpsultan / Kağıthane / Kadıköy Belediyeleri</li>
                          <li>• Kartal / Tuzla / Pendik Belediyeleri</li>
                          <li>• Zeytinburnu / Şişli / Fatih Belediyeleri</li>
                          <li>• Maltepe / Beykoz / Güngören Belediyeleri</li>
                          <li>• Yıldız Teknik Üniversitesi</li>
                          <li>• İstanbul Teknik Üniversitesi (İTÜ)</li>
                          <li>• İstanbul Kültür Üniversitesi</li>
                          <li>• Maltepe Üniversitesi</li>
                          <li>• Boğaziçi Üniversitesi</li>
                        </ul>
                      </div>

                      {/* Özel Kuruluşlar */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <div className="bg-blue-950 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                          ÖZEL KURULUŞLAR
                        </div>
                        <ul className="p-2.5 space-y-1 text-slate-700 italic">
                          <li>• Organik Kimya / Arup Mühendislik</li>
                          <li>• MESA ASL Ortaklığı / ÖZAK GYO</li>
                          <li>• Yeşil GYO / Metrocity Millennium</li>
                          <li>• Medical Park Hastanesi / Liv Hospital</li>
                          <li>• Türkiye Hahambaşılığı / Sur Yapı</li>
                          <li>• Ortadoğu İnşaat / Nef / Mint / İDO</li>
                          <li>• Kalyon İnşaat / RSY İnşaat / Nas Gayrimenkul</li>
                          <li>• Memorial Group / Koray GYO / Halkbank</li>
                          <li>• DAP YAPI / Anadolu Efes / Türk Tuborg</li>
                        </ul>
                      </div>

                      {/* Riskli Alan Çalışmaları */}
                      <div className="border border-slate-300 rounded-lg overflow-hidden">
                        <div className="bg-blue-950 text-white font-bold p-1.5 uppercase text-center text-[10px]">
                          RİSKLİ ALAN VE AFET ÇALIŞMALARI
                        </div>
                        <ul className="p-2.5 space-y-1 text-slate-700 italic">
                          <li>• TEDAŞ 5. Bölge Vaniköy Tesisleri Testleri</li>
                          <li>• Beşiktaş Karanfilköy 527 Bina Tespitleri</li>
                          <li>• Kağıthane Yahya Kemal Mah. Riskli Alanı</li>
                          <li>• Kartal Orhantepe Afet Alanı Bina Tespitleri</li>
                          <li>• Kastamonu Sel Afet Alanı Riskli Yapıları</li>
                          <li>• Bitlis Afet Alanı Riskli Yapı Çalışmaları</li>
                          <li>• 2020 Elazığ Depremi Riskli Alan Tespitleri</li>
                          <li>• 2019 İstanbul Depremi AFAD Binaları</li>
                          <li>• 2023 Kahramanmaraş Depremi İncelemeleri</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Page 3 Footer */}
                  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[10px] font-bold text-slate-700">
                    <div>
                      <span>{companyProfile.name} MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.</span>
                      <span className="font-normal text-slate-500 ml-2">| Tel: {companyProfile.phone || '0212 211 47 52'} | Web: {companyProfile.website || 'www.iskamuhendislik.com'}</span>
                    </div>
                    <div>Sayfa 3 / 3</div>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
