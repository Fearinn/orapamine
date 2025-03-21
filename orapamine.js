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
        },
        globals: {
          solutionSheet: gamedatas.solutionSheet,
        },
        managers: {
          uid: 0,
          counters: {},
        },
      };

      this.orp.managers.zoom = new ZoomManager({
        element: document.getElementById("orp_gameArea"),
        localStorageZoomKey: "orp-zoom",
        zoomControls: {
          color: "white",
        },
        zoomLevels: [0.5, 0.75, 1, 1.25, 1.5],
        smooth: true,
      });

      this.setupBoard();
      this.setupSolutionPieces();
      this.setupQuestionLog();

      // this.revealBoard({
      //   board: gamedatas.board,
      //   coloredBoard: gamedatas.coloredBoard,
      // });

      this.styleLocationFeedback(gamedatas.revealedLocations);
      this.styleWaveFeedback(gamedatas.revealedOrigins);

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

        if (this.getGameUserPreference(100) == 1) {
          new Draggable(this);
        } else {
          new Clickable(this);
        }

        this.statusBar.addActionButton(
          `<i class="fa fa-trash"></i>`,
          () => {
            this.confirmationDialog(
              _("Are you sure you want to clear the solution sheet?"),
              () => {
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
            classes: ["orp_boardButton", "orp_boardButton-save"],
            destination: document.getElementById("orp_boardButtons"),
          }
        );
      }

      // Setup game notifications to handle (see "setupNotifications" method below)
      this.setupNotifications();
      console.log("Ending game setup");
    },

    ///////////////////////////////////////////////////
    //// Game & client states

    onEnteringState: function (stateName, args) {
      console.log("Entering state: " + stateName, args);

      if (this.isCurrentPlayerActive()) {
        if (stateName === "playerTurn") {
          const selectableLocations = args.args.selectableLocations;
          const selectableOrigins = args.args.selectableOrigins;

          this.statusBar.addActionButton(_("Send ultrasound wave"), () => {
            this.setClientState("client_sendWave", {
              descriptionmyturn: _("${you} must pick the origin of the wave"),
              client_args: { selectableOrigins: selectableOrigins },
            });
          });

          this.statusBar.addActionButton(
            _("Ask about specific position"),
            () => {
              this.setClientState("client_askLocation", {
                descriptionmyturn: _("${you} must pick the position"),
                client_args: { selectableLocations: selectableLocations },
              });
            }
          );

          this.statusBar.addActionButton(_("Submit answer"), () => {
            this.confirmationDialog(
              _("Are you sure you want to submit an answer?"),
              () => {
                this.actSubmitSolution();
              }
            );
          });
        }

        if (stateName.includes("client_")) {
          this.statusBar.addActionButton(
            _("Cancel"),
            () => {
              this.restoreServerGameState();
            },
            { color: "alert" }
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

        if (stateName === "client_placePiece") {
          document.querySelectorAll("[data-cell]").forEach((cellElement) => {
            if (cellElement.querySelector("[data-piece]")) {
              return;
            }

            cellElement.classList.add("orp_cell-selectable");
            cellElement.onclick = () => {
              const pieceElement = this.orp.globals.pieceElement;

              const innerCellElement =
                cellElement.querySelector(".orp_innerCell");
              if (
                innerCellElement &&
                innerCellElement.dataset.color != pieceElement.dataset.color
              ) {
                this.showMessage(
                  _("This position has been confirmed as other color"),
                  "error"
                );
                return;
              }

              cellElement.insertAdjacentElement("afterbegin", pieceElement);
              this.attachControls(pieceElement);

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

    setupBoard: function () {
      document.querySelectorAll("[data-cell]").forEach((cellElement) => {
        const x = cellElement.dataset.cell.split("-")[0];
        const y = cellElement.dataset.cell.split("-")[1];
        cellElement.style.gridArea = `${y}/${x}`;
      });
    },

    revealBoard: function ({ board, coloredBoard }) {
      Object.keys(board).forEach((x) => {
        const row = board[x];
        Object.keys(row).forEach((y) => {
          document
            .querySelector(`[data-cell="${x}-${y}"]`)
            .querySelector("[data-piece]")
            ?.remove();

          const piece = Number(row[y]);
          const color_id = coloredBoard[x][y];
          this.insertPieceElement({ piece, color_id, x, y });
        });
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

            this.statusBar.addActionButton(
              _("Confirm selection"),
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
              _("Confirm selection"),
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
        let color = location.color;
        const { x, y } = location;

        if (!color) {
          color = this.orp.info.colors[0];
        }

        const innerCellHTML = `<div id="orp_innerCell-${x}-${y}" class="orp_innerCell" 
        data-color="${color.id}" style="background-color: ${color.code}; border-color: ${color.code}"></div>`;

        const cellElement = document.querySelector(`[data-cell="${x}-${y}"]`);
        cellElement.childNodes.forEach((pieceElement) => {
          if (pieceElement.dataset.color != color.id) {
            pieceElement.remove();
          }
        });

        cellElement.insertAdjacentHTML("beforeend", innerCellHTML);

        const color_label = color.id == 0 ? _("nothing") : color.label;
        this.addTooltip(`orp_innerCell-${x}-${y}`, _(color_label), "");
      });
    },

    styleWaveFeedback: function (revealedOrigins) {
      revealedOrigins.forEach((feedback) => {
        const { origin, color } = feedback;

        if (!origin) {
          return;
        }

        const originElement = document.querySelector(
          `[data-origin="${origin}"]`
        );

        originElement.style.backgroundColor = color.code;
        originElement.style.textShadow = "none";
        this.addTooltip(originElement.id, _(color.label), "");
      });
    },

    insertPieceElement: function ({ piece, color_id, x, y }) {
      if (piece > 0) {
        const uid = this.getUniqueId();

        const pieceElement = document.createElement("div");
        pieceElement.id = `orp_piece-${uid}`;
        pieceElement.dataset.piece = piece;
        pieceElement.dataset.color = color_id;
        pieceElement.classList.add("orp_piece");
        pieceElement.classList.add(`orp_piece-${piece}`);

        const color = this.orp.info.colors[color_id];

        pieceElement.style.setProperty("--pieceColor", color.code);
        pieceElement.style.setProperty("--pieceColorDarker", color.darkerCode);

        const cellElement = document.querySelector(`[data-cell="${x}-${y}"]`);
        cellElement.insertAdjacentElement("afterbegin", pieceElement);

        this.attachControls(pieceElement);
      }
    },

    setupSolutionPieces: function () {
      const solutionPiecesElement =
        document.getElementById("orp_solutionPieces");

      this.orp.info.gemstones.forEach((gemstone, index) => {
        const gemstone_id = index + 1;

        solutionPiecesElement.insertAdjacentHTML(
          "beforeend",
          `<div id="orp_gemstone-${gemstone_id}" data-gemstone="${gemstone_id}"></div>`
        );

        gemstone.format[0].forEach((row) => {
          const gemstoneElement = document.getElementById(
            `orp_gemstone-${gemstone_id}`
          );
          gemstoneElement.classList.add("orp_gemstone");
          gemstoneElement.style.gridTemplateColumns = `repeat(${gemstone.columns}, var(--cellWidth))`;
          gemstoneElement.style.gridTemplateRows = `repeat(${gemstone.rows}, var(--cellWidth))`;

          row.forEach((piece) => {
            const pieceElement = document.createElement("div");
            gemstoneElement.insertAdjacentElement("beforeend", pieceElement);
            pieceElement.classList.add("orp_piece");

            if (piece === 0) {
              pieceElement.classList.add("orp_piece-empty");
            }

            const color_id = gemstone.color;
            const color = this.orp.info.colors[color_id];

            pieceElement.dataset.color = color_id;
            pieceElement.dataset.piece = piece;

            pieceElement.style.setProperty("--pieceColor", color.code);
            pieceElement.style.setProperty(
              "--pieceColorDarker",
              color.darkerCode
            );

            if (piece < 5) {
              pieceElement.classList.add("orp_piece-half");
            }
          });
        });
      });
    },

    attachControls: function (pieceElement) {
      const color_id = pieceElement.dataset.color;
      const color = this.orp.info.colors[color_id];
      this.addTooltip(pieceElement.id, _(color.label), "");

      let piece = pieceElement.dataset.piece;
      const uid = pieceElement.id.split("-")[1];

      this.statusBar.addActionButton(
        `<i class="fa fa-trash fa-inverse" aria-hidden="true"></i>`,
        () => {
          pieceElement.remove();
        },
        {
          id: `orp_pieceButton-delete-${uid}`,
          title: _("Delete piece"),
          classes: ["orp_pieceButton-delete", "orp_pieceButton"],
          color: "alert",
          destination: pieceElement,
        }
      );

      if (piece < 5) {
        pieceElement.classList.add("orp_piece-half");

        this.statusBar.addActionButton(
          `<i class="fa fa-undo fa-inverse" aria-hidden="true"></i>`,
          () => {
            piece++;
            if (piece > 4) {
              piece = 1;
            }

            pieceElement.dataset.piece = piece;
          },
          {
            id: `orp_pieceButton-rotate-${uid}`,
            title: _("Rotate piece"),
            classes: ["orp_pieceButton-rotate", "orp_pieceButton"],
            destination: pieceElement,
          }
        );
      }
    },

    setupQuestionLog: function () {
      const questionLog = this.gamedatas.questionLog;
      questionLog.forEach((logLine) => {
        this.insertQuestionLogLine(logLine);
      });

      document.getElementById("orp_questionLogTitle").textContent =
        _("Question Log");

      this.statusBar.addActionButton(
        `<i id="orp_questionLogButton-icon" class="fa fa-eye" aria-hidden="true"></i>`,
        () => {
          document
            .getElementById("orp_questionLog")
            .classList.toggle("orp_questionLog-hidden");

          const logButtonIcon = document.getElementById(
            "orp_questionLogButton-icon"
          );
          logButtonIcon.classList.toggle("fa-eye");
          logButtonIcon.classList.toggle("fa-eye-slash");
        },
        {
          id: "orp_questionLogButton",
          title: _("Show/hide question log"),
          classes: ["orp_questionLogButton"],
          destination: document.getElementById("orp_gameArea"),
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
        logLineHTML = `<div class="orp_logLine">Position <span class="orp_logHighlight">${x}${y}</span>: 
      <span class="orp_logHighlight" style="background-color: ${
        color.code
      }; color: ${textColor}">${_(color.label)}</span></div>`;
      }

      questionLogElement.insertAdjacentHTML("afterbegin", logLineHTML);
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
      this.performAction("actSendWave", { origin });
    },

    actClearSolution: function () {
      document
        .getElementById("orp_board")
        .querySelectorAll("[data-piece]")
        .forEach((pieceElement) => {
          pieceElement.remove();
        });

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
            const [x, y] = cellElement.dataset.cell.split("-");
            const piece = pieceElement.dataset.piece;
            const color_id = pieceElement.dataset.color;

            solutionSheet.push({ piece, color_id, x, y });
          }
        });

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

            solutionSheet.push({ piece, color_id, x, y });
          }
        });

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
      const { x, y, color, logLine } = args;
      this.styleLocationFeedback([{ x, y, color }]);
      this.insertQuestionLogLine(logLine);
    },

    notif_returnWave: function (args) {
      const { color, origin, exit, logLine } = args;

      console.log(args);

      this.styleWaveFeedback([
        { origin, color },
        { origin: exit, color },
      ]);

      this.insertQuestionLogLine(logLine);
    },

    notif_incorrectSolution: function (args) {
      const player_id = args.player_id;
      this.orp.managers.counters[player_id].chances.incValue(-1);
    },

    notif_correctSolution: function (args) {
      const { board, coloredBoard } = args;
      this.revealBoard({
        board,
        coloredBoard,
      });
    },

    format_string_recursive(log, args) {
      try {
        if (log && args && !args.processed) {
          args.processed = true;

          if (args.color_label && args.color) {
            const color = args.color.contrast === "light" ? "black" : "white";

            args.color_label = `<span class="orp_logHighlight" style="color: ${color}; background-color: ${
              args.color.code
            }; padding: 0 4px;">${_(args.color_label)}</span>`;
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
