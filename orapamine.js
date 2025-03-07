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
        },
      };

      this.setupBoard();
      // this.revealBoard({
      //   board: gamedatas.board,
      //   coloredBoard: gamedatas.coloredBoard,
      // })

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

          this.statusBar.addActionButton(
            _("Ask about specific position"),
            () => {
              this.setClientState("client_askLocation", {
                client_args: { selectableLocations: selectableLocations },
              });
            }
          );

          this.statusBar.addActionButton(_("Send ultrasound wave"), () => {
            this.setClientState("client_sendWave", {
              client_args: { selectableOrigins: selectableOrigins },
            });
          });
        }

        if (stateName === "client_askLocation") {
          const selectableLocations = args.client_args.selectableLocations;

          this.statusBar.addActionButton(
            _("Cancel"),
            () => {
              this.restoreServerGameState();
            },
            { color: "alert" }
          );
          this.setSelectableLocations(selectableLocations);
        }

        if (stateName === "client_sendWave") {
          const selectableOrigins = args.client_args.selectableOrigins;

          this.statusBar.addActionButton(
            _("Cancel"),
            () => {
              this.restoreServerGameState();
            },
            { color: "alert" }
          );
          this.setSelectableOrigins(selectableOrigins);
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
          const cell = row[y];

          if (cell > 0) {
            const cellElement = document.querySelector(
              `[data-cell="${x}-${y}"]`
            );
            cellElement.classList.add("orp_cell-occupied");

            const color_id = coloredBoard[x][y];
            const color = this.orp.info.colors[color_id];

            cellElement.style.setProperty("--pieceColor", color.code);
            cellElement.style.setProperty(
              "--pieceColorDarker",
              color.darkerCode
            );

            if (cell < 5) {
              cellElement.classList.add("orp_cell-half");
              cellElement.classList.add(`orp_cell-half-${cell}`);
            }
          }
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

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    setupNotifications: function () {
      console.log("notifications subscriptions setup");
      this.bgaSetupPromiseNotifications();
    },

    notif_answerLocation: function (args) {
      let color = args.color;
      const { x, y } = args;

      if (!color) {
        color = this.orp.info.colors[0];
      }

      const cellElement = document.querySelector(`[data-cell="${x}-${y}"]`);

      const innerCellElement = document.createElement("div");
      innerCellElement.id = `orp_innerCell-${x}-${y}`;
      innerCellElement.style.backgroundColor = color.code;
      innerCellElement.classList.add("orp_innerCell");

      cellElement.appendChild(innerCellElement);
      this.addTooltip(innerCellElement.id, _(color.label), "");
    },

    notif_returnWave: function (args) {
      const { color, origin, exit } = args;

      const originElement = document.querySelector(`[data-origin="${origin}"]`);
      originElement.style.backgroundColor = color.code;
      originElement.style.textShadow = "none";
      this.addTooltip(originElement.id, _(color.label), "");

      if (exit && origin !== exit) {
        const exitElement = document.querySelector(`[data-origin="${exit}"]`);
        exitElement.style.backgroundColor = color.code;
        exitElement.style.textShadow = "none";
        this.addTooltip(exitElement.id, _(color.label), "");
      }
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
