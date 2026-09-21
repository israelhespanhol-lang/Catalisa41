/*
 * Central de rastreamento da landing page Catalisa41.
 * Preencha os identificadores desejados abaixo para ativar automaticamente:
 */
window.CATALISA_TRACKING = {
  googleTagManagerId: "", // Ex.: GTM-XXXXXXX
  googleAnalyticsId: "",  // Ex.: G-XXXXXXXXXX (Cole seu ID do Google Analytics 4 aqui)
  metaPixelId: "",        // Ex.: 123456789012345
};

// Inicializador automatico de tags de rastreamento
(function () {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  var cfg = window.CATALISA_TRACKING || {};

  // 1. Google Analytics 4 (GA4)
  if (cfg.googleAnalyticsId && cfg.googleAnalyticsId.trim() !== "") {
    var gaId = cfg.googleAnalyticsId.trim();
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + gaId;
    document.head.appendChild(script);

    window.gtag("js", new Date());
    window.gtag("config", gaId, {
      send_page_view: true
    });
  }

  // 2. Google Tag Manager (GTM)
  if (cfg.googleTagManagerId && cfg.googleTagManagerId.trim() !== "") {
    var gtmId = cfg.googleTagManagerId.trim();
    (function(w, d, s, l, i) {
      w[l] = w[l] || [];
      w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
      var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l !== "dataLayer" ? "&l=" + l : "";
      j.async = true;
      j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
      f.parentNode.insertBefore(j, f);
    })(window, document, "script", "dataLayer", gtmId);
  }

  // 3. Meta Pixel
  if (cfg.metaPixelId && cfg.metaPixelId.trim() !== "") {
    var pixelId = cfg.metaPixelId.trim();
    (function(f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function() {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
  }
})();
