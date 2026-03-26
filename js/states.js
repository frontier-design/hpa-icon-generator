window.RA = window.RA || {};

window.RA.states = (function () {
  var states = [];
  var isPlaying = false;
  var playbackRafId = null;
  var currentSegmentIndex = 0;
  var segmentStartTime = 0;
  var callbacks = {};

  /** Transition duration between state keyframes. */
  var TRANSITION_DURATION_MS = 12500;

  var statesPanel = window.RA.sheet.getStatesMount();
  statesPanel.innerHTML = `
    <div class="states-controls">
      <div class="states-buttons">
        <button type="button" id="playStatesBtn" disabled>Play</button>
        <button type="button" id="stopStatesBtn" disabled>Stop</button>
      </div>
    </div>
    <div id="statesList" class="states-list"></div>
    <div class="states-empty" id="statesEmpty">No states yet. Click "Add state" to record the current parameters.</div>
  `;

  var statesList = document.getElementById("statesList");
  var statesEmpty = document.getElementById("statesEmpty");
  var playBtn = document.getElementById("playStatesBtn");
  var stopBtn = document.getElementById("stopStatesBtn");
  var addStateBtn = document.getElementById("addStateBtn");

  var toastEl = null;
  var toastTimer = null;

  function showStateAddedToast() {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "state-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = "State added";
    toastEl.classList.add("state-toast--visible");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("state-toast--visible");
    }, 1000);
  }

  // ── Easing ──

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

      var guess = t;
      for (var i = 0; i < 8; i++) {
        var err = sampleX(guess) - t;
        if (Math.abs(err) < 1e-7) break;
        var d = sampleDX(guess);
        if (Math.abs(d) < 1e-7) break;
        guess -= err / d;
      }

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
    return cubicBezier(0, 1.118, 0.68, 1);
  }

  // ── Interpolation ──

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

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
      return [
        lerp(ca[0], cornersB[i][0], et),
        lerp(ca[1], cornersB[i][1], et),
      ];
    });

    return {
      corners: corners,
      rectWidth: lerp(stateA.rectWidth, stateB.rectWidth, et),
      rectHeight: lerp(stateA.rectHeight, stateB.rectHeight, et),
      numberOfRectangles: Math.round(
        lerp(stateA.numberOfRectangles, stateB.numberOfRectangles, et)
      ),
      distanceFromCenter: lerp(
        stateA.distanceFromCenter,
        stateB.distanceFromCenter,
        et
      ),
      rotationSpeed: lerp(stateA.rotationSpeed, stateB.rotationSpeed, et),
      shapePreset: t < 0.5 ? stateA.shapePreset : stateB.shapePreset,
      taperAmount: lerp(stateA.taperAmount, stateB.taperAmount, et),
      cornerOffset: lerp(stateA.cornerOffset, stateB.cornerOffset, et),
    };
  }

  // ── States list ──

  function highlightStateCard(activeIndex) {
    statesList.querySelectorAll(".state-card").forEach(function (card, i) {
      card.classList.toggle("active", i === activeIndex);
    });
  }

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
        callbacks.loadState(state);
        highlightStateCard(index);
      });

      statesList.appendChild(card);
    });
  }

  // ── Playback ──

  function playbackFrame(timestamp) {
    if (!isPlaying) return;

    if (segmentStartTime === 0) segmentStartTime = timestamp;

    var duration = TRANSITION_DURATION_MS;
    var elapsed = timestamp - segmentStartTime;
    var t = Math.min(elapsed / duration, 1);

    var stateA = states[currentSegmentIndex];
    var stateB = states[(currentSegmentIndex + 1) % states.length];
    var interpolated = interpolateStates(stateA, stateB, t);

    callbacks.dispatchState(interpolated);
    callbacks.syncDisplay(interpolated);
    highlightStateCard(
      t < 0.5
        ? currentSegmentIndex
        : (currentSegmentIndex + 1) % states.length
    );

    if (t >= 1) {
      currentSegmentIndex = (currentSegmentIndex + 1) % states.length;
      segmentStartTime = timestamp;
    }

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
    callbacks.setDisabled(true);
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
    callbacks.setDisabled(false);
  }

  // ── Public API ──

  function addState(state) {
    if (isPlaying) stopPlayback();
    states.push(state);
    renderStates();
    highlightStateCard(states.length - 1);
    showStateAddedToast();
  }

  function init(cbs) {
    callbacks = cbs;
    playBtn.addEventListener("click", startPlayback);
    stopBtn.addEventListener("click", stopPlayback);
    addStateBtn.addEventListener("click", function () {
      addState(callbacks.snapshot());
    });
    renderStates();
  }

  function getIsPlaying() {
    return isPlaying;
  }

  return {
    init: init,
    addState: addState,
    getIsPlaying: getIsPlaying,
  };
})();
