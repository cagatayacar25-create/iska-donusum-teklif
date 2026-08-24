import React from 'react';

export const ISKA_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 280" width="500" height="280">
  <rect width="500" height="280" fill="transparent"/>
  <!-- Top Black Ellipse Arc -->
  <path d="M 100,190 C 20,150 35,40 260,35 C 330,33 390,50 420,65 C 370,45 250,30 130,65 C 40,95 30,165 100,190 Z" fill="#1e1e1e"/>
  <!-- Bottom Cyan Ellipse Arc -->
  <path d="M 115,230 C 230,265 410,220 460,110 C 475,80 460,55 425,48 C 450,70 460,120 400,185 C 310,240 140,235 115,230 Z" fill="#00a0e9"/>
  <!-- Red Sparkle / Star at Top Right -->
  <g transform="translate(355, 62)">
    <path d="M 0,-55 C 1,-10 10,-1 55,0 C 10,1 1,10 0,55 C -1,10 -10,1 -55,0 C -10,-1 -1,-10 0,-55 Z" fill="#ed1c24"/>
  </g>
  <!-- Main Text "İsKA" -->
  <text x="235" y="170" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="110" fill="#1e1e1e" text-anchor="middle" letter-spacing="-2">
    İ<tspan font-size="100">s</tspan>K<tspan font-size="90">A</tspan>
  </text>
</svg>`;

// Base64 encoding guaranteed to work on iOS Safari / WebKit, Android Chrome & all desktop browsers
const utf8ToBase64 = (str: string): string => {
  try {
    if (typeof window !== 'undefined' && window.btoa) {
      return window.btoa(unescape(encodeURIComponent(str)));
    }
  } catch (e) {
    // fallback
  }
  return 'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MDAgMjgwIiB3aWR0aD0iNTAwIiBoZWlnaHQ9IjI4MCI+CiAgPHJlY3Qgd2lkdGg9IjUwMCIgaGVpZ2h0PSIyODAiIGZpbGw9InRyYW5zcGFyZW50Ii8+CiAgPCEtLSBUb3AgQmxhY2sgRWxsaXBzZSBBcmMgLS0+CiAgPHBhdGggZD0iTSAxMDAsMTkwIEMgMjAsMTUwIDM1LDQwIDI2MCwzNSBDIDMzMCwzMyAzOTAsNTAgNDIwLDY1IEMgMzcwLDQ1IDI1MCwzMCAxMzAsNjUgQyA0MCw5NSAzMCwxNjUgMTAwLDE5MCBaIiBmaWxsPSIjMWUxZTFlIi8+CiAgPCEtLSBCb3R0b20gQ3lhbiBFbGxpcHNlIEFyYyAtLT4KICA8cGF0aCBkPSJNIDExNSwyMzAgQyAyMzAsMjY1IDQxMCwyMjAgNDYwLDExMCBDIDQ3NSw4MCA0NjAsNTUgNDI1LDQ4IEMgNDUwLDcwIDQ2MCwxMjAgNDAwLDE4NSBDIDMxMCwyNDAgMTQwLDIzNSAxMTUsMjMwIFoiIGZpbGw9IiMwMGEwZTkiLz4KICA8IS0tIFJlZCBTcGFya2xlIC8gU3RhciBhdCBUb3AgUmlnaHQgLS0+CiAgPGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMzU1LCA2MikiPgogICAgPHBhdGggZD0iTSAwLC01NSBDIDEsLTEwIDEwLC0xIDU1LDAgQyAxMCwxIDEsMTAgMCw1NSBDIC0xLDEwIC0xMCwxIC01NSwwIEMgLTEwLC0xIC0xLC0xMCAwLC01NSBaIiBmaWxsPSIjZWQxYzI0Ii8+CiAgPC9nPgogIDwhLS0gTWFpbiBUZXh0ICLEsHNLRSIgLS0+CiAgPHRleHQgeD0iMjM1IiB5PSIxNzAiIGZvbnQtZmFtaWx5PSItYXBwbGUtc3lzdGVtLCBCbGlua01hY1N5c3RlbUZvbnQsICdTZWdvZSBVSScsIFJvYm90bywgSGVsdmV0aWNhLCBBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9IjkwMCIgZm9udC1zaXplPSIxMTAiIGZpbGw9IiMxZTFlMWUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGxldHRlci1zcGFjaW5nPSItMiI+CiAgICDEsDx0c3BhbiBmb250LXNpemU9IjEwMCI+czwvdHNwYW4+Szx0c3BhbiBmb250LXNpemU9IjkwIj5BPC90c3Bhbj4KICA8L3RleHQ+Cjwvc3ZnPg==';
};

export const ISKA_LOGO_BASE64 = utf8ToBase64(ISKA_LOGO_SVG);
export const ISKA_LOGO_DATA_URL = `data:image/svg+xml;base64,${ISKA_LOGO_BASE64}`;

/**
 * Pure React SVG component for rendering the Iska logo anywhere in DOM
 * Works natively on iOS Safari, iPhone, Android, and all web browsers without image loading delays or quirks
 */
export const IskaLogoSvg: React.FC<{ className?: string; style?: React.CSSProperties }> = ({
  className = 'h-7 w-auto',
  style,
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 280"
      className={className}
      style={style}
      aria-label="İSKA Logo"
      role="img"
    >
      <rect width="500" height="280" fill="transparent" />
      {/* Top Black Ellipse Arc */}
      <path
        d="M 100,190 C 20,150 35,40 260,35 C 330,33 390,50 420,65 C 370,45 250,30 130,65 C 40,95 30,165 100,190 Z"
        fill="#1e1e1e"
      />
      {/* Bottom Cyan Ellipse Arc */}
      <path
        d="M 115,230 C 230,265 410,220 460,110 C 475,80 460,55 425,48 C 450,70 460,120 400,185 C 310,240 140,235 115,230 Z"
        fill="#00a0e9"
      />
      {/* Red Sparkle / Star at Top Right */}
      <g transform="translate(355, 62)">
        <path
          d="M 0,-55 C 1,-10 10,-1 55,0 C 10,1 1,10 0,55 C -1,10 -10,1 -55,0 C -10,-1 -1,-10 0,-55 Z"
          fill="#ed1c24"
        />
      </g>
      {/* Main Text "İsKA" */}
      <text
        x="235"
        y="170"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
        fontWeight="900"
        fontSize="110"
        fill="#1e1e1e"
        textAnchor="middle"
        letterSpacing="-2"
      >
        İ<tspan fontSize="100">s</tspan>K<tspan fontSize="90">A</tspan>
      </text>
    </svg>
  );
};

/**
 * Universal Company Logo component that supports both custom uploaded logos and the default Iska logo,
 * with bulletproof fallback on iPhone / iOS Safari and Android.
 */
export const CompanyLogoDisplay: React.FC<{
  logoUrl?: string;
  alt?: string;
  className?: string;
}> = ({ logoUrl, alt = 'Firma Logo', className = 'h-14 w-auto object-contain' }) => {
  const [hasError, setHasError] = React.useState(false);

  // If no logo or logo is the default ISKA SVG or has error, render the native SVG directly
  const isDefaultOrSvg =
    !logoUrl ||
    hasError ||
    logoUrl === ISKA_LOGO_DATA_URL ||
    logoUrl.startsWith('data:image/svg+xml;charset=utf-8') ||
    logoUrl.includes('PHN2ZyB4bWxucz');

  if (isDefaultOrSvg) {
    return <IskaLogoSvg className={className} />;
  }

  return (
    <img
      src={logoUrl}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      loading="eager"
    />
  );
};
