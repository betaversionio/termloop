// Image Viewer — TermLoop Marketplace App
(function () {
  window.__termloop_register("image-viewer", function (sdk) {
    var React = sdk.React;
    var useState = React.useState;
    var useEffect = React.useEffect;
    var useRef = React.useRef;
    var Button = sdk.ui.Button;
    var Spinner = sdk.ui.Spinner;

    function ImageViewer(props) {
      var connectionId = props.connectionId;
      var payload = props.payload || {};
      var filePath = payload.filePath || "";
      var fileName = payload.fileName || "Image";

      var ref = useRef(null);
      var _s1 = useState(null); var src = _s1[0]; var setSrc = _s1[1];
      var _s2 = useState(true); var loading = _s2[0]; var setLoading = _s2[1];
      var _s3 = useState(null); var error = _s3[0]; var setError = _s3[1];
      var _s4 = useState(1); var zoom = _s4[0]; var setZoom = _s4[1];
      var _s5 = useState(false); var fitMode = _s5[0]; var setFitMode = _s5[1];

      useEffect(function () {
        if (!filePath || !connectionId) {
          setError("No file specified");
          setLoading(false);
          return;
        }

        setLoading(true);
        setError(null);

        var url =
          "http://localhost:3721/api/sftp/" +
          encodeURIComponent(connectionId) +
          "/download?path=" +
          encodeURIComponent(filePath);

        fetch(url)
          .then(function (res) {
            if (!res.ok) throw new Error("Failed to fetch image: " + res.status);
            return res.blob();
          })
          .then(function (blob) {
            var objectUrl = URL.createObjectURL(blob);
            setSrc(objectUrl);
            setLoading(false);
          })
          .catch(function (err) {
            setError(err.message || "Failed to load image");
            setLoading(false);
          });

        return function () {
          if (src) URL.revokeObjectURL(src);
        };
      }, [filePath, connectionId]);

      var handleZoomIn = function () {
        setFitMode(false);
        setZoom(function (z) { return Math.min(z * 1.25, 5); });
      };

      var handleZoomOut = function () {
        setFitMode(false);
        setZoom(function (z) { return Math.max(z / 1.25, 0.1); });
      };

      var handleFit = function () {
        setFitMode(true);
        setZoom(1);
      };

      var handleActualSize = function () {
        setFitMode(false);
        setZoom(1);
      };

      if (loading) {
        return React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "12px",
            },
          },
          React.createElement(Spinner, { style: { width: 24, height: 24 } }),
          React.createElement(
            "span",
            { style: { fontSize: 12, color: "var(--muted-foreground)" } },
            "Loading image..."
          )
        );
      }

      if (error) {
        return React.createElement(
          "div",
          {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              gap: "8px",
              padding: "24px",
              textAlign: "center",
            },
          },
          React.createElement("span", { style: { fontSize: 32 } }, "\u26A0\uFE0F"),
          React.createElement(
            "p",
            { style: { fontSize: 13, color: "var(--foreground)" } },
            "Failed to load image"
          ),
          React.createElement(
            "p",
            { style: { fontSize: 12, color: "var(--muted-foreground)" } },
            error
          )
        );
      }

      var imgStyle = fitMode
        ? {
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }
        : {
            transform: "scale(" + zoom + ")",
            transformOrigin: "center center",
          };

      return React.createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
            height: "100%",
            background: "var(--background)",
          },
        },
        // Toolbar
        React.createElement(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderBottom: "1px solid var(--border)",
              fontSize: "12px",
            },
          },
          React.createElement(
            Button,
            { variant: "ghost", size: "sm", onClick: handleZoomOut, title: "Zoom Out" },
            "\u2212"
          ),
          React.createElement(
            "span",
            {
              style: {
                minWidth: "48px",
                textAlign: "center",
                color: "var(--muted-foreground)",
                fontSize: "11px",
              },
            },
            fitMode ? "Fit" : Math.round(zoom * 100) + "%"
          ),
          React.createElement(
            Button,
            { variant: "ghost", size: "sm", onClick: handleZoomIn, title: "Zoom In" },
            "+"
          ),
          React.createElement(
            Button,
            { variant: "ghost", size: "sm", onClick: handleFit, title: "Fit to Window" },
            "Fit"
          ),
          React.createElement(
            Button,
            { variant: "ghost", size: "sm", onClick: handleActualSize, title: "Actual Size" },
            "1:1"
          ),
          React.createElement("div", { style: { flex: 1 } }),
          React.createElement(
            "span",
            { style: { color: "var(--muted-foreground)", fontSize: "11px" } },
            fileName
          )
        ),
        // Image area
        React.createElement(
          "div",
          {
            ref: ref,
            style: {
              flex: 1,
              overflow: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "repeating-conic-gradient(var(--muted) 0% 25%, transparent 0% 50%) 50% / 16px 16px",
            },
          },
          src &&
            React.createElement("img", {
              src: src,
              alt: fileName,
              draggable: false,
              style: imgStyle,
            })
        )
      );
    }

    return { default: ImageViewer };
  });
})();
