(() => {
  const body = document.body;
  const cordStrand = document.getElementById("cordStrand");
  const cordKnot = document.getElementById("cordKnot");

  const START_TOP = 70;
  const MAX_PULL = 90;
  const THRESHOLD = 55;

  let dragging = false;
  let startY = 0;
  let startTop = START_TOP;

  const apply = (top) => {
    const t = Math.max(START_TOP, Math.min(START_TOP + MAX_PULL, top));
    cordStrand.style.height = t + "px";
    cordKnot.style.top = t + "px";
  };

  const reset = () => {
    cordStrand.style.transition = "height 260ms cubic-bezier(0.25, 1, 0.5, 1)";
    cordKnot.style.transition = "top 260ms cubic-bezier(0.25, 1, 0.5, 1)";
    cordStrand.style.height = START_TOP + "px";
    cordKnot.style.top = START_TOP + "px";
    setTimeout(() => {
      cordStrand.style.transition = "";
      cordKnot.style.transition = "";
    }, 280);
  };

  cordKnot.addEventListener("pointerdown", (e) => {
    dragging = true;
    startY = e.clientY;
    startTop = cordKnot.offsetTop || START_TOP;
    cordStrand.style.transition = "none";
    cordKnot.style.transition = "none";
    cordKnot.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    apply(startTop + dy);
    e.preventDefault();
  });

  window.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    if (e.pointerId !== undefined && cordKnot.hasPointerCapture && cordKnot.hasPointerCapture(e.pointerId)) {
      cordKnot.releasePointerCapture(e.pointerId);
    }
    const pulled = (cordKnot.offsetTop || START_TOP) - START_TOP;
    if (pulled >= THRESHOLD) {
      body.classList.toggle("light");
    }
    reset();
    e.preventDefault();
  });

  window.addEventListener("pointercancel", (e) => {
    if (!dragging) return;
    dragging = false;
    if (e.pointerId !== undefined && cordKnot.hasPointerCapture && cordKnot.hasPointerCapture(e.pointerId)) {
      cordKnot.releasePointerCapture(e.pointerId);
    }
    reset();
    e.preventDefault();
  });

  cordStrand.style.height = START_TOP + "px";
  cordKnot.style.top = START_TOP + "px";
})();
