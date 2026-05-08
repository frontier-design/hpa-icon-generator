window.RA = window.RA || {};

window.RA.controls = (function () {
  var panel = window.RA.sheet.getControlsMount();
  panel.innerHTML = `
    <div class="control-panel">
      <div class="control-panel__main">

    <div class="sig-fields" id="sigFields" style="display:none;">
      <div class="control-group">
        <label for="sigName">Name &amp; Surname</label>
        <input type="text" id="sigName" class="sig-input" placeholder="Name & Surname">
      </div>
      <div class="control-group">
        <label for="sigRole">Role</label>
        <input type="text" id="sigRole" class="sig-input" placeholder="Role">
      </div>
      <div class="control-group">
        <label for="sigCredentials">Credentials</label>
        <input type="text" id="sigCredentials" class="sig-input sig-input--uppercase" placeholder="Credentials (OAA, AAA, AIBC...)">
      </div>
    </div>

    <div class="control-group">
      <label>Background Color</label>
      <div class="color-swatches">
        <button type="button" class="combo-swatch selected" data-color="#170901" title="Smoked Oak"></button>
        <button type="button" class="combo-swatch" data-color="#302118" title="Cedar"></button>
        <button type="button" class="combo-swatch" data-color="#3F2A1E" title="Walnut"></button>
        <button type="button" class="combo-swatch" data-color="#51382D" title="Teak"></button>
        <button type="button" class="combo-swatch" data-color="#D9CFBF" title="Limestone"></button>
        <button type="button" class="combo-swatch" data-color="#F7F3EB" title="Linen"></button>
        <button type="button" class="combo-swatch combo-swatch--none" data-color="transparent" title="Transparent"><svg viewBox="0 0 30 30" class="combo-swatch__icon"><line x1="5" y1="25" x2="25" y2="5" stroke="currentColor" stroke-width="1.5"/></svg></button>
      </div>
    </div>

    <div class="control-group control-group--rays">
      <label for="numberOfRectangles">Number of Rays</label>
      <div class="slider-container">
        <input type="range" id="numberOfRectangles" min="5" max="25" step="1" value="9">
        <div class="value-display"><span id="numberOfRectanglesValue">9</span> rays</div>
      </div>
    </div>

    <div class="control-group">
      <label for="shapePreset">Shape Preset</label>
      <div class="select-wrapper">
        <select id="shapePreset">
          <option value="vertical">Flat</option>
          <option value="tapered">Tapered</option>
          <option value="topLeftDown">Angled</option>
        </select>
      </div>
    </div>

    <div class="control-group">
      <label for="rectWidth">Ray Width</label>
      <div class="slider-container">
        <input type="range" id="rectWidth" min="10" max="130" value="25">
        <div class="value-display"><span id="rectWidthValue">25</span>px</div>
      </div>
    </div>

    <div class="control-group">
      <label for="rectHeight">Ray Height</label>
      <div class="slider-container">
        <input type="range" id="rectHeight" min="10" max="345" value="200">
        <div class="value-display"><span id="rectHeightValue">200</span>px</div>
      </div>
    </div>

    <div class="control-group">
      <label for="distanceFromCenter">Distance from Center</label>
      <div class="slider-container">
        <input type="range" id="distanceFromCenter" min="0" max="150" value="60">
        <div class="value-display"><span id="distanceFromCenterValue">60</span>px</div>
      </div>
    </div>

    <div class="preset-params-slot">
      <div class="control-group preset-param" data-visible-for="tapered">
        <label for="taperAmount">Taper amount</label>
        <div class="slider-container">
          <input type="range" id="taperAmount" min="0" max="80" value="7">
          <div class="value-display"><span id="taperAmountValue">7</span>px</div>
        </div>
      </div>

      <div class="control-group preset-param" data-visible-for="topLeftDown">
        <label for="cornerOffset">Corner offset</label>
        <div class="slider-container">
          <input type="range" id="cornerOffset" min="0" max="80" value="10">
          <div class="value-display"><span id="cornerOffsetValue">10</span>px</div>
        </div>
      </div>
    </div>

    <div class="control-group">
      <button type="button" id="addStateBtn">Add state</button>
      <button type="button" class="randomise-btn" id="randomiseBtn">Randomize</button>
      <div class="undo-redo-row">
        <button type="button" id="undoBtn" disabled>Undo</button>
        <button type="button" id="redoBtn" disabled>Redo</button>
      </div>
    </div>

    <div class="control-group">
      <label>Export</label>
      <div class="export-row">
        <div class="select-wrapper export-scale-wrapper" id="exportScaleWrap" style="display:none;">
          <select id="exportScale"></select>
        </div>
        <div class="select-wrapper export-format-wrapper">
          <select id="exportFormat">
            <option value="" disabled selected>Export as&hellip;</option>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="gif">GIF</option>
          </select>
        </div>
      </div>
      <button type="button" id="exportBtn" class="randomise-btn" disabled>Export</button>
    </div>
      </div>
    </div>
  `;

  var el = {
    rectWidth: document.getElementById("rectWidth"),
    rectWidthValue: document.getElementById("rectWidthValue"),
    rectHeight: document.getElementById("rectHeight"),
    rectHeightValue: document.getElementById("rectHeightValue"),
    numberOfRectangles: document.getElementById("numberOfRectangles"),
    numberOfRectanglesValue: document.getElementById("numberOfRectanglesValue"),
    distanceFromCenter: document.getElementById("distanceFromCenter"),
    distanceFromCenterValue: document.getElementById("distanceFromCenterValue"),
    shapePreset: document.getElementById("shapePreset"),
    taperAmount: document.getElementById("taperAmount"),
    taperAmountValue: document.getElementById("taperAmountValue"),
    cornerOffset: document.getElementById("cornerOffset"),
    cornerOffsetValue: document.getElementById("cornerOffsetValue"),
  };

  function clampRectCount(n) {
    var v = Math.round(Number(n));
    if (isNaN(v)) return 9;
    return Math.min(25, Math.max(5, v));
  }

  function clampRectWidth(n) {
    var v = Math.round(Number(n));
    if (isNaN(v)) return 25;
    return Math.min(130, Math.max(10, v));
  }

  function clampRectHeight(n) {
    var v = Math.round(Number(n));
    if (isNaN(v)) return 200;
    return Math.min(345, Math.max(10, v));
  }

  function clampDistance(n) {
    var v = Math.round(Number(n));
    if (isNaN(v)) return 60;
    return Math.min(150, Math.max(0, v));
  }

  /**
   * Max petal width that still reads as a florette (not a kaleidoscope).
   * Three constraints, tightest wins:
   *   1. Outer-edge angular slot: 2*(h+d)*tan(π/n) × 1.5
   *   2. Inner-edge angular slot: 2*d*tan(π/n) × 1.5  (when d > 0)
   *   3. Aspect ratio:            h × 2.5  (squat bars never look like petals)
   */
  function maxWidthForFlorette(heightPx, distPx, nRects) {
    var h = clampRectHeight(heightPx);
    var d = clampDistance(distPx);
    var n = clampRectCount(nRects);
    var ang = Math.tan(Math.PI / n);
    var outerSlot = Math.floor(2 * (h + d) * ang * 1.5);
    var innerSlot = d > 0 ? Math.floor(2 * d * ang * 1.5) : outerSlot;
    var aspectCap = Math.floor(h * 2.5);
    var limit = Math.min(outerSlot, innerSlot, aspectCap);
    return Math.max(10, Math.min(130, limit));
  }

  /** Keep width slider max and value within the florette-safe range. */
  function syncWidthToFlorette() {
    var h = clampRectHeight(el.rectHeight.value);
    var d = clampDistance(el.distanceFromCenter.value);
    var n = clampRectCount(el.numberOfRectangles.value);
    var m = maxWidthForFlorette(h, d, n);
    el.rectWidth.max = String(m);
    var w = clampRectWidth(el.rectWidth.value);
    if (w > m) w = m;
    el.rectWidth.value = w;
    el.rectWidthValue.textContent = w;
  }

  function maxTaperForWidth(widthPx) {
    return Math.floor(clampRectWidth(widthPx) / 2);
  }

  function clampTaperAmount(t, widthPx) {
    var m = maxTaperForWidth(widthPx);
    var v = Math.round(Number(t));
    if (isNaN(v)) return Math.min(7, m);
    return Math.min(m, Math.max(0, v));
  }

  /** Keep taper slider max and value ≤ half of ray width (px). */
  function syncTaperToWidth() {
    var rw = clampRectWidth(el.rectWidth.value);
    var m = maxTaperForWidth(rw);
    el.taperAmount.max = String(m);
    var t = clampTaperAmount(el.taperAmount.value, rw);
    el.taperAmount.value = t;
    el.taperAmountValue.textContent = t;
  }

  /** Angled preset: corner offset must be strictly less than ray height (max = height − 1 px). */
  function maxCornerForHeight(heightPx) {
    var h = clampRectHeight(heightPx);
    return Math.max(0, h - 1);
  }

  function clampCornerOffset(c, heightPx) {
    var m = maxCornerForHeight(heightPx);
    var v = Math.round(Number(c));
    if (isNaN(v)) return Math.min(10, m);
    return Math.min(m, Math.max(0, v));
  }

  function syncCornerToHeight() {
    var rh = clampRectHeight(el.rectHeight.value);
    var m = maxCornerForHeight(rh);
    el.cornerOffset.max = String(m);
    var c = clampCornerOffset(el.cornerOffset.value, rh);
    el.cornerOffset.value = c;
    el.cornerOffsetValue.textContent = c;
  }

  function updatePresetParamVisibility() {
    var preset = el.shapePreset.value;
    panel.querySelectorAll(".preset-param").forEach(function (param) {
      param.style.display =
        param.getAttribute("data-visible-for") === preset ? "block" : "none";
    });
  }

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function applyRandomParameters() {
    var presets = [];
    el.shapePreset.querySelectorAll("option").forEach(function (opt) {
      if (opt.value !== "horizontal") presets.push(opt.value);
    });
    if (presets.length === 0) presets = ["vertical", "tapered", "topLeftDown"];
    el.shapePreset.value = presets[randInt(0, presets.length - 1)];
    var rh = randInt(10, 345);
    var dist = randInt(0, 150);
    var n = clampRectCount(el.numberOfRectangles.value);
    el.rectHeight.value = rh;
    el.rectHeightValue.textContent = rh;
    el.distanceFromCenter.value = dist;
    el.distanceFromCenterValue.textContent = dist;
    var wMax = maxWidthForFlorette(rh, dist, n);
    el.rectWidth.max = String(wMax);
    var rw = randInt(10, wMax);
    el.rectWidth.value = rw;
    el.rectWidthValue.textContent = rw;
    syncTaperToWidth();
    el.taperAmount.value = randInt(0, maxTaperForWidth(rw));
    el.taperAmountValue.textContent = el.taperAmount.value;
    syncCornerToHeight();
    el.cornerOffset.value = randInt(0, maxCornerForHeight(rh));
    el.cornerOffsetValue.textContent = el.cornerOffset.value;
    updatePresetParamVisibility();
  }

  function snapshot() {
    return {
      rectWidth: clampRectWidth(el.rectWidth.value),
      rectHeight: clampRectHeight(el.rectHeight.value),
      numberOfRectangles: clampRectCount(el.numberOfRectangles.value),
      distanceFromCenter: clampDistance(el.distanceFromCenter.value),
      rotationSpeed: 0,
      shapePreset: el.shapePreset.value,
      taperAmount: clampTaperAmount(el.taperAmount.value, el.rectWidth.value),
      cornerOffset: clampCornerOffset(
        el.cornerOffset.value,
        el.rectHeight.value,
      ),
    };
  }

  function loadState(state) {
    var rh = clampRectHeight(state.rectHeight);
    var nRect = clampRectCount(state.numberOfRectangles);
    var dist = clampDistance(state.distanceFromCenter);
    el.rectHeight.value = rh;
    el.rectHeightValue.textContent = rh;
    el.numberOfRectangles.value = nRect;
    el.numberOfRectanglesValue.textContent = nRect;
    el.distanceFromCenter.value = dist;
    el.distanceFromCenterValue.textContent = dist;
    el.shapePreset.value = state.shapePreset;
    var wMax = maxWidthForFlorette(rh, dist, nRect);
    el.rectWidth.max = String(wMax);
    var rw = Math.min(clampRectWidth(state.rectWidth), wMax);
    el.rectWidth.value = rw;
    el.rectWidthValue.textContent = rw;
    el.taperAmount.max = String(maxTaperForWidth(rw));
    el.taperAmount.value = clampTaperAmount(state.taperAmount, rw);
    el.taperAmountValue.textContent = el.taperAmount.value;
    el.cornerOffset.max = String(maxCornerForHeight(rh));
    el.cornerOffset.value = clampCornerOffset(state.cornerOffset, rh);
    el.cornerOffsetValue.textContent = el.cornerOffset.value;
    updatePresetParamVisibility();
  }

  function syncDisplay(state) {
    var rh = clampRectHeight(state.rectHeight);
    var nRectSync = clampRectCount(state.numberOfRectangles);
    var dist = clampDistance(state.distanceFromCenter);
    el.rectHeight.value = rh;
    el.rectHeightValue.textContent = rh;
    el.numberOfRectangles.value = nRectSync;
    el.numberOfRectanglesValue.textContent = nRectSync;
    el.distanceFromCenter.value = dist;
    el.distanceFromCenterValue.textContent = dist;
    el.shapePreset.value = state.shapePreset;
    var wMax = maxWidthForFlorette(rh, dist, nRectSync);
    el.rectWidth.max = String(wMax);
    var rw = Math.min(clampRectWidth(state.rectWidth), wMax);
    el.rectWidth.value = rw;
    el.rectWidthValue.textContent = rw;
    el.taperAmount.max = String(maxTaperForWidth(rw));
    el.taperAmount.value = clampTaperAmount(state.taperAmount, rw);
    el.taperAmountValue.textContent = el.taperAmount.value;
    el.cornerOffset.max = String(maxCornerForHeight(rh));
    el.cornerOffset.value = clampCornerOffset(state.cornerOffset, rh);
    el.cornerOffsetValue.textContent = el.cornerOffset.value;
    updatePresetParamVisibility();
  }

  function setDisabled(disabled) {
    panel.querySelectorAll("input, select, button").forEach(function (input) {
      if (
        input.id === "addStateBtn" ||
        input.id === "numberOfRectangles" ||
        input.classList.contains("combo-swatch")
      )
        return;
      input.disabled = disabled;
    });
  }

  function init(onChange) {
    updatePresetParamVisibility();
    syncWidthToFlorette();
    syncTaperToWidth();
    syncCornerToHeight();

    el.rectWidth.addEventListener("input", function () {
      el.rectWidthValue.textContent = this.value;
      syncTaperToWidth();
      onChange();
    });

    el.rectHeight.addEventListener("input", function () {
      el.rectHeightValue.textContent = this.value;
      syncCornerToHeight();
      syncWidthToFlorette();
      syncTaperToWidth();
      onChange();
    });

    el.numberOfRectangles.addEventListener("input", function () {
      el.numberOfRectanglesValue.textContent = this.value;
      syncWidthToFlorette();
      syncTaperToWidth();
      onChange();
    });

    el.distanceFromCenter.addEventListener("input", function () {
      el.distanceFromCenterValue.textContent = this.value;
      syncWidthToFlorette();
      syncTaperToWidth();
      onChange();
    });

    el.shapePreset.addEventListener("change", function () {
      updatePresetParamVisibility();
      onChange();
    });

    document
      .getElementById("randomiseBtn")
      .addEventListener("click", function () {
        applyRandomParameters();
        onChange();
      });

    el.taperAmount.addEventListener("input", function () {
      el.taperAmountValue.textContent = this.value;
      onChange();
    });

    el.cornerOffset.addEventListener("input", function () {
      el.cornerOffsetValue.textContent = this.value;
      onChange();
    });

    panel.querySelectorAll(".combo-swatch").forEach(function (swatch) {
      swatch.style.backgroundColor = swatch.getAttribute("data-color");
      swatch.addEventListener("click", function () {
        document.body.style.backgroundColor = this.getAttribute("data-color");
        panel.querySelectorAll(".combo-swatch").forEach(function (s) {
          s.classList.remove("selected");
        });
        this.classList.add("selected");
      });
    });

    // ── Export ──
    var exportFormat = document.getElementById("exportFormat");
    var exportScale = document.getElementById("exportScale");
    var exportScaleWrap = document.getElementById("exportScaleWrap");
    var exportBtn = document.getElementById("exportBtn");

    var scaleOptionsImage = [
      { value: "1", label: "\u00d71" },
      { value: "2", label: "\u00d72" },
      { value: "3", label: "\u00d73" },
      { value: "4", label: "\u00d74" },
    ];
    var scaleOptionsGif = [
      { value: "60", label: "60 frames" },
      { value: "120", label: "120 frames" },
      { value: "240", label: "240 frames" },
      { value: "480", label: "480 frames" },
    ];

    function setScaleOptions(options) {
      exportScale.innerHTML = "";
      options.forEach(function (opt) {
        var o = document.createElement("option");
        o.value = opt.value;
        o.textContent = opt.label;
        exportScale.appendChild(o);
      });
    }

    function updateExportBtn() {
      exportBtn.disabled = !exportFormat.value;
    }

    exportFormat.addEventListener("change", function () {
      var fmt = exportFormat.value;
      if (!fmt) {
        exportScaleWrap.style.display = "none";
      } else if (fmt === "gif") {
        setScaleOptions(scaleOptionsGif);
        exportScaleWrap.style.display = "";
      } else {
        setScaleOptions(scaleOptionsImage);
        exportScaleWrap.style.display = "";
      }
      updateExportBtn();
    });

    exportBtn.addEventListener("click", function () {
      var fmt = exportFormat.value;
      if (!fmt) return;
      var scale = exportScale.value;
      if (fmt === "gif") {
        window.dispatchEvent(new CustomEvent("exportFlorette", { detail: { format: "gif-" + scale } }));
      } else {
        window.dispatchEvent(new CustomEvent("exportFlorette", { detail: { format: fmt + "-" + scale + "x" } }));
      }
    });
  }

  return {
    init: init,
    snapshot: snapshot,
    loadState: loadState,
    syncDisplay: syncDisplay,
    setDisabled: setDisabled,
  };
})();
