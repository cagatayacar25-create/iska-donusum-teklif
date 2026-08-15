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
  <text x="235" y="170" font-family="'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="110" fill="#1e1e1e" text-anchor="middle" letter-spacing="-2">
    İ<tspan font-size="100">s</tspan>K<tspan font-size="90">A</tspan>
  </text>
</svg>`;

export const ISKA_LOGO_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(ISKA_LOGO_SVG)}`;
