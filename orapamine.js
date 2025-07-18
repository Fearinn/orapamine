/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * OrapaMine implementation : © Matheus Gomes matheusgomesforwork@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * orapamine.js
 *
 * OrapaMine user interface script
 *
 * In this file, you are describing the logic of your user interface, in Javascript language.
 *
 */

define([
  "dojo",
  "dojo/_base/declare",
  "ebg/core/gamegui",
  "ebg/counter",
  `${g_gamethemeurl}modules/js/clickable.js`,
  `${g_gamethemeurl}modules/js/draggable.js`,
  `${g_gamethemeurl}modules/js/bga-zoom.js`,
  `${g_gamethemeurl}modules/js/bga-help.js`,
], function (dojo, declare) {
  return declare("bgagame.orapamine", ebg.core.gamegui, {
    constructor: function () {
      console.log("orapamine constructor");
    },

    setup: function (gamedatas) {
      console.log("Starting game setup");

      this.orp = {
        info: {
          colors: gamedatas.COLORS,
          gemstones: gamedatas.GEMSTONES,
          axisLetters: gamedatas.AXIS_LETTERS,
          colorToColorblind: {
            0: "X",
            1: "A",
            2: "B",
            3: "C",
            4: "D",
            99: "E",
            16: "F",
          },
          borders: {
            Right: [1, 0],
            Left: [-1, 0],
            Bottom: [0, 1],
            Top: [0, -1],
          },
        },
        globals: {
          solutionSheet: gamedatas.solutionSheet,
        },
        managers: {
          uid: 0,
          counters: {},
        },
      };

      let aidElement = document.createElement("div");
      aidElement.id = "orp_mixingAid";
      aidElement.classList.add("orp_mixingAid");

      for (const color_id in gamedatas.COLORS) {
        if (color_id <= 4 || color_id == 16 || color_id == 99) {
          continue;
        }

        const color = gamedatas.COLORS[color_id];

        const mixElement = document.createElement("div");

        color.components.forEach((component_id, index) => {
          if (index > 0) {
            mixElement.insertAdjacentHTML("beforeend", "<span> + </span>");
          }

          const component = gamedatas.COLORS[component_id];
          const textColor = component.contrast === "light" ? "black" : "white";

          const componentHTML = `<span class="orp_logHighlight" style="color: ${textColor}; background-color: ${
            component.code
          }">${_(component.label)}</span>`;

          mixElement.insertAdjacentHTML("beforeend", componentHTML);
        });

        const textColor = color.contrast === "light" ? "black" : "white";

        mixElement.insertAdjacentHTML(
          "beforeend",
          `<span> = </span><span class="orp_logHighlight" style="color: ${textColor}; background-color: ${
            color.code
          }">${_(color.label)}</span>`
        );

        aidElement.insertAdjacentElement("beforeend", mixElement);
      }

      document
        .getElementById("orp_gameArea")
        .insertAdjacentElement("beforeend", aidElement);

      this.orp.managers.help = new HelpManager(this, {
        buttons: [
          new BgaHelpExpandableButton({
            title: _("Color Mixing Aid"),
            foldedHtml: `<span class="orp_helpFolded">?</span>`,
            unfoldedHtml: aidElement.outerHTML,
          }),
        ],
      });

      aidElement.remove();

      this.orp.managers.zoom = new ZoomManager({
        element: document.getElementById("orp_gameArea"),
        localStorageZoomKey: "orp-zoom",
        zoomControls: {
          color: "white",
        },
        zoomLevels: [0.25, 0.3, 0.4, 0.5, 0.625, 0.75, 0.875, 1, 1.125, 1.25],
        smooth: true,
      });

      this.setupBoard();
      this.setupDraftPieces();
      this.setupQuestionLog();

      for (const player_id in gamedatas.players) {
        const playerPanel = this.getPlayerPanelElement(player_id);
        const playerChances = gamedatas.players[player_id].chances;

        playerPanel.insertAdjacentHTML(
          "beforeend",
          `<div class="orp_playerChancesContainer">
            <span id="orp_playerChances-${player_id}" class="orp_playerChances">${playerChances}</span>
            <i id="orp_playerChances-icon-${player_id}" class="orp_playerChances-icon fa fa-heart"></i>
          </div>`
        );

        this.addTooltip(
          `orp_playerChances-icon-${player_id}`,
          _("Remaining chances"),
          ""
        );

        this.orp.managers.counters[player_id] = { chances: new ebg.counter() };
        const counter = this.orp.managers.counters[player_id].chances;
        counter.create(`orp_playerChances-${player_id}`);
        counter.setValue(playerChances);
      }

      if (!this.isSpectator) {
        gamedatas.solutionSheet.forEach((placedPiece) => {
          this.insertPieceElement(placedPiece);
        });
      }

      this.setupPreviousAnswers(gamedatas.isBoardRevealed);
      this.styleLocationFeedback(gamedatas.revealedLocations);
      this.styleWaveFeedback(gamedatas.revealedOrigins);

      if (this.getGameUserPreference(102) == 1) {
        new Draggable(this);
      } else {
        new Clickable(this);
      }

      if (!this.isSpectator) {
        this.statusBar.addActionButton(
          `<i class="fa fa-trash"></i>`,
          () => {
            this.confirmationDialog(
              _("Are you sure you want to clear the solution sheet?"),
              () => {
                document
                  .querySelectorAll("[data-cell]")
                  .forEach((cellElement) => {
                    if (cellElement.querySelector("[data-piece]")) {
                      cellElement.style.borderWidth = "1px";
                    }
                  });
                this.actClearSolution();
              }
            );
          },
          {
            id: "orp_boardButton-clear",
            title: _("Clear solution sheet"),
            color: "alert",
            classes: ["orp_boardButton", "orp_boardButton-clear"],
            destination: document.getElementById("orp_boardButtons"),
          }
        );

        this.statusBar.addActionButton(
          `<i class="fa fa-floppy-o" aria-hidden="true"></i>`,
          () => {
            this.actSaveSolution();
          },
          {
            id: "orp_boardButton-save",
            title: _("Save solution sheet"),
            color: "secondary",
            classes: ["orp_boardButton", "orp_boardButton-save"],
            destination: document.getElementById("orp_boardButtons"),
          }
        );
      }

      this.statusBar.addActionButton(
        `<i id="orp_boardButton-simplify-icon" class="fa fa-minus-square-o" aria-hidden="true"></i>`,
        () => {
          document.querySelectorAll(".orp_piece").forEach((buttonElement) => {
            buttonElement.classList.toggle("orp_piece-hiddenControls");
          });

          const buttonIcon = document.getElementById(
            "orp_boardButton-simplify-icon"
          );
          buttonIcon.classList.toggle("fa-plus-square-o");
          buttonIcon.classList.toggle("fa-minus-square-o");
        },
        {
          id: "orp_boardButton-simplify",
          title: _("Show/hide piece controls"),
          color: "secondary",
          classes: ["orp_boardButton", "orp_boardButton-simplify"],
          destination: document.getElementById("orp_boardButtons"),
        }
      );

      this.statusBar.addActionButton(
        `<i id="orp_boardButton-hide-icon" class="fa fa-eye-slash" aria-hidden="true"></i>`,
        () => {
          document.querySelectorAll(".orp_piece").forEach((pieceElement) => {
            pieceElement.classList.toggle("orp_piece-hidden");
          });
          document
            .getElementById("orp_draftPieces")
            .classList.toggle("orp_draftPieces-hidden");

          const buttonIcon = document.getElementById(
            "orp_boardButton-hide-icon"
          );
          buttonIcon.classList.toggle("fa-eye");
          buttonIcon.classList.toggle("fa-eye-slash");
        },
        {
          id: "orp_boardButton-hide",
          title: _("Show/hide pieces"),
          color: "secondary",
          classes: ["orp_boardButton", "orp_boardButton-hide"],
          destination: document.getElementById("orp_boardButtons"),
        }
      );

      if (gamedatas.isBoardRevealed) {
        this.revealBoard({
          board: gamedatas.board,
          coloredBoard: gamedatas.coloredBoard,
          previousAnswers: gamedatas.previousAnswers,
          lastSheets: gamedatas.lastSheets,
        });
      }

      // Setup game notifications to handle (see "setupNotifications" method below)
      this.setupNotifications();
      console.log("Ending game setup");
    },

    ///////////////////////////////////////////////////
    //// Game & client states

    onEnteringState: function (stateName, args) {
      console.log("Entering state: " + stateName, args);

      if (!this.isSpectator || stateName === "client_placePiece") {
        if (stateName.includes("client_")) {
          this.statusBar.addActionButton(
            _("cancel"),
            () => {
              this.restoreServerGameState();
            },
            { color: "alert" }
          );
        }

        if (stateName === "client_placePiece") {
          document.querySelectorAll("[data-piece]").forEach((pieceElement) => {
            pieceElement.classList.add("orp_piece-unselectable");
          });

          document.querySelectorAll("[data-cell]").forEach((cellElement) => {
            if (cellElement.querySelector("[data-piece]")) {
              return;
            }

            cellElement.classList.add("orp_cell-selectable");
            cellElement.onclick = () => {
              const pieceElement = this.orp.globals.pieceElement;

              const locationFeedbackElement = cellElement.querySelector(
                ".orp_locationFeedback"
              );

              if (
                !this.comparePieceToRevealedLocation(
                  locationFeedbackElement,
                  pieceElement
                )
              ) {
                return;
              }

              cellElement.insertAdjacentElement("afterbegin", pieceElement);
              this.attachControls(pieceElement);

              if (pieceElement.dataset.piece == 6) {
                pieceElement.textContent = "X";
              }

              document
                .querySelectorAll("[data-piece]")
                .forEach((pieceElement) => {
                  pieceElement.classList.remove("orp_piece-selected");
                });

              this.restoreServerGameState();
            };
          });
        }
      }

      if (this.isCurrentPlayerActive()) {
        if (stateName === "playerTurn") {
          const selectableLocations = args.args.selectableLocations;
          const selectableOrigins = args.args.selectableOrigins;

          if (selectableOrigins.length > 0) {
            this.statusBar.addActionButton(_("send ultrasound wave"), () => {
              this.setClientState("client_sendWave", {
                descriptionmyturn: _("${you} must pick the origin of the wave"),
                client_args: { selectableOrigins: selectableOrigins },
              });
            });
          }

          if (selectableLocations.length > 0) {
            this.statusBar.addActionButton(
              _("ask about specific position"),
              () => {
                this.setClientState("client_askLocation", {
                  descriptionmyturn: _("${you} must pick the position"),
                  client_args: { selectableLocations: selectableLocations },
                });
              }
            );
          }

          this.statusBar.addActionButton(
            _("submit answer"),
            () => {
              this.confirmationDialog(
                _("Do you really want to submit an answer?"),
                () => {
                  this.actSubmitSolution();
                }
              );
            },
            {
              classes: ["orp_submitAnswerBtn"],
            }
          );
        }

        if (stateName === "client_sendWave") {
          const selectableOrigins = args.client_args.selectableOrigins;
          this.setSelectableOrigins(selectableOrigins);
        }

        if (stateName === "client_askLocation") {
          const selectableLocations = args.client_args.selectableLocations;
          this.setSelectableLocations(selectableLocations);
        }
      }
    },

    onLeavingState: function (stateName) {
      console.log("Leaving state: " + stateName);

      if (stateName === "client_askLocation") {
        this.setSelectableLocations(null, true);
      }

      if (stateName === "client_sendWave") {
        this.setSelectableOrigins(null, true);
      }

      if (stateName === "client_placePiece") {
        document.querySelectorAll("[data-piece]").forEach((pieceElement) => {
          pieceElement.classList.remove("orp_piece-selected");
          pieceElement.classList.remove("orp_piece-unselectable");
        });

        document.querySelectorAll("[data-cell]").forEach((cellElement) => {
          cellElement.classList.remove("orp_cell-selectable");
          cellElement.onclick = null;
        });

        this.orp.globals.pieceElement = null;
      }
    },

    onUpdateActionButtons: function (stateName, args) {
      console.log("onUpdateActionButtons: " + stateName, args);

      if (this.isCurrentPlayerActive()) {
        switch (stateName) {
        }
      }
    },

    ///////////////////////////////////////////////////
    //// Utility methods

    getStateName: function () {
      return this.gamedatas.gamestate.name;
    },

    getUniqueId: function () {
      return ++this.orp.managers.uid;
    },

    playSound: function (sound) {
      if (this.getGameUserPreference(103) == 0) {
        return;
      }

      this.disableNextMoveSound();
      playSound(`orapamine_${sound}`);
    },

    setupBoard: function () {
      const boardElement = document.getElementById("orp_board");

      document.getElementById("orp_boardTitle").textContent =
        _("Solution Sheet");

      boardElement.querySelectorAll("[data-cell]").forEach((cellElement) => {
        const x = cellElement.dataset.cell.split("-")[0];
        const y = cellElement.dataset.cell.split("-")[1];
        cellElement.style.gridArea = `${y}/${x}`;
      });
    },

    revealBoard: function ({
      board,
      coloredBoard,
      previousAnswers,
      lastSheets,
    }) {
      Object.keys(board).forEach((x) => {
        const row = board[x];
        Object.keys(row).forEach((y) => {
          const cellElement = document.querySelector(`[data-cell="${x}-${y}"]`);

          const pieceElement = cellElement.querySelector("[data-piece]");

          if (pieceElement) {
            pieceElement.remove();
            cellElement.style.borderWidth = "1px";
          }

          const piece = Number(row[y]);
          const color_id = coloredBoard[x][y];
          this.insertPieceElement({ piece, color_id, x, y });
        });
      });

      document.querySelectorAll(".orp_boardButton").forEach((buttonElement) => {
        buttonElement.remove();
      });

      document
        .getElementById("orp_board")
        .querySelectorAll("[data-piece]")
        .forEach((pieceElement) => {
          pieceElement.classList.add("orp_piece-hiddenControls");
        });

      document.getElementById("orp_boardTitle").textContent =
        _("Final Solution");

      document.getElementById("orp_draftPieces").remove();

      document
        .querySelectorAll(".orp_previousAnswersContainer")
        .forEach((container) => {
          container.remove();
        });

      this.gamedatas.previousAnswers = previousAnswers;
      this.gamedatas.lastSheets = lastSheets;
      this.setupPreviousAnswers(true);

      document
        .querySelectorAll(".orp_previousAnswersContainer-hidden")
        .forEach((element) => {
          element.classList.remove("orp_previousAnswersContainer-hidden");
        });
    },

    setSelectableLocations: function (selectableLocations, unset = false) {
      const selectedClass = "orp_cell-selected";

      document.querySelectorAll("[data-cell]").forEach((cellElement) => {
        if (unset) {
          cellElement.classList.remove("orp_cell-selectable");
          cellElement.classList.remove("orp_cell-unselectable");
          cellElement.classList.remove(selectedClass);
          cellElement.onclick = undefined;
          return;
        }

        const location = cellElement.dataset.cell;
        if (selectableLocations.includes(location)) {
          cellElement.classList.add("orp_cell-selectable");
          cellElement.onclick = () => {
            document.getElementById("orp_confirmBtn")?.remove();

            if (cellElement.classList.contains(selectedClass)) {
              cellElement.classList.remove(selectedClass);
              return;
            }

            document
              .querySelectorAll(`.${selectedClass}`)
              .forEach((siblingElement) => {
                if (siblingElement.dataset.location !== location) {
                  siblingElement.classList.remove(selectedClass);
                }
              });
            cellElement.classList.add(selectedClass);

            let locationLabel = location.split("-");
            locationLabel = `${locationLabel[0]}${
              this.orp.info.axisLetters["y"][locationLabel[1]]
            }`;

            this.statusBar.addActionButton(
              this.format_string_recursive(_("confirm ${location}"), {
                location: locationLabel,
              }),
              () => {
                this.actAskLocation(location);
              },
              {
                id: "orp_confirmBtn",
              }
            );
          };
          return;
        }

        cellElement.classList.add("orp_cell-unselectable");
      });
    },

    setSelectableOrigins: function (selectableOrigins, unset = false) {
      const selectedClass = "orp_origin-selected";

      document.querySelectorAll("[data-origin]").forEach((originElement) => {
        if (unset) {
          originElement.classList.remove("orp_origin-selectable");
          originElement.classList.remove("orp_origin-unselectable");
          originElement.classList.remove(selectedClass);
          originElement.onclick = undefined;
          return;
        }

        selectableOrigins = selectableOrigins.map((origin) => {
          return String(origin);
        });

        const origin = originElement.dataset.origin;

        if (selectableOrigins.includes(origin)) {
          originElement.classList.add("orp_origin-selectable");
          originElement.onclick = () => {
            document.getElementById("orp_confirmBtn")?.remove();

            if (originElement.classList.contains(selectedClass)) {
              originElement.classList.remove(selectedClass);
              return;
            }

            document
              .querySelectorAll(".orp_origin-selected")
              .forEach((siblingElement) => {
                if (siblingElement.dataset.origin !== origin) {
                  siblingElement.classList.remove(selectedClass);
                }
              });
            originElement.classList.toggle(selectedClass);

            this.statusBar.addActionButton(
              this.format_string_recursive(_("confirm ${origin}"), { origin }),
              () => {
                this.actSendWave(origin);
              },
              {
                id: "orp_confirmBtn",
              }
            );
          };
          return;
        }

        originElement.classList.add("orp_origin-unselectable");
      });
    },

    styleLocationFeedback: function (revealedLocations) {
      revealedLocations.forEach((location) => {
        let color_id = location.color_id;
        const { x, y } = location;

        if (!color_id) {
          color_id = 0;
        }

        const color = this.orp.info.colors[color_id];

        const locationFeedbackHTML = `<div id="orp_locationFeedback-${x}-${y}" class="orp_locationFeedback" 
        data-color="${color.id}" style="--pieceColor: ${color.code};"></div>`;

        const cellElement = document.querySelector(`[data-cell="${x}-${y}"]`);
        cellElement.childNodes.forEach((pieceElement) => {
          if (pieceElement.dataset.color != color.id) {
            pieceElement.remove();
          }
        });

        cellElement.insertAdjacentHTML("beforeend", locationFeedbackHTML);

        const locationFeedbackElement = document.getElementById(
          `orp_locationFeedback-${x}-${y}`
        );

        let color_label = color.label;

        if (color.id == 0) {
          color_label = _("blank");
          locationFeedbackElement.textContent = "X";
          locationFeedbackElement.classList.add("orp_blankSpace");
        }

        this.addTooltip(locationFeedbackElement.id, _(color_label), "");

        const colorblindSupport = this.orp.info.colorToColorblind[color.id];

        locationFeedbackElement.insertAdjacentHTML(
          "beforeend",
          `<span class="orp_colorblindSupport">${colorblindSupport}</span>`
        );
      });
    },

    styleWaveFeedback: function (revealedOrigins) {
      revealedOrigins.forEach((feedback) => {
        const { origin, color_id } = feedback;

        const color = this.orp.info.colors[color_id];

        if (!origin) {
          return;
        }

        const originElement = document.querySelector(
          `[data-origin="${origin}"]`
        );

        originElement.style.backgroundColor = color.code;
        originElement.style.textShadow = "none";
        this.addTooltip(originElement.id, _(color.label), "");

        if (color_id == 0) {
          originElement.classList.add("orp_origin-transparent");
        }

        if (color_id == 16) {
          originElement.classList.add("orp_origin-absorbed");
        }
      });
    },

    insertPieceElement: function (
      { piece, color_id, x, y },
      board = document.getElementById("orp_board")
    ) {
      if (piece <= 0) {
        return;
      }

      const uid = this.getUniqueId();

      if (piece == 6) {
        const blankSpaceHTML = `<div id="orp_piece-${uid}" class="orp_piece orp_blankSpace" data-piece="6" data-color="0">X</div>`;
        const cellElement = board.querySelector(`[data-cell="${x}-${y}"]`);
        cellElement.insertAdjacentHTML("afterbegin", blankSpaceHTML);

        const blankSpaceElement = document.getElementById(`orp_piece-${uid}`);
        this.attachControls(blankSpaceElement);
        return;
      }

      const pieceElement = document.createElement("div");
      pieceElement.id = `orp_piece-${uid}`;
      pieceElement.dataset.piece = piece;
      pieceElement.dataset.color = color_id;
      pieceElement.classList.add("orp_piece");
      pieceElement.classList.add(`orp_piece-${piece}`);

      const color = this.orp.info.colors[color_id];

      pieceElement.style.setProperty("--pieceColor", color.code);
      pieceElement.style.setProperty("--pieceColorDarker", color.darkerCode);

      const cellElement = board.querySelector(`[data-cell="${x}-${y}"]`);

      cellElement.insertAdjacentElement("afterbegin", pieceElement);

      this.attachControls(pieceElement);
    },

    setupDraftPieces: function () {
      const draftPiecesElement = document.getElementById("orp_draftPieces");

      const blankSpaceHTML = `<div id="orp_piece-${this.getUniqueId()}" class="orp_piece orp_blankSpace" data-piece="6" data-color="99">X</div>`;

      draftPiecesElement.insertAdjacentHTML("beforeend", blankSpaceHTML);

      for (const gemstone_id in this.orp.info.gemstones) {
        const gemstone = this.orp.info.gemstones[gemstone_id];

        draftPiecesElement.insertAdjacentHTML(
          "beforeend",
          `<div id="orp_gemstone-${gemstone_id}" data-gemstone="${gemstone_id}" data-rotation="0"></div>`
        );

        const gemstoneElement = document.getElementById(
          `orp_gemstone-${gemstone_id}`
        );
        gemstoneElement.classList.add("orp_gemstone");

        const color_id = gemstone.color;

        const colorblindSupport = this.orp.info.colorToColorblind[color_id];
        gemstoneElement.insertAdjacentHTML(
          "beforeend",
          `<span class="orp_colorblindSupport">${colorblindSupport}</span>`
        );

        if (this.getGameUserPreference(102) == 1) {
          this.statusBar.addActionButton(
            `<i class="fa fa-arrows" aria-hidden="true"></i>`,
            undefined,
            {
              title: _("Move gemstone"),
              color: "secondary",
              classes: [
                "orp_gemstoneButton-move",
                "orp_gemstoneButton",
                "action-button",
                "bgabutton",
              ],
              destination: gemstoneElement,
            }
          );
        }

        const rotateButtonTitle =
          gemstone_id == 2 ? _("Rotate/flip gemstone") : _("Rotate gemstone");

        if (gemstone_id != 1) {
          this.statusBar.addActionButton(
            `<i class="fa fa-undo fa-flip-horizontal" aria-hidden="true"></i>`,
            () => {
              this.rotateGemstone(gemstoneElement);
            },
            {
              title: _(rotateButtonTitle),
              color: "secondary",
              classes: [
                "orp_gemstoneButton-rotate",
                "orp_gemstoneButton",
                "action-button",
                "bgabutton",
              ],
              destination: gemstoneElement,
            }
          );
        }

        this.insertGemstonePieces(gemstoneElement, 0);
      }
    },

    insertGemstonePieces: function (gemstoneElement) {
      const gemstone_id = gemstoneElement.dataset.gemstone;
      const rotation = Number(gemstoneElement.dataset.rotation);
      const gemstone = this.orp.info.gemstones[gemstone_id];

      const rows =
        rotation == 0 || rotation == 180 ? gemstone.rows : gemstone.columns;

      const columns =
        rotation == 0 || rotation == 180 ? gemstone.columns : gemstone.rows;

      gemstoneElement.style.gridTemplateColumns = `repeat(${columns}, var(--cellWidth))`;
      gemstoneElement.style.gridTemplateRows = `repeat(${rows}, var(--cellWidth))`;

      const color_id = gemstone.color;
      const color = this.orp.info.colors[color_id];

      let y = 0;
      gemstone.format[rotation].forEach((row) => {
        y++;

        let x = 0;
        row.forEach((piece) => {
          x++;

          const cellElement_id = `orp_gemstoneCell-${gemstone_id}-${x}-${y}`;
          const cellHTML = `<div id="${cellElement_id}" data-gemstoneCell="${x}-${y}"></div>`;
          gemstoneElement.insertAdjacentHTML("beforeend", cellHTML);
          const cellElement = document.getElementById(cellElement_id);

          if (piece == 0) {
            return;
          }

          const pieceElement_id = `orp_gemstonePiece-${gemstone_id}-${x}-${y}`;
          const pieceHTML = `<div id="${pieceElement_id}" class="orp_piece" data-piece="${piece}" data-color="${color_id}" 
          style="--pieceColor: ${color.code}; --pieceColorDarker: ${color.darkerCode}"></div>`;
          cellElement.insertAdjacentHTML("beforeend", pieceHTML);

          const pieceElement = document.getElementById(pieceElement_id);

          if (piece != 6) {
            let color_label = color.id == 16 ? _("blackbody") : color.label;
            this.addTooltip(pieceElement_id, _(color_label), "");
          }

          if (piece < 5) {
            pieceElement.classList.add("orp_piece-half");
          }

          const borders = this.orp.info.borders;
          for (const border in borders) {
            const [shift_x, shift_y] = borders[border];
            const siblingElement = document.getElementById(
              `orp_gemstonePiece-${gemstone_id}-${Number(x) + shift_x}-${
                Number(y) + shift_y
              }`
            );

            if (siblingElement) {
              pieceElement.style[`border${border}Width`] = "2px";
            }
          }
        });
      });
    },

    rotateGemstone: function (gemstoneElement) {
      let rotation = Number(gemstoneElement.dataset.rotation);

      rotation += 90;

      if (rotation > 270) {
        rotation = 0;
      }

      gemstoneElement.dataset.rotation = rotation;

      gemstoneElement
        .querySelectorAll("[data-gemstoneCell]")
        .forEach((pieceElement) => {
          pieceElement.remove();
        });

      this.insertGemstonePieces(gemstoneElement, rotation);
    },

    attachColorBlindSupport: function (pieceElement) {
      if (!pieceElement.querySelector(".orp_colorblindSupport")) {
        const color_id = pieceElement.dataset.color;
        const colorblindSupport = this.orp.info.colorToColorblind[color_id];

        pieceElement.insertAdjacentHTML(
          "beforeend",
          `<span class="orp_colorblindSupport">${colorblindSupport}</span>`
        );
      }
    },

    attachControls: function (pieceElement) {
      this.styleGaps();
      this.attachColorBlindSupport(pieceElement);

      const color_id = pieceElement.dataset.color;

      const color = this.orp.info.colors[color_id];
      const color_label = color.id == 16 ? _("blackbody") : color.label;

      let piece = pieceElement.dataset.piece;

      if (piece != 6) {
        this.addTooltip(pieceElement.id, _(color_label), "");
      }

      const uid = pieceElement.id.split("-")[1];

      this.statusBar.addActionButton(
        `<i class="fa fa-trash fa-inverse" aria-hidden="true"></i>`,
        () => {
          pieceElement.remove();
          this.restoreServerGameState();
        },
        {
          id: `orp_pieceButton-delete-${uid}`,
          title: _("Delete piece"),
          classes: ["orp_pieceButton-delete", "orp_pieceButton"],
          color: "alert",
          destination: pieceElement,
        }
      );

      if (piece < 5 && piece) {
        pieceElement.classList.add("orp_piece-half");

        this.statusBar.addActionButton(
          `<i class="fa fa-undo fa-flip-horizontal" aria-hidden="true"></i>`,
          () => {
            switch (piece) {
              case 1:
                piece = 2;
                break;
              case 2:
                piece = 4;
                break;
              case 3:
                piece = 1;
                break;
              case 4:
                piece = 3;
                break;

              default:
                piece = 1;
            }

            pieceElement.dataset.piece = piece;
          },
          {
            id: `orp_pieceButton-rotate-${uid}`,
            title: _("Rotate piece"),
            color: "secondary",
            classes: ["orp_pieceButton-rotate", "orp_pieceButton"],
            destination: pieceElement,
          }
        );
      }
    },

    styleGaps: function () {
      const borders = this.orp.info.borders;

      document
        .getElementById("orp_board")
        .querySelectorAll("[data-piece]")
        .forEach((pieceElement) => {
          const cellElement = pieceElement.parentElement;
          const [x, y] = cellElement.dataset.cell.split("-");

          for (const border in borders) {
            pieceElement.style[`border${border}Width`] = "0";
            cellElement.style[`border${border}Width`] = "1px";
          }

          for (const border in borders) {
            const [shift_x, shift_y] = borders[border];

            const siblingElement = document.querySelector(
              `[data-cell="${Number(x) + Number(shift_x)}-${
                Number(y) + Number(shift_y)
              }"]`
            );

            const siblingColor =
              siblingElement?.querySelector("[data-piece]")?.dataset.color;

            if (siblingColor == pieceElement.dataset.color) {
              pieceElement.style[`border${border}Width`] = "2px";
              cellElement.style[`border${border}Width`] = "0";
            }
          }
        });
    },

    comparePieceToRevealedLocation: function (
      locationFeedbackElement,
      pieceElement
    ) {
      if (!locationFeedbackElement) {
        return true;
      }

      if (locationFeedbackElement.dataset.color == 0) {
        this.showMessage(
          _("This position has been confirmed as blank"),
          "error"
        );
        return;
      }

      if (locationFeedbackElement.dataset.color != pieceElement.dataset.color) {
        this.showMessage(
          _("This position has been confirmed as another color"),
          "error"
        );
        return false;
      }

      return true;
    },

    setupQuestionLog: function () {
      const questionLog = this.gamedatas.questionLog;
      questionLog.forEach((logLine) => {
        this.insertQuestionLogLine(logLine);
      });

      document.getElementById("orp_questionLogTitle").textContent =
        _("Question Log");

      this.statusBar.addActionButton(
        `<i id="orp_questionLogButton-icon" class="fa fa-list-alt" aria-hidden="true"></i>`,
        () => {
          document
            .getElementById("orp_questionLogContainer")
            .classList.toggle("orp_questionLogContainer-hidden");
        },
        {
          id: "orp_questionLogButton",
          title: _("Show/hide question log"),
          color: "secondary",
          classes: ["orp_extraButton"],
          destination: document.getElementById("bga-help_buttons"),
        }
      );
    },

    insertQuestionLogLine: function (logLine) {
      const questionLogElement = document.getElementById("orp_questionLog");

      const { type, color_id } = logLine;
      const color = this.orp.info.colors[color_id];
      const textColor = color.contrast === "light" ? "black" : "white";

      let logLineHTML = "";

      if (type === "wave") {
        const { origin, exit } = logLine;

        logLineHTML = `<div class="orp_logLine"><span class="orp_logHighlight">${origin}</span> 
        <i class="fa fa-arrow-right" aria-label="to"></i> <span class="orp_logHighlight">${exit}</span> 
        <span class="orp_logHighlight" style="background-color: ${
          color.code
        }; color: ${textColor}">${_(color.label)}</span></div>`;
      } else if (type === "blackbody") {
        const { origin } = logLine;
        logLineHTML = `<div class="orp_logLine"><span class="orp_logHighlight">${origin}</span> 
        <i class="fa fa-arrow-right" aria-label="to"></i>
        <span class="orp_logHighlight" style="background-color: ${
          color.code
        }; color: ${textColor}">${_("absorbed")}</span></div>`;
      } else {
        const { x, y } = logLine;

        const color_label = color.id == 0 ? _("blank") : _(color.label);

        logLineHTML = `<div class="orp_logLine"><span class="orp_logHighlight">${x}${y}:</span>
        <span class="orp_logHighlight" style="background-color: ${
          color.code
        }; color: ${textColor}">${_(color_label)}</span></div>`;
      }

      questionLogElement.insertAdjacentHTML("afterbegin", logLineHTML);
    },

    setupPreviousAnswers: function (isBoardRevealed = false) {
      if (
        !this.isSpectator &&
        !document.getElementById("orp_previousAnswersButton")
      ) {
        this.statusBar.addActionButton(
          `<i id="orp_previousAnswersButton-icon" class="fa fa-history" aria-hidden="true"></i>`,
          () => {
            if (
              !isBoardRevealed &&
              this.gamedatas.previousAnswers[this.player_id].length == 0
            ) {
              this.showMessage(
                _("You haven't submitted an answer yet"),
                "error"
              );
              return;
            }

            document
              .querySelectorAll(".orp_previousAnswersContainer")
              .forEach((element) => {
                element.classList.toggle("orp_previousAnswersContainer-hidden");
              });
          },
          {
            id: "orp_previousAnswersButton",
            title: _("Show/hide previous answers"),
            color: "secondary",
            classes: ["orp_extraButton"],
            destination: document.getElementById("bga-help_buttons"),
          }
        );
      }

      for (const player_id in this.gamedatas.previousAnswers) {
        const previousAnswers = this.gamedatas.previousAnswers[player_id];

        const title =
          player_id == this.player_id
            ? _("Your answers")
            : this.format_string_recursive(_("${player_name}'s answers"), {
                player_name: this.gamedatas.players[player_id].name,
              });

        document.getElementById("orp_gameArea").insertAdjacentHTML(
          "beforeend",
          `<div id="orp_previousAnswersContainer-${player_id}" class="orp_previousAnswersContainer-hidden orp_previousAnswersContainer whiteblock">
            <h3 class="orp_previousAnswersTitle orp_title">${_(title)}</h3>
            <div id="orp_previousAnswers-${player_id}" class="orp_previousAnswers"></div>
          </div>`
        );

        previousAnswers.forEach((answer) => {
          this.insertPreviousAnswer(answer, player_id);
        });

        const lastSheet = this.gamedatas.lastSheets[player_id];

        if (isBoardRevealed) {
          this.insertPreviousAnswer(lastSheet, player_id, true);
        }
      }
    },

    insertPreviousAnswer: function (answer, player_id, isSheet = false) {
      const uid = this.getUniqueId();

      const alternateBoard = document
        .getElementById("orp_boardContainer")
        .cloneNode(true);

      alternateBoard.id = `orp_alternateBoard-${uid}`;
      alternateBoard.classList.remove("whiteblock");

      alternateBoard.querySelectorAll("[data-cell]").forEach((cellElement) => {
        cellElement.childNodes.forEach((childElement) => {
          childElement.remove();
        });
      });

      alternateBoard
        .querySelectorAll(".orp_boardTitle")
        .forEach((titleElement) => {
          titleElement.remove();
        });

      document
        .getElementById(`orp_previousAnswers-${player_id}`)
        .insertAdjacentElement("afterbegin", alternateBoard);

      answer.forEach((placedPiece) => {
        this.insertPieceElement(placedPiece, alternateBoard);
      });

      alternateBoard
        .querySelectorAll(".action-button")
        .forEach((childElement) => {
          childElement.remove();
        });

      alternateBoard.querySelectorAll("[id]").forEach((childElement) => {
        childElement.onclick = undefined;
        childElement.removeAttribute("id");
      });

      alternateBoard.querySelectorAll("[data-cell]").forEach((cellElement) => {
        cellElement.removeAttribute("data-cell");
      });

      alternateBoard
        .querySelectorAll("[data-origin]")
        .forEach((originElement) => {
          originElement.removeAttribute("data-origin");
          originElement.removeAttribute("style");
        });

      alternateBoard
        .querySelectorAll(".orp_locationFeedback")
        .forEach((feedbackElement) => {
          feedbackElement.remove();
        });

      if (isSheet) {
        alternateBoard.insertAdjacentHTML(
          "afterbegin",
          `<h4 class="orp_lastSheetTitle">${_("last saved sheet")}</h4>`
        );
      }
    },

    clearSheet: function () {
      document
        .getElementById("orp_board")
        .querySelectorAll("[data-piece]")
        .forEach((pieceElement) => {
          pieceElement.remove();
        });
    },

    ///////////////////////////////////////////////////
    //// Player's actions

    performAction: function (action, args, options) {
      args.CLIENT_VERSION = this.gamedatas.GAME_VERSION;
      this.bgaPerformAction(action, args, options);
    },

    actAskLocation: function (location) {
      const guess_x = location.split("-")[0];
      const guess_y = location.split("-")[1];

      this.performAction("actAskLocation", { guess_x, guess_y });
    },

    actSendWave: function (origin) {
      this.playSound("laser");
      this.performAction("actSendWave", { origin });
    },

    actClearSolution: function () {
      this.clearSheet();

      this.performAction("actClearSolution", {}, { checkAction: false });
    },

    actSaveSolution: function () {
      const solutionSheet = [];
      document
        .getElementById("orp_board")
        .querySelectorAll("[data-cell]")
        .forEach((cellElement) => {
          const pieceElement = cellElement.querySelector("[data-piece]");
          if (pieceElement) {
            const x = Number(cellElement.dataset.cell.split("-")[0]);
            const y = Number(cellElement.dataset.cell.split("-")[1]);
            const piece = Number(pieceElement.dataset.piece);
            const color_id = Number(pieceElement.dataset.color);

            solutionSheet.push({ x, y, piece, color_id });
          }
        });

      if (solutionSheet.length === 0) {
        this.showMessage(_("You can't save an empty sheet"), "error");
        return;
      }

      if (solutionSheet.length > 75) {
        this.showMessage(
          _(
            "Limit of occupied cells in the sheet reached. Please clear a few cells"
          ),
          "error"
        );
        return;
      }

      this.performAction(
        "actSaveSolution",
        {
          solutionSheet: JSON.stringify(solutionSheet),
        },
        {
          checkAction: false,
        }
      );
    },

    actSubmitSolution: function () {
      const solutionSheet = [];
      document
        .getElementById("orp_board")
        .querySelectorAll("[data-cell]")
        .forEach((cellElement) => {
          const pieceElement = cellElement.querySelector("[data-piece]");
          if (pieceElement) {
            const [x, y] = cellElement.dataset.cell.split("-");
            const piece = pieceElement.dataset.piece;
            const color_id = pieceElement.dataset.color;

            if (piece == 6) {
              return;
            }

            solutionSheet.push({ piece, color_id, x, y });
          }
        });

      if (solutionSheet.length > 75) {
        this.showMessage(
          _(
            "Limit of occupied cells in the sheet reached. Please clear a few cells"
          ),
          "error"
        );
        return;
      }

      this.performAction("actSubmitSolution", {
        solutionSheet: JSON.stringify(solutionSheet),
      });
    },

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    setupNotifications: function () {
      console.log("notifications subscriptions setup");
      this.bgaSetupPromiseNotifications();
    },

    notif_answerLocation: function (args) {
      const { x, y, color_id, logLine } = args;

      this.styleLocationFeedback([{ x, y, color_id }]);
      this.insertQuestionLogLine(logLine);
    },

    notif_returnWave: function (args) {
      const { color_id, origin, exit, logLine } = args;

      this.styleWaveFeedback([
        { origin, color_id },
        { origin: exit, color_id },
      ]);

      this.insertQuestionLogLine(logLine);
    },

    notif_submitSolution: function (args) {
      const { answer, player_id } = args;

      this.gamedatas.previousAnswers[player_id].push(answer);
      this.insertPreviousAnswer(answer, player_id);
    },

    notif_incorrectSolution: function (args) {
      const player_id = args.player_id;
      this.orp.managers.counters[player_id].chances.incValue(-1);
    },

    notif_clearSolution: function (args) {
      const messageType =
        this.bgaAnimationsActive() &&
        typeof g_replayFrom === "undefined" &&
        g_archive_mode === false
          ? "info"
          : "only_to_log";

      this.showMessage(_("Solution cleared"), messageType);
      this.clearSheet();
    },

    notif_saveSolution: function (args) {
      const messageType =
        this.bgaAnimationsActive() &&
        typeof g_replayFrom === "undefined" &&
        g_archive_mode === false
          ? "info"
          : "only_to_log";

      this.showMessage(_("Solution saved"), messageType);

      const solutionSheet = args.solutionSheet;

      if (!args.solutionSheet) {
        return;
      }

      this.clearSheet();

      solutionSheet.forEach((placedPiece) => {
        this.insertPieceElement(placedPiece);
      });
    },

    notif_revealBoard: function (args) {
      const { board, coloredBoard, previousAnswers, lastSheets } = args;

      this.revealBoard({
        board,
        coloredBoard,
        previousAnswers,
        lastSheets,
      });
    },

    // Override
    format_string_recursive(log, args) {
      try {
        if (log && args && !args.processed) {
          args.processed = true;

          if (args.color_label && args.color_id !== undefined) {
            const color = this.orp.info.colors[args.color_id];

            const textColor = color.contrast === "light" ? "black" : "white";

            args.color_label = `<span class="orp_logHighlight" style="color: ${textColor}; background-color: ${
              color.code
            }; padding: 0 4px;">${_(color.label)}</span>`;
          }

          highlighted = ["log_x", "log_y", "log_origin", "log_exit"];
          highlighted.forEach((key) => {
            args[key] = `<span class="orp_logHighlight">${args[key]}</span>`;
          });
        }
      } catch (e) {
        console.error(log, args, "Exception thrown", e.stack);
      }

      return this.inherited(arguments);
    },
  });
});
