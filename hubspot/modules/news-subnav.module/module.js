// DOMContentLoaded-based fallback for the Elevate theme header/footer
// removal - the primary removal is the synchronous inline <script> in
// module.html (runs before this file even loads), this just covers the case
// where that removal loses a race for any reason. Same pattern as
// ngen-trade-intel's trade-subnav.module/module.js, with the EN/FR toggle
// logic dropped (this tool has no French requirement).
function ngenRemoveThemeHeaderFooter() {
  var header = document.querySelector('.hs-elevate-header');
  if (header && header.parentElement) header.parentElement.remove();
  var footer = document.querySelector('.hs-elevate-footer');
  if (footer && footer.parentElement) footer.parentElement.remove();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ngenRemoveThemeHeaderFooter);
} else {
  ngenRemoveThemeHeaderFooter();
}
