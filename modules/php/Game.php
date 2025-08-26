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
 * Game.php
 *
 * This is the main file for your game logic.
 *
 * In this PHP file, you are going to defines the rules of the game.
 */

declare(strict_types=1);

namespace Bga\Games\OrapaMine;

use Bga\GameFramework\Actions\CheckAction;
use Bga\GameFramework\Actions\Types\IntParam;
use Bga\GameFramework\Actions\Types\JsonParam;
use Bga\GameFramework\Actions\Types\StringParam;

require_once(APP_GAMEMODULE_PATH . "module/table/table.game.php");

const BOARD = "board";
const COLORED_BOARD = "coloredBoard";
const BOARD_REVEALED = "isBoardRevealed";
const PREVIOUS_ANSWERS = "previousAnswers";
const SELECTABLE_LOCATIONS = "selectableLocations";
const SELECTABLE_ORIGINS = "selectableOrigins";
const ORIGIN = "origin";
const REVEALED_LOCATIONS = "revealedLocations";
const REVEALED_ORIGINS = "revealedOrigins";
const SOLUTION_SHEETS = "solutionSheets";
const QUESTION_LOG = "questionLog";
const LAST_ROUND = "lastRound";

class Game extends \Table
{
    private array $GEMSTONES;
    private array $COLORS;
    private array $AXIS_LETTERS;
    private array $ORIGINS;
    private array $DIAMOND;
    private array $BLACKBODY;

    public function __construct()
    {
        parent::__construct();

        require "material.inc.php";

        $this->initGameStateLabels([
            "diamondExpansion" => 100,
            "blackbodyExpansion" => 101,
        ]);

        $this->bSelectGlobalsForUpdate = true;
    }

    /**
     * Player action, example content.
     *
     * In this scenario, each time a player plays a card, this method will be called. This method is called directly
     * by the action trigger on the front side with `bgaPerformAction`.
     *
     * @throws BgaUserException
     */


    /**
     * Compute and return the current game progression.
     *
     * The number returned must be an integer between 0 and 100.
     *
     * This method is called each time we are in a game state with the "updateGameProgression" property set to true.
     *
     * @return int
     * @see ./states.inc.php
     */
    public function getGameProgression()
    {
        $questionCount = count($this->globals->get(QUESTION_LOG, []));

        $progression = $questionCount / 10 * 50;

        if ($progression > 50) {
            $progression = 50;
        }

        if ($questionCount > 10) {
            $progression += ($questionCount - 10) / 106 * 49;
        }

        return round($progression);
    }

    /** Game state arguments and actions*/
    public function arg_playerTurn(): array
    {
        $selectableLocations = (array) $this->globals->get(SELECTABLE_LOCATIONS);
        $selectableOrigins = (array) $this->globals->get(SELECTABLE_ORIGINS);

        return [
            "selectableLocations" => array_values($selectableLocations),
            "selectableOrigins" => array_values($selectableOrigins),
            "isLastRound" => $this->globals->get(LAST_ROUND),
        ];
    }

    public function st_playerTurn(): void
    {
        $player_id = (int) $this->getActivePlayerId();

        if ($this->isPlayerEliminated($player_id)) {
            $this->gamestate->nextState("nextPlayer");
        }
    }

