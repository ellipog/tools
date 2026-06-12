"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ScrambleText from "@/components/ScrambleText";
import Navbar from "@/components/ui/Navbar";
import { jpcharlist } from "@/public/data/charlists";

type Category = {
  key: string;
  label: string;
  jp: string;
};

type Unit = {
  key: string;
  label: string;
  short: string;
};

type ConversionTable = Record<string, number | ((v: number) => number)>;

const CATEGORIES: Category[] = [
  { key: "currency", label: "currency", jp: "通貨" },
  { key: "length", label: "length", jp: "長さ" },
  { key: "weight", label: "weight", jp: "重さ" },
  { key: "temperature", label: "temperature", jp: "温度" },
  { key: "volume", label: "volume", jp: "体積" },
  { key: "speed", label: "speed", jp: "速度" },
  { key: "data", label: "data", jp: "データ" },
  { key: "time", label: "time", jp: "時間" },
  { key: "area", label: "area", jp: "面積" },
  { key: "pressure", label: "pressure", jp: "圧力" },
  { key: "energy", label: "energy", jp: "エネルギー" },
];

const UNITS: Record<string, Unit[]> = {
  currency: [
    { key: "USD", label: "US Dollar", short: "USD" },
    { key: "EUR", label: "Euro", short: "EUR" },
    { key: "GBP", label: "British Pound", short: "GBP" },
    { key: "JPY", label: "Japanese Yen", short: "JPY" },
    { key: "CNY", label: "Chinese Yuan", short: "CNY" },
    { key: "KRW", label: "South Korean Won", short: "KRW" },
    { key: "INR", label: "Indian Rupee", short: "INR" },
    { key: "CAD", label: "Canadian Dollar", short: "CAD" },
    { key: "AUD", label: "Australian Dollar", short: "AUD" },
    { key: "CHF", label: "Swiss Franc", short: "CHF" },
    { key: "SEK", label: "Swedish Krona", short: "SEK" },
    { key: "NOK", label: "Norwegian Krone", short: "NOK" },
    { key: "NZD", label: "New Zealand Dollar", short: "NZD" },
    { key: "MXN", label: "Mexican Peso", short: "MXN" },
    { key: "SGD", label: "Singapore Dollar", short: "SGD" },
    { key: "HKD", label: "Hong Kong Dollar", short: "HKD" },
    { key: "BRL", label: "Brazilian Real", short: "BRL" },
    { key: "ZAR", label: "South African Rand", short: "ZAR" },
    { key: "TRY", label: "Turkish Lira", short: "TRY" },
    { key: "DKK", label: "Danish Krone", short: "DKK" },
    { key: "PLN", label: "Polish Zloty", short: "PLN" },
    { key: "THB", label: "Thai Baht", short: "THB" },
    { key: "IDR", label: "Indonesian Rupiah", short: "IDR" },
    { key: "MYR", label: "Malaysian Ringgit", short: "MYR" },
    { key: "PHP", label: "Philippine Peso", short: "PHP" },
    { key: "AED", label: "UAE Dirham", short: "AED" },
    { key: "SAR", label: "Saudi Riyal", short: "SAR" },
    { key: "TWD", label: "Taiwan Dollar", short: "TWD" },
    { key: "VND", label: "Vietnamese Dong", short: "VND" },
    { key: "NGN", label: "Nigerian Naira", short: "NGN" },
    { key: "EGP", label: "Egyptian Pound", short: "EGP" },
    { key: "ARS", label: "Argentine Peso", short: "ARS" },
    { key: "COP", label: "Colombian Peso", short: "COP" },
    { key: "CLP", label: "Chilean Peso", short: "CLP" },
  ],
  length: [
    { key: "mm", label: "millimeter", short: "mm" },
    { key: "cm", label: "centimeter", short: "cm" },
    { key: "m", label: "meter", short: "m" },
    { key: "km", label: "kilometer", short: "km" },
    { key: "in", label: "inch", short: "in" },
    { key: "ft", label: "foot", short: "ft" },
    { key: "yd", label: "yard", short: "yd" },
    { key: "mile", label: "mile", short: "mi" },
  ],
  weight: [
    { key: "mg", label: "milligram", short: "mg" },
    { key: "g", label: "gram", short: "g" },
    { key: "kg", label: "kilogram", short: "kg" },
    { key: "oz", label: "ounce", short: "oz" },
    { key: "lb", label: "pound", short: "lb" },
    { key: "stone", label: "stone", short: "st" },
    { key: "ton", label: "US ton", short: "ton" },
  ],
  temperature: [
    { key: "c", label: "Celsius", short: "°C" },
    { key: "f", label: "Fahrenheit", short: "°F" },
    { key: "k", label: "Kelvin", short: "K" },
  ],
  volume: [
    { key: "ml", label: "milliliter", short: "mL" },
    { key: "l", label: "liter", short: "L" },
    { key: "cup", label: "cup", short: "cup" },
    { key: "pint", label: "pint", short: "pt" },
    { key: "quart", label: "quart", short: "qt" },
    { key: "gal", label: "gallon", short: "gal" },
    { key: "floz", label: "fluid ounce", short: "fl oz" },
    { key: "tsp", label: "teaspoon", short: "tsp" },
    { key: "tbsp", label: "tablespoon", short: "tbsp" },
  ],
  speed: [
    { key: "ms", label: "meter/second", short: "m/s" },
    { key: "kmh", label: "kilometer/hour", short: "km/h" },
    { key: "mph", label: "mile/hour", short: "mph" },
    { key: "knot", label: "knot", short: "kn" },
    { key: "sol", label: "speed of light", short: "c" },
  ],
  data: [
    { key: "b", label: "byte", short: "B" },
    { key: "kb", label: "kilobyte", short: "KB" },
    { key: "mb", label: "megabyte", short: "MB" },
    { key: "gb", label: "gigabyte", short: "GB" },
    { key: "tb", label: "terabyte", short: "TB" },
    { key: "pb", label: "petabyte", short: "PB" },
  ],
  time: [
    { key: "sec", label: "second", short: "s" },
    { key: "min", label: "minute", short: "min" },
    { key: "hour", label: "hour", short: "h" },
    { key: "day", label: "day", short: "d" },
    { key: "week", label: "week", short: "wk" },
    { key: "month", label: "month (avg)", short: "mo" },
    { key: "year", label: "year", short: "yr" },
  ],
  area: [
    { key: "mm2", label: "sq millimeter", short: "mm²" },
    { key: "cm2", label: "sq centimeter", short: "cm²" },
    { key: "m2", label: "sq meter", short: "m²" },
    { key: "km2", label: "sq kilometer", short: "km²" },
    { key: "ha", label: "hectare", short: "ha" },
    { key: "ac", label: "acre", short: "ac" },
    { key: "ft2", label: "sq foot", short: "ft²" },
    { key: "in2", label: "sq inch", short: "in²" },
    { key: "mi2", label: "sq mile", short: "mi²" },
  ],
  pressure: [
    { key: "pa", label: "pascal", short: "Pa" },
    { key: "kpa", label: "kilopascal", short: "kPa" },
    { key: "bar", label: "bar", short: "bar" },
    { key: "psi", label: "PSI", short: "psi" },
    { key: "atm", label: "atmosphere", short: "atm" },
    { key: "mmhg", label: "mmHg", short: "mmHg" },
  ],
  energy: [
    { key: "j", label: "joule", short: "J" },
    { key: "kj", label: "kilojoule", short: "kJ" },
    { key: "cal", label: "calorie", short: "cal" },
    { key: "kcal", label: "kilocalorie", short: "kcal" },
    { key: "wh", label: "watt-hour", short: "Wh" },
    { key: "kwh", label: "kilowatt-hour", short: "kWh" },
    { key: "ev", label: "electronvolt", short: "eV" },
  ],
};

