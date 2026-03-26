(function () {
  var controls = window.RA.controls;
  var states = window.RA.states;

  function dispatchState(state) {
    window.dispatchEvent(
      new CustomEvent("updateRectangles", { detail: state })
    );
  }

  function updateScene() {
    if (states.getIsPlaying()) return;
    dispatchState(controls.snapshot());
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
