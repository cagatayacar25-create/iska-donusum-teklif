import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ISKA_LOGO_DATA_URL } from '../assets/iskaLogo';

function parseNumberOrPercent(str: string, scaleIfPercent = 1): number {
  if (!str) return 0;
  const isPercent = str.includes('%');
  const val = parseFloat(str);
  if (isNaN(val)) return 0;
  if (isPercent) return (val / 100) * scaleIfPercent;
  return val;
}

function oklchToRgb(lStr: string, cStr: string, hStr: string, aStr?: string): string {
  let L = parseNumberOrPercent(lStr, 1);
  let C = parseNumberOrPercent(cStr, 0.4);
  let H = parseFloat(hStr) || 0;
  let alpha = aStr !== undefined && aStr !== null && aStr !== '' ? parseNumberOrPercent(aStr, 1) : 1;

  if (alpha <= 0) return 'transparent';

  // OKLCH -> OKLAB
  const a_lab = C * Math.cos((H * Math.PI) / 180);
  const b_lab = C * Math.sin((H * Math.PI) / 180);

  // OKLAB -> LMS
  const l_ = L + 0.3963377774 * a_lab + 0.2158037573 * b_lab;
  const m_ = L - 0.1055613458 * a_lab - 0.0638541728 * b_lab;
  const s_ = L - 0.0894841775 * a_lab - 1.2914855480 * b_lab;

  const l = l_ > 0 ? l_ * l_ * l_ : 0;
  const m = m_ > 0 ? m_ * m_ * m_ : 0;
  const s = s_ > 0 ? s_ * s_ * s_ : 0;

  // LMS -> Linear sRGB
  const rL = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const gL = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bL = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  const gamma = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const r = Math.round(gamma(rL) * 255);
  const g = Math.round(gamma(gL) * 255);
  const b = Math.round(gamma(bL) * 255);

  if (alpha < 1) {
    return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function sanitizeCssForHtml2Canvas(cssText: string): string {
  if (!cssText || (!cssText.includes('oklch') && !cssText.includes('oklab'))) {
    return cssText;
  }

  let text = cssText;

  // 1. Replace color-mix(in oklab...) or color-mix(in oklch...) with color-mix(in srgb...)
  text = text.replace(/color-mix\(\s*in\s+(oklab|oklch)/gi, 'color-mix(in srgb');

  // 2. Replace oklch(...) function calls
  text = text.replace(/oklch\s*\(([\s\S]*?)\)/gi, (fullMatch, inner) => {
    try {
      const slashParts = inner.split('/');
      const colorPart = slashParts[0].trim();
      const alphaPart = slashParts[1] ? slashParts[1].trim() : undefined;
      const tokens = colorPart.split(/[\s,]+/).filter(Boolean);
      if (tokens.length >= 3) {
        return oklchToRgb(tokens[0], tokens[1], tokens[2], alphaPart);
      }
    } catch {
      // fallback
    }
    return 'rgb(255, 255, 255)';
  });

  // 3. Replace oklab(...) function calls
  text = text.replace(/oklab\s*\(([\s\S]*?)\)/gi, (fullMatch, inner) => {
    try {
      const slashParts = inner.split('/');
      const colorPart = slashParts[0].trim();
      const alphaPart = slashParts[1] ? slashParts[1].trim() : undefined;
      const tokens = colorPart.split(/[\s,]+/).filter(Boolean);
      if (tokens.length >= 3) {
        const L = parseNumberOrPercent(tokens[0], 1);
        const a = parseNumberOrPercent(tokens[1], 0.4);
        const b = parseNumberOrPercent(tokens[2], 0.4);
        const C = Math.sqrt(a * a + b * b);
        let H = (Math.atan2(b, a) * 180) / Math.PI;
        if (H < 0) H += 360;
        return oklchToRgb(String(L), String(C), String(H), String(alphaPart !== undefined ? alphaPart : 1));
      }
    } catch {
      // fallback
    }
    return 'rgb(255, 255, 255)';
  });

  // 4. Any remaining 'oklch' or 'oklab' identifiers (e.g., in @supports or custom properties)
  text = text.replace(/oklch/gi, 'srgb').replace(/oklab/gi, 'srgb');

  return text;
}

function applyComputedColorsRecursively(origNode: Element, cloneNode: Element) {
  if (!(origNode instanceof HTMLElement) || !(cloneNode instanceof HTMLElement)) return;

  try {
    const style = window.getComputedStyle(origNode);

    if (style.color) cloneNode.style.color = style.color;
    if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
      cloneNode.style.backgroundColor = style.backgroundColor;
    }
    if (style.borderColor) cloneNode.style.borderColor = style.borderColor;

    cloneNode.style.boxShadow = 'none';
    cloneNode.style.textShadow = 'none';
  } catch {
    // ignore
  }

  const origChildren = Array.from(origNode.children);
  const cloneChildren = Array.from(cloneNode.children);
  const minLen = Math.min(origChildren.length, cloneChildren.length);

  for (let i = 0; i < minLen; i++) {
    applyComputedColorsRecursively(origChildren[i], cloneChildren[i]);
  }
}

export async function exportProposalToPdf(elementId: string, filename: string): Promise<boolean> {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      alert('PDF belgesi bulunamadı.');
      return false;
    }

    // 1. Create container positioned fixed at (0, 0) behind viewport (z-index -99999)
    const cloneContainer = document.createElement('div');
    cloneContainer.style.position = 'fixed';
    cloneContainer.style.top = '0px';
    cloneContainer.style.left = '0px';
    cloneContainer.style.width = '794px';
    cloneContainer.style.backgroundColor = '#ffffff';
    cloneContainer.style.zIndex = '-99999';
    cloneContainer.style.overflow = 'visible';

    const clonedEl = element.cloneNode(true) as HTMLElement;
    clonedEl.style.width = '794px';
    clonedEl.style.maxWidth = '794px';
    clonedEl.style.padding = '0px';
    clonedEl.style.boxShadow = 'none';
    clonedEl.style.border = 'none';
    clonedEl.style.margin = '0px';
    clonedEl.style.backgroundColor = '#ffffff';

    // Apply exact computed RGB colors from live DOM
    applyComputedColorsRecursively(element, clonedEl);

    // Fix images in clone
    const images = clonedEl.querySelectorAll('img');
    images.forEach((img) => {
      if (!img.src || (!img.src.startsWith('data:') && !img.src.startsWith('blob:'))) {
        img.src = ISKA_LOGO_DATA_URL;
      }
    });

    cloneContainer.appendChild(clonedEl);
    document.body.appendChild(cloneContainer);

    // Wait for clone DOM to attach
    await new Promise((resolve) => setTimeout(resolve, 150));

    // 2. Capture canvas with html2canvas and sanitize clonedDoc CSS for oklch / oklab
    const canvas = await html2canvas(clonedEl, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      width: 794,
      height: clonedEl.scrollHeight,
      onclone: (clonedDoc) => {
        // Sanitize all style tags in the cloned document
        const styleTags = clonedDoc.querySelectorAll('style');
        styleTags.forEach((styleTag) => {
          if (styleTag.textContent && (styleTag.textContent.includes('oklch') || styleTag.textContent.includes('oklab'))) {
            styleTag.textContent = sanitizeCssForHtml2Canvas(styleTag.textContent);
          }
        });

        // Sanitize inline styles on all elements
        const styledElements = clonedDoc.querySelectorAll('[style]');
        styledElements.forEach((el) => {
          const styleAttr = el.getAttribute('style');
          if (styleAttr && (styleAttr.includes('oklch') || styleAttr.includes('oklab'))) {
            el.setAttribute('style', sanitizeCssForHtml2Canvas(styleAttr));
          }
        });
      },
    });

    // Clean up clone element immediately
    if (document.body.contains(cloneContainer)) {
      document.body.removeChild(cloneContainer);
    }

    let imgData: string;
    try {
      imgData = canvas.toDataURL('image/jpeg', 0.95);
    } catch (e) {
      console.warn('JPEG export fallback to PNG:', e);
      imgData = canvas.toDataURL('image/png');
    }

    // 3. Generate jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    // Page 1
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;

    // Multi-page handling
    while (heightLeft > 3) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;
    }

    const cleanFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    // 4. Trigger direct file download
    try {
      pdf.save(cleanFilename);
    } catch (saveErr) {
      console.warn('pdf.save failed, fallback to Blob download:', saveErr);
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    }

    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('PDF indirilirken bir hata oluştu: ' + (error instanceof Error ? error.message : String(error)));
    return false;
  }
}
