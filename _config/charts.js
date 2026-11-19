// Charts as static SVG, built at build time (no JavaScript, no third party): planning#23.
// Styling comes from css/theme.css (.chart-*), so the charts follow dark and light mode.
//
// histogramSvg(element, h): one histogram of reported element contents on a log10 axis.
// `h` is the publication's histogram set from _data/lodam.js (histogramsOf): shared
// log10 x axis (decades h.lo .. h.hi, h.binsPerDecade bins each); the count axis is per
// chart, because a single crowded bin (e.g. many identical reported values) would
// otherwise flatten all other charts.
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
const pow10 = (k) => "10" + String(k).split("").map((c) => SUP[c]).join("");

export function histogramSvg(e, h, idBase) {
	const W = 320, H = 150, ml = 34, mr = 16, mt = 12, mb = 28;
	const pw = W - ml - mr, ph = H - mt - mb, base = mt + ph;
	const yMax = Math.max(1, ...e.bins.map((b) => b.count));
	// clean count ticks: 0, a middle one when it is a whole number, max
	const yTicks = [0, ...(yMax >= 4 && yMax % 2 === 0 ? [yMax / 2] : []), yMax];
	const x = (i) => ml + (i / h.nBins) * pw;
	const y = (c) => base - (c / yMax) * ph;
	const slot = pw / h.nBins, gap = 2, bw = Math.max(1, Math.min(24, slot - gap)), r = Math.min(2, bw / 2);
	const unit = h.units.length === 1 ? h.units[0] : "";
	const label = `${e.head.title || e.head.text}: ${e.n} reported value${e.n === 1 ? "" : "s"} on a log10 scale`
		+ (e.nd ? `; ${e.nd} not detected` : "") + (e.limit ? `; ${e.limit} below a detection limit` : "") + (e.zero ? `; ${e.zero} reported as 0` : "");
	const out = [];
	out.push(`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${idBase}-t" xmlns="http://www.w3.org/2000/svg">`);
	out.push(`<title id="${idBase}-t">${esc(label)}</title>`);
	// recessive grid and axes
	for (const t of yTicks) {
		out.push(`<line class="chart-grid" x1="${ml}" x2="${W - mr}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/>`);
		out.push(`<text class="chart-tick" x="${ml - 5}" y="${(y(t) + 3.5).toFixed(1)}" text-anchor="end">${t}</text>`);
	}
	h.decades.forEach((k, i) => {
		const xx = x(i * h.binsPerDecade);
		out.push(`<line class="chart-axis" x1="${xx.toFixed(1)}" x2="${xx.toFixed(1)}" y1="${base}" y2="${base + 4}"/>`);
		out.push(`<text class="chart-tick" x="${xx.toFixed(1)}" y="${base + 16}" text-anchor="middle">${pow10(k)}</text>`);
	});
	out.push(`<line class="chart-axis" x1="${ml}" x2="${W - mr}" y1="${base}" y2="${base}"/>`);
	// bars: rounded data end, square at the baseline; native tooltip per bar
	for (const b of e.bins) {
		if (!b.count) continue;
		const bx = x(b.i) + (slot - bw) / 2, by = y(b.count), bh = base - by;
		const rr = Math.min(r, bh);
		const d = `M${bx.toFixed(2)},${base}V${(by + rr).toFixed(2)}Q${bx.toFixed(2)},${by.toFixed(2)} ${(bx + rr).toFixed(2)},${by.toFixed(2)}`
			+ `H${(bx + bw - rr).toFixed(2)}Q${(bx + bw).toFixed(2)},${by.toFixed(2)} ${(bx + bw).toFixed(2)},${(by + rr).toFixed(2)}V${base}Z`;
		out.push(`<path class="chart-bar" d="${d}"><title>${esc(`${b.from} to < ${b.to}${unit ? " " + unit : ""}: ${b.count} analys${b.count === 1 ? "is" : "es"}`)}</title></path>`);
	}
	out.push(`</svg>`);
	return out.join("");
}

export default function (eleventyConfig) {
	eleventyConfig.addFilter("histogramSvg", (e, h, idBase) => histogramSvg(e, h, idBase));
}
