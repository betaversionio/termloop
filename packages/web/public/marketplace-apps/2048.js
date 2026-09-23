// 2048 — TermLoop Marketplace App
(function () {
  window.__termloop_register("2048", function (sdk) {
    var React = sdk.React;
    var e = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var useCallback = React.useCallback;
    var Button = sdk.ui.Button;

    var SIZE = 4;
    var BEST_KEY = "termloop-2048-best";

    var TILE_COLORS = {
      0: { bg: "rgba(255,255,255,0.06)", fg: "transparent" },
      2: { bg: "#eee4da", fg: "#776e65" },
      4: { bg: "#ede0c8", fg: "#776e65" },
      8: { bg: "#f2b179", fg: "#f9f6f2" },
      16: { bg: "#f59563", fg: "#f9f6f2" },
      32: { bg: "#f67c5f", fg: "#f9f6f2" },
      64: { bg: "#f65e3b", fg: "#f9f6f2" },
      128: { bg: "#edcf72", fg: "#f9f6f2" },
      256: { bg: "#edcc61", fg: "#f9f6f2" },
      512: { bg: "#edc850", fg: "#f9f6f2" },
      1024: { bg: "#edc53f", fg: "#f9f6f2" },
      2048: { bg: "#edc22e", fg: "#f9f6f2" },
    };

    function emptyBoard() {
      var board = [];
      for (var r = 0; r < SIZE; r++) board.push([0, 0, 0, 0]);
      return board;
    }

    function cloneBoard(board) {
      return board.map(function (row) {
        return row.slice();
      });
    }

    function getEmptyCells(board) {
      var cells = [];
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (board[r][c] === 0) cells.push([r, c]);
        }
      }
      return cells;
    }

    function spawnTile(board) {
      var empty = getEmptyCells(board);
      if (empty.length === 0) return board;
      var pick = empty[Math.floor(Math.random() * empty.length)];
      var next = cloneBoard(board);
      next[pick[0]][pick[1]] = Math.random() < 0.9 ? 2 : 4;
      return next;
    }

    function reverseArr(row) {
      return row.slice().reverse();
    }

    function transpose(board) {
      var result = [];
      for (var c = 0; c < SIZE; c++) {
        var col = [];
        for (var r = 0; r < SIZE; r++) col.push(board[r][c]);
        result.push(col);
      }
      return result;
    }

    function arraysEqual(a, b) {
      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }

    // Slides+merges a single row to the left, returning the new row and the
    // score gained from any merges. Each tile merges at most once per move.
    function moveRowLeft(row) {
      var filtered = row.filter(function (v) {
        return v !== 0;
      });
      var merged = [];
      var scoreGain = 0;
      var i = 0;
      while (i < filtered.length) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
          var mergedVal = filtered[i] * 2;
          merged.push(mergedVal);
          scoreGain += mergedVal;
          i += 2;
        } else {
          merged.push(filtered[i]);
          i += 1;
        }
      }
      while (merged.length < SIZE) merged.push(0);
      return { row: merged, scoreGain: scoreGain };
    }

    function move(board, direction) {
      var totalScoreGain = 0;
      var working = board;

      function processRows(rows) {
        return rows.map(function (row) {
          var result = moveRowLeft(row);
          totalScoreGain += result.scoreGain;
          return result.row;
        });
      }

      var result;
      if (direction === "left") {
        result = processRows(working);
      } else if (direction === "right") {
        result = processRows(working.map(reverseArr)).map(reverseArr);
      } else if (direction === "up") {
        result = transpose(processRows(transpose(working)));
      } else {
        result = transpose(processRows(transpose(working).map(reverseArr)).map(reverseArr));
      }

      var moved = false;
      for (var r = 0; r < SIZE; r++) {
        if (!arraysEqual(board[r], result[r])) {
          moved = true;
          break;
        }
      }

      return { board: result, scoreGain: totalScoreGain, moved: moved };
    }

    function hasMovesLeft(board) {
      if (getEmptyCells(board).length > 0) return true;
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          var v = board[r][c];
          if (c + 1 < SIZE && board[r][c + 1] === v) return true;
          if (r + 1 < SIZE && board[r + 1][c] === v) return true;
        }
      }
      return false;
    }

    function hasWon(board) {
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          if (board[r][c] >= 2048) return true;
        }
      }
      return false;
    }

    function newGameBoard() {
      return spawnTile(spawnTile(emptyBoard()));
    }

    function loadBest() {
      try {
        return parseInt(localStorage.getItem(BEST_KEY) || "0", 10) || 0;
      } catch (err) {
        return 0;
      }
    }

    function saveBest(value) {
      try {
        localStorage.setItem(BEST_KEY, String(value));
      } catch (err) {
        // ignore
      }
    }

    function Game2048(props) {
      var windowId = props.windowId;
      var win = sdk.hooks.useWindow(windowId);

      var boardState = useState(newGameBoard);
      var board = boardState[0];
      var setBoard = boardState[1];

      var scoreState = useState(0);
      var score = scoreState[0];
      var setScore = scoreState[1];

      var bestState = useState(loadBest);
      var best = bestState[0];
      var setBest = bestState[1];

      var statusState = useState("playing"); // "playing" | "won" | "lost"
      var status = statusState[0];
      var setStatus = statusState[1];

      var keepPlayingState = useState(false);
      var keepPlaying = keepPlayingState[0];
      var setKeepPlaying = keepPlayingState[1];

      var touchStart = useRef(null);

      var restart = useCallback(function () {
        setBoard(newGameBoard());
        setScore(0);
        setStatus("playing");
        setKeepPlaying(false);
      }, []);

      var applyMove = useCallback(
        function (direction) {
          if (status === "lost") return;
          if (status === "won" && !keepPlaying) return;

          setBoard(function (prevBoard) {
            var result = move(prevBoard, direction);
            if (!result.moved) return prevBoard;

            var withNewTile = spawnTile(result.board);
            var newScore = score + result.scoreGain;
            setScore(newScore);

            if (newScore > best) {
              setBest(newScore);
              saveBest(newScore);
            }

            if (status !== "won" && hasWon(withNewTile)) {
              setStatus("won");
            } else if (!hasMovesLeft(withNewTile)) {
              setStatus("lost");
            }

            return withNewTile;
          });
        },
        [status, keepPlaying, score, best]
      );

      useEffect(
        function () {
          function onKeyDown(ev) {
            if (!win.isFocused) return;
            var map = {
              ArrowLeft: "left",
              ArrowRight: "right",
              ArrowUp: "up",
              ArrowDown: "down",
            };
            var direction = map[ev.key];
            if (!direction) return;
            ev.preventDefault();
            applyMove(direction);
          }
          window.addEventListener("keydown", onKeyDown);
          return function () {
            window.removeEventListener("keydown", onKeyDown);
          };
        },
        [win.isFocused, applyMove]
      );

      var onTouchStart = function (ev) {
        var t = ev.touches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
      };

      var onTouchEnd = function (ev) {
        if (!touchStart.current) return;
        var t = ev.changedTouches[0];
        var dx = t.clientX - touchStart.current.x;
        var dy = t.clientY - touchStart.current.y;
        touchStart.current = null;
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) {
          applyMove(dx > 0 ? "right" : "left");
        } else {
          applyMove(dy > 0 ? "down" : "up");
        }
      };

      var tiles = [];
      for (var r = 0; r < SIZE; r++) {
        for (var c = 0; c < SIZE; c++) {
          var value = board[r][c];
          var colors = TILE_COLORS[value] || TILE_COLORS[2048];
          tiles.push(
            e(
              "div",
              {
                key: r + "-" + c,
                className: "tl2048-tile",
                style: {
                  background: colors.bg,
                  color: colors.fg,
                  fontSize: value >= 1024 ? 22 : value >= 128 ? 26 : 32,
                },
              },
              value !== 0 ? value : ""
            )
          );
        }
      }

      return e(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0f0f10",
            color: "white",
            fontFamily: "inherit",
            userSelect: "none",
            padding: 16,
            boxSizing: "border-box",
            position: "relative",
          },
          onTouchStart: onTouchStart,
          onTouchEnd: onTouchEnd,
        },
        e(
          "style",
          null,
          ".tl2048-tile{display:flex;align-items:center;justify-content:center;border-radius:8px;font-weight:700;aspect-ratio:1/1;animation:tl2048-pop 0.12s ease-out}" +
            "@keyframes tl2048-pop{from{transform:scale(0.85);opacity:0.6}to{transform:scale(1);opacity:1}}"
        ),
        e(
          "div",
          { style: { display: "flex", alignItems: "center", justifyContent: "space-between", width: 340, marginBottom: 14 } },
          e(
            "div",
            null,
            e("div", { style: { fontSize: 26, fontWeight: 800, letterSpacing: -0.5 } }, "2048"),
            e("div", { style: { fontSize: 11, opacity: 0.6 } }, "Join the tiles, get to 2048!")
          ),
          e(
            "div",
            { style: { display: "flex", gap: 8 } },
            e(
              "div",
              {
                style: {
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  textAlign: "center",
                  minWidth: 56,
                },
              },
              e("div", { style: { fontSize: 10, opacity: 0.6 } }, "SCORE"),
              e("div", { style: { fontSize: 16, fontWeight: 700 } }, score)
            ),
            e(
              "div",
              {
                style: {
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: 6,
                  padding: "6px 12px",
                  textAlign: "center",
                  minWidth: 56,
                },
              },
              e("div", { style: { fontSize: 10, opacity: 0.6 } }, "BEST"),
              e("div", { style: { fontSize: 16, fontWeight: 700 } }, best)
            )
          )
        ),
        e(
          "div",
          {
            style: {
              width: 340,
              height: 340,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              padding: 8,
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gridTemplateRows: "repeat(4, 1fr)",
              gap: 8,
              position: "relative",
            },
          },
          tiles,
          (status === "won" && !keepPlaying) || status === "lost"
            ? e(
                "div",
                {
                  style: {
                    position: "absolute",
                    inset: 0,
                    background: "rgba(15,15,16,0.85)",
                    borderRadius: 10,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                  },
                },
                e(
                  "div",
                  { style: { fontSize: 24, fontWeight: 800 } },
                  status === "won" ? "You Win! 🎉" : "Game Over"
                ),
                e(
                  "div",
                  { style: { display: "flex", gap: 8 } },
                  status === "won"
                    ? e(Button, { size: "sm", variant: "outline", onClick: function () { setKeepPlaying(true); } }, "Keep Going")
                    : null,
                  e(Button, { size: "sm", onClick: restart }, "New Game")
                )
              )
            : null
        ),
        e(
          "div",
          { style: { marginTop: 14 } },
          e(Button, { size: "sm", variant: "outline", onClick: restart }, "New Game")
        )
      );
    }

    return { default: Game2048 };
  });
})();
