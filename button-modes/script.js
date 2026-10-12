(() => {
  const body = document.body;
  const chainPath = document.getElementById("chainPath");
  const chainBall = document.getElementById("chainBall");
  const chainCore = document.querySelector(".chain-ball-core");

  const START_Y = 80;
  const MAX_PULL = 130;
  const THRESHOLD = 70;

  let dragging = false;
  let startY = 0;
  let startCy = START_Y;

  const set = (y) => {
    const cy = Math.max(START_Y, Math.min(START_Y + MAX_PULL, y));
    const pull = cy - START_Y;
    const sway = pull * 0.18;
    const dip = pull * 0.22;
    chainPath.setAttribute("d", `M 10 0 L 10 ${START_Y - sway} Q 10 ${START_Y} 10 ${START_Y + dip} L 10 ${cy}`);
    chainBall.setAttribute("cy", cy);
    if (chainCore) chainCore.setAttribute("cy", cy);
  };

  chainBall.addEventListener("pointerdown", (e) => {
    dragging = true;
    startY = e.clientY;
    startCy = parseFloat(chainBall.getAttribute("cy") || START_Y);
    chainPath.style.transition = "none";
    chainBall.style.transition = "none";
    if (chainCore) chainCore.style.transition = "none";
    chainBall.setPointerCapture(e.pointerId);
    e.preventDefault();
    e.stopPropagation();
  });

  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dy = e.clientY - startY;
    set(startCy + dy);
    e.preventDefault();
  });

  window.addEventListener("pointerup", (e) => {
    if (!dragging) return;
    dragging = false;
    if (e.pointerId !== undefined && chainBall.hasPointerCapture && chainBall.hasPointerCapture(e.pointerId)) {
      chainBall.releasePointerCapture(e.pointerId);
    }
    const cy = parseFloat(chainBall.getAttribute("cy") || START_Y);
    if (cy - START_Y >= THRESHOLD) {
      body.classList.toggle("light");
    }
    chainPath.style.transition = "d 320ms cubic-bezier(0.22, 1, 0.36, 1)";
    chainBall.style.transition = "cy 320ms cubic-bezier(0.22, 1, 0.36, 1)";
    if (chainCore) chainCore.style.transition = "cy 320ms cubic-bezier(0.22, 1, 0.36, 1)";
    set(START_Y);
    setTimeout(() => {
      chainPath.style.transition = "";
      chainBall.style.transition = "";
      if (chainCore) chainCore.style.transition = "";
    }, 340);
    e.preventDefault();
  });

  window.addEventListener("pointercancel", (e) => {
    if (!dragging) return;
    dragging = false;
    if (e.pointerId !== undefined && chainBall.hasPointerCapture && chainBall.hasPointerCapture(e.pointerId)) {
      chainBall.releasePointerCapture(e.pointerId);
    }
    chainPath.style.transition = "d 320ms cubic-bezier(0.22, 1, 0.36, 1)";
    chainBall.style.transition = "cy 320ms cubic-bezier(0.22, 1, 0.36, 1)";
    if (chainCore) chainCore.style.transition = "cy 320ms cubic-bezier(0.22, 1, 0.36, 1)";
    set(START_Y);
    setTimeout(() => {
      chainPath.style.transition = "";
      chainBall.style.transition = "";
      if (chainCore) chainCore.style.transition = "";
    }, 340);
    e.preventDefault();
  });

  set(START_Y);
})();
