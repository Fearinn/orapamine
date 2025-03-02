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

      this.setupBoard(gamedatas);

      // Setup game notifications to handle (see "setupNotifications" method below)
      this.setupNotifications();
      console.log("Ending game setup");
    },

    ///////////////////////////////////////////////////
    //// Game & client states

    onEnteringState: function (stateName, args) {
      console.log("Entering state: " + stateName, args);

      switch (stateName) {
        case "dummy":
          break;
      }
    },

    onLeavingState: function (stateName) {
      console.log("Leaving state: " + stateName);

      switch (stateName) {
        case "dummy":
          break;
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

    setupBoard: function (gamedatas) {
      document.querySelectorAll("[data-cell]").forEach((cellElement) => {
        const x = cellElement.dataset.cell.split("-")[0];
        const y = cellElement.dataset.cell.split("-")[1];
        cellElement.style.gridArea = `${y}/${x}`;
      });

      Object.keys(gamedatas.board).forEach((x) => {
        const row = gamedatas.board[x];
        Object.keys(row).forEach((y) => {
          const cell = row[y];

          if (cell > 0) {
            const cellElement = document.querySelector(
              `[data-cell="${x}-${y}"]`
            );
            cellElement.classList.add("orp_occupied");

            const color_id = gamedatas.coloredBoard[x][y];
            const color = this.orp.info.colors[color_id];

            cellElement.style.setProperty("--pieceColor", color.code);
            cellElement.style.setProperty("--pieceColorDarker", color.darkerCode);

            if (cell < 5) {
              cellElement.classList.add("orp_half");
              cellElement.classList.add(`orp_half-${cell}`);
            }
          }
        });
      });
    },

    ///////////////////////////////////////////////////
    //// Player's actions

    ///////////////////////////////////////////////////
    //// Reaction to cometD notifications

    setupNotifications: function () {
      console.log("notifications subscriptions setup");
    },
  });
});
