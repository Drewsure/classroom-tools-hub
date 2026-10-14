// Runs before the app paints; it deliberately never touches classroom storage.
export const DISPLAY_COMPATIBILITY_SCRIPT = `(function () {
  try {
    var forced = /(?:^|[?&])safe=1(?:&|$)/.test(window.location.search);
    var android = /Android/i.test(navigator.userAgent);
    var modernColor = window.CSS && window.CSS.supports &&
      window.CSS.supports('color', 'oklch(1 0 0)') &&
      window.CSS.supports('color', 'color-mix(in oklab, white, black)');
    document.documentElement.setAttribute('data-display-mode',
      forced || android || !modernColor ? 'compatible' : 'standard');
  } catch (_) {
    document.documentElement.setAttribute('data-display-mode', 'compatible');
  }
})();`;
