// Clock — TermLoop Desktop Widget
(function () {
  window.__termloop_register("clock", function (sdk) {
    var React = sdk.React;
    var e = React.createElement;
    var useState = React.useState;
    var useEffect = React.useEffect;

    var ACCENT = "#ff453a";

    // Analog face, viewBox is always 0 0 200 200 — the <svg> itself is scaled to
    // whatever pixel size the caller renders it at.
    function ClockFace(props) {
      var now = props.now;
      var hours = now.getHours() % 12;
      var minutes = now.getMinutes();
      var seconds = now.getSeconds();

      var hourDeg = hours * 30 + minutes * 0.5;
      var minuteDeg = minutes * 6 + seconds * 0.1;
      var secondDeg = seconds * 6;

      var ticks = [];
      for (var i = 0; i < 12; i++) {
        var deg = i * 30;
        var major = i % 3 === 0;
        ticks.push(
          e("line", {
            key: "t" + i,
            x1: 100,
            y1: major ? 14 : 18,
            x2: 100,
            y2: major ? 26 : 22,
            stroke: "rgba(255,255,255,0.55)",
            strokeWidth: major ? 3 : 1.5,
            strokeLinecap: "round",
            transform: "rotate(" + deg + " 100 100)",
          })
        );
      }

      return e(
        "svg",
        { viewBox: "0 0 200 200", width: "100%", height: "100%" },
        e("circle", {
          cx: 100,
          cy: 100,
          r: 96,
          fill: "rgba(255,255,255,0.05)",
          stroke: "rgba(255,255,255,0.18)",
          strokeWidth: 1.5,
        }),
        ticks,
        // Hour hand
        e("line", {
          x1: 100,
          y1: 100,
          x2: 100,
          y2: 56,
          stroke: "#fff",
          strokeWidth: 6,
          strokeLinecap: "round",
          transform: "rotate(" + hourDeg + " 100 100)",
        }),
        // Minute hand
        e("line", {
          x1: 100,
          y1: 100,
          x2: 100,
          y2: 34,
          stroke: "#fff",
          strokeWidth: 4,
          strokeLinecap: "round",
          transform: "rotate(" + minuteDeg + " 100 100)",
        }),
        // Second hand
        e("line", {
          x1: 100,
          y1: 114,
          x2: 100,
          y2: 26,
          stroke: ACCENT,
          strokeWidth: 2,
          strokeLinecap: "round",
          transform: "rotate(" + secondDeg + " 100 100)",
          style: { transition: "transform 0.15s cubic-bezier(0.4,2.2,0.4,1)" },
        }),
        e("circle", { cx: 100, cy: 100, r: 6, fill: ACCENT }),
        e("circle", { cx: 100, cy: 100, r: 2.5, fill: "#1a1a1a" })
      );
    }

    function Clock(props) {
      var size = props.size;
      var _s = useState(new Date());
      var now = _s[0];
      var setNow = _s[1];

      useEffect(function () {
        var timer = setInterval(function () {
          setNow(new Date());
        }, 1000);
        return function () {
          clearInterval(timer);
        };
      }, []);

      var weekday = now.toLocaleDateString([], { weekday: "short" });
      var monthDay = now.toLocaleDateString([], { month: "short", day: "numeric" });
      var digitalTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      var containerStyle = {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "inherit",
        userSelect: "none",
        boxSizing: "border-box",
      };

      if (size === "small") {
        return e(
          "div",
          { style: Object.assign({ flexDirection: "column", padding: 14, gap: 6 }, containerStyle) },
          e("div", { style: { width: "72%", aspectRatio: "1 / 1" } }, e(ClockFace, { now: now })),
          e(
            "div",
            { style: { fontSize: 11, opacity: 0.7, fontWeight: 500, letterSpacing: 0.3 } },
            weekday + ", " + monthDay
          )
        );
      }

      // medium / large — analog face + a digital readout beside it
      return e(
        "div",
        { style: Object.assign({ gap: 18, padding: 16 }, containerStyle) },
        e("div", { style: { height: "78%", aspectRatio: "1 / 1", flexShrink: 0 } }, e(ClockFace, { now: now })),
        e(
          "div",
          { style: { display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 } },
          e(
            "div",
            { style: { fontSize: 34, fontWeight: 600, letterSpacing: -1, lineHeight: 1 } },
            digitalTime
          ),
          e(
            "div",
            { style: { fontSize: 13, opacity: 0.7, marginTop: 6, fontWeight: 500 } },
            weekday + ", " + monthDay
          )
        )
      );
    }

    return { default: Clock };
  });
})();