// Convert to base, then to target
function convert(value: number, from: string, to: string, rates?: Record<string, number>): number {
  if (from === to) return value;

  const toBase = rates?.[from] ?? TO_BASE[from];
  const fromBase = rates?.[to] ?? TO_BASE[to];
  if (toBase !== undefined && fromBase !== undefined) {
    const baseVal = typeof toBase === "function" ? toBase(value) : value * toBase;
    return typeof fromBase === "function" ? fromBase(baseVal) : baseVal / fromBase;
  }

  return value;
}

// Special conversion functions
const cToK = (c: number) => c + 273.15;
const kToC = (k: number) => k - 273.15;
const cToF = (c: number) => c * 9 / 5 + 32;
const fToC = (f: number) => (f - 32) * 5 / 9;
const fToK = (f: number) => cToK(fToC(f));
const kToF = (k: number) => cToF(kToC(k));

// Temperature: base is Celsius
// For other categories: base is the SI unit (m, g, L, m/s, B, s, m², Pa, J)
const TO_BASE: Record<string, number | ((v: number) => number)> = {
  // Length -> meters
  mm: 0.001, cm: 0.01, m: 1, km: 1000,
  in: 0.0254, ft: 0.3048, yd: 0.9144, mile: 1609.344,
  // Weight -> grams
  mg: 0.001, g: 1, kg: 1000, oz: 28.3495, lb: 453.592, stone: 6350.29, ton: 907185,
  // Temperature -> Celsius
  c: 1, f: fToC, k: kToC,
  // Volume -> milliliters
  ml: 1, l: 1000, cup: 236.588, pint: 473.176, quart: 946.353,
  gal: 3785.41, floz: 29.5735, tsp: 4.92892, tbsp: 14.7868,
  // Speed -> m/s
  ms: 1, kmh: 0.277778, mph: 0.44704, knot: 0.514444, sol: 299792458,
  // Data -> bytes
  b: 1, kb: 1024, mb: 1048576, gb: 1073741824, tb: 1099511627776,
  pb: 1125899906842624,
  // Time -> seconds
  sec: 1, min: 60, hour: 3600, day: 86400, week: 604800,
  month: 2629800, year: 31557600,
  // Area -> sq meters
  mm2: 0.000001, cm2: 0.0001, m2: 1, km2: 1000000,
  ha: 10000, ac: 4046.86, ft2: 0.092903, in2: 0.00064516, mi2: 2589988,
  // Pressure -> pascals
  pa: 1, kpa: 1000, bar: 100000, psi: 6894.76, atm: 101325, mmhg: 133.322,
  // Energy -> joules
  j: 1, kj: 1000, cal: 4.184, kcal: 4184, wh: 3600, kwh: 3600000, ev: 1.602e-19,
};

