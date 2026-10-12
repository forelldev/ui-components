(() => {
  const body = document.body;
  const ball = document.getElementById("chainBall");
  const link = document.getElementById("chainLink");

  const START_TOP = 80;
  const MAX_PULL = 100;
  const THRESHOLD = 65;

  let dragging = false;
  let startY = 0;
  let startTop = START_TOP;

  const apply = (top) => {
    const t = Math.max(START_TOP, Math.min(START_TOP + MAX_PULL, top));
    link.style.height = t + "px";
    ball.style.top = t + "px";
  };

  const reset = () => {
    link.style.transition = "height 250ms cubic-bezier(0.25, 1, 0.5, 1)";
    ball.style.transition = "top 250ms cubic-bezier(0.25, 1, 0.5, 1)";
    link.style.height = START_TOP + "px";
    ball.style.top = START_TOP + "px";
    setTimeout(() => {
      link.style.transition = "";
      ball.style.transition = "";
    }, 270);
  };

  ball.addEventListener("pointerdown", (e) => {
    dragging = true;
    startY = e.clientY;
    startTop = ball.offsetTop || START_TOP;
    link.style.transition = "none";
    ball.style.transition = "none";
    ball.setPointerCapture(e.pointerId);
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
    if (e.pointerId !== undefined && ball.hasPointerCapture && ball.hasPointerCapture(e.pointerId)) {
      ball.releasePointerCapture(e.pointerId);
    }
    const pulled = (ball.offsetTop || START_TOP) - START_TOP;
    if (pulled >= THRESHOLD) {
      body.classList.toggle("light");
    }
    reset();
    e.preventDefault();
  });

  window.addEventListener("pointercancel", (e) => {
    if (!dragging) return;
    dragging = false;
    if (e.pointerId !== undefined && ball.hasPointerCapture && ball.hasPointerCapture(e.pointerId)) {
      ball.releasePointerCapture(e.pointerId);
    }
    reset();
    e.preventDefault();
  });

  link.style.height = START_TOP + "px";
  ball.style.top = START_TOP + "px";
})();
