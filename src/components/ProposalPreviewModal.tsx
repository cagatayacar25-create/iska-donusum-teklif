import React, { useState } from 'react';
import { Proposal, CompanyProfile } from '../types';
import { PROPOSAL_TYPE_LABELS } from '../data/defaultTemplates';
import { exportProposalToPdf } from '../utils/pdfGenerator';
import { sanitizeProposal } from '../utils/storage';
import { CompanyLogoDisplay, IskaLogoSvg } from '../assets/iskaLogo';
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

const IskaOfficialHeader: React.FC<{
  companyProfile: CompanyProfile;
  date: string;
  refNo?: string;
}> = ({ companyProfile, date, refNo }) => (
  <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
    <div className="flex items-center gap-3.5">
      <CompanyLogoDisplay 
        logoUrl={companyProfile.logoUrl} 
        alt={companyProfile.name} 
        className="h-12 w-auto object-contain max-w-[140px]" 
      />
      <div>
        <div className="text-slate-950 font-black text-[13px] uppercase leading-tight tracking-tight">
          {companyProfile.name || 'İSKA DÖNÜŞÜM YAPI LABORATUVARI'}
        </div>
        <div className="text-slate-900 font-extrabold text-[9.5px] uppercase tracking-wide mt-0.5">
          MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
        </div>
        <div className="text-slate-700 font-bold text-[8.5px] tracking-tight mt-1">
          T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
        </div>
      </div>
    </div>
    <div className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-right shrink-0">
      <div className="text-[10px] font-bold text-slate-900">
        TARİH: {new Date(date).toLocaleDateString('tr-TR')}
      </div>
      {refNo && (
        <div className="text-[10px] font-bold font-mono text-slate-900 mt-0.5">
          Ref : {refNo}
        </div>
      )}
    </div>
  </div>
);

const IskaOfficialFooter: React.FC<{
  companyProfile: CompanyProfile;
}> = ({ companyProfile }) => (
  <div className="border-t-2 border-[#00529b] pt-2.5 text-center shrink-0 mt-4">
    <div className="text-red-600 font-bold text-[11px]">
      {companyProfile.website || 'www.iskamuhendislik.com'}
    </div>
    <div className="text-slate-900 font-semibold text-[9.5px] mt-0.5 leading-snug">
      {companyProfile.address || 'Gürsel Mah. Yankı Sk. No:25/2 - Kâğıthane / İstanbul'}
    </div>
    <div className="text-slate-900 font-semibold text-[9.5px] leading-snug">
      Tel: +90 {companyProfile.phone || '212 211 47 52'}
    </div>
    <div className="text-slate-900 font-semibold text-[9.5px] leading-snug">
      {companyProfile.email || 'iska.donusumlab@gmail.com'} / {companyProfile.website || 'www.iskamuhendislik.com'}
    </div>
  </div>
);

const IskaWatermark: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.045] select-none">
    <div className="w-[450px] flex flex-col items-center">
      <IskaLogoSvg className="w-full h-auto" />
      <p className="text-center font-black tracking-widest text-[16px] text-slate-900 uppercase mt-2">
        DÖNÜŞÜM YAPI LABORATUVARI
      </p>
    </div>
  </div>
);

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
    <div className={`flex justify-between items-center border-b-2 ${lineBorder} pb-3 mb-5`}>
      <div className="flex items-center gap-3.5">
        <CompanyLogoDisplay 
          logoUrl={companyProfile.logoUrl} 
          alt={companyProfile.name} 
          className="h-12 w-auto object-contain max-w-[140px]" 
        />
        <div>
          <h1 className="text-[14px] font-black text-slate-950 tracking-tight uppercase leading-tight">
            {companyProfile.name}
          </h1>
          <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-wide mt-0.5">
            MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
          </p>
          <p className={`text-[9px] font-bold ${licenseColor} tracking-tight mt-1`}>
            T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
          </p>
        </div>
      </div>

      <div className={`${badgeBg} border rounded-lg px-4 py-2 text-right shrink-0`}>
        <div className="text-[10px] font-bold text-slate-900">
          TARİH: {new Date(date).toLocaleDateString('tr-TR')}
        </div>
        <div className="text-[10px] font-bold font-mono text-slate-900 mt-0.5">
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
    <div className={`flex justify-between items-end border-b-2 ${lineBorder} pb-2 mb-5`}>
      <div>
        <h1 className="text-[13px] font-black text-slate-950 uppercase tracking-tight leading-tight">
          {companyProfile.name}
        </h1>
        <p className="text-[9.5px] font-extrabold text-slate-700 uppercase tracking-wide mt-0.5">
          MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
        </p>
      </div>
      <div className="text-right text-[10px] font-bold text-slate-900">
        {new Date(date).toLocaleDateString('tr-TR')}
      </div>
    </div>
  );
};

