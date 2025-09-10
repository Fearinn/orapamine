<?php

/**
 *------
 * BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
 * OrapaMine implementation : © Matheus Gomes matheusgomesforwork@gmail.com
 *
 * This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
 * See http://en.boardgamearena.com/#!doc/Studio for more information.
 * -----
 *
 * states.inc.php
 *
 * OrapaMine game states description
 *
 */

$machinestates = [

    // The initial state. Please do not modify.

    1 => array(
        "name" => "gameSetup",
        "description" => "",
        "type" => "manager",
        "action" => "stGameSetup",
        "transitions" => ["" => 2]
    ),

    // Note: ID=2 => your first state

    2 => [
        "name" => "playerTurn",
        "description" => clienttranslate('${actplayer} may ask a question or submit an answer'),
        "descriptionmyturn" => clienttranslate('${you} may ask a question or submit an answer'),
        "type" => "activeplayer",
        "args" => "arg_playerTurn",
        "action" => "st_playerTurn",
        "possibleactions" => [
            "actAskLocation",
            "actSendWave",
            "actSaveSolution",
            "actSubmitSolution",
        ],
        "transitions" => [
            "submitSolution" => 4,
            "nextPlayer" => 3,
            "zombiePass" => 3,
            "gameEnd" => 99,
        ],
    ],

    3 => [
        "name" => "betweenPlayers",
        "description" => "",
        "type" => "game",
        "action" => "st_betweenPlayers",
        "updateGameProgression" => true,
        "transitions" => [
            "nextPlayer" => 2,
            "gameEnd" => 99,
        ]
    ],

    4 => [
        "name" => "submitSolution",
        "description" => clienttranslate('${actplayer} may submit an answer'),
        "descriptionmyturn" => clienttranslate('${you} may submit an answer'),
        "type" => "activeplayer",
        "possibleactions" => [
            "actPass",
            "actSubmitSolution",
        ],
        "transitions" => [
            "nextPlayer" => 3,
            "zombiePass" => 3,
            "gameEnd" => 99,
        ],
    ],

    // Final state.
    // Please do not modify (and do not overload action/args methods).
    99 => [
        "name" => "gameEnd",
        "description" => clienttranslate("End of game"),
        "type" => "manager",
        "action" => "stGameEnd",
        "args" => "argGameEnd"
    ],

];
