import React, { useState } from 'react';
import { Proposal, CompanyProfile } from '../types';
import { PROPOSAL_TYPE_LABELS } from '../data/defaultTemplates';
import { exportProposalToPdf } from '../utils/pdfGenerator';
import { sanitizeProposal } from '../utils/storage';
import { CompanyLogoDisplay } from '../assets/iskaLogo';
import { 
  Download, 
  Printer, 
  Share2, 
  X, 
  Edit3
} from 'lucide-react';

interface ProposalPreviewModalProps {
  proposal: Proposal | null;
  companyProfile: CompanyProfile;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (proposal: Proposal) => void;
}

const DocHeaderPage1: React.FC<{
  companyProfile: CompanyProfile;
  date: string;
  refNo: string;
  theme?: 'slate' | 'emerald' | 'blue';
}> = ({ companyProfile, date, refNo, theme = 'emerald' }) => {
  const lineBorder = theme === 'blue' ? 'border-[#1e3a8a]' : theme === 'slate' ? 'border-slate-800' : 'border-[#00897B]';
  const badgeBg = theme === 'blue' ? 'bg-blue-50 border-blue-200' : theme === 'slate' ? 'bg-slate-100 border-slate-300' : 'bg-[#e8f5e9] border-[#a5d6a7]';
  const licenseColor = theme === 'blue' ? 'text-blue-900' : theme === 'slate' ? 'text-slate-800' : 'text-[#004d40]';

  return (
    <div className={`flex justify-between items-center border-b-2 ${lineBorder} pb-2.5 mb-4`}>
      <div className="flex items-center gap-3">
        <CompanyLogoDisplay 
          logoUrl={companyProfile.logoUrl} 
          alt={companyProfile.name} 
          className="h-11 w-auto object-contain max-w-[130px]" 
        />
        <div>
          <h1 className="text-[13px] font-black text-slate-950 tracking-tight uppercase leading-tight">
            {companyProfile.name}
          </h1>
          <p className="text-[9px] font-extrabold text-slate-800 uppercase tracking-wide">
            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
          </p>
          <p className={`text-[8.5px] font-bold ${licenseColor} tracking-tight mt-0.5`}>
            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
          </p>
        </div>
      </div>

      <div className={`${badgeBg} border rounded-lg px-3.5 py-1.5 text-right shrink-0`}>
        <div className="text-[9.5px] font-bold text-slate-900">
          TARİH: {new Date(date).toLocaleDateString('tr-TR')}
        </div>
        <div className="text-[9.5px] font-bold font-mono text-slate-900">
          Ref: {refNo}
        </div>
      </div>
    </div>
  );
};

const DocHeaderPage2: React.FC<{
  companyProfile: CompanyProfile;
  date: string;
  theme?: 'slate' | 'emerald' | 'blue';
}> = ({ companyProfile, date, theme = 'emerald' }) => {
  const lineBorder = theme === 'blue' ? 'border-[#1e3a8a]' : theme === 'slate' ? 'border-slate-800' : 'border-[#00897B]';

  return (
    <div className={`flex justify-between items-end border-b-2 ${lineBorder} pb-1.5 mb-4`}>
      <div>
        <h1 className="text-[12px] font-black text-slate-950 uppercase tracking-tight leading-tight">
          {companyProfile.name}
        </h1>
        <p className="text-[8.5px] font-extrabold text-slate-700 uppercase tracking-wide">
          MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
        </p>
      </div>
      <div className="text-right text-[9.5px] font-bold text-slate-900">
        {new Date(date).toLocaleDateString('tr-TR')}
      </div>
    </div>
  );
};

const DocFooter: React.FC<{
  companyProfile: CompanyProfile;
}> = ({ companyProfile }) => (
  <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[8.5px] font-medium text-slate-600 shrink-0 mt-auto">
    <div className="font-bold text-[#00695c]">
      {companyProfile.website || 'www.iskamuhendislik.com'}
    </div>
    <div className="text-slate-600 text-[8px] text-right">
      {companyProfile.address || 'Gürsel Mah. Yankı Sk. No:25/2 - Kağıthane / İstanbul'} | Tel: +90 {companyProfile.phone || '212 211 47 52'} | iska.donusumlab@gmail.com / {companyProfile.website || 'www.iskamuhendislik.com'}
    </div>
  </div>
);

