let startX = null;
let startY = null;
let deltaX = null;
let deltaY = null;
let raf = null;
let element = null;

const userPressed = (event) => {
  element = event.target.parentNode;

  if (!element.classList.contains("orp_gemstone")) {
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
  element.parentNode.classList.add("orp_dragContainer");
};

const userMoved = (event) => {
  if (!raf) {
    deltaX = event.clientX - startX;
    deltaY = event.clientY - startY;

    raf = requestAnimationFrame(userMovedRaf);
  }
};

const userMovedRaf = () => {
  element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
  raf = null;
};

const userReleased = (event) => {
  const gameAreaElement = document.getElementById("orp_gameArea");

  gameAreaElement.removeEventListener("pointermove", userMoved);
  gameAreaElement.removeEventListener("pointerup", userReleased);
  gameAreaElement.removeEventListener("pointercancel", userReleased);

  if (raf) {
    cancelAnimationFrame(raf);
    raf = null;
  }

  element.style.setProperty("transform", null);

  // dropItemOntoXY(element, deltaX + startX, deltaY + startY);

  deltaX = null;
  deltaY = null;
};

class Draggable {
  constructor() {
    const gameAreaElement = document.getElementById("orp_gameArea");
    gameAreaElement.addEventListener("pointerdown", userPressed, {
      passive: true,
    });
  }
}
