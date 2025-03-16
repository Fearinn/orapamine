let c_game = null;

function clickCallback(event) {
  if (c_game.getStateName().includes("client_")) {

    return;
  }

  const selectedClass = "orp_piece-selected";
  let pieceElement = event.target;

  if (!pieceElement.classList.contains(selectedClass)) {
    document.querySelectorAll("[data-piece]").forEach((other_pieceElement) => {
      other_pieceElement.classList.remove(selectedClass);
    });

    pieceElement.classList.add(selectedClass);
    c_game.setClientState("client_placePiece", {
      descriptionmyturn: _("${you} must pick a position to place this piece"),
      client_args: {},
    });

    if (document.getElementById("orp_solutionPieces").contains(pieceElement)) {
      pieceElement = pieceElement.cloneNode();
    }

    c_game.orp.globals.pieceElement = pieceElement;
    return;
  }

  pieceElement.classList.remove(selectedClass);
  c_game.restoreServerGameState();
}

class Clickable {
  constructor(g) {
    c_game = g;

    document
      .getElementById("orp_gameArea")
      .addEventListener("click", (event) => {
        if (event.target.dataset.piece) {
          clickCallback(event);
        }
      });
  }
}
