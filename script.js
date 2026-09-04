/* Bel Air Financing — subtle interaction layer */

(function () {
  "use strict";

  var ADS_ID = "AW-18417657219";
  var LEAD_DESTINATION = "AW-18417657219/LiA7CPWd4eocEIPLnM5E";
  var ATTR_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid"];
  var ATTR_PREFIX = "baf_attr_";
  var PENDING_KEY = "baf_pending_lead";

  function safeGet(key) { try { return localStorage.getItem(key) || ""; } catch (_) { return ""; } }
  function safeSet(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  function sessionGet(key) { try { return sessionStorage.getItem(key) || ""; } catch (_) { return ""; } }
  function sessionSet(key, value) { try { sessionStorage.setItem(key, value); } catch (_) {} }
  function sessionRemove(key) { try { sessionStorage.removeItem(key); } catch (_) {} }
  function uid() { return "baf_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10); }

  /* ---------- Google Ads base tag ---------- */
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", ADS_ID);
  if (!document.querySelector("script[data-baf-google-ads]")) {
    var ads = document.createElement("script");
    ads.async = true;
    ads.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ADS_ID);
    ads.setAttribute("data-baf-google-ads", "");
    document.head.appendChild(ads);
  }

  function fireLeadConversion(id) {
    if (!id) return;
    window.gtag("event", "conversion", {
      send_to: LEAD_DESTINATION,
      value: 1.0,
      currency: "USD",
      transaction_id: id
    });
  }

  /* ---------- First-party campaign attribution ---------- */
  (function captureAttribution() {
    if (!window.URLSearchParams) return;
    var qs = new URLSearchParams(window.location.search);
    ATTR_KEYS.forEach(function (key) {
      var value = qs.get(key);
      if (value) safeSet(ATTR_PREFIX + key, value);
    });
    if (!safeGet(ATTR_PREFIX + "landing_page")) safeSet(ATTR_PREFIX + "landing_page", window.location.href);
  })();

  function syncAttributionFields(form) {
    if (!form) return;
    var values = {};
    ATTR_KEYS.forEach(function (key) { values[key] = safeGet(ATTR_PREFIX + key); });
    values.landing_page = safeGet(ATTR_PREFIX + "landing_page") || window.location.href;
    values.submission_page = window.location.href;
    Object.keys(values).forEach(function (key) {
      var input = form.querySelector('input[name="' + key + '"]');
      if (!input) {
        input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        form.appendChild(input);
      }
      input.value = values[key] || "";
    });
  }

  function pendingLead(id) {
    sessionSet(PENDING_KEY, JSON.stringify({ id: id, ts: Date.now() }));
  }

  function consumeFallbackLead() {
    if (window.location.search.indexOf("submitted=true") === -1) return null;
    var raw = sessionGet(PENDING_KEY);
    if (!raw) return null;
    var item;
    try { item = JSON.parse(raw); } catch (_) { sessionRemove(PENDING_KEY); return null; }
    if (!item || !item.id || !item.ts || Date.now() - item.ts > 30 * 60 * 1000) {
      sessionRemove(PENDING_KEY);
      return null;
    }
    sessionRemove(PENDING_KEY);
    return item.id;
  }

  /* ---------- Header: hairline appears after scroll ---------- */

  var header = document.getElementById("siteHeader");

  function updateHeader() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* ---------- Mobile navigation ---------- */

  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () {
      var open = siteNav.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", open);
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    siteNav.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        siteNav.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Gentle reveal on scroll ---------- */

  var revealEls = document.querySelectorAll(".reveal");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!reduceMotion && "IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5% 0px" }
    );

    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  }

  /* ---------- Netlify form: quiet inline confirmation ---------- */

  var form = document.getElementById("reviewForm");
  var successNote = document.getElementById("formSuccess");

  if (form && successNote) {
    syncAttributionFields(form);

    form.addEventListener("submit", function (event) {
      syncAttributionFields(form);
      var leadId = uid();
      pendingLead(leadId);

      if (!window.fetch || !window.URLSearchParams) {
        return; // standard POST; conversion fires only after ?submitted=true returns
      }

      event.preventDefault();

      var submitButton = form.querySelector('button[type="submit"]');
      var formData = new FormData(form);

      submitButton.disabled = true;
      submitButton.textContent = "Sending…";

      fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
      })
        .then(function (response) {
          if (!response.ok) throw new Error("Submission failed");
          sessionRemove(PENDING_KEY);
          fireLeadConversion(leadId);
          window.dataLayer.push({ event: "baf_lead_submit", lead_event_id: leadId, page_location: window.location.href });
          form.reset();
          successNote.hidden = false;
          submitButton.textContent = "Request Review";
          submitButton.disabled = false;
          successNote.scrollIntoView({ behavior: "smooth", block: "nearest" });
        })
        .catch(function () {
          // If the AJAX request cannot complete, keep the same pending lead ID
          // and submit normally. The returning ?submitted=true page consumes it.
          submitButton.textContent = "Request Review";
          submitButton.disabled = false;
          syncAttributionFields(form);
          form.submit();
        });
    });

    var fallbackLeadId = consumeFallbackLead();
    if (window.location.search.indexOf("submitted=true") !== -1) {
      successNote.hidden = false;
      if (fallbackLeadId) {
        fireLeadConversion(fallbackLeadId);
        window.dataLayer.push({ event: "baf_lead_submit", lead_event_id: fallbackLeadId, page_location: window.location.href });
      }
    }
  }

  /* ---------- CTA presets: set a form field before scrolling to it ---------- */

  function setSelect(id, value) {
    var el = document.getElementById(id);
    if (!el) return;
    for (var i = 0; i < el.options.length; i++) {
      if (el.options[i].value === value || el.options[i].text === value) {
        el.selectedIndex = i;
        return;
      }
    }
  }

  var presetLinks = document.querySelectorAll(
    "a[data-preset-amount], a[data-preset-structure]"
  );

  Array.prototype.forEach.call(presetLinks, function (link) {
    link.addEventListener("click", function () {
      var amount = link.getAttribute("data-preset-amount");
      var structure = link.getAttribute("data-preset-structure");
      if (amount) setSelect("f-loan-amount", amount);
      if (structure) setSelect("f-structure", structure);
    });
  });

  if (window.URLSearchParams) {
    var qs = new URLSearchParams(window.location.search);
    if (qs.get("amount")) setSelect("f-loan-amount", qs.get("amount"));
    if (qs.get("structure")) setSelect("f-structure", qs.get("structure"));
  }
})();
