(() => {
  const MAX_SIZE = 10 * 1024 * 1024;
  const ALLOWED_EXT = ["txt", "doc", "docx", "pdf"];
  const FLIGHT_MS = 900;
  const SAVE_MS = 1100;
  const CELEBRATE_MS = 1800;
  const SAVE_HOLD_MS = 1500;
  const DEFAULT_HINT = "Arrástralo y suéltalo dentro del arco";

  const zone = document.getElementById("dropzone");
  const input = document.getElementById("fileInput");
  const ball = document.getElementById("ball");
  const keeper = document.getElementById("keeper");
  const goal = document.getElementById("goal");
  const toast = document.getElementById("toast");
  const toastTitle = document.getElementById("toastTitle");
  const toastMsg = document.getElementById("toastMsg");
  const hint = document.getElementById("hint");
  const list = document.getElementById("fileList");
  const empty = document.getElementById("empty");
  const countEl = document.getElementById("count");
  const clearBtn = document.getElementById("clearBtn");
  const confirmBtn = document.getElementById("confirmBtn");
  const trajPath = document.getElementById("trajPath");
  const trajTarget = document.getElementById("trajTarget");

  let dragDepth = 0;
  let busy = false;
  let lastPoint = null;
  const queue = [];

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const iconFor = (file) => {
    const ext = extOf(file.name);
    return ext ? ext.slice(0, 4).toUpperCase() : "FILE";
  };

  const typeLabel = (file) => {
    const type = (file.type || "").split("/").pop();
    if (type) return type.toUpperCase();
    const ext = (file.name.split(".").pop() || "archivo").toUpperCase();
    return ext;
  };

  const pointInZone = (event) => {
    const rect = zone.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const extOf = (name) => {
    const parts = (name || "").split(".");
    return parts.length > 1 ? parts.pop().toLowerCase() : "";
  };

  const isAllowedType = (file) => ALLOWED_EXT.includes(extOf(file.name));

  const targetFor = (sx, half, zoneRect, goalRect) => {
    const t = clamp((sx + half) / zoneRect.width, 0, 1);
    const margin = half + 4;
    const tx = goalRect.left - zoneRect.left + margin + t * (goalRect.width - 2 * margin);
    const ty = goalRect.top - zoneRect.top + goalRect.height * 0.55;
    return { tx, ty };
  };

  const drawTrajectory = (x1, y1, tx, ty) => {
    const cx = (x1 + tx) / 2;
    const cy = Math.min(y1, ty) - 70;
    trajPath.setAttribute("d", `M ${x1} ${y1} Q ${cx} ${cy} ${tx} ${ty}`);
    trajTarget.setAttribute("cx", String(tx));
    trajTarget.setAttribute("cy", String(ty));
  };

  const updateAim = (point) => {
    const zoneRect = zone.getBoundingClientRect();
    const goalRect = goal.getBoundingClientRect();
    const ballSize = ball.offsetWidth || 46;
    const half = ballSize / 2;
    const sx = clamp(point.x - half, 12, zoneRect.width - ballSize - 12);
    const sy = clamp(point.y - half, zoneRect.height * 0.55, zoneRect.height - ballSize - 12);
    const target = targetFor(sx, half, zoneRect, goalRect);
    ball.style.setProperty("--sx", `${sx}px`);
    ball.style.setProperty("--sy", `${sy}px`);
    ball.classList.add("is-aiming");
    drawTrajectory(sx + half, sy + half, target.tx, target.ty);
  };

  const setHint = (text) => {
    hint.textContent = text;
  };

  const resetDragState = () => {
    dragDepth = 0;
    zone.classList.remove("is-over");
    ball.classList.remove("is-aiming");
    setHint(DEFAULT_HINT);
  };

  const showToast = (mode, title, message) => {
    toast.classList.toggle("toast--save", mode === "save");
    toastTitle.textContent = title;
    toastMsg.textContent = message;
    toast.classList.remove("is-show");
    void toast.offsetWidth;
    toast.classList.add("is-show");
  };

  const hideToast = () => {
    toast.classList.remove("is-show");
  };

  const confetti = (x, y) => {
    const colors = ["#000000", "#262626", "#525252", "#737373", "#a3a3a3", "#d4d4d4"];
    for (let i = 0; i < 24; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = `${x}px`;
      piece.style.top = `${y}px`;
      piece.style.background = colors[i % colors.length];
      zone.appendChild(piece);
      const dx = (Math.random() - 0.5) * 280;
      const dy = 70 + Math.random() * 170;
      const rot = (Math.random() - 0.5) * 1000;
      const anim = piece.animate(
        [
          { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
          { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${rot}deg)`, opacity: 0 }
        ],
        { duration: 900 + Math.random() * 700, easing: "cubic-bezier(0.2, 0.7, 0.4, 1)" }
      );
      anim.onfinish = () => piece.remove();
    }
  };

  const updateCount = () => {
    const total = list.children.length;
    countEl.textContent = String(total);
    empty.hidden = total > 0;
    confirmBtn.hidden = total === 0;
  };

  const addFile = (file) => {
    const item = document.createElement("li");
    item.className = "file-item";

    const icon = document.createElement("span");
    icon.className = "file-item__icon";
    icon.textContent = iconFor(file);

    const info = document.createElement("div");
    info.className = "file-item__info";

    const name = document.createElement("p");
    name.className = "file-item__name";
    name.textContent = file.name || "archivo";

    const meta = document.createElement("p");
    meta.className = "file-item__meta";
    meta.textContent = `${formatSize(file.size)} · ${typeLabel(file)}`;

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "file-item__remove";
    remove.dataset.remove = "true";
    remove.setAttribute("aria-label", `Quitar ${file.name || "archivo"}`);
    remove.textContent = "×";

    info.append(name, meta);
    item.append(icon, info, remove);
    list.appendChild(item);
    updateCount();
  };

  const resetShot = (restX, restY) => {
    ball.style.setProperty("--fx", `${restX}px`);
    ball.style.setProperty("--fy", `${restY}px`);
    ball.classList.remove("is-flying", "is-saved", "is-aiming");
    keeper.classList.remove("is-dive-left", "is-dive-right", "is-block", "is-saving");
    keeper.style.removeProperty("--dive-x");
    zone.classList.remove("is-goal", "is-save");
  };

  const score = (file) => {
    return new Promise((resolve) => {
      const zoneRect = zone.getBoundingClientRect();
      const ballSize = ball.offsetWidth || 46;
      const half = ballSize / 2;

      const start = lastPoint || { x: zoneRect.width / 2, y: zoneRect.height * 0.86 };
      const sx = clamp(start.x - half, 12, zoneRect.width - ballSize - 12);
      const sy = clamp(start.y - half, zoneRect.height * 0.55, zoneRect.height - ballSize - 12);

      const goalRect = goal.getBoundingClientRect();
      const target = targetFor(sx, half, zoneRect, goalRect);
      const ex = target.tx - half;
      const ey = target.ty - half;

      const goalBottom = goalRect.bottom - zoneRect.top;
      const kx = target.tx - half;
      const ky = clamp(goalBottom + 18 - half, goalBottom - half + 2, zoneRect.height - ballSize);
      const keeperDelta = target.tx - zoneRect.width / 2;
      const startCenter = sx + half;
      const rollDir =
        Math.abs(keeperDelta) > 25
          ? keeperDelta < 0
            ? -1
            : 1
          : startCenter < zoneRect.width / 2
            ? -1
            : 1;
      const rx = clamp(target.tx + rollDir * 60 - half, 12, zoneRect.width - ballSize - 12);
      const ry = clamp(goalBottom + 12 - half, 0, zoneRect.height - ballSize);

      const mx = (sx + ex) / 2;
      const my = Math.min(sy, ey) - 70;

      ball.style.setProperty("--sx", `${sx}px`);
      ball.style.setProperty("--sy", `${sy}px`);
      ball.style.setProperty("--ex", `${ex}px`);
      ball.style.setProperty("--ey", `${ey}px`);
      ball.style.setProperty("--mx", `${mx}px`);
      ball.style.setProperty("--my", `${my}px`);
      ball.style.setProperty("--kx", `${kx}px`);
      ball.style.setProperty("--ky", `${ky}px`);
      ball.style.setProperty("--rx", `${rx}px`);
      ball.style.setProperty("--ry", `${ry}px`);

      const disallowed = !isAllowedType(file);
      const tooBig = file.size > MAX_SIZE;
      const blocked = disallowed || tooBig;
      const divesLeft = start.x > zoneRect.width / 2;

      if (blocked) {
        if (Math.abs(keeperDelta) > 25) {
          keeper.style.setProperty("--dive-x", `${clamp(Math.abs(keeperDelta), 30, 120)}px`);
          keeper.classList.add("is-saving", keeperDelta < 0 ? "is-dive-left" : "is-dive-right");
        } else {
          keeper.classList.add("is-block");
        }
        ball.classList.remove("is-flying", "is-saved", "is-aiming");
        void ball.offsetWidth;
        ball.classList.add("is-saved");
      } else {
        keeper.classList.add(divesLeft ? "is-dive-left" : "is-dive-right");
        ball.classList.remove("is-flying", "is-saved", "is-aiming");
        void ball.offsetWidth;
        ball.classList.add("is-flying");
      }

      window.setTimeout(() => {
        if (blocked) {
          zone.classList.add("is-save");
          if (disallowed) {
            showToast("save", "¡FALLO!", "Archivo no permitido, has fallado el gol!");
          } else {
            showToast("save", "¡ATAJADO!", `${file.name || "Archivo"} supera los 10 MB`);
          }
          window.setTimeout(() => {
            hideToast();
            resetShot(rx, ry);
            resolve();
          }, SAVE_HOLD_MS);
          return;
        }

        zone.classList.add("is-goal");
        confetti(zoneRect.width / 2, goalRect.top - zoneRect.top + goalRect.height * 0.4);
        showToast("goal", "¡GOL!", `${file.name || "Archivo"} subido`);
        addFile(file);

        window.setTimeout(() => {
          hideToast();
          window.setTimeout(() => {
            resetShot(ex, ey);
            resolve();
          }, 300);
        }, CELEBRATE_MS);
      }, blocked ? SAVE_MS : FLIGHT_MS);
    });
  };

  const runQueue = async () => {
    busy = true;
    while (queue.length) {
      await score(queue.shift());
    }
    busy = false;
    lastPoint = null;
  };

  const enqueue = (files) => {
    if (!files.length) return;
    files.forEach((file) => queue.push(file));
    if (!busy) runQueue();
  };

  zone.addEventListener("dragenter", (event) => {
    event.preventDefault();
    dragDepth += 1;
    zone.classList.add("is-over");
    lastPoint = pointInZone(event);
    updateAim(lastPoint);
    setHint("¡Suéltalo dentro del arco!");
  });

  zone.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    lastPoint = pointInZone(event);
    updateAim(lastPoint);
  });

  zone.addEventListener("dragleave", (event) => {
    event.preventDefault();
    dragDepth -= 1;
    if (dragDepth <= 0) resetDragState();
  });

  zone.addEventListener("drop", (event) => {
    event.preventDefault();
    resetDragState();
    lastPoint = pointInZone(event);
    const files = Array.from(event.dataTransfer.files || []);
    enqueue(files);
  });

  zone.addEventListener("click", () => {
    lastPoint = null;
    input.click();
  });

  zone.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      lastPoint = null;
      input.click();
    }
  });

  input.addEventListener("change", () => {
    enqueue(Array.from(input.files || []));
    input.value = "";
  });

  confirmBtn.addEventListener("click", () => {
    window.location.reload();
  });

  list.addEventListener("click", (event) => {
    const remove = event.target.closest("[data-remove]");
    if (!remove) return;
    remove.closest(".file-item").remove();
    updateCount();
  });

  clearBtn.addEventListener("click", () => {
    list.replaceChildren();
    updateCount();
  });

  window.addEventListener("dragover", (event) => event.preventDefault());
  window.addEventListener("drop", (event) => event.preventDefault());

  updateCount();
})();
