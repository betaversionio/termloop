// Server Stats — TermLoop Desktop Widget
(function () {
  window.__termloop_register("server-stats", function (sdk) {
    var React = sdk.React;
    var useStats = sdk.hooks.useStats;
    var Spinner = sdk.ui.Spinner;

    function Bar(label, percent) {
      return React.createElement(
        "div",
        { key: label, style: { marginTop: 8 } },
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              opacity: 0.85,
              marginBottom: 3,
            },
          },
          React.createElement("span", null, label),
          React.createElement("span", null, Math.round(percent) + "%")
        ),
        React.createElement(
          "div",
          {
            style: {
              height: 4,
              borderRadius: 2,
              background: "rgba(255,255,255,0.15)",
              overflow: "hidden",
            },
          },
          React.createElement("div", {
            style: {
              height: "100%",
              width: Math.min(100, Math.max(0, percent)) + "%",
              background: percent > 85 ? "#ff453a" : "#ffffff",
              borderRadius: 2,
            },
          })
        )
      );
    }

    function ServerStats(props) {
      var connectionId = props.connectionId;
      var size = props.size;
      var result = useStats(connectionId);
      var data = result.data;
      var isLoading = result.isLoading;

      if (isLoading || !data) {
        return React.createElement(
          "div",
          {
            style: {
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            },
          },
          React.createElement(Spinner, { style: { color: "white", width: 20, height: 20 } })
        );
      }

      var rows = [Bar("CPU", data.cpu.usagePercent), Bar("Memory", data.memory.usagePercent)];
      if (size !== "small" && data.disk[0]) {
        rows.push(Bar("Disk", data.disk[0].usagePercent));
      }

      return React.createElement(
        "div",
        {
          style: {
            width: "100%",
            height: "100%",
            padding: 14,
            color: "white",
            fontFamily: "inherit",
            userSelect: "none",
          },
        },
        React.createElement(
          "div",
          { style: { fontSize: 12, fontWeight: 600, opacity: 0.9, marginBottom: 2 } },
          data.hostname
        ),
        rows
      );
    }

    return { default: ServerStats };
  });
})();