    public function st_betweenPlayers(): void
    {
        $player_id = (int) $this->getActivePlayerId();
        $this->giveExtraTime($player_id);
        $this->incTurnsPlayed($player_id);

        $lastRound = $this->globals->get(LAST_ROUND);
        if ($lastRound) {
            $players = $this->loadPlayersBasicInfos();

            $this->notify->all(
                "disablePanel",
                "",
                ["player_id" => $player_id]
            );

            $endGame = true;
            foreach ($players as $player_id => $player) {
                $turnsPlayed = $this->getTurnsPlayed($player_id);

                if ($turnsPlayed < $lastRound) {
                    $endGame = false;
                    break;
                }
            }

            if ($endGame) {
                $this->revealBoard();
                $this->gamestate->nextState("gameEnd");
            }
        }

        $player_id = (int) $this->getActivePlayerId();
        $this->activeNextPlayer();

        if ($this->isPlayerEliminated($player_id) || $this->isCurrentPlayerZombie()) {
            $this->gamestate->nextState("nextPlayer");
            return;
        }

        $eliminatedPlayersCount = (int) $this->getUniqueValueFromDB("SELECT COUNT(player_eliminated) FROM player 
        WHERE player_eliminated=1");
        $playerChances = (int) $this->getUniqueValueFromDB("SELECT player_chances FROM player WHERE player_id=$player_id");

        $isLastPlayer = $eliminatedPlayersCount + 1 === $this->nz_getPlayersNumber();

        if ($playerChances === 0) {
            if ($isLastPlayer) {
                $this->revealBoard();
                $this->gamestate->nextState("gameEnd");
                return;
            }

            $this->eliminatePlayer($player_id);
        }

        $this->gamestate->nextState("nextPlayer");
    }

    /** Player actions */

    public function checkVersion(?int $CLIENT_VERSION): void
    {
        if ($CLIENT_VERSION === null) {
            return;
        }

        $SERVER_VERSION = (int) $this->gamestate->table_globals[300];
        if ($CLIENT_VERSION !== $SERVER_VERSION) {
            throw new \BgaUserException(clienttranslate("A new version of this game is now available. Please reload the page (F5)."));
        }
    }

    public function actAskLocation(
        ?int $CLIENT_VERSION,
        #[IntParam(min: 1, max: 10)] int $guess_x,
        #[IntParam(min: 1, max: 8)] int $guess_y
    ): void {
        $this->checkVersion($CLIENT_VERSION);
        $player_id = (int) $this->getActivePlayerId();

        if ($this->globals->get(LAST_ROUND)) {
            throw new \BgaVisibleSystemException("You can't ask a question in the last round");
        }

        $coloredBoard = $this->globals->get(COLORED_BOARD);
        $this->updateSelectableLocations("{$guess_x}-{$guess_y}");

        $letter_y = (string) $this->AXIS_LETTERS["y"][$guess_y];

        $this->notify->all(
            "askLocation",
            clienttranslate('${player_name}: what is at position ${log_x}${log_y}?'),
            [
                "player_id" => $player_id,
                "player_name" => $this->getPlayerNameById($player_id),
                "log_x" => $guess_x,
                "log_y" => $letter_y,
            ]
        );

        $this->incStat(1, "locationsAsked", $player_id);

        $color_id = $coloredBoard[$guess_x][$guess_y];

        if ($color_id > 0) {
            if ($color_id === 16) {
                $message = clienttranslate('The signal was absorbed');
            } else {
                $message = clienttranslate('${log_x}${log_y}: ${color_label} gem');
            }
            $color = (array) $this->COLORS[$color_id];
            $color_label = (string) $color["label"];
        } else {
            $message = clienttranslate('${log_x}${log_y}: nothing is there');
            $color = null;
            $color_label = null;
        }

        $revealedLocations = $this->globals->get(REVEALED_LOCATIONS, []);
        $revealedLocations[] = ["x" => $guess_x, "y" => $guess_y, "color_id" => $color_id];
        $this->globals->set(REVEALED_LOCATIONS, $revealedLocations);

        $questionLog = $this->globals->get(QUESTION_LOG, []);
        $logLine = ["type" => "location", "x" => $guess_x, "y" => $letter_y, "color_id" => $color_id];
        $questionLog[] = $logLine;
        $this->globals->set(QUESTION_LOG, $questionLog);

        $this->notify->all(
            "answerLocation",
            $message,
            [
                "color_id" => $color_id,
                "x" => $guess_x,
                "y" => $guess_y,
                "logLine" => $logLine,
                "preserve" => ["color_id"],
                "log_x" => $guess_x,
                "log_y" => $letter_y,
                "color_label" => $color_label,
                "i18n" => ["color_label"],
            ]
        );

        $this->gamestate->nextState("nextPlayer");
    }

    public function actSendWave(?int $CLIENT_VERSION, #[StringParam(
        enum: [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J",
            "K",
            "L",
            "M",
            "N",
            "O",
            "P",
            "Q",
            "R",
            1,
            2,
            3,
            4,
            5,
            6,
            7,
            8,
            9,
            10,
            11,
            12,
            13,
            14,
            15,
            16,
            17,
            18
        ]
    )] string $origin): void
    {
        $this->checkVersion($CLIENT_VERSION);
        $player_id = (int) $this->getActivePlayerId();

        if ($this->globals->get(LAST_ROUND)) {
            throw new \BgaVisibleSystemException("You can't ask a question in the last round");
        }

        $this->globals->set(ORIGIN, $origin);

        [$origin_x, $origin_y] = $this->ORIGINS[$origin]["location"];
        $direction_id = $this->ORIGINS[$origin]["direction"];

        $this->notify->all(
            "sendWave",
            clienttranslate('${player_name} sends a wave from ${log_origin}'),
            [
                "player_id" => $player_id,
                "player_name" => $this->getPlayerNameById($player_id),
                "log_origin" => $origin,
            ]
        );

        $this->incStat(1, "wavesSent", $player_id);

        $visitedColors = [];
        $this->sendWave($origin_x, $origin_y, $direction_id, $visitedColors, $origin);

        $this->gamestate->nextState("nextPlayer");
    }

    #[CheckAction(false)]
    public function actClearSolution(?int $CLIENT_VERSION): void
    {
        $this->checkVersion($CLIENT_VERSION);

        if ($this->gamestate->state_id() === 99) {
            throw new \BgaUserException("This table is finished");
        }

        $player_id = (int) $this->getCurrentPlayerId();

        if ($this->isSpectator()) {
            throw new \BgaVisibleSystemException("Only players may perform this action");
        }

        $solutionSheets = $this->globals->get(SOLUTION_SHEETS);
        $solutionSheets[$player_id] = [];
        $this->globals->set(SOLUTION_SHEETS, $solutionSheets);

        $this->notify->player(
            $player_id,
            "clearSolution",
            "",
        );
    }

    #[CheckAction(false)]
    public function actSaveSolution(?int $CLIENT_VERSION, #[JsonParam(alphanum: true)] array $solutionSheet): void
    {
        $this->checkVersion($CLIENT_VERSION);

        if ($this->gamestate->state_id() === 99) {
            throw new \BgaUserException("This table is finished");
        }

        $player_id = (int) $this->getCurrentPlayerId();

        if ($this->isSpectator()) {
            throw new \BgaVisibleSystemException("Only players may perform this action");
        }

        $solutionSheets = $this->globals->get(SOLUTION_SHEETS);
        $solutionSheets[$player_id] = $solutionSheet;
        $this->globals->set(SOLUTION_SHEETS, $solutionSheets);

        $this->notify->player(
            $player_id,
            "saveSolution",
            "",
            [
                "solutionSheet" => $solutionSheet,
            ]
        );
    }

    public function actSubmitSolution(int $CLIENT_VERSION, #[JsonParam(alphanum: true)] array $solutionSheet): void
    {
        $this->checkVersion($CLIENT_VERSION);

        if (!$this->isValidSolution($solutionSheet)) {
            throw new \BgaUserException(clienttranslate("Please build a valid solution sheet before submitting an answer"));
        };

        $player_id = (int) $this->getActivePlayerId();

        $board = $this->globals->get(BOARD);
        $coloredBoard = $this->globals->get(COLORED_BOARD);

        $previousAnswers = $this->globals->get(PREVIOUS_ANSWERS);

        foreach ($previousAnswers[$player_id] as $answer) {
            $isEqual = true;

            foreach ($answer as $answer_cell) {
                $x = (int) $answer_cell["x"];
                $y = (int) $answer_cell["y"];
                $piece = (int) $answer_cell["piece"];
                $color_id = (int) $answer_cell["color_id"];

                $hasMatch = false;
                foreach ($solutionSheet as $cell) {
                    if (
                        (int) $cell["x"] === $x &&
                        (int) $cell["y"] === $y
                    ) {
                        $hasMatch = true;

                        if (
                            (int) $cell["piece"] !== $piece ||
                            (int) $cell["color_id"] !== $color_id
                        ) {
                            $hasMatch = false;
                        }

                        break;
                    }
                }

                if (!$hasMatch) {
                    $isEqual = false;
                    break;
                }
            }

            if ($isEqual) {
                throw new \BgaUserException(clienttranslate("You've already submitted this answer. It's incorrect!"));
            }
        }

        $solutionSheets = $this->globals->get(SOLUTION_SHEETS);
        $solutionSheets[$player_id] = $solutionSheet;
        $this->globals->set(SOLUTION_SHEETS, $solutionSheets);

        $previousAnswers[$player_id][] = $solutionSheet;
        $this->globals->set(PREVIOUS_ANSWERS, $previousAnswers);

        $this->notify->player(
            $player_id,
            "submitSolution",
            "",
            [
                "player_id" => $player_id,
                "answer" => $solutionSheet,
            ]
        );

        $isCorrect = true;

        foreach ($solutionSheet as $cell) {
            $x = (int) $cell["x"];
            $y = (int) $cell["y"];
            $color_id = (int) $cell["color_id"];
            $piece = (int) $cell["piece"];

            if ($board[$x][$y] !== $piece || $coloredBoard[$x][$y] !== $color_id) {
                $isCorrect = false;
                break;
            }
        }

        if ($isCorrect) {
            $this->notify->all(
                "correctSolution",
                clienttranslate('${player_name} gives the correct answer'),
                [
                    "player_id" => $player_id,
                    "player_name" => $this->getPlayerNameById($player_id),
                ]
            );

            $this->setStat(100, "win%", $player_id);
            $this->DbQuery("UPDATE player SET player_score=1 WHERE player_id=$player_id");

            if (!$this->globals->get(LAST_ROUND)) {
                $showColumns = $this->getUniqueValueFromDB("SHOW COLUMNS FROM `player` LIKE 'player_turns'");

                if (!$showColumns) {
                    $this->revealBoard();
                    $this->gamestate->nextState("gameEnd");
                    return;
                }

                $turnsPlayed = $this->getTurnsPlayed($player_id) + 1;
                $this->globals->set(LAST_ROUND, $turnsPlayed);

                $this->notify->all(
                    "lastRound",
                    clienttranslate('This is the last round'),
                    []
                );
            }

            $this->gamestate->nextState("nextPlayer");
            return;
        }

        $this->notify->all(
            "incorrectSolution",
            clienttranslate('${player_name} gives an incorrect answer and loses one chance'),
            [
                "player_id" => $player_id,
                "player_name" => $this->getPlayerNameById($player_id),
            ]
        );

        $this->incStat(1, "chancesLost", $player_id);
        $this->DbQuery("UPDATE player SET player_chances=player_chances-1 where player_id=$player_id");

        $this->gamestate->nextState("nextPlayer");
    }

    /** Utility methods */
    public function GEMSTONES(): array
    {
        $gemstones = $this->GEMSTONES;

        $diamondExpansion = (int) $this->getGameStateValue("diamondExpansion") === 1;
        $blackbodyExpansion = (int) $this->getGameStateValue("blackbodyExpansion") === 1;

        if ($diamondExpansion) {
            $gemstones[6] = (array) $this->DIAMOND;
        }

        if ($blackbodyExpansion) {
            $gemstones[7] = (array) $this->BLACKBODY;
        }

        return $gemstones;
    }

    public function isPlayerEliminated(int $player_id): bool
    {
        return !!$this->getUniqueValueFromDB("SELECT player_eliminated FROM player WHERE player_id={$player_id}");
    }

    public function nz_getPlayersNumber(): int
    {
        return (int) $this->getUniqueValueFromDB("SELECT COUNT(player_id) FROM player WHERE player_zombie=0");
    }

    public function setupBoard(): void
    {
        $board = array_fill(1, 10, array_fill(1, 8, 0));
        $gemstoneBoard = array_fill(1, 10, array_fill(1, 8, 0));

        $gemstones = $this->GEMSTONES();
        shuffle($gemstones);

        if (!$this->placeGemstones($board, $gemstoneBoard, $gemstones)) {
            $this->setupBoard();
        };

        $coloredBoard = [];
        foreach ($gemstoneBoard as $x => $row) {
            foreach ($row as $y => $gemstone_id) {
                $color_id = $gemstone_id > 0 ? (int) $this->GEMSTONES()[$gemstone_id]["color"] : 0;
                $coloredBoard[$x][$y] = $color_id;
            }
        }

        $this->globals->set(BOARD, $board);
        $this->globals->set(COLORED_BOARD, $coloredBoard);
        $this->globals->set(BOARD_REVEALED, false);
    }

    public function isValidPlacement(array $board, array $gemstoneBoard, array $gemstone, int $base_x, int $base_y, int $rotation): bool
    {
        if ($board[$base_x][$base_y] > 0) {
            return false;
        }

        $format = (array) $gemstone["format"][$rotation];
        $gemstone_id = (int) $gemstone["id"];
        $gemstoneHidden = true;

        $piece_y = $base_y;
        foreach ($format as $row) {
            $piece_x = $base_x;

            foreach ($row as $piece) {
                if (!isset($board[$piece_x][$piece_y]) || $board[$piece_x][$piece_y] > 0) {
                    return false;
                }

                // Define allowed adjacency based on direction
                $allowedNeighbors = [];
                if ($piece === 1) { // ↖ top-left
                    $allowedNeighbors = [[$piece_x - 1, $piece_y], [$piece_x, $piece_y - 1]];
                } elseif ($piece === 2) { // ↗ top-right
                    $allowedNeighbors = [[$piece_x + 1, $piece_y], [$piece_x, $piece_y - 1]];
                } elseif ($piece === 3) { // ↙ bottom-left
                    $allowedNeighbors = [[$piece_x - 1, $piece_y], [$piece_x, $piece_y + 1]];
                } elseif ($piece === 4) { // ↘ bottom-right
                    $allowedNeighbors = [[$piece_x + 1, $piece_y], [$piece_x, $piece_y + 1]];
                }

                // Check for disallowed lateral adjacency
                $adjacent_positions = [
                    [$piece_x - 1, $piece_y], // Left
                    [$piece_x + 1, $piece_y], // Right
                    [$piece_x, $piece_y - 1], // Up
                    [$piece_x, $piece_y + 1]  // Down
                ];

                foreach ($adjacent_positions as [$adj_x, $adj_y]) {
                    if (isset($board[$adj_x][$adj_y]) && $board[$adj_x][$adj_y] > 0) {
                        if ($gemstoneBoard[$adj_x][$adj_y] === $gemstone_id) {
                            continue; // Same color is allowed
                        }

                        $is_allowed = false;
                        foreach ($allowedNeighbors as [$allowed_x, $allowed_y]) {
                            if ($adj_x === $allowed_x && $adj_y === $allowed_y) {
                                $is_allowed = true;
                                break;
                            }
                        }
                        if (!$is_allowed) {
                            return false; // Invalid lateral adjacency
                        }
                    }
                }

                $board[$piece_x][$piece_y] = $piece;
                $gemstoneBoard[$piece_x][$piece_y] = $gemstone_id;

                for ($x = $piece_x; $x <= 10; $x++) {
                    if ($board[$x][$piece_y] === 0) {
                        $gemstoneHidden = false;
                    }
                }

                for ($x = $piece_x; $x >= 1; $x--) {
                    if ($board[$x][$piece_y] === 0) {
                        $gemstoneHidden = false;
                    }
                }

                for ($y = $piece_y; $y <= 8; $y++) {
                    if ($board[$piece_x][$y] === 0) {
                        $gemstoneHidden = false;
                    }
                }

                for ($y = $piece_y; $y >= 1; $y--) {
                    if ($board[$piece_x][$y] === 0) {
                        $gemstoneHidden = false;
                    }
                }

                $piece_x++;
            }
            $piece_y++;
        }

        if ($gemstoneHidden) {
            return false;
        }

        return true;
    }

    public function arrangePieces(array &$board, array &$gemstoneBoard, array $gemstone, int $base_x, int $base_y, int $rotation): void
    {
        $format = (array) $gemstone["format"][$rotation];

        $piece_y = $base_y;
        foreach ($format as $row) {
            $piece_x = $base_x;

            foreach ($row as $piece) {
                if ($piece > 0) {
                    $board[$piece_x][$piece_y] = $piece;
                    $gemstoneBoard[$piece_x][$piece_y] = (int) $gemstone["id"];
                }

                $piece_x++;
            }

            $piece_y++;
        }
    }

    public function removePieces(array &$board, array &$gemstoneBoard, array $gemstone, int $base_x, int $base_y, int $rotation): void
    {
        $format = (array) $gemstone["format"][$rotation];

        $piece_y = $base_y;
        foreach ($format as $row) {
            $piece_x = $base_x;

            foreach ($row as $piece) {
                $board[$piece_x][$piece_y] = 0;
                $gemstoneBoard[$piece_x][$piece_y] = 0;
                $piece_x++;
            }

            $piece_y++;
        }
    }

    public function placeGemstones(array &$board, array  &$gemstoneBoard, array &$gemstones, int $index = 0): bool
    {
        if ($index > count($gemstones) - 1) {
            return true;
        }

        $possible_x = [];
        $possible_y = [];
        foreach ($board as $x => $row) {
            foreach ($row as $y => $piece) {
                if ($piece === 0) {
                    $possible_x[] = $x;
                    $possible_y[] = $y;
                }
            }
        }

        shuffle($possible_x);
        shuffle($possible_y);

        $rotations = [0, 90, 180, 270];
        shuffle($rotations);

        $gemstone = (array) $gemstones[$index];

        foreach ($rotations as $rotation) {
            foreach ($possible_x as $x) {
                foreach ($possible_y as $y) {
                    if ($this->isValidPlacement($board, $gemstoneBoard, $gemstone, $x, $y, $rotation)) {
                        $this->arrangePieces($board, $gemstoneBoard, $gemstone, $x, $y, $rotation);

                        if ($this->placeGemstones($board, $gemstoneBoard, $gemstones, $index + 1)) {
                            return true;
                        }

                        $this->removePieces($board, $gemstoneBoard, $gemstone, $x, $y, $rotation);
                    }
                }
            }
        }

        return false;
    }

    public function updateSelectableLocations(string $removedLocation, ?bool $setup = false): void
    {
        $selectableLocations = [];
        if ($setup) {
            $board = $this->globals->get(BOARD);
            foreach ($board as $x => $row) {
                foreach ($row as $y => $cell) {
                    $selectableLocations["{$x}-{$y}"] = "{$x}-{$y}";
                }
            }

            $this->globals->set(SELECTABLE_LOCATIONS, $selectableLocations);
            return;
        }

        $selectableLocations = $this->globals->get(SELECTABLE_LOCATIONS);

        if (!in_array($removedLocation, $selectableLocations)) {
            throw new \BgaVisibleSystemException("This location had already been checked");
        }

        unset($selectableLocations[$removedLocation]);
        $this->globals->set(SELECTABLE_LOCATIONS, $selectableLocations);
    }

    public function sendWave(int $origin_x, int $origin_y, int $direction_id, array &$visitedColors, ?string $origin = null): void
    {
        $board = $this->globals->get(BOARD);
        $coloredBoard = $this->globals->get(COLORED_BOARD);

        if ($origin_x < 1 || $origin_x > 10 || $origin_y < 1 || $origin_y > 8) {
            $this->returnWave($origin_x, $origin_y, $direction_id, $visitedColors);
            return;
        }

        if ($origin) {
            $piece = $board[$origin_x][$origin_y];

            if ($piece > 0) {
                $newDirection_id = $this->DIRECTIONS[$direction_id]["conversions"][$piece];

                if (($direction_id === 1 && $newDirection_id === 2) ||
                    ($direction_id === 2 && $newDirection_id === 1) ||
                    ($direction_id === 3 && $newDirection_id === 4) ||
                    ($direction_id === 4 && $newDirection_id === 3)
                ) {
                    $color_id = $coloredBoard[$origin_x][$origin_y];
                    $visitedColors = [$color_id];
                    $this->returnWave($origin_x, $origin_y, $newDirection_id, $visitedColors);
                    return;
                }
            }
        }

        if ($direction_id === 1) {
            for ($x = $origin_x; $x <= 10; $x++) {
                $piece = $board[$x][$origin_y];

                if ($piece > 0) {
                    $this->reflectWave($x, $origin_y, $direction_id, $visitedColors);
                    return;
                }

                if ($x === 10) {
                    $this->returnWave($x, $origin_y, $direction_id, $visitedColors);
                    return;
                }
            }
        }

        if ($direction_id === 2) {
            for ($x = $origin_x; $x >= 1; $x--) {
                $piece = $board[$x][$origin_y];

                if ($piece > 0) {
                    $this->reflectWave($x, $origin_y, $direction_id, $visitedColors);
                    return;
                }

                if ($x === 1) {
                    $this->returnWave($x, $origin_y, $direction_id, $visitedColors);
                    return;
                }
            }
        }

        if ($direction_id === 3) {
            for ($y = $origin_y; $y >= 1; $y++) {
                $piece = $board[$origin_x][$y];

                if ($piece > 0) {
                    $this->reflectWave($origin_x, $y, $direction_id, $visitedColors);
                    return;
                }

                if ($y === 8) {
                    $this->returnWave($origin_x, $y,  $direction_id, $visitedColors);
                    return;
                }
            }
        }

        if ($direction_id === 4) {
            for ($y = $origin_y; $y >= 1; $y--) {
                $piece = $board[$origin_x][$y];

                if ($piece > 0) {
                    $this->reflectWave($origin_x, $y, $direction_id, $visitedColors);
                    return;
                }

                if ($y === 1) {
                    $this->returnWave($origin_x, $y, $direction_id, $visitedColors);
                    return;
                }
            }
        }

        throw new \BgaVisibleSystemException("Couldn't send wave");
    }

    public function reflectWave(int $x, int $y, int $direction_id, array &$visitedColors): void
    {
        $board = (array) $this->globals->get(BOARD);
        $coloredBoard = (array) $this->globals->get(COLORED_BOARD);

        $color_id = $coloredBoard[$x][$y];
        $visitedColors[] = $color_id;

        if ($color_id === 16) {
            $this->returnWave($x, $y, $direction_id, $visitedColors);
            return;
        }

        $piece = (int) $board[$x][$y];
        $nextDirection_id = (int) $this->DIRECTIONS[$direction_id]["conversions"][$piece];
        $shift = (array) $this->DIRECTIONS[$nextDirection_id]["shift"];

        $next_x = $x + (int) $shift["x"];
        $next_y = $y + (int) $shift["y"];

        $this->sendWave($next_x, $next_y, $nextDirection_id, $visitedColors);
    }

    public function returnWave(int $x, int $y, int $direction_id, array $visitedColors): void
    {
        $response = [];
        $visitedColors = array_unique($visitedColors);
        $visitedColors = array_filter($visitedColors, function ($color_id) {
            return $color_id !== 99;
        });

        if ($x < 1) {
            $x = 1;
        }

        if ($x > 10) {
            $x = 10;
        }

        if ($y < 1) {
            $y = 1;
        }

        if ($y > 8) {
            $y = 8;
        }

        foreach ($this->ORIGINS as $exit_id => $exit) {
            [$exit_x, $exit_y] = (array) $exit["location"];
            $exitDirection_id = $exit["exitDirection"];

            if ($exit_x === $x && $exit_y === $y && $exitDirection_id === $direction_id) {
                $response["exit"] = $exit_id;
                break;
            }
        }

        $blackbodyColor_id = (int) $this->BLACKBODY["color"];

        if (in_array($blackbodyColor_id, $visitedColors)) {
            $origin = (string) $this->globals->get(ORIGIN);
            $logLine = ["type" => "blackbody", "origin" => $origin, "color_id" => $blackbodyColor_id];
            $questionLog = $this->globals->get(QUESTION_LOG, []);
            $questionLog[] = $logLine;
            $this->globals->set(QUESTION_LOG, $questionLog);

            $this->updateSelectableOrigins($origin, $origin);

            $color = $this->COLORS[$blackbodyColor_id];
            $revealedOrigins = $this->globals->get(REVEALED_ORIGINS, []);
            $revealedOrigins[] = ["origin" => $origin, "color_id" => $blackbodyColor_id];
            $this->globals->set(REVEALED_ORIGINS, $revealedOrigins);

            $this->notify->all(
                "returnWave",
                clienttranslate("The wave was absorbed"),
                [
                    "logLine" => $logLine,
                    "color_id" => $blackbodyColor_id,
                    "origin" => $origin,
                    "exit" => $origin,
                ],
            );
            return;
        }

        if (!$visitedColors) {
            $response["color"] = 0;
        } else if (count($visitedColors) === 1) {
            $color_id = reset($visitedColors);
            $response["color"] = $color_id;
        } else {
            sort($visitedColors);
            foreach ($this->COLORS as $color_id => $color) {
                $components = (array) $color["components"];

                if (count($visitedColors) !== count($components)) {
                    continue;
                }

                $isEqual = true;
                for ($i = 0; $i <= count($visitedColors) - 1; $i++) {
                    if ($components[$i] !== $visitedColors[$i]) {
                        $isEqual = false;
                        break;
                    }
                }

                if ($isEqual) {
                    $response["color"] = $color_id;
                    break;
                }
            }
        }

        if (count($response) !== 2) {
            throw new \BgaVisibleSystemException("Failed to determine exit or color");
        }

        $origin = (string) $this->globals->get(ORIGIN);
        $exit_id = (string) $response["exit"];

        $this->updateSelectableOrigins($origin, $exit_id);

        $color_id = (int) $response["color"];
        $color = (array) $this->COLORS[$color_id];

        $revealedOrigins = $this->globals->get(REVEALED_ORIGINS, []);
        $revealedOrigins[] = ["origin" => $origin, "color_id" => $color_id];
        $revealedOrigins[] = ["origin" => $exit_id, "color_id" => $color_id];
        $this->globals->set(REVEALED_ORIGINS, $revealedOrigins);

        $questionLog = $this->globals->get(QUESTION_LOG, []);
        $logLine = ["type" => "wave", "origin" => $origin, "exit" => $exit_id, "color_id" => $color_id];
        $questionLog[] = $logLine;
        $this->globals->set(QUESTION_LOG, $questionLog);

        $this->notify->all(
            "returnWave",
            clienttranslate('The wave exits from ${log_exit} as ${color_label}'),
            [
                "origin" => $origin,
                "exit" => $exit_id,
                "color_id" => $color_id,
                "logLine" => $logLine,
                "preserve" => ["color_id"],
                "log_origin" => $origin,
                "log_exit" => $exit_id,
                "color_label" => (string) $color["label"],
                "i18n" => ["color_label"],
            ]
        );
    }

    public function updateSelectableOrigins(string $removedOrigin, string $removedExit, ?bool $setup = false): void
    {
        if ($setup) {
            $selectableOrigins = array_keys($this->ORIGINS);
            $this->globals->set(SELECTABLE_ORIGINS, $selectableOrigins);
            return;
        }

        $selectableOrigins = $this->globals->get(SELECTABLE_ORIGINS);

        $k_removedOrigin = array_search($removedOrigin, $selectableOrigins);
        $k_removedExit = array_search($removedExit, $selectableOrigins);

        if ($k_removedOrigin === false || $k_removedExit === false) {
            throw new \BgaVisibleSystemException("The wave had already been sent from this origin");
        }

        unset($selectableOrigins[$k_removedOrigin]);
        unset($selectableOrigins[$k_removedExit]);

        $this->globals->set(SELECTABLE_ORIGINS, $selectableOrigins);
    }

    public function isValidSolution(array $solutionSheet): bool
    {
        $gemstones = $this->GEMSTONES();

        $piecesCount = 22;

        if (count($gemstones) >= 6) {
            $piecesCount += 2;
        }

        if (count($gemstones) === 7) {
            $piecesCount += 2;
        }

        if (count($solutionSheet) !== $piecesCount) {
            return false;
        }

        $test_board = array_fill(1, 10, array_fill(1, 8, 0));
        $test_coloredBoard = array_fill(1, 10, array_fill(1, 8, 0));

        foreach ($solutionSheet as $solution) {
            $piece = (int) $solution["piece"];
            $x = (int) $solution["x"];
            $y = (int) $solution["y"];
            $color_id = (int) $solution["color_id"];

            $test_board[$x][$y] = $piece;
            $test_coloredBoard[$x][$y] = $color_id;
        }


        $foundLocation = [];

        foreach ($gemstones as $gemstone) {
            $found = false;
            $format = (array) $gemstone["format"];
            $color_id = (int) $gemstone["color"];

            if (!isset($foundLocation)) {
                $foundLocation[$color_id] = [];
            }

            foreach ($format as $matrix) {
                $rows = count($matrix);
                $cols = count($matrix[0]);

                for ($x = 1; $x <= 10 + 1 - $cols; $x++) {
                    for ($y = 1; $y <= 8 + 1 - $rows; $y++) {
                        if ($this->matchesGemstone($test_board, $test_coloredBoard, $color_id, $matrix, $x, $y) && !isset($foundLocation[$color_id][$x][$y])) {
                            $foundLocation[$color_id][$x][$y] = true;
                            $found = true;
                            break 3;
                        }
                    }
                }
            }

            if (!$found) {
                return false;
            }
        }

        return true;
    }

    public function matchesGemstone(array $board, array $coloredBoard, int $color_id, array $matrix, int $startX, int $startY): bool
    {
        $rows = count($matrix);
        $cols = count($matrix[0]);

        for ($j = 0; $j < $rows; $j++) {
            for ($i = 0; $i < $cols; $i++) {
                if ($matrix[$j][$i] !== 0) {
                    $x = $startX + $i;
                    $y = $startY + $j;

                    if ($x < 1 || $x > 10 || $y < 1 || $y > 8 || !isset($board[$x][$y])) {
                        return false;
                    }

                    if ($board[$x][$y] !== $matrix[$j][$i] || $coloredBoard[$x][$y] !== $color_id) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    public function revealBoard(): void
    {
        $this->notify->all(
            "revealBoard",
            "",
            [
                "board" => $this->globals->get(BOARD),
                "coloredBoard" => $this->globals->get(COLORED_BOARD),
                "previousAnswers" => $this->globals->get(PREVIOUS_ANSWERS),
                "lastSheets" => $this->globals->get(SOLUTION_SHEETS),
            ]
        );

        $this->globals->set(BOARD_REVEALED, true);
    }

    public function getTurnsPlayed(int $player_id): int
    {
        $turnsPlayed = (int) $this->getUniqueValueFromDB("SELECT player_turns FROM player 
        WHERE player_id={$player_id}");
        return $turnsPlayed;
    }

    public function incTurnsPlayed(int $player_id): void
    {
        $showColumns = $this->getUniqueValueFromDB("SHOW COLUMNS FROM `player` LIKE 'player_turns'");
        if (!$showColumns) {
            return;
        }

        $this->DbQuery("UPDATE player SET player_turns=player_turns+1 WHERE player_id={$player_id}");
    }

    /**
     * Migrate database.
     *
     * You don't have to care about this until your game has been published on BGA. Once your game is on BGA, this
     * method is called everytime the system detects a game running with your old database scheme. In this case, if you
     * change your database scheme, you just have to apply the needed changes in order to update the game database and
     * allow the game to continue to run with your new version.
     *
     * @param int $from_version
     * @return void
     */
    public function upgradeTableDb($from_version)
    {
        //       if ($from_version <= 1404301345)
        //       {
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "ALTER TABLE DBPREFIX_xxxxxxx ....";
        //            $this->applyDbUpgradeToAllDB( $sql );
        //       }
        //
        //       if ($from_version <= 1405061421)
        //       {
        //            // ! important ! Use DBPREFIX_<table_name> for all tables
        //
        //            $sql = "CREATE TABLE DBPREFIX_xxxxxxx ....";
        //            $this->applyDbUpgradeToAllDB( $sql );
        //       }
    }

    /*
     * Gather all information about current game situation (visible by the current player).
     *
     * The method is called each time the game interface is displayed to a player, i.e.:
     *
     * - when the game starts
     * - when a player refreshes the game page (F5)
     */
    protected function getAllDatas(): array
    {
        $gamedatas = [];

        // WARNING: We must only return information visible by the current player.
        $current_player_id = (int) $this->getCurrentPlayerId();

        $isBoardRevealed = $this->globals->get(BOARD_REVEALED);

        $gamedatas["players"] = $this->getCollectionFromDb(
            "SELECT `player_id` `id`, `player_score` `score`, `player_chances` `chances` FROM `player`"
        );
        $gamedatas["GAME_VERSION"] = (int) $this->gamestate->table_globals[300];
        $gamedatas["COLORS"] = $this->COLORS;
        $gamedatas["GEMSTONES"] = $this->GEMSTONES();
        $gamedatas["AXIS_LETTERS"] = $this->AXIS_LETTERS;
        $gamedatas["revealedLocations"] = $this->globals->get(REVEALED_LOCATIONS, []);
        $gamedatas["revealedOrigins"] = $this->globals->get(REVEALED_ORIGINS, []);
        $gamedatas["questionLog"] = $this->globals->get(QUESTION_LOG, []);
        $gamedatas["isBoardRevealed"] = $isBoardRevealed;
        $gamedatas["board"] = $isBoardRevealed ? $this->globals->get(BOARD) : [];
        $gamedatas["coloredBoard"] = $isBoardRevealed ? $this->globals->get(COLORED_BOARD) : [];
        $gamedatas["lastSheets"] = $isBoardRevealed ? $this->globals->get(SOLUTION_SHEETS) : [];
        $gamedatas["isLastRound"] = !!$this->globals->get(LAST_ROUND);

        $previousAnswers = $this->globals->get(PREVIOUS_ANSWERS);

        if (!$isBoardRevealed) {
            $previousAnswers = array_filter(
                $previousAnswers,
                function ($player_id) use ($current_player_id) {
                    return $player_id === $current_player_id;
                },
                ARRAY_FILTER_USE_KEY
            );
        }

        $gamedatas["previousAnswers"] = $previousAnswers;

        if (!$this->isSpectator()) {
            $gamedatas["solutionSheet"] = $this->globals->get(SOLUTION_SHEETS)[$current_player_id];
        }



        return $gamedatas;
    }

    /**
     * Returns the game name.
     *
     * IMPORTANT: Please do not modify.
     */
    protected function getGameName()
    {
        return "orapamine";
    }

    /**
     * This method is called only once, when a new game is launched. In this method, you must setup the game
     *  according to the game rules, so that the game is ready to be played.
     */
    protected function setupNewGame($players, $options = [])
    {
        // Set the colors of the players with HTML color code. The default below is red/green/blue/orange/brown. The
        // number of colors defined here must correspond to the maximum number of players allowed for the gams.
        $gameinfos = $this->getGameinfos();
        $default_colors = $gameinfos['player_colors'];

        foreach ($players as $player_id => $player) {
            $query_values[] = vsprintf("('%s', '%s', '%s', '%s', '%s')", [
                $player_id,
                array_shift($default_colors),
                $player["player_canal"],
                addslashes($player["player_name"]),
                addslashes($player["player_avatar"]),
            ]);
        }

        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES %s",
                implode(",", $query_values)
            )
        );

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        $this->setupBoard(true);
        $this->updateSelectableLocations("", true);
        $this->updateSelectableOrigins("", "", true);

        $solutionSheets = [];
        $previousAnswers = [];
        foreach ($players as $player_id => $player) {
            $solutionSheets[$player_id] = [];
            $this->globals->set(SOLUTION_SHEETS, $solutionSheets);

            $previousAnswers[$player_id] = [];
            $this->globals->set(PREVIOUS_ANSWERS, $previousAnswers);

            $this->initStat("player", "win%", 0, $player_id);
            $this->initStat("player", "locationsAsked", 0, $player_id);
            $this->initStat("player", "wavesSent", 0, $player_id);
            $this->initStat("player", "chancesLost", 0, $player_id);
        }

        // Activate first player once everything has been initialized and ready.
        $this->activeNextPlayer();
    }

    /**
     * This method is called each time it is the turn of a player who has quit the game (= "zombie" player).
     * You can do whatever you want in order to make sure the turn of this player ends appropriately
     * (ex: pass).
     *
     * Important: your zombie code will be called when the player leaves the game. This action is triggered
     * from the main site and propagated to the gameserver from a server, not from a browser.
     * As a consequence, there is no current player associated to this action. In your zombieTurn function,
     * you must _never_ use `getCurrentPlayerId()` or `getCurrentPlayerName()`, otherwise it will fail with a
     * "Not logged" error message.
     *
     * @param array{ type: string, name: string } $state
     * @param int $active_player
     * @return void
     * @throws feException if the zombie mode is not supported at this game state.
     */
    protected function zombieTurn(array $state, int $active_player): void
    {
        $state_name = $state["name"];

        $this->incTurnsPlayed($active_player);

        if ($state["type"] === "activeplayer") {
            $this->gamestate->nextState("zombiePass");
            return;
        }

        // Make sure player is in a non-blocking status for role turn.
        if ($state["type"] === "multipleactiveplayer") {
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            return;
        }

        throw new \feException("Zombie mode not supported at this game state: \"{$state_name}\".");
    }

    public function debug_setLocation(int $x, int $y, int $piece, int $color_id): void
    {
        $board = $this->globals->get(BOARD);
        $board[$x][$y] = $piece;
        $this->globals->set(BOARD, $board);

        $coloredBoard = $this->globals->get(COLORED_BOARD);
        $coloredBoard[$x][$y] = $color_id;
        $this->globals->set(COLORED_BOARD, $coloredBoard);
    }

    public function debug_setupBoard(): void
    {
        $this->setupBoard();
        $this->updateSelectableLocations("", true);
        $this->updateSelectableOrigins("", "", true);
    }

    public function debug_revealBoard(): void
    {
        $this->revealBoard();
    }
}
