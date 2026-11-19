document.getElementById("load-comments")?.addEventListener("click", () => {
  const s = document.createElement("script");
  s.src = "https://giscus.app/client.js";
  Object.entries({
    repo: "lod-am/website", repoId: "R_kgDOTERevg",
    category: "Comments", categoryId: "DIC_kwDOTERevs4DAFDJ",
    mapping: "title", strict: "0", reactionsEnabled: "1", emitMetadata: "0",
    inputPosition: "bottom", lang: "en", loading: "lazy",
    theme: document.documentElement.dataset.bsTheme === "light" ? "gruvbox_light" : "gruvbox_dark",
  }).forEach(([k, v]) => { s.dataset[k] = v; });
  s.crossOrigin = "anonymous";
  s.async = true;
  document.getElementById("comments-consent").remove();
  document.querySelector(".comments").appendChild(s);
});