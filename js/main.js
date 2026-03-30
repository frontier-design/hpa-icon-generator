(function () {
  var controls = window.RA.controls;
  var states = window.RA.states;

  // ── History (undo / redo) ──
  var history = [];
  var historyIndex = -1;
  var isRestoring = false;

  var undoBtn = document.getElementById("undoBtn");
  var redoBtn = document.getElementById("redoBtn");

  function updateHistoryButtons() {
    undoBtn.disabled = historyIndex <= 0;
    redoBtn.disabled = historyIndex >= history.length - 1;
  }

  function pushHistory(snap) {
    if (isRestoring) return;
    history = history.slice(0, historyIndex + 1);
    history.push(JSON.parse(JSON.stringify(snap)));
    historyIndex = history.length - 1;
    updateHistoryButtons();
  }

  function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;
    isRestoring = true;
    controls.loadState(history[historyIndex]);
    updateScene();
    isRestoring = false;
    updateHistoryButtons();
  }

  function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;
    isRestoring = true;
    controls.loadState(history[historyIndex]);
    updateScene();
    isRestoring = false;
    updateHistoryButtons();
  }

  undoBtn.addEventListener("click", undo);
  redoBtn.addEventListener("click", redo);

  // ── Scene ──

  function dispatchState(state) {
    window.dispatchEvent(
      new CustomEvent("updateRays", { detail: state })
    );
  }

  function updateScene() {
    var snap = controls.snapshot();
    states.syncRingCount(snap.numberOfRectangles);
    if (states.getIsPlaying()) return;
    pushHistory(snap);
    dispatchState(snap);
  }

  controls.init(updateScene);

  states.init({
    snapshot: controls.snapshot,
    dispatchState: dispatchState,
    syncDisplay: controls.syncDisplay,
    setDisabled: controls.setDisabled,
    loadState: function (state) {
      controls.loadState(state);
      updateScene();
    },
  });

  updateScene();
})();
