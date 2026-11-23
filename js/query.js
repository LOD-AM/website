// SPARQL query editor on /query/ (LOD-AM/planning#22): self-hosted YASGUI, fixed to the
// public LOD-AM endpoint. Privacy rules of the site: nothing is sent before the visitor runs
// a query, and nothing is stored in the browser.
// - the class and property autocompleters are off: they ask lov.linkeddata.es (third party);
//   prefixes (bundled list) and variables stay
// - populateFromUrl is off: YASGUI would run a query from the URL at once, and a link could set
//   another endpoint. Instead ?query=... only fills the editor (links from /query/examples/).
// - persistenceId null: no queries, tabs or results in localStorage
(function () {
  "use strict";
  var el = document.getElementById("yasgui");
  if (!el || !window.Yasgui) return;
  var endpoint = el.dataset.endpoint;
  var query = new URLSearchParams(window.location.search).get("query") || el.dataset.defaultQuery;

  // The prefix completer without its localStorage cache (it keeps the bundled list there)
  Yasgui.Yasqe.forkAutocompleter("prefixes", { name: "prefixesNoStorage", persistenceId: null }, false);

  new Yasgui(el, {
    requestConfig: { endpoint: endpoint, method: "POST" },
    copyEndpointOnNewTab: true,
    populateFromUrl: false,
    persistenceId: null,
    yasqe: {
      value: query,
      autocompleters: ["prefixesNoStorage", "variables"],
      prefixCcApi: null,
      persistenceId: null
    },
    yasr: { persistenceId: null },
    endpointCatalogueOptions: { getData: function () { return [{ endpoint: endpoint }]; } }
  });
})();
