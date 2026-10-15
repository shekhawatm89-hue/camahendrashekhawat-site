/* Shared tracking for the public pages: Meta Pixel + GA4 (only when the IDs below are filled),
   first-touch UTM memory, a short source tag for WhatsApp messages / enquiries, and click events.
   Pages call: window.cmsTrack(event, params) and window.cmsTag(pageCode). */
(function () {
  var META_PIXEL_ID = '1533213905281999';   // e.g. '123456789012345'
  var GA4_ID = 'G-T3V2G6FJ8B';          // e.g. 'G-XXXXXXXXXX'

  // ---- UTM: remember the first campaign a visitor came from (30 days), so the audit page knows it too
  var KEY = 'cms.utm', q = new URLSearchParams(location.search), now = Date.now(), utm = {};
  try { utm = JSON.parse(localStorage.getItem(KEY) || '{}'); if (!utm.t || now - utm.t > 30 * 864e5) utm = {}; } catch (e) { utm = {}; }
  var fresh = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) { if (q.get(k)) fresh[k.slice(4)] = q.get(k).slice(0, 40); });
  if (Object.keys(fresh).length && !utm.source) { utm = fresh; utm.t = now; try { localStorage.setItem(KEY, JSON.stringify(utm)); } catch (e) {} }
  var v = (location.search.match(/[?&]v=(\d)/) || [])[1];
  if (v) try { sessionStorage.setItem('cms.v', v); } catch (e) {}
  if (!v) try { v = sessionStorage.getItem('cms.v') || ''; } catch (e) { v = ''; }

  window.cmsUtm = utm;
  window.cmsVariant = v || '1';
  // "[CI-v2-instagram]" : page code, video variant, campaign source (if any)
  window.cmsTag = function (page) {
    var s = (utm.source || '').replace(/[^\w-]/g, '').slice(0, 20);
    return '[' + page + '-v' + (v || '1') + (s ? '-' + s : '') + ']';
  };
  window.cmsUtmString = function () {
    return ['source', 'medium', 'campaign', 'content'].filter(function (k) { return utm[k]; }).map(function (k) { return k + '=' + utm[k]; }).join('&');
  };

  // ---- Meta Pixel
  if (META_PIXEL_ID) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', META_PIXEL_ID); window.fbq('track', 'PageView');
  }
  // ---- GA4
  if (GA4_ID) {
    var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID; document.head.appendChild(g);
    window.dataLayer = window.dataLayer || []; window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date()); window.gtag('config', GA4_ID);
  }

  // ---- Events: whatsapp_click, join_click, generate_lead, video_play (+ Meta standard events where they fit)
  var META = { begin_checkout: ['track', 'InitiateCheckout'], whatsapp_click: ['track', 'Contact'], generate_lead: ['track', 'Lead'], join_click: ['trackCustom', 'JoinClick'], video_play: ['trackCustom', 'VideoPlay'], audit_complete: ['track', 'CompleteRegistration'] };
  window.cmsTrack = function (name, params) {
    params = params || {}; params.variant = 'v' + (v || '1'); if (utm.source) params.utm_source = utm.source;
    try { if (window.gtag) window.gtag('event', name, params); } catch (e) {}
    try { if (window.fbq && META[name]) window.fbq(META[name][0], META[name][1], params); } catch (e) {}
  };
  // Any wa.me link click counts as a WhatsApp click
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href*="wa.me/"]');
    if (a) window.cmsTrack('whatsapp_click', { page: location.pathname });
  }, true);
})();
