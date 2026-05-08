window.RA = window.RA || {};

window.RA.businessCard = (function () {
  function renderPanelMarkup() {
    return `
<div class="control-panel__main">
  <div class="control-group">
    <label class="control-label" for="bcNameInput">Name</label>
    <textarea id="bcNameInput" class="sig-input bc-panel-textarea" rows="3" placeholder="Name"></textarea>
  </div>
  <div class="control-group">
    <label class="control-label" for="bcPhoneInput">Phone</label>
    <input type="text" id="bcPhoneInput" class="sig-input" placeholder="+1 123 456 7890">
  </div>
  <div class="control-group">
    <label class="control-label" for="bcEmailInput">Email</label>
    <input type="text" id="bcEmailInput" class="sig-input" placeholder="email@email.com">
  </div>
  <div class="control-group">
    <label class="control-label" for="bcRoleInput">Role</label>
    <input type="text" id="bcRoleInput" class="sig-input" placeholder="role">
  </div>
  <div class="control-group">
    <label class="control-label" for="bcCredsInput">Credentials</label>
    <textarea id="bcCredsInput" class="sig-input bc-panel-textarea" rows="2" placeholder="OAA, AAA, ARCHITECT AIBC, FRAIC, INTL. ASSOC. AIA"></textarea>
  </div>
  <div class="control-group">
    <label class="control-label">Export</label>
    <div class="undo-redo-row">
      <button type="button" id="bcDownloadBtn">Download Letter PDF</button>
    </div>
  </div>
</div>
`.trim();
  }

  function renderCornerSquaresMarkup() {
    return `
<div class="bc-corner-squares">
  <span class="bc-corner-square bc-corner-square--tl"></span>
  <span class="bc-corner-square bc-corner-square--tr"></span>
  <span class="bc-corner-square bc-corner-square--bl"></span>
  <span class="bc-corner-square bc-corner-square--br"></span>
</div>
`.trim();
  }

  function renderFrontPageMarkup() {
    return `
<div class="bc-preview-page bc-preview-page--front">
  <div class="bc-bleed-box"></div>
  <div class="bc-trim-box">
    ${renderCornerSquaresMarkup()}
    <img class="bc-trim-logo" src="assets/logos/final_logos/hpa_logo_single_row.svg" alt="HPA logo">
    <div class="bc-address">
      <span>235 CARLAW AV.,</span>
      <span class="bc-address-italic">Suite 301</span>
      <span>TORONTO, ONTARIO</span>
      <span>CANADA, M4M 2S1</span>
    </div>
    <div class="bc-url-group">
      <div class="bc-top-left-marker">
        <canvas id="bcFrontFloretteSquare" class="bc-florette-square-canvas" aria-hidden="true"></canvas>
      </div>
      <span class="bc-url">HARIRIPONTARINI.COM</span>
    </div>
  </div>
</div>
`.trim();
  }

  function renderBackPageMarkup() {
    return `
<div class="bc-preview-page bc-preview-page--back">
  <div class="bc-bleed-box"></div>
  <div class="bc-trim-box">
    ${renderCornerSquaresMarkup()}
    <div class="bc-back-layout">
      <div class="bc-back-col bc-back-col--left">
        <div class="bc-back-name" id="bcBackName">Sebastian
Andoni
Lopez</div>
        <div class="bc-back-phone-group">
          <div class="bc-back-phone-square">
            <canvas id="bcBackFloretteSquare" class="bc-florette-square-canvas" aria-hidden="true"></canvas>
          </div>
          <div class="bc-back-phone" id="bcBackPhone">+1 416 123 4567</div>
        </div>
      </div>
      <div class="bc-back-col bc-back-col--right">
        <div class="bc-back-email">
          <span id="bcBackEmailUser">SANDONILOPEZ</span>
          <span id="bcBackEmailDomain">@HP-ARCH.COM</span>
        </div>
        <div class="bc-back-meta">
          <span class="bc-back-role" id="bcBackRole">FOUNDING PARTNER</span>
          <div class="bc-back-credentials" id="bcBackCreds">
            <span>OAA, AAA, ARCHITECT AIBC,</span>
            <span>FRAIC, INTL. ASSOC. AIA</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`.trim();
  }

  function renderPreviewMarkup() {
    return `
<div class="bc-preview-pages">
  ${renderFrontPageMarkup()}
  ${renderBackPageMarkup()}
</div>
`.trim();
  }

  var panel = document.getElementById("sheet-business-card");
  panel.innerHTML = renderPanelMarkup();

  var preview = document.createElement("div");
  preview.className = "business-card-preview";
  preview.innerHTML = renderPreviewMarkup();
  document.body.appendChild(preview);

  var nameInput = document.getElementById("bcNameInput");
  var phoneInput = document.getElementById("bcPhoneInput");
  var emailInput = document.getElementById("bcEmailInput");
  var roleInput = document.getElementById("bcRoleInput");
  var credsInput = document.getElementById("bcCredsInput");

  var backName = document.getElementById("bcBackName");
  var backPhone = document.getElementById("bcBackPhone");
  var backEmailUser = document.getElementById("bcBackEmailUser");
  var backEmailDomain = document.getElementById("bcBackEmailDomain");
  var backRole = document.getElementById("bcBackRole");
  var backCreds = document.getElementById("bcBackCreds");
  var frontFloretteSquare = document.getElementById("bcFrontFloretteSquare");
  var backFloretteSquare = document.getElementById("bcBackFloretteSquare");

  var NAME_BASE_PT = 23;
  var NAME_MIN_PT = 10;
  var NAME_LINE_HEIGHT_RATIO = 1.12;
  var FLORETTE_SQUARE_PX = 120;
  var FLORETTE_COLOR = "#FEB36B";
  var FLORETTE_FIT_FACTOR = 0.5;
  var foilImage = new Image();
  var foilLoaded = false;
  foilImage.src = "assets/images/HPA_Florette_Foil.jpg";
  foilImage.onload = function () {
    foilLoaded = true;
    drawFloretteSquares();
  };

  var defaults = {
    name: "Name",
    phone: "+1 123 456 7890",
    email: "email@email.com",
    role: "role",
    credentials: "OAA, AAA, ARCHITECT AIBC, FRAIC, INTL. ASSOC. AIA",
  };

  function valueOrDefault(value, fallback) {
    var trimmed = (value || "").trim();
    return trimmed || fallback;
  }

  function oneWordPerLine(value) {
    var words = (value || "").trim().split(/\s+/).filter(Boolean);
    return words.join("\n");
  }

  function splitEmailUpper(value) {
    var upper = (value || "").trim().toUpperCase();
    var atIdx = upper.indexOf("@");
    if (atIdx > 0) {
      return {
        user: upper.substring(0, atIdx),
        domain: upper.substring(atIdx),
      };
    }
    return { user: upper, domain: "" };
  }

  function drawFloretteSquare(canvasEl) {
    if (!canvasEl || !window.RA || !RA.controls || !RA.states) return;

    canvasEl.width = FLORETTE_SQUARE_PX;
    canvasEl.height = FLORETTE_SQUARE_PX;
    var ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, FLORETTE_SQUARE_PX, FLORETTE_SQUARE_PX);

    var state = RA.controls.snapshot();
    var corners = RA.states.getCornerOffsets(state);
    var count = state.numberOfRectangles || 9;

    var maxR = 0;
    for (var i = 0; i < corners.length; i++) {
      var r = Math.sqrt(
        corners[i][0] * corners[i][0] + corners[i][1] * corners[i][1],
      );
      if (r > maxR) maxR = r;
    }
    var scale =
      maxR > 0 ? (FLORETTE_SQUARE_PX * FLORETTE_FIT_FACTOR) / maxR : 1;

    ctx.save();
    ctx.translate(FLORETTE_SQUARE_PX / 2, FLORETTE_SQUARE_PX / 2);
    for (var j = 0; j < count; j++) {
      var angle = ((Math.PI * 2) / count) * j;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(corners[0][0] * scale, corners[0][1] * scale);
      for (var k = 1; k < corners.length; k++) {
        ctx.lineTo(corners[k][0] * scale, corners[k][1] * scale);
      }
      ctx.closePath();
      ctx.fillStyle = FLORETTE_COLOR;
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    if (foilLoaded) {
      ctx.globalCompositeOperation = "source-in";
      ctx.drawImage(foilImage, 0, 0, FLORETTE_SQUARE_PX, FLORETTE_SQUARE_PX);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function drawFloretteSquares() {
    drawFloretteSquare(frontFloretteSquare);
    drawFloretteSquare(backFloretteSquare);
  }

  function syncBackFields() {
    var nameValue = valueOrDefault(nameInput.value, defaults.name);
    var phoneValue = valueOrDefault(phoneInput.value, defaults.phone);
    var emailValue = valueOrDefault(emailInput.value, defaults.email);
    var roleValue = valueOrDefault(roleInput.value, defaults.role);
    var credsValue = valueOrDefault(credsInput.value, defaults.credentials);

    backName.textContent = oneWordPerLine(nameValue);
    backPhone.textContent = phoneValue;

    var e = splitEmailUpper(emailValue);
    backEmailUser.textContent = e.user;
    backEmailDomain.textContent = e.domain;

    backRole.textContent = roleValue.toUpperCase();

    var lines = credsValue
      .split(/\r?\n/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);

    backCreds.innerHTML = "";
    if (!lines.length) {
      var empty = document.createElement("span");
      empty.textContent = "";
      backCreds.appendChild(empty);
    } else {
      for (var i = 0; i < lines.length; i++) {
        var span = document.createElement("span");
        span.textContent = lines[i].toUpperCase();
        backCreds.appendChild(span);
      }
    }

    fitBackName();
    drawFloretteSquares();
  }

  function fitBackName() {
    var container = backName.closest(".bc-back-col--left");
    if (!container) return;

    var size = NAME_BASE_PT;
    backName.style.fontSize = size + "pt";
    backName.style.lineHeight =
      (size * NAME_LINE_HEIGHT_RATIO).toFixed(2) + "pt";

    // Shrink until name fits the left column width (and stays visually sane).
    while (size > NAME_MIN_PT && backName.scrollWidth > container.clientWidth) {
      size -= 0.5;
      backName.style.fontSize = size + "pt";
      backName.style.lineHeight =
        (size * NAME_LINE_HEIGHT_RATIO).toFixed(2) + "pt";
    }
  }

  [nameInput, phoneInput, emailInput, roleInput, credsInput].forEach(
    function (input) {
      input.addEventListener("input", syncBackFields);
    },
  );

  window.addEventListener("resize", fitBackName);
  window.addEventListener("updateRays", drawFloretteSquares);

  var downloadBtn = document.getElementById("bcDownloadBtn");
  downloadBtn.addEventListener("click", function () {
    var previousTitle = document.title;
    document.title = "business-card-letter";
    window.print();
    document.title = previousTitle;
  });

  syncBackFields();

  return {};
})();
