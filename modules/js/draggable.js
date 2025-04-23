let startX = null;
let startY = null;
let deltaX = null;
let deltaY = null;
let raf = null;
let element = null;
let scale = 1;
let game = null;
let isGemstoneMove = false;
let autoScrollRaf = null;
let lastMouseY = 0;

function startAutoScroll() {
  function step() {
    const edgeThreshold = 100; // px from top/bottom to start scrolling
    const scrollSpeed = 10; // px per frame

    if (lastMouseY < edgeThreshold) {
      window.scrollBy(0, -scrollSpeed);
    } else if (lastMouseY > window.innerHeight - edgeThreshold) {
      window.scrollBy(0, scrollSpeed);
    }

    autoScrollRaf = requestAnimationFrame(step);
  }

  if (!autoScrollRaf) {
    autoScrollRaf = requestAnimationFrame(step);
  }
}

function stopAutoScroll() {
  if (autoScrollRaf) {
    cancelAnimationFrame(autoScrollRaf);
    autoScrollRaf = null;
  }
}

function userPressed(event) {
  element = event.target;

  isGemstoneMove = element.classList.contains("orp_gemstoneButton-move");

  if (!element.dataset.piece && !isGemstoneMove) {
    return;
  }

  if (isGemstoneMove) {
    element = element.parentNode;
  }

  startX = event.pageX;
  startY = event.pageY;
  lastMouseY = event.clientY;

  const gameAreaElement = document.getElementById("orp_gameArea");

  gameAreaElement.addEventListener("pointermove", userMoved, {
    passive: false,
  });
  gameAreaElement.addEventListener("pointerup", userReleased, {
    passive: true,
  });
  gameAreaElement.addEventListener("pointercancel", userReleased, {
    passive: true,
  });
  startAutoScroll();

  element.classList.add("orp_piece-drag");
}

function userMoved(event) {
  event.preventDefault();
  lastMouseY = event.clientY;

  deltaX = event.pageX - startX;
  deltaY = event.pageY - startY;

  const gameAreaElement = document.getElementById("orp_gameArea");
  const style = window.getComputedStyle(gameAreaElement);
  if (style.transform && style.transform !== "none") {
    // The transform is usually in the form: matrix(a, b, c, d, tx, ty)
    const values = style.transform.match(/matrix\(([^)]+)\)/)[1].split(", ");
    scale = parseFloat(values[0]);
  }

  deltaX /= scale;
  deltaY /= scale;

  if (!raf) {
    raf = requestAnimationFrame(userMovedRaf);
  }
}

function userMovedRaf() {
  element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  raf = null;
}

function userReleased(event) {
  const gameAreaElement = document.getElementById("orp_gameArea");

  gameAreaElement.removeEventListener("pointermove", userMoved);
  gameAreaElement.removeEventListener("pointerup", userReleased);
  gameAreaElement.removeEventListener("pointercancel", userReleased);

  if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
  }

  element.style.setProperty("transform", null);

  if (isGemstoneMove) {
    element.querySelectorAll("[data-piece]").forEach((pieceElement) => {
      const rect = pieceElement.getBoundingClientRect();
      const targetX = rect.left + deltaX * scale;
      const targetY = rect.top + deltaY * scale;

      dropItemOntoXY(pieceElement, targetX, targetY);
    });
  } else {
    const rect = element.getBoundingClientRect();

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const targetX = centerX + deltaX * scale;
    const targetY = centerY + deltaY * scale;
    dropItemOntoXY(element, targetX, targetY);
  }

  stopAutoScroll();
  deltaX = null;
  deltaY = null;
}

function dropItemOntoXY(pieceElement, x, y) {
  const gameAreaElement = document.getElementById("orp_gameArea");
  gameAreaElement.classList.add("orp_dragContainer");

  const pointsTo = document.elementFromPoint(x, y);
  console.log(pointsTo, "POINTS TO", x, y);

  gameAreaElement.classList.remove("orp_dragContainer");
  document.querySelector(".orp_piece-drag")?.classList.remove("orp_piece-drag");

  if (!pointsTo) {
    return;
  }

  const boardElement = document.getElementById("orp_boardContainer");

  if (!boardElement.contains(pointsTo) && boardElement.contains(pieceElement)) {
    pieceElement.remove();
    return;
  }

  const cellElement = pointsTo.closest(`[data-cell]`);

  if (!cellElement || cellElement.querySelector("[data-piece]")) {
    return;
  }

  const locationFeedbackElement = cellElement.querySelector(
    ".orp_locationFeedback"
  );
  if (
    !game.comparePieceToRevealedLocation(locationFeedbackElement, pieceElement)
  ) {
    return;
  }

  if (boardElement.contains(pieceElement)) {
    cellElement.insertAdjacentElement("afterbegin", pieceElement);
    game.attachControls(pieceElement);
    return;
  }

  const cloneElement = pieceElement.cloneNode(true);
  const uid = game.getUniqueId();
  cloneElement.id = `orp_piece-${uid}`;
  cellElement.insertAdjacentElement("afterbegin", cloneElement);

  game.attachControls(cloneElement);
}

class Draggable {
  constructor(g) {
    game = g;

    const gameAreaElement = document.getElementById("orp_gameArea");
    gameAreaElement.addEventListener("pointerdown", userPressed, {
      passive: true,
    });
  }
}
