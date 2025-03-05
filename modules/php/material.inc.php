<?php

$this->GEMSTONES = [
    1 => [
        "color" => 1,
        "size" => 4,
        "polygon" => "square",
        "format" => [
            0 => [
                [1, 2],
                [3, 4],
            ],
            90 => [
                [1, 2],
                [3, 4],
            ],
            180 => [
                [1, 2],
                [3, 4],
            ],
            270 => [
                [1, 2],
                [3, 4],
            ],
        ],
    ],
    2 => [
        "color" => 2,
        "size" => 3,
        "polygon" => "trapezium",
        "format" => [
            0 => [[1, 5, 4]],
            90 => [
                [2],
                [5],
                [3],
            ],
            180 => [[1, 5, 4]],
            270 => [
                [2],
                [5],
                [3],
            ],
        ],
    ],
    3 => [
        "color" => 3,
        "size" => 4,
        "polygon" => "triangle",
        "format" => [
            0 => [
                [2, 0],
                [5, 2]
            ],
            90 => [
                [5, 4],
                [4, 0]
            ],
            180 => [
                [3, 5],
                [0, 3]
            ],
            270 => [
                [0, 1],
                [1, 5]
            ],
        ],
    ],
    4 => [
        "color" => 4,
        "size" => 8,
        "polygon" => "triangle",
        "format" => [
            0 => [
                [0, 1, 2, 0],
                [1, 5, 5, 2],
            ],
            90 => [
                [2, 0],
                [5, 2],
                [5, 4],
                [4, 0],
            ],
            180 => [
                [3, 5, 5, 4],
                [0, 3, 4, 0],
            ],
            270 => [
                [0, 1],
                [1, 5],
                [3, 5],
                [0, 3],
            ],
        ],
    ],
    5 => [
        "color" => 4,
        "size" => 8,
        "polygon" => "triangle",
        "format" => [
            0 => [
                [0, 1, 2, 0],
                [1, 5, 5, 2],
            ],
            90 => [
                [2, 0],
                [5, 2],
                [5, 4],
                [4, 0],
            ],
            180 => [
                [3, 5, 5, 4],
                [0, 3, 4, 0],
            ],
            270 => [
                [0, 1],
                [1, 5],
                [3, 5],
                [0, 3],
            ],
        ],
    ]
];

$this->COLORS = [
    0 => [
        "name" => "transparent",
        "label" => clienttranslate("transparent"),
        "components" => [],
        "code" => "#000000",
    ],
    1 => [
        "name" => "mediumblue",
        "label" => clienttranslate("blue"),
        "components" => [],
        "code" => "#0000CD",
        "darkerCode" => "#00008B",
    ],
    2 => [
        "name" => "red",
        "label" => clienttranslate("red"),
        "components" => [],
        "code" => "#FF0000",
        "darkerCode" => "#990000",
    ],
    3 => [
        "name" => "gold",
        "label" => clienttranslate("yellow"),
        "components" => [],
        "code" => "#ffa500",
        "darkerCode" => "#B29500",
    ],
    4 => [
        "name" => "white",
        "label" => clienttranslate("white"),
        "components" => [],
        "code" => "#FFFFFF",
        "darkerCode" => "#C0C0C0",
    ],
    5 => [
        "name" => "purple",
        "label" => clienttranslate("purple"),
        "components" => [1, 2],
        "code" => "#800080",
    ],
    6 => [
        "name" => "green",
        "label" => clienttranslate("green"),
        "components" => [1, 3],
        "code" => "#008000",
    ],
    7 => [
        "name" => "orange",
        "label" => clienttranslate("orange"),
        "components" => [2, 3],
        "code" => "#FFA500",
    ],
    8 => [
        "name" => "skyblue",
        "label" => clienttranslate("sky blue"),
        "components" => [1, 4],
        "code" => "#87CEEB",
    ],
    9 => [
        "name" => "pink",
        "label" => clienttranslate("pink"),
        "components" => [2, 4],
        "code" => "#FFC0CB",
    ],
    10 => [
        "name" => "lemon",
        "label" => clienttranslate("lemon"),
        "components" => [3, 4],
        "code" => "#FFF44F",
    ],
    11 => [
        "name" => "lightpurple",
        "label" => clienttranslate("light purple"),
        "components" => [1, 2, 4],
        "code" => "#D8BFD8",
    ],
    12 => [
        "name" => "lightgreen",
        "label" => clienttranslate("light green"),
        "components" => [1, 3, 4],
        "code" => "#90EE90",
    ],
    13 => [
        "name" => "lightorange",
        "label" => clienttranslate("light orange"),
        "components" => [2, 3, 4],
        "code" => "#FFD8B1",
    ],
    14 => [
        "name" => "black",
        "label" => clienttranslate("black"),
        "components" => [1, 2, 3],
        "code" => "#000000",
    ],
    15 => [
        "name" => "gray",
        "label" => clienttranslate("gray"),
        "components" => [1, 2, 3, 4],
        "code" => "#808080",
    ],
];

