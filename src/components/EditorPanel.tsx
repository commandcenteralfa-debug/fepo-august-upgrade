"use client";

import { useState } from "react";
import { useDesign } from "@/context/DesignContext";
import { ChevronDown, Download, Move, Check } from "lucide-react";
import { motion } from "framer-motion";

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

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 10);
    dispatch({ type: "SET_PHONE", payload: digitsOnly });
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
    </div>
  );
}

export function EditorActions() {
  const { state, dispatch } = useDesign();

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
