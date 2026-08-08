"use client";

import React, { createContext, useContext, useReducer, useCallback, useState, ReactNode, useEffect } from "react";
import { DesignState, DesignAction, FestivalType } from "@/types/design";
import { MATRIX_CONFIGS } from "@/lib/designMatrix";

const initialState: DesignState = {
  text: {
    shop: "Your Business Name",
    phone: "9876543210",
    email: "your@email.com",
    countryCode: "+91",
  },
  styles: {
    shop: { color: "#F59E0B", fontSize: 32 },
    phone: { color: "#FFFFFF", fontSize: 16 },
    email: { color: "#FFFFFF", fontSize: 14 },
  },
  logoUrl: null,
  activeFestival: "diwali",
  activeVariantIndex: 0,
  variantConfigs: MATRIX_CONFIGS,
  globalFontOverride: null,
  isEditing: false,
  elementPositions: {},
  elementScales: {},
  elementSizes: {},
  templateSize: null,
  aspectRatio: "1:1",
  customWidth: 1080,
  customHeight: 1080,
  zoom: "fit",
  selectedElementId: null,
  deletedElementIds: [],
};

export const ASPECT_RATIOS = {
  "1:1": 1,
  "4:5": 4 / 5,
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  "A4 Portrait": 210 / 297,
  "A4 Landscape": 297 / 210,
  "A3 Portrait": 297 / 420,
  "A3 Landscape": 420 / 297,
  "A5": 148 / 210,
  "Square": 1,
  "Custom": 1, // calculated dynamically in getCanvasDimensions
};

export function getCanvasDimensions(state: DesignState): { width: number; height: number } {
  if (state.templateSize && state.templateSize.width > 0 && state.templateSize.height > 0) {
    return state.templateSize;
  }

  let ratio = 1;
  if (state.aspectRatio === "Custom") {
    const w = state.customWidth || 1080;
    const h = state.customHeight || 1080;
    ratio = w / h;
  } else {
    ratio = ASPECT_RATIOS[state.aspectRatio as keyof typeof ASPECT_RATIOS] || 1;
  }

  if (ratio < 1) {
    return {
      width: 729,
      height: Math.round(729 / ratio),
    };
  } else {
    return {
      width: Math.round(729 * ratio),
      height: 729,
    };
  }
}

function getInitialState(initialFestival?: FestivalType, initialTemplateIndex?: number): DesignState {
  const festival = initialFestival || "diwali";
  return {
    ...initialState,
    activeFestival: festival,
    activeVariantIndex: initialTemplateIndex ?? 0,
  };
}

function designReducer(state: DesignState, action: DesignAction): DesignState {
  switch (action.type) {
    case "SET_SHOP":
      return { ...state, text: { ...state.text, shop: action.payload } };
    case "SET_PHONE":
      return { ...state, text: { ...state.text, phone: action.payload } };
    case "SET_EMAIL":
      return { ...state, text: { ...state.text, email: action.payload } };
    case "SET_COUNTRY_CODE":
      return { ...state, text: { ...state.text, countryCode: action.payload } };
    case "SET_STYLE":
      return {
        ...state,
        styles: {
          ...state.styles,
          [action.payload.element]: {
            ...state.styles[action.payload.element],
            ...action.payload.style,
          },
        },
      };
    case "SET_LOGO":
      return { ...state, logoUrl: action.payload };
    case "SET_FESTIVAL":
      return { ...state, activeFestival: action.payload, selectedElementId: null, deletedElementIds: [] };
    case "SET_VARIANT":
      return { ...state, activeVariantIndex: action.payload, selectedElementId: null, deletedElementIds: [] };
    case "SET_EDITING":
      return { ...state, isEditing: action.payload };
    case "SET_SELECTED_ELEMENT":
      return { ...state, selectedElementId: action.payload };
    case "CLEAR_SELECTION":
      return { ...state, selectedElementId: null };
    case "SET_POSITION": {
      const { width, height } = getCanvasDimensions(state);
      return {
        ...state,
        elementPositions: {
          ...state.elementPositions,
          [action.payload.id]: {
            x: action.payload.x / width,
            y: action.payload.y / height,
          },
        },
      };
    }
    case "RESET_POSITIONS":
      return { ...state, elementPositions: {} };
    case "RESET_ALL":
      return {
        ...state,
        elementPositions: {},
        elementScales: {},
        elementSizes: {},
        deletedElementIds: [],
        selectedElementId: null,
        isEditing: false,
        aspectRatio: "1:1",
        zoom: "fit"
      };
    case "SET_ELEMENT_SCALE":
      return {
        ...state,
        elementScales: {
          ...state.elementScales,
          [action.payload.id]: action.payload.scale,
        },
      };
    case "SET_ELEMENT_SIZE": {
      const { width, height } = getCanvasDimensions(state);
      return {
        ...state,
        elementSizes: {
          ...state.elementSizes,
          [action.payload.id]: {
            width: action.payload.width / width,
            height: action.payload.height / height,
          },
        },
      };
    }
    case "SET_TEMPLATE_SIZE":
      return { ...state, templateSize: action.payload };
    case "REMOVE_ELEMENT": {
      const { id } = action.payload;
      const elementPositions = { ...state.elementPositions };
      const elementScales = { ...state.elementScales };
      const elementSizes = { ...state.elementSizes };
      delete elementPositions[id];
      delete elementScales[id];
      delete elementSizes[id];
      return {
        ...state,
        elementPositions,
        elementScales,
        elementSizes,
        selectedElementId: null,
        deletedElementIds: state.deletedElementIds.includes(id) ? state.deletedElementIds : [...state.deletedElementIds, id],
      };
    }
    case "APPLY_PRESET":
      return {
        ...state,
        styles: action.payload.styles,
        globalFontOverride: action.payload.fontCategory,
      };
    case "SET_ASPECT_RATIO":
      return { ...state, aspectRatio: action.payload };
    case "SET_CUSTOM_DIMENSIONS":
      return { ...state, customWidth: action.payload.width, customHeight: action.payload.height };
    case "SET_ZOOM":
      return { ...state, zoom: action.payload };
    case "SET_STATE":
      return action.payload;
    default:
      return state;
  }
}

