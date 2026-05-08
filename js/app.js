window.RA = window.RA || {};

(function () {
  var nav = document.createElement("div");
  nav.className = "tool-nav";
  nav.innerHTML = [
    '<div class="select-wrapper tool-nav__select-wrap">',
    '  <select class="tool-nav__select" id="toolSelect">',
    '    <option value="florette" selected>Florette</option>',
    '    <option value="email-sig">Email Signature</option>',
    '    <option value="wallpaper">Wallpaper</option>',
    '    <option value="business-card">Business Card</option>',
    '  </select>',
    '</div>',
  ].join("\n");
  document.body.appendChild(nav);

  var toolSelect = document.getElementById("toolSelect");
  var canvas = document.getElementById("myCanvas");
  var florTabs = document.querySelector(".bottom-sheet__tabs");
  var florControls = document.getElementById("sheet-controls");
  var florStates = document.getElementById("sheet-states");
  var emailSig = document.getElementById("sheet-email-sig");
  var sigPreview = document.querySelector(".sig-preview");
  var wallpaperPreview = document.querySelector(".wallpaper-preview");
  var wallpaperPanel = document.getElementById("sheet-wallpaper");
  var businessCardPanel = document.getElementById("sheet-business-card");
  var subtitle = document.querySelector(".bottom-sheet__subtitle");
  var bgColorGroup = florControls.querySelector(".color-swatches").closest(".control-group");
  var desktopMq = window.matchMedia("(min-width: 1024px)");

  var toolNames = {
    florette: "The Florette Tool",
    "email-sig": "Email Signature",
    wallpaper: "Wallpaper",
    "business-card": "Business Card",
  };

  var savedBgColor = document.body.style.backgroundColor || "";
  var currentTool = "florette";
  var desktopOnlyTools = {
    "email-sig": true,
    wallpaper: true,
    "business-card": true,
  };
  var desktopOnlyModal = createDesktopOnlyModal();

  function isDesktop() {
    return desktopMq.matches;
  }

  function isDesktopOnlyTool(toolId) {
    return !!desktopOnlyTools[toolId];
  }

  function createDesktopOnlyModal() {
    var modal = document.createElement("div");
    modal.className = "desktop-gate-modal";
    modal.innerHTML = [
      '<div class="desktop-gate-modal__backdrop" data-close></div>',
      '<div class="desktop-gate-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="desktopGateTitle">',
      '  <h2 class="desktop-gate-modal__title" id="desktopGateTitle">Desktop Screen Required</h2>',
      '  <p class="desktop-gate-modal__body">',
      "    This tool is available on desktop screens only (1024px and up). Please open this page on a larger screen.",
      "  </p>",
      '  <button type="button" class="desktop-gate-modal__action">Continue with Florette</button>',
      "</div>",
    ].join("\n");
    document.body.appendChild(modal);

    var closeBtn = modal.querySelector(".desktop-gate-modal__action");
    closeBtn.addEventListener("click", hideDesktopOnlyModal);
    modal.addEventListener("click", function (e) {
      if (e.target && e.target.hasAttribute("data-close")) {
        hideDesktopOnlyModal();
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("active")) {
        hideDesktopOnlyModal();
      }
    });

    return modal;
  }

  function showDesktopOnlyModal(toolId) {
    var body = desktopOnlyModal.querySelector(".desktop-gate-modal__body");
    var toolLabel = toolNames[toolId] || "This tool";
    body.textContent = toolLabel + " is available on desktop screens only (1024px and up). Please open this page on a larger screen.";
    desktopOnlyModal.classList.add("active");
  }

  function hideDesktopOnlyModal() {
    desktopOnlyModal.classList.remove("active");
  }

  function syncToolAvailabilityInSelect() {
    var desktop = isDesktop();
    Array.prototype.forEach.call(toolSelect.options, function (option) {
      var value = option.value;
      if (!isDesktopOnlyTool(value)) return;
      option.disabled = !desktop;
    });
  }

  function switchTool(toolId, options) {
    options = options || {};
    if (isDesktopOnlyTool(toolId) && !isDesktop()) {
      if (!options.suppressDesktopModal) {
        showDesktopOnlyModal(toolId);
      }
      toolId = "florette";
    }

    var previousTool = currentTool;
    toolSelect.value = toolId;

    var isFlorette = toolId === "florette";
    var isEmailSig = toolId === "email-sig";
    var isWallpaper = toolId === "wallpaper";
    var isBusinessCard = toolId === "business-card";

    // Show/hide canvas
    canvas.style.display = isFlorette ? "" : "none";

    // Florette controls/tabs/states: visible on florette and email sig
    var showFloretteUI = isFlorette || isEmailSig;
    florTabs.style.display = showFloretteUI ? "" : "none";
    florControls.style.display = showFloretteUI ? "" : "none";
    florStates.style.display = showFloretteUI ? "" : "none";

    // Wallpaper panel: visible only on wallpaper tab
    wallpaperPanel.style.display = isWallpaper ? "" : "none";
    wallpaperPanel.classList.toggle("active", isWallpaper);

    // Business card panel: visible only on business card tab
    businessCardPanel.style.display = isBusinessCard ? "" : "none";
    businessCardPanel.classList.toggle("active", isBusinessCard);

    // Hide background color on non-florette tools
    bgColorGroup.style.display = isFlorette ? "" : "none";

    // Show/hide email signature fields inside controls
    var sigFields = document.getElementById("sigFields");
    if (sigFields) sigFields.style.display = isEmailSig ? "" : "none";

    // Show/hide email signature preview (keep email-sig section hidden, fields are in controls)
    emailSig.style.display = "none";
    emailSig.classList.remove("active");
    sigPreview.classList.toggle("active", isEmailSig);

    // Show/hide wallpaper
    if (wallpaperPreview) {
      wallpaperPreview.classList.toggle("active", isWallpaper);
    }

    // Show/hide business card preview
    var bcPreview = document.querySelector(".business-card-preview");
    if (bcPreview) {
      bcPreview.classList.toggle("active", isBusinessCard);
    }

    if (isEmailSig) {
      window.dispatchEvent(new CustomEvent("sigVisible"));
    } else {
      window.dispatchEvent(new CustomEvent("sigHidden"));
    }

    if (isFlorette) {
      window.dispatchEvent(new CustomEvent("floretteVisible"));
    }

    // Background color per tool
    if (isFlorette) {
      document.body.style.backgroundColor = savedBgColor;
      nav.classList.toggle("tool-nav--light", isLightOrTransparent(savedBgColor));
    } else {
      // Only snapshot florette color when we are actually leaving florette.
      if (previousTool === "florette") {
        savedBgColor = document.body.style.backgroundColor || savedBgColor;
      }
      document.body.style.backgroundColor = "#ffffff";
      nav.classList.add("tool-nav--light");
    }

    // Update subtitle
    if (subtitle) {
      subtitle.textContent = toolNames[toolId] || toolId;
    }

    currentTool = toolId;
  }

  toolSelect.addEventListener("change", function () {
    switchTool(toolSelect.value);
  });

  var isPrinting = false;

  window.addEventListener("beforeprint", function () {
    isPrinting = true;
  });

  window.addEventListener("afterprint", function () {
    isPrinting = true;
    setTimeout(function () {
      isPrinting = false;
      syncToolAvailabilityInSelect();
    }, 500);
  });

  function handleViewportChange() {
    if (isPrinting) return;
    var previousTool = currentTool;
    syncToolAvailabilityInSelect();
    if (!isDesktop() && isDesktopOnlyTool(previousTool)) {
      switchTool("florette", { suppressDesktopModal: true });
      showDesktopOnlyModal(previousTool);
    }
  }

  if (desktopMq.addEventListener) {
    desktopMq.addEventListener("change", handleViewportChange);
  } else if (desktopMq.addListener) {
    desktopMq.addListener(handleViewportChange);
  }
  syncToolAvailabilityInSelect();

  // Default: hide email sig section
  emailSig.style.display = "none";

  // Toggle nav to light style when florette bg is light or transparent
  function isLightOrTransparent(color) {
    if (!color) return false;
    var v = color.trim().toLowerCase();
    if (v === "transparent" || v === "rgba(0, 0, 0, 0)") return true;
    var r, g, b;
    // Parse hex
    var hex = v.replace("#", "");
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else {
      // Parse rgb(r, g, b) or rgba(r, g, b, a)
      var match = v.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (match) {
        r = parseInt(match[1], 10);
        g = parseInt(match[2], 10);
        b = parseInt(match[3], 10);
      } else {
        return false;
      }
    }
    return (r * 299 + g * 587 + b * 114) / 1000 > 160;
  }

  function syncNavTheme() {
    if (currentTool !== "florette") return;
    var bg = document.body.style.backgroundColor || "";
    nav.classList.toggle("tool-nav--light", isLightOrTransparent(bg));
  }

  // Listen for florette swatch clicks
  document.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest(".combo-swatch[data-color]")) {
      setTimeout(syncNavTheme, 0);
    }
  });
})();
