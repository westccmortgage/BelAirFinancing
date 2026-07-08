/* Bel Air Financing — subtle interaction layer */

(function () {
  "use strict";

  /* ---------- Header: hairline appears after scroll ---------- */

  var header = document.getElementById("siteHeader");

  function updateHeader() {
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* ---------- Mobile navigation ---------- */

  var navToggle = document.getElementById("navToggle");
  var siteNav = document.getElementById("siteNav");

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
    form.addEventListener("submit", function (event) {
      if (!window.fetch || !window.URLSearchParams) {
        return; // fall back to a standard POST handled by Netlify
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
          if (!response.ok) {
            throw new Error("Submission failed");
          }
          form.reset();
          successNote.hidden = false;
          submitButton.textContent = "Request Review";
          submitButton.disabled = false;
          successNote.scrollIntoView({ behavior: "smooth", block: "nearest" });
        })
        .catch(function () {
          // If the request cannot complete, submit normally so nothing is lost.
          submitButton.textContent = "Request Review";
          submitButton.disabled = false;
          form.submit();
        });
    });

    // Fallback path: standard POST redirects back with ?submitted=true
    if (window.location.search.indexOf("submitted=true") !== -1) {
      successNote.hidden = false;
    }
  }
})();