$this->AXIS_LETTERS = [
    "y" => [
        1 => "A",
        2 => "B",
        3 => "C",
        4 => "D",
        5 => "E",
        6 => "F",
        7 => "G",
        8 => "H",
    ],
    "x" => [
        1 => "I",
        2 => "J",
        3 => "K",
        4 => "L",
        5 => "M",
        6 => "N",
        7 => "O",
        8 => "P",
        9 => "Q",
        10 => "R",
    ]
];

$this->ORIGINS = [
    "A" => [
        "direction" => 1,
        "location" => [1, 1],
    ],
    "B" => [
        "direction" => 1,
        "location" => [1, 2],
    ],
    "C" => [
        "direction" => 1,
        "location" => [1, 3],
    ],
    "D" => [
        "direction" => 1,
        "location" => [1, 4],
    ],
    "E" => [
        "direction" => 1,
        "location" => [1, 5],
    ],
    "F" => [
        "direction" => 1,
        "location" => [1, 6],
    ],
    "G" => [
        "direction" => 1,
        "location" => [1, 7],
    ],
    "H" => [
        "direction" => 1,
        "location" => [1, 8],
    ],
    "I" => [
        "direction" => 4,
        "location" => [1, 8],
    ],
    "J" => [
        "direction" => 4,
        "location" => [4, 8],
    ],
    "K" => [
        "direction" => 4,
        "location" => [3, 8],
    ],
    "L" => [
        "direction" => 4,
        "location" => [4, 8],
    ],
    "M" => [
        "direction" => 4,
        "location" => [5, 8],
    ],
    "N" => [
        "direction" => 4,
        "location" => [6, 8],
    ],
    "O" => [
        "direction" => 4,
        "location" => [7, 8],
    ],
    "P" => [
        "direction" => 4,
        "location" => [8, 8],
    ],
    "Q" => [
        "direction" => 4,
        "location" => [9, 8],
    ],
    "R" => [
        "direction" => 4,
        "location" => [10, 8],
    ],
    1 => [
        "direction" => 3,
        "location" => [1, 1],
    ],
    2 => [
        "direction" => 3,
        "location" => [2, 1],
    ],
    3 => [
        "direction" => 3,
        "location" => [3, 1],
    ],
    4 => [
        "direction" => 3,
        "location" => [4, 1],
    ],
    5 => [
        "direction" => 3,
        "location" => [5, 1],
    ],
    6 => [
        "direction" => 3,
        "location" => [6, 1],
    ],
    7 => [
        "direction" => 3,
        "location" => [7, 1],
    ],
    8 => [
        "direction" => 3,
        "location" => [8, 1],
    ],
    9 => [
        "direction" => 3,
        "location" => [9, 1],
    ],
    10 => [
        "direction" => 3,
        "location" => [10, 1],
    ],
    11 => [
        "direction" => 2,
        "location" => [10, 1],
    ],
    12 => [
        "direction" => 2,
        "location" => [10, 2],
    ],
    13 => [
        "direction" => 2,
        "location" => [10, 3],
    ],
    14 => [
        "direction" => 2,
        "location" => [10, 4],
    ],
    15 => [
        "direction" => 2,
        "location" => [10, 5],
    ],
    16 => [
        "direction" => 2,
        "location" => [10, 6],
    ],
    17 => [
        "direction" => 2,
        "location" => [10, 7],
    ],
    18 => [
        "direction" => 2,
        "location" => [10, 8],
    ],
];

$this->DIRECTIONS = [
    1 => [
        "name" => "right",
        "conversions" => [
            1 => 4,
            2 => 2,
            3 => 3,
            4 => 2,
            5 => 2,
        ],
        "shift" => [
            "x" => 1,
            "y" => 0,
        ],
    ],
    2 => [
        "name" => "left",
        "conversions" => [
            1 => 1,
            2 => 4,
            3 => 4,
            4 => 3,
            5 => 1,
        ],
        "shift" => [
            "x" => -1,
            "y" => 0,
        ],
    ],
    3 => [
        "name" => "down",
        "conversions" => [
            1 => 2,
            2 => 1,
            3 => 4,
            4 => 4,
            5 => 4,
        ],
        "shift" => [
            "x" => 0,
            "y" => 1,
        ],
    ],
    4 => [
        "name" => "up",
        "conversions" => [
            1 => 3,
            2 => 3,
            3 => 2,
            4 => 1,
            5 => 3,
        ],
        "shift" => [
            "x" => 0,
            "y" => -1,
        ],
    ],
];