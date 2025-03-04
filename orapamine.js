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

          this.statusBar.addActionButton(
            _("Ask about specific position"),
            () => {
              this.setClientState("client_askLocation", {
                client_args: { selectableLocations: selectableLocations },
              });
            }
          );
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
      }
    },

    onLeavingState: function (stateName) {
      console.log("Leaving state: " + stateName);

      this.setSelectableLocations(null, true);
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
            cellElement.classList.add("orp_occupied");

            const color_id = coloredBoard[x][y];
            const color = this.orp.info.colors[color_id];

            cellElement.style.setProperty("--pieceColor", color.code);
            cellElement.style.setProperty(
              "--pieceColorDarker",
              color.darkerCode
            );

            if (cell < 5) {
              cellElement.classList.add("orp_half");
              cellElement.classList.add(`orp_half-${cell}`);
            }
          }
        });
      });
    },

    setSelectableLocations: function (selectableLocations, unset = false) {
      document.querySelectorAll("[data-cell]").forEach((cellElement) => {
        if (unset) {
          cellElement.classList.remove("orp_cell-selectable");
          cellElement.classList.remove("orp_cell-unselectable");
          cellElement.classList.remove("orp_cell-selected");
          cellElement.onclick = undefined;
          return;
        }

        const location = cellElement.dataset.cell;
        if (selectableLocations.includes(location)) {
          cellElement.classList.add("orp_cell-selectable");
          cellElement.onclick = () => {
            document.getElementById("orp_confirmBtn")?.remove();

            document
              .querySelectorAll(".orp_cell-selected")
              .forEach((siblingElement) => {
                if (siblingElement.id !== cellElement.id) {
                  siblingElement.classList.remove("orp_cell-selected");
                }
              });
            cellElement.classList.toggle("orp_cell-selected");

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

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    setupNotifications: function () {
      console.log("notifications subscriptions setup");
    },

    format_string_recursive(log, args) {
      try {
        if (log && args && !args.processed) {
          args.processed = true;

          if (args.color_label && args.colorCode) {
            const backgroundColor =
              args.color_label === "white" ? "black" : "white";

            args.color_label = `<span class="orp_logHighlight" style="color: ${
              args.colorCode
            }; background-color: ${backgroundColor}">${_(
              args.color_label
            )}</span>`;
          }

          if (args.x) {
            args.x = `<span class="orp_logHighlight">${args.x}</span>`;
          }

          if (args.y) {
            args.y = `<span class="orp_logHighlight">${args.y}</span>`;
          }
        }
      } catch (e) {
        console.error(log, args, "Exception thrown", e.stack);
      }

      return this.inherited(arguments);
    },
  });
});
