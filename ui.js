// UI Controls
(function () {
  // ── State storage ──
  var states = [];
  var isPlaying = false;
  var playbackRafId = null;
  var currentSegmentIndex = 0;
  var segmentStartTime = 0;

  // ── Control Panel (right side) ──
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
        <div class="value-display"><span id="rotationSpeedValue">0.5</span>°</div>
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

  // ── States Panel (top-left) ──
  var statesPanel = document.createElement("div");
  statesPanel.className = "states-panel";
  statesPanel.innerHTML = `
    <h3>Animation States</h3>
    <div class="states-controls">
      <div class="states-duration">
        <label for="transitionDuration">Transition</label>
        <input type="number" id="transitionDuration" min="0.1" max="10" step="0.1" value="1">
        <span>s</span>
      </div>
      <div class="states-easing">
        <label for="easingInput">Easing</label>
        <input type="text" id="easingInput" value="" placeholder="cubic-bezier(0, 1.118, 0.68, 1)" spellcheck="false">
      </div>
      <div class="states-buttons">
        <button type="button" id="playStatesBtn" disabled>Play</button>
        <button type="button" id="stopStatesBtn" disabled>Stop</button>
      </div>
    </div>
    <div id="statesList" class="states-list"></div>
    <div class="states-empty" id="statesEmpty">No states yet. Use "Add state" in the control panel to record the current parameters.</div>
  `;
  document.body.appendChild(statesPanel);

  // ── Get control elements ──
  var rectWidthInput = document.getElementById("rectWidth");
  var rectWidthValue = document.getElementById("rectWidthValue");
  var rectHeightInput = document.getElementById("rectHeight");
  var rectHeightValue = document.getElementById("rectHeightValue");
  var numberOfRectanglesInput = document.getElementById("numberOfRectangles");
  var distanceFromCenterInput = document.getElementById("distanceFromCenter");
  var distanceFromCenterValue = document.getElementById(
    "distanceFromCenterValue",
  );
  var rotationSpeedInput = document.getElementById("rotationSpeed");
  var rotationSpeedValue = document.getElementById("rotationSpeedValue");
  var shapePresetInput = document.getElementById("shapePreset");
  var taperAmountInput = document.getElementById("taperAmount");
  var taperAmountValue = document.getElementById("taperAmountValue");
  var cornerOffsetInput = document.getElementById("cornerOffset");
  var cornerOffsetValue = document.getElementById("cornerOffsetValue");

  var statesList = document.getElementById("statesList");
  var statesEmpty = document.getElementById("statesEmpty");
  var playBtn = document.getElementById("playStatesBtn");
  var stopBtn = document.getElementById("stopStatesBtn");
  var transitionDurationInput = document.getElementById("transitionDuration");
  var easingInput = document.getElementById("easingInput");

  // ── Preset param visibility ──
  function updatePresetParamVisibility() {
    var preset = shapePresetInput.value;
    var presetParams = panel.querySelectorAll(".preset-param");
    presetParams.forEach(function (el) {
      el.style.display =
        el.getAttribute("data-visible-for") === preset ? "block" : "none";
    });
  }

  updatePresetParamVisibility();

  // ── Input listeners ──
  rectWidthInput.addEventListener("input", function () {
    rectWidthValue.textContent = this.value;
    updateScene();
  });

  rectHeightInput.addEventListener("input", function () {
    rectHeightValue.textContent = this.value;
    updateScene();
  });

  numberOfRectanglesInput.addEventListener("input", function () {
    updateScene();
  });

  distanceFromCenterInput.addEventListener("input", function () {
    distanceFromCenterValue.textContent = this.value;
    updateScene();
  });

  rotationSpeedInput.addEventListener("input", function () {
    rotationSpeedValue.textContent = this.value;
    updateScene();
  });

  shapePresetInput.addEventListener("change", function () {
    updatePresetParamVisibility();
    updateScene();
  });

  taperAmountInput.addEventListener("input", function () {
    taperAmountValue.textContent = this.value;
    updateScene();
  });

  cornerOffsetInput.addEventListener("input", function () {
    cornerOffsetValue.textContent = this.value;
    updateScene();
  });

  document
    .getElementById("toggleAnchorVisibility")
    .addEventListener("click", function () {
      window.dispatchEvent(new CustomEvent("toggleAnchorVisibility"));
    });

  // ── Color swatches ──
  panel.querySelectorAll(".color-swatch").forEach(function (swatch) {
    swatch.style.backgroundColor = swatch.getAttribute("data-color");
    swatch.addEventListener("click", function () {
      var color = this.getAttribute("data-color");
      document.body.style.backgroundColor = color;
      panel.querySelectorAll(".color-swatch").forEach(function (s) {
        s.classList.remove("selected");
      });
      this.classList.add("selected");
    });
  });

  // ── Snapshot current params ──
  function snapshotCurrentState() {
    return {
      rectWidth: parseFloat(rectWidthInput.value),
      rectHeight: parseFloat(rectHeightInput.value),
      numberOfRectangles: parseInt(numberOfRectanglesInput.value),
      distanceFromCenter: parseFloat(distanceFromCenterInput.value),
      rotationSpeed: parseFloat(rotationSpeedInput.value),
      shapePreset: shapePresetInput.value,
      taperAmount: parseFloat(taperAmountInput.value),
      cornerOffset: parseFloat(cornerOffsetInput.value),
    };
  }

  // ── Load a state into the controls ──
  function loadStateIntoControls(state) {
    rectWidthInput.value = state.rectWidth;
    rectWidthValue.textContent = state.rectWidth;
    rectHeightInput.value = state.rectHeight;
    rectHeightValue.textContent = state.rectHeight;
    numberOfRectanglesInput.value = state.numberOfRectangles;
    distanceFromCenterInput.value = state.distanceFromCenter;
    distanceFromCenterValue.textContent = state.distanceFromCenter;
    rotationSpeedInput.value = state.rotationSpeed;
    rotationSpeedValue.textContent = state.rotationSpeed;
    shapePresetInput.value = state.shapePreset;
    taperAmountInput.value = state.taperAmount;
    taperAmountValue.textContent = state.taperAmount;
    cornerOffsetInput.value = state.cornerOffset;
    cornerOffsetValue.textContent = state.cornerOffset;
    updatePresetParamVisibility();
    updateScene();
  }

  // ── Render states list ──
  function renderStates() {
    statesList.innerHTML = "";
    statesEmpty.style.display = states.length === 0 ? "block" : "none";
    playBtn.disabled = states.length < 2;

    states.forEach(function (state, index) {
      var card = document.createElement("div");
      card.className = "state-card";
      card.setAttribute("data-index", index);

      var label = document.createElement("span");
      label.className = "state-label";
      label.textContent = "State " + (index + 1);

      var info = document.createElement("span");
      info.className = "state-info";
      info.textContent =
        state.shapePreset + " / " + state.numberOfRectangles + "r";

      var deleteBtn = document.createElement("button");
      deleteBtn.className = "state-delete";
      deleteBtn.textContent = "\u00D7";
      deleteBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        if (isPlaying) stopPlayback();
        states.splice(index, 1);
        renderStates();
      });

      card.appendChild(label);
      card.appendChild(info);
      card.appendChild(deleteBtn);

      card.addEventListener("click", function () {
        if (isPlaying) return;
        loadStateIntoControls(state);
        highlightStateCard(index);
      });

      statesList.appendChild(card);
    });
  }

  function highlightStateCard(activeIndex) {
    statesList.querySelectorAll(".state-card").forEach(function (card, i) {
      card.classList.toggle("active", i === activeIndex);
    });
  }

  // ── Add state ──
  document.getElementById("addStateBtn").addEventListener("click", function () {
    if (isPlaying) stopPlayback();
    states.push(snapshotCurrentState());
    renderStates();
    highlightStateCard(states.length - 1);
  });

  // ── Cubic-bezier easing ──
  function parseCubicBezier(str) {
    var match = str.match(
      /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/,
    );
    if (match) {
      return [
        parseFloat(match[1]),
        parseFloat(match[2]),
        parseFloat(match[3]),
        parseFloat(match[4]),
      ];
    }
    return null;
  }

  function cubicBezier(x1, y1, x2, y2) {
    return function (t) {
      if (t <= 0) return 0;
      if (t >= 1) return 1;

      var ax = 3 * x1 - 3 * x2 + 1;
      var bx = 3 * x2 - 6 * x1;
      var cx = 3 * x1;

      var ay = 3 * y1 - 3 * y2 + 1;
      var by = 3 * y2 - 6 * y1;
      var cy = 3 * y1;

      function sampleX(p) {
        return ((ax * p + bx) * p + cx) * p;
      }
      function sampleY(p) {
        return ((ay * p + by) * p + cy) * p;
      }
      function sampleDX(p) {
        return (3 * ax * p + 2 * bx) * p + cx;
      }

      // Newton-Raphson to solve for parameter given x = t
      var guess = t;
      for (var i = 0; i < 8; i++) {
        var err = sampleX(guess) - t;
        if (Math.abs(err) < 1e-7) break;
        var d = sampleDX(guess);
        if (Math.abs(d) < 1e-7) break;
        guess -= err / d;
      }

      // Fall back to bisection if Newton diverged
      if (guess < 0 || guess > 1) {
        var lo = 0,
          hi = 1;
        guess = t;
        for (var i = 0; i < 20; i++) {
          var x = sampleX(guess);
          if (Math.abs(x - t) < 1e-7) break;
          if (x < t) lo = guess;
          else hi = guess;
          guess = (lo + hi) / 2;
        }
      }

      return sampleY(guess);
    };
  }

  function getEasingFn() {
    var params = parseCubicBezier(easingInput.value);
    if (params) return cubicBezier(params[0], params[1], params[2], params[3]);
    return function (t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    };
  }

  // ── Interpolation helpers ──
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Compute 4 corner offsets relative to rotation center for any preset.
  // Order: [TL, TR, BR, BL] — consistent across all presets.
  function getCornerOffsets(s) {
    var w = s.rectWidth;
    var h = s.rectHeight;
    var d = s.distanceFromCenter;

    if (s.shapePreset === "horizontal") {
      return [
        [-h / 2, -w - d],
        [h / 2, -w - d],
        [h / 2, -d],
        [-h / 2, -d],
      ];
    } else if (s.shapePreset === "tapered") {
      return [
        [-w / 2 + s.taperAmount, -h - d],
        [w / 2 - s.taperAmount, -h - d],
        [w / 2, -d],
        [-w / 2, -d],
      ];
    } else if (s.shapePreset === "topLeftDown") {
      return [
        [-w / 2, -h - d + s.cornerOffset],
        [w / 2, -h - d],
        [w / 2, -d],
        [-w / 2, -d],
      ];
    }
    // vertical / default
    return [
      [-w / 2, -h - d],
      [w / 2, -h - d],
      [w / 2, -d],
      [-w / 2, -d],
    ];
  }

  function interpolateStates(stateA, stateB, t) {
    var easing = getEasingFn();
    var et = easing(t);

    var cornersA = getCornerOffsets(stateA);
    var cornersB = getCornerOffsets(stateB);
    var corners = cornersA.map(function (ca, i) {
      return [lerp(ca[0], cornersB[i][0], et), lerp(ca[1], cornersB[i][1], et)];
    });

    return {
      corners: corners,
      rectWidth: lerp(stateA.rectWidth, stateB.rectWidth, et),
      rectHeight: lerp(stateA.rectHeight, stateB.rectHeight, et),
      numberOfRectangles: Math.round(
        lerp(stateA.numberOfRectangles, stateB.numberOfRectangles, et),
      ),
      distanceFromCenter: lerp(
        stateA.distanceFromCenter,
        stateB.distanceFromCenter,
        et,
      ),
      rotationSpeed: lerp(stateA.rotationSpeed, stateB.rotationSpeed, et),
      shapePreset: t < 0.5 ? stateA.shapePreset : stateB.shapePreset,
      taperAmount: lerp(stateA.taperAmount, stateB.taperAmount, et),
      cornerOffset: lerp(stateA.cornerOffset, stateB.cornerOffset, et),
    };
  }

  // ── Dispatch interpolated values to Paper.js ──
  function dispatchState(state) {
    window.dispatchEvent(
      new CustomEvent("updateRectangles", { detail: state }),
    );
  }

  // ── Sync controls display during playback (visual only) ──
  function syncControlsDisplay(state) {
    rectWidthInput.value = Math.round(state.rectWidth);
    rectWidthValue.textContent = Math.round(state.rectWidth);
    rectHeightInput.value = Math.round(state.rectHeight);
    rectHeightValue.textContent = Math.round(state.rectHeight);
    numberOfRectanglesInput.value = state.numberOfRectangles;
    distanceFromCenterInput.value = Math.round(state.distanceFromCenter);
    distanceFromCenterValue.textContent = Math.round(state.distanceFromCenter);
    rotationSpeedInput.value = state.rotationSpeed.toFixed(1);
    rotationSpeedValue.textContent = state.rotationSpeed.toFixed(1);
    shapePresetInput.value = state.shapePreset;
    taperAmountInput.value = Math.round(state.taperAmount);
    taperAmountValue.textContent = Math.round(state.taperAmount);
    cornerOffsetInput.value = Math.round(state.cornerOffset);
    cornerOffsetValue.textContent = Math.round(state.cornerOffset);
    updatePresetParamVisibility();
  }

  // ── Playback loop ──
  function playbackFrame(timestamp) {
    if (!isPlaying) return;

    if (segmentStartTime === 0) segmentStartTime = timestamp;

    var duration = parseFloat(transitionDurationInput.value) * 1000;
    var elapsed = timestamp - segmentStartTime;
    var t = Math.min(elapsed / duration, 1);

    var stateA = states[currentSegmentIndex];
    var stateB = states[(currentSegmentIndex + 1) % states.length];
    var interpolated = interpolateStates(stateA, stateB, t);

    dispatchState(interpolated);
    syncControlsDisplay(interpolated);
    highlightStateCard(
      t < 0.5 ? currentSegmentIndex : (currentSegmentIndex + 1) % states.length,
    );

    if (t >= 1) {
      currentSegmentIndex = (currentSegmentIndex + 1) % states.length;
      segmentStartTime = timestamp;
    }
    rome;

    playbackRafId = requestAnimationFrame(playbackFrame);
  }

  function startPlayback() {
    if (states.length < 2) return;
    isPlaying = true;
    currentSegmentIndex = 0;
    segmentStartTime = 0;
    playBtn.disabled = true;
    playBtn.textContent = "Playing...";
    stopBtn.disabled = false;
    setControlsDisabled(true);
    playbackRafId = requestAnimationFrame(playbackFrame);
  }

  function stopPlayback() {
    isPlaying = false;
    if (playbackRafId) {
      cancelAnimationFrame(playbackRafId);
      playbackRafId = null;
    }
    playBtn.disabled = states.length < 2;
    playBtn.textContent = "Play";
    stopBtn.disabled = true;
    setControlsDisabled(false);
  }

  function setControlsDisabled(disabled) {
    var inputs = panel.querySelectorAll("input, select, button");
    inputs.forEach(function (el) {
      if (el.id === "addStateBtn" || el.classList.contains("color-swatch"))
        return;
      el.disabled = disabled;
    });
  }

  playBtn.addEventListener("click", startPlayback);
  stopBtn.addEventListener("click", stopPlayback);

  // ── Update scene (manual edits) ──
  function updateScene() {
    if (isPlaying) return;

    var state = snapshotCurrentState();
    dispatchState(state);
  }

  // ── Init ──
  renderStates();
  updateScene();
})();