const MAX_HISTORY = 50;
const GESTURE_COALESCE_MS = 700;

const ELEMENT_ACTIONS = new Set<DesignAction["type"]>([
  "SET_POSITION",
  "SET_ELEMENT_SCALE",
  "SET_ELEMENT_SIZE",
]);

const UNDOABLE_ACTIONS = new Set<DesignAction["type"]>([
  "SET_SHOP",
  "SET_PHONE",
  "SET_EMAIL",
  "SET_COUNTRY_CODE",
  "SET_STYLE",
  "SET_LOGO",
  "SET_FESTIVAL",
  "SET_VARIANT",
  "SET_POSITION",
  "SET_ELEMENT_SCALE",
  "SET_ELEMENT_SIZE",
  "REMOVE_ELEMENT",
  "RESET_POSITIONS",
  "RESET_ALL",
  "APPLY_PRESET",
  "SET_ASPECT_RATIO",
  "SET_CUSTOM_DIMENSIONS",
]);

interface HistoryEntry {
  snapshot: DesignState;
  elementId?: string;
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
}

interface DesignContextType {
  state: DesignState;
  dispatch: React.Dispatch<DesignAction>;
  canUndo: boolean;
  canRedo: boolean;
}

const DesignContext = createContext<DesignContextType | undefined>(undefined);

interface DesignProviderProps {
  children: ReactNode;
  initialFestival?: FestivalType;
  initialTemplateIndex?: number;
}

export function DesignProvider({ children, initialFestival, initialTemplateIndex }: DesignProviderProps) {
  const [state, dispatch] = useReducer(designReducer, null, () => getInitialState(initialFestival, initialTemplateIndex));
  const [history, setHistory] = useState<HistoryState>({ past: [], future: [] });
  const lastElementGestureRef = React.useRef<{ id: string; time: number } | null>(null);

  useEffect(() => {
    if (initialFestival) {
      dispatch({ type: "SET_FESTIVAL", payload: initialFestival });
    }
  }, [initialFestival]);

  const wrappedDispatch = useCallback((action: DesignAction) => {
    if (action.type === "UNDO") {
      const prev = history.past[history.past.length - 1];
      if (!prev) return;
      setHistory({
        past: history.past.slice(0, -1),
        future: [{ snapshot: state }, ...history.future].slice(0, MAX_HISTORY),
      });
      dispatch({ type: "SET_STATE", payload: prev.snapshot });
      return;
    }

    if (action.type === "REDO") {
      const next = history.future[0];
      if (!next) return;
      setHistory({
        past: [...history.past, { snapshot: state }].slice(-MAX_HISTORY),
        future: history.future.slice(1),
      });
      dispatch({ type: "SET_STATE", payload: next.snapshot });
      return;
    }

    if (UNDOABLE_ACTIONS.has(action.type)) {
      const isElementAction = ELEMENT_ACTIONS.has(action.type);
      const elementId = isElementAction ? (action as { payload: { id: string } }).payload.id : null;

      if (isElementAction) {
        const last = lastElementGestureRef.current;
        const now = Date.now();
        if (last && elementId !== null && last.id === elementId && now - last.time < GESTURE_COALESCE_MS) {
          last.time = now;
        } else if (elementId !== null) {
          lastElementGestureRef.current = { id: elementId, time: now };
          setHistory((prev) => ({
            past: [...prev.past, { snapshot: state, elementId }].slice(-MAX_HISTORY),
            future: [],
          }));
        } else {
          lastElementGestureRef.current = null;
          setHistory((prev) => ({
            past: [...prev.past, { snapshot: state }].slice(-MAX_HISTORY),
            future: [],
          }));
        }
      } else {
        lastElementGestureRef.current = null;
        setHistory((prev) => ({
          past: [...prev.past, { snapshot: state }].slice(-MAX_HISTORY),
          future: [],
        }));
      }
    }

    dispatch(action);
  }, [state, history]);

  return (
    <DesignContext.Provider value={{ state, dispatch: wrappedDispatch, canUndo: history.past.length > 0, canRedo: history.future.length > 0 }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const context = useContext(DesignContext);
  if (!context) {
    throw new Error("useDesign must be used within a DesignProvider");
  }
  return context;
}
