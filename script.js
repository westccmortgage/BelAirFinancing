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
  var rootEl = document.documentElement;
  var desktopMq = window.matchMedia ? window.matchMedia("(min-width: 941px)") : null;

  function setNav(open) {
    siteNav.classList.toggle("is-open", open);
    navToggle.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    rootEl.classList.toggle("nav-open", open); // scroll lock lives on <html> only
  }

  function navIsOpen() { return siteNav.classList.contains("is-open"); }

  if (navToggle && siteNav) {
    navToggle.addEventListener("click", function () { setNav(!navIsOpen()); });

    siteNav.addEventListener("click", function (event) {
      if (event.target.closest && event.target.closest("a")) setNav(false);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navIsOpen()) {
        setNav(false);
        navToggle.focus();
      }
    });

    // Tap / click outside the menu and its toggle closes it.
    document.addEventListener("click", function (event) {
      if (!navIsOpen()) return;
      if (siteNav.contains(event.target) || navToggle.contains(event.target)) return;
      setNav(false);
    });

    var onDesktop = function () { if (desktopMq && desktopMq.matches && navIsOpen()) setNav(false); };
    if (desktopMq) {
      if (desktopMq.addEventListener) desktopMq.addEventListener("change", onDesktop);
      else if (desktopMq.addListener) desktopMq.addListener(onDesktop);
    }
    window.addEventListener("resize", onDesktop);
    window.addEventListener("pageshow", function () { if (navIsOpen()) setNav(false); });
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
      { threshold: 0, rootMargin: "0px 0px -5% 0px" }
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
  var errorNote = document.getElementById("formError");
  var SEND_TIMEOUT_MS = 30000;

  if (form && successNote) {
    syncAttributionFields(form);

    var sending = false;
    var currentLeadId = ""; // reused if the visitor presses Send again after a failure

    // The error box holds a lead-in text node and the phone link; only the text changes.
    function showError(lead, tail) {
      if (!errorNote) return;
      var phoneLink = errorNote.querySelector("a");
      errorNote.textContent = lead + " ";
      if (phoneLink) errorNote.appendChild(phoneLink);
      errorNote.appendChild(document.createTextNode(tail));
      errorNote.hidden = false;
      errorNote.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    form.addEventListener("submit", function (event) {
      if (sending) { event.preventDefault(); return; }
      syncAttributionFields(form);

      if (!window.fetch || !window.URLSearchParams) {
        // No fetch: let the browser do one standard POST. The conversion fires
        // only after ?submitted=true returns.
        pendingLead(uid());
        return;
      }

      event.preventDefault();
      if (!currentLeadId) currentLeadId = uid();
      var leadId = currentLeadId;

      var submitButton = form.querySelector('button[type="submit"]');
      var formData = new FormData(form);
      var timedOut = false;
      var controller = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () {
        timedOut = true;
        if (controller) controller.abort();
      }, SEND_TIMEOUT_MS);

      sending = true;
      if (errorNote) errorNote.hidden = true;
      successNote.hidden = true;
      submitButton.disabled = true;
      submitButton.textContent = "Sending\u2026";

      function finish() {
        clearTimeout(timer);
        sending = false;
        submitButton.textContent = "Request Review";
        submitButton.disabled = false;
      }

      var request = {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData).toString()
      };
      if (controller) request.signal = controller.signal;

      fetch("/", request)
        .then(function (response) {
          if (!response.ok) throw new Error("Submission failed");
          finish();
          currentLeadId = "";
          fireLeadConversion(leadId);
          window.dataLayer.push({ event: "baf_lead_submit", lead_event_id: leadId, page_location: window.location.href });
          form.reset();
          syncAttributionFields(form);
          successNote.hidden = false;
          successNote.scrollIntoView({ behavior: "smooth", block: "nearest" });
        })
        .catch(function () {
          // Never resubmit automatically: one press of Send is one POST.
          finish();
          if (timedOut) {
            showError("This is taking longer than expected, and your request may already have arrived. Please call", " to check before sending again.");
          } else {
            showError("We could not send your request. Please press Request Review again, or call", ".");
          }
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
  /* ---------- Anchors: land exactly on the target, no smooth scroll on load ---------- */

  (function anchorOnLoad() {
    var hash = window.location.hash;
    if (!hash || hash.length < 2) return;
    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (_) { id = hash.slice(1); }
    var target = document.getElementById(id);
    if (!target) return;

    var userMoved = false;
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (name) {
      window.addEventListener(name, function () { userMoved = true; }, { passive: true, once: true });
    });

    // Reveal the target and anything inside it so it never waits on the observer.
    function revealTarget() {
      if (target.classList.contains("reveal")) target.classList.add("is-visible");
      Array.prototype.forEach.call(target.querySelectorAll(".reveal"), function (el) {
        el.classList.add("is-visible");
      });
    }

    function jump() {
      if (userMoved) return;
      revealTarget();
      rootEl.style.scrollBehavior = "auto";
      target.scrollIntoView({ block: "start", behavior: "auto" });
      window.requestAnimationFrame(function () { rootEl.style.scrollBehavior = ""; });
    }

    jump();
    window.addEventListener("load", jump);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(jump);
    setTimeout(jump, 400);
  })();
})();
