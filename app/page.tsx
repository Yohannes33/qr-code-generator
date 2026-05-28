"use client";

import { useState, useRef, useCallback, Component, type ReactNode } from "react";
import QRCode from "react-qr-code";

class QRErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidUpdate(prevProps: { children: ReactNode }) {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

const ERROR_LEVELS = ["L", "M", "Q", "H"] as const;
type ErrorLevel = (typeof ERROR_LEVELS)[number];

// QR spec max capacity per error level and encoding mode
const QR_CAPACITY: Record<ErrorLevel, { numeric: number; alphanumeric: number; byte: number }> = {
  L: { numeric: 7089, alphanumeric: 4296, byte: 2953 },
  M: { numeric: 5596, alphanumeric: 3391, byte: 2331 },
  Q: { numeric: 3993, alphanumeric: 2420, byte: 1663 },
  H: { numeric: 3057, alphanumeric: 1852, byte: 1273 },
};

// QR alphanumeric charset (uppercase only)
const QR_ALPHANUMERIC_RE = /^[0-9A-Z $%*+\-./:]*$/;

function getInputMode(text: string): "numeric" | "alphanumeric" | "byte" {
  if (/^\d*$/.test(text)) return "numeric";
  if (QR_ALPHANUMERIC_RE.test(text)) return "alphanumeric";
  return "byte";
}

function getCapacity(text: string, level: ErrorLevel): number {
  const mode = getInputMode(text);
  return QR_CAPACITY[level][mode];
}

function getInputLength(text: string): number {
  const mode = getInputMode(text);
  if (mode === "byte") return new TextEncoder().encode(text).length;
  return text.length;
}

// Returns the lowest error level that fits the input, or null if none fits
function getSuggestedLevel(text: string): ErrorLevel | null {
  for (const level of ERROR_LEVELS) {
    if (getInputLength(text) <= getCapacity(text, level)) return level;
  }
  return null;
}

const FOREGROUND_PRESETS = [
  { label: "Black", value: "#000000" },
  { label: "Indigo", value: "#4338ca" },
  { label: "Emerald", value: "#059669" },
  { label: "Rose", value: "#e11d48" },
];

export default function Home() {
  const [input, setInput] = useState("");
  const [errorLevel, setErrorLevel] = useState<ErrorLevel>("M");
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(256);
  const qrRef = useRef<HTMLDivElement>(null);

  const hasInput = input.trim().length > 0;
  const inputLength = getInputLength(input);
  const capacity = getCapacity(input, errorLevel);
  const isTooLong = inputLength > capacity;
  const suggestedLevel = isTooLong ? getSuggestedLevel(input) : null;

  const downloadSVG = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qrcode.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const downloadPNG = useCallback(() => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    const blob = new Blob([svg.outerHTML], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "qrcode.png";
      a.click();
    };
    img.src = url;
  }, [size]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
            QR Code Generator
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Paste a URL, type text, or enter anything — get a scannable QR code instantly.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Content
              </label>
              <textarea
                className={`w-full rounded-lg border bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isTooLong
                    ? "border-rose-400 dark:border-rose-500"
                    : "border-slate-300 dark:border-slate-600"
                }`}
                rows={4}
                placeholder="https://example.com or any text..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              {hasInput && (
                <div className="flex justify-between text-xs mt-1">
                  <span className="text-slate-400 dark:text-slate-500">
                    {getInputMode(input) !== "byte" ? `${getInputMode(input)} mode` : "byte mode"}
                  </span>
                  <span className={isTooLong ? "text-rose-500 font-medium" : inputLength > capacity * 0.9 ? "text-amber-500" : "text-slate-400"}>
                    {inputLength.toLocaleString()} / {capacity.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Error Correction
              </label>
              <div className="flex gap-2">
                {ERROR_LEVELS.map((level) => (
                  <button
                    key={level}
                    onClick={() => setErrorLevel(level)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      errorLevel === level
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Higher = more damage-resistant, larger code
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Foreground
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {FOREGROUND_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      title={p.label}
                      onClick={() => setFgColor(p.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        fgColor === p.value
                          ? "border-indigo-500 scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: p.value }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Background
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {["#ffffff", "#f1f5f9", "#fef9c3", "#f0fdf4"].map((c) => (
                    <button
                      key={c}
                      onClick={() => setBgColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        bgColor === c
                          ? "border-indigo-500 scale-110"
                          : "border-slate-300"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-full h-8 rounded cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Size: {size}px
              </label>
              <input
                type="range"
                min={128}
                max={512}
                step={32}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center justify-between gap-4">
            <div
              ref={qrRef}
              className="flex items-center justify-center flex-1 w-full rounded-xl"
              style={{ backgroundColor: bgColor, minHeight: 256, padding: 16 }}
            >
              {hasInput ? (
                isTooLong ? (
                  <div className="text-center text-sm text-rose-500 dark:text-rose-400 px-4">
                    <div className="text-4xl mb-3">⚠️</div>
                    <p className="font-medium">Content too long for level {errorLevel}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {inputLength.toLocaleString()} / {capacity.toLocaleString()} limit at level {errorLevel}.
                    </p>
                    {suggestedLevel ? (
                      <button
                        onClick={() => setErrorLevel(suggestedLevel)}
                        className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                      >
                        Switch to level {suggestedLevel} (fits {QR_CAPACITY[suggestedLevel][getInputMode(input)].toLocaleString()} chars)
                      </button>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1">
                        Exceeds all error correction levels. Shorten your input.
                      </p>
                    )}
                  </div>
                ) : (
                  <QRErrorBoundary
                    key={input}
                    fallback={
                      <div className="text-center text-sm text-rose-500 dark:text-rose-400 px-4">
                        <div className="text-4xl mb-3">⚠️</div>
                        <p className="font-medium">Cannot generate QR code</p>
                        <p className="text-xs text-slate-400 mt-1">
                          The input could not be encoded. Try different content or a lower error correction level.
                        </p>
                      </div>
                    }
                  >
                    <QRCode
                      value={input}
                      level={errorLevel}
                      fgColor={fgColor}
                      bgColor={bgColor}
                      size={Math.min(size, 320)}
                    />
                  </QRErrorBoundary>
                )
              ) : (
                <div className="text-slate-300 dark:text-slate-600 text-center text-sm select-none">
                  <div className="text-5xl mb-3">⬛</div>
                  Your QR code will appear here
                </div>
              )}
            </div>

            <div className="flex gap-3 w-full">
              <button
                disabled={!hasInput}
                onClick={downloadSVG}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Download SVG
              </button>
              <button
                disabled={!hasInput}
                onClick={downloadPNG}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Download PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
