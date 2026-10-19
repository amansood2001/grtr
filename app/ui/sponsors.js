// grtr dynamic remote sponsorship engine
(function () {
  const SPONSORS_API = "https://v2-grtr-app.vercel.app/api/sponsors.json";
  const CACHE_KEY = "grtr_sponsors_cache";
  const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

  const DEFAULT_SPONSORS = {
    global: {
      name: "grtr",
      tagline: "SPONSOR THIS SPACE",
      url: "https://grtr-app.vercel.app/#sponsor"
    },
    features: {
      "convert.webp": {
        name: "Cloudflare",
        tagline: "NEXT-GEN WEB SPEED",
        url: "https://grtr-app.vercel.app/#sponsor"
      },
      "tool.compress": {
        name: "TinyPNG",
        tagline: "SMART COMPRESSION",
        url: "https://grtr-app.vercel.app/#sponsor"
      },
      "tool.strip": {
        name: "PrivacyShield",
        tagline: "EXIF & GPS STRIPPED",
        url: "https://grtr-app.vercel.app/#sponsor"
      },
      "convert.pdf": {
        name: "Docflow",
        tagline: "VECTOR PDF ENGINE",
        url: "https://grtr-app.vercel.app/#sponsor"
      }
    }
  };

  let activeData = DEFAULT_SPONSORS;

  function loadCached() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.timestamp && Date.now() - parsed.timestamp < CACHE_TTL_MS && parsed.data) {
          activeData = Object.assign({}, DEFAULT_SPONSORS, parsed.data);
          return;
        }
      }
    } catch (_) {}
  }

  async function fetchRemote() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(SPONSORS_API, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json && (json.global || json.features)) {
          activeData = Object.assign({}, DEFAULT_SPONSORS, json);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: json }));
          } catch (_) {}
        }
      }
    } catch (_) {
      // Offline or network error: fallback gracefully
    }
  }

  function getFeatureSponsor(actionId) {
    if (!actionId || !activeData || !activeData.features) return null;
    return activeData.features[actionId] || null;
  }

  function getGlobalSponsor() {
    return (activeData && activeData.global) || DEFAULT_SPONSORS.global;
  }

  function openSponsorUrl(url) {
    const target = url || (activeData && activeData.global && activeData.global.url) || "https://grtr-app.vercel.app/#sponsor";
    if (window.__TAURI__ && window.__TAURI__.core && typeof window.__TAURI__.core.invoke === "function") {
      window.__TAURI__.core.invoke("open_url", { url: target });
    } else {
      window.open(target, "_blank");
    }
  }

  loadCached();
  fetchRemote();

  window.GrtrSponsors = {
    getFeatureSponsor,
    getGlobalSponsor,
    openSponsorUrl,
    refresh: fetchRemote
  };
})();
