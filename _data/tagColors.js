// LOD-AM Tag Color Mapping
// Uses the LOD-AM color schema with variations to provide unique colors for each tag

const lodAmColors = {
  terracotta: '#E2725B',
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

const colorPalette = [
  'terracotta',
  'ochre', 
  'malachite',
  'sage',
  'burntSienna',
  'sunsetOrange',
  'terracottaLight',
  'ochreLight',
  'malachiteLight',
  'sageLight',
  'burntSiennaLight',
  'sunsetOrangeLight',
  'terracottaDark',
  'ochreDark',
  'malachiteDark',
  'sageDark',
  'burntSiennaDark',
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

function getTagBgClass(tag) {
  const color = getTagColor(tag);
  const colorObj = hexToRgb(color);
  const luminance = (0.299 * colorObj.r + 0.587 * colorObj.g + 0.114 * colorObj.b) / 255;
  const textColor = luminance > 0.5 ? 'text-dark' : 'text-light';
  return {
    style: 'background-color: ' + color + ';',
    textClass: textColor
  };
}

export { getTagColor, getTagBgClass, customTagColors };
