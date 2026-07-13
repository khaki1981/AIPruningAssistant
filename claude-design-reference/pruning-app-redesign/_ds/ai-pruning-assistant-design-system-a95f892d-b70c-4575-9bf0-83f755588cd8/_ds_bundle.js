/* @ds-bundle: {"format":4,"namespace":"AIPruningAssistantDesignSystem_a95f89","components":[{"name":"SeasonBadge","sourcePath":"components/badges/SeasonBadge.jsx"},{"name":"StatusBadge","sourcePath":"components/badges/StatusBadge.jsx"},{"name":"Tag","sourcePath":"components/badges/Tag.jsx"},{"name":"AnalysisResultCard","sourcePath":"components/cards/AnalysisResultCard.jsx"},{"name":"Card","sourcePath":"components/cards/Card.jsx"},{"name":"PlantCard","sourcePath":"components/cards/PlantCard.jsx"},{"name":"StepCard","sourcePath":"components/cards/StepCard.jsx"},{"name":"AlertBox","sourcePath":"components/feedback/AlertBox.jsx"},{"name":"EmptyState","sourcePath":"components/feedback/EmptyState.jsx"},{"name":"LoadingState","sourcePath":"components/feedback/LoadingState.jsx"},{"name":"Modal","sourcePath":"components/feedback/Modal.jsx"},{"name":"Skeleton","sourcePath":"components/feedback/Skeleton.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Button","sourcePath":"components/forms/Button.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Fab","sourcePath":"components/forms/Fab.jsx"},{"name":"IconButton","sourcePath":"components/forms/IconButton.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"SearchBar","sourcePath":"components/forms/SearchBar.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Textarea","sourcePath":"components/forms/Textarea.jsx"},{"name":"UploadArea","sourcePath":"components/forms/UploadArea.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"AppHeader","sourcePath":"components/navigation/AppHeader.jsx"},{"name":"BottomNavigation","sourcePath":"components/navigation/BottomNavigation.jsx"},{"name":"PageTitle","sourcePath":"components/navigation/PageTitle.jsx"}],"sourceHashes":{"components/badges/SeasonBadge.jsx":"c2f773429783","components/badges/StatusBadge.jsx":"7a43c9fe71a6","components/badges/Tag.jsx":"f1af23e6adb0","components/cards/AnalysisResultCard.jsx":"d032e6340f68","components/cards/Card.jsx":"922aac416178","components/cards/PlantCard.jsx":"fcd2bd20f1ee","components/cards/StepCard.jsx":"ad1b5a627636","components/feedback/AlertBox.jsx":"b0468ebb2572","components/feedback/EmptyState.jsx":"03dd40c7efc3","components/feedback/LoadingState.jsx":"5144c49c6837","components/feedback/Modal.jsx":"3538a9cd8f00","components/feedback/Skeleton.jsx":"4cb823abb9ed","components/feedback/Toast.jsx":"10aec00bd7e1","components/forms/Button.jsx":"3d69dfe490f6","components/forms/Checkbox.jsx":"d475c42b34b5","components/forms/Fab.jsx":"6ddc9139bc5a","components/forms/IconButton.jsx":"46623aca62e3","components/forms/Input.jsx":"995213478f3e","components/forms/Radio.jsx":"9ee9d9a4ece8","components/forms/SearchBar.jsx":"6d442857a8ee","components/forms/Select.jsx":"7a64ab852f22","components/forms/Switch.jsx":"6ba8d29d023b","components/forms/Textarea.jsx":"1bf3d12bc4ee","components/forms/UploadArea.jsx":"a6ab356d2944","components/icons/Icon.jsx":"3e24c455a24b","components/navigation/AppHeader.jsx":"f091a986a0c0","components/navigation/BottomNavigation.jsx":"852f9d7fb1ca","components/navigation/PageTitle.jsx":"a734db664234","ui_kits/app/App.jsx":"23a2bded7cda","ui_kits/app/DiagnoseScreen.jsx":"d650213ab7c8","ui_kits/app/HomeScreen.jsx":"3f523eedf562","ui_kits/app/PlantDetailScreen.jsx":"cdfa385028c0"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AIPruningAssistantDesignSystem_a95f89 = window.AIPruningAssistantDesignSystem_a95f89 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/cards/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Generic surface card — the base container for content.
 * Use `interactive` for clickable cards (adds hover lift).
 */
