window.RA = window.RA || {};

window.RA.controls = (function () {
  var panel = window.RA.sheet.getControlsMount();
  panel.innerHTML = `
    <div class="control-panel">
      <div class="control-panel__main">
    <div class="control-group">
      <label>Background Color</label>
      <div class="color-swatches">
        <button type="button" class="color-swatch selected" data-color="#170901" title="Smoked Oak"></button>
        <button type="button" class="color-swatch" data-color="#302118" title="Cedar"></button>
        <button type="button" class="color-swatch" data-color="#3F2A1E" title="Walnut"></button>
        <button type="button" class="color-swatch" data-color="#51382D" title="Teak"></button>
        <button type="button" class="color-swatch" data-color="#D9CFBF" title="Limestone"></button>
        <button type="button" class="color-swatch" data-color="#F7F3EB" title="Linen"></button>
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
      <button type="button" class="randomise-btn" id="randomiseBtn">Randomize</button>
    </div>

    <div class="control-group">
      <label for="numberOfRectangles">Number of Rectangles</label>
      <div class="slider-container">
        <input type="range" id="numberOfRectangles" min="5" max="25" step="1" value="9">
        <div class="value-display"><span id="numberOfRectanglesValue">9</span></div>
      </div>
    </div>

    <div class="control-group">
      <label for="rectWidth">Rectangle Width</label>
      <div class="slider-container">
        <input type="range" id="rectWidth" min="10" max="130" value="25">
        <div class="value-display"><span id="rectWidthValue">25</span>px</div>
      </div>
    </div>

    <div class="control-group">
      <label for="rectHeight">Rectangle Height</label>
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

    <div class="control-group">
      <button type="button" id="addStateBtn">Add state</button>
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

  function maxTaperForWidth(widthPx) {
    return Math.floor(clampRectWidth(widthPx) / 2);
  }

  function clampTaperAmount(t, widthPx) {
    var m = maxTaperForWidth(widthPx);
    var v = Math.round(Number(t));
    if (isNaN(v)) return Math.min(7, m);
    return Math.min(m, Math.max(0, v));
  }

  /** Keep taper slider max and value ≤ half of rectangle width (px). */
  function syncTaperToWidth() {
    var rw = clampRectWidth(el.rectWidth.value);
    var m = maxTaperForWidth(rw);
    el.taperAmount.max = String(m);
    var t = clampTaperAmount(el.taperAmount.value, rw);
    el.taperAmount.value = t;
    el.taperAmountValue.textContent = t;
  }

  /** Angled preset: corner offset must be strictly less than rectangle height (max = height − 1 px). */
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
    el.numberOfRectangles.value = randInt(5, 25);
    el.numberOfRectanglesValue.textContent = el.numberOfRectangles.value;
    el.rectWidth.value = randInt(10, 130);
    el.rectWidthValue.textContent = el.rectWidth.value;
    el.rectHeight.value = randInt(10, 345);
    el.rectHeightValue.textContent = el.rectHeight.value;
    el.distanceFromCenter.value = randInt(0, 150);
    el.distanceFromCenterValue.textContent = el.distanceFromCenter.value;
    syncTaperToWidth();
    el.taperAmount.value = randInt(0, maxTaperForWidth(el.rectWidth.value));
    el.taperAmountValue.textContent = el.taperAmount.value;
    syncCornerToHeight();
    el.cornerOffset.value = randInt(0, maxCornerForHeight(el.rectHeight.value));
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
      cornerOffset: clampCornerOffset(el.cornerOffset.value, el.rectHeight.value),
    };
  }

  function loadState(state) {
    var rw = clampRectWidth(state.rectWidth);
    var rh = clampRectHeight(state.rectHeight);
    el.rectWidth.value = rw;
    el.rectWidthValue.textContent = rw;
    el.rectHeight.value = rh;
    el.rectHeightValue.textContent = rh;
    var nRect = clampRectCount(state.numberOfRectangles);
    el.numberOfRectangles.value = nRect;
    el.numberOfRectanglesValue.textContent = nRect;
    var dist = clampDistance(state.distanceFromCenter);
    el.distanceFromCenter.value = dist;
    el.distanceFromCenterValue.textContent = dist;
    el.shapePreset.value = state.shapePreset;
    el.taperAmount.max = String(maxTaperForWidth(rw));
    el.taperAmount.value = clampTaperAmount(state.taperAmount, rw);
    el.taperAmountValue.textContent = el.taperAmount.value;
    el.cornerOffset.max = String(maxCornerForHeight(rh));
    el.cornerOffset.value = clampCornerOffset(state.cornerOffset, rh);
    el.cornerOffsetValue.textContent = el.cornerOffset.value;
    updatePresetParamVisibility();
  }

  function syncDisplay(state) {
    var rw = clampRectWidth(state.rectWidth);
    var rh = clampRectHeight(state.rectHeight);
    el.rectWidth.value = rw;
    el.rectWidthValue.textContent = rw;
    el.rectHeight.value = rh;
    el.rectHeightValue.textContent = rh;
    var nRectSync = clampRectCount(state.numberOfRectangles);
    el.numberOfRectangles.value = nRectSync;
    el.numberOfRectanglesValue.textContent = nRectSync;
    var dist = clampDistance(state.distanceFromCenter);
    el.distanceFromCenter.value = dist;
    el.distanceFromCenterValue.textContent = dist;
    el.shapePreset.value = state.shapePreset;
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
        input.classList.contains("color-swatch")
      )
        return;
      input.disabled = disabled;
    });
  }

  function init(onChange) {
    updatePresetParamVisibility();
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
      onChange();
    });

    el.numberOfRectangles.addEventListener("input", function () {
      el.numberOfRectanglesValue.textContent = this.value;
      onChange();
    });

    el.distanceFromCenter.addEventListener("input", function () {
      el.distanceFromCenterValue.textContent = this.value;
      onChange();
    });

    el.shapePreset.addEventListener("change", function () {
      updatePresetParamVisibility();
      onChange();
    });

    document.getElementById("randomiseBtn").addEventListener("click", function () {
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

    panel.querySelectorAll(".color-swatch").forEach(function (swatch) {
      swatch.style.backgroundColor = swatch.getAttribute("data-color");
      swatch.addEventListener("click", function () {
        document.body.style.backgroundColor = this.getAttribute("data-color");
        panel.querySelectorAll(".color-swatch").forEach(function (s) {
          s.classList.remove("selected");
        });
        this.classList.add("selected");
      });
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