const DocFooter: React.FC<{
  companyProfile: CompanyProfile;
}> = ({ companyProfile }) => (
  <div className="border-t border-slate-300 pt-3 flex justify-between items-center text-[9px] font-medium text-slate-600 shrink-0 mt-4">
    <div className="font-bold text-[#00695c]">
      {companyProfile.website || 'www.iskamuhendislik.com'}
    </div>
    <div className="text-slate-600 text-[8.5px] text-right">
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
    <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
      <div className="flex-1 flex flex-col pt-1">
        {/* References Page Top Header */}
        <div className="border-b-2 border-[#00897B] pb-2.5 mb-5">
          <div className="flex justify-between items-end">
            <h2 className="text-[13.5px] font-black uppercase tracking-tight text-slate-950">
              KURUMSAL REFERANSLARIMIZ VE BİTİRİLEN ÇALIŞMALAR
            </h2>
            <span className="text-[10.5px] font-bold text-slate-700">Referans Listesi</span>
          </div>
          <p className="text-[9.5px] font-bold text-slate-600 uppercase mt-0.5">
            {companyProfile.name}
          </p>
        </div>

        {/* 2x2 Grid of Reference Cards */}
        <div className="grid grid-cols-2 gap-4 text-[10px]">
          {/* Card 1: Kurumlar */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 shadow-xs">
            <div className="bg-[#00594c] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[10px] mb-3">
              KURUMLAR
            </div>
            <ul className="space-y-1.5 text-slate-700 leading-normal pl-1">
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
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 shadow-xs">
            <div className="bg-[#00594c] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[10px] mb-3">
              BELEDİYE VE ÜNİVERSİTELER
            </div>
            <ul className="space-y-1.5 text-slate-700 leading-normal pl-1">
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
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 shadow-xs">
            <div className="bg-[#00594c] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[10px] mb-3">
              ÖZEL KURULUŞLAR
            </div>
            <ul className="space-y-1.5 text-slate-700 leading-normal pl-1">
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
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 shadow-xs">
            <div className="bg-[#00594c] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[10px] mb-3">
              RİSKLİ ALAN VE AFET ÇALIŞMALARI
            </div>
            <ul className="space-y-1.5 text-slate-700 leading-normal pl-1">
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
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Standard Header */}
                      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2.5 mb-4">
                        <div className="flex items-center gap-3">
                          <CompanyLogoDisplay 
                            logoUrl={companyProfile.logoUrl} 
                            alt={companyProfile.name} 
                            className="h-11 w-auto object-contain max-w-[130px]" 
                          />
                          <div>
                            <div className="text-slate-950 font-black text-[12px] uppercase leading-tight tracking-tight">
                              {companyProfile.name || 'İSKA DÖNÜŞÜM YAPI LABORATUVARI'}
                            </div>
                            <div className="text-slate-900 font-extrabold text-[9px] uppercase tracking-wide mt-0.5">
                              MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                            </div>
                            <div className="text-slate-700 font-semibold text-[8px] tracking-tight mt-0.5">
                              T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              Tel: 0212 211 47 52 | Web: www.iskamuhendislik.com
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-slate-900">
                            {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-[10px] font-bold font-mono text-slate-900 mt-0.5">
                            Ref: {proposal.proposalNumber}
                          </div>
                        </div>
                      </div>

                      {/* Sayı / Konu Box */}
                      <div className="mb-3.5 bg-slate-50/70 p-3.5 rounded-xl border border-slate-300 text-[10.5px] text-slate-900 space-y-1.5 leading-relaxed">
                        <div className="flex items-baseline">
                          <span className="w-14 font-black text-slate-950 shrink-0">Sayı :</span>
                          <span className="font-mono font-bold text-slate-950">{proposal.proposalNumber}</span>
                        </div>
                        <div className="flex items-baseline">
                          <span className="w-14 font-black text-slate-950 shrink-0">Konu :</span>
                          <div className="font-medium text-slate-900 leading-normal">
                            <strong>{proposal.property.city || 'İstanbul'}</strong> İli, {proposal.property.district ? <><strong>{proposal.property.district}</strong> İlçesi, </> : ''}
                            {proposal.property.neighborhood ? (
                              <><strong>{proposal.property.neighborhood.includes('Mah') ? proposal.property.neighborhood : `${proposal.property.neighborhood} Mah.`}</strong>, </>
                            ) : proposal.property.pafta ? (
                              <><strong>{proposal.property.pafta}</strong>, </>
                            ) : ''}
                            {proposal.property.ada && proposal.property.parsel ? (
                              <><strong>{proposal.property.ada} Ada, {proposal.property.parsel} Parsel</strong>'de </>
                            ) : proposal.property.parsel ? (
                              <><strong>{proposal.property.parsel} Parsel</strong>'de </>
                            ) : proposal.property.ada ? (
                              <><strong>{proposal.property.ada} Ada</strong>'da </>
                            ) : (
                              <><strong>ilgili taşınmazda</strong> </>
                            )}
                            yer alan <strong>{proposal.property.buildingCount || (proposal.guclendirme?.buildingCount || 1)} adet yapı</strong>{proposal.property.totalArea ? ` (${proposal.property.totalArea.toLocaleString('tr-TR')} m² inşaat alanı)` : ''} için <strong>2018 Türkiye Bina Deprem Yönetmeliğine uygun olarak Statik Güçlendirme Avan ve Detay Projelerinin Hazırlanması İşi Fiyat Teklifi</strong>
                          </div>
                        </div>
                      </div>

                      <p className="text-[10.5px] text-slate-800 leading-relaxed mb-3 text-justify">
                        Bu doküman yürürlükteki yönetmelikler çerçevesinde 50 yılda aşılma olasılığı <strong>%10</strong> olan deprem düzeyine göre <strong>“Kontrollü Hasar”</strong> seviyesine ulaşmalarını sağlayacak nitelikte ve yeterlikte güçlendirme projelerinin hazırlanmasına yönelik hazırladığımız fiyat teklifidir.
                      </p>

                      {/* 1. FİYAT TEKLİFİ VE KAPSAM */}
                      <div className="mb-3">
                        <h2 className="text-[11.5px] font-black text-slate-950 uppercase tracking-tight mb-1">
                          1. FİYAT TEKLİFİ VE KAPSAM
                        </h2>
                        <p className="text-[10px] text-slate-800 leading-relaxed text-justify mb-2">
                          Yapılacak işin birden çok aşamaya sahip olması, ödeme sürecinin daha kolay yönetilebilmesi ve sürecin tarifini kolaylaştıracak olması nedeniyle fiyat teklifimiz iş kalemlerine ayrılmıştır. Aşağıdaki tabloda ilgili yapınız için güçlendirme projelerine kadar olan tüm hizmetler sunulmaktadır. Dolayısıyla, hizmetimiz sonrasında sizlere teslim edilecek tüm doküman ve evraklar ile anlaşacak olduğunuz yüklenici veya kendi bünyenizde güçlendirme başvurusunu yapabilecek ve ihaleye çıkabilecek nitelikte doküman bütünlüğüne sahip olunabilecektir.
                        </p>
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[10px] text-slate-900 space-y-1">
                          <p className="font-semibold text-slate-950">2 aşamalı işlem gerçekleşecek olup,</p>
                          <p className="text-slate-800 font-medium">• <strong>1. Aşama:</strong> Binanın güçlendirme Avan projesine ilişkin işlemler yer almaktadır.</p>
                          <p className="text-slate-800 font-medium">• <strong>2. Aşamada ise:</strong> Statik Detay sürecine ilişkin işlemler yer almaktadır.</p>
                        </div>
                      </div>

                      {/* TABLO 1 (1. AŞAMA) */}
                      <div className="mb-3">
                        <div className="bg-[#0f172a] text-white px-3 py-1.5 rounded-t-lg flex justify-between items-center text-[10.5px] font-bold">
                          <span>İŞ KALEMİ (KAPSAM) 1. AŞAMA</span>
                          <span className="text-amber-300 font-mono">
                            {(proposal.guclendirme?.stage1Total || proposal.pricing.subtotal).toLocaleString('tr-TR')} TL
                          </span>
                        </div>

                        <div className="border border-slate-900 text-[10px] rounded-b-lg overflow-hidden shadow-2xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 text-[10px]">
                                <th className="py-2 px-2.5 w-[8%] text-center border-r border-slate-300">No</th>
                                <th className="py-2 px-3 w-[57%] border-r border-slate-300">Hizmet / İşlem Kalemi</th>
                                <th className="py-2 px-2.5 w-[15%] text-center border-r border-slate-300">Miktar</th>
                                <th className="py-2 px-3 w-[20%] text-right">Teklif Tutarı</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              <tr>
                                <td className="py-2 px-2.5 text-center font-bold border-r border-slate-200">1</td>
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900">Sondaja dayalı Zemin ve Geoteknik Rapor</div>
                                  <div className="text-[8.5px] text-slate-500">Zemin sondajları ve laboratuvar parametreleri</div>
                                </td>
                                <td className="py-2 px-2.5 text-center border-r border-slate-200 font-medium">
                                  {proposal.guclendirme?.sondajCount || 6} Adet
                                </td>
                                <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                                  {proposal.guclendirme?.sondajIncluded && (proposal.guclendirme?.sondajTotal || 0) > 0
                                    ? `${(proposal.guclendirme.sondajTotal).toLocaleString('tr-TR')} TL`
                                    : '......... TL'}
                                </td>
                              </tr>
                              <tr className="bg-slate-50/50">
                                <td className="py-2 px-2.5 text-center font-bold border-r border-slate-200">2</td>
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900">Temel çukuru açılarak Temel sisteminin belirlenmesi</div>
                                  <div className="text-[8.5px] text-slate-500">Temel tipi tespiti, paspayı sıyırma ve korozyon tespiti</div>
                                </td>
                                <td className="py-2 px-2.5 text-center border-r border-slate-200 font-medium">
                                  {proposal.guclendirme?.temelCukuruCount || 6} Adet
                                </td>
                                <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                                  {proposal.guclendirme?.temelCukuruIncluded && (proposal.guclendirme?.temelCukuruTotal || 0) > 0
                                    ? `${(proposal.guclendirme.temelCukuruTotal).toLocaleString('tr-TR')} TL`
                                    : '150.000 TL'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 px-2.5 text-center font-bold border-r border-slate-200">3</td>
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900">Statik Güçlendirme Avan Projelerinin Hazırlanması</div>
                                  <div className="text-[8.5px] text-slate-500">3B Taşıyıcı sistem analizi, güçlendirme modelleri, keşif özeti ve yaklaşık maliyet</div>
                                </td>
                                <td className="py-2 px-2.5 text-center border-r border-slate-200 font-medium">
                                  {proposal.guclendirme?.avanProjeCalcType === 'area'
                                    ? `${proposal.property.totalArea || 4500} m²`
                                    : `${proposal.property.buildingCount || (proposal.guclendirme?.buildingCount || 2)} Yapı`}
                                </td>
                                <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                                  {proposal.guclendirme?.avanProjeIncluded && (proposal.guclendirme?.avanProjeTotal || 0) > 0
                                    ? `${(proposal.guclendirme.avanProjeTotal).toLocaleString('tr-TR')} TL`
                                    : '300.000 TL'}
                                </td>
                              </tr>
                              <tr className="bg-slate-100 font-black text-slate-950">
                                <td colSpan={3} className="py-2 px-3 text-right uppercase tracking-tight border-r border-slate-300 text-[9.5px]">
                                  TOPLAM TEKLİF (1. AŞAMA - KDV HARİÇ):
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-[10.5px]">
                                  {(proposal.guclendirme?.stage1Total || 450000).toLocaleString('tr-TR')} TL
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* TABLO 2 (2. AŞAMA) */}
                      <div className="mb-2">
                        <div className="bg-[#0f172a] text-white px-3 py-1.5 rounded-t-lg flex justify-between items-center text-[10.5px] font-bold">
                          <span>İŞ KALEMİ (KAPSAM) 2. AŞAMA (Opsiyonel / Seçmeli Süreç)</span>
                          <span className="text-amber-300 font-mono">
                            {(proposal.guclendirme?.stage2Total || 150000).toLocaleString('tr-TR')} TL
                          </span>
                        </div>

                        <div className="border border-slate-900 text-[10px] rounded-b-lg overflow-hidden shadow-2xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-900 text-[10px]">
                                <th className="py-2 px-2.5 w-[8%] text-center border-r border-slate-300">No</th>
                                <th className="py-2 px-3 w-[57%] border-r border-slate-300">Hizmet Kalemi</th>
                                <th className="py-2 px-2.5 w-[15%] text-center border-r border-slate-300">Birim Fiyat</th>
                                <th className="py-2 px-3 w-[20%] text-right">Teklif Tutarı</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              <tr>
                                <td className="py-2 px-2.5 text-center font-bold border-r border-slate-200">1</td>
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900">Statik Güçlendirme Detay Projelerinin Hazırlanması</div>
                                  <div className="text-[8.5px] text-slate-500">Uygulama paftaları, detay çizimleri, kolon mantolama ve perde donatı planları</div>
                                </td>
                                <td className="py-2 px-2.5 text-center border-r border-slate-200 font-mono text-[9px]">
                                  {proposal.guclendirme?.statikDetayUnitPrice ? `${proposal.guclendirme.statikDetayUnitPrice} TL/m²` : '150000 TL/m²'}
                                </td>
                                <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                                  {(proposal.guclendirme?.statikDetayTotal || 150000).toLocaleString('tr-TR')} TL
                                </td>
                              </tr>
                              <tr className="bg-slate-50/50">
                                <td className="py-2 px-2.5 text-center font-bold border-r border-slate-200">2</td>
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900">Elektrik ve Mekanik Projeleri</div>
                                  <div className="text-[8.5px] text-slate-500">Güçlendirme tadilatı tesisat deplase ve uygulama projeleri</div>
                                </td>
                                <td className="py-2 px-2.5 text-center border-r border-slate-200 font-mono text-[9px]">
                                  {proposal.guclendirme?.elektrikMekanikUnitPrice ? `${proposal.guclendirme.elektrikMekanikUnitPrice} TL/m²` : '......... TL/m²'}
                                </td>
                                <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                                  {(proposal.guclendirme?.elektrikMekanikTotal || 0) > 0 ? `${(proposal.guclendirme?.elektrikMekanikTotal || 0).toLocaleString('tr-TR')} TL` : '......... TL'}
                                </td>
                              </tr>
                              <tr>
                                <td className="py-2 px-2.5 text-center font-bold border-r border-slate-200">3</td>
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900">Mimari Tadilat Projeleri</div>
                                  <div className="text-[8.5px] text-slate-500">Güçlendirme perdeleri ve mantolara uygun mimari tadilat projesi</div>
                                </td>
                                <td className="py-2 px-2.5 text-center border-r border-slate-200 font-mono text-[9px]">
                                  {proposal.guclendirme?.mimariTadilatUnitPrice ? `${proposal.guclendirme.mimariTadilatUnitPrice} TL/m²` : '......... TL/m²'}
                                </td>
                                <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                                  {(proposal.guclendirme?.mimariTadilatTotal || 0) > 0 ? `${(proposal.guclendirme?.mimariTadilatTotal || 0).toLocaleString('tr-TR')} TL` : '......... TL'}
                                </td>
                              </tr>
                              <tr className="bg-slate-50/50">
                                <td className="py-2 px-2.5 text-center font-bold border-r border-slate-200">4</td>
                                <td className="py-2 px-3 border-r border-slate-200">
                                  <div className="font-bold text-slate-900">İTÜ / Üniversite Onay Bedeli</div>
                                  <div className="text-[8.5px] text-slate-500">Yetkili Üniversite Akademik Heyeti Proje Onayı ve Raporu</div>
                                </td>
                                <td className="py-2 px-2.5 text-center border-r border-slate-200 font-mono text-[9px]">
                                  ......... TL
                                </td>
                                <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                                  {(proposal.guclendirme?.ituOnayTotal || 0) > 0 ? `${(proposal.guclendirme?.ituOnayTotal || 0).toLocaleString('tr-TR')} TL` : '......... TL'}
                                </td>
                              </tr>
                              <tr className="bg-slate-100 font-black text-slate-950">
                                <td colSpan={3} className="py-2 px-3 text-right uppercase tracking-tight border-r border-slate-300 text-[9.5px]">
                                  TOPLAM TEKLİF (2. AŞAMA - KDV HARİÇ):
                                </td>
                                <td className="py-2 px-3 text-right font-mono text-[10.5px]">
                                  {(proposal.guclendirme?.stage2Total || 150000).toLocaleString('tr-TR')} TL
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Page 1 Footer */}
                    <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[8.5px] text-slate-600 shrink-0">
                      <div>
                        <strong>{companyProfile.name || 'İSKA DÖNÜŞÜM YAPI LABORATUVARI MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.'}</strong> | Tel: 0212 211 47 52 | Web: www.iskamuhendislik.com
                      </div>
                      <div className="font-bold">
                        Sayfa 1 / 3
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- PAGE 2 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Standard Header Page 2 */}
                      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2.5 mb-4">
                        <div className="flex items-center gap-3">
                          <CompanyLogoDisplay 
                            logoUrl={companyProfile.logoUrl} 
                            alt={companyProfile.name} 
                            className="h-11 w-auto object-contain max-w-[130px]" 
                          />
                          <div>
                            <div className="text-slate-950 font-black text-[12px] uppercase leading-tight tracking-tight">
                              {companyProfile.name || 'İSKA DÖNÜŞÜM YAPI LABORATUVARI'}
                            </div>
                            <div className="text-slate-900 font-extrabold text-[9px] uppercase tracking-wide mt-0.5">
                              MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                            </div>
                            <div className="text-slate-700 font-semibold text-[8px] tracking-tight mt-0.5">
                              T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              Tel: 0212 211 47 52 | Web: www.iskamuhendislik.com
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-slate-900">
                            {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-[10px] font-bold font-mono text-slate-900 mt-0.5">
                            Ref: {proposal.proposalNumber}
                          </div>
                        </div>
                      </div>

                      {/* 2. SÜREÇ TARİFİ */}
                      <div className="mb-4">
                        <h2 className="text-[11.5px] font-black text-slate-950 uppercase tracking-tight mb-2">
                          2. SÜREÇ TARİFİ
                        </h2>
                        <div className="text-[10px] text-slate-800 leading-relaxed space-y-2.5 text-justify">
                          <p>
                            Teklifimizin kabul edilmesine müteakip taraflar arasında sözleşme imzalanacaktır. Bu aşamada gerek bünyemizde bulunan konusunda deneyimli evrak takip uzmanı, mimar ve mühendisin gerek sizlerin veya yetki verilen diğer kişilerin de süreci takip etmesi için gerekli bilgilendirmeler yapılacaktır.
                          </p>
                          <p>
                            Hazırlanacak güçlendirme projeleri <strong>ilgili Belediyenin / Yetkili İdarenin</strong> onaylayabileceği nitelikte ve gerekli detaylara sahip nitelikte olacaktır. Ayrıca, yapılacak güçlendirmenin mevcut kullanımları en az şekilde etkileyecek, net alanı olabildiğince az daralmasına sebep olacak ve ekonomik olarak en uygun çözümler araştırılacaktır. Bu nedenle yapılarınız için <strong>betonarme, çelik, karbon lifli polimer güçlendirme yöntemlerinden</strong> en uygun olanı veya kompozit birliktelikleriyle çözüme gidilecektir. Hedef, hem yapıların kullanımlarını bozmamak, aynı zamanda güçlendirme sonrası onarım gereksinimini azaltmak, bir yandan da olabildiğince ekonomik bir çözümle depreme dayanıklı yapılar elde edilmesini sağlamak şeklindedir.
                          </p>
                          <p>
                            Bu aşamada işin maliyetinin belirlenebilmesi için proje üzerinden <strong>Keşif ve Yaklaşık Maliyet tabloları</strong> oluşturulacak, teknik şartname ve sözleşme taslağı oluşturularak işin yapımı aşamasında yüklenici (müteahhit) seçiminde kullanılabilecek tüm doneler de hazırlanmış olacaktır.
                          </p>
                        </div>
                      </div>

                      {/* 3. ÖDEME KOŞULLARI & HÜKÜMLER */}
                      <div className="mb-4">
                        <h2 className="text-[11.5px] font-black text-slate-950 uppercase tracking-tight mb-2.5">
                          3. ÖDEME KOŞULLARI & HÜKÜMLER
                        </h2>

                        <div className="grid grid-cols-12 gap-3.5 items-start">
                          {/* Sol Kutu - Koşullar */}
                          <div className="col-span-7 bg-slate-50/70 border border-slate-300 rounded-xl p-3.5 space-y-2.5 text-[9.5px] text-slate-900 leading-normal">
                            <p>
                              <strong>1. Ödeme Koşulları:</strong> 1. Taksit (İş Başlangıcı / Peşinat - <strong>%{proposal.paymentTerms.advanceRatio || 50}</strong>) (<strong>%{proposal.paymentTerms.advanceRatio || 50} - ₺{(Math.round((proposal.pricing.subtotal - proposal.pricing.discount) * ((proposal.paymentTerms.advanceRatio || 50) / 100))).toLocaleString('tr-TR')}</strong>), 2. Taksit (Avan / Detay Proje Teslimi - <strong>%{proposal.paymentTerms.uponDeliveryRatio || 50}</strong>) (<strong>%{proposal.paymentTerms.uponDeliveryRatio || 50} - ₺{(Math.round((proposal.pricing.subtotal - proposal.pricing.discount) * ((proposal.paymentTerms.uponDeliveryRatio || 50) / 100))).toLocaleString('tr-TR')}</strong>)
                            </p>
                            <p>
                              <strong>2. İşin Teslim Süresi:</strong> Ödeme cetvelinde ve sözleşmede belirtildiği şekildedir (<strong>{proposal.paymentTerms.completionWorkDays || 30} iş günü</strong>).
                            </p>
                            <p>
                              <strong>3.</strong> Projeler <strong>2018 TBDY standartlarına uygun</strong> olarak <strong>Kontrollü Hasar</strong> seviyesi hedeflenerek hazırlanacaktır.
                            </p>
                            <div className="pt-2 border-t border-slate-200 text-[9px] text-slate-700 italic">
                              <p>
                                <strong>Not:</strong> Bu fiyat teklifinin geçerlilik süresi <strong>{proposal.paymentTerms.validityDays || 15} takvim günüdür</strong>. Bu sürenin aşılması durumunda teklifin tekrar revize edilmesi gerekmektedir.
                              </p>
                            </div>
                          </div>

                          {/* Sağ Kutu - TEKLİF FİYAT ÖZETİ */}
                          <div className="col-span-5 bg-white border-2 border-slate-900 rounded-xl p-3 text-[10px] space-y-1.5 shadow-2xs">
                            <h4 className="font-black text-slate-950 uppercase text-center text-[10.5px] border-b border-slate-200 pb-1 mb-1">
                              TEKLİF FİYAT ÖZETİ
                            </h4>
                            <div className="flex justify-between text-slate-700">
                              <span>1. Aşama Toplamı:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {(proposal.guclendirme?.stage1Total || 450000).toLocaleString('tr-TR')} TL
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-700">
                              <span>2. Aşama Toplamı:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {(proposal.guclendirme?.stage2Total || 150000).toLocaleString('tr-TR')} TL
                              </span>
                            </div>
                            {proposal.pricing.discount > 0 && (
                              <div className="flex justify-between text-emerald-700 font-bold">
                                <span>İskonto:</span>
                                <span className="font-mono">-₺{proposal.pricing.discount.toLocaleString('tr-TR')}</span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                              <span>Hizmet Bedeli (KDV Hariç):</span>
                              <span className="font-mono text-slate-950">
                                {(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} TL
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600 text-[9.5px]">
                              <span>KDV (%{proposal.pricing.vatRate || 20}):</span>
                              <span className="font-mono">
                                {Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * (proposal.pricing.vatRate || 20)) / 100).toLocaleString('tr-TR')} TL
                              </span>
                            </div>
                            <div className="flex justify-between font-black text-slate-950 border-t border-slate-900 pt-1 text-[11px]">
                              <span>GENEL TOPLAM:</span>
                              <span className="font-mono">
                                {proposal.pricing.totalAmount.toLocaleString('tr-TR')} TL
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Saygılarımızla */}
                      <div className="mb-2">
                        <p className="font-bold text-slate-950 text-[10.5px]">Saygılarımızla,</p>
                      </div>

                      {/* Kaşe & İmza Çift Sütun */}
                      <div className="grid grid-cols-2 gap-4 text-[9.5px] border-t border-slate-200 pt-3">
                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-300">
                          <p className="font-bold text-slate-950 uppercase text-[9.5px]">TEKLİF VEREN KURULUŞ</p>
                          <p className="font-bold text-slate-900 text-[9.5px] mt-0.5">{companyProfile.name || 'İSKA DÖNÜŞÜM YAPI LABORATUVARI'}</p>
                          <p className="text-[8.5px] text-slate-600 font-mono mt-0.5">İş Bankası IBAN: TR76 0006 4000 0011 0840 5410 74</p>
                          <div className="mt-6 border-b border-slate-300 w-36"></div>
                          <p className="text-[8px] text-slate-400 mt-0.5">Yetkili İmza & Kaşe</p>
                        </div>

                        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-300 text-right flex flex-col items-end">
                          <p className="font-bold text-slate-950 uppercase text-[9.5px]">İŞVEREN / MÜŞTERİ</p>
                          <p className="font-bold text-slate-900 text-[9.5px] mt-0.5">{proposal.client.name || 'Kopuzlar'}</p>
                          {proposal.client.contactPerson && (
                            <p className="text-[8.5px] text-slate-600">Muhatap: {proposal.client.contactPerson}</p>
                          )}
                          <p className="text-[8.5px] text-slate-500">Teklif Kabul & Onay</p>
                          <div className="mt-6 border-b border-slate-300 w-36"></div>
                          <p className="text-[8px] text-slate-400 mt-0.5">İmza & Tarih</p>
                        </div>
                      </div>
                    </div>

                    {/* Page 2 Footer */}
                    <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[8.5px] text-slate-600 shrink-0">
                      <div>
                        <strong>{companyProfile.name || 'İSKA DÖNÜŞÜM YAPI LABORATUVARI MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.'}</strong> | Tel: 0212 211 47 52 | Web: www.iskamuhendislik.com
                      </div>
                      <div className="font-bold">
                        Sayfa 2 / 3
                      </div>
                    </div>
                  </div>
                </div>

                {/* --- PAGE 3 (REFERANSLAR) --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Standard Header Page 3 */}
                      <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2.5 mb-4">
                        <div className="flex items-center gap-3">
                          <CompanyLogoDisplay 
                            logoUrl={companyProfile.logoUrl} 
                            alt={companyProfile.name} 
                            className="h-11 w-auto object-contain max-w-[130px]" 
                          />
                          <div>
                            <div className="text-slate-950 font-black text-[12px] uppercase leading-tight tracking-tight">
                              {companyProfile.name || 'İSKA DÖNÜŞÜM YAPI LABORATUVARI'}
                            </div>
                            <div className="text-slate-900 font-extrabold text-[9px] uppercase tracking-wide mt-0.5">
                              MÜHENDİSLİK VE MİMARLIK HİZMETLERİ LTD. ŞTİ.
                            </div>
                            <div className="text-slate-700 font-semibold text-[8px] tracking-tight mt-0.5">
                              T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş
                            </div>
                            <div className="text-slate-600 text-[8px]">
                              Tel: 0212 211 47 52 | Web: www.iskamuhendislik.com
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[10px] font-bold text-slate-900">
                            {new Date(proposal.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-[10px] font-bold font-mono text-slate-900 mt-0.5">
                            Ref: {proposal.proposalNumber}
                          </div>
                        </div>
                      </div>

                      {/* References Title */}
                      <div className="mb-3">
                        <h3 className="text-[11.5px] font-black text-slate-950 uppercase tracking-tight">
                          KURUMSAL REFERANSLARIMIZ & TAMAMLANAN GÜÇLENDİRME / ANALİZ PROJELERİ
                        </h3>
                      </div>

                      {/* 2x2 Grid of References (Exact matching PDF 3rd page) */}
                      <div className="grid grid-cols-2 gap-3.5 text-[9.5px]">
                        {/* 1. Kamu Kurumları */}
                        <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 shadow-2xs">
                          <div className="bg-[#0f172a] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[9.5px] mb-2.5">
                            KAMU KURUMLARI & BAKANLIKLAR
                          </div>
                          <ul className="space-y-1 text-slate-800 leading-normal pl-1">
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

                        {/* 2. Belediye ve Üniversiteler */}
                        <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 shadow-2xs">
                          <div className="bg-[#0f172a] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[9.5px] mb-2.5">
                            BELEDİYE VE ÜNİVERSİTELER
                          </div>
                          <ul className="space-y-1 text-slate-800 leading-normal pl-1">
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

                        {/* 3. Sanayi ve Özel Kuruluşlar */}
                        <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 shadow-2xs">
                          <div className="bg-[#0f172a] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[9.5px] mb-2.5">
                            SANAYİ VE ÖZEL KURULUŞLAR
                          </div>
                          <ul className="space-y-1 text-slate-800 leading-normal pl-1">
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

                        {/* 4. Güçlendirme & Riskli Alan */}
                        <div className="border border-slate-300 rounded-xl p-3.5 bg-slate-50/50 shadow-2xs">
                          <div className="bg-[#0f172a] text-white font-bold py-1.5 px-3 rounded-md uppercase text-center text-[9.5px] mb-2.5">
                            GÜÇLENDİRME & RİSKLİ ALAN ÇALIŞMALARI
                          </div>
                          <ul className="space-y-1 text-slate-800 leading-normal pl-1">
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
                    <div className="border-t border-slate-300 pt-2 flex justify-between items-center text-[8.5px] text-slate-600 shrink-0">
                      <div>
                        <strong>{companyProfile.name || 'İSKA DÖNÜŞÜM YAPI LABORATUVARI MÜH. VE MİM. HİZMETLERİ LTD. ŞTİ.'}</strong> | Tel: 0212 211 47 52 | Web: www.iskamuhendislik.com
                      </div>
                      <div className="font-bold">
                        Sayfa 3 / 3
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : proposal.type === 'performans_raporu' ? (
              /* ================================================================ */
              /* 2. PERFORMANS RAPORU (2018 TBDY)                                 */
              /* ================================================================ */
              <div>
                {/* --- PAGE 1 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <DocHeaderPage1 companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="slate" />

                      {/* Konu Header */}
                      <div className="mb-4 bg-slate-50 p-4 rounded-xl border border-slate-300 text-[11.5px] text-slate-900 font-medium leading-relaxed">
                        <span className="font-extrabold text-slate-950">Konu : </span>
                        {proposal.property.city || 'İstanbul'} İli, {proposal.property.district || '-'} İlçesi, {proposal.property.neighborhood || '-'} Mahallesi, {proposal.property.pafta ? `Pafta: ${proposal.property.pafta}, ` : ''}Ada: {proposal.property.ada || '-'} / Parsel: {proposal.property.parsel || '-'}{proposal.property.fullAddress ? `, ${proposal.property.fullAddress}` : ''} konumunda yer alan <span className="underline font-bold">Yapı</span> için taşıyıcı sistemlerinin 2018 TBDY uyarınca incelenerek deprem güvenliğinin belirlenmesi işi
                      </div>

                      <p className="text-[11px] text-slate-800 mb-4 leading-relaxed">
                        Yapının deprem güvenliğinin belirlenmesi amacıyla aşağıdaki tablolarda yapılacak çalışmalar, kapsamları ve ücretlendirme yer almaktadır.
                      </p>

                      {/* Table 1 */}
                      <div className="mb-4">
                        <h2 className="font-black text-[12px] text-slate-900 uppercase mb-2">
                          Tablo: 1 Yapılacak İşlemler (2018 TBDY Kapsamında)
                        </h2>

                        <div className="border border-slate-900 text-[10.5px] rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-900 text-white font-bold py-2.5 px-3 text-center text-[11px]">
                                <th className="py-2.5 px-3.5 w-5/12 border-r border-slate-800 text-left">Deney / İnceleme Adı</th>
                                <th className="py-2.5 px-3.5 w-7/12 text-left">Açıklama & Uygulama Detayı</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {proposal.scopeItems
                                .filter((item) => item.included)
                                .map((item, idx) => (
                                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    <td className="py-2.5 px-3.5 font-bold text-slate-900 w-5/12 align-top border-r border-slate-200">
                                      {item.title}
                                    </td>
                                    <td className="py-2.5 px-3.5 text-slate-700 leading-relaxed w-7/12">
                                      {item.description}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[11px] font-bold text-slate-900 mt-2.5 text-center">Tablo: 1 Yapılacak İşlemler</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[10px] text-slate-700 leading-relaxed">
                      <p><strong>Bilgilendirme:</strong> Tüm test ve laboratuvar analizleri Çevre, Şehircilik ve İklim Değişikliği Bakanlığı onaylı cihaz ve lisanslı laboratuvar altyapımızla gerçekleştirilmektedir.</p>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 2 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <DocHeaderPage2 companyProfile={companyProfile} date={proposal.createdAt} theme="slate" />

                      <div className="mb-4 pb-2 border-b-2 border-slate-900">
                        <h2 className="text-[12.5px] font-black text-slate-950 uppercase tracking-tight">
                          FİYATLANDIRMA VE TEKLİF DETAYLARI
                        </h2>
                      </div>

                      <div className="space-y-3 text-[11px] text-slate-800 mb-4 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
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
                      <div className="bg-white border border-slate-300 rounded-xl p-4 max-w-lg mx-auto my-4 text-[11px] space-y-2 shadow-xs">
                        <h4 className="font-black text-slate-900 text-center uppercase tracking-wider border-b border-slate-200 pb-1.5 mb-2 text-[11.5px]">
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
                        <div className="flex justify-between text-slate-700 text-[10.5px]">
                          <span>KDV (%{proposal.pricing.vatRate}):</span>
                          <span className="font-mono">
                            {Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * proposal.pricing.vatRate) / 100).toLocaleString('tr-TR')} TL
                          </span>
                        </div>
                        <div className="flex justify-between font-black text-[13px] text-slate-950 border-t border-slate-300 pt-2">
                          <span>GENEL TOPLAM:</span>
                          <span className="font-mono">
                            {proposal.pricing.totalAmount.toLocaleString('tr-TR')} TL
                          </span>
                        </div>
                      </div>

                      {/* Şartlar & İmzalar */}
                      <div className="space-y-1.5 text-[10px] text-slate-700 mb-4 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 leading-relaxed">
                        <p>*** Belediyelerce veya resmî kurumlarca tahakkuk ettirilen harçlar teklif bedeline dâhil değildir.</p>
                        <p>*** Teklif geçerlilik süresi {proposal.paymentTerms.validityDays || 15} takvim günüdür.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-[10px] mt-2">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                        <p className="font-bold text-slate-900 uppercase text-[10px]">TEKLİF VEREN KURULUŞ</p>
                        <p className="font-bold text-slate-800 text-[10px] mt-0.5">{companyProfile.name}</p>
                        <p className="text-[9px] text-slate-500">Müh. ve Mim. Hiz. Ltd. Şti.</p>
                        <div className="mt-5 border-b border-slate-300 w-36"></div>
                        <p className="text-[8.5px] text-slate-400 mt-0.5">Yetkili İmza & Kaşe</p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-right flex flex-col items-end shadow-2xs">
                        <p className="font-bold text-slate-900 uppercase text-[10px]">İŞVEREN / MÜŞTERİ</p>
                        <p className="font-bold text-slate-800 text-[10px] mt-0.5">{proposal.client.name}</p>
                        {proposal.client.contactPerson && (
                          <p className="text-[9px] text-slate-600">Muhatap: {proposal.client.contactPerson}</p>
                        )}
                        <p className="text-[9px] text-slate-500">Teklif Onay</p>
                        <div className="mt-5 border-b border-slate-300 w-36"></div>
                        <p className="text-[8.5px] text-slate-400 mt-0.5">İmza & Tarih</p>
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
                {/* --- PAGE 1: DENEY TABLOSU --- */}
                <div className="pdf-page relative bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <IskaWatermark />
                  <div className="relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      <IskaOfficialHeader companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} />

                      {/* Konu Header (Underlined) */}
                      <div className="mt-2 mb-4">
                        <h2 className="text-[12px] font-bold text-slate-950 underline leading-snug">
                          Konu: {proposal.property.district || 'Kartal'} İlçesinde Yer Alan {proposal.property.ada || '10576'} ada {proposal.property.parsel || '13'} parsel için 2019 RYTEİE Yönetmeliğinin Orta Katlı Betonarme binalara göre Rapor Hazırlanması
                        </h2>
                      </div>

                      {/* Tablo 1 */}
                      <div className="mb-2">
                        <table className="w-full text-left text-[10px] border-collapse border border-black">
                          <thead>
                            <tr className="bg-white text-slate-950 font-bold border-b border-black">
                              <th className="py-1.5 px-3 w-[36%] border-r border-black font-bold text-slate-950">Deney Adı</th>
                              <th className="py-1.5 px-3 w-[64%] font-bold text-slate-950">Açıklama</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white">
                            {proposal.scopeItems
                              .filter((item) => item.included)
                              .map((item) => (
                                <tr key={item.id} className="border-b border-black last:border-b-0">
                                  <td className="py-1.5 px-3 font-bold text-slate-950 align-top border-r border-black">
                                    {item.title}
                                  </td>
                                  <td className="py-1.5 px-3 text-slate-900 leading-snug align-top">
                                    {item.description}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                        <p className="text-[10.5px] font-bold text-slate-950 mt-1.5 text-center">Tablo: 1 Yapılacak İşlemler</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <IskaOfficialFooter companyProfile={companyProfile} />
                  </div>
                </div>

                {/* --- PAGE 2: ÇALIŞMALAR, FİYATLANDIRMA & NOTLAR --- */}
                <div className="pdf-page relative bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <IskaWatermark />
                  <div className="relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      <IskaOfficialHeader companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} />

                      {/* Main Title (Underlined) */}
                      <div className="mt-1 mb-3.5">
                        <h2 className="text-[12px] font-bold text-slate-950 uppercase tracking-tight underline">
                          2019 RYTEİE YÖNETMELİĞİNİN ORTA KATLI BETONARME BİNALARA GÖRE YAPILMASI GEREKEN ÇALIŞMALAR HAKKINDA;
                        </h2>
                      </div>

                      {/* Yeşil Çerçeveli Açıklama Kutusu */}
                      <div className="bg-[#f0fdf4]/60 border border-[#86efac] rounded-2xl p-4 text-[11px] text-slate-900 leading-relaxed mb-4 space-y-2.5 shadow-2xs">
                        <div className="flex items-start gap-2">
                          <span className="text-slate-950 font-bold">•</span>
                          <span>Tablo 1 de bahsi geçen işlemler hazırlanıp dosya halinde teslim edilecektir.</span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="text-slate-950 font-bold">•</span>
                          <span>
                            {proposal.property.totalFloors || 13} katlı bina işlemleri (her kattan numune alımı dâhil) için teklif bedeli:{' '}
                            {proposal.pricing.discount > 0 ? (
                              <strong className="text-slate-950 font-bold">
                                Kat Başı ₺{(proposal.pricing.unitPrice || 30000).toLocaleString('tr-TR')} x {proposal.property.totalFloors || 13} Kat = ₺{((proposal.pricing.unitPrice || 30000) * Number(proposal.property.totalFloors || 13)).toLocaleString('tr-TR')} TL olup, uygulanan ₺{proposal.pricing.discount.toLocaleString('tr-TR')} iskonto sonrası teklif bedeli: ₺{(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} TL + KDV'dir.
                              </strong>
                            ) : (
                              <strong className="text-slate-950 font-bold">
                                Kat Başı ₺{(proposal.pricing.unitPrice || 30000).toLocaleString('tr-TR')} x {proposal.property.totalFloors || 13} Kat = ₺{((proposal.pricing.unitPrice || 30000) * Number(proposal.property.totalFloors || 13)).toLocaleString('tr-TR')} TL + KDV'dir.
                              </strong>
                            )}
                          </span>
                        </div>

                        <div className="flex items-start gap-2">
                          <span className="text-slate-950 font-bold">•</span>
                          <span>
                            <strong>Ödeme şekli;</strong> Numune için gün belirlendiğinde ödemenin <strong>%30'u</strong>, Numune alındığı gün ödemenin <strong>%30'u</strong>, belediye raporu onayladığında kalan <strong>%40'ı</strong> alınacaktır.
                          </span>
                        </div>
                      </div>

                      {/* FİYAT & KDV DETAY TABLOSU Kutusu */}
                      <div className="bg-white border border-[#86efac] rounded-2xl p-4.5 max-w-lg mx-auto my-4 text-[11px] space-y-2 shadow-2xs">
                        <h4 className="font-bold text-slate-950 text-center uppercase tracking-wider border-b border-[#86efac] pb-1.5 mb-2.5 text-[12px]">
                          FİYAT & KDV DETAY TABLOSU
                        </h4>
                        <div className="flex justify-between text-slate-700">
                          <span>Birim Hesaplama:</span>
                          <span className="font-bold text-slate-900">
                            Kat Başı ₺{(proposal.pricing.unitPrice || 30000).toLocaleString('tr-TR')} × {proposal.property.totalFloors || 13} Kat
                          </span>
                        </div>
                        {proposal.pricing.discount > 0 && (
                          <>
                            <div className="flex justify-between text-slate-700">
                              <span>Toplam Tutar (İskontosuz):</span>
                              <span className="font-mono">₺{((proposal.pricing.unitPrice || 30000) * Number(proposal.property.totalFloors || 13)).toLocaleString('tr-TR')}</span>
                            </div>
                            <div className="flex justify-between text-emerald-700 font-bold">
                              <span>Uygulanan İskonto:</span>
                              <span className="font-mono">-₺{proposal.pricing.discount.toLocaleString('tr-TR')}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>Net Hizmet Bedeli (KDV Hariç):</span>
                          <span className="text-slate-950 font-mono">₺{(proposal.pricing.subtotal - proposal.pricing.discount).toLocaleString('tr-TR')} + KDV</span>
                        </div>
                        <div className="flex justify-between text-slate-700 text-[10.5px] border-b border-slate-200 pb-2">
                          <span>KDV (%{proposal.pricing.vatRate || 20}):</span>
                          <span className="font-mono">₺{Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * (proposal.pricing.vatRate || 20)) / 100).toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="flex justify-between font-black text-[13px] text-slate-950 pt-1">
                          <span>GENEL TOPLAM (KDV Dahil):</span>
                          <span className="font-mono">₺{proposal.pricing.totalAmount.toLocaleString('tr-TR')}</span>
                        </div>
                      </div>

                      {/* Sarı Uyarı Kutusu */}
                      <div className="bg-[#fffbeb] border border-[#fde68a] rounded-2xl p-4 space-y-2 text-[10.5px] text-slate-900 leading-relaxed mb-4 shadow-2xs">
                        <p className="font-medium">
                          *** Numune çalışmaları için ilk gidildiğinde izin verilmez ise tutanak tutulup Kaymakamlık aracılığı ile kolluk kuvvetleri desteğinin alınması ile numuneler alınacaktır. Kolluk kuvveti ile yapılması durumunda fiyatlarımız tekrar revize edilecektir.
                        </p>
                        <p className="font-medium">
                          *** Belediye tarafından alınan harçlar fiyatlara dahil değildir.
                        </p>
                        <p className="font-medium">
                          *** Numune işlemlerinden sonra tamirat-tadilat istenmesi fiyata dahil değildir.
                        </p>
                      </div>

                      {/* Kırmızı ve Siyah Notlar */}
                      <div className="space-y-1.5 text-[10.5px] leading-relaxed pt-1">
                        <p className="text-red-600 font-bold italic">
                          Not1: Numune için gün belirlendikten 1 hafta içerisinde %30' luk ön ödeme yapılmaz ise program günü iptal edilecektir.
                        </p>
                        <p className="text-red-600 font-bold italic">
                          Not2: Bu Teklif geçerlilik süresi {proposal.paymentTerms.validityDays || 15} gün olup onaylandığında taraflar için sözleşme hükmündedir.
                        </p>
                        <p className="text-slate-950 font-bold not-italic text-[10px] pt-1">
                          Firmamız Çevre Şehircilik ve İklim Değişikliği Bakanlığı Tarafından Lisanslı kuruluştur (İSKA DÖN. YAPI LAB. MÜH. VE MİM. HİZ. LTD. ŞTİ.)
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <IskaOfficialFooter companyProfile={companyProfile} />
                  </div>
                </div>

                {/* --- PAGE 3: SÖZLEŞME HÜKÜMLERİ & İMZALAR --- */}
                <div className="pdf-page relative bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <IskaWatermark />
                  <div className="relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      <IskaOfficialHeader companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} />

                      {/* Sözleşme Başlığı */}
                      <div className="mt-1 mb-3">
                        <h3 className="text-[12px] font-bold text-slate-950 uppercase tracking-wide">
                          SÖZLEŞME HÜKÜMLERİ
                        </h3>
                      </div>

                      <div className="space-y-2.5 text-[10px] text-slate-900 leading-normal">
                        <div>
                          <p className="font-bold text-slate-950">1. Taraflar:</p>
                          <p className="mt-0.5">
                            Bu Teklif ve Hizmet Sözleşmesi, bir tarafta {companyProfile.name || 'İSKA Dönüşüm Yapı Laboratuvarı'} Mühendislik ve Mimarlık Hizmetleri Ltd. Şti. (Yüklenici) ile diğer tarafta {proposal.client.name || 'Bina malikleri'}. (İşveren) arasında akdedilmiştir.
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">2. Konu:</p>
                          <p className="mt-0.5">
                            Bu sözleşmenin konusu, teklif metninde ayrıntılı olarak belirtilen deprem performans analiz hizmetlerinin yürütülmesi ve tamamlanmasıdır.
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">3. Yürürlük:</p>
                          <p className="mt-0.5">
                            İşveren tarafından imzalanan teklif, tüm şartlarıyla kabul edilmiş sayılır ve yürürlüğe girer.
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">4. Tarafların Yükümlülükleri:</p>
                          <p className="mt-0.5">
                            Yüklenici, iş kalemlerini yürürlükteki 2018 TBDY, TS500 ve TS498 standartlarına uygun olarak yerine getirecektir.
                          </p>
                          <p className="mt-0.5">
                            İşveren, gerekli belge ve projeleri eksiksiz teslim edecek, ödemeleri zamanında yapacaktır.
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">5. Ödeme ve Cayma Şartları:</p>
                          <p className="mt-0.5">
                            Teklifte belirtilen ödeme planı geçerlidir. İşveren tarafından iş başlangıcında ödenecek %30 tutarındaki ön ödeme (kapora), işin planlaması, saha hazırlıkları ve personel tahsisi amacıyla alınmaktadır.
                          </p>
                          <p className="mt-0.5">
                            İşveren’in, sözleşmenin yürürlüğe girmesinden sonra tek taraflı olarak işten vazgeçmesi durumunda bu tutar iade edilmeyecektir. Bu tutar, Yüklenici’nin ön hazırlık ve organizasyon giderlerinin karşılığı olup, taraflarca cayma bedeli niteliğinde olduğu kabul edilmiştir.
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">6. Fesih:</p>
                          <p className="mt-0.5">
                            Taraflardan biri yükümlülüklerini yerine getirmezse, diğer taraf 7 (yedi) gün süreli yazılı ihtar sonrası sözleşmeyi feshedebilir.
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">7. Gizlilik:</p>
                          <p className="mt-0.5">
                            Yüklenici, elde edilen verileri yalnızca işin gereği kapsamında kullanılacak, üçüncü kişilerle paylaşılmayacaktır.
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">8. Uyuşmazlıkların Çözümü:</p>
                          <p className="mt-0.5">
                            Bu sözleşmeden doğabilecek uyuşmazlıklarda İstanbul Anadolu Mahkemeleri ve İcra Daireleri yetkilidir.
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">9. Tebligat Adresleri:</p>
                          <p className="mt-0.5">
                            Taraflar, yazılı bildirimlerin sözleşmede yer alan adreslere yapılacağını kabul eder.
                          </p>
                        </div>

                        <div>
                          <p className="font-bold text-slate-950">10. Diğer Hükümler:</p>
                          <p className="mt-0.5">
                            Bu sözleşme 2 (iki) nüsha olarak düzenlenmiş olup, tarafların imzası ile yürürlüğe girer. Her iki nüsha da aynı hüküm ve değere sahiptir.
                          </p>
                        </div>
                      </div>

                      {/* İmzalar Bölümü */}
                      <div className="grid grid-cols-2 gap-8 mt-6 text-[10px]">
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                          <p className="font-bold text-slate-950 uppercase">İŞVEREN / MÜŞTERİ</p>
                          <p className="mt-1 text-slate-900">
                            <strong>Adı Soyadı / Ünvanı:</strong> {proposal.client.name || '.......................................................'}
                          </p>
                          {proposal.client.contactPerson && (
                            <p className="mt-0.5 text-slate-700">Muhatap: {proposal.client.contactPerson}</p>
                          )}
                          <div className="mt-6 border-b border-slate-300 w-40"></div>
                          <p className="text-[8.5px] text-slate-400 mt-1">İmza & Tarih</p>
                        </div>

                        <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                          <p className="font-bold text-slate-950 uppercase">YÜKLENİCİ / FİRMA</p>
                          <p className="mt-1 font-bold text-slate-900">
                            {companyProfile.name || 'İSKA Dönüşüm Yapı Laboratuvarı'}
                          </p>
                          <p className="text-[9px] text-slate-700">Müh. ve Mim. Hiz. Ltd. Şti.</p>
                          <div className="mt-6 border-b border-slate-300 w-40"></div>
                          <p className="text-[8.5px] text-slate-400 mt-1">Yetkili İmza & Kaşe</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <IskaOfficialFooter companyProfile={companyProfile} />
                  </div>
                </div>

                {/* --- PAGE 4: REFERANSLAR --- */}
                <div className="pdf-page relative bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <IskaWatermark />
                  <div className="relative z-10 flex-1 flex flex-col justify-between">
                    <div>
                      <IskaOfficialHeader companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} />

                      {/* 2x2 Grid matching the PDF */}
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-[9.5px] text-slate-900 mt-1">
                        {/* KURUMLAR */}
                        <div>
                          <h3 className="font-bold text-[10.5px] text-slate-950 uppercase mb-1.5">KURUMLAR</h3>
                          <ul className="space-y-1 text-slate-900 leading-tight pl-1">
                            <li className="flex items-start gap-1.5"><span>●</span><span>Çevre, Şehircilik ve İklim Değişikliği Bakanlığı</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Çevre, Şehircilik ve İklim Değişikliği Bakanlığı İSTANBUL İl Müdürlüğü</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Çevre, Şehircilik ve İklim Değişikliği Bakanlığı İSTANBUL Altyapı ve Kentsel Dönüşüm Müdürlüğü</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Çevre, Şehircilik ve İklim Değişikliği Bakanlığı İZMİR Altyapı ve Kentsel Dönüşüm Müdürlüğü</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>AFAD</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>GEDAŞ</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Türk Telekom A.Ş.</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Çamlıca TRT Binası</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>TOKİ</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>KİPTAŞ</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Türk Hava Yolları</span></li>
                          </ul>
                        </div>

                        {/* BELEDİYE VE ÜNİVERSİTELER */}
                        <div>
                          <h3 className="font-bold text-[10.5px] text-slate-950 uppercase mb-1.5">BELEDİYE VE ÜNİVERSİTELER</h3>
                          <ul className="space-y-1 text-slate-900 leading-tight pl-1">
                            <li className="flex items-start gap-1.5"><span>●</span><span>Eyüp Sultan Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Kağıthane Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Kadıköy Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Kartal Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Tuzla Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Pendik Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Zeytinburnu Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Şişli Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Fatih Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Maltepe Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Beykoz Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Güngören Belediyesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Yıldız Teknik Üniversitesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>İstanbul Teknik Üniversitesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>İstanbul Kültür Üniversitesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Maltepe Üniversitesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Boğaziçi Üniversitesi</span></li>
                          </ul>
                        </div>

                        {/* ÖZEL KURULUŞLAR */}
                        <div>
                          <h3 className="font-bold text-[10.5px] text-slate-950 uppercase mb-1.5">ÖZEL KURULUŞLAR</h3>
                          <ul className="space-y-0.5 text-slate-900 leading-tight pl-1">
                            <li className="flex items-start gap-1.5"><span>●</span><span>Organik Kimya</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Arup Mühendislik</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>MESA ASL Adi Ortaklığı Ticaret İşletmesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>ÖZAK GYO</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Dyo Boya Fabrikaları</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Yaşar Holding</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Yeşil GYO</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Metrocity Millenium</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Medical Park Hastanesi</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Liv Hospital</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Türkiye Hahambaşılığı</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Sur Yapı</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Ortadoğu İnşaat</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Nef</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Mint</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>İDO</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Kalyon İnşaat</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>RSY İnşaat</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Nas Gayrimenkul Yatırım</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Enka İnşaat ve Sanayi A.Ş.</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Memorial Group</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Koray GYO</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Halkbank</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>DAP YAPI</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Anadolu Efes Grup</span></li>
                          </ul>
                        </div>

                        {/* RİSKLİ ALAN ÇALIŞMALARI */}
                        <div>
                          <h3 className="font-bold text-[10.5px] text-slate-950 uppercase mb-1.5">RİSKLİ ALAN ÇALIŞMALARI</h3>
                          <ul className="space-y-1 text-slate-900 leading-tight pl-1">
                            <li className="flex items-start gap-1.5"><span>●</span><span>TEDAŞ 5. Bölge Müdürlüğü, Vaniköy Tesisleri Binalarında Deprem Testleri</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Beşiktaş İlçesi, Karanfilköy 527 Adet Riskli Bina Tespitleri</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Kağıthane İlçesi, Yahya Kemal Mah. Riskli Alan Çalışması</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Kartal Orhantepe Afet Alanı Riskli Bina Tespitleri</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Kastamonu Sel Afet Alanı – Riskli Yapı Çalışmaları</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>Bitlis Afet Alanı – Riskli Yapı Çalışmaları</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>2020 Elazığ Depremi – Elazığ Riskli Alan çalışmaları</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>2019 İstanbul Depremi sonrası AFAD’ ın belirlediği İstanbul Genel Ağır Hasarlı Binaların Tespitleri</span></li>
                            <li className="flex items-start gap-1.5"><span>●</span><span>2023 Kahramanmaraş Merkezli Deprem sonrası Hatay, Kahramanmaraş, Malatya, Adıyaman ve Gaziantep İllerinde Riskli Yapı tespit işlemleri</span></li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <IskaOfficialFooter companyProfile={companyProfile} />
                  </div>
                </div>
              </div>
            ) : (
              /* ================================================================ */
              /* 4. RİSKLİ YAPI TESPİTİ (6306 SAYILI KANUN)                       */
              /* ================================================================ */
              <div>
                {/* --- PAGE 1 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <DocHeaderPage1 companyProfile={companyProfile} date={proposal.createdAt} refNo={proposal.proposalNumber} theme="blue" />

                      {/* Konu Header */}
                      <div className="mb-4 font-bold text-[11.5px] text-slate-900 leading-relaxed bg-blue-50/80 p-4 rounded-xl border border-blue-200">
                        <span className="font-extrabold text-blue-950">Konu : </span>
                        {proposal.property.city || 'İstanbul'} İLİ, {proposal.property.district || '-'} İlçesi, {proposal.property.neighborhood || '-'} Mahallesi, {proposal.property.pafta ? `Pafta: ${proposal.property.pafta}, ` : ''}Ada: {proposal.property.ada || '-'} / Parsel: {proposal.property.parsel || '-'}{proposal.property.fullAddress ? `, ${proposal.property.fullAddress}` : ''} konumunda bulunan {Number(proposal.property.buildingCount) > 1 ? `(${proposal.property.buildingCount} Adet Bina${Number(proposal.property.totalFloors) > 0 ? `, ${proposal.property.totalFloors} Katlı` : ''}) ` : Number(proposal.property.totalFloors) > 0 ? `(${proposal.property.totalFloors} Katlı) ` : ''}Yapı İçin 6306 Sayılı Kanun Ve 2019 RYTEİE Yönetmeliğine Göre Riskli Yapı Tespiti Ve Rapor Hazırlanması
                      </div>

                      <p className="text-[11px] text-slate-800 mb-4 leading-relaxed">
                        Yapının riskli yapı tespiti amacıyla aşağıdaki tablolarda yapılacak çalışmalar, kapsamları ve ücretlendirme yer almaktadır.
                      </p>

                      {/* Table 1 */}
                      <div className="mb-3">
                        <h2 className="font-black text-[12px] text-slate-900 uppercase mb-2">
                          Tablo 1: Yapılacak İşlemler (6306 Sayılı Kanun Kapsamında)
                        </h2>

                        <div className="border border-blue-950 text-[10.5px] rounded-xl overflow-hidden shadow-xs">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-blue-950 text-white font-bold py-2.5 px-3.5 text-center text-[11px]">
                                <th className="py-2.5 px-3.5 w-5/12 border-r border-blue-800 text-left">Deney / İnceleme Adı</th>
                                <th className="py-2.5 px-3.5 w-7/12 text-left">Açıklama & Uygulama Standartları</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 bg-white">
                              {proposal.scopeItems
                                .filter((item) => item.included)
                                .map((item, idx) => (
                                  <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    <td className="py-2.5 px-3.5 font-bold text-blue-950 w-5/12 align-top border-r border-slate-200">
                                      {item.title}
                                    </td>
                                    <td className="py-2.5 px-3.5 text-slate-800 leading-normal w-7/12">
                                      {item.description}
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-[11px] font-bold text-slate-900 mt-2.5 text-center">Tablo: 1 Yapılacak İşlemler</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-[10px] text-blue-950 leading-relaxed">
                      <p><strong>Bilgilendirme:</strong> Raporlama süreci Çevre, Şehircilik ve İklim Değişikliği Bakanlığı A.R.A.A.D. bilgi sistemi üzerinden yürütülmektedir.</p>
                    </div>
                  </div>

                  <DocFooter companyProfile={companyProfile} />
                </div>

                {/* --- PAGE 2 --- */}
                <div className="pdf-page bg-white text-slate-900 w-[794px] max-w-[794px] min-h-[1123px] p-9 box-border flex flex-col justify-between shadow-md mb-6 last:mb-0 print:mb-0 print:shadow-none print:break-after-page">
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <DocHeaderPage2 companyProfile={companyProfile} date={proposal.createdAt} theme="blue" />

                      <div className="mb-4 pb-2 border-b-2 border-blue-900">
                        <h2 className="font-black text-[12.5px] text-blue-950 uppercase tracking-tight">
                          TEKLİF ŞARTLARI, ÖDEME VE İMZA PROTOKOLÜ
                        </h2>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 text-[10.5px] mb-4 space-y-2">
                        <h3 className="font-extrabold text-blue-950 uppercase text-[10.5px]">
                          2019 RYTEİE YÖNETMELİĞİ & ÖDEME KOŞULLARI
                        </h3>
                        <ul className="space-y-2 text-slate-800 list-disc pl-4 text-[10px]">
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
                      <div className="bg-white border border-slate-300 rounded-xl p-4 max-w-lg mx-auto shadow-xs mb-4">
                        <h3 className="font-black text-slate-900 text-center uppercase tracking-wider text-[11.5px] border-b border-slate-200 pb-1.5 mb-2">
                          TEKLİF FİYAT ÖZETİ
                        </h3>

                        <div className="space-y-2 text-[11px]">
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
                              <div className="flex justify-between text-slate-800 font-bold bg-blue-50/70 px-3 py-2 rounded-lg border border-blue-200">
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
                            <div className="flex justify-between text-amber-950 font-bold bg-amber-50/80 px-3 py-2 rounded-lg border border-amber-200">
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

                          <div className="flex justify-between text-slate-700 pt-1.5 border-t border-slate-200 text-[10.5px]">
                            <span>Katma Değer Vergisi (%{proposal.pricing.vatRate} KDV):</span>
                            <span className="font-mono font-bold text-slate-800">
                              ₺{Math.round(((proposal.pricing.subtotal - proposal.pricing.discount) * proposal.pricing.vatRate) / 100).toLocaleString('tr-TR')}
                            </span>
                          </div>

                          <div className="flex justify-between text-[13px] font-black text-slate-950 border-t border-slate-900 pt-2">
                            <span>GENEL TOPLAM (KDV Dahil):</span>
                            <span className="font-mono">₺{proposal.pricing.totalAmount.toLocaleString('tr-TR')}</span>
                          </div>
                        </div>
                      </div>

                      {/* Notlar */}
                      <div className="space-y-1.5 text-[10px] text-slate-700 mb-4 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200 leading-relaxed">
                        <p>*** Dilatasyonlu binalarda her blok ayrı bir yapı olarak değerlendirilir.</p>
                        <p>*** Tamirat-tadilat ve belediye harçları fiyata dahil değildir.</p>
                        <p className="text-amber-900 font-semibold">Not: Teklif geçerlilik süresi {proposal.paymentTerms.validityDays || 15} takvim günüdür.</p>
                      </div>
                    </div>

                    {/* İmza Bölümü */}
                    <div className="grid grid-cols-2 gap-4 text-[10px]">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 shadow-2xs">
                        <p className="font-bold text-slate-900 uppercase text-[10px]">TEKLİF VEREN KURULUŞ</p>
                        <p className="font-bold text-slate-800 text-[10px] mt-0.5">{companyProfile.name}</p>
                        <p className="text-[9px] text-slate-500">Müh. ve Mim. Hiz. Ltd. Şti.</p>
                        <div className="mt-5 border-b border-slate-300 w-36"></div>
                        <p className="text-[8.5px] text-slate-400 mt-0.5">Yetkili İmza & Kaşe</p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-right flex flex-col items-end shadow-2xs">
                        <p className="font-bold text-slate-900 uppercase text-[10px]">MÜŞTERİ / YAPI SAHİBİ</p>
                        <p className="font-bold text-slate-800 text-[10px] mt-0.5">{proposal.client.name}</p>
                        {proposal.client.contactPerson && (
                          <p className="text-[9px] text-slate-600">Muhatap: {proposal.client.contactPerson}</p>
                        )}
                        <p className="text-[9px] text-slate-500">Teklif Onay</p>
                        <div className="mt-5 border-b border-slate-300 w-36"></div>
                        <p className="text-[8.5px] text-slate-400 mt-0.5">İmza & Tarih</p>
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
