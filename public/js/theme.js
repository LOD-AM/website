// Light/dark toggle (planning#20). The page starts in the mode set by the inline script in
// the <head> (stored choice, else the browser's prefers-color-scheme, else dark). The choice
// is stored only in this browser (localStorage "lodam-theme"); nothing is sent anywhere.
(() => {
	const root = document.documentElement;
	const button = document.getElementById("theme-toggle");
	if (!button) return;
	const stored = () => { try { return localStorage.getItem("lodam-theme"); } catch { return null; } };
	const label = () => {
		const next = root.dataset.bsTheme === "light" ? "dark" : "light";
		button.setAttribute("aria-label", `Switch to ${next} mode`);
		button.title = `Switch to ${next} mode`;
	};
	const set = (mode, remember) => {
		root.dataset.bsTheme = mode;
		if (remember) { try { localStorage.setItem("lodam-theme", mode); } catch { /* private mode: not remembered */ } }
		label();
	};
	button.addEventListener("click", () => set(root.dataset.bsTheme === "light" ? "dark" : "light", true));
	// Follow the system setting while the visitor hasn't chosen a mode here
	matchMedia("(prefers-color-scheme: light)").addEventListener("change", (e) => {
		if (!stored()) set(e.matches ? "light" : "dark", false);
	});
	label();
	button.hidden = false;
})();
