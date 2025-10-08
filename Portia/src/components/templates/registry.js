// src/components/templates/registry.js
import MenuCard from "./MenuCard";
import MenuCardPanel from "./panels/MenuCardPanel";

import MealCard from "./MealCard";
import MealCardPanel from "./panels/MealCardPanel";

import PizzaCard from "./PizzaCard";
import PizzaCardPanel from "./panels/PizzaCardPanel";

// SVG renderers
import PizzaCardSVG from '../../svg/PizzaCardSVG.jsx';
import MealCardSVG from '../../svg/MealCardSVG.jsx';
import MenuCardSVG from '../../svg/MenuCardSVG.jsx';

/**
 * SVG_RENDERERS
 * - Support BOTH the legacy PascalCase keys AND the actual section.type values (kebab-case)
 *   so svgAssemble can always find a renderer.
 */
export const SVG_RENDERERS = {
  // kebab-case (matches section.type)
  'menu-card': MenuCardSVG,
  'meal-card': MealCardSVG,
  'pizza-card': PizzaCardSVG,

  // legacy PascalCase (compat)
  MenuCard: MenuCardSVG,
  MealCard: MealCardSVG,
  PizzaCard: PizzaCardSVG,
};

const newId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `id_${Math.random().toString(36).slice(2)}`;

/** Templates available to the editor */
export const TEMPLATE_REGISTRY = {
  /* ───────────────────────────── MENU CARD ───────────────────────────── */
  "menu-card": {
    label: "Menu Card",
    Component: MenuCard,
    Panel: MenuCardPanel,
    defaults: () => ({
      id: newId(),
      type: "menu-card",
      x: 60,
      y: 60,
      w: 820,
      h: 620,
      radius: 18,
      bgType: "solid",
      frameColor: "#ffffff",
      gradFrom: "#ffffff",
      gradTo: "#e9e9e9",
      alpha: 1,
      padX: 28,
      padY: 22,
      contentTopPad: 0,
      cardBgType: "solid",
      cardBg: "#ffffff",
      cardBgImage: "",
      cardBgFit: "cover",
      cardAlpha: 0.95,
      header: {
        style: "solid",
        align: "center",
        reservedHeight: 120,
        widthPct: 100,
        offsetX: 0,
        offsetY: 0,
        props: { fill: "#1f8a4c", text: "CARD TITLE", label: "CARD TITLE", textColor: "#ffffff" },
      },
      titleFont: "Poppins",
      bodyFont: "Inter",
      nameColor: "#111111",
      nameSize: 24,
      descColor: "#444444",
      descSize: 18,
      allergenColor: "#2aa43a",
      allergenSize: 14,
      priceFormat: "normal",
      items: [
        { id: newId(), name: "Item", desc: "Fresh Cut", allergens: "1,7,8", price: "€9.50" },
        { id: newId(), name: "Item", desc: "", allergens: "", price: "€11.00" },
      ],
      stickers: [],
    }),
  },

  /* ───────────────────────────── MEAL CARD ───────────────────────────── */
  "meal-card": {
    label: "Meal Card",
    Component: MealCard,
    Panel: MealCardPanel,
    defaults: () => ({
      id: newId(),
      type: "meal-card",
      x: 60,
      y: 60,
      w: 520,
      h: 720,
      radius: 22,
      bgType: "gradient",
      frameColor: "#ffffff",
      gradFrom: "#ffffff",
      gradTo: "#c8421f",
      alpha: 1,
      padX: 24,
      padY: 22,
      contentTopPad: 0,
      cardBgType: "solid",
      cardBg: "#ffffff",
      cardBgImage: "",
      cardBgFit: "cover",
      cardAlpha: 0.95,
      titleAlign: "left",
      titleSpacing: 2,
      titleFont: "Poppins",
      title1: "CHICKEN BURGER",
      title1Size: 44,
      title1Color: "#257453",
      title2: "MEAL",
      title2Size: 34,
      title2Color: "#1e1e1e",
      title3: "(With Cheese)",
      title3Size: 22,
      title3Color: "#b01c1c",
      bodyLines: ["(Breaded)"],
      bodySize: 22,
      bodyColor: "#1e1e1e",
      bodyFont: "Inter",
      currency: "€",
      priceInt: "11",
      priceDec: "00",
      priceFlagColor: "#1f8a4c",
      priceTextColor: "#ffffff",
      priceFlagW: 200,
      priceFlagH: 84,
      priceFlagNotch: 36,
      priceFlagRadius: 18,
      priceFlagOffsetX: 0,
      priceFlagOffsetY: 0,
      priceFlagDirection: "right",
      currencyScale: 0.45,
      decimalsScale: 0.40,
      currencyDy: 0,
      decimalsDy: -2,
      stickers: [],
    }),
  },

  /* ───────────────────────────── PIZZA CARD ───────────────────────────── */
  "pizza-card": {
    label: "Pizza Card",
    Component: PizzaCard,
    Panel: PizzaCardPanel,
    defaults: () => ({
      id: newId(),
      type: "pizza-card",
      x: 60,
      y: 60,
      w: 980,
      h: 1020,
      radius: 26,
      padX: 28,
      padY: 22,
      contentTopPad: 8,
      bgType: "gradient",
      frameColor: "#ffffff",
      gradFrom: "#ffffff",
      gradTo: "#e6e6e6",
      alpha: 0.98,
      cardBg: "#ffffff",
      cardBgImage1: "",
      cardBgFit: "cover",
      cardBg1Alpha: 1,
      cardBgImage2: "",
      cardBg2Fit: "contain",
      cardBg2Alpha: 1,
      header: {
        style: "solid",
        align: "center",
        reservedHeight: 120,
        widthPct: 100,
        offsetX: 0,
        offsetY: 0,
        props: { fill: "#1f8a4c", text: "PIZZA", label: "PIZZA", textColor: "#ffffff" },
      },
      headerFont: "Poppins",
      headerTitleSize: 0,
      colCount: 3,
      colLabels: ['10"', '12"', '16"'],
      colHeaderSize: 16,
      items: [],
      bodyFont: "Inter",
      nameColor: "#c63b2f",
      nameSize: 30,
      descColor: "#333333",
      descSize: 20,
      allergenColor: "#2aa43a",
      allergenSize: 16,
      allergenRaise: -8,
      priceFont: "Inter",
      priceColor: "#1f2937",
      priceSize: 22,
      rowGap: 10,
      divider: true,
      footerFont: "Poppins",
      footerLine1: "CREATE YOUR OWN PIZZA WITH OUR FRESH TOPPINGS",
      footerLine1Color: "#178c45",
      footerLine1Size: 22,
      footerLine1Align: "center",
      footerLine2:
        "Ham, Pepperoni, Chicken, Bacon, Chorizo, Parma Ham, Spinach, Mushroom, Onion, Peppers, Tomato, Olives, Pineapple, Jalapeños, Sweetcorn, Chili, Buffalo Mozzarella, Garlic Cheese, Fresh Tomato",
      footerLine2Color: "#222222",
      footerLine2Size: 18,
      footerLine2Align: "center",
      stickers: [],
    }),
  },
};

export const DEFAULT_TEMPLATE_TYPE = "menu-card";

export function makeSection(type = DEFAULT_TEMPLATE_TYPE) {
  const entry = TEMPLATE_REGISTRY[type] || TEMPLATE_REGISTRY[DEFAULT_TEMPLATE_TYPE];
  const base = entry.defaults();
  return { ...base, id: newId() };
}
