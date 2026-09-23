import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Operator = "+" | "-" | "×" | "÷";

interface CalcState {
  display: string;
  prevValue: number | null;
  operator: Operator | null;
  overwrite: boolean;
}

const INITIAL_STATE: CalcState = {
  display: "0",
  prevValue: null,
  operator: null,
  overwrite: true,
};

function calculate(a: number, b: number, op: Operator): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "×":
      return a * b;
    case "÷":
      return b === 0 ? NaN : a / b;
  }
}

function formatValue(n: number): string {
  if (!Number.isFinite(n)) return "Error";
  // toPrecision avoids floating point artifacts (e.g. 0.1 + 0.2) while still
  // letting parseFloat strip any trailing zeros it introduces.
  return parseFloat(n.toPrecision(12)).toString();
}

export function CalculatorApp() {
  const [state, setState] = useState<CalcState>(INITIAL_STATE);
  const containerRef = useRef<HTMLDivElement>(null);

  const inputDigit = useCallback((digit: string) => {
    setState((s) => {
      if (s.overwrite) return { ...s, display: digit, overwrite: false };
      if (s.display.length >= 15) return s;
      return { ...s, display: s.display === "0" ? digit : s.display + digit };
    });
  }, []);

  const inputDecimal = useCallback(() => {
    setState((s) => {
      if (s.overwrite) return { ...s, display: "0.", overwrite: false };
      if (s.display.includes(".")) return s;
      return { ...s, display: s.display + "." };
    });
  }, []);

  const clear = useCallback(() => setState(INITIAL_STATE), []);

  const toggleSign = useCallback(() => {
    setState((s) => ({
      ...s,
      display: s.display.startsWith("-")
        ? s.display.slice(1)
        : s.display === "0"
          ? "0"
          : "-" + s.display,
    }));
  }, []);

  const percent = useCallback(() => {
    setState((s) => ({ ...s, display: formatValue(parseFloat(s.display) / 100) }));
  }, []);

  const applyOperator = useCallback((nextOp: Operator | null) => {
    setState((s) => {
      const inputValue = parseFloat(s.display);
      let prevValue = s.prevValue;
      let display = s.display;

      if (prevValue === null) {
        prevValue = inputValue;
      } else if (s.operator && !s.overwrite) {
        const result = calculate(prevValue, inputValue, s.operator);
        display = formatValue(result);
        prevValue = result;
      }

      return {
        display,
        prevValue: nextOp ? prevValue : null,
        operator: nextOp,
        overwrite: true,
      };
    });
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (/^[0-9]$/.test(e.key)) inputDigit(e.key);
    else if (e.key === ".") inputDecimal();
    else if (e.key === "+") applyOperator("+");
    else if (e.key === "-") applyOperator("-");
    else if (e.key === "*") applyOperator("×");
    else if (e.key === "/") applyOperator("÷");
    else if (e.key === "Enter" || e.key === "=") applyOperator(null);
    else if (e.key === "Escape" || e.key.toLowerCase() === "c") clear();
    else if (e.key === "%") percent();
    else if (e.key === "Backspace") {
      setState((s) =>
        s.overwrite
          ? s
          : { ...s, display: s.display.length > 1 ? s.display.slice(0, -1) : "0" }
      );
    } else {
      return;
    }
    e.preventDefault();
  };

  const isCleared = state.display === "0" && state.prevValue === null;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="flex h-full flex-col bg-[#1c1c1e] outline-none select-none"
    >
      {/* Display */}
      <div className="flex flex-1 items-end justify-end overflow-hidden px-5 pb-2">
        <span
          className={cn(
            "truncate font-light text-white",
            state.display.length > 9 ? "text-4xl" : "text-6xl"
          )}
        >
          {state.display}
        </span>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-4 gap-[1px] bg-black/40 p-[1px]">
        <CalcKey label={isCleared ? "AC" : "C"} variant="function" onClick={clear} />
        <CalcKey label="+/-" variant="function" onClick={toggleSign} />
        <CalcKey label="%" variant="function" onClick={percent} />
        <CalcKey label="÷" variant="operator" active={state.operator === "÷"} onClick={() => applyOperator("÷")} />

        <CalcKey label="7" onClick={() => inputDigit("7")} />
        <CalcKey label="8" onClick={() => inputDigit("8")} />
        <CalcKey label="9" onClick={() => inputDigit("9")} />
        <CalcKey label="×" variant="operator" active={state.operator === "×"} onClick={() => applyOperator("×")} />

        <CalcKey label="4" onClick={() => inputDigit("4")} />
        <CalcKey label="5" onClick={() => inputDigit("5")} />
        <CalcKey label="6" onClick={() => inputDigit("6")} />
        <CalcKey label="−" variant="operator" active={state.operator === "-"} onClick={() => applyOperator("-")} />

        <CalcKey label="1" onClick={() => inputDigit("1")} />
        <CalcKey label="2" onClick={() => inputDigit("2")} />
        <CalcKey label="3" onClick={() => inputDigit("3")} />
        <CalcKey label="+" variant="operator" active={state.operator === "+"} onClick={() => applyOperator("+")} />

        <CalcKey label="0" wide onClick={() => inputDigit("0")} />
        <CalcKey label="." onClick={inputDecimal} />
        <CalcKey label="=" variant="operator" onClick={() => applyOperator(null)} />
      </div>
    </div>
  );
}

interface CalcKeyProps {
  label: string;
  variant?: "digit" | "function" | "operator";
  active?: boolean;
  wide?: boolean;
  onClick: () => void;
}

function CalcKey({ label, variant = "digit", active, wide, onClick }: CalcKeyProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-16 items-center justify-center text-xl transition-colors",
        wide && "col-span-2 justify-start pl-7",
        variant === "digit" && "bg-[#333333] text-white hover:bg-[#474747] active:bg-[#5a5a5a]",
        variant === "function" && "bg-[#a5a5a5] text-black hover:bg-[#b8b8b8] active:bg-[#c8c8c8]",
        variant === "operator" &&
          cn(
            "text-white hover:bg-[#ffb340] active:bg-[#ffc266]",
            active ? "bg-white !text-[#ff9f0a]" : "bg-[#ff9f0a]"
          )
      )}
    >
      {label}
    </button>
  );
}
