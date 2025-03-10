let startX = null;
let startY = null;
let deltaX = null;
let deltaY = null;
let raf = null;
let element = null;
let scale = 1;
let gemstones = null;
let game = null;

function userPressed(event) {
  element = event.target;

  if (!element.classList.contains("orp_piece")) {
    return;
  }

  startX = event.clientX;
  startY = event.clientY;

  const gameAreaElement = document.getElementById("orp_gameArea");

  gameAreaElement.addEventListener("pointermove", userMoved, {
    passive: true,
  });
  gameAreaElement.addEventListener("pointerup", userReleased, {
    passive: true,
  });
  gameAreaElement.addEventListener("pointercancel", userReleased, {
    passive: true,
  });

  element.classList.add("orp_drag");
}

function userMoved(event) {
  deltaX = event.clientX - startX;
  deltaY = event.clientY - startY;

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

  dropItemOntoXY(element, deltaX * scale + startX, deltaY * scale + startY);

  deltaX = null;
  deltaY = null;
}

function dropItemOntoXY(pieceElement, x, y) {
  const gameAreaElement = document.getElementById("orp_gameArea");
  gameAreaElement.classList.add("orp_dragContainer");

  const pointsTo = document.elementFromPoint(x, y);

  gameAreaElement.classList.remove("orp_dragContainer");
  pieceElement.classList.remove("orp_drag");

  if (!pointsTo) {
    return;
  }

  const boardElement = document.getElementById("orp_boardContainer");

  if (!boardElement.contains(pointsTo) && boardElement.contains(pieceElement)) {
    pieceElement.remove();
    return;
  }

  if (pointsTo.classList.contains("orp_innerCell")) {
    const cellElement = pointsTo.parentNode;

    if (pieceElement.dataset.color !== pointsTo.dataset.color) {
      return;
    }

    if (pieceElement.parentNode.dataset.cell) {
      cellElement.appendChild(pieceElement);
    } else {
      pieceElement = pieceElement.cloneNode(true);
      cellElement.appendChild(pieceElement);
    }

    enableRotation(pieceElement);
    pointsTo.style.display = "none";
  }

  if (pointsTo.dataset.cell) {
    if (pieceElement.parentNode.dataset.cell) {
      pointsTo.appendChild(pieceElement);
    } else {
      pieceElement = pieceElement.cloneNode(true);
      pointsTo.appendChild(pieceElement);
    }

    enableRotation(pieceElement);
  }
}

function enableRotation(pieceElement) {
  let piece = Number(pieceElement.dataset.piece);

  if (piece > 0 && piece < 5) {
    pieceElement.onclick = () => {
      pieceElement.classList.remove(`orp_piece-half-${piece}`);

      piece++;
      if (piece > 4) {
        piece = 1;
      }

      pieceElement.dataset.piece = piece;
      pieceElement.classList.add(`orp_piece-half-${piece}`);
    };
  }
}

class Draggable {
  constructor(g, g_gemstones) {
    game = g;
    gemstones = g_gemstones;

    const gameAreaElement = document.getElementById("orp_gameArea");
    gameAreaElement.addEventListener("pointerdown", userPressed, {
      passive: true,
    });
  }
}
