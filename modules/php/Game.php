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
const SELECTABLE_LOCATIONS = "selectableLocations";
const SELECTABLE_ORIGINS = "selectableOrigins";
const ORIGIN = "origin";
const REVEALED_LOCATIONS = "revealedLocations";
const REVEALED_ORIGINS = "revealedOrigins";
const SOLUTION_SHEET = "solutionSheet";

class Game extends \Table
{
    private array $GEMSTONES;
    private array $COLORS;
    private array $AXIS_LETTERS;
    private array $ORIGINS;

    public function __construct()
    {
        parent::__construct();

        require "material.inc.php";

        $this->initGameStateLabels([]);
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
        // TODO: compute and return the game progression

        return 0;
    }

    /** Game state arguments and actions*/
    public function arg_playerTurn(): array
    {
        $selectableLocations = (array) $this->globals->get(SELECTABLE_LOCATIONS);
        $selectableOrigins = (array) $this->globals->get(SELECTABLE_ORIGINS);

        return [
            "selectableLocations" => array_values($selectableLocations),
            "selectableOrigins" => array_values($selectableOrigins),
        ];
    }

    public function st_betweenPlayers(): void
    {
        $player_id = (int) $this->getActivePlayerId();
        $this->giveExtraTime($player_id);
        $this->activeNextPlayer($player_id);

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

    public function actAskLocation(?int $CLIENT_VERSION, #[IntParam(min: 1, max: 10)] int $guess_x, #[IntParam(min: 1, max: 8)] int $guess_y): void
    {
        $this->checkVersion($CLIENT_VERSION);
        $player_id = (int) $this->getActivePlayerId();

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

        $color_id = $coloredBoard[$guess_x][$guess_y];

        if ($color_id > 0) {
            $message = clienttranslate('${log_x}${log_y}: ${color_label} gem');
            $color = (array) $this->COLORS[$color_id];
            $color_label = (string) $color["label"];
        } else {
            $message = clienttranslate('${log_x}${log_y}: nothing is there!');
            $color = null;
            $color_label = null;
        }

        $revelaedLocations = $this->globals->get(REVEALED_LOCATIONS);
        $revelaedLocations[] = ["x" => $guess_x, "y" => $guess_y, "color" => $color];
        $this->globals->set(REVEALED_LOCATIONS, $revelaedLocations);

        $this->notify->all(
            "answerLocation",
            $message,
            [
                "color" => $color,
                "x" => $guess_x,
                "y" => $guess_y,
                "preserve" => ["colorCode"],
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

        $visitedColors = [];
        $this->sendWave($origin_x, $origin_y, $direction_id, $visitedColors, $origin);

        $this->gamestate->nextState("nextPlayer");
    }

    #[CheckAction(false)]
    public function actClearSolution(?int $CLIENT_VERSION): void
    {
        $this->checkVersion($CLIENT_VERSION);

        $players = $this->loadPlayersBasicInfos();
        $player_id = (int) $this->getCurrentPlayerId();

        if (!array_key_exists($player_id, $players)) {
            throw new \BgaVisibleSystemException("Only players may perform this action");
        }

        $this->globals->set(SOLUTION_SHEET, []);
        $this->notify->player($player_id, "message", clienttranslate("Solution sheet successfully cleared"));

        $this->gamestate->nextState("nextPlayer");
    }

    #[CheckAction(false)]
    public function actSaveSolution(?int $CLIENT_VERSION, #[JsonParam(alphanum: true)] array $solutionSheet): void
    {
        $this->checkVersion($CLIENT_VERSION);

        $players = $this->loadPlayersBasicInfos();
        $player_id = (int) $this->getCurrentPlayerId();

        if (!array_key_exists($player_id, $players)) {
            throw new \BgaVisibleSystemException("Only players may perform this action");
        }

        $this->globals->set(SOLUTION_SHEET, $solutionSheet);
        $this->notify->player($player_id, "message", clienttranslate("Solution sheet successfully saved"));

        $this->gamestate->nextState("nextPlayer");
    }

    /** Utility methods */

    public function setupBoard(): void
    {
        $board = array_fill(1, 10, array_fill(1, 8, 0));
        $coloredBoard = array_fill(1, 10, array_fill(1, 8, 0));

        $gemstones = $this->GEMSTONES;
        shuffle($gemstones);

        if (!$this->placeGemstones($board, $coloredBoard, $gemstones)) {
            throw new \BgaUserException(clienttranslate("Failed to set-up board. Please try again"));
        };

        $this->globals->set(BOARD, $board);
        $this->globals->set(COLORED_BOARD, $coloredBoard);
    }

    public function isValidPlacement(array $board, array $gemstone, int $base_x, int $base_y, int $rotation): bool
    {
        if ($board[$base_x][$base_y] > 0) {
            return false;
        }

        $format = (array) $gemstone["format"][$rotation];
        $gemstoneHidden = true;

        $piece_y = $base_y;
        foreach ($format as $row) {
            $piece_x = $base_x;

            foreach ($row as $piece) {
                if (!isset($board[$piece_x][$piece_y]) || $board[$piece_x][$piece_y] > 0) {
                    return false;
                }

                $board[$piece_x][$piece_y] = $piece;

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

    public function arrangePieces(array &$board, array &$coloredBoard, array $gemstone, int $base_x, int $base_y, int $rotation): void
    {
        $format = (array) $gemstone["format"][$rotation];

        $piece_y = $base_y;
        foreach ($format as $row) {
            $piece_x = $base_x;

            foreach ($row as $piece) {
                if ($piece > 0) {
                    $board[$piece_x][$piece_y] = $piece;
                    $coloredBoard[$piece_x][$piece_y] = (int) $gemstone["color"];
                }
                
                $piece_x++;
            }

            $piece_y++;
        }
    }

    public function removePieces(array &$board, array &$coloredBoard, array $gemstone, int $base_x, int $base_y, int $rotation): void
    {
        $format = (array) $gemstone["format"][$rotation];

        $piece_y = $base_y;
        foreach ($format as $row) {
            $piece_x = $base_x;

            foreach ($row as $piece) {
                $board[$piece_x][$piece_y] = 0;
                $coloredBoard[$piece_x][$piece_y] = 0;
                $piece_x++;
            }

            $piece_y++;
        }
    }

    public function placeGemstones(array &$board, array &$coloredBoard, array &$gemstones, int $index = 0): bool
    {
        if ($index > 4) {
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
                    if ($this->isValidPlacement($board, $gemstone, $x, $y, $rotation)) {
                        $this->arrangePieces($board, $coloredBoard, $gemstone, $x, $y, $rotation);

                        if ($this->placeGemstones($board, $coloredBoard, $gemstones, $index + 1)) {
                            return true;
                        }

                        $this->removePieces($board, $coloredBoard, $gemstone, $x, $y, $rotation);
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
                    $this->changeWaveDirection($x, $origin_y, $direction_id, $visitedColors);
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
                    $this->changeWaveDirection($x, $origin_y, $direction_id, $visitedColors);
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
                    $this->changeWaveDirection($origin_x, $y, $direction_id, $visitedColors);
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
                    $this->changeWaveDirection($origin_x, $y, $direction_id, $visitedColors);
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

    public function changeWaveDirection(int $x, int $y, int $direction_id, array &$visitedColors): void
    {
        $board = (array) $this->globals->get(BOARD);
        $coloredBoard = (array) $this->globals->get(COLORED_BOARD);

        $color_id = $coloredBoard[$x][$y];
        $visitedColors[] = $color_id;

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

        if ($x < 1) {
            $x = 1;
        }

        if ($x > 10) {
            $x = 10;
        }

        if ($y < 1) {
            $y = 1;
        }

        if ($y > 10) {
            $y = 10;
        }

        foreach ($this->ORIGINS as $exit_id => $exit) {
            [$exit_x, $exit_y] = (array) $exit["location"];
            $exitDirection_id = $exit["exitDirection"];

            if ($exit_x === $x && $exit_y === $y && $exitDirection_id === $direction_id) {
                $response["exit"] = $exit_id;
                break;
            }
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

        $revealedOrigins = $this->globals->get(REVEALED_ORIGINS);
        $revealedOrigins[] = ["origin" => $origin, "color" => $color];
        $revealedOrigins[] = ["origin" => $exit_id, "color" => $color];
        $revealedOrigins = $this->globals->set(REVEALED_ORIGINS, $revealedOrigins);

        $this->notify->all(
            "returnWave",
            clienttranslate('The wave exits from ${log_exit} as ${color_label}'),
            [
                "origin" => $origin,
                "exit" => $exit_id,
                "color" => $color,
                "preserve" => ["color"],
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
        $result = [];

        // WARNING: We must only return information visible by the current player.
        $current_player_id = (int) $this->getCurrentPlayerId();

        $result["players"] = $this->getCollectionFromDb(
            "SELECT `player_id` `id`, `player_score` `score` FROM `player`"
        );
        $result["GAME_VERSION"] = (int) $this->gamestate->table_globals[300];
        $result["COLORS"] = $this->COLORS;
        $result["GEMSTONES"] = array_values($this->GEMSTONES);
        $result["revealedLocations"] = $this->globals->get(REVEALED_LOCATIONS, []);
        $result["revealedOrigins"] = $this->globals->get(REVEALED_ORIGINS, []);
        $result["solutionSheet"] = $this->globals->get(SOLUTION_SHEET, []);
        // $result["board"] = $this->globals->get(BOARD);
        // $result["coloredBoard"] = $this->globals->get(COLORED_BOARD);

        return $result;
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

        // Create players based on generic information.
        //
        // NOTE: You can add extra field on player table in the database (see dbmodel.sql) and initialize
        // additional fields directly here.
        static::DbQuery(
            sprintf(
                "INSERT INTO player (player_id, player_color, player_canal, player_name, player_avatar) VALUES %s",
                implode(",", $query_values)
            )
        );

        $this->reattributeColorsBasedOnPreferences($players, $gameinfos["player_colors"]);
        $this->reloadPlayersBasicInfos();

        $this->setupBoard();
        $this->updateSelectableLocations("", true);
        $this->updateSelectableOrigins("", "", true);

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

        if ($state["type"] === "activeplayer") {
            switch ($state_name) {
                default: {
                        $this->gamestate->nextState("zombiePass");
                        break;
                    }
            }

            return;
        }

        // Make sure player is in a non-blocking status for role turn.
        if ($state["type"] === "multipleactiveplayer") {
            $this->gamestate->setPlayerNonMultiactive($active_player, '');
            return;
        }

        throw new \feException("Zombie mode not supported at this game state: \"{$state_name}\".");
    }

    public function debug_setupBoard(): void
    {
        $this->setupBoard();
        $this->updateSelectableLocations("", true);
        $this->updateSelectableOrigins("", "", true);
    }

    public function debug_askLocation(int $x = 1, int $y = 8): void
    {
        $this->actAskLocation(null, $x, $y);
    }

    public function debug_sendWave(string $origin): void
    {
        $this->actSendWave(null, $origin);
    }

    public function debug_resetSolution(): void
    {
        $this->globals->set(SOLUTION_SHEET, []);
    }
}
