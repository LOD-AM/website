// Site search on /search/ (LOD-AM/planning#17): Pagefind's default UI. A query from the
// navbar form (?q=...) is searched at once; the URL follows the search box, so results can be
// linked and the back button works.
(function () {
  "use strict";
  var el = document.getElementById("search");
  if (!el || !window.PagefindUI) return;
  var ui = new PagefindUI({
    element: "#search",
    showImages: false,
    showSubResults: true,
    resetStyles: false,
    translations: { placeholder: "Search posts and records" }
  });
  var q = new URLSearchParams(window.location.search).get("q");
  var input = el.querySelector("input");
  if (q) { ui.triggerSearch(q); if (input) input.value = q; }
  if (input) input.addEventListener("input", function () {
    var url = new URL(window.location.href);
    if (input.value) url.searchParams.set("q", input.value); else url.searchParams.delete("q");
    history.replaceState(null, "", url);
  });
})();
