import { ProposalType, ScopeItem, CompanyProfile, GuclendirmeParams } from '../types';
import { ISKA_LOGO_DATA_URL } from '../assets/iskaLogo';

export const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: 'İSKA DÖNÜŞÜM YAPI LABORATUVARI',
  title: 'T.C. Çevre, Şehircilik ve İklim Değişikliği Bakanlığı Lisanslı Kuruluş',
  imoNumber: 'Lisans Ref: İSK-2026-08',
  phone: '0212 211 47 52',
  email: 'c.acar@iskamuhendislik.com',
  address: 'Gürsel Mah. Yankı Sok. No:25/2 Kağıthane / İstanbul',
  website: 'www.iskamuhendislik.com',
  logoUrl: ISKA_LOGO_DATA_URL,
  bankInfo: 'TR42 0006 2000 0000 1234 5678 90 (Ziraat Bankası - İska Dönüşüm Yapı Lab. Müh. Ve Mimarlık Hiz. Ltd. Şti.)',
  defaultNote: 'Numune için gün belirlendikten 1 hafta içerisinde %30 ön ödeme yapılmaz ise program günü iptal edilecektir.',
};

export const DEFAULT_GUCLENDIRME_PARAMS: GuclendirmeParams = {
  buildingCount: 2,
  totalArea: 4500,
  
  // 1. Aşama
  sondajCount: 6,
  sondajUnitPrice: 0,
  sondajIncluded: false,
  sondajTotal: 0,

  temelCukuruCount: 6,
  temelCukuruUnitPrice: 25000,
  temelCukuruIncluded: true,
  temelCukuruTotal: 150000,

  avanProjeCalcType: 'building',
  avanProjeUnitPrice: 225000,
  avanProjeIncluded: true,
  avanProjeTotal: 450000,

  stage1Total: 600000,

  // 2. Aşama
  statikDetayEnabled: false,
  statikDetayCalcType: 'area',
  statikDetayUnitPrice: 80,
  statikDetayTotal: 360000,

  elektrikMekanikEnabled: false,
  elektrikMekanikCalcType: 'area',
  elektrikMekanikUnitPrice: 40,
  elektrikMekanikTotal: 180000,

  mimariTadilatEnabled: false,
  mimariTadilatCalcType: 'area',
  mimariTadilatUnitPrice: 50,
  mimariTadilatTotal: 225000,

  ituOnayEnabled: false,
  ituOnayCalcType: 'fixed',
  ituOnayUnitPrice: 100000,
  ituOnayTotal: 100000,

  stage2Total: 0,
  grandTotal: 600000,

  // Aliases
  sondajAdedi: 6,
  sondajBirimFiyat: 0,
  temelCukuruAdedi: 6,
  temelCukuruBirimFiyat: 25000,
  avanProjeBirimFiyat: 225000,
  statikDetayBirimM2Fiyat: 0,
  mekanikElektrikSecili: false,
  mekanikElektrikBirimM2Fiyat: 0,
  mimariTadilatSecili: false,
  mimariTadilatBirimM2Fiyat: 0,
  ituOnaySecili: false,
  ituOnayTutari: 0,
};

export const PROPOSAL_TYPE_LABELS: Record<ProposalType, { name: string; subtitle: string; description: string; tagColor: string }> = {
  riskli_yapi: {
    name: 'Riskli Yapı Tespiti (6306 Sayılı Kanun)',
    subtitle: 'RYTEİE 2019 Yönetmeliğine Göre Rapor Hazırlanması',
    description: '6306 sayılı kanun ve RYTEİE 2019 yönetmeliği kapsamında binanızın riskli yapı tespiti, Çevre ve Şehircilik Bakanlığı lisanslı laboratuvar deneyleri ve resmî raporlama.',
    tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  orta_katli_risk: {
    name: 'Orta Katlı Yapı Riskli Yapı Tespiti (2019 RYTEİE)',
    subtitle: '2019 RYTEİE Yönetmeliği Orta Katlı Betonarme Binalara Göre Rapor Hazırlanması',
    description: '2019 RYTEİE Yönetmeliği kapsamında orta katlı betonarme binalar için her kattan karot, sıyırma, röntgen ve schmidt deneyleri ile sismik zemin etüdü ve Yap.net performans analizi.',
    tagColor: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-extrabold',
  },
  performans_raporu: {
    name: 'Bina Deprem Performans Raporu (TBDY 2018)',
    subtitle: 'Türkiye Bina Deprem Yönetmeliği Kapsamında Analiz & Güçlendirme',
    description: 'TBDY 2018 standartlarına göre doğrusal / doğrusal olmayan (pushover) deprem performans analizi, 3D yapısal modelleme ve güçlendirme önerileri.',
    tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  statik_guclendirme: {
    name: 'Statik Güçlendirme Proje Teklifi (TBDY 2018)',
    subtitle: 'Avan ve Detay Güçlendirme Projelerinin Hazırlanması İşi',
    description: '2018 TBDY kapsamında 50 yılda aşılma olasılığı %10 deprem düzeyine göre Kontrollü Hasar seviyesi hedeflenerek 1. Aşama Avan ve 2. Aşama Detay statik güçlendirme projeleri.',
    tagColor: 'bg-purple-100 text-purple-900 border-purple-300 font-extrabold',
  },
};

export const DEFAULT_SCOPES: Record<ProposalType, ScopeItem[]> = {
  riskli_yapi: [
    {
      id: 'ry1',
      title: 'Yapılan Projelerinin Kontrolü',
      description: 'Tarafınızdan temin edilecek projeler dikkate alınarak taşıyıcı sistemlerin anlaşılması, yapı alanlarının ve eleman sayılarının belirlenmesi, proje temini olursa veya olmaz ise yapının statik ve mimari rölevelerinin çıkartılması',
      included: true,
    },
    {
      id: 'ry2',
      title: 'Schmidt Test Çekici Deneyi',
      description: 'Yapının inceleme yapılacak katından kolonların %20 sinden schmidt deneyi (en az 12 adet) ve Perde sayısının %20 sinden schmidt deneyi (en az 6 adet)',
      included: true,
    },
    {
      id: 'ry3',
      title: 'Karot Numunesi',
      description: 'Yapının Schmidt Test Çekici Deneyinde yapılan kolonların yarısı kadar (en az 6 adet) ve perdelerden yapılan schmidt deneyinin yarısı kadar (en az 3 adet)',
      included: true,
    },
    {
      id: 'ry4',
      title: 'Kolonlarda Tahribatlı Yöntemle Donatı Tespiti (Sıyırma)',
      description: 'İnceleme yapılan katta kolon sayısının %10 u kadar kolon sıyırma (en az 3 adet). Bodrum kat olması durumunda bodrum katta kolon sayısının %10 u kadar kolon sıyırma',
      included: true,
    },
    {
      id: 'ry5',
      title: 'Perdelerde Tahribatlı Yöntemle Donatı Tespiti (Sıyırma)',
      description: 'İnceleme yapılan katta perde sayısının %10 u kadar perde sıyırma (perde varsa en az 1 adet sıyırma). Bodrum kat olması durumunda bodrum katta perde sayısının %10 u kadar perde sıyırma',
      included: true,
    },
    {
      id: 'ry6',
      title: 'Kolonlarda Tahribatsız Yöntemle Donatı Tespiti (Röntgen)',
      description: 'İnceleme yapılan katta kolon sayısının %10 u kadar kolon röntgen okuması (en az 3 adet). Bodrum kat olması durumunda bodrum katta kolon sayısının %10 u kadar kolon röntgen okuması (en az 3 adet)',
      included: true,
    },
    {
      id: 'ry7',
      title: 'Perdelerde Tahribatsız Yöntemle Donatı Tespiti (Röntgen)',
      description: 'İnceleme yapılan katta perde sayısının %10 u kadar perde röntgen okuması (perde varsa en az 1 adet). Bodrum kat olması durumunda bodrum katta perde sayısının %10 u kadar perde röntgen okuması',
      included: true,
    },
    {
      id: 'ry8',
      title: 'Zemin Etüt',
      description: 'Sismik zemin etüdü',
      included: true,
    },
    {
      id: 'ry9',
      title: 'Yapılan Performans Analizinin Yapılması',
      description: 'Tarafınızdan temin edilecek olan zemin raporları, statik ve mimari röleveler-projeler ve karot-sıyırma-röntgen raporlarındaki veriler göz önünde bulundurularak 2019 RYTEİE Yönetmeliğine göre yapılan Yap.net programı ile yetkilendirilmiş mühendis tarafından performans analizinin yapılması ve sonuçlarının ilgili kuruma rapor halinde sunulması',
      included: true,
    },
  ],
  orta_katli_risk: [
    {
      id: 'ok1',
      title: 'Yapılan Projelerinin kontrolü',
      description: 'Tarafınızdan temin edilecek projeler dikkate alınarak taşıyıcı sistemlerin anlaşılması, yapı alanlarının ve eleman sayılarının belirlenmesi, proje temini olursa veya olmaz ise yapının statik ve mimari rölövesinin çıkartılması',
      included: true,
    },
    {
      id: 'ok2',
      title: 'Schmidt Test Çekici Deneyi',
      description: 'Yapının her katından kolonların %20 sinden schmidt deneyi (en az 6 adet) ve Perde sayısının %20 sinden schmidt deneyi (en az 2 adet)',
      included: true,
    },
    {
      id: 'ok3',
      title: 'Karot Numune Alımı',
      description: 'Yapının her katında Schmidt Test Çekiç Deneyinde yapılan kolonların yarısı kadar (en az 3 adet) ve perdelerden yapılan schmidt deneyinin yarısı kadar (en az 1 adet)',
      included: true,
    },
    {
      id: 'ok4',
      title: 'Kolonlarda Tahribatlı Yöntemle Donatı Tespiti ( Sıyırma )',
      description: 'Her kat için kolon sayısının %10 u kadar kolon sıyırma (en az 3 adet)',
      included: true,
    },
    {
      id: 'ok5',
      title: 'Perdelerde Tahribatlı Yöntemle Donatı Tespiti ( Sıyırma )',
      description: 'Her kat için perde sayısının %10 u kadar perde sıyırma (en az 3 adet)',
      included: true,
    },
    {
      id: 'ok6',
      title: 'Kirişlerde Tahribatlı Yöntemle Donatı Tespiti ( Sıyırma )',
      description: 'Her kat için toplam kiriş sayısının %20 si tespit edilecektir. Bu %20 nin %20 sinde kiriş sıyırma işlemi yapılacak',
      included: true,
    },
    {
      id: 'ok7',
      title: 'Kolonlarda Tahribatsız Yöntemle Donatı Tespiti ( Röntgen )',
      description: 'Her kat için kolon sayısının %10 u kadar kolon röntgen okuması (en az 3 adet)',
      included: true,
    },
    {
      id: 'ok8',
      title: 'Perdelerde Tahribatsız Yöntemle Donatı Tespiti ( Röntgen )',
      description: 'Her kat için perde sayısının %10 u kadar perde röntgen okuması (en az 3 adet)',
      included: true,
    },
    {
      id: 'ok9',
      title: 'Kirişlerde Tahribatsız Yöntemle Donatı Tespiti ( Röntgen )',
      description: 'Her kat için tespit edilen %20 kiriş sayısının %80 nin de kiriş röntgen okuması yapılacak',
      included: true,
    },
    {
      id: 'ok10',
      title: 'Zemin Etüt',
      description: 'Sismik zemin etüdü',
      included: true,
    },
    {
      id: 'ok11',
      title: 'Yapılan Performans Analizinin Yapılanması',
      description: 'Tarafınızdan temin edilecek olan zemin raporları, statik ve mimari rölöveler-projeler ve karot-sıyırma-röntgen raporlarındaki veriler göz önünde bulundurularak 2019 RYTEİE Yönetmeliğine göre yapıların Yap.net programı ile yetkilendirilmiş mühendis tarafından performans analizinin yapılması ve sonuçlarının ilgili kuruma rapor halinde sunulması',
      included: true,
    },
  ],
  performans_raporu: [
    {
      id: 'pr1',
      title: 'Yapılan Projelerinin kontrolü (1)',
      description: 'Tarafınızdan temin edilecek projeler dikkate alınarak taşıyıcı sistemlerin anlaşılması, yapı alanlarının ve eleman sayılarının belirlenmesi, yapıların proje uygunluklarının belirlenmesi, uygunluğun olmaması halinde statik rölöve projelerinin hazırlanması',
      included: true,
    },
    {
      id: 'pr2',
      title: 'Karot Numunesi (1)',
      description: '2018 TBDY’ nin ilgili Bilgi Düzeyine göre Her katta Beton dayanımı belirlemek için karot numunelerinin alınması ve deneylerinin yapılması (her bloktan)',
      included: true,
    },
    {
      id: 'pr3',
      title: 'Kolon, Kiriş ve Perdelerde Tahribatlı Yöntemle Donatı Tespiti ( Sıyırma ) – (1)',
      description: '2018 TBDY’ nin ilgili Bilgi Düzeyine göre Her katta Tahribatlı donatı tespitlerinin yapılması (her bloktan)',
      included: true,
    },
    {
      id: 'pr4',
      title: 'Kolon, Kiriş ve Perdelerde Tahribatsız Yöntemle Donatı Tespiti ( Röntgen ) – (1)',
      description: '2018 TBDY’ nin ilgili Bilgi Düzeyine göre Her katta Tahribatsız donatı tespitlerinin yapılması (her bloktan)',
      included: true,
    },
    {
      id: 'pr5',
      title: 'Yapı Performans Analizinin Yapılanması (1)',
      description: 'Zemin raporları, statik ve mimari rölöveler-projeler ve karot sıyırma-röntgen raporlarındaki veriler göz önünde bulundurularak 2018 TBDY Yönetmeliğine göre ProtaStructure veya SAP2000 programları ile yapıların performans analizinin yapılması ve sonuçlarının rapor halinde sunulması. (Her blok için ayrı rapor halinde)',
      included: true,
    },
  ],
  statik_guclendirme: [
    {
      id: 'sg1',
      title: 'Sondaja Dayalı Zemin ve Geoteknik Rapor',
      description: 'Yapıların temel zemin tabakalarının belirlenmesi, zemin taşıma gücü ve sıvılaşma risk analizlerinin yapılması için zemin sondajı ve geoteknik rapor hazırlanması',
      included: true,
    },
    {
      id: 'sg2',
      title: 'Temel Çukuru Açılarak Temel Sisteminin Belirlenmesi',
      description: 'Temel boyutlarının, temel derinliğinin ve donatı durumunun tespiti amacıyla muayene çukurlarının açılması ve projelendirilmesi',
      included: true,
    },
    {
      id: 'sg3',
      title: 'Statik Güçlendirme Avan Projelerinin Hazırlanması',
      description: '2018 TBDY standartlarına uygun Kontrollü Hasar hedeflenerek betonarme, çelik veya karbon lifli polimer (CFRP) yöntemleriyle avan güçlendirme projelendirilmesi ve keşif-yaklaşık maliyet hazırlanması',
      included: true,
    },
    {
      id: 'sg4',
      title: 'Statik Güçlendirme Detay Projelerinin Hazırlanması (Uygulama/Ruhsat)',
      description: 'İlgili belediye veya OSB onayına sunulacak nitelikte imalat, metraj, donatı açılımları ve montaj detaylarını içeren tam statik uygulama projesi',
      included: false,
    },
    {
      id: 'sg5',
      title: 'Elektrik ve Mekanik Projeleri',
      description: 'Güçlendirme yapılacak yapı elemanlarının elektrik ve mekanik tesisat revizyon ve deplase uygulama projeleri',
      included: false,
    },
    {
      id: 'sg6',
      title: 'Mimari Tadilat Projeleri',
      description: 'Güçlendirme perdeleri, mantolama ve kolon ilaveleri sebebiyle mimari kullanım alanlarındaki revizyonların çizilmesi ve ruhsatlandırılması',
      included: false,
    },
    {
      id: 'sg7',
      title: 'İTÜ / Üniversite Onayı',
      description: 'Hazırlanan güçlendirme hesap raporlarının ve uygulama projelerinin Üniversite Heyeti (İTÜ vb.) tarafından akademik incelemesi ve onaylanması',
      included: false,
    },
  ],
};