function parseLengthInput(val: string, toUnit: string): number {
  const t = val.trim();
  if (!t.includes("'")) return parseFloat(t);
  const [feetStr, inchesStr] = t.split("'");
  const feet = parseFloat(feetStr);
  const inches = parseFloat((inchesStr || "").replace(/"/g, "").trim());
  if (isNaN(feet)) return NaN;
  const totalInches = feet * 12 + (isNaN(inches) ? 0 : inches);
  const meters = totalInches * 0.0254;
  const factor = TO_BASE[toUnit];
  if (factor !== undefined && typeof factor === "number") return meters / factor;
  return meters;
}

function formatResult(v: number, isCurrency?: boolean): string {
  if (!isFinite(v)) return "—";
  if (isCurrency) return v.toFixed(2);
  if (Math.abs(v) >= 1e15 || (Math.abs(v) < 1e-10 && v !== 0)) return v.toExponential(6);
  if (Number.isInteger(v) && Math.abs(v) < 1e15) return v.toLocaleString();
  const s = v.toPrecision(10);
  const n = parseFloat(s);
  if (Math.abs(n) >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
  if (Math.abs(n) >= 1) return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
  return n.toPrecision(6);
}

export default function UnitConverterPage() {
  const jpchars = useMemo(() => jpcharlist, []);

  const [category, setCategory] = useState("length");
  const [fromUnit, setFromUnit] = useState("m");
  const [toUnit, setToUnit] = useState("ft");
  const [fromValue, setFromValue] = useState("1");
  const [toValue, setToValue] = useState("");
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesTimestamp, setRatesTimestamp] = useState("");
  const currencyRates = useRef<Record<string, number>>({});
  const [fromSearch, setFromSearch] = useState("");
  const [fromOpen, setFromOpen] = useState(false);
  const [toSearch, setToSearch] = useState("");
  const [toOpen, setToOpen] = useState(false);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  const units = UNITS[category] || [];

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data.rates) {
        const rates: Record<string, number> = { USD: 1 };
        for (const [key, val] of Object.entries(data.rates)) {
          rates[key] = 1 / (val as number);
        }
        currencyRates.current = rates;
      }
      setRatesTimestamp(data.time_last_update_utc || "");
    } catch {
      // keep existing rates on failure
    } finally {
      setRatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (category === "currency" && Object.keys(currencyRates.current).length === 0) {
      fetchRates();
    }
  }, [category, fetchRates]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setFromOpen(false);
      if (toRef.current && !toRef.current.contains(e.target as Node)) setToOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeRates = category === "currency" ? currencyRates.current : undefined;

  const updateFrom = useCallback(
    (val: string) => {
      setFromValue(val);
      const num = category === "length" ? parseLengthInput(val, fromUnit) : parseFloat(val);
      if (isNaN(num) || !fromUnit || !toUnit) {
        setToValue("");
        return;
      }
      const isCurrency = category === "currency";

      setToValue(formatResult(convert(num, fromUnit, toUnit, activeRates), isCurrency));
    },
    [fromUnit, toUnit, activeRates, category],
  );

  const updateTo = useCallback(
    (val: string) => {
      setToValue(val);
      const num = category === "length" ? parseLengthInput(val, toUnit) : parseFloat(val);
      if (isNaN(num) || !fromUnit || !toUnit) {
        setFromValue("");
        return;
      }
      setFromValue(formatResult(convert(num, toUnit, fromUnit, activeRates), category === "currency"));
    },
    [fromUnit, toUnit, activeRates, category],
  );

  const swap = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFromValue(toValue);
    setToValue(fromValue);
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const keys = UNITS[cat].map((u) => u.key);
    setFromUnit(keys[0] || "");
    setToUnit(keys[keys.length > 1 ? 1 : 0] || "");
    setFromValue("");
    setToValue("");
    if (cat === "currency" && Object.keys(currencyRates.current).length === 0) {
      fetchRates();
    }
  };

  const handleFromUnitChange = (key: string) => {
    setFromUnit(key);
    if (fromValue) {
      const num = parseFloat(fromValue);
      if (!isNaN(num)) setToValue(formatResult(convert(num, key, toUnit, activeRates), category === "currency"));
    }
  };

  const handleToUnitChange = (key: string) => {
    setToUnit(key);
    if (fromValue) {
      const num = parseFloat(fromValue);
      if (!isNaN(num)) setToValue(formatResult(convert(num, fromUnit, key, activeRates), category === "currency"));
    }
  };

  return (
    <div className="min-h-dvh w-full bg-black overflow-y-auto overflow-x-hidden selection:bg-white selection:text-black">
      <Navbar title="unit_converter" jp="単位変換" category="utils" href="/utils/unit-converter" />
      <div className="h-full text-white p-6 sm:p-12 flex flex-col gap-12">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-4 border-b border-white/10 pb-8"
        >
          <button className="text-[10px] tracking-[0.3em] text-white/50 hover:text-white transition-colors uppercase border border-white/10 px-3 py-2 bg-white/5">
            v0.1
          </button>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-4 space-y-10"
          >
            {/* 01. CATEGORY */}
            <section>
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                01. category{" "}
                <ScrambleText text={"カテゴリ"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    onClick={() => handleCategoryChange(cat.key)}
                    className={`text-[10px] py-2 px-3 border tracking-[0.2em] uppercase transition-all text-left ${
                      category === cat.key
                        ? "bg-white text-black border-white font-bold"
                        : "border-white/10 text-white/30 hover:border-white/40 hover:bg-white/5"
                    }`}
                  >
                    {cat.label}{" "}
                    <ScrambleText
                      text={cat.jp}
                      chars={jpchars}
                      timeOffset={100}
                      autoPlay
                      className="text-xs text-white/35"
                    />
                  </button>
                ))}
              </div>
            </section>

            {/* 02. FROM */}
            <section className="space-y-3" ref={fromRef}>
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                02. from{" "}
                <ScrambleText text={"変換元"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={fromOpen ? fromSearch : units.find((u) => u.key === fromUnit)?.short || fromUnit}
                  onChange={(e) => { setFromSearch(e.target.value); setFromOpen(true); }}
                  onFocus={() => { setFromSearch(""); setFromOpen(true); }}
                  placeholder="search units…"
                  className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-3 py-2 outline-none focus:border-white/40 placeholder:text-white/20 uppercase tracking-widest"
                />
                {fromOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto bg-neutral-900 border border-white/10 custom-scrollbar">
                    {units
                      .filter((u) => !fromSearch.trim() || u.key.toLowerCase().includes(fromSearch.toLowerCase()) || u.label.toLowerCase().includes(fromSearch.toLowerCase()))
                      .map((u) => (
                        <button
                          key={u.key}
                          onClick={() => { handleFromUnitChange(u.key); setFromOpen(false); setFromSearch(""); }}
                          className={`w-full text-left text-[10px] px-3 py-2 tracking-widest uppercase transition-all ${
                            fromUnit === u.key
                              ? "bg-white text-black font-bold"
                              : "text-white/50 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {u.short}{" "}
                          <span className="text-[9px] text-white/30 normal-case font-normal">{u.label}</span>
                        </button>
                      ))}
                    {units.filter((u) => !fromSearch.trim() || u.key.toLowerCase().includes(fromSearch.toLowerCase()) || u.label.toLowerCase().includes(fromSearch.toLowerCase())).length === 0 && (
                      <div className="text-[10px] text-white/20 px-3 py-4 text-center tracking-widest uppercase">
                        no matches
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 03. TO */}
            <section className="space-y-3" ref={toRef}>
              <div className="text-[14px] text-white/70 tracking-[0.2em] uppercase mb-4">
                03. to{" "}
                <ScrambleText text={"変換先"} chars={jpchars} timeOffset={100} autoPlay className="text-sm text-white/35" />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={toOpen ? toSearch : units.find((u) => u.key === toUnit)?.short || toUnit}
                  onChange={(e) => { setToSearch(e.target.value); setToOpen(true); }}
                  onFocus={() => { setToSearch(""); setToOpen(true); }}
                  placeholder="search units…"
                  className="w-full bg-transparent border border-white/10 text-xs text-white/70 px-3 py-2 outline-none focus:border-white/40 placeholder:text-white/20 uppercase tracking-widest"
                />
                {toOpen && (
                  <div className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto bg-neutral-900 border border-white/10 custom-scrollbar">
                    {units
                      .filter((u) => !toSearch.trim() || u.key.toLowerCase().includes(toSearch.toLowerCase()) || u.label.toLowerCase().includes(toSearch.toLowerCase()))
                      .map((u) => (
                        <button
                          key={u.key}
                          onClick={() => { handleToUnitChange(u.key); setToOpen(false); setToSearch(""); }}
                          className={`w-full text-left text-[10px] px-3 py-2 tracking-widest uppercase transition-all ${
                            toUnit === u.key
                              ? "bg-white text-black font-bold"
                              : "text-white/50 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          {u.short}{" "}
                          <span className="text-[9px] text-white/30 normal-case font-normal">{u.label}</span>
                        </button>
                      ))}
                    {units.filter((u) => !toSearch.trim() || u.key.toLowerCase().includes(toSearch.toLowerCase()) || u.label.toLowerCase().includes(toSearch.toLowerCase())).length === 0 && (
                      <div className="text-[10px] text-white/20 px-3 py-4 text-center tracking-widest uppercase">
                        no matches
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* 04. SWAP */}
            <button
              onClick={swap}
              className="w-full border border-white/10 text-[10px] tracking-[0.3em] uppercase py-3 text-white/40 hover:text-white hover:border-white/40 transition-all"
            >
              swap ⇄
            </button>

            {category === "currency" && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchRates}
                    disabled={ratesLoading}
                    className="text-[9px] tracking-widest uppercase border border-white/10 px-3 py-1.5 text-white/30 hover:text-white hover:border-white/40 transition-all disabled:opacity-20"
                  >
                    {ratesLoading ? "loading…" : "refresh_rates"}
                  </button>
                </div>
                {ratesTimestamp && (
                  <div className="text-[8px] tracking-widest text-white/20 leading-relaxed">
                    rates as of {ratesTimestamp.replace(/\s*UTC$/, "")}
                  </div>
                )}
              </section>
            )}
          </motion.aside>

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="lg:col-span-8 flex flex-col bg-white/2 border border-white/5 min-h-[60vh] p-8"
          >
            <div className="flex-1 flex flex-col items-center justify-center gap-12">
              {/* FROM */}
              <div className="w-full max-w-md space-y-2">
                <div className="text-[10px] tracking-widest uppercase text-white/40">
                  {units.find((u) => u.key === fromUnit)?.label || fromUnit}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromValue}
                  onChange={(e) => updateFrom(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-4xl sm:text-5xl font-mono text-white outline-none border-b border-white/10 pb-2 focus:border-white/40 placeholder:text-white/10 text-right"
                />
              </div>

              {/* ARROW */}
              <div className="text-white/20 text-2xl">↓</div>

              {/* TO */}
              <div className="w-full max-w-md space-y-2">
                <div className="text-[10px] tracking-widest uppercase text-white/40">
                  {units.find((u) => u.key === toUnit)?.label || toUnit}
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={toValue}
                  onChange={(e) => updateTo(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-4xl sm:text-5xl font-mono text-white outline-none border-b border-white/10 pb-2 focus:border-white/40 placeholder:text-white/10 text-right"
                />
              </div>
            </div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}