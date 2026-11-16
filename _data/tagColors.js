// LOD-AM Tag Color Mapping
// Uses the LOD-AM colour scheme with variations: each tag gets a stable dot colour

const lodAmColors = {
  terracotta: '#CB6D51',
  ochre: '#CC8B32',
  malachite: '#3D9970',
  sage: '#8A9B68',
  chalkWhite: '#F5F0E6',
  deepUmber: '#3A2E22',
  burntSienna: '#D45D3D',
  sunsetOrange: '#F28C28',
  charcoal: '#2A241D',
  terracottaLight: '#F09B86',
  terracottaDark: '#C15840',
  ochreLight: '#E6B85C',
  ochreDark: '#A67229',
  malachiteLight: '#5FB389',
  malachiteDark: '#2E7A56',
  sageLight: '#A8B885',
  sageDark: '#6B7A50',
  burntSiennaLight: '#E07A5D',
  burntSiennaDark: '#B8452A',
  sunsetOrangeLight: '#F7A852',
  sunsetOrangeDark: '#D9731F',
};

// Tags are neutral outlined chips; the colour is only a small dot that helps
// to tell tags apart (the label carries the meaning). Every colour here reaches
// 3:1 (WCAG non-text contrast) on both page background (#4A3F32) and cards (#3A2E22).
const colorPalette = [
  'ochre',
  'sage',
  'sunsetOrange',
  'terracottaLight',
  'ochreLight',
  'malachiteLight',
  'sageLight',
  'burntSiennaLight',
  'sunsetOrangeLight',
  'sunsetOrangeDark',
];

const customTagColors = {};

function getTagColor(tag) {
  const tagLower = tag.toLowerCase();
  if (customTagColors[tagLower]) {
    return lodAmColors[customTagColors[tagLower]];
  }
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colorPalette.length;
  return lodAmColors[colorPalette[index]];
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// WCAG relative luminance and contrast ratio (to check new colours)
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

// Inline style for a tag chip: sets the dot colour used by .tag in theme.css
function getTagStyle(tag) {
  return '--tag-color: ' + getTagColor(tag) + ';';
}

export { getTagColor, getTagStyle, customTagColors, contrast };