const ReferencesPage: React.FC<{
  companyProfile: CompanyProfile;
  date: string;
  refNo: string;
  theme?: 'slate' | 'emerald' | 'blue';
}> = ({ companyProfile }) => {
  return (
    <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-8 box-border flex flex-col justify-between overflow-hidden shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
      <div>
        {/* References Page Top Header */}
        <div className="border-b-2 border-[#00897B] pb-1.5 mb-4">
          <div className="flex justify-between items-end">
            <h2 className="text-[12px] font-black uppercase tracking-tight text-slate-950">
              KURUMSAL REFERANSLARIMIZ VE BİTİRİLEN ÇALIŞMALAR
            </h2>
            <span className="text-[9.5px] font-bold text-slate-700">Referans Listesi</span>
          </div>
          <p className="text-[8.5px] font-bold text-slate-600 uppercase mt-0.5">
            {companyProfile.name}
          </p>
        </div>

        {/* 2x2 Grid of Reference Cards */}
        <div className="grid grid-cols-2 gap-4 text-[9px]">
          {/* Card 1: Kurumlar */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs">
            <div className="bg-[#00594c] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[9px] mb-2.5">
              KURUMLAR
            </div>
            <ul className="space-y-1 text-slate-700 leading-normal pl-1">
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

          {/* Card 2: Belediye ve Üniversiteler */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs">
            <div className="bg-[#00594c] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[9px] mb-2.5">
              BELEDİYE VE ÜNİVERSİTELER
            </div>
            <ul className="space-y-1 text-slate-700 leading-normal pl-1">
              <li>• Eyüpsultan / Kağıthane / Kadıköy Belediyeleri</li>
              <li>• Kartal / Tuzla / Pendik Belediyeleri</li>
              <li>• Zeytinburnu / Şişli / Fatih Belediyeleri</li>
              <li>• Maltepe / Beykoz / Güngören Belediyeleri</li>
              <li>• Yıldız Teknik Üniversitesi</li>
              <li>• İstanbul Teknik Üniversitesi (İTÜ)</li>
              <li>• İstanbul Kültür Üni. / Boğaziçi Üni.</li>
            </ul>
          </div>

          {/* Card 3: Özel Kuruluşlar */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs">
            <div className="bg-[#00594c] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[9px] mb-2.5">
              ÖZEL KURULUŞLAR
            </div>
            <ul className="space-y-1 text-slate-700 leading-normal pl-1">
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

          {/* Card 4: Riskli Alan ve Afet Çalışmaları */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-xs">
            <div className="bg-[#00594c] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[9px] mb-2.5">
              RİSKLİ ALAN VE AFET ÇALIŞMALARI
            </div>
            <ul className="space-y-1 text-slate-700 leading-normal pl-1">
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
      </div>

      <DocFooter companyProfile={companyProfile} />
    </div>
  );
};

export const ProposalPreviewModal: React.FC<ProposalPreviewModalProps> = ({
  proposal: rawProposal,
  companyProfile,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const proposal = rawProposal ? sanitizeProposal(rawProposal) : null;

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Modal Container */}
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border border-slate-700 flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Action Bar */}
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
            className="printable-document bg-transparent text-slate-900 w-[794px] max-w-[794px] font-sans print:w-full"
          >
            {/* ================================================================ */}
            {/* 1. STATİK GÜÇLENDİRME PROJE TEKLİFİ                              */}
            {/* ================================================================ */}
            {proposal.type === 'statik_guclendirme' ? (
              <div>
                {/* --- PAGE 1 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-8 box-border flex flex-col justify-between overflow-hidden shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div>
                    <DocHeaderPage1 companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="slate" />

                    {/* Konu Header */}
                    <div className="mb-3 bg-slate-50 p-3 rounded-xl border border-slate-300 text-[10px] text-slate-900 space-y-1">
                      <div className="flex items-baseline">
                        <span className="w-14 font-extrabold text-slate-950 shrink-0">Sayı :</span>
                        <span className="font-mono font-bold text-blue-950">{proposal.proposalNumber}</span>
                      </div>
                      <div className="flex items-baseline">
                        <span className="w-14 font-extrabold text-slate-950 shrink-0">Konu :</span>
                        <div className="font-medium leading-relaxed">
                          <strong>{proposal.property.city || 'İstanbul'}</strong> İli, <strong>{proposal.property.district || 'Ümraniye'}</strong> İlçesi, <strong>{proposal.property.neighborhood || proposal.property.pafta || 'Dudullu OSB'}</strong>, <strong>{proposal.property.parsel ? `${proposal.property.parsel} parsel` : (proposal.property.ada ? `${proposal.property.ada} Ada / ${proposal.property.parsel} Parsel` : 'ilgili taşınmaz')}</strong> yer alan <strong>{proposal.client.name || 'İşveren'}</strong>'ne ait <strong>{proposal.property.buildingCount || (proposal.guclendirme?.buildingCount || 2)} adet yapı</strong>{proposal.property.totalArea ? ` (${proposal.property.totalArea.toLocaleString('tr-TR')} m² inşaat alanı)` : ''} için <strong>2018 Türkiye Bina Deprem Yönetmeliğine uygun olarak Statik Güçlendirme Avan ve Detay Projelerinin Hazırlanması İşi Fiyat Teklifi</strong>
                        </div>
                      </div>
                    </div>

                    <p className="text-[9.5px] text-slate-800 leading-relaxed mb-3 text-justify">
                      Bu doküman yürürlükteki yönetmelikler çerçevesinde 50 yılda aşılma olasılığı <strong>%10</strong> olan deprem düzeyine göre <strong>“Kontrollü Hasar”</strong> seviyesine ulaşmalarını sağlayacak nitelikte ve yeterlikte güçlendirme projelerinin hazırlanmasına yönelik hazırladığımız fiyat teklifidir.
                    </p>

                    {/* 1. Fiyat Teklifi ve Kapsam */}
                    <div className="mb-3">
                      <h2 className="text-[10.5px] font-black text-slate-950 uppercase tracking-wide mb-1">
                        1. Fiyat Teklifi ve Kapsam
                      </h2>
                      <p className="text-[9.5px] text-slate-800 leading-relaxed text-justify mb-2">
                        Yapılacak işin birden çok aşamaya sahip olması nedeniyle fiyat teklifimiz iş kalemlerine ayrılmıştır:
                      </p>
                      <div className="bg-slate-100/80 p-2 rounded-lg border border-slate-200 text-[9px] text-slate-900 font-semibold mb-3">
                        <p className="text-slate-800">• <strong>1. Aşama:</strong> Binanın güçlendirme Avan projesine ilişkin işlemler yer almaktadır.</p>
                        <p className="text-slate-800">• <strong>2. Aşama:</strong> Statik Detay sürecine ilişkin işlemler yer almaktadır.</p>
                      </div>
                    </div>

                    {/* TABLO 1 */}
                    <div className="mb-3">
                      <div className="bg-slate-900 text-white px-3 py-1.5 rounded-t-lg flex justify-between items-center text-[9.5px] font-bold">
                        <span>İŞ KALEMİ (KAPSAM) 1. AŞAMA</span>
                        <span className="text-amber-400 font-mono">
                          {(proposal.guclendirme?.stage1Total || proposal.pricing.subtotal).toLocaleString('tr-TR')} TL
                        </span>
                      </div>

                      <div className="border border-slate-900 text-[9px] rounded-b-lg overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 text-[9px]">
                              <th className="py-1.5 px-2.5 w-1/12 text-center border-r border-slate-300">No</th>
                              <th className="py-1.5 px-2.5 w-7/12 border-r border-slate-300">Hizmet / İşlem Kalemi</th>
                              <th className="py-1.5 px-2.5 w-2/12 text-center border-r border-slate-300">Miktar</th>
                              <th className="py-1.5 px-2.5 w-2/12 text-right">Teklif Tutarı</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            <tr>
                              <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">1</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                                Sondaja dayalı Zemin ve Geoteknik Rapor
                              </td>
                              <td className="py-1.5 px-2.5 text-center border-r border-slate-200 font-mono">
                                {proposal.guclendirme?.sondajCount || 6} Adet
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-bold font-mono text-slate-900">
                                {proposal.guclendirme?.sondajIncluded && (proposal.guclendirme?.sondajTotal || 0) > 0
                                  ? `${(proposal.guclendirme.sondajTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>
                            <tr className="bg-slate-50/50">
                              <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">2</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                                Temel çukuru açılarak Temel sisteminin belirlenmesi
                              </td>
                              <td className="py-1.5 px-2.5 text-center border-r border-slate-200 font-mono">
                                {proposal.guclendirme?.temelCukuruCount || 6} Adet
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-bold font-mono text-slate-900">
                                {proposal.guclendirme?.temelCukuruIncluded && (proposal.guclendirme?.temelCukuruTotal || 0) > 0
                                  ? `${(proposal.guclendirme.temelCukuruTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">3</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold text-slate-900">
                                Statik Güçlendirme Avan Projelerinin Hazırlanması (3B Analiz & Metraj)
                              </td>
                              <td className="py-1.5 px-2.5 text-center border-r border-slate-200 font-mono">
                                {proposal.guclendirme?.avanProjeCalcType === 'area'
                                  ? `${proposal.property.totalArea || 4500} m²`
                                  : `${proposal.property.buildingCount || 2} Yapı`}
                              </td>
                              <td className="py-1.5 px-2.5 text-right font-bold font-mono text-slate-900">
                                {proposal.guclendirme?.avanProjeIncluded && (proposal.guclendirme?.avanProjeTotal || 0) > 0
                                  ? `${(proposal.guclendirme.avanProjeTotal).toLocaleString('tr-TR')} TL`
                                  : '………… TL'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 2 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-8 box-border flex flex-col justify-between overflow-hidden shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div>
                    <DocHeaderPage2 companyProfile={companyProfile} date={proposal.createdAt} theme="slate" />

                    {/* TABLO 2 */}
                    <div className="mb-3">
                      <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t-lg flex justify-between items-center text-[9.5px] font-bold">
                        <span>İŞ KALEMİ (KAPSAM) 2. AŞAMA (Opsiyonel / Statik Detay Süreci)</span>
                        <span className="text-amber-300 font-mono">
                          {(proposal.guclendirme?.stage2Total || 0) > 0
                            ? `${(proposal.guclendirme?.stage2Total || 0).toLocaleString('tr-TR')} TL`
                            : '………… TL'}
                        </span>
                      </div>

                      <div className="border border-slate-800 text-[9px] rounded-b-lg overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900">
                              <th className="py-1.5 px-2.5 w-1/12 text-center border-r border-slate-300">No</th>
                              <th className="py-1.5 px-2.5 w-7/12 border-r border-slate-300">Hizmet Kalemi</th>
                              <th className="py-1.5 px-2.5 w-2/12 text-center border-r border-slate-300">Birim Fiyat</th>
                              <th className="py-1.5 px-2.5 w-2/12 text-right">Teklif Tutarı</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            <tr>
                              <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">1</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold">Statik Güçlendirme Detay Projelerinin Hazırlanması</td>
                              <td className="py-1.5 px-2.5 text-center border-r border-slate-200 font-mono">{proposal.guclendirme?.statikDetayUnitPrice ? `${proposal.guclendirme.statikDetayUnitPrice} TL/m²` : '………… TL/m²'}</td>
                              <td className="py-1.5 px-2.5 text-right font-bold font-mono">{(proposal.guclendirme?.statikDetayTotal || 0) > 0 ? `${(proposal.guclendirme?.statikDetayTotal || 0).toLocaleString('tr-TR')} TL` : '………… TL'}</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                              <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">2</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold">Elektrik ve Mekanik Projeleri (Tesisat Deplase)</td>
                              <td className="py-1.5 px-2.5 text-center border-r border-slate-200 font-mono">{proposal.guclendirme?.elektrikMekanikUnitPrice ? `${proposal.guclendirme.elektrikMekanikUnitPrice} TL/m²` : '………… TL/m²'}</td>
                              <td className="py-1.5 px-2.5 text-right font-bold font-mono">{(proposal.guclendirme?.elektrikMekanikTotal || 0) > 0 ? `${(proposal.guclendirme?.elektrikMekanikTotal || 0).toLocaleString('tr-TR')} TL` : '………… TL'}</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">3</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold">Mimari Tadilat Projeleri</td>
                              <td className="py-1.5 px-2.5 text-center border-r border-slate-200 font-mono">{proposal.guclendirme?.mimariTadilatUnitPrice ? `${proposal.guclendirme.mimariTadilatUnitPrice} TL/m²` : '………… TL/m²'}</td>
                              <td className="py-1.5 px-2.5 text-right font-bold font-mono">{(proposal.guclendirme?.mimariTadilatTotal || 0) > 0 ? `${(proposal.guclendirme?.mimariTadilatTotal || 0).toLocaleString('tr-TR')} TL` : '………… TL'}</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                              <td className="py-1.5 px-2.5 text-center font-bold border-r border-slate-200">4</td>
                              <td className="py-1.5 px-2.5 border-r border-slate-200 font-semibold">İTÜ / Yetkili Üniversite Onay Bedeli</td>
                              <td className="py-1.5 px-2.5 text-center border-r border-slate-200 font-mono">Sabit / Heyet</td>
                              <td className="py-1.5 px-2.5 text-right font-bold font-mono">{(proposal.guclendirme?.ituOnayTotal || 0) > 0 ? `${(proposal.guclendirme?.ituOnayTotal || 0).toLocaleString('tr-TR')} TL` : '………… TL'}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* 2. Süreç Tarifi */}
                    <div className="mb-3">
                      <h2 className="text-[10px] font-black text-slate-950 uppercase tracking-wide mb-1">
                        2. Süreç Tarifi
                      </h2>
                      <div className="text-[9px] text-slate-800 leading-relaxed space-y-1 text-justify">
                        <p>
                          Teklifimizin kabul edilmesine müteakip taraflar arasında sözleşme imzalanacaktır. Hazırlanacak güçlendirme projeleri <strong>OSB'nin</strong> (veya ilgili Belediyenin / Yetkili İdarenin) onaylayabileceği nitelikte olacaktır.
                        </p>
                      </div>
                    </div>

                    {/* 3. Ödeme Koşulları & Teklif Özeti */}
                    <div className="mb-3">
                      <h2 className="text-[10px] font-black text-slate-950 uppercase tracking-wide mb-1.5">
                        3. Ödeme Koşulları & Hükümler
                      </h2>

                      <div className="grid grid-cols-12 gap-3 items-start">
                        <div className="col-span-7 bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-1 text-[8.5px] text-slate-900">
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
                              <>Ödeme cetveli <strong>İş başlangıcında %50</strong>, <strong>Avan proje tesliminde %50</strong> şeklindedir.</>
                            )}
                          </p>
                          <p className="leading-snug"><strong>2.</strong> Fiyatlarımıza KDV dahil değildir.</p>
                          <p className="leading-snug"><strong>3.</strong> Teslim Süresi: {proposal.paymentTerms.completionWorkDays || 20} iş günü.</p>
                          <p className="leading-snug"><strong>4.</strong> Projeler <strong>2018 TBDY standartlarına uygun</strong> olarak hazırlanacaktır.</p>
                          <div className="pt-1 border-t border-slate-200 text-[8px] text-slate-600 italic">
                            Teklif geçerlilik süresi: <strong>{proposal.paymentTerms.validityDays || 15} takvim günüdür</strong>.
                          </div>
                        </div>

                        <div className="col-span-5 bg-white border border-slate-300 rounded-xl p-3 text-[9px] space-y-1 shadow-xs">
                          <h4 className="font-black text-slate-900 uppercase text-center text-[9px] border-b border-slate-200 pb-1 mb-1">
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
                            <div className="flex justify-between text-emerald-700 font-bold">
                              <span>Özel İskonto:</span>
                              <span className="font-mono">-₺{proposal.pricing.discount.toLocaleString('tr-TR')}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-0.5">
                            <span>KDV Hariç Tutar:</span>
                            <span className="font-mono text-slate-950">
                              {(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600 text-[8.5px]">
                            <span>KDV (%{proposal.pricing.vatRate}):</span>
                            <span className="font-mono">
                              {Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * proposal.pricing.vatRate) / 100).toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                          <div className="flex justify-between font-black text-slate-950 border-t border-slate-900 pt-1 text-[10.5px]">
                            <span>GENEL TOPLAM:</span>
                            <span className="font-mono">
                              {proposal.pricing.totalAmount.toLocaleString('tr-TR')} TL
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Kaşe & İmza */}
                    <div className="grid grid-cols-2 gap-4 text-[8.5px] mt-2">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-900 uppercase text-[8.5px]">TEKLİF VEREN KURULUŞ</p>
                        <p className="font-bold text-slate-800 text-[8.5px] mt-0.5">{companyProfile.name}</p>
                        <p className="text-[7.5px] text-slate-500">Müh. ve Mim. Hiz. Ltd. Şti.</p>
                        <div className="mt-4 border-b border-slate-300 w-28"></div>
                        <p className="text-[7.5px] text-slate-400 mt-0.5">Yetkili İmza & Kaşe</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-right flex flex-col items-end">
                        <p className="font-bold text-slate-900 uppercase text-[8.5px]">İŞVEREN / MÜŞTERİ</p>
                        <p className="font-bold text-slate-800 text-[8.5px] mt-0.5">{proposal.client.name}</p>
                        {proposal.client.contactPerson && (
                          <p className="text-[7.5px] text-slate-600">Muhatap: {proposal.client.contactPerson}</p>
                        )}
                        <p className="text-[7.5px] text-slate-500">Teklif Kabul & Onay</p>
                        <div className="mt-4 border-b border-slate-300 w-28"></div>
                        <p className="text-[7.5px] text-slate-400 mt-0.5">İmza & Tarih</p>
                      </div>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 3 --- */}
                <ReferencesPage companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="slate" />
              </div>
            ) : proposal.type === 'performans_raporu' ? (
              /* ================================================================ */
              /* 2. PERFORMANS RAPORU (2018 TBDY)                                 */
              /* ================================================================ */
              <div>
                {/* --- PAGE 1 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-8 box-border flex flex-col justify-between overflow-hidden shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div>
                    <DocHeaderPage1 companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="slate" />

                    {/* Konu Header */}
                    <div className="mb-3.5 bg-slate-50 p-3.5 rounded-xl border border-slate-300 text-[10px] text-slate-900 font-medium leading-relaxed">
                      <span className="font-extrabold text-slate-950">Konu : </span>
                      {proposal.property.city || 'İstanbul'} İli, {proposal.property.district || '-'} İlçesi, {proposal.property.neighborhood || '-'} Mahallesi, {proposal.property.pafta ? `Pafta: ${proposal.property.pafta}, ` : ''}Ada: {proposal.property.ada || '-'} / Parsel: {proposal.property.parsel || '-'}{proposal.property.fullAddress ? `, ${proposal.property.fullAddress}` : ''} konumunda yer alan <span className="underline">Yapı</span> için taşıyıcı sistemlerinin 2018 TBDY uyarınca incelenerek deprem güvenliğinin belirlenmesi işi
                    </div>

                    <p className="text-[9.5px] text-slate-800 mb-3">
                      Yapının deprem güvenliğinin belirlenmesi amacıyla aşağıdaki tablolarda yapılacak çalışmalar, kapsamları ve ücretlendirme yer almaktadır.
                    </p>

                    {/* Table 1 */}
                    <div className="mb-2">
                      <h2 className="font-black text-[10.5px] text-slate-900 uppercase mb-2">
                        Tablo: 1 Yapılacak İşlemler (2018 TBDY Kapsamında)
                      </h2>

                      <div className="border border-slate-900 text-[9px] rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-900 text-white font-bold py-2 px-3 text-center text-[9.5px]">
                              <th className="py-2 px-3 w-5/12 border-r border-slate-800 text-left">Deney / İnceleme Adı</th>
                              <th className="py-2 px-3 w-7/12 text-left">Açıklama & Uygulama Detayı</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {proposal.scopeItems
                              .filter((item) => item.included)
                              .map((item, idx) => (
                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  <td className="py-1.5 px-3 font-bold text-slate-900 w-5/12 align-top border-r border-slate-200">
                                    {item.title}
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-700 leading-tight w-7/12">
                                    {item.description}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] font-bold text-slate-900 mt-2 text-center">Tablo: 1 Yapılacak İşlemler</p>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 2 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-8 box-border flex flex-col justify-between overflow-hidden shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div>
                    <DocHeaderPage2 companyProfile={companyProfile} date={proposal.createdAt} theme="slate" />

                    <div className="mb-3 pb-1 border-b border-slate-900">
                      <h2 className="text-[11px] font-black text-slate-950 uppercase tracking-tight">
                        FİYATLANDIRMA VE TEKLİF DETAYLARI
                      </h2>
                    </div>

                    <div className="space-y-2 text-[9.5px] text-slate-800 mb-3.5 leading-relaxed">
                      <p className="flex items-start gap-2">
                        <span className="font-bold text-slate-950">•</span>
                        <span>Tablo 1'de bahsi geçen işlemler yapılıp dosya halinde sunulacaktır.</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-bold text-slate-950">•</span>
                        <span>Bahsi geçen işlemler 2018 TBDY Sınırlı Bilgi Düzeyine göre yapılacaktır.</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="font-bold text-slate-950">•</span>
                        <span>
                          <strong>Ödeme Şekli:</strong> Numune alım günü <strong>%30</strong>, analiz tamamlandığında <strong>%40</strong>, nihai rapor tesliminde kalan <strong>%30</strong> ödenecektir.
                        </span>
                      </p>
                    </div>

                    {/* Fiyat Özeti Box */}
                    <div className="bg-slate-50 border border-slate-300 rounded-xl p-3.5 max-w-md mx-auto my-3 text-[9.5px] space-y-1.5 shadow-xs">
                      <h4 className="font-black text-slate-900 text-center uppercase tracking-wider border-b border-slate-200 pb-1 mb-1 text-[10px]">
                        TEKLİF FİYAT ÖZETİ
                      </h4>
                      <div className="flex justify-between text-slate-700">
                        <span>Hizmet Bedeli (KDV Hariç):</span>
                        <span className="font-mono font-bold text-slate-900">
                          {(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                      {proposal.pricing.discount > 0 && (
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>Uygulanan İskonto:</span>
                          <span className="font-mono">-₺{proposal.pricing.discount.toLocaleString('tr-TR')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-700 text-[9px]">
                        <span>KDV (%{proposal.pricing.vatRate}):</span>
                        <span className="font-mono">
                          {Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * proposal.pricing.vatRate) / 100).toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                      <div className="flex justify-between font-black text-[11px] text-slate-950 border-t border-slate-300 pt-1.5">
                        <span>GENEL TOPLAM:</span>
                        <span className="font-mono">
                          {proposal.pricing.totalAmount.toLocaleString('tr-TR')} TL
                        </span>
                      </div>
                    </div>

                    {/* Şartlar & İmzalar */}
                    <div className="space-y-1 text-[8.5px] text-slate-700 mb-3 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
                      <p>*** Belediyelerce veya resmî kurumlarca tahakkuk ettirilen harçlar teklif bedeline dâhil değildir.</p>
                      <p>*** Teklif geçerlilik süresi {proposal.paymentTerms.validityDays || 15} takvim günüdür.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[8.5px] mt-2">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-900 uppercase text-[8.5px]">TEKLİF VEREN KURULUŞ</p>
                        <p className="font-bold text-slate-800 text-[8.5px] mt-0.5">{companyProfile.name}</p>
                        <p className="text-[7.5px] text-slate-500">Müh. ve Mim. Hiz. Ltd. Şti.</p>
                        <div className="mt-4 border-b border-slate-300 w-28"></div>
                        <p className="text-[7.5px] text-slate-400 mt-0.5">Yetkili İmza & Kaşe</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-right flex flex-col items-end">
                        <p className="font-bold text-slate-900 uppercase text-[8.5px]">İŞVEREN / MÜŞTERİ</p>
                        <p className="font-bold text-slate-800 text-[8.5px] mt-0.5">{proposal.client.name}</p>
                        {proposal.client.contactPerson && (
                          <p className="text-[7.5px] text-slate-600">Muhatap: {proposal.client.contactPerson}</p>
                        )}
                        <p className="text-[7.5px] text-slate-500">Teklif Onay</p>
                        <div className="mt-4 border-b border-slate-300 w-28"></div>
                        <p className="text-[7.5px] text-slate-400 mt-0.5">İmza & Tarih</p>
                      </div>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 3 --- */}
                <ReferencesPage companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="slate" />
              </div>
            ) : proposal.type === 'orta_katli_risk' ? (
              /* ================================================================ */
              /* 3. ORTA KATLI YAPI RİSKLİ YAPI TESPİTİ (2019 RYTEİE)            */
              /* ================================================================ */
              <div>
                {/* --- PAGE 1 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-8 box-border flex flex-col justify-between overflow-hidden shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div>
                    <DocHeaderPage1 companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="emerald" />

                    {/* Konu Header */}
                    <div className="bg-[#f0fdf4] border border-[#86efac] text-slate-950 p-3.5 rounded-xl mb-3.5">
                      <h2 className="text-[10px] font-bold text-slate-900 leading-relaxed">
                        <strong>Konu:</strong> {proposal.property.city || 'İstanbul'} İli {proposal.property.district || 'Kadıköy'} İlçesinde Yer Alan{' '}
                        {proposal.property.pafta ? `${proposal.property.pafta} pafta, ` : ''}
                        {proposal.property.ada ? `${proposal.property.ada} ada, ` : ''}
                        {proposal.property.parsel ? `${proposal.property.parsel} nolu parsel ` : ''}
                        için <strong>2019 RYTEİE Yönetmeliğinin Orta Katlı Betonarme binalara göre Rapor Hazırlanması</strong>
                      </h2>
                    </div>

                    {/* Tablo 1 */}
                    <div className="mb-2">
                      <div className="border border-[#00594c] rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-[9.5px] border-collapse">
                          <thead>
                            <tr className="bg-[#00594c] text-white font-bold text-[10px] uppercase">
                              <th className="py-2 px-3 w-5/12 border-r border-[#004d40]">DENEY ADI</th>
                              <th className="py-2 px-3 w-7/12">AÇIKLAMA</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {proposal.scopeItems
                              .filter((item) => item.included)
                              .map((item, idx) => (
                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  <td className="py-1.5 px-3 font-bold text-slate-900 w-5/12 align-top border-r border-slate-200">
                                    {item.title}
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-700 leading-tight w-7/12">
                                    {item.description}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] font-bold text-slate-900 mt-2 text-center">Tablo: 1 Yapılacak İşlemler</p>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 2 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-8 box-border flex flex-col justify-between overflow-hidden shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div>
                    <DocHeaderPage2 companyProfile={companyProfile} date={proposal.createdAt} theme="emerald" />

                    <div className="mb-3 pb-1 border-b border-[#00594c]">
                      <h2 className="text-[10.5px] font-black text-slate-950 uppercase tracking-tight">
                        2019 RYTEİE YÖNETMELİĞİNİN ORTA KATLI BETONARME BİNALARA GÖRE YAPILMASI GEREKEN ÇALIŞMALAR HAKKINDA;
                      </h2>
                    </div>

                    <div className="space-y-2 text-[9.5px] text-slate-800 mb-3.5 leading-relaxed">
                      <div className="flex items-start gap-2">
                        <span className="text-slate-900 font-bold">•</span>
                        <span>Tablo 1 de bahsi geçen işlemler hazırlanıp dosya halinde teslim edilecektir.</span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-slate-900 font-bold">•</span>
                        <span>
                          {proposal.property.totalFloors || 11} katlı bina işlemleri (her kattan numune alımı dâhil) için teklif bedeli:{' '}
                          <strong className="text-slate-950 font-bold">
                            Kat Başı ₺{(proposal.pricing.unitPrice || 30000).toLocaleString('tr-TR')} x {proposal.property.totalFloors || 11} Kat = ₺{((proposal.pricing.unitPrice || 30000) * Number(proposal.property.totalFloors || 11)).toLocaleString('tr-TR')} TL + KDV'dir.
                          </strong>
                        </span>
                      </div>

                      <div className="flex items-start gap-2">
                        <span className="text-slate-900 font-bold">•</span>
                        <span>
                          <strong>Ödeme şekli;</strong> Numune için gün belirlendiğinde ödemenin <strong>%30'u</strong>, Numune alındığı gün ödemenin <strong>%30'u</strong>, belediye raporu onayladığında kalan <strong>%40'ı</strong> alınacaktır.
                        </span>
                      </div>
                    </div>

                    {/* Fiyat Detay Tablosu */}
                    <div className="bg-[#f0fdf4]/70 border border-[#86efac] rounded-xl p-3.5 max-w-md mx-auto my-3 text-[9.5px] space-y-1.5 shadow-xs">
                      <h4 className="font-bold text-slate-950 text-center uppercase tracking-wider border-b border-[#a7f3d0] pb-1 mb-1.5 text-[10px]">
                        FİYAT & KDV DETAY TABLOSU
                      </h4>
                      <div className="flex justify-between text-slate-700">
                        <span>Birim Hesaplama:</span>
                        <span className="font-bold text-slate-900">
                          Kat Başı ₺{(proposal.pricing.unitPrice || 30000).toLocaleString('tr-TR')} × {proposal.property.totalFloors || 11} Kat
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>Net Hizmet Bedeli (KDV Hariç):</span>
                        <span className="text-slate-950">₺{(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} + KDV</span>
                      </div>
                      <div className="flex justify-between text-slate-700 text-[9px]">
                        <span>KDV (%{proposal.pricing.vatRate}):</span>
                        <span>₺{Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * proposal.pricing.vatRate) / 100).toLocaleString('tr-TR')}</span>
                      </div>
                      <div className="flex justify-between font-black text-[11px] text-slate-950 border-t border-[#86efac] pt-1.5">
                        <span>GENEL TOPLAM (KDV Dahil):</span>
                        <span>₺{proposal.pricing.totalAmount.toLocaleString('tr-TR')}</span>
                      </div>
                    </div>

                    {/* Uyarılar */}
                    <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl p-3 space-y-1 text-[8.5px] text-slate-800 mb-2.5">
                      <p className="font-medium">*** Numune çalışmaları için ilk gidildiğinde izin verilmez ise tutanak tutulup Kaymakamlık aracılığı ile kolluk kuvvetleri desteğinin alınması ile numuneler alınacaktır. Kolluk kuvveti ile yapılması durumunda fiyatlarımız tekrar revize edilecektir.</p>
                      <p className="font-medium">*** Belediye tarafından alınan harçlar fiyatlara dahil değildir.</p>
                      <p className="font-medium">*** Numune işlemlerinden sonra tamirat-tadilat istenmesi fiyata dahil değildir.</p>
                    </div>

                    <div className="space-y-1 text-[8.5px] text-red-600 font-bold italic mb-3">
                      <p>Not1: Numune için gün belirlendikten 1 hafta içerisinde %30' luk ön ödeme yapılmaz ise program günü iptal edilecektir.</p>
                      <p>Not2: Bu Teklif geçerlilik süresi 15 gün olup onaylandığında taraflar için sözleşme hükmündedir.</p>
                      <p className="text-slate-900 not-italic font-bold text-[8.5px]">
                        Firmamız Çevre Şehircilik ve İklim Değişikliği Bakanlığı Tarafından Lisanslı kuruluştur (İSKA DÖN. YAPI LAB. MÜH. VE MİM. HİZ. LTD. ŞTİ.)
                      </p>
                    </div>

                    {/* Kaşe İmza */}
                    <div className="grid grid-cols-2 gap-4 text-[8.5px]">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-900 uppercase text-[8.5px]">YÜKLENİCİ / FİRMA</p>
                        <p className="font-bold text-slate-800 text-[8.5px] mt-0.5">{companyProfile.name}</p>
                        <p className="text-[7.5px] text-slate-500">Müh. ve Mim. Hiz. Ltd. Şti.</p>
                        <div className="mt-4 border-b border-slate-300 w-28"></div>
                        <p className="text-[7.5px] text-slate-400 mt-0.5">İmza & Kaşe</p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-right flex flex-col items-end">
                        <p className="font-bold text-slate-900 uppercase text-[8.5px]">İŞVEREN / MÜŞTERİ</p>
                        <p className="font-bold text-slate-800 text-[8.5px] mt-0.5">{proposal.client.name}</p>
                        {proposal.client.contactPerson && (
                          <p className="text-[7.5px] text-slate-600">Muhatap: {proposal.client.contactPerson}</p>
                        )}
                        <p className="text-[7.5px] text-slate-500">Adı Soyadı / Ünvanı</p>
                        <div className="mt-4 border-b border-slate-300 w-28"></div>
                        <p className="text-[7.5px] text-slate-400 mt-0.5">İmza & Tarih</p>
                      </div>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 3 --- */}
                <ReferencesPage companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="emerald" />
              </div>
            ) : (
              /* ================================================================ */
              /* 4. RİSKLİ YAPI TESPİTİ (6306 SAYILI KANUN)                       */
              /* ================================================================ */
              <div>
                {/* --- PAGE 1 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-8 box-border flex flex-col justify-between overflow-hidden shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div>
                    <DocHeaderPage1 companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="blue" />

                    {/* Konu Header */}
                    <div className="mb-3.5 font-bold text-[10px] text-slate-900 leading-relaxed bg-blue-50/80 p-3.5 rounded-xl border border-blue-200">
                      <span className="font-extrabold text-blue-950">Konu : </span>
                      {proposal.property.city || 'İstanbul'} İLİ, {proposal.property.district || '-'} İlçesi, {proposal.property.neighborhood || '-'} Mahallesi, {proposal.property.pafta ? `Pafta: ${proposal.property.pafta}, ` : ''}Ada: {proposal.property.ada || '-'} / Parsel: {proposal.property.parsel || '-'}{proposal.property.fullAddress ? `, ${proposal.property.fullAddress}` : ''} konumunda bulunan {Number(proposal.property.buildingCount) > 1 ? `(${proposal.property.buildingCount} Adet Bina${Number(proposal.property.totalFloors) > 0 ? `, ${proposal.property.totalFloors} Katlı` : ''}) ` : Number(proposal.property.totalFloors) > 0 ? `(${proposal.property.totalFloors} Katlı) ` : ''}Yapı İçin 6306 Sayılı Kanun Ve 2019 RYTEİE Yönetmeliğine Göre Riskli Yapı Tespiti Ve Rapor Hazırlanması
                    </div>

                    <p className="text-[9.5px] text-slate-800 mb-3">
                      Yapının riskli yapı tespiti amacıyla aşağıdaki tablolarda yapılacak çalışmalar, kapsamları ve ücretlendirme yer almaktadır.
                    </p>

                    {/* Table 1 */}
                    <div className="mb-2">
                      <h2 className="font-black text-[10.5px] text-slate-900 uppercase mb-2">
                        Tablo 1: Yapılacak İşlemler (6306 Sayılı Kanun Kapsamında)
                      </h2>

                      <div className="border border-blue-950 text-[9px] rounded-xl overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-blue-950 text-white font-bold py-2 px-3 text-center text-[9.5px]">
                              <th className="py-2 px-3 w-5/12 border-r border-blue-800 text-left">Deney / İnceleme Adı</th>
                              <th className="py-2 px-3 w-7/12 text-left">Açıklama & Uygulama Standartları</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {proposal.scopeItems
                              .filter((item) => item.included)
                              .map((item, idx) => (
                                <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                  <td className="py-1.5 px-3 font-bold text-blue-950 w-5/12 align-top border-r border-slate-200">
                                    {item.title}
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-800 leading-tight w-7/12">
                                    {item.description}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] font-bold text-slate-900 mt-2 text-center">Tablo: 1 Yapılacak İşlemler</p>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 2 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] h-[1123px] min-h-[1123px] max-h-[1123px] p-8 box-border flex flex-col justify-between overflow-hidden shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div>
                    <DocHeaderPage2 companyProfile={companyProfile} date={proposal.createdAt} theme="blue" />

                    <div className="mb-3 pb-1 border-b border-blue-900">
                      <h2 className="font-black text-[11px] text-blue-950 uppercase tracking-tight">
                        TEKLİF ŞARTLARI, ÖDEME VE İMZA PROTOKOLÜ
                      </h2>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-300 text-[9px] mb-3 space-y-1.5">
                      <h3 className="font-extrabold text-blue-950 uppercase text-[9px]">
                        2019 RYTEİE YÖNETMELİĞİ & ÖDEME KOŞULLARI
                      </h3>
                      <ul className="space-y-1 text-slate-800 list-disc pl-4 text-[8.5px]">
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
                            <>Numune gününde <strong>%30</strong>, numune alındığında <strong>%30</strong>, belediye onayladığında <strong>%40</strong> ödenecektir.</>
                          )}
                        </li>
                      </ul>
                    </div>

                    {/* Fiyat Özeti Box */}
                    <div className="bg-white border border-slate-300 rounded-xl p-3.5 max-w-md mx-auto shadow-xs mb-3">
                      <h3 className="font-black text-slate-900 text-center uppercase tracking-wider text-[10px] border-b border-slate-200 pb-1 mb-1.5">
                        TEKLİF FİYAT ÖZETİ
                      </h3>

                      <div className="space-y-1.5 text-[9.5px]">
                        {Number(proposal.property.buildingCount) > 1 ? (
                          <>
                            <div className="flex justify-between text-slate-700">
                              <span>Bina / Yapı Sayısı:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {proposal.property.buildingCount} Adet Bina
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-700">
                              <span>Bina Başı Birim Fiyat:</span>
                              <span className="font-mono font-bold text-slate-900">
                                ₺{Number(proposal.pricing.unitPrice || 0).toLocaleString('tr-TR')} + KDV / Bina
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-800 font-bold bg-blue-50/70 px-2 py-1 rounded-lg border border-blue-200">
                              <span>Hizmet Bedeli ({proposal.property.buildingCount} Bina):</span>
                              <span className="font-mono font-extrabold text-blue-950">
                                ₺{(Number(proposal.property.buildingCount || 1) * Number(proposal.pricing.unitPrice || 0)).toLocaleString('tr-TR')} + KDV
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex justify-between text-slate-700">
                            <span>Hizmet Bedeli (1 Adet Bina):</span>
                            <span className="font-mono font-bold text-slate-900">
                              ₺{Number(proposal.pricing.unitPrice || 0).toLocaleString('tr-TR')} + KDV
                            </span>
                          </div>
                        )}

                        {proposal.pricing.kollukKuvvetiIncluded && (
                          <div className="flex justify-between text-amber-950 font-bold bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200">
                            <span>Kolluk Kuvvetleri Operasyon Bedeli:</span>
                            <span className="font-mono font-extrabold text-amber-900">
                              +₺{Number(proposal.pricing.kollukKuvvetiPrice || 25000).toLocaleString('tr-TR')} + KDV
                            </span>
                          </div>
                        )}

                        {proposal.pricing.discount > 0 && (
                          <div className="flex justify-between text-emerald-700 font-bold">
                            <span>Özel İskonto:</span>
                            <span className="font-mono">-₺{proposal.pricing.discount.toLocaleString('tr-TR')}</span>
                          </div>
                        )}

                        <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200 text-[9px]">
                          <span>Katma Değer Vergisi (%{proposal.pricing.vatRate} KDV):</span>
                          <span className="font-mono font-bold text-slate-800">
                            ₺{Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * proposal.pricing.vatRate) / 100).toLocaleString('tr-TR')}
                          </span>
                        </div>

                        <div className="flex justify-between text-[11px] font-black text-slate-950 border-t border-slate-900 pt-1.5">
                          <span>GENEL TOPLAM (KDV Dahil):</span>
                          <span className="font-mono">₺{proposal.pricing.totalAmount.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Notlar */}
                    <div className="space-y-0.5 text-[8.5px] text-slate-700 mb-3 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
                      <p>*** Dilatasyonlu binalarda her blok ayrı bir yapı olarak değerlendirilir.</p>
                      <p>*** Tamirat-tadilat ve belediye harçları fiyata dahil değildir.</p>
                      <p className="text-amber-900 font-semibold">Not: Teklif geçerlilik süresi {proposal.paymentTerms.validityDays || 15} takvim günüdür.</p>
                    </div>

                    {/* İmza Bölümü */}
                    <div className="grid grid-cols-2 gap-4 text-[8.5px] mt-2">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="font-bold text-slate-900 uppercase text-[8.5px]">TEKLİF VEREN KURULUŞ</p>
                        <p className="font-bold text-slate-800 text-[8.5px] mt-0.5">{companyProfile.name}</p>
                        <p className="text-[7.5px] text-slate-500">Müh. ve Mim. Hiz. Ltd. Şti.</p>
                        <div className="mt-4 border-b border-slate-300 w-28"></div>
                        <p className="text-[7.5px] text-slate-400 mt-0.5">Yetkili İmza & Kaşe</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-right flex flex-col items-end">
                        <p className="font-bold text-slate-900 uppercase text-[8.5px]">MÜŞTERİ / YAPI SAHİBİ</p>
                        <p className="font-bold text-slate-800 text-[8.5px] mt-0.5">{proposal.client.name}</p>
                        {proposal.client.contactPerson && (
                          <p className="text-[7.5px] text-slate-600">Muhatap: {proposal.client.contactPerson}</p>
                        )}
                        <p className="text-[7.5px] text-slate-500">Teklif Onay</p>
                        <div className="mt-4 border-b border-slate-300 w-28"></div>
                        <p className="text-[7.5px] text-slate-400 mt-0.5">İmza & Tarih</p>
                      </div>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 3 --- */}
                <ReferencesPage companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="blue" />
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
