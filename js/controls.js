window.RA = window.RA || {};

window.RA.controls = (function () {
  var panel = document.createElement("div");
  panel.className = "controls-panel";
  panel.innerHTML = `
    <h3>Control Panel</h3>

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
      <select id="shapePreset">
        <option value="vertical">Vertical</option>
        <option value="horizontal">Horizontal</option>
        <option value="tapered">Tapered</option>
        <option value="topLeftDown">Top left down</option>
      </select>
    </div>

    <div class="control-group">
      <label for="rectWidth">Rectangle Width</label>
      <div class="slider-container">
        <input type="range" id="rectWidth" min="10" max="200" value="25">
        <div class="value-display"><span id="rectWidthValue">25</span>px</div>
      </div>
    </div>

    <div class="control-group">
      <label for="rectHeight">Rectangle Height</label>
      <div class="slider-container">
        <input type="range" id="rectHeight" min="10" max="500" value="200">
        <div class="value-display"><span id="rectHeightValue">200</span>px</div>
      </div>
    </div>

    <div class="control-group">
      <label for="numberOfRectangles">Number of Rectangles</label>
      <input type="number" id="numberOfRectangles" min="1" max="50" value="9">
    </div>

    <div class="control-group">
      <label for="distanceFromCenter">Distance from Center</label>
      <div class="slider-container">
        <input type="range" id="distanceFromCenter" min="0" max="300" value="60">
        <div class="value-display"><span id="distanceFromCenterValue">60</span>px</div>
      </div>
    </div>

    <div class="control-group">
      <label for="rotationSpeed">Rotation Speed</label>
      <div class="slider-container">
        <input type="range" id="rotationSpeed" min="0" max="5" step="0.1" value="0.5">
        <div class="value-display"><span id="rotationSpeedValue">0.5</span>&deg;</div>
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
      <button type="button" id="toggleAnchorVisibility">Toggle anchor visibility</button>
    </div>

    <div class="control-group">
      <button type="button" id="addStateBtn">Add state</button>
    </div>
  `;

  document.body.appendChild(panel);

  var el = {
    rectWidth: document.getElementById("rectWidth"),
    rectWidthValue: document.getElementById("rectWidthValue"),
    rectHeight: document.getElementById("rectHeight"),
    rectHeightValue: document.getElementById("rectHeightValue"),
    numberOfRectangles: document.getElementById("numberOfRectangles"),
    distanceFromCenter: document.getElementById("distanceFromCenter"),
    distanceFromCenterValue: document.getElementById("distanceFromCenterValue"),
    rotationSpeed: document.getElementById("rotationSpeed"),
    rotationSpeedValue: document.getElementById("rotationSpeedValue"),
    shapePreset: document.getElementById("shapePreset"),
    taperAmount: document.getElementById("taperAmount"),
    taperAmountValue: document.getElementById("taperAmountValue"),
    cornerOffset: document.getElementById("cornerOffset"),
    cornerOffsetValue: document.getElementById("cornerOffsetValue"),
    addStateBtn: document.getElementById("addStateBtn"),
    toggleAnchorBtn: document.getElementById("toggleAnchorVisibility"),
  };

  function updatePresetParamVisibility() {
    var preset = el.shapePreset.value;
    panel.querySelectorAll(".preset-param").forEach(function (param) {
      param.style.display =
        param.getAttribute("data-visible-for") === preset ? "block" : "none";
    });
  }

  function snapshot() {
    return {
      rectWidth: parseFloat(el.rectWidth.value),
      rectHeight: parseFloat(el.rectHeight.value),
      numberOfRectangles: parseInt(el.numberOfRectangles.value),
      distanceFromCenter: parseFloat(el.distanceFromCenter.value),
      rotationSpeed: parseFloat(el.rotationSpeed.value),
      shapePreset: el.shapePreset.value,
      taperAmount: parseFloat(el.taperAmount.value),
      cornerOffset: parseFloat(el.cornerOffset.value),
    };
  }

  function loadState(state) {
    el.rectWidth.value = state.rectWidth;
    el.rectWidthValue.textContent = state.rectWidth;
    el.rectHeight.value = state.rectHeight;
    el.rectHeightValue.textContent = state.rectHeight;
    el.numberOfRectangles.value = state.numberOfRectangles;
    el.distanceFromCenter.value = state.distanceFromCenter;
    el.distanceFromCenterValue.textContent = state.distanceFromCenter;
    el.rotationSpeed.value = state.rotationSpeed;
    el.rotationSpeedValue.textContent = state.rotationSpeed;
    el.shapePreset.value = state.shapePreset;
    el.taperAmount.value = state.taperAmount;
    el.taperAmountValue.textContent = state.taperAmount;
    el.cornerOffset.value = state.cornerOffset;
    el.cornerOffsetValue.textContent = state.cornerOffset;
    updatePresetParamVisibility();
  }

  function syncDisplay(state) {
    el.rectWidth.value = Math.round(state.rectWidth);
    el.rectWidthValue.textContent = Math.round(state.rectWidth);
    el.rectHeight.value = Math.round(state.rectHeight);
    el.rectHeightValue.textContent = Math.round(state.rectHeight);
    el.numberOfRectangles.value = state.numberOfRectangles;
    el.distanceFromCenter.value = Math.round(state.distanceFromCenter);
    el.distanceFromCenterValue.textContent = Math.round(
      state.distanceFromCenter
    );
    el.rotationSpeed.value = state.rotationSpeed.toFixed(1);
    el.rotationSpeedValue.textContent = state.rotationSpeed.toFixed(1);
    el.shapePreset.value = state.shapePreset;
    el.taperAmount.value = Math.round(state.taperAmount);
    el.taperAmountValue.textContent = Math.round(state.taperAmount);
    el.cornerOffset.value = Math.round(state.cornerOffset);
    el.cornerOffsetValue.textContent = Math.round(state.cornerOffset);
    updatePresetParamVisibility();
  }

  function setDisabled(disabled) {
    panel.querySelectorAll("input, select, button").forEach(function (input) {
      if (input.id === "addStateBtn" || input.classList.contains("color-swatch"))
        return;
      input.disabled = disabled;
    });
  }

  function init(onChange) {
    updatePresetParamVisibility();

    el.rectWidth.addEventListener("input", function () {
      el.rectWidthValue.textContent = this.value;
      onChange();
    });

    el.rectHeight.addEventListener("input", function () {
      el.rectHeightValue.textContent = this.value;
      onChange();
    });

    el.numberOfRectangles.addEventListener("input", onChange);

    el.distanceFromCenter.addEventListener("input", function () {
      el.distanceFromCenterValue.textContent = this.value;
      onChange();
    });

    el.rotationSpeed.addEventListener("input", function () {
      el.rotationSpeedValue.textContent = this.value;
      onChange();
    });

    el.shapePreset.addEventListener("change", function () {
      updatePresetParamVisibility();
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

    el.toggleAnchorBtn.addEventListener("click", function () {
      window.dispatchEvent(new CustomEvent("toggleAnchorVisibility"));
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

  function onAddState(callback) {
    el.addStateBtn.addEventListener("click", callback);
  }

  return {
    init: init,
    snapshot: snapshot,
    loadState: loadState,
    syncDisplay: syncDisplay,
    setDisabled: setDisabled,
    onAddState: onAddState,
  };
})();
