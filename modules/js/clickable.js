let c_game = null;

function clickCallback(event) {
  const stateName = c_game.getStateName();
  const selectedClass = "orp_piece-selected";
  let pieceElement = event.target;

  if (pieceElement.classList.contains(selectedClass)) {
    pieceElement.classList.remove(selectedClass);
    c_game.restoreServerGameState();
    return;
  }

  if (stateName.includes("client_")) {
    return;
  }

  document.querySelectorAll("[data-piece]").forEach((other_pieceElement) => {
    other_pieceElement.classList.remove(selectedClass);
  });

  pieceElement.classList.add(selectedClass);
  c_game.setClientState("client_placePiece", {
    descriptionmyturn: _("${you} must pick a position to place this piece"),
    description: _("You must pick a position to place this piece"),
    client_args: {},
  });

  if (document.getElementById("orp_draftPieces").contains(pieceElement)) {
    pieceElement = pieceElement.cloneNode();
  }

  const uid = c_game.getUniqueId();
  pieceElement.id = `orp_piece-${uid}`;
  c_game.orp.globals.pieceElement = pieceElement;
  return;
}

class Clickable {
  constructor(g) {
    c_game = g;

    document
      .getElementById("orp_gameArea")
      .addEventListener("click", (event) => {
        if (
          event.target.dataset.piece &&
          !event.target.classList.contains("orp_piece-empty")
        ) {
          clickCallback(event);
        }
      });
  }
}
