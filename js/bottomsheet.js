window.RA = window.RA || {};

window.RA.sheet = (function () {
  var sheet = document.createElement("div");
  sheet.className = "bottom-sheet";
  sheet.innerHTML = [
    '<div class="bottom-sheet__header">',
    '  <div class="bottom-sheet__handle"></div>',
    '  <h3 class="bottom-sheet__title">The HPA Florette Tool</h3>',
    "</div>",
    '<div class="bottom-sheet__tabs">',
    '  <button class="bottom-sheet__tab active" data-tab="controls">Controls</button>',
    '  <button class="bottom-sheet__tab" data-tab="states">Animation</button>',
    "</div>",
    '<div class="bottom-sheet__body">',
    '  <div class="bottom-sheet__section active" id="sheet-controls"></div>',
    '  <div class="bottom-sheet__section" id="sheet-states"></div>',
    "</div>",
  ].join("\n");
  document.body.appendChild(sheet);

  var header = sheet.querySelector(".bottom-sheet__header");
  var body = sheet.querySelector(".bottom-sheet__body");
  var tabs = sheet.querySelectorAll(".bottom-sheet__tab");
  var sections = sheet.querySelectorAll(".bottom-sheet__section");

  /** Align with CSS desktop breakpoint (see style.css @media min-width: 1024px). */
  var desktopMq = window.matchMedia("(min-width: 1024px)");

  function isDesktop() {
    return desktopMq.matches;
  }

  /** Visible strip when collapsed (handle + title peek). */
  var PEEK = 56;

  // ── Snap positions (sheet height ≤ 50vh; translateY 0 = fully open, larger = collapsed) ──

  var snapOpen = 0;
  var snapCollapsed;

  function computeSnaps() {
    if (isDesktop()) {
      snapCollapsed = 0;
      return;
    }
    var h = window.innerHeight;
    var sh = sheet.offsetHeight;
    if (!sh || sh < 80) sh = Math.round(h * 0.5);
    snapCollapsed = Math.max(0, sh - PEEK);
  }

  /** Visible region for the florette: above bottom sheet (mobile) or right of sidebar (desktop). */
  function getVisibleMetrics() {
    var H = window.innerHeight;
    var W = window.innerWidth;

    if (isDesktop()) {
      var pw = sheet.offsetWidth;
      if (!pw || pw < 40) pw = Math.min(400, W * 0.32);
      var vw = Math.max(0, W - pw);
      return {
        centerX: pw + vw / 2,
        centerY: H / 2,
        visibleHeight: H,
        visibleWidth: vw,
      };
    }

    var sh = sheet.offsetHeight;
    if (!sh) sh = Math.round(H * 0.5);
    var topY = H - sh + currentY;
    if (topY < 0) topY = 0;
    if (topY > H) topY = H;
    return {
      centerX: W / 2,
      centerY: topY / 2,
      visibleHeight: topY,
      visibleWidth: W,
    };
  }

  function notifyLayout() {
    window.dispatchEvent(new CustomEvent("sheetLayout"));
  }

  /** Fully expanded = sheet at snapOpen (translateY 0). Desktop: no slide; title stays visible. */
  function syncExpandedState() {
    if (isDesktop()) {
      sheet.classList.remove("bottom-sheet--expanded");
      return;
    }
    var expanded = currentY <= 1;
    sheet.classList.toggle("bottom-sheet--expanded", expanded);
  }

  function applyLayout() {
    computeSnaps();
    if (isDesktop()) {
      currentY = 0;
      sheet.style.transform = "none";
    } else {
      if (currentY > snapCollapsed) currentY = snapCollapsed;
      sheet.style.transform = "translateY(" + currentY + "px)";
    }
    syncExpandedState();
    notifyLayout();
  }

  computeSnaps();
  var currentY = snapCollapsed;
  if (isDesktop()) {
    currentY = 0;
    sheet.style.transform = "none";
  } else {
    sheet.style.transform = "translateY(" + currentY + "px)";
  }
  syncExpandedState();

  if (desktopMq.addEventListener) {
    desktopMq.addEventListener("change", applyLayout);
  } else if (desktopMq.addListener) {
    desktopMq.addListener(applyLayout);
  }

  window.addEventListener("resize", applyLayout);

  // ── Drag mechanics ──

  var startPointerY = 0;
  var startSheetY = 0;
  var velocity = 0;
  var lastTime = 0;
  var lastPointerY = 0;
  var dragging = false;

  function snapTo(target) {
    if (isDesktop()) {
      currentY = 0;
      sheet.classList.add("snapping");
      sheet.style.transform = "none";
      syncExpandedState();
      notifyLayout();
      return;
    }
    currentY = Math.max(snapOpen, Math.min(snapCollapsed, target));
    sheet.classList.add("snapping");
    sheet.style.transform = "translateY(" + currentY + "px)";
    syncExpandedState();
    notifyLayout();
  }

  function findSnapTarget(y, vel) {
    if (Math.abs(vel) > 0.5) {
      return vel > 0 ? snapCollapsed : snapOpen;
    }
    var mid = snapCollapsed / 2;
    return y < mid ? snapOpen : snapCollapsed;
  }

  header.addEventListener("pointerdown", function (e) {
    if (isDesktop()) return;
    if (e.button !== 0) return;
    header.setPointerCapture(e.pointerId);
    sheet.classList.remove("snapping");
    startPointerY = e.clientY;
    startSheetY = currentY;
    lastTime = e.timeStamp;
    lastPointerY = e.clientY;
    dragging = true;
  });

  header.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var delta = e.clientY - startPointerY;
    currentY = Math.max(snapOpen, Math.min(snapCollapsed, startSheetY + delta));
    sheet.style.transform = "translateY(" + currentY + "px)";
    velocity = (e.clientY - lastPointerY) / (e.timeStamp - lastTime || 1);
    lastTime = e.timeStamp;
    lastPointerY = e.clientY;
    syncExpandedState();
    notifyLayout();
  });

  header.addEventListener("pointerup", function () {
    if (!dragging) return;
    dragging = false;
    snapTo(findSnapTarget(currentY, velocity));
  });

  header.addEventListener("pointercancel", function () {
    if (!dragging) return;
    dragging = false;
    snapTo(findSnapTarget(currentY, velocity));
  });

  sheet.addEventListener("transitionend", function () {
    sheet.classList.remove("snapping");
  });

  // ── Pull-down from open when scrolled to top ──

  var bodyDragging = false;
  var bodyStartY = 0;

  body.addEventListener("pointerdown", function (e) {
    if (isDesktop()) return;
    if (currentY !== snapOpen) return;
    if (body.scrollTop > 0) return;
    bodyStartY = e.clientY;
    bodyDragging = true;
  });

  body.addEventListener("pointermove", function (e) {
    if (isDesktop()) return;
    if (!bodyDragging) return;
    var delta = e.clientY - bodyStartY;
    if (delta > 10 && body.scrollTop === 0) {
      bodyDragging = false;
      startPointerY = e.clientY;
      startSheetY = currentY;
      lastTime = e.timeStamp;
      lastPointerY = e.clientY;
      dragging = true;
      sheet.classList.remove("snapping");
      header.setPointerCapture(e.pointerId);
    }
  });

  body.addEventListener("pointerup", function () {
    bodyDragging = false;
  });

  // ── Tabs ──

  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) {
        t.classList.remove("active");
      });
      sections.forEach(function (s) {
        s.classList.remove("active");
      });
      tab.classList.add("active");
      document.getElementById("sheet-" + tab.dataset.tab).classList.add("active");
      body.scrollTop = 0;
    });
  });

  // ── Public API ──

  return {
    getControlsMount: function () {
      return document.getElementById("sheet-controls");
    },
    getStatesMount: function () {
      return document.getElementById("sheet-states");
    },
    getVisibleMetrics: getVisibleMetrics,
    collapse: function () {
      snapTo(snapCollapsed);
    },
    expandHalf: function () {
      snapTo(snapOpen);
    },
    expandFull: function () {
      snapTo(snapOpen);
    },
  };
})();
