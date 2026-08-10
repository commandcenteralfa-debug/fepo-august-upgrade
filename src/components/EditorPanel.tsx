"use client";

import { useState, useRef } from "react";
import { useDesign } from "@/context/DesignContext";
import { ChevronDown, Download, Move, Check, Upload, Trash2, Loader2, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;

const COUNTRY_CODES = [
  { code: "+91", label: "IN", flag: "🇮🇳" },
  { code: "+1", label: "US", flag: "🇺🇸" },
  { code: "+44", label: "UK", flag: "🇬🇧" },
  { code: "+61", label: "AU", flag: "🇦🇺" },
  { code: "+1", label: "CA", flag: "🇨🇦" },
  { code: "+65", label: "SG", flag: "🇸🇬" },
  { code: "+971", label: "AE", flag: "🇦🇪" },
  { code: "+966", label: "SA", flag: "🇸🇦" },
  { code: "+92", label: "PK", flag: "🇵🇰" },
  { code: "+880", label: "BD", flag: "🇧🇩" },
];

export function EditorInputs() {
  const { state, dispatch } = useDesign();
  const countryCode = state.text.countryCode;
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    dispatch({ type: "SET_PHONE", payload: digitsOnly });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("Logo must be 2 MB or smaller.");
      return;
    }

    setLogoError(null);
    setIsLogoUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setIsLogoUploading(false);
      dispatch({ type: "SET_LOGO", payload: reader.result as string });
    };
    reader.onerror = () => {
      setIsLogoUploading(false);
      setLogoError("Could not read that file. Please try another image.");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1">
      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5">
        <label className="text-[9px] uppercase tracking-wider text-stone-500 mb-1 block">Business Name</label>
        <input 
          type="text" 
          value={state.text.shop}
          onChange={(e) => dispatch({ type: "SET_SHOP", payload: e.target.value })}
          className="w-full bg-white border border-stone-200 focus:border-primary rounded-md px-2 py-1 text-xs text-stone-800 transition-all placeholder-stone-400" 
        />
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5">
        <label className="text-[9px] uppercase tracking-wider text-stone-500 mb-1 block">Contact Number</label>
        <div className="flex gap-1">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCountryDropdown(!showCountryDropdown)}
              className="h-full bg-white border border-stone-200 focus:border-primary rounded-md px-1.5 py-1 text-xs text-stone-800 flex items-center gap-0.5 hover:bg-stone-50 transition-colors whitespace-nowrap"
            >
              {countryCode} <ChevronDown size={10} />
            </button>
            {showCountryDropdown && (
              <div className="absolute bottom-full left-0 mb-1 bg-white border border-stone-200 rounded-md overflow-hidden z-10 max-h-40 overflow-y-auto shadow-lg">
                {COUNTRY_CODES.map((c) => (
                  <button
                    key={c.code + c.label}
                    type="button"
                    onClick={() => { dispatch({ type: "SET_COUNTRY_CODE", payload: c.code }); setShowCountryDropdown(false); }}
                    className="w-full px-2 py-1 text-xs text-stone-800 hover:bg-stone-50 flex items-center gap-1.5 transition-colors"
                  >
                    <span>{c.flag}</span>
                    <span>{c.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <input 
            type="text"
            inputMode="numeric"
            value={state.text.phone}
            onChange={handlePhoneChange}
            placeholder="9876543210"
            className="flex-1 bg-white border border-stone-200 focus:border-primary rounded-md px-2 py-1 text-xs text-stone-800 transition-all placeholder-stone-400"
          />
        </div>
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5">
        <label className="text-[9px] uppercase tracking-wider text-stone-500 mb-1 block">Email</label>
        <input 
          type="email" 
          value={state.text.email}
          onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
          className="w-full bg-white border border-stone-200 focus:border-primary rounded-md px-2 py-1 text-xs text-stone-800 transition-all placeholder-stone-400" 
        />
      </div>

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5">
        <label className="text-[9px] uppercase tracking-wider text-stone-500 mb-1 block">Business Logo</label>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleLogoChange}
        />
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          disabled={isLogoUploading}
          onClick={() => logoInputRef.current?.click()}
          className="w-full h-6 md:h-7 flex items-center justify-center gap-1 text-[10px] md:text-xs font-medium rounded-md transition-all shadow-lg bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLogoUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {isLogoUploading ? "Uploading…" : state.logoUrl ? "Replace Logo" : "Upload Logo"}
        </motion.button>
        {state.logoUrl && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => dispatch({ type: "SET_LOGO", payload: null })}
            className="mt-1 w-full h-6 md:h-7 flex items-center justify-center gap-1 text-[10px] md:text-xs font-medium rounded-md transition-all shadow-lg bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-400 hover:to-rose-400"
          >
            <Trash2 size={12} />
            Remove Logo
          </motion.button>
        )}
        {logoError && (
          <p className="text-[9px] text-red-600 mt-1">{logoError}</p>
        )}
      </div>
    </div>
  );
}

export function EditorActions() {
  const { state, dispatch } = useDesign();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const selectedElementId = state.selectedElementId;
  const selectedElement = state.templateConfig?.elements.find((e) => e.id === selectedElementId);
  const isSelectedTextElement = !!selectedElement && (selectedElement.type === "text" || selectedElement.type === "number");
  const styleOverride = selectedElementId ? state.elementStyles[selectedElementId] : undefined;
  const elementColor = isSelectedTextElement ? (styleOverride?.color ?? selectedElement?.color ?? "#111111") : "#111111";
  const elementSize = isSelectedTextElement
    ? (styleOverride?.fontSize ?? selectedElement?.fontSize ?? selectedElement?.font_size ?? 26)
    : 26;

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSelectedTextElement || !selectedElementId) return;
    dispatch({ type: "SET_ELEMENT_STYLE", payload: { id: selectedElementId, style: { color: e.target.value } } });
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSelectedTextElement || !selectedElementId) return;
    const value = Math.round(Number(e.target.value));
    if (!Number.isFinite(value) || value <= 0) return;
    dispatch({ type: "SET_ELEMENT_STYLE", payload: { id: selectedElementId, style: { fontSize: value } } });
  };

  const handleDownload = () => {
    const sourceCanvas = document.getElementById("main-canvas") as HTMLCanvasElement | null;
    if (!sourceCanvas) return;

    const link = document.createElement("a");
    link.download = `${state.activeFestival}-design.png`;
    link.href = sourceCanvas.toDataURL("image/png");
    link.click();
  };

  const handleToggleEdit = async () => {
    if (state.isEditing) {
      if (Object.keys(state.elementPositions).length > 0) {
        try {
          await fetch("/api/save-template", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              festival: state.activeFestival,
              templateIndex: state.activeVariantIndex,
              positions: state.elementPositions,
            }),
          });
        } catch {
          // silent fail - positions are already saved locally
        }
      }
      dispatch({ type: "SET_EDITING", payload: false });
    } else {
      dispatch({ type: "SET_EDITING", payload: true });
    }
  };

  return (
    <div className="space-y-1">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleToggleEdit}
        className={`w-full h-6 md:h-7 flex items-center justify-center gap-1 text-[10px] md:text-xs font-medium rounded-md transition-all shadow-lg ${
          state.isEditing
            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-400 hover:to-emerald-400"
            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400"
        }`}
      >
        {state.isEditing ? <Check size={12} /> : <Move size={12} />}
        {state.isEditing ? "Done Editing" : "Edit Positions"}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="button"
        onClick={() => setIsAdvancedOpen((o) => !o)}
        className={`w-full h-6 md:h-7 flex items-center justify-center gap-1 text-[10px] md:text-xs font-medium rounded-md transition-all shadow-lg ${
          isAdvancedOpen
            ? "bg-gradient-to-r from-stone-600 to-slate-700 text-white hover:from-stone-500 hover:to-slate-600"
            : "bg-gradient-to-r from-slate-500 to-stone-600 text-white hover:from-slate-400 hover:to-stone-500"
        }`}
      >
        <SlidersHorizontal size={12} />
        Advanced Edit
        <ChevronDown size={10} className={`transition-transform ${isAdvancedOpen ? "rotate-180" : ""}`} />
      </motion.button>

      {isAdvancedOpen && (
        <div className="bg-stone-50 border border-stone-200 rounded-lg p-1.5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="text-[9px] uppercase tracking-wider text-stone-500 mb-1 block">Color:</label>
              <input
                type="color"
                value={elementColor}
                onChange={handleColorChange}
                className="w-full h-7 md:h-8 p-0.5 bg-white border border-stone-300 rounded-md cursor-pointer"
              />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-stone-500 mb-1 block">Size:</label>
              <input
                type="number"
                value={elementSize}
                onChange={handleSizeChange}
                min={1}
                max={500}
                className="w-full bg-white border border-stone-300 rounded-md px-2 py-1 text-[18px] text-stone-800 focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      <motion.button
        whileHover={{ scale: state.isEditing ? 1 : 1.02 }}
        whileTap={{ scale: state.isEditing ? 1 : 0.98 }}
        onClick={handleDownload}
        disabled={state.isEditing}
        className={`w-full h-6 md:h-7 flex items-center justify-center gap-1 text-[10px] md:text-xs font-medium rounded-md transition-all shadow-lg ${
          state.isEditing
            ? "bg-stone-300 text-stone-500 cursor-not-allowed shadow-none"
            : "bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400 text-white hover:from-orange-400 hover:via-amber-400 hover:to-yellow-300"
        }`}
      >
        <Download size={12} />
        Download Design
      </motion.button>
    </div>
  );
}
