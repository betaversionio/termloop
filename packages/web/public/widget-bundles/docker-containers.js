// Docker Containers — TermLoop Desktop Widget (requires the Docker app installed)
(function () {
  window.__termloop_register("docker-containers", function (sdk) {
    var React = sdk.React;
    var useSSH = sdk.hooks.useSSH;
    var useQuery = sdk.hooks.useQuery;
    var Spinner = sdk.ui.Spinner;

    function parseContainers(stdout) {
      return stdout
        .split("\n")
        .map(function (l) {
          return l.trim();
        })
        .filter(Boolean)
        .map(function (l) {
          try {
            return JSON.parse(l);
          } catch (e) {
            return null;
          }
        })
        .filter(function (c) {
          return c !== null;
        });
    }

    function DockerContainers(props) {
      var connectionId = props.connectionId;
      var size = props.size;
      var ssh = useSSH(connectionId);

      var result = useQuery({
        queryKey: ["widget-docker-containers", connectionId],
        queryFn: function () {
          return ssh
            .execute("sudo -n docker ps --format '{{json .}}'")
            .then(function (res) {
              if (res.code !== 0) throw new Error(res.stderr || "docker ps failed");
              return parseContainers(res.stdout);
            });
        },
        refetchInterval: 5000,
      });

      if (result.isLoading) {
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

      if (result.isError) {
        return React.createElement(
          "div",
          {
            style: {
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 12,
              fontSize: 11,
              color: "white",
              opacity: 0.75,
              textAlign: "center",
            },
          },
          "Docker unavailable"
        );
      }

      var containers = result.data || [];
      var maxRows = size === "large" ? 6 : size === "medium" ? 3 : 1;

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
          { style: { fontSize: 12, fontWeight: 600, opacity: 0.9, marginBottom: 8 } },
          containers.length + " running container" + (containers.length === 1 ? "" : "s")
        ),
        containers.slice(0, maxRows).map(function (c) {
          return React.createElement(
            "div",
            {
              key: c.ID,
              style: {
                fontSize: 11,
                opacity: 0.85,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginBottom: 3,
              },
            },
            "● " + c.Names
          );
        })
      );
    }

    return { default: DockerContainers };
  });
})();
