// Formats each card's published date client-side (epoch ms -> "Jul 16, 2026"),
// matching the original Next.js build's formatDate() output exactly. Done in
// JS rather than a HubL filter since there's no proven HubL date-formatting
// pattern anywhere in the reference project to copy - see the comment in
// module.html.
function ngenFormatFeedDates() {
  document.querySelectorAll('.ngen-nfeed-date').forEach(function (el) {
    var ts = parseInt(el.getAttribute('data-ts'), 10);
    if (!ts) return;
    el.textContent = new Date(ts).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ngenFormatFeedDates);
} else {
  ngenFormatFeedDates();
}
