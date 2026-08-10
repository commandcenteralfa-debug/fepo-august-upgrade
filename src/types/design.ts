export type FestivalType = "diwali" | "holi" | "dussehra" | "navratri" | "rama_navami" | "finance" | "it-tech" | "marketing" | "sales" | "dj" | "real-estate" | "fashion" | "christmas" | "eid" | "durgapuja" | "ganeshchaturthi" | "janmashtami" | "rakshabandhan" | "default";

export type LogoAnchor = "top-left" | "top-center" | "bottom-center" | "badge";
export type TextLayout = "vertical-sidebar" | "centered-stack" | "split-header-footer" | "floating-minimalist";
export type FontCategory = "luxury" | "vibrant" | "minimal" | "traditional";

export interface MatrixConfig {
  logoAnchor: LogoAnchor;
  textLayout: TextLayout;
  fontCategory: FontCategory;
}

export interface TextStyle {
  color: string;
  fontSize: number;
}

/** Minimal view of a template mapping element used by the editor sidebar. */
export interface TemplateElementInfo {
  id: string;
  type: string;
  color?: string;
  fontSize?: number;
  font_size?: number;
  alignment?: string;
}

/** The fetched template mapping JSON (kept in context for the editor sidebar). */
export interface TemplateConfig {
  elements: TemplateElementInfo[];
}

export interface DesignState {
  text: {
    shop: string;
    phone: string;
    email: string;
    countryCode: string;
  };
  styles: {
    shop: TextStyle;
    phone: TextStyle;
    email: TextStyle;
  };
  logoUrl: string | null;
  activeFestival: FestivalType;
  activeVariantIndex: number;
  variantConfigs: MatrixConfig[];
  globalFontOverride: FontCategory | null;
  isEditing: boolean;
  elementPositions: Record<string, { x: number; y: number }>;
  elementScales: Record<string, number>;
  elementSizes: Record<string, { width: number; height: number }>;
  /** Per-element style overrides (color/fontSize) applied on top of the mapping JSON. */
  elementStyles: Record<string, { color?: string; fontSize?: number }>;
  /** Fetched mapping JSON for the active template (read by the sidebar controls). */
  templateConfig: TemplateConfig | null;
  templateSize: { width: number; height: number } | null;
  aspectRatio: string;
  customWidth: number;
  customHeight: number;
  zoom: string | number;
  // new property for tracking currently selected element
  selectedElementId: string | null;
  // elements hidden via the Delete key (part of history snapshots so undo restores them)
  deletedElementIds: string[];
}

export type DesignAction =
  | { type: "SET_SHOP"; payload: string }
  | { type: "SET_PHONE"; payload: string }
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_COUNTRY_CODE"; payload: string }
  | { type: "SET_STYLE"; payload: { element: "shop" | "phone" | "email"; style: Partial<TextStyle> } }
  | { type: "SET_LOGO"; payload: string | null }
  | { type: "SET_FESTIVAL"; payload: FestivalType }
  | { type: "SET_VARIANT"; payload: number }
  | { type: "SET_EDITING"; payload: boolean }
  | { type: "SET_SELECTED_ELEMENT"; payload: string | null }
  | { type: "CLEAR_SELECTION" }
  | { type: "SET_POSITION"; payload: { id: string; x: number; y: number } }
  | { type: "SET_ELEMENT_SCALE"; payload: { id: string; scale: number } }
  | { type: "SET_ELEMENT_SIZE"; payload: { id: string; width: number; height: number } }
  | { type: "SET_ELEMENT_STYLE"; payload: { id: string; style: Partial<{ color: string; fontSize: number }> } }
  | { type: "SET_TEMPLATE_CONFIG"; payload: TemplateConfig | null }
  | { type: "SET_TEMPLATE_SIZE"; payload: { width: number; height: number } | null }
  | { type: "REMOVE_ELEMENT"; payload: { id: string } }
  | { type: "RESET_POSITIONS" }
  | { type: "RESET_ALL" }
  | { type: "APPLY_PRESET"; payload: { fontCategory: FontCategory; styles: DesignState["styles"] } }
  | { type: "SET_ASPECT_RATIO"; payload: string }
  | { type: "SET_CUSTOM_DIMENSIONS"; payload: { width: number; height: number } }
  | { type: "SET_ZOOM"; payload: string | number }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_STATE"; payload: DesignState }