function Card({
  children,
  padding = "var(--card-padding)",
  interactive = false,
  onClick,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: () => interactive && setHover(true),
    onMouseLeave: () => interactive && setHover(false),
    style: {
      background: "var(--color-surface)",
      border: "var(--card-border)",
      borderRadius: "var(--card-radius)",
      boxShadow: hover ? "var(--shadow-md)" : "var(--card-shadow)",
      padding,
      cursor: interactive ? "pointer" : "default",
      transform: hover ? "translateY(-2px)" : "none",
      transition: "box-shadow var(--dur) var(--ease), transform var(--dur) var(--ease)",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/Card.jsx", error: String((e && e.message) || e) }); }

// components/feedback/LoadingState.jsx
try { (() => {
/**
 * Loading state — animated spinner + message. Use while AI analysis runs.
 */
function LoadingState({
  message = "AIが写真を分析しています…",
  sub,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-live": "polite",
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      gap: 14,
      padding: "40px 24px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 40,
      height: 40,
      borderRadius: "50%",
      border: "3px solid var(--green-100)",
      borderTopColor: "var(--color-primary)",
      animation: "ds-spin 850ms linear infinite"
    }
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--fs-body)",
      fontWeight: "var(--fw-semibold)",
      color: "var(--color-text)"
    }
  }, message), sub && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--fs-caption)",
      lineHeight: 1.7,
      color: "var(--color-text-secondary)"
    }
  }, sub));
}
Object.assign(__ds_scope, { LoadingState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/LoadingState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Skeleton.jsx
try { (() => {
/**
 * Skeleton placeholder for loading content.
 * variant: text | title | block | circle | card.
 */
function Skeleton({
  variant = "text",
  width,
  height,
  lines = 3,
  style = {}
}) {
  const shimmer = {
    background: "linear-gradient(90deg, var(--line-200) 25%, #eef0e8 37%, var(--line-200) 63%)",
    backgroundSize: "200% 100%",
    animation: "ds-shimmer 1.4s ease-in-out infinite",
    borderRadius: "var(--radius-sm)"
  };
  if (variant === "text") {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 8,
        ...style
      }
    }, Array.from({
      length: lines
    }).map((_, i) => /*#__PURE__*/React.createElement("span", {
      key: i,
      style: {
        ...shimmer,
        height: 12,
        width: i === lines - 1 ? "65%" : "100%",
        borderRadius: "var(--radius-xs)"
      }
    })));
  }
  const dims = {
    title: {
      height: height || 22,
      width: width || "55%",
      borderRadius: "var(--radius-xs)"
    },
    block: {
      height: height || 120,
      width: width || "100%",
      borderRadius: "var(--radius-md)"
    },
    circle: {
      height: height || 48,
      width: width || 48,
      borderRadius: "50%"
    },
    card: {
      height: height || 220,
      width: width || "100%",
      borderRadius: "var(--radius-lg)"
    }
  }[variant] || {};
  return /*#__PURE__*/React.createElement("span", {
    style: {
      ...shimmer,
      display: "block",
      ...dims,
      ...style
    }
  });
}
Object.assign(__ds_scope, { Skeleton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Skeleton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Radio group rendered as selectable cards (matches 剪定の強さ selector).
 * Single choice. Meaning conveyed by fill + check ring, not color alone.
 */
function Radio({
  name,
  value,
  options = [],
  columns = 2,
  onChange,
  style = {},
  ...rest
}) {
  const norm = options.map(o => typeof o === "string" ? {
    value: o,
    label: o
  } : o);
  const groupName = name || (React.useId ? React.useId() : "radio");
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "radiogroup",
    style: {
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0,1fr))`,
      gap: 10,
      ...style
    }
  }, rest), norm.map(o => {
    const selected = value === o.value;
    return /*#__PURE__*/React.createElement("label", {
      key: o.value,
      style: {
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minHeight: 56,
        padding: "0 16px",
        border: "1.5px solid " + (selected ? "var(--color-primary)" : "var(--color-border-strong)"),
        borderRadius: "var(--radius-md)",
        background: selected ? "var(--color-primary-light)" : "var(--color-surface)",
        color: selected ? "var(--color-primary-strong)" : "var(--color-text)",
        fontWeight: selected ? "var(--fw-semibold)" : "var(--fw-regular)",
        cursor: "pointer",
        transition: "border-color var(--dur) var(--ease), background var(--dur) var(--ease)"
      }
    }, /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: groupName,
      value: o.value,
      checked: selected,
      onChange: () => onChange && onChange(o.value),
      className: "ds-visually-hidden"
    }), /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        flex: "0 0 auto",
        borderRadius: "50%",
        border: "1.5px solid " + (selected ? "var(--color-primary)" : "var(--color-border-strong)"),
        background: "var(--color-surface)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 11,
        height: 11,
        borderRadius: "50%",
        background: selected ? "var(--color-primary)" : "transparent",
        transition: "background var(--dur) var(--ease)"
      }
    })), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: "var(--fs-body)"
      }
    }, o.label));
  }));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Toggle switch for on/off settings. Large enough for easy tapping. */
function Switch({
  id,
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  style = {},
  ...rest
}) {
  const autoId = React.useId ? React.useId() : "sw";
  const swId = id || autoId;
  const isControlled = checked !== undefined;
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : inner;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: swId,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      minHeight: "var(--tap-min)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: swId,
    type: "checkbox",
    role: "switch",
    checked: checked,
    defaultChecked: defaultChecked,
    disabled: disabled,
    "aria-checked": on,
    onChange: e => {
      if (!isControlled) setInner(e.target.checked);
      onChange && onChange(e);
    },
    className: "ds-visually-hidden"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "relative",
      width: 48,
      height: 28,
      flex: "0 0 auto",
      borderRadius: "var(--radius-full)",
      background: on ? "var(--color-primary)" : "var(--color-border-strong)",
      transition: "background var(--dur) var(--ease)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: on ? 23 : 3,
      width: 22,
      height: 22,
      borderRadius: "50%",
      background: "#fff",
      boxShadow: "var(--shadow-sm)",
      transition: "left var(--dur) var(--ease)"
    }
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-body)",
      color: "var(--color-text)"
    }
  }, label));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
/**
 * Icon — Lucide stroke icon wrapper.
 * Renders a single Lucide icon by name. Requires the Lucide UMD script
 * (https://unpkg.com/lucide@latest) to be loaded on the page.
 * Design system default: stroke-width 1.75, size 20–24, currentColor.
 */
function Icon({
  name,
  size = 20,
  strokeWidth = 1.75,
  className = "",
  style = {},
  label
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.lucide) return;
    el.innerHTML = "";
    const i = document.createElement("i");
    i.setAttribute("data-lucide", name);
    el.appendChild(i);
    try {
      window.lucide.createIcons({
        attrs: {
          width: size,
          height: size,
          "stroke-width": strokeWidth
        }
      });
    } catch (e) {/* lucide not ready */}
  }, [name, size, strokeWidth]);
  return React.createElement("span", {
    ref,
    className: "ds-icon " + className,
    "aria-hidden": label ? undefined : true,
    "aria-label": label,
    role: label ? "img" : undefined,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      flex: "0 0 auto",
      color: "inherit",
      ...style
    }
  });
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/badges/SeasonBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Season badge — shows suitability of the current period for pruning.
 * level: good=適期 / ok=可能 / avoid=避ける. Icon + word, not color-only.
 */
const LEVELS = {
  good: {
    fg: "var(--green-800)",
    bg: "var(--color-success-bg)",
    bd: "var(--green-300)",
    icon: "check-circle-2",
    word: "適期"
  },
  ok: {
    fg: "var(--blue-700)",
    bg: "var(--color-info-bg)",
    bd: "var(--blue-100)",
    icon: "scissors",
    word: "剪定可"
  },
  avoid: {
    fg: "var(--color-warning-text)",
    bg: "var(--color-warning-bg)",
    bd: "var(--yellow-200)",
    icon: "hand",
    word: "見送り"
  }
};
function SeasonBadge({
  level = "good",
  month,
  label,
  style = {},
  ...rest
}) {
  const l = LEVELS[level] || LEVELS.good;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 30,
      padding: "0 12px 0 10px",
      borderRadius: "var(--radius-full)",
      border: "1px solid " + l.bd,
      background: l.bg,
      color: l.fg,
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-caption)",
      lineHeight: 1,
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: l.icon,
    size: 15,
    strokeWidth: 2
  }), month && /*#__PURE__*/React.createElement("span", {
    style: {
      fontVariantNumeric: "tabular-nums"
    }
  }, month), /*#__PURE__*/React.createElement("span", null, label || l.word));
}
Object.assign(__ds_scope, { SeasonBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badges/SeasonBadge.jsx", error: String((e && e.message) || e) }); }

// components/badges/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Status badge — always pairs an icon + text so meaning is not color-only.
 * Presets cover the app's core states; or pass tone/icon/label directly.
 */
const PRESETS = {
  "adapted": {
    tone: "success",
    icon: "check-circle-2",
    label: "剪定に適した時期"
  },
  "ok": {
    tone: "success",
    icon: "scissors",
    label: "剪定可能"
  },
  "avoid": {
    tone: "warning",
    icon: "hand",
    label: "今は剪定を避ける"
  },
  "caution": {
    tone: "warning",
    icon: "alert-triangle",
    label: "注意が必要"
  },
  "done": {
    tone: "neutral",
    icon: "check",
    label: "作業完了"
  },
  "analyzing": {
    tone: "info",
    icon: "sparkles",
    label: "AI分析中"
  }
};
const TONES = {
  success: {
    fg: "var(--green-800)",
    bg: "var(--color-success-bg)",
    bd: "var(--green-300)"
  },
  warning: {
    fg: "var(--color-warning-text)",
    bg: "var(--color-warning-bg)",
    bd: "var(--yellow-200)"
  },
  error: {
    fg: "var(--color-error-text)",
    bg: "var(--color-error-bg)",
    bd: "#e7bdb5"
  },
  info: {
    fg: "var(--blue-700)",
    bg: "var(--color-info-bg)",
    bd: "var(--blue-100)"
  },
  neutral: {
    fg: "var(--color-text-secondary)",
    bg: "var(--cream)",
    bd: "var(--color-border-strong)"
  }
};
function StatusBadge({
  status,
  tone,
  icon,
  label,
  children,
  size = "md",
  style = {},
  ...rest
}) {
  const preset = status ? PRESETS[status] : null;
  const t = TONES[tone || preset && preset.tone || "neutral"];
  const ic = icon || preset && preset.icon;
  const text = children || label || preset && preset.label;
  const sm = size === "sm";
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: sm ? 5 : 6,
      height: sm ? 24 : 30,
      padding: sm ? "0 9px" : "0 12px",
      borderRadius: "var(--radius-full)",
      border: "1px solid " + t.bd,
      background: t.bg,
      color: t.fg,
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: sm ? "var(--fs-label)" : "var(--fs-caption)",
      lineHeight: 1,
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), ic && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: ic,
    size: sm ? 13 : 15,
    strokeWidth: 2
  }), text);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badges/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/badges/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Tag / chip for plant categories & attributes (常緑樹, 落葉樹, 花木, 果樹, 初心者向け…).
 * Soft-tinted by tone; optional leading icon. Can be interactive (removable/selectable).
 */
const TONES = {
  green: {
    fg: "var(--green-800)",
    bg: "var(--green-50)",
    bd: "var(--green-100)"
  },
  brown: {
    fg: "var(--brown-700)",
    bg: "var(--brown-100)",
    bd: "var(--brown-200)"
  },
  blue: {
    fg: "var(--blue-700)",
    bg: "var(--blue-50)",
    bd: "var(--blue-100)"
  },
  yellow: {
    fg: "var(--yellow-700)",
    bg: "var(--yellow-100)",
    bd: "var(--yellow-200)"
  },
  neutral: {
    fg: "var(--color-text-secondary)",
    bg: "var(--cream)",
    bd: "var(--color-border)"
  }
};
function Tag({
  children,
  tone = "neutral",
  icon,
  onRemove,
  selected,
  onClick,
  style = {},
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  const clickable = !!onClick;
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 28,
      padding: onRemove ? "0 6px 0 10px" : "0 10px",
      borderRadius: "var(--tag-radius)",
      border: "1px solid " + (selected ? "var(--color-primary)" : t.bd),
      background: selected ? "var(--color-primary-light)" : t.bg,
      color: selected ? "var(--color-primary-strong)" : t.fg,
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-caption)",
      lineHeight: 1,
      whiteSpace: "nowrap",
      cursor: clickable ? "pointer" : "default",
      ...style
    }
  }, rest), icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14,
    strokeWidth: 2
  }), children, onRemove && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u524A\u9664",
    onClick: e => {
      e.stopPropagation();
      onRemove();
    },
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 18,
      height: 18,
      marginLeft: 2,
      border: "none",
      borderRadius: "50%",
      background: "transparent",
      color: "inherit",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 13,
    strokeWidth: 2.5
  })));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/badges/Tag.jsx", error: String((e && e.message) || e) }); }

// components/cards/AnalysisResultCard.jsx
try { (() => {
/**
 * AI analysis result card. Header (AI icon + title + status) → summary →
 * findings sections (each with tone/icon) → disclaimer footer.
 * Sections use icon + label so meaning isn't color-only.
 */
const SECTION_TONES = {
  cut: {
    fg: "var(--green-800)",
    bg: "var(--green-50)",
    icon: "scissors"
  },
  keep: {
    fg: "var(--blue-700)",
    bg: "var(--blue-50)",
    icon: "shield-check"
  },
  caution: {
    fg: "var(--color-warning-text)",
    bg: "var(--color-warning-bg)",
    icon: "alert-triangle"
  },
  note: {
    fg: "var(--color-text-secondary)",
    bg: "var(--cream)",
    icon: "info"
  }
};
function AnalysisResultCard({
  title = "AI剪定診断",
  status = "done",
  summary,
  sections = [],
  disclaimer = "AIの診断は参考情報です。木の状態・樹種・地域・季節を確認のうえ作業してください。",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-surface)",
      border: "var(--card-border)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-card)",
      overflow: "hidden",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: "18px 20px",
      background: "var(--color-primary-strong)",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 34,
      height: 34,
      borderRadius: "var(--radius-full)",
      background: "rgba(255,255,255,0.16)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "sparkles",
    size: 19,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("strong", {
    style: {
      fontFamily: "var(--font-serif)",
      fontWeight: 700,
      fontSize: "var(--fs-h4)"
    }
  }, title)), /*#__PURE__*/React.createElement(__ds_scope.StatusBadge, {
    status: status
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 20,
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, summary && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      padding: "12px 14px",
      background: "var(--color-primary-light)",
      borderRadius: "var(--radius-md)",
      borderLeft: "3px solid var(--color-primary)",
      fontSize: "var(--fs-sm)",
      lineHeight: 1.8,
      color: "var(--color-text)"
    }
  }, summary), sections.map((s, i) => {
    const t = SECTION_TONES[s.tone] || SECTION_TONES.note;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 12,
        alignItems: "flex-start"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        width: 34,
        height: 34,
        borderRadius: "var(--radius-md)",
        background: t.bg,
        color: t.fg
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: s.icon || t.icon,
      size: 18,
      strokeWidth: 2
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("h4", {
      style: {
        margin: "3px 0 4px",
        fontSize: "var(--fs-sm)",
        fontWeight: "var(--fw-bold)",
        color: "var(--color-text-strong)"
      }
    }, s.heading), /*#__PURE__*/React.createElement("p", {
      style: {
        margin: 0,
        fontSize: "var(--fs-sm)",
        lineHeight: 1.8,
        color: "var(--color-text-secondary)",
        whiteSpace: "pre-wrap"
      }
    }, s.body)));
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      paddingTop: 14,
      borderTop: "1px solid var(--color-border)",
      display: "flex",
      gap: 8,
      fontSize: "var(--fs-caption)",
      lineHeight: 1.7,
      color: "var(--color-text-secondary)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "shield-alert",
    size: 16,
    strokeWidth: 2,
    style: {
      color: "var(--color-warning)",
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("span", null, disclaimer))));
}
Object.assign(__ds_scope, { AnalysisResultCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/AnalysisResultCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/PlantCard.jsx
try { (() => {
/**
 * Plant list card. Layout: 画像(上) → 見出し → タグ → 説明 → フッター(季節/お気に入り).
 * Works as a list item; pass `onClick` to open the detail view.
 */
function PlantCard({
  name,
  subtitle,
  image,
  tags = [],
  season,
  description,
  favorite = false,
  onToggleFavorite,
  onClick,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      background: "var(--color-surface)",
      border: "var(--card-border)",
      borderRadius: "var(--card-radius)",
      boxShadow: hover ? "var(--shadow-md)" : "var(--card-shadow)",
      transform: hover ? "translateY(-2px)" : "none",
      cursor: onClick ? "pointer" : "default",
      transition: "box-shadow var(--dur) var(--ease), transform var(--dur) var(--ease)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      aspectRatio: "4 / 3",
      background: "var(--color-surface-sunken)"
    }
  }, image ? /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover",
      display: "block"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      display: "grid",
      placeItems: "center",
      color: "var(--green-300)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "sprout",
    size: 40,
    strokeWidth: 1.5
  })), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": favorite ? "お気に入りから外す" : "お気に入りに追加",
    onClick: e => {
      e.stopPropagation();
      onToggleFavorite && onToggleFavorite();
    },
    style: {
      position: "absolute",
      top: 10,
      right: 10,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 38,
      height: 38,
      border: "none",
      borderRadius: "50%",
      background: "rgba(255,255,255,0.92)",
      boxShadow: "var(--shadow-sm)",
      color: favorite ? "var(--color-season)" : "var(--color-text-secondary)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "star",
    size: 19,
    strokeWidth: 2,
    style: {
      fill: favorite ? "var(--color-season)" : "none"
    }
  })), season && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 10,
      bottom: 10
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.SeasonBadge, {
    level: season.level,
    month: season.month,
    label: season.label
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      padding: "16px 16px 18px"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h4)",
      color: "var(--color-text-strong)",
      lineHeight: 1.4
    }
  }, name), subtitle && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "2px 0 0",
      fontSize: "var(--fs-caption)",
      color: "var(--color-text-secondary)"
    }
  }, subtitle)), tags.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, tags.map((t, i) => typeof t === "string" ? /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: i,
    tone: "green"
  }, t) : /*#__PURE__*/React.createElement(__ds_scope.Tag, {
    key: i,
    tone: t.tone,
    icon: t.icon
  }, t.label))), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--fs-sm)",
      lineHeight: 1.7,
      color: "var(--color-text-secondary)"
    }
  }, description)));
}
Object.assign(__ds_scope, { PlantCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/PlantCard.jsx", error: String((e && e.message) || e) }); }

// components/cards/StepCard.jsx
try { (() => {
/**
 * Numbered work-step card (作業手順). Number chip + title + description,
 * optional image and a "done" toggle for checking off steps.
 */
function StepCard({
  step,
  title,
  description,
  image,
  done = false,
  onToggle,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      alignItems: "flex-start",
      padding: 16,
      background: "var(--color-surface)",
      border: "var(--card-border)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-xs)",
      opacity: done ? 0.7 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "0 0 auto",
      width: 34,
      height: 34,
      borderRadius: "var(--radius-full)",
      background: done ? "var(--color-primary)" : "var(--color-primary-light)",
      color: done ? "#fff" : "var(--color-primary-strong)",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-sm)",
      fontVariantNumeric: "tabular-nums"
    }
  }, done ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 18,
    strokeWidth: 3
  }) : step), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-body)",
      color: "var(--color-text-strong)",
      lineHeight: 1.5,
      textDecoration: done ? "line-through" : "none"
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--fs-sm)",
      lineHeight: 1.8,
      color: "var(--color-text-secondary)"
    }
  }, description), image && /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      marginTop: 4,
      width: "100%",
      borderRadius: "var(--radius-image)",
      border: "1px solid var(--color-border)"
    }
  })), onToggle && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": done ? "未完了に戻す" : "完了にする",
    onClick: onToggle,
    style: {
      flex: "0 0 auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      border: "1.5px solid " + (done ? "var(--color-primary)" : "var(--color-border-strong)"),
      borderRadius: "50%",
      background: done ? "var(--color-primary)" : "transparent",
      color: done ? "#fff" : "var(--color-text-tertiary)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 18,
    strokeWidth: 2.5
  })));
}
Object.assign(__ds_scope, { StepCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/cards/StepCard.jsx", error: String((e && e.message) || e) }); }

// components/feedback/AlertBox.jsx
try { (() => {
/**
 * Inline alert / callout (注意事項). Icon + text so meaning isn't color-only.
 * tones: info / success / warning / danger.
 */
const TONES = {
  info: {
    fg: "var(--blue-700)",
    bg: "var(--color-info-bg)",
    bd: "var(--blue-100)",
    icon: "info"
  },
  success: {
    fg: "var(--green-800)",
    bg: "var(--color-success-bg)",
    bd: "var(--green-300)",
    icon: "check-circle-2"
  },
  warning: {
    fg: "var(--color-warning-text)",
    bg: "var(--color-warning-bg)",
    bd: "var(--yellow-200)",
    icon: "alert-triangle"
  },
  danger: {
    fg: "var(--color-error-text)",
    bg: "var(--color-error-bg)",
    bd: "#e7bdb5",
    icon: "alert-octagon"
  }
};
function AlertBox({
  tone = "info",
  title,
  children,
  icon,
  onClose,
  style = {}
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", {
    role: tone === "danger" || tone === "warning" ? "alert" : "status",
    style: {
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      padding: "14px 16px",
      background: t.bg,
      border: "1px solid " + t.bd,
      borderRadius: "var(--radius-md)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 auto",
      color: t.fg,
      display: "inline-flex",
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || t.icon,
    size: 20,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title && /*#__PURE__*/React.createElement("strong", {
    style: {
      display: "block",
      marginBottom: children ? 4 : 0,
      color: t.fg,
      fontSize: "var(--fs-sm)",
      fontWeight: "var(--fw-bold)"
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--fs-sm)",
      lineHeight: 1.8,
      color: "var(--color-text)"
    }
  }, children)), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u9589\u3058\u308B",
    onClick: onClose,
    style: {
      flex: "0 0 auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      border: "none",
      borderRadius: "50%",
      background: "transparent",
      color: t.fg,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16,
    strokeWidth: 2.5
  })));
}
Object.assign(__ds_scope, { AlertBox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/AlertBox.jsx", error: String((e && e.message) || e) }); }

// components/feedback/EmptyState.jsx
try { (() => {
/** Empty state — icon, title, description, optional action. */
function EmptyState({
  icon = "sprout",
  title,
  description,
  action,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      gap: 12,
      padding: "48px 24px",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 72,
      height: 72,
      borderRadius: "var(--radius-full)",
      background: "var(--color-surface-sunken)",
      color: "var(--green-500)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 34,
    strokeWidth: 1.5
  })), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-h4)",
      color: "var(--color-text-strong)"
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      maxWidth: 340,
      fontSize: "var(--fs-sm)",
      lineHeight: 1.8,
      color: "var(--color-text-secondary)"
    }
  }, description), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, action));
}
Object.assign(__ds_scope, { EmptyState });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/EmptyState.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Modal.jsx
try { (() => {
/**
 * Modal dialog with backdrop. Controlled via `open`.
 * Renders a centered sheet on mobile-friendly widths; ESC / backdrop / × to close.
 */
function Modal({
  open,
  title,
  children,
  footer,
  onClose,
  width = 480,
  style = {}
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = e => {
      if (e.key === "Escape") onClose && onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      zIndex: "var(--z-modal)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      background: "rgba(23,42,32,0.42)",
      backdropFilter: "blur(2px)",
      animation: "ds-fade-in var(--dur) var(--ease)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-label": title,
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: width,
      maxHeight: "90vh",
      overflow: "auto",
      background: "var(--color-surface)",
      borderRadius: "var(--modal-radius)",
      boxShadow: "var(--modal-shadow)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      padding: "20px 22px 0"
    }
  }, title && /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-serif)",
      fontWeight: 700,
      fontSize: "var(--fs-h3)",
      color: "var(--color-text-strong)",
      lineHeight: 1.4
    }
  }, title), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u9589\u3058\u308B",
    onClick: onClose,
    style: {
      flex: "0 0 auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 40,
      height: 40,
      marginTop: -6,
      marginRight: -6,
      border: "none",
      borderRadius: "50%",
      background: "transparent",
      color: "var(--color-text-secondary)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 20,
    strokeWidth: 2
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 22px 22px",
      fontSize: "var(--fs-body)",
      lineHeight: 1.8,
      color: "var(--color-text)"
    }
  }, children), footer && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      padding: "0 22px 22px"
    }
  }, footer)));
}
Object.assign(__ds_scope, { Modal });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Modal.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
/**
 * Toast — transient message. Icon + text so meaning isn't color-only.
 * Render fixed at bottom-center; caller controls mount/dismount timing.
 */
const TONES = {
  success: {
    fg: "var(--green-800)",
    bg: "#fff",
    bd: "var(--green-300)",
    icon: "check-circle-2"
  },
  info: {
    fg: "var(--blue-700)",
    bg: "#fff",
    bd: "var(--blue-100)",
    icon: "info"
  },
  warning: {
    fg: "var(--color-warning-text)",
    bg: "#fff",
    bd: "var(--yellow-200)",
    icon: "alert-triangle"
  },
  error: {
    fg: "var(--color-error-text)",
    bg: "#fff",
    bd: "#e7bdb5",
    icon: "alert-octagon"
  }
};
function Toast({
  tone = "success",
  message,
  icon,
  onClose,
  style = {}
}) {
  const t = TONES[tone] || TONES.success;
  return /*#__PURE__*/React.createElement("div", {
    role: "status",
    "aria-live": "polite",
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      maxWidth: 420,
      padding: "12px 14px",
      background: t.bg,
      border: "1px solid " + t.bd,
      borderLeft: "4px solid " + t.fg,
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-md)",
      animation: "ds-slide-up var(--dur) var(--ease)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: "0 0 auto",
      color: t.fg,
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon || t.icon,
    size: 20,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: "var(--fs-sm)",
      lineHeight: 1.6,
      color: "var(--color-text)"
    }
  }, message), onClose && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u9589\u3058\u308B",
    onClick: onClose,
    style: {
      flex: "0 0 auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 28,
      height: 28,
      border: "none",
      borderRadius: "50%",
      background: "transparent",
      color: "var(--color-text-secondary)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 15,
    strokeWidth: 2.5
  })));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/forms/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const VARIANTS = {
  primary: {
    background: "var(--color-primary)",
    color: "var(--color-text-on-primary)",
    border: "1px solid transparent",
    boxShadow: "var(--shadow-sm)",
    "--hoverBg": "var(--color-primary-hover)"
  },
  secondary: {
    background: "var(--color-secondary)",
    color: "var(--color-text-on-primary)",
    border: "1px solid transparent",
    boxShadow: "var(--shadow-sm)",
    "--hoverBg": "var(--brown-700)"
  },
  outline: {
    background: "var(--color-surface)",
    color: "var(--color-primary-strong)",
    border: "1.5px solid var(--color-primary)",
    boxShadow: "none",
    "--hoverBg": "var(--color-primary-light)"
  },
  text: {
    background: "transparent",
    color: "var(--color-primary-strong)",
    border: "1px solid transparent",
    boxShadow: "none",
    "--hoverBg": "var(--color-primary-light)"
  },
  danger: {
    background: "var(--color-error)",
    color: "var(--color-text-on-primary)",
    border: "1px solid transparent",
    boxShadow: "var(--shadow-sm)",
    "--hoverBg": "var(--red-700)"
  }
};
const SIZES = {
  sm: {
    height: 40,
    padding: "0 16px",
    fontSize: "var(--fs-sm)"
  },
  md: {
    height: "var(--control-height)",
    padding: "0 24px",
    fontSize: "var(--fs-body)"
  },
  lg: {
    height: 58,
    padding: "0 32px",
    fontSize: "var(--fs-body-lg)"
  }
};
function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
  onClick,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const v = VARIANTS[variant] || VARIANTS.primary;
  const s = SIZES[size] || SIZES.md;
  const isDisabled = disabled || loading;
  const base = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minWidth: variant === "text" ? undefined : 88,
    width: fullWidth ? "100%" : undefined,
    height: s.height,
    padding: s.padding,
    fontFamily: "var(--font-sans)",
    fontWeight: "var(--fw-bold)",
    fontSize: s.fontSize,
    letterSpacing: "var(--ls-normal)",
    lineHeight: 1,
    borderRadius: "var(--button-radius)",
    cursor: isDisabled ? "not-allowed" : "pointer",
    transition: "background var(--dur) var(--ease), transform var(--dur-fast) var(--ease), box-shadow var(--dur) var(--ease)",
    background: v.background,
    color: v.color,
    border: v.border,
    boxShadow: v.boxShadow,
    transform: active && !isDisabled ? "translateY(1px)" : "none",
    opacity: isDisabled ? 0.5 : 1,
    ...style
  };
  if (hover && !isDisabled) base.background = v["--hoverBg"];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: isDisabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: base
  }, rest), loading && /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 16,
      height: 16,
      borderRadius: "50%",
      border: "2px solid currentColor",
      borderTopColor: "transparent",
      opacity: 0.85,
      animation: "ds-spin 800ms linear infinite"
    }
  }), !loading && icon && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 18,
    strokeWidth: 2
  }), children && /*#__PURE__*/React.createElement("span", null, loading ? "処理中…" : children), !loading && iconRight && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: 18,
    strokeWidth: 2
  }));
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Button.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Checkbox with label; large 24px box for easy tapping. */
function Checkbox({
  id,
  label,
  checked,
  defaultChecked,
  disabled = false,
  onChange,
  style = {},
  ...rest
}) {
  const autoId = React.useId ? React.useId() : "cb";
  const cbId = id || autoId;
  const isControlled = checked !== undefined;
  const [inner, setInner] = React.useState(!!defaultChecked);
  const on = isControlled ? checked : inner;
  return /*#__PURE__*/React.createElement("label", {
    htmlFor: cbId,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      minHeight: "var(--tap-min)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.5 : 1,
      ...style
    }
  }, /*#__PURE__*/React.createElement("input", _extends({
    id: cbId,
    type: "checkbox",
    checked: checked,
    defaultChecked: defaultChecked,
    disabled: disabled,
    onChange: e => {
      if (!isControlled) setInner(e.target.checked);
      onChange && onChange(e);
    },
    className: "ds-visually-hidden"
  }, rest)), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 24,
      height: 24,
      flex: "0 0 auto",
      borderRadius: 7,
      border: "1.5px solid " + (on ? "var(--color-primary)" : "var(--color-border-strong)"),
      background: on ? "var(--color-primary)" : "var(--color-surface)",
      color: "#fff",
      transition: "background var(--dur) var(--ease), border-color var(--dur) var(--ease)"
    }
  }, on && /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 16,
    strokeWidth: 3
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--fs-body)",
      color: "var(--color-text)",
      lineHeight: "var(--lh-ui)"
    }
  }, label));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Fab.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Floating Action Button — fixed-position primary action (e.g. カメラで撮影).
 * Extended variant shows a label alongside the icon.
 */
function Fab({
  icon = "camera",
  label,
  extended = false,
  onClick,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": extended ? undefined : label,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      height: 56,
      minWidth: 56,
      padding: extended ? "0 22px 0 20px" : 0,
      borderRadius: "var(--radius-full)",
      border: "none",
      background: hover ? "var(--color-primary-hover)" : "var(--color-primary)",
      color: "var(--color-text-on-primary)",
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-body)",
      boxShadow: "var(--shadow-fab)",
      cursor: "pointer",
      transform: active ? "translateY(1px) scale(0.99)" : "none",
      transition: "background var(--dur) var(--ease), transform var(--dur-fast) var(--ease)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24,
    strokeWidth: 2
  }), extended && label && /*#__PURE__*/React.createElement("span", null, label));
}
Object.assign(__ds_scope, { Fab });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Fab.jsx", error: String((e && e.message) || e) }); }

// components/forms/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    color: "var(--color-text-secondary)",
    bg: "transparent",
    hoverBg: "var(--color-primary-light)",
    hoverColor: "var(--color-primary-strong)"
  },
  primary: {
    color: "var(--color-primary)",
    bg: "var(--color-primary-light)",
    hoverBg: "var(--green-100)",
    hoverColor: "var(--color-primary-strong)"
  },
  danger: {
    color: "var(--color-error)",
    bg: "var(--color-error-bg)",
    hoverBg: "#f2cec8",
    hoverColor: "var(--red-700)"
  }
};
const SIZES = {
  sm: 40,
  md: 44,
  lg: 48
};
function IconButton({
  icon,
  label,
  tone = "neutral",
  size = "md",
  disabled = false,
  onClick,
  style = {},
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [active, setActive] = React.useState(false);
  const t = TONES[tone] || TONES.neutral;
  const dim = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setActive(false);
    },
    onMouseDown: () => setActive(true),
    onMouseUp: () => setActive(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: dim,
      height: dim,
      padding: 0,
      borderRadius: "var(--radius-full)",
      border: "1px solid transparent",
      color: hover && !disabled ? t.hoverColor : t.color,
      background: hover && !disabled ? t.hoverBg : t.bg,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      transform: active && !disabled ? "scale(0.94)" : "none",
      transition: "background var(--dur) var(--ease), color var(--dur) var(--ease), transform var(--dur-fast) var(--ease)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: size === "sm" ? 18 : 20,
    strokeWidth: 1.9
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Text input with label, helper text, and error state.
 * Meaning is never color-only: errors show an icon + message.
 */
function Input({
  id,
  label,
  value,
  defaultValue,
  placeholder,
  type = "text",
  helper,
  error,
  required = false,
  disabled = false,
  iconLeft,
  onChange,
  style = {},
  inputStyle = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : "in";
  const inputId = id || autoId;
  const describedBy = error ? inputId + "-err" : helper ? inputId + "-help" : undefined;
  const borderColor = error ? "var(--color-error)" : focus ? "var(--color-primary)" : "var(--color-border-strong)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: inputId,
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-sm)",
      color: "var(--color-text)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-error)",
      marginLeft: 4
    },
    "aria-hidden": "true"
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center"
    }
  }, iconLeft && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 14,
      color: "var(--color-text-tertiary)",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: 20
  })), /*#__PURE__*/React.createElement("input", _extends({
    id: inputId,
    type: type,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    required: required,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      height: "var(--control-height)",
      padding: iconLeft ? "0 16px 0 44px" : "0 16px",
      fontSize: "var(--fs-body)",
      color: "var(--color-text)",
      background: disabled ? "var(--color-bg)" : "var(--color-surface)",
      border: "1px solid " + borderColor,
      borderRadius: "var(--input-radius)",
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      boxShadow: focus ? error ? "0 0 0 3px rgba(192,69,59,0.18)" : "var(--focus-ring)" : "none",
      transition: "border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease)",
      ...inputStyle
    }
  }, rest))), error ? /*#__PURE__*/React.createElement("p", {
    id: inputId + "-err",
    role: "alert",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      margin: 0,
      color: "var(--color-error-text)",
      fontSize: "var(--fs-caption)",
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-circle",
    size: 15,
    strokeWidth: 2
  }), " ", error) : helper ? /*#__PURE__*/React.createElement("p", {
    id: inputId + "-help",
    style: {
      margin: 0,
      color: "var(--color-text-secondary)",
      fontSize: "var(--fs-caption)",
      lineHeight: 1.5
    }
  }, helper) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/SearchBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Search field with leading magnifier and optional clear button. */
function SearchBar({
  value,
  defaultValue,
  placeholder = "植物名で検索",
  onChange,
  onClear,
  onSubmit,
  disabled = false,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const hasValue = value != null && value !== "";
  return /*#__PURE__*/React.createElement("form", {
    role: "search",
    onSubmit: e => {
      e.preventDefault();
      onSubmit && onSubmit(e);
    },
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: "var(--control-height)",
      padding: "0 8px 0 16px",
      background: "var(--color-surface)",
      border: "1px solid " + (focus ? "var(--color-primary)" : "var(--color-border-strong)"),
      borderRadius: "var(--radius-full)",
      boxShadow: focus ? "var(--focus-ring)" : "var(--shadow-xs)",
      transition: "border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease)",
      ...style
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "search",
    size: 20,
    style: {
      color: "var(--color-text-secondary)"
    }
  }), /*#__PURE__*/React.createElement("input", _extends({
    type: "search",
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    "aria-label": placeholder,
    style: {
      flex: 1,
      minWidth: 0,
      height: "100%",
      border: "none",
      outline: "none",
      background: "transparent",
      fontSize: "var(--fs-body)",
      color: "var(--color-text)"
    }
  }, rest)), hasValue && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u691C\u7D22\u3092\u30AF\u30EA\u30A2",
    onClick: onClear,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      border: "none",
      background: "transparent",
      borderRadius: "var(--radius-full)",
      color: "var(--color-text-secondary)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 18,
    strokeWidth: 2
  })));
}
Object.assign(__ds_scope, { SearchBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/SearchBar.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Native select styled to match the DS, with label / helper / error. */
function Select({
  id,
  label,
  value,
  defaultValue,
  options = [],
  placeholder,
  helper,
  error,
  required = false,
  disabled = false,
  onChange,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : "sel";
  const selId = id || autoId;
  const describedBy = error ? selId + "-err" : helper ? selId + "-help" : undefined;
  const borderColor = error ? "var(--color-error)" : focus ? "var(--color-primary)" : "var(--color-border-strong)";
  const norm = options.map(o => typeof o === "string" ? {
    value: o,
    label: o
  } : o);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: selId,
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-sm)",
      color: "var(--color-text)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-error)",
      marginLeft: 4
    },
    "aria-hidden": "true"
  }, "*")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    id: selId,
    value: value,
    defaultValue: defaultValue,
    disabled: disabled,
    required: required,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      height: "var(--control-height)",
      padding: "0 44px 0 16px",
      fontSize: "var(--fs-body)",
      color: "var(--color-text)",
      background: disabled ? "var(--color-bg)" : "var(--color-surface)",
      border: "1px solid " + borderColor,
      borderRadius: "var(--input-radius)",
      outline: "none",
      appearance: "none",
      WebkitAppearance: "none",
      opacity: disabled ? 0.6 : 1,
      cursor: disabled ? "not-allowed" : "pointer",
      boxShadow: focus ? "var(--focus-ring)" : "none",
      transition: "border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease)"
    }
  }, rest), placeholder && /*#__PURE__*/React.createElement("option", {
    value: "",
    disabled: true
  }, placeholder), norm.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 14,
      pointerEvents: "none",
      color: "var(--color-text-secondary)",
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 20
  }))), error ? /*#__PURE__*/React.createElement("p", {
    id: selId + "-err",
    role: "alert",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      margin: 0,
      color: "var(--color-error-text)",
      fontSize: "var(--fs-caption)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-circle",
    size: 15,
    strokeWidth: 2
  }), " ", error) : helper ? /*#__PURE__*/React.createElement("p", {
    id: selId + "-help",
    style: {
      margin: 0,
      color: "var(--color-text-secondary)",
      fontSize: "var(--fs-caption)"
    }
  }, helper) : null);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Textarea.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Multi-line text input (気になる点 etc.) with label / helper / error. */
function Textarea({
  id,
  label,
  value,
  defaultValue,
  placeholder,
  rows = 5,
  helper,
  error,
  required = false,
  disabled = false,
  maxLength,
  onChange,
  style = {},
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const autoId = React.useId ? React.useId() : "ta";
  const taId = id || autoId;
  const describedBy = error ? taId + "-err" : helper ? taId + "-help" : undefined;
  const borderColor = error ? "var(--color-error)" : focus ? "var(--color-primary)" : "var(--color-border-strong)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("label", {
    htmlFor: taId,
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-sm)",
      color: "var(--color-text)"
    }
  }, label, required && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--color-error)",
      marginLeft: 4
    },
    "aria-hidden": "true"
  }, "*")), /*#__PURE__*/React.createElement("textarea", _extends({
    id: taId,
    rows: rows,
    value: value,
    defaultValue: defaultValue,
    placeholder: placeholder,
    disabled: disabled,
    required: required,
    maxLength: maxLength,
    "aria-invalid": !!error,
    "aria-describedby": describedBy,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      width: "100%",
      minHeight: 128,
      padding: "14px 16px",
      resize: "vertical",
      fontSize: "var(--fs-body)",
      lineHeight: "var(--lh-body)",
      color: "var(--color-text)",
      background: disabled ? "var(--color-bg)" : "var(--color-surface)",
      border: "1px solid " + borderColor,
      borderRadius: "var(--input-radius)",
      outline: "none",
      opacity: disabled ? 0.6 : 1,
      boxShadow: focus ? error ? "0 0 0 3px rgba(192,69,59,0.18)" : "var(--focus-ring)" : "none",
      transition: "border-color var(--dur) var(--ease), box-shadow var(--dur) var(--ease)"
    }
  }, rest)), error ? /*#__PURE__*/React.createElement("p", {
    id: taId + "-err",
    role: "alert",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      margin: 0,
      color: "var(--color-error-text)",
      fontSize: "var(--fs-caption)",
      lineHeight: 1.5
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "alert-circle",
    size: 15,
    strokeWidth: 2
  }), " ", error) : helper ? /*#__PURE__*/React.createElement("p", {
    id: taId + "-help",
    style: {
      margin: 0,
      color: "var(--color-text-secondary)",
      fontSize: "var(--fs-caption)",
      lineHeight: 1.5
    }
  }, helper) : null);
}
Object.assign(__ds_scope, { Textarea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Textarea.jsx", error: String((e && e.message) || e) }); }

// components/forms/UploadArea.jsx
try { (() => {
/**
 * Image upload dropzone with dashed border + optional thumbnail previews.
 * Designed for plant photo upload; previews show a remove button.
 */
function UploadArea({
  title = "写真を追加する",
  hint = "JPEG・PNGなどの画像ファイル",
  icon = "image-plus",
  photos = [],
  onAdd,
  onRemove,
  multiple = true,
  style = {}
}) {
  const [hover, setHover] = React.useState(false);
  const inputRef = React.useRef(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14,
      ...style
    }
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => inputRef.current && inputRef.current.click(),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      minHeight: 156,
      padding: 24,
      width: "100%",
      border: "1.5px dashed " + (hover ? "var(--color-primary)" : "#a9b8ab"),
      borderRadius: "var(--radius-lg)",
      cursor: "pointer",
      background: hover ? "var(--green-50)" : "var(--color-surface-sunken)",
      color: "var(--color-primary-strong)",
      transition: "background var(--dur) var(--ease), border-color var(--dur) var(--ease)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 48,
      height: 48,
      borderRadius: "var(--radius-full)",
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      color: "var(--color-primary)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 24,
    strokeWidth: 1.9
  })), /*#__PURE__*/React.createElement("strong", {
    style: {
      fontSize: "var(--fs-body)",
      color: "var(--color-text)"
    }
  }, title), /*#__PURE__*/React.createElement("small", {
    style: {
      fontSize: "var(--fs-caption)",
      color: "var(--color-text-secondary)"
    }
  }, hint), /*#__PURE__*/React.createElement("input", {
    ref: inputRef,
    type: "file",
    accept: "image/*",
    multiple: multiple,
    className: "ds-visually-hidden",
    tabIndex: -1,
    onChange: e => onAdd && onAdd(e)
  })), photos.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill,minmax(104px,1fr))",
      gap: 12
    }
  }, photos.map((p, i) => /*#__PURE__*/React.createElement("figure", {
    key: p.id || i,
    style: {
      position: "relative",
      margin: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: p.url,
    alt: p.name || "写真",
    style: {
      width: "100%",
      aspectRatio: "1",
      objectFit: "cover",
      borderRadius: "var(--radius-image)",
      display: "block",
      border: "1px solid var(--color-border)"
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": (p.name || "写真") + "を削除",
    onClick: () => onRemove && onRemove(p.id ?? i),
    style: {
      position: "absolute",
      top: 6,
      right: 6,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 30,
      height: 30,
      border: "none",
      borderRadius: "50%",
      background: "rgba(23,59,42,0.82)",
      color: "#fff",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 16,
    strokeWidth: 2.5
  }))))));
}
Object.assign(__ds_scope, { UploadArea });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/UploadArea.jsx", error: String((e && e.message) || e) }); }

// components/navigation/AppHeader.jsx
try { (() => {
/**
 * App top bar. Left = back button or brand mark, center = title,
 * right = action icons. Sticky-friendly.
 */
function AppHeader({
  title,
  onBack,
  actions = [],
  brand = false,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: 60,
      padding: "0 8px 0 " + (onBack || brand ? "8px" : "16px"),
      background: "var(--color-surface)",
      borderBottom: "1px solid var(--color-border)",
      ...style
    }
  }, onBack && /*#__PURE__*/React.createElement("button", {
    type: "button",
    "aria-label": "\u623B\u308B",
    onClick: onBack,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 44,
      height: 44,
      border: "none",
      borderRadius: "var(--radius-full)",
      background: "transparent",
      color: "var(--color-text)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-left",
    size: 24,
    strokeWidth: 2
  })), brand && !onBack && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 36,
      height: 36,
      marginLeft: 4,
      borderRadius: "var(--radius-full)",
      background: "var(--color-primary)",
      color: "#fff"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "scissors",
    size: 19,
    strokeWidth: 2
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      flex: 1,
      minWidth: 0,
      margin: 0,
      fontFamily: brand ? "var(--font-serif)" : "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--fs-h4)",
      color: "var(--color-text-strong)",
      lineHeight: 1.4,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      textAlign: onBack ? "center" : "left"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 2
    }
  }, actions.map((a, i) => /*#__PURE__*/React.createElement("button", {
    key: i,
    type: "button",
    "aria-label": a.label,
    onClick: a.onClick,
    style: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 44,
      height: 44,
      border: "none",
      borderRadius: "var(--radius-full)",
      background: "transparent",
      color: "var(--color-text)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: a.icon,
    size: 22,
    strokeWidth: 1.9
  }), a.badge && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 8,
      right: 8,
      minWidth: 8,
      height: 8,
      borderRadius: "50%",
      background: "var(--color-error)"
    }
  })))));
}
Object.assign(__ds_scope, { AppHeader });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/AppHeader.jsx", error: String((e && e.message) || e) }); }

// components/navigation/BottomNavigation.jsx
try { (() => {
/**
 * Bottom tab navigation. items: [{key, icon, label}]. `active` = current key.
 * Fixed at the bottom; large tap targets for outdoor / one-hand use.
 */
function BottomNavigation({
  items = [],
  active,
  onChange,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      alignItems: "stretch",
      height: 64,
      paddingBottom: "env(safe-area-inset-bottom, 0)",
      background: "var(--color-surface)",
      borderTop: "1px solid var(--color-border)",
      ...style
    }
  }, items.map(it => {
    const on = it.key === active;
    return /*#__PURE__*/React.createElement("button", {
      key: it.key,
      type: "button",
      "aria-label": it.label,
      "aria-current": on ? "page" : undefined,
      onClick: () => onChange && onChange(it.key),
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        minHeight: 48,
        border: "none",
        background: "transparent",
        color: on ? "var(--color-primary)" : "var(--color-text-secondary)",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 23,
      strokeWidth: on ? 2.2 : 1.8
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        fontWeight: on ? "var(--fw-bold)" : "var(--fw-medium)",
        lineHeight: 1
      }
    }, it.label));
  }));
}
Object.assign(__ds_scope, { BottomNavigation });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/BottomNavigation.jsx", error: String((e && e.message) || e) }); }

// components/navigation/PageTitle.jsx
try { (() => {
/**
 * Page title block — overline (eyebrow), serif heading, optional description.
 * Use at the top of a scrollable content area (below the AppHeader).
 */
function PageTitle({
  eyebrow,
  title,
  description,
  align = "left",
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      textAlign: align,
      ...style
    }
  }, eyebrow && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-label)",
      letterSpacing: "var(--ls-wide)",
      textTransform: "uppercase",
      color: "var(--color-secondary)"
    }
  }, eyebrow), /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-serif)",
      fontWeight: 700,
      fontSize: "var(--fs-h1)",
      letterSpacing: "var(--ls-tight)",
      color: "var(--color-text-strong)",
      lineHeight: 1.3
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "2px 0 0",
      fontSize: "var(--fs-body)",
      lineHeight: 1.8,
      color: "var(--color-text-secondary)"
    }
  }, description));
}
Object.assign(__ds_scope, { PageTitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/PageTitle.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/App.jsx
try { (() => {
// App — ties the AI Pruning Assistant screens together in a phone frame.
const NS_A = window.AIPruningAssistantDesignSystem_a95f89;
const PLANTS = [{
  id: "momiji",
  name: "モミジ",
  subtitle: "イロハモミジ",
  category: "落葉樹",
  favorite: true,
  tags: [{
    label: "落葉樹",
    tone: "brown",
    icon: "leaf"
  }, {
    label: "初心者向け",
    tone: "green"
  }],
  season: {
    level: "good",
    month: "12〜2月"
  },
  timing: "落葉して枝ぶりが見える冬が適期です。夏の強剪定は樹液が出やすく避けます。"
}, {
  id: "tsubaki",
  name: "ツバキ",
  subtitle: "藪椿",
  category: "常緑樹",
  favorite: false,
  tags: [{
    label: "常緑樹",
    tone: "green",
    icon: "leaf"
  }, {
    label: "花木",
    tone: "yellow",
    icon: "flower-2"
  }],
  season: {
    level: "ok",
    month: "3〜4月"
  },
  timing: "花が終わった直後に軽く整えます。翌年の花芽を切らないよう浅めに。"
}, {
  id: "ume",
  name: "ウメ",
  subtitle: "梅",
  category: "花木",
  favorite: true,
  tags: [{
    label: "落葉樹",
    tone: "brown",
    icon: "leaf"
  }, {
    label: "花木",
    tone: "yellow",
    icon: "flower-2"
  }],
  season: {
    level: "avoid",
    month: "今"
  },
  timing: "花後（6〜7月）と落葉後（11〜1月）が適期。今は避け、徒長枝の確認にとどめます。"
}, {
  id: "mikan",
  name: "ミカン",
  subtitle: "温州みかん",
  category: "果樹",
  favorite: false,
  tags: [{
    label: "常緑樹",
    tone: "green",
    icon: "leaf"
  }, {
    label: "果樹",
    tone: "blue",
    icon: "apple"
  }],
  season: {
    level: "ok",
    month: "3月"
  },
  timing: "芽が動く前の春先に、混み合った枝と枯れ枝を整理します。"
}];
function App() {
  const {
    AppHeader,
    BottomNavigation,
    Toast
  } = NS_A;
  const [tab, setTab] = React.useState("home");
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState("すべて");
  const [openId, setOpenId] = React.useState(null);
  const [plants, setPlants] = React.useState(PLANTS);
  const [toast, setToast] = React.useState(null);
  const showToast = msg => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };
  const toggleFav = id => setPlants(ps => ps.map(p => {
    if (p.id !== id) return p;
    showToast(p.favorite ? "お気に入りから外しました" : "お気に入りに追加しました");
    return {
      ...p,
      favorite: !p.favorite
    };
  }));
  const openPlant = plants.find(p => p.id === openId);
  let header, body;
  if (openId) {
    header = /*#__PURE__*/React.createElement(AppHeader, {
      title: openPlant.name,
      onBack: () => setOpenId(null),
      actions: [{
        icon: openPlant.favorite ? "star" : "star",
        label: "お気に入り",
        onClick: () => toggleFav(openId)
      }]
    });
    body = /*#__PURE__*/React.createElement(PlantDetailScreen, {
      plant: openPlant
    });
  } else if (tab === "home" || tab === "plants") {
    header = /*#__PURE__*/React.createElement(AppHeader, {
      brand: true,
      title: "\u526A\u5B9A\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8",
      actions: [{
        icon: "bell",
        label: "お知らせ",
        badge: true
      }, {
        icon: "settings",
        label: "設定"
      }]
    });
    body = /*#__PURE__*/React.createElement(HomeScreen, {
      plants: plants,
      query: query,
      setQuery: setQuery,
      filter: filter,
      setFilter: setFilter,
      onOpenPlant: setOpenId,
      onToggleFav: toggleFav
    });
  } else if (tab === "diagnose") {
    header = /*#__PURE__*/React.createElement(AppHeader, {
      brand: true,
      title: "\u526A\u5B9A\u8A3A\u65AD",
      actions: [{
        icon: "help-circle",
        label: "使い方"
      }]
    });
    body = /*#__PURE__*/React.createElement(DiagnoseScreen, null);
  } else {
    header = /*#__PURE__*/React.createElement(AppHeader, {
      brand: true,
      title: tab === "history" ? "作業履歴" : "設定"
    });
    body = /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "60px 24px",
        textAlign: "center",
        color: "var(--color-text-secondary)"
      }
    }, tab === "history" ? "作業履歴はここに表示されます。" : "設定はここに表示されます。");
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      background: "var(--color-bg)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 10
    }
  }, header), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, body), !openId && /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid var(--color-border)"
    }
  }, /*#__PURE__*/React.createElement(BottomNavigation, {
    active: tab,
    onChange: k => {
      setTab(k);
    },
    items: [{
      key: "home",
      icon: "home",
      label: "ホーム"
    }, {
      key: "plants",
      icon: "leaf",
      label: "植物"
    }, {
      key: "diagnose",
      icon: "camera",
      label: "診断"
    }, {
      key: "history",
      icon: "history",
      label: "履歴"
    }, {
      key: "settings",
      icon: "settings",
      label: "設定"
    }]
  })), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 78,
      display: "flex",
      justifyContent: "center",
      padding: "0 16px"
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    message: toast
  })));
}
Object.assign(window, {
  App
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/App.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/DiagnoseScreen.jsx
try { (() => {
// DiagnoseScreen — photo upload + form → loading → AI analysis result.
const NS_D = window.AIPruningAssistantDesignSystem_a95f89;
function DiagnoseScreen() {
  const {
    PageTitle,
    UploadArea,
    Input,
    Radio,
    Textarea,
    Button,
    AlertBox,
    LoadingState,
    AnalysisResultCard,
    Icon
  } = NS_D;
  const [photos, setPhotos] = React.useState([{
    id: "a",
    url: "",
    name: "木全体.jpg"
  }, {
    id: "b",
    url: "",
    name: "気になる枝.jpg"
  }]);
  const [tree, setTree] = React.useState("モミジ");
  const [strength, setStrength] = React.useState("軽剪定");
  const [phase, setPhase] = React.useState("input"); // input | loading | result

  const run = () => {
    setPhase("loading");
    setTimeout(() => setPhase("result"), 1800);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18,
      padding: "18px 16px 96px"
    }
  }, /*#__PURE__*/React.createElement(PageTitle, {
    eyebrow: "AI DIAGNOSIS",
    title: "\u526A\u5B9A\u8A3A\u65AD",
    description: "\u6728\u306E\u5199\u771F\u3068\u72B6\u614B\u3092\u5165\u529B\u3059\u308B\u3068\u3001\u4ECA\u306E\u6642\u671F\u306B\u5408\u3063\u305F\u526A\u5B9A\u65B9\u91DD\u3092\u78BA\u8A8D\u3067\u304D\u307E\u3059\u3002"
  }), phase === "input" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(UploadArea, {
    photos: photos,
    onAdd: () => setPhotos(p => [...p, {
      id: Date.now() + "",
      url: "",
      name: "写真.jpg"
    }]),
    onRemove: id => setPhotos(p => p.filter(x => x.id !== id)),
    title: "\u5199\u771F\u3092\u8FFD\u52A0\u3059\u308B",
    hint: "\u6728\u5168\u4F53\u30FB\u5225\u89D2\u5EA6\u30FB\u6C17\u306B\u306A\u308B\u90E8\u5206\u306E3\u679A\u304C\u304A\u3059\u3059\u3081"
  }), /*#__PURE__*/React.createElement(Input, {
    label: "\u6A39\u6728\u540D",
    value: tree,
    onChange: e => setTree(e.target.value),
    iconLeft: "leaf",
    helper: "\u5206\u304B\u3089\u306A\u3044\u5834\u5408\u306F\u300C\u4E0D\u660E\u300D\u3067\u3082\u5927\u4E08\u592B\u3067\u3059"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-sans)",
      fontWeight: "var(--fw-semibold)",
      fontSize: "var(--fs-sm)",
      marginBottom: 8
    }
  }, "\u526A\u5B9A\u306E\u5F37\u3055"), /*#__PURE__*/React.createElement(Radio, {
    value: strength,
    onChange: setStrength,
    options: ["強剪定", "軽剪定", "形を整える程度", "枯れ枝の整理"]
  })), /*#__PURE__*/React.createElement(Textarea, {
    label: "\u6C17\u306B\u306A\u308B\u70B9",
    rows: 3,
    placeholder: "\u4F8B: \u5927\u304D\u304F\u306A\u308A\u3059\u304E\u305F\u3001\u96A3\u5BB6\u306B\u679D\u304C\u4F38\u3073\u3066\u3044\u308B\u3001\u67AF\u308C\u679D\u304C\u3042\u308B"
  }), /*#__PURE__*/React.createElement(AlertBox, {
    tone: "warning",
    title: "\u5B89\u5168\u306E\u305F\u3081\u306E\u78BA\u8A8D"
  }, "\u9AD8\u6240\u30FB\u592A\u3044\u679D\u30FB\u96FB\u7DDA\u4ED8\u8FD1\u306A\u3069\u5371\u967A\u3092\u4F34\u3046\u4F5C\u696D\u306F\u3001\u7121\u7406\u3092\u305B\u305A\u5C02\u9580\u5BB6\u3078\u4F9D\u983C\u3057\u3066\u304F\u3060\u3055\u3044\u3002"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    fullWidth: true,
    icon: "sparkles",
    onClick: run
  }, "AI\u3067\u8A3A\u65AD\u3059\u308B"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      textAlign: "center",
      fontSize: "var(--fs-caption)",
      color: "var(--color-text-secondary)"
    }
  }, "\u5165\u529B\u5185\u5BB9\u3068\u5199\u771F\u306FAI\u3078\u9001\u4FE1\u3055\u308C\u307E\u3059\u3002\u5B9F\u4F5C\u696D\u306F\u6728\u306E\u72B6\u614B\u3092\u76F4\u63A5\u78BA\u8A8D\u3057\u3066\u304B\u3089\u884C\u3063\u3066\u304F\u3060\u3055\u3044\u3002")), phase === "loading" && /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-card)"
    }
  }, /*#__PURE__*/React.createElement(LoadingState, {
    message: "\u5199\u771F\u3068\u5165\u529B\u5185\u5BB9\u3092\u5206\u6790\u3057\u3066\u3044\u307E\u3059\u2026",
    sub: "30\u79D2\u307B\u3069\u304B\u304B\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059"
  })), phase === "result" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(AnalysisResultCard, {
    summary: tree + "は落葉樹。冬の落葉期が適期で、今は軽剪定・枯れ枝の整理にとどめるのが安全です。",
    sections: [{
      tone: "cut",
      heading: "優先して切る枝",
      body: "枯れ枝・折れ枝、内向きに伸びた徒長枝、混み合って風通しを妨げる枝。"
    }, {
      tone: "keep",
      heading: "残した方が良い枝",
      body: "樹形を作る主要な枝と、来春に向けた元気な短い枝。"
    }, {
      tone: "caution",
      heading: "注意点",
      body: "太い枝の切除は切り口が大きく、木を弱らせることがあります。今回は見送りを推奨します。"
    }, {
      tone: "note",
      heading: "次に撮るとよい写真",
      body: "幹の付け根と、気になる枝の断面のアップ。診断の精度が上がります。"
    }]
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "outline",
    fullWidth: true,
    icon: "rotate-ccw",
    onClick: () => setPhase("input")
  }, "\u3082\u3046\u4E00\u5EA6\u5165\u529B\u3059\u308B")));
}
Object.assign(window, {
  DiagnoseScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/DiagnoseScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/HomeScreen.jsx
try { (() => {
// HomeScreen — plant list with search, season highlight, and category filter chips.
const NS = window.AIPruningAssistantDesignSystem_a95f89;
function HomeScreen({
  plants,
  query,
  setQuery,
  filter,
  setFilter,
  onOpenPlant,
  onToggleFav
}) {
  const {
    SearchBar,
    PageTitle,
    PlantCard,
    Tag,
    AlertBox,
    Icon
  } = NS;
  const filters = ["すべて", "常緑樹", "落葉樹", "花木", "果樹", "お気に入り"];
  const visible = plants.filter(p => {
    if (query && !(p.name + (p.subtitle || "")).includes(query)) return false;
    if (filter === "すべて") return true;
    if (filter === "お気に入り") return p.favorite;
    return p.category === filter;
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 18,
      padding: "18px 16px 96px"
    }
  }, /*#__PURE__*/React.createElement(PageTitle, {
    eyebrow: "MY GARDEN",
    title: "\u308F\u305F\u3057\u306E\u5EAD",
    description: "\u767B\u9332\u3057\u305F\u6728\u3084\u9262\u690D\u3048\u306E\u624B\u5165\u308C\u6642\u671F\u3092\u7BA1\u7406\u3067\u304D\u307E\u3059\u3002"
  }), /*#__PURE__*/React.createElement(SearchBar, {
    value: query,
    onChange: e => setQuery(e.target.value),
    onClear: () => setQuery(""),
    placeholder: "\u690D\u7269\u540D\u3067\u691C\u7D22"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      overflowX: "auto",
      paddingBottom: 2,
      margin: "0 -16px",
      padding: "0 16px 2px"
    }
  }, filters.map(f => /*#__PURE__*/React.createElement(Tag, {
    key: f,
    tone: "green",
    selected: filter === f,
    onClick: () => setFilter(f),
    style: {
      flex: "0 0 auto",
      height: 34,
      padding: "0 14px",
      fontSize: "var(--fs-sm)"
    }
  }, f))), /*#__PURE__*/React.createElement(AlertBox, {
    tone: "info",
    icon: "calendar"
  }, /*#__PURE__*/React.createElement("strong", {
    style: {
      color: "var(--color-text-strong)"
    }
  }, "\u4ECA\u306E\u6642\u671F\uFF087\u6708\uFF09"), "\u306F\u3001\u5E38\u7DD1\u6A39\u306E\u8EFD\u3044\u5208\u308A\u8FBC\u307F\u306B\u5411\u3044\u3066\u3044\u307E\u3059\u3002\u843D\u8449\u6A39\u306E\u5F37\u526A\u5B9A\u306F\u51AC\u307E\u3067\u5F85\u3061\u307E\u3057\u3087\u3046\u3002"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 14
    }
  }, visible.map(p => /*#__PURE__*/React.createElement(PlantCard, {
    key: p.id,
    name: p.name,
    subtitle: p.subtitle,
    tags: p.tags,
    season: p.season,
    favorite: p.favorite,
    onToggleFavorite: () => onToggleFav(p.id),
    onClick: () => onOpenPlant(p.id)
  }))), visible.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "30px 0",
      textAlign: "center",
      color: "var(--color-text-secondary)",
      fontSize: "var(--fs-sm)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search-x",
    size: 30,
    strokeWidth: 1.5,
    style: {
      color: "var(--green-300)",
      margin: "0 auto 8px"
    }
  }), /*#__PURE__*/React.createElement("div", null, "\u300C", query || filter, "\u300D\u306B\u4E00\u81F4\u3059\u308B\u690D\u7269\u306F\u3042\u308A\u307E\u305B\u3093\u3002")));
}
Object.assign(window, {
  HomeScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/HomeScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/app/PlantDetailScreen.jsx
try { (() => {
// PlantDetailScreen — photo hero, season card, pruning steps, cautions.
const NS_P = window.AIPruningAssistantDesignSystem_a95f89;
function PlantDetailScreen({
  plant
}) {
  const {
    Tag,
    SeasonBadge,
    StatusBadge,
    StepCard,
    AlertBox,
    Icon,
    Button
  } = NS_P;
  const p = plant;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: 96
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      aspectRatio: "16 / 10",
      background: "var(--color-surface-sunken)",
      display: "grid",
      placeItems: "center",
      color: "var(--green-300)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sprout",
    size: 52,
    strokeWidth: 1.4
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 16,
      bottom: 14
    }
  }, /*#__PURE__*/React.createElement(SeasonBadge, {
    level: p.season.level,
    month: p.season.month
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20,
      padding: "18px 16px 0"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: "0 0 4px",
      fontFamily: "var(--font-serif)",
      fontWeight: 700,
      fontSize: "var(--fs-h1)",
      color: "var(--color-text-strong)"
    }
  }, p.name), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "0 0 10px",
      color: "var(--color-text-secondary)",
      fontSize: "var(--fs-sm)"
    }
  }, p.subtitle), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 6
    }
  }, p.tags.map((t, i) => /*#__PURE__*/React.createElement(Tag, {
    key: i,
    tone: t.tone,
    icon: t.icon
  }, t.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      padding: 16,
      background: "var(--color-accent-light)",
      border: "1px solid var(--blue-100)",
      borderRadius: "var(--radius-lg)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar-check",
    size: 22,
    style: {
      color: "var(--color-accent)",
      flex: "0 0 auto",
      marginTop: 2
    }
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: "var(--fw-bold)",
      fontSize: "var(--fs-sm)",
      color: "var(--color-text-strong)",
      marginBottom: 3
    }
  }, "\u526A\u5B9A\u306E\u9069\u671F\u306F ", p.season.month), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontSize: "var(--fs-sm)",
      lineHeight: 1.7,
      color: "var(--color-text-secondary)"
    }
  }, p.timing))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "list-checks",
    size: 20,
    style: {
      color: "var(--color-primary)"
    }
  }), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-sans)",
      fontWeight: 700,
      fontSize: "var(--fs-h4)",
      color: "var(--color-text-strong)"
    }
  }, "\u4F5C\u696D\u624B\u9806")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(StepCard, {
    step: 1,
    title: "\u5168\u4F53\u306E\u5F62\u3092\u78BA\u8A8D\u3059\u308B",
    description: "\u96E2\u308C\u3066\u6728\u5168\u4F53\u3092\u898B\u3066\u3001\u6DF7\u307F\u5408\u3063\u305F\u90E8\u5206\u3084\u98DB\u3073\u51FA\u3057\u305F\u679D\u3092\u63A2\u3057\u307E\u3059\u3002"
  }), /*#__PURE__*/React.createElement(StepCard, {
    step: 2,
    title: "\u67AF\u308C\u679D\u30FB\u6298\u308C\u679D\u3092\u5207\u308B",
    description: "\u67AF\u308C\u305F\u679D\u3092\u4ED8\u3051\u6839\u304B\u3089\u5207\u308A\u3001\u98A8\u901A\u3057\u3092\u826F\u304F\u3057\u307E\u3059\u3002"
  }), /*#__PURE__*/React.createElement(StepCard, {
    step: 3,
    title: "\u5185\u5411\u304D\u30FB\u4EA4\u5DEE\u3057\u305F\u679D\u3092\u6574\u7406\u3059\u308B",
    description: "\u5185\u5074\u306B\u4F38\u3073\u308B\u679D\u3084\u4EA4\u5DEE\u3059\u308B\u679D\u3092\u9078\u3093\u3067\u9593\u5F15\u304D\u307E\u3059\u3002"
  }))), /*#__PURE__*/React.createElement(AlertBox, {
    tone: "warning",
    title: "\u6CE8\u610F\u4E8B\u9805"
  }, "\u592A\u3044\u679D\u306E\u5207\u9664\u3084\u9AD8\u6240\u4F5C\u696D\u306F\u5371\u967A\u3092\u4F34\u3044\u307E\u3059\u3002\u7121\u7406\u306E\u306A\u3044\u7BC4\u56F2\u3067\u884C\u3044\u3001\u4E0D\u5B89\u306A\u5834\u5408\u306F\u5C02\u9580\u5BB6\u3078\u76F8\u8AC7\u3057\u3066\u304F\u3060\u3055\u3044\u3002"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    fullWidth: true,
    icon: "camera"
  }, "\u3053\u306E\u6728\u3092\u8A3A\u65AD\u3059\u308B")));
}
Object.assign(window, {
  PlantDetailScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/app/PlantDetailScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.SeasonBadge = __ds_scope.SeasonBadge;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.AnalysisResultCard = __ds_scope.AnalysisResultCard;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.PlantCard = __ds_scope.PlantCard;

__ds_ns.StepCard = __ds_scope.StepCard;

__ds_ns.AlertBox = __ds_scope.AlertBox;

__ds_ns.EmptyState = __ds_scope.EmptyState;

__ds_ns.LoadingState = __ds_scope.LoadingState;

__ds_ns.Modal = __ds_scope.Modal;

__ds_ns.Skeleton = __ds_scope.Skeleton;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Fab = __ds_scope.Fab;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.SearchBar = __ds_scope.SearchBar;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Textarea = __ds_scope.Textarea;

__ds_ns.UploadArea = __ds_scope.UploadArea;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.AppHeader = __ds_scope.AppHeader;

__ds_ns.BottomNavigation = __ds_scope.BottomNavigation;

__ds_ns.PageTitle = __ds_scope.PageTitle;

})();
