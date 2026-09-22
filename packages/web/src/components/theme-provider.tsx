import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light" | "system";

interface ThemeContext {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContext>({
  theme: "system",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem("termloop-theme") as Theme) || "system"
  );

  useEffect(() => {
    const root = document.documentElement;

    const applyResolvedTheme = () => {
      root.classList.remove("light", "dark");
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light"
          : theme;
      root.classList.add(resolved);
    };

    applyResolvedTheme();
    localStorage.setItem("termloop-theme", theme);

    if (theme !== "system") return;

    // Follow macOS (or any OS) switching between light/dark live, e.g. at sunset,
    // without requiring a reload or a manual theme toggle.
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    mql.addEventListener("change", applyResolvedTheme);
    return () => mql.removeEventListener("change", applyResolvedTheme);
  }, [theme]);

  return (
    <ThemeContext value={{ theme, setTheme }}>
      {children}
    </ThemeContext>
  );
}

export const useTheme = () => useContext(ThemeContext);
