// Google Analytics 4: page views plus a "link_click" event for every link, video or download a visitor taps.
// ✏️ Paste your Measurement ID below (Google Analytics → Admin → Data streams → your web stream).
// While it says G-XXXXXXXXXX, nothing is loaded and nothing is tracked.
const GA_ID = "G-XXXXXXXXXX";

if (/^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== "G-XXXXXXXXXX") {
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag("js", new Date());
  gtag("config", GA_ID);

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const name = (a.dataset.track || a.querySelector("b")?.textContent || a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 100);
    const section = a.closest("section")?.querySelector("h2")?.textContent.trim() || (a.closest("header") ? "Header" : "Page");
    gtag("event", "link_click", {
      link_name: name,
      link_type: a.hasAttribute("download") ? "download" : a.classList.contains("video") ? "video" : "link",
      link_section: section.slice(0, 100),
      link_url: a.href,
      transport_type: "beacon",
    });
  });
}
