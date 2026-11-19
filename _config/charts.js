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
// A power of ten as a plain number (owner, 2026-11-19: raw values, not 10^x): 0.0001, 0.001, 1, 10
const decimal = (k) => (k < 0 ? "0." + "0".repeat(-k - 1) + "1" : "1" + "0".repeat(k));

export function histogramSvg(e, h, idBase) {
	const W = 320, H = 175, ml = 34, mr = 22, mt = 12, mb = 53;   // room for the tilted x labels
	const pw = W - ml - mr, ph = H - mt - mb, base = mt + ph;
	const yMax = Math.max(1, ...e.bins.map((b) => b.count));
	// clean count ticks: 0, a middle one when it is a whole number, max
	const yTicks = [0, ...(yMax >= 4 && yMax % 2 === 0 ? [yMax / 2] : []), yMax];
	const x = (i) => ml + (i / h.nBins) * pw;
	const y = (c) => base - (c / yMax) * ph;
	const slot = pw / h.nBins, gap = 2, bw = Math.max(1, Math.min(24, slot - gap)), r = Math.min(2, bw / 2);
	const unit = h.units.length === 1 ? h.units[0] : "";
	const label = `${e.head.text}${e.head.title ? ` (${e.head.title})` : ""}: ${e.n} reported value${e.n === 1 ? "" : "s"} on a log10 scale`
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
		// tilted, so long values like 0.000001 don't overlap; each label starts at its tick and runs
		// down to the right, so the long (small) values on the left stay inside the chart
		out.push(`<text class="chart-tick" transform="translate(${(xx - 3).toFixed(1)} ${base + 11}) rotate(40)" text-anchor="start">${decimal(k)}</text>`);
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

// Ratio label with superscript mass numbers: "207Pb/206Pb" -> "²⁰⁷Pb/²⁰⁶Pb"
const supLabel = (l) => l.replace(/(\d+)Pb/g, (_, n) => n.split("").map((c) => SUP[c]).join("") + "Pb");

// Clean linear ticks (steps of 1, 2, 2.5 or 5 x 10^k) around [min, max]
function linearTicks(min, max, count = 5) {
	if (min === max) { min -= Math.abs(min) * 0.01 || 1; max += Math.abs(max) * 0.01 || 1; }
	const raw = (max - min) / count, mag = 10 ** Math.floor(Math.log10(raw));
	const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
	const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
	const decimals = Math.max(0, -Math.floor(Math.log10(step)) + (step / mag === 2.5 ? 1 : 0));
	const ticks = [];
	for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Number(v.toFixed(decimals)));
	return { lo, hi, ticks, decimals };
}

// scatterSvg(plot): one lead isotope diagram. Each point links to its analysis and has a native
// tooltip with the values as reported. One series, so one mark colour and no legend.
export function scatterSvg(p, idBase) {
	const W = 440, H = 360, ml = 64, mr = 16, mt = 14, mb = 52;
	const pw = W - ml - mr, ph = H - mt - mb;
	const xs = p.points.map((d) => d.x), ys = p.points.map((d) => d.y);
	const pad = (a) => (Math.max(...a) - Math.min(...a)) * 0.06 || Math.abs(a[0]) * 0.01;
	const X = linearTicks(Math.min(...xs) - pad(xs), Math.max(...xs) + pad(xs));
	const Y = linearTicks(Math.min(...ys) - pad(ys), Math.max(...ys) + pad(ys));
	const sx = (v) => ml + ((v - X.lo) / (X.hi - X.lo)) * pw;
	const sy = (v) => mt + ph - ((v - Y.lo) / (Y.hi - Y.lo)) * ph;
	const xl = supLabel(p.xLabel), yl = supLabel(p.yLabel);
	const out = [];
	out.push(`<svg class="chart chart--scatter" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${idBase}-t" xmlns="http://www.w3.org/2000/svg">`);
	out.push(`<title id="${idBase}-t">${esc(`${yl} against ${xl}: ${p.points.length} analyses, values as reported`)}</title>`);
	for (const t of Y.ticks) {
		out.push(`<line class="chart-grid" x1="${ml}" x2="${W - mr}" y1="${sy(t).toFixed(1)}" y2="${sy(t).toFixed(1)}"/>`);
		out.push(`<text class="chart-tick" x="${ml - 6}" y="${(sy(t) + 4).toFixed(1)}" text-anchor="end">${t.toFixed(Y.decimals)}</text>`);
	}
	for (const t of X.ticks) {
		out.push(`<line class="chart-grid" x1="${sx(t).toFixed(1)}" x2="${sx(t).toFixed(1)}" y1="${mt}" y2="${mt + ph}"/>`);
		out.push(`<text class="chart-tick" x="${sx(t).toFixed(1)}" y="${mt + ph + 17}" text-anchor="middle">${t.toFixed(X.decimals)}</text>`);
	}
	out.push(`<line class="chart-axis" x1="${ml}" x2="${W - mr}" y1="${mt + ph}" y2="${mt + ph}"/>`);
	out.push(`<line class="chart-axis" x1="${ml}" x2="${ml}" y1="${mt}" y2="${mt + ph}"/>`);
	out.push(`<text class="chart-axis-title" x="${ml + pw / 2}" y="${H - 10}" text-anchor="middle">${esc(xl)}</text>`);
	out.push(`<text class="chart-axis-title" transform="translate(16 ${mt + ph / 2}) rotate(-90)" text-anchor="middle">${esc(yl)}</text>`);
	for (const d of p.points) {
		const tip = `Analysis ${d.analysis}${d.object ? ` (${d.object})` : ""}: ${xl} ${d.x}, ${yl} ${d.y}`;
		out.push(`<a href="${esc(d.href)}" class="chart-point-link"><circle class="chart-point" cx="${sx(d.x).toFixed(1)}" cy="${sy(d.y).toFixed(1)}" r="4.5"><title>${esc(tip)}</title></circle></a>`);
	}
	out.push(`</svg>`);
	return out.join("");
}

export default function (eleventyConfig) {
	eleventyConfig.addFilter("scatterSvg", (p, idBase) => scatterSvg(p, idBase));
	eleventyConfig.addFilter("isotopeLabel", (l) => supLabel(l));
	eleventyConfig.addFilter("histogramSvg", (e, h, idBase) => histogramSvg(e, h, idBase));
}
