<?php

$GEMSTONES = [
    1 => [
        "color" => 1,
        "size" => 2,
        "format" => "square",
        "nbr" => 1,
    ],
    2 => [
        "color" => 2,
        "size" => 3,
        "format" => "trapezium",
        "nbr" => 1,
    ],
    3 => [
        "color" => 3,
        "size" => 2,
        "format" => "triangle",
        "nbr" => 1,
    ],
    4 => [
        "color" => 4,
        "size" => 4,
        "format" => "triangle",
        "nbr" => 2,
    ]
];

$COLORS = [
    1 => [
        "name" => "blue",
        "label" => clienttranslate("blue"),
        "components" => [],
    ],
    2 => [
        "name" => "red",
        "label" => clienttranslate("red"),
        "components" => [],
    ],
    3 => [
        "name" => "yellow",
        "label" => clienttranslate("yellow"),
        "components" => [],
    ],
    4 => [
        "name" => "white",
        "label" => clienttranslate("white"),
        "components" => [],
    ],
    5 => [
        "name" => "purple",
        "label" => clienttranslate("purple"),
        "components" => [1, 2],
    ],
    6 => [
        "name" => "green",
        "label" => clienttranslate("green"),
        "components" => [1, 3],
    ],
    7 => [
        "name" => "orange",
        "label" => clienttranslate("orange"),
        "components" => [2, 3],
    ],
    8 => [
        "name" => "skyblue",
        "label" => clienttranslate("sky blue"),
        "components" => [1, 4],
    ],
    9 => [
        "name" => "pink",
        "label" => clienttranslate("pink"),
        "components" => [2, 4],
    ],
    10 => [
        "name" => "lemon",
        "label" => clienttranslate("lemon"),
        "components" => [3, 4],
    ],
    11 => [
        "name" => "lightpurple",
        "label" => clienttranslate("light purple"),
        "components" => [1, 2, 4]
    ],
    12 => [
        "name" => "lightgreen",
        "label" => clienttranslate("light green"),
        "components" => [1, 3, 4]
    ],
    13 => [
        "name" => "lightoranrange",
        "label" => clienttranslate("light orange"),
        "components" => [2, 3, 4]
    ],
    14 => [
        "name" => "black",
        "label" => clienttranslate("black"),
        "components" => [1, 2, 3],
    ],
    15 => [
        "name" => "gray",
        "label" => clienttranslate("gray"),
        "components" => [1, 2, 3, 4],
    ],
];