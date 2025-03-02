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
            0 => [[3, 5, 2]],
            90 => [
                [2],
                [5],
                [3],
            ],
            180 => [[3, 5, 2]],
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
        "code" => "#FFD700",
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
