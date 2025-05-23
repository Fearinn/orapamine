{OVERALL_GAME_HEADER}

<!-- 
--------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- Propuh implementation : © Matheus Gomes matheusgomesforwork@gmail.com
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-------
-->
<audio
  id="audiosrc_orapamine_laser"
  src="{GAMETHEMEURL}img/sounds/orapamine_laser.mp3"
  preload="none"
  autobuffer
></audio>
<audio
  id="audiosrc_o_orapamine_laser"
  src="{GAMETHEMEURL}img/sounds/orapamine_laser.ogg"
  preload="none"
  autobuffer
></audio>
<div
  id="orp_questionLogContainer"
  class="orp_questionLogContainer-hidden orp_questionLogContainer"
>
  <h3 id="orp_questionLogTitle" class="orp_questionLogTitle">Question Log</h3>
  <div id="orp_questionLog" class="orp_questionLog"></div>
</div>
<div id="orp_gameArea" class="orp_gameArea">
  <div id="orp_boardContainer" class="orp_boardContainer whiteblock">
    <h3 id="orp_boardTitle" class="orp_boardTitle orp_title">
      Solution Sheet
    </h3>
    <div class="orp_boardContent">
      <div id="orp_boardButtons" class="orp_boardButtons"></div>
      <div
        id="orp_letterAxis-y"
        class="orp_axis orp_axis-y"
        data-position="left"
      >
        <div id="orp_origin-A" class="orp_origin" data-origin="A">A</div>
        <div id="orp_origin-B" class="orp_origin" data-origin="B">B</div>
        <div id="orp_origin-C" class="orp_origin" data-origin="C">C</div>
        <div id="orp_origin-D" class="orp_origin" data-origin="D">D</div>
        <div id="orp_origin-E" class="orp_origin" data-origin="E">E</div>
        <div id="orp_origin-F" class="orp_origin" data-origin="F">F</div>
        <div id="orp_origin-G" class="orp_origin" data-origin="G">G</div>
        <div id="orp_origin-H" class="orp_origin" data-origin="H">H</div>
      </div>

      <div
        id="orp_letterAxis-x"
        class="orp_axis orp_axis-x"
        data-position="bottom"
      >
        <div id="orp_origin-I" class="orp_origin" data-origin="I">I</div>
        <div id="orp_origin-J" class="orp_origin" data-origin="J">J</div>
        <div id="orp_origin-K" class="orp_origin" data-origin="K">K</div>
        <div id="orp_origin-L" class="orp_origin" data-origin="L">L</div>
        <div id="orp_origin-M" class="orp_origin" data-origin="M">M</div>
        <div id="orp_origin-N" class="orp_origin" data-origin="N">N</div>
        <div id="orp_origin-O" class="orp_origin" data-origin="O">O</div>
        <div id="orp_origin-P" class="orp_origin" data-origin="P">P</div>
        <div id="orp_origin-Q" class="orp_origin" data-origin="Q">Q</div>
        <div id="orp_origin-R" class="orp_origin" data-origin="R">R</div>
      </div>

      <div
        id="orp_numberAxis-x"
        class="orp_axis orp_axis-x"
        data-position="top"
      >
        <div id="orp_origin-1" class="orp_origin" data-origin="1">1</div>
        <div id="orp_origin-2" class="orp_origin" data-origin="2">2</div>
        <div id="orp_origin-3" class="orp_origin" data-origin="3">3</div>
        <div id="orp_origin-4" class="orp_origin" data-origin="4">4</div>
        <div id="orp_origin-5" class="orp_origin" data-origin="5">5</div>
        <div id="orp_origin-6" class="orp_origin" data-origin="6">6</div>
        <div id="orp_origin-7" class="orp_origin" data-origin="7">7</div>
        <div id="orp_origin-8" class="orp_origin" data-origin="8">8</div>
        <div id="orp_origin-9" class="orp_origin" data-origin="9">9</div>
        <div id="orp_origin-10" class="orp_origin" data-origin="10">10</div>
      </div>

      <div
        id="orp_numberAxis-y"
        class="orp_axis orp_axis-y"
        data-position="right"
      >
        <div id="orp_origin-11" class="orp_origin" data-origin="11">11</div>
        <div id="orp_origin-12" class="orp_origin" data-origin="12">12</div>
        <div id="orp_origin-13" class="orp_origin" data-origin="13">13</div>
        <div id="orp_origin-14" class="orp_origin" data-origin="14">14</div>
        <div id="orp_origin-15" class="orp_origin" data-origin="15">15</div>
        <div id="orp_origin-16" class="orp_origin" data-origin="16">16</div>
        <div id="orp_origin-17" class="orp_origin" data-origin="17">17</div>
        <div id="orp_origin-18" class="orp_origin" data-origin="18">18</div>
      </div>

      <div id="orp_board" class="orp_board">
        <div id="orp_cell-1-1" data-cell="1-1" class="orp_cell"></div>
        <div id="orp_cell-1-2" data-cell="1-2" class="orp_cell"></div>
        <div id="orp_cell-1-3" data-cell="1-3" class="orp_cell"></div>
        <div id="orp_cell-1-4" data-cell="1-4" class="orp_cell"></div>
        <div id="orp_cell-1-5" data-cell="1-5" class="orp_cell"></div>
        <div id="orp_cell-1-6" data-cell="1-6" class="orp_cell"></div>
        <div id="orp_cell-1-7" data-cell="1-7" class="orp_cell"></div>
        <div id="orp_cell-1-8" data-cell="1-8" class="orp_cell"></div>
        <div id="orp_cell-2-1" data-cell="2-1" class="orp_cell"></div>
        <div id="orp_cell-2-2" data-cell="2-2" class="orp_cell"></div>
        <div id="orp_cell-2-3" data-cell="2-3" class="orp_cell"></div>
        <div id="orp_cell-2-4" data-cell="2-4" class="orp_cell"></div>
        <div id="orp_cell-2-5" data-cell="2-5" class="orp_cell"></div>
        <div id="orp_cell-2-6" data-cell="2-6" class="orp_cell"></div>
        <div id="orp_cell-2-7" data-cell="2-7" class="orp_cell"></div>
        <div id="orp_cell-2-8" data-cell="2-8" class="orp_cell"></div>
        <div id="orp_cell-3-1" data-cell="3-1" class="orp_cell"></div>
        <div id="orp_cell-3-2" data-cell="3-2" class="orp_cell"></div>
        <div id="orp_cell-3-3" data-cell="3-3" class="orp_cell"></div>
        <div id="orp_cell-3-4" data-cell="3-4" class="orp_cell"></div>
        <div id="orp_cell-3-5" data-cell="3-5" class="orp_cell"></div>
        <div id="orp_cell-3-6" data-cell="3-6" class="orp_cell"></div>
        <div id="orp_cell-3-7" data-cell="3-7" class="orp_cell"></div>
        <div id="orp_cell-3-8" data-cell="3-8" class="orp_cell"></div>
        <div id="orp_cell-4-1" data-cell="4-1" class="orp_cell"></div>
        <div id="orp_cell-4-2" data-cell="4-2" class="orp_cell"></div>
        <div id="orp_cell-4-3" data-cell="4-3" class="orp_cell"></div>
        <div id="orp_cell-4-4" data-cell="4-4" class="orp_cell"></div>
        <div id="orp_cell-4-5" data-cell="4-5" class="orp_cell"></div>
        <div id="orp_cell-4-6" data-cell="4-6" class="orp_cell"></div>
        <div id="orp_cell-4-7" data-cell="4-7" class="orp_cell"></div>
        <div id="orp_cell-4-8" data-cell="4-8" class="orp_cell"></div>
        <div id="orp_cell-5-1" data-cell="5-1" class="orp_cell"></div>
        <div id="orp_cell-5-2" data-cell="5-2" class="orp_cell"></div>
        <div id="orp_cell-5-3" data-cell="5-3" class="orp_cell"></div>
        <div id="orp_cell-5-4" data-cell="5-4" class="orp_cell"></div>
        <div id="orp_cell-5-5" data-cell="5-5" class="orp_cell"></div>
        <div id="orp_cell-5-6" data-cell="5-6" class="orp_cell"></div>
        <div id="orp_cell-5-7" data-cell="5-7" class="orp_cell"></div>
        <div id="orp_cell-5-8" data-cell="5-8" class="orp_cell"></div>
        <div id="orp_cell-6-1" data-cell="6-1" class="orp_cell"></div>
        <div id="orp_cell-6-2" data-cell="6-2" class="orp_cell"></div>
        <div id="orp_cell-6-3" data-cell="6-3" class="orp_cell"></div>
        <div id="orp_cell-6-4" data-cell="6-4" class="orp_cell"></div>
        <div id="orp_cell-6-5" data-cell="6-5" class="orp_cell"></div>
        <div id="orp_cell-6-6" data-cell="6-6" class="orp_cell"></div>
        <div id="orp_cell-6-7" data-cell="6-7" class="orp_cell"></div>
        <div id="orp_cell-6-8" data-cell="6-8" class="orp_cell"></div>
        <div id="orp_cell-7-1" data-cell="7-1" class="orp_cell"></div>
        <div id="orp_cell-7-2" data-cell="7-2" class="orp_cell"></div>
        <div id="orp_cell-7-3" data-cell="7-3" class="orp_cell"></div>
        <div id="orp_cell-7-4" data-cell="7-4" class="orp_cell"></div>
        <div id="orp_cell-7-5" data-cell="7-5" class="orp_cell"></div>
        <div id="orp_cell-7-6" data-cell="7-6" class="orp_cell"></div>
        <div id="orp_cell-7-7" data-cell="7-7" class="orp_cell"></div>
        <div id="orp_cell-7-8" data-cell="7-8" class="orp_cell"></div>
        <div id="orp_cell-8-1" data-cell="8-1" class="orp_cell"></div>
        <div id="orp_cell-8-2" data-cell="8-2" class="orp_cell"></div>
        <div id="orp_cell-8-3" data-cell="8-3" class="orp_cell"></div>
        <div id="orp_cell-8-4" data-cell="8-4" class="orp_cell"></div>
        <div id="orp_cell-8-5" data-cell="8-5" class="orp_cell"></div>
        <div id="orp_cell-8-6" data-cell="8-6" class="orp_cell"></div>
        <div id="orp_cell-8-7" data-cell="8-7" class="orp_cell"></div>
        <div id="orp_cell-8-8" data-cell="8-8" class="orp_cell"></div>
        <div id="orp_cell-9-1" data-cell="9-1" class="orp_cell"></div>
        <div id="orp_cell-9-2" data-cell="9-2" class="orp_cell"></div>
        <div id="orp_cell-9-3" data-cell="9-3" class="orp_cell"></div>
        <div id="orp_cell-9-4" data-cell="9-4" class="orp_cell"></div>
        <div id="orp_cell-9-5" data-cell="9-5" class="orp_cell"></div>
        <div id="orp_cell-9-6" data-cell="9-6" class="orp_cell"></div>
        <div id="orp_cell-9-7" data-cell="9-7" class="orp_cell"></div>
        <div id="orp_cell-9-8" data-cell="9-8" class="orp_cell"></div>
        <div id="orp_cell-10-1" data-cell="10-1" class="orp_cell"></div>
        <div id="orp_cell-10-2" data-cell="10-2" class="orp_cell"></div>
        <div id="orp_cell-10-3" data-cell="10-3" class="orp_cell"></div>
        <div id="orp_cell-10-4" data-cell="10-4" class="orp_cell"></div>
        <div id="orp_cell-10-5" data-cell="10-5" class="orp_cell"></div>
        <div id="orp_cell-10-6" data-cell="10-6" class="orp_cell"></div>
        <div id="orp_cell-10-7" data-cell="10-7" class="orp_cell"></div>
        <div id="orp_cell-10-8" data-cell="10-8" class="orp_cell"></div>
      </div>
    </div>
  </div>
  <div id="orp_draftPieces" class="orp_draftPieces whiteblock"></div>
</div>

<script type="text/javascript"></script>

{OVERALL_GAME_FOOTER}
