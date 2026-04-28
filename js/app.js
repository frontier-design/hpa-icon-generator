window.RA = window.RA || {};

(function () {
  var nav = document.createElement("div");
  nav.className = "tool-nav";
  nav.innerHTML = [
    '<button class="tool-nav__btn active" data-tool="florette">Florette</button>',
    '<button class="tool-nav__btn" data-tool="email-sig">Email Signature</button>',
    '<button class="tool-nav__btn" data-tool="wallpaper">Wallpaper</button>',
  ].join("\n");
  document.body.appendChild(nav);

  var buttons = nav.querySelectorAll(".tool-nav__btn");
  var canvas = document.getElementById("myCanvas");
  var florTabs = document.querySelector(".bottom-sheet__tabs");
  var florControls = document.getElementById("sheet-controls");
  var florStates = document.getElementById("sheet-states");
  var emailSig = document.getElementById("sheet-email-sig");
  var sigPreview = document.querySelector(".sig-preview");
  var wallpaperPreview = document.querySelector(".wallpaper-preview");
  var wallpaperPanel = document.getElementById("sheet-wallpaper");
  var subtitle = document.querySelector(".bottom-sheet__subtitle");
  var bgColorGroup = florControls.querySelector(".color-swatches").closest(".control-group");

  var toolNames = {
    florette: "The Florette Tool",
    "email-sig": "Email Signature",
    wallpaper: "Wallpaper",
  };

  var savedBgColor = document.body.style.backgroundColor || "";

  function switchTool(toolId) {
    buttons.forEach(function (btn) {
      btn.classList.toggle("active", btn.dataset.tool === toolId);
    });

    var isFlorette = toolId === "florette";
    var isEmailSig = toolId === "email-sig";
    var isWallpaper = toolId === "wallpaper";

    // Show/hide canvas
    canvas.style.display = isFlorette ? "" : "none";

    // Florette controls/tabs/states: visible on florette and email sig, hidden on wallpaper
    var showFloretteUI = isFlorette || isEmailSig;
    florTabs.style.display = showFloretteUI ? "" : "none";
    florControls.style.display = showFloretteUI ? "" : "none";
    florStates.style.display = showFloretteUI ? "" : "none";

    // Wallpaper panel: visible only on wallpaper tab
    wallpaperPanel.style.display = isWallpaper ? "" : "none";
    wallpaperPanel.classList.toggle("active", isWallpaper);

    // Hide background color on non-florette tools
    bgColorGroup.style.display = isFlorette ? "" : "none";

    // Show/hide email signature
    emailSig.classList.toggle("active", isEmailSig);
    sigPreview.classList.toggle("active", isEmailSig);

    // Show/hide wallpaper
    if (wallpaperPreview) {
      wallpaperPreview.classList.toggle("active", isWallpaper);
    }

    if (isEmailSig) {
      window.dispatchEvent(new CustomEvent("sigVisible"));
    } else {
      window.dispatchEvent(new CustomEvent("sigHidden"));
    }

    // Background color per tool
    if (isFlorette) {
      document.body.style.backgroundColor = savedBgColor;
      nav.classList.remove("tool-nav--light");
    } else {
      savedBgColor = document.body.style.backgroundColor || "";
      document.body.style.backgroundColor = "#ffffff";
      nav.classList.add("tool-nav--light");
    }

    // Update subtitle
    if (subtitle) {
      subtitle.textContent = toolNames[toolId] || toolId;
    }
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      switchTool(btn.dataset.tool);
    });
  });

  // Default: hide email sig section
  emailSig.style.display = "none";
})();
