// Runs before the app paints; it deliberately never touches classroom storage.
export const DISPLAY_COMPATIBILITY_SCRIPT = `(function () {
  try {
    var rescue = /(?:^|[?&])safe=2(?:&|$)/.test(window.location.search);
    var forced = rescue || /(?:^|[?&])safe=1(?:&|$)/.test(window.location.search);
    var android = /Android/i.test(navigator.userAgent);
    var modernColor = window.CSS && window.CSS.supports &&
      window.CSS.supports('color', 'oklch(1 0 0)') &&
      window.CSS.supports('color', 'color-mix(in oklab, white, black)');
    document.documentElement.setAttribute('data-display-mode',
      forced || android || !modernColor ? 'compatible' : 'standard');
    if (rescue) document.documentElement.setAttribute('data-plain-launch', 'true');
  } catch (_) {
    document.documentElement.setAttribute('data-display-mode', 'compatible');
  }
})();`;
