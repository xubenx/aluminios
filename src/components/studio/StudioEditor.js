"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Slider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Add,
  Delete,
  Save,
  ArrowBack,
  Straighten,
  TextFields,
  GridOn,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from "@mui/icons-material";
import DrawingView from "./DrawingView";
import {
  createEmptyDrawing,
  sanitizeDrawing,
  ensureDimensionElements,
  makeElementId,
  computePanels,
  isFullSpanDivider,
  svgPointToCm,
  formatCota,
  resolveTextValue,
  snapDimensionPoint,
  DEFAULT_PROFILE_CM,
} from "../../utils/drawing";

const clamp01 = (v) => Math.min(Math.max(Number(v) || 0, 0), 1);
// Rango con un poco de margen fuera del marco: permite anotar afuera sin irse lejos.
const clampWide = (v) => Math.min(Math.max(Number(v) || 0, -0.3), 1.3);
const HISTORY_LIMIT = 80;
const COALESCE_MS = 900;

const isEditableTarget = (el) =>
  !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);

export default function StudioEditor({
  initialDrawing,
  modelName = "Modelo",
  onSave,
  onBack,
  saving = false,
  onChange,
  showBaseControls = true,
  title,
  widthCm,
  heightCm,
}) {
  const [drawing, setDrawing] = useState(() =>
    ensureDimensionElements(sanitizeDrawing(initialDrawing) || createEmptyDrawing())
  );
  const [selectedId, setSelectedId] = useState(null);
  const [useReal, setUseReal] = useState(false);
  const [realDims, setRealDims] = useState({ width: "", height: "" });
  // Creacion de cota seleccionando dos puntos
  const [dimensionMode, setDimensionMode] = useState(false);
  const [pendingPointCm, setPendingPointCm] = useState(null);
  // Edicion del numero de una cota
  const [editingValueId, setEditingValueId] = useState(null);
  const [valueDraft, setValueDraft] = useState("");

  const svgRef = useRef(null);
  const dragRef = useRef({ id: null, type: null, handle: null, last: null, pushed: false });
  // Que anotacion se esta arrastrando desde la paleta (para el drop en el plano).
  const paletteDragRef = useRef(null);

  const drawingRef = useRef(drawing);
  const onChangeRef = useRef(onChange);
  const historyRef = useRef([]);
  const futureRef = useRef([]);
  const lastPushRef = useRef({ key: null, time: 0 });
  const [, setHistoryVersion] = useState(0);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const next = ensureDimensionElements(sanitizeDrawing(initialDrawing) || createEmptyDrawing());
    drawingRef.current = next;
    setDrawing(next);
    setSelectedId(null);
    historyRef.current = [];
    futureRef.current = [];
    lastPushRef.current = { key: null, time: 0 };
  }, [initialDrawing]);

  const base = drawing.baseDimension;
  const hasFixedPreview = Number(widthCm) > 0 && Number(heightCm) > 0;
  const W = Number(widthCm) > 0
    ? Number(widthCm)
    : useReal && Number(realDims.width) > 0
      ? Number(realDims.width)
      : base.width;
  const H = Number(heightCm) > 0
    ? Number(heightCm)
    : useReal && Number(realDims.height) > 0
      ? Number(realDims.height)
      : base.height;
  const profile = Math.min(Math.max(drawing.profile ?? DEFAULT_PROFILE_CM, 0), Math.min(W, H) / 2);
  const panels = useMemo(() => computePanels(drawing, W, H), [drawing, W, H]);
  // Caja de dibujo estable: no depende de la posicion de los elementos, asi el
  // plano no se desplaza mientras se arrastra algo.
  const stableViewBox = useMemo(() => {
    const pad = Math.max(W, H) * 0.34;
    return { x: -pad, y: -pad, w: W + 2 * pad, h: H + 2 * pad };
  }, [W, H]);
  const selected = drawing.elements.find((e) => e.id === selectedId) || null;

  // --- Historial (deshacer / rehacer) ---
  const pushHistory = (snapshot, key = null) => {
    const now = Date.now();
    const last = lastPushRef.current;
    const coalesce = key && last.key === key && now - last.time < COALESCE_MS;
    if (!coalesce) {
      historyRef.current.push(snapshot);
      if (historyRef.current.length > HISTORY_LIMIT) historyRef.current.shift();
    }
    lastPushRef.current = { key, time: now };
    futureRef.current = [];
    setHistoryVersion((v) => v + 1);
  };

  const restore = (snapshot) => {
    drawingRef.current = snapshot;
    setDrawing(snapshot);
    onChangeRef.current?.(snapshot);
  };

  const commit = (updater, opts = {}) => {
    const prev = drawingRef.current;
    const next = typeof updater === "function" ? updater(prev) : updater;
    if (!next || next === prev) return;
    if (opts.history !== false) pushHistory(prev, opts.key ?? null);
    restore(next);
  };

  const undo = () => {
    if (!historyRef.current.length) return;
    const prev = historyRef.current.pop();
    futureRef.current.push(drawingRef.current);
    lastPushRef.current = { key: null, time: 0 };
    restore(prev);
    setSelectedId(null);
    setHistoryVersion((v) => v + 1);
  };

  const redo = () => {
    if (!futureRef.current.length) return;
    const next = futureRef.current.pop();
    historyRef.current.push(drawingRef.current);
    lastPushRef.current = { key: null, time: 0 };
    restore(next);
    setSelectedId(null);
    setHistoryVersion((v) => v + 1);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (isEditableTarget(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        redo();
      } else if (e.key === "Escape") {
        if (dimensionMode) {
          setDimensionMode(false);
          setPendingPointCm(null);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const updateElement = (id, patch, opts = {}) => {
    commit(
      (prev) => ({
        ...prev,
        elements: prev.elements.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }),
      { key: opts.key ?? `edit:${id}` }
    );
  };

  const addElement = (element) => {
    commit((prev) => ({ ...prev, elements: [...prev.elements, element] }));
    setSelectedId(element.id);
  };

  // Seccion media a lo largo de un eje, segun las divisiones perpendiculares
  // completas ya existentes (para que una travesaño caiga solo en el centro).
  const middleSection = (axis) => {
    const perp = axis === "h" ? "v" : "h";
    const positions = drawing.elements
      .filter((e) => e.type === "divider" && e.axis === perp && isFullSpanDivider(e))
      .map((e) => clamp01(e.position))
      .sort((a, b) => a - b);
    const bounds = [0, ...positions, 1];
    for (let i = 0; i < bounds.length - 1; i += 1) {
      if (0.5 >= bounds[i] && 0.5 <= bounds[i + 1]) {
        return { from: bounds[i], to: bounds[i + 1] };
      }
    }
    return { from: 0, to: 1 };
  };

  const addDivider = (axis) => {
    const { from, to } = middleSection(axis);
    addElement({ id: makeElementId("div"), type: "divider", axis, position: 0.5, from, to });
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    commit((prev) => ({ ...prev, elements: prev.elements.filter((e) => e.id !== selectedId) }));
    setSelectedId(null);
  };

  // --- Creacion de cota seleccionando dos puntos ---
  const handleCanvasPoint = (xcm, ycm) => {
    if (!dimensionMode) return;
    const fx = clampWide(W ? xcm / W : 0);
    const fy = clampWide(H ? ycm / H : 0);
    if (!pendingPointCm) {
      setPendingPointCm({ x: xcm, y: ycm, fx, fy });
      return;
    }
    // La cota sale recta: se ajusta al angulo permitido mas cercano.
    const snapped = snapDimensionPoint(pendingPointCm.fx, pendingPointCm.fy, fx, fy, W, H);
    const el = {
      id: makeElementId("dim"),
      type: "dimension",
      x1: pendingPointCm.fx,
      y1: pendingPointCm.fy,
      x2: clampWide(snapped.x),
      y2: clampWide(snapped.y),
      value: "",
      size: 0,
    };
    addElement(el);
    setPendingPointCm(null);
    setDimensionMode(false);
  };

  // --- Edicion del numero de la cota ---
  const openValueEditor = (id) => {
    const el = drawingRef.current.elements.find((e) => e.id === id);
    if (!el || el.type !== "dimension") return;
    setSelectedId(id);
    setValueDraft(el.value || "");
    setEditingValueId(id);
  };

  const applyValue = () => {
    if (!editingValueId) return;
    updateElement(editingValueId, { value: valueDraft }, { key: `value:${editingValueId}` });
    setEditingValueId(null);
  };

  // --- Arrastre de elementos (divisiones y anotaciones) ---
  const handleElementPointerDown = (ev, el, handle = null) => {
    dragRef.current = { id: el.id, type: el.type, handle, last: null, pushed: false };
    const move = (e) => handleDragMove(e);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      dragRef.current = { id: null, type: null, handle: null, last: null, pushed: false };
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    handleDragMove(ev);
  };

  const handleDragMove = (ev) => {
    const drag = dragRef.current;
    if (!drag.id || !svgRef.current) return;
    const pt = svgPointToCm(svgRef.current, ev.clientX, ev.clientY);
    const { id, type, handle } = drag;
    const innerW = Math.max(W - 2 * profile, 1);
    const innerH = Math.max(H - 2 * profile, 1);

    const pushOnce = () => {
      if (!drag.pushed) {
        pushHistory(drawingRef.current, `drag:${id}`);
        drag.pushed = true;
      }
    };

    // Arrastre de un extremo de la cota libre (se mantiene recta al ajustar el angulo)
    if (type === "dimension" && handle) {
      pushOnce();
      const el = drawingRef.current.elements.find((e) => e.id === id);
      const other = handle === "a" ? { x: el.x2, y: el.y2 } : { x: el.x1, y: el.y1 };
      const snapped = snapDimensionPoint(other.x, other.y, pt.x / W, pt.y / H, W, H);
      const x = clampWide(snapped.x);
      const y = clampWide(snapped.y);
      commit(
        (prev) => ({
          ...prev,
          elements: prev.elements.map((e) =>
            e.id === id ? { ...e, [`x${handle === "a" ? 1 : 2}`]: x, [`y${handle === "a" ? 1 : 2}`]: y } : e
          ),
        }),
        { history: false }
      );
      return;
    }

    // Arrastre de un extremo de una division (cambia su extension from/to)
    if (type === "divider" && handle) {
      pushOnce();
      const el = drawingRef.current.elements.find((e) => e.id === id);
      const frac = clamp01(
        el?.axis === "h" ? (pt.x - profile) / innerW : (pt.y - profile) / innerH
      );
      commit(
        (prev) => ({
          ...prev,
          elements: prev.elements.map((e) => {
            if (e.id !== id) return e;
            if (handle === "a") return { ...e, from: Math.min(frac, e.to) };
            return { ...e, to: Math.max(frac, e.from) };
          }),
        }),
        { history: false }
      );
      return;
    }

    if (type === "arrow" || type === "dimension") {
      if (drag.last) {
        pushOnce();
        const dx = (pt.x - drag.last.x) / W;
        const dy = (pt.y - drag.last.y) / H;
        commit(
          (prev) => ({
            ...prev,
            elements: prev.elements.map((e) =>
              e.id === id
                ? {
                    ...e,
                    x1: clampWide(e.x1 + dx),
                    y1: clampWide(e.y1 + dy),
                    x2: clampWide(e.x2 + dx),
                    y2: clampWide(e.y2 + dy),
                  }
                : e
            ),
          }),
          { history: false }
        );
      }
      drag.last = pt;
      return;
    }

    pushOnce();
    commit(
      (prev) => ({
        ...prev,
        elements: prev.elements.map((e) => {
          if (e.id !== id) return e;
          if (type === "divider") {
            const pos =
              e.axis === "h"
                ? clamp01((pt.y - profile) / innerH)
                : clamp01((pt.x - profile) / innerW);
            return { ...e, position: pos };
          }
          if (type === "text") {
            return { ...e, x: clampWide(pt.x / W), y: clampWide(pt.y / H) };
          }
          return e;
        }),
      }),
      { history: false }
    );
    drag.last = pt;
  };

  const arrowAngle = (el) => {
    const deg =
      (Math.atan2(
        (Number(el?.y2) || 0) * H - (Number(el?.y1) || 0) * H,
        (Number(el?.x2) || 0) * W - (Number(el?.x1) || 0) * W
      ) *
        180) /
      Math.PI;
    return Math.round((deg + 360) % 360);
  };

  const rotateArrow = (id, targetAngle) => {
    commit(
      (prev) => ({
        ...prev,
        elements: prev.elements.map((e) => {
          if (e.id !== id || e.type !== "arrow") return e;
          const cx = (e.x1 + e.x2) / 2;
          const cy = (e.y1 + e.y2) / 2;
          const cur =
            (Math.atan2((e.y2 - e.y1) * H, (e.x2 - e.x1) * W) * 180) / Math.PI;
          const delta = ((targetAngle - cur) * Math.PI) / 180;
          const cos = Math.cos(delta);
          const sin = Math.sin(delta);
          const rot = (x, y) => {
            const dxCm = (x - cx) * W;
            const dyCm = (y - cy) * H;
            return {
              x: cx + (dxCm * cos - dyCm * sin) / W,
              y: cy + (dxCm * sin + dyCm * cos) / H,
            };
          };
          const a = rot(e.x1, e.y1);
          const b = rot(e.x2, e.y2);
          return {
            ...e,
            x1: clampWide(a.x),
            y1: clampWide(a.y),
            x2: clampWide(b.x),
            y2: clampWide(b.y),
          };
        }),
      }),
      { key: `rotate:${id}` }
    );
  };

  // --- Colocacion por arrastre desde la paleta (drag & drop) ---
  // Los botones de la paleta inician un arrastre HTML5; el plano (DrawingView)
  // reporta el punto donde se suelta y aqui se crea el elemento justo ahi.
  const paletteDragProps = (kind) => ({
    draggable: true,
    onDragStart: (ev) => {
      paletteDragRef.current = kind;
      if (ev.dataTransfer) {
        ev.dataTransfer.effectAllowed = "copy";
        ev.dataTransfer.setData("text/plain", kind);
      }
    },
    onDragEnd: () => {
      paletteDragRef.current = null;
    },
  });

  const handleDropElement = (kindRaw, xcm, ycm) => {
    const kind = kindRaw || paletteDragRef.current;
    if (!kind) return;
    const fx = clampWide(W ? xcm / W : 0.5);
    const fy = clampWide(H ? ycm / H : 0.5);
    let element = null;
    if (kind === "arrow") {
      // La flecha se centra en el punto donde se solto.
      const half = 0.08;
      element = {
        id: makeElementId("arrow"),
        type: "arrow",
        x1: clampWide(fx - half),
        y1: fy,
        x2: clampWide(fx + half),
        y2: fy,
      };
    } else if (kind === "text") {
      element = {
        id: makeElementId("txt"),
        type: "text",
        x: fx,
        y: fy,
        text: "Texto",
        size: 6,
        lineGap: 1.3,
        boxWidth: 0,
        auto: null,
      };
    } else if (kind === "textWide") {
      element = {
        id: makeElementId("txt"),
        type: "text",
        x: fx,
        y: fy,
        text: formatCota(W),
        size: 6,
        lineGap: 1.3,
        boxWidth: 0,
        auto: "width",
      };
    } else if (kind === "textTall") {
      element = {
        id: makeElementId("txt"),
        type: "text",
        x: fx,
        y: fy,
        text: formatCota(H),
        size: 6,
        lineGap: 1.3,
        boxWidth: 0,
        auto: "height",
      };
    }
    if (!element) return;
    addElement(element);
  };

  const palette = (
    <Stack spacing={1} sx={{ p: 1 }}>
      <Typography variant="overline" color="text.secondary">
        Agregar
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
        Tip: arrastra Flecha, Texto, Texto Ancho o Texto Alto al plano para
        colocarlos donde los sueltes.
      </Typography>
      <Button
        size="small"
        variant="outlined"
        startIcon={<GridOn />}
        onClick={() => addDivider("v")}
      >
        Division vertical
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<GridOn sx={{ transform: "rotate(90deg)" }} />}
        onClick={() => addDivider("h")}
      >
        Division horizontal
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<Add />}
        onClick={() => addElement({ id: makeElementId("bars"), type: "bars", axis: "v", count: 5, panel: 0 })}
      >
        Barrotes verticales
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<Add />}
        onClick={() => addElement({ id: makeElementId("bars"), type: "bars", axis: "h", count: 3, panel: 0 })}
      >
        Barrotes horizontales
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<TextFields />}
        {...paletteDragProps("text")}
        onClick={() => addElement({ id: makeElementId("txt"), type: "text", x: 0.5, y: 0.5, text: "Texto", size: 6 })}
      >
        Texto
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<TextFields />}
        {...paletteDragProps("textWide")}
        onClick={() =>
          addElement({
            id: makeElementId("txt"),
            type: "text",
            x: 0.4,
            y: -0.12,
            text: formatCota(W),
            size: 6,
            lineGap: 1.3,
            boxWidth: 0,
            auto: "width",
          })
        }
      >
        Texto Ancho
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<TextFields />}
        {...paletteDragProps("textTall")}
        onClick={() =>
          addElement({
            id: makeElementId("txt"),
            type: "text",
            x: 1.06,
            y: 0.5,
            text: formatCota(H),
            size: 6,
            lineGap: 1.3,
            boxWidth: 0,
            auto: "height",
          })
        }
      >
        Texto Alto
      </Button>
      <Typography variant="caption" color="text.secondary">
        Texto Ancho va arriba y Texto Alto a la derecha (lado opuesto a la cota).
        Ambos muestran la medida en vivo.
      </Typography>
      <Button
        size="small"
        variant="outlined"
        startIcon={<Straighten />}
        {...paletteDragProps("arrow")}
        onClick={() => addElement({ id: makeElementId("arrow"), type: "arrow", x1: 0.42, y1: 0.5, x2: 0.58, y2: 0.5 })}
      >
        Flecha
      </Button>
      <Divider />
      <Typography variant="overline" color="text.secondary">
        Vista / Apertura
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Vista
      </Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={drawing.viewSide || "inside"}
        onChange={(_, v) => v && commit((prev) => ({ ...prev, viewSide: v }))}
      >
        <ToggleButton value="inside" sx={{ fontSize: "0.7rem", px: 0.5 }}>Dentro</ToggleButton>
        <ToggleButton value="outside" sx={{ fontSize: "0.7rem", px: 0.5 }}>Fuera</ToggleButton>
        <ToggleButton value="none" sx={{ fontSize: "0.7rem", px: 0.5 }}>No aplica</ToggleButton>
      </ToggleButtonGroup>
      <Typography variant="caption" color="text.secondary">
        Abre
      </Typography>
      <ToggleButtonGroup
        size="small"
        exclusive
        fullWidth
        value={drawing.opensTo || "inside"}
        onChange={(_, v) => v && commit((prev) => ({ ...prev, opensTo: v }))}
      >
        <ToggleButton value="inside" sx={{ fontSize: "0.7rem", px: 0.5 }}>Dentro</ToggleButton>
        <ToggleButton value="outside" sx={{ fontSize: "0.7rem", px: 0.5 }}>Fuera</ToggleButton>
        <ToggleButton value="none" sx={{ fontSize: "0.7rem", px: 0.5 }}>No aplica</ToggleButton>
      </ToggleButtonGroup>
      <ToggleButton
        size="small"
        fullWidth
        value="screen"
        selected={!!drawing.screen}
        onChange={() =>
          commit((prev) => ({
            ...prev,
            screen: !prev.screen,
            screenPanels: prev.screen ? [] : prev.screenPanels,
          }))
        }
      >
        # Mosquitero
      </ToggleButton>
      {drawing.screen && (
        <>
          <Typography variant="caption" color="text.secondary">
            Secciones con mosquitero
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            <Chip
              size="small"
              label="Todos"
              color={(drawing.screenPanels || []).length === 0 ? "primary" : "default"}
              onClick={() => commit((prev) => ({ ...prev, screenPanels: [] }))}
            />
            {panels.map((p) => {
              const active = (drawing.screenPanels || []).includes(p.index);
              return (
                <Chip
                  key={p.index}
                  size="small"
                  label={`P${p.index + 1}`}
                  color={active ? "primary" : "default"}
                  variant={active ? "filled" : "outlined"}
                  onClick={() =>
                    commit((prev) => {
                      const list = prev.screenPanels || [];
                      const next = list.includes(p.index)
                        ? list.filter((i) => i !== p.index)
                        : [...list, p.index];
                      return { ...prev, screenPanels: next };
                    })
                  }
                />
              );
            })}
          </Box>
        </>
      )}
      <Divider />
      <Typography variant="overline" color="text.secondary">
        Cotas
      </Typography>
      <Button
        size="small"
        variant={dimensionMode ? "contained" : "outlined"}
        color="primary"
        startIcon={<Straighten />}
        onClick={() => {
          setDimensionMode((v) => !v);
          setPendingPointCm(null);
        }}
      >
        {dimensionMode ? "Elige 2 puntos..." : "Cota (2 puntos)"}
      </Button>
      <Typography variant="caption" color="text.secondary">
        {dimensionMode
          ? "Toca el primer punto y luego el segundo. Esc para cancelar."
          : "Haz clic en el numero de una cota para editarlo."}
      </Typography>
    </Stack>
  );

  const properties = selected ? (
    <Stack spacing={2} sx={{ p: 1 }}>
      <Typography variant="overline" color="text.secondary">
        Propiedades
      </Typography>

      {selected.type === "divider" && (
        <>
          <Chip size="small" label={selected.axis === "v" ? "Division vertical" : "Division horizontal"} />
          <Typography variant="caption">Posicion: {Math.round(selected.position * 100)}%</Typography>
          <Slider
            value={selected.position * 100}
            min={0}
            max={100}
            onChange={(_, v) => updateElement(selected.id, { position: v / 100 })}
          />
          <Typography variant="caption">
            Extension: {Math.round((selected.from ?? 0) * 100)}% a {Math.round((selected.to ?? 1) * 100)}%
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mt: -0.5 }}>
            {selected.axis === "h" ? "A lo ancho (0 = izq, 100 = der)" : "A lo alto (0 = arriba, 100 = abajo)"}
          </Typography>
          <Slider
            value={[(selected.from ?? 0) * 100, (selected.to ?? 1) * 100]}
            min={0}
            max={100}
            onChange={(_, v) => {
              const [a, b] = Array.isArray(v) ? v : [v, v];
              updateElement(selected.id, { from: Math.min(a, b) / 100, to: Math.max(a, b) / 100 });
            }}
          />
          <Button
            size="small"
            variant="text"
            onClick={() => updateElement(selected.id, { from: 0, to: 1 })}
          >
            Que cruce todo
          </Button>
        </>
      )}

      {selected.type === "bars" && (
        <>
          <FormControl size="small" fullWidth>
            <InputLabel>Orientacion</InputLabel>
            <Select
              label="Orientacion"
              value={selected.axis}
              onChange={(e) => updateElement(selected.id, { axis: e.target.value })}
            >
              <MenuItem value="v">Verticales</MenuItem>
              <MenuItem value="h">Horizontales</MenuItem>
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Cantidad"
            type="number"
            value={selected.count}
            onChange={(e) => updateElement(selected.id, { count: Math.max(1, parseInt(e.target.value) || 1) })}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Panel</InputLabel>
            <Select
              label="Panel"
              value={selected.panel}
              onChange={(e) => updateElement(selected.id, { panel: Number(e.target.value) })}
            >
              {panels.map((p) => (
                <MenuItem key={p.index} value={p.index}>
                  Panel {p.index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}

      {selected.type === "hinge" && (
        <>
          <FormControl size="small" fullWidth>
            <InputLabel>Panel</InputLabel>
            <Select
              label="Panel"
              value={selected.panel}
              onChange={(e) => updateElement(selected.id, { panel: Number(e.target.value) })}
            >
              {panels.map((p) => (
                <MenuItem key={p.index} value={p.index}>
                  Panel {p.index + 1}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Lado</InputLabel>
            <Select
              label="Lado"
              value={selected.side}
              onChange={(e) => updateElement(selected.id, { side: e.target.value })}
            >
              <MenuItem value="left">Izquierda</MenuItem>
              <MenuItem value="right">Derecha</MenuItem>
              <MenuItem value="top">Arriba</MenuItem>
              <MenuItem value="bottom">Abajo</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Direccion</InputLabel>
            <Select
              label="Direccion"
              value={selected.direction}
              onChange={(e) => updateElement(selected.id, { direction: e.target.value })}
            >
              <MenuItem value="in">Hacia dentro</MenuItem>
              <MenuItem value="out">Hacia fuera</MenuItem>
            </Select>
          </FormControl>
        </>
      )}

      {selected.type === "text" && (
        <>
          {selected.auto && (
            <Chip
              size="small"
              color="primary"
              label={selected.auto === "width" ? "En vivo: ancho" : "En vivo: alto"}
              onDelete={() =>
                updateElement(selected.id, {
                  auto: null,
                  text: resolveTextValue(selected, W, H),
                })
              }
            />
          )}
          <TextField
            size="small"
            label="Texto"
            value={selected.auto ? resolveTextValue(selected, W, H) : selected.text}
            onChange={(e) => updateElement(selected.id, { text: e.target.value, auto: null })}
            multiline
            minRows={2}
            helperText={
              selected.auto
                ? "Valor en vivo (se actualiza con las medidas). Al editar se fija el texto."
                : "Enter para salto de linea"
            }
          />
          <TextField
            size="small"
            label="Tamano (cm)"
            type="number"
            value={selected.size}
            onChange={(e) => updateElement(selected.id, { size: Number(e.target.value) || 1 })}
          />
          <TextField
            size="small"
            label="Interlineado"
            type="number"
            inputProps={{ step: 0.1, min: 0.8, max: 3 }}
            value={selected.lineGap ?? 1.3}
            onChange={(e) => updateElement(selected.id, { lineGap: Number(e.target.value) || 1.3 })}
            helperText="Espacio entre lineas"
          />
          <Typography variant="caption">
            Ancho del cuadro: {selected.boxWidth ? `${Math.round(selected.boxWidth * 100)}%` : "auto"}
          </Typography>
          <Slider
            value={(selected.boxWidth || 0) * 100}
            min={0}
            max={100}
            onChange={(_, v) => updateElement(selected.id, { boxWidth: v / 100 })}
          />
          <Typography variant="caption">X: {Math.round(selected.x * 100)}%</Typography>
          <Slider
            value={selected.x * 100}
            min={-30}
            max={130}
            onChange={(_, v) => updateElement(selected.id, { x: v / 100 })}
          />
          <Typography variant="caption">Y: {Math.round(selected.y * 100)}%</Typography>
          <Slider
            value={selected.y * 100}
            min={-30}
            max={130}
            onChange={(_, v) => updateElement(selected.id, { y: v / 100 })}
          />
        </>
      )}

      {selected.type === "arrow" && (
        <>
          <TextField
            size="small"
            label="X inicial %"
            type="number"
            value={Math.round(selected.x1 * 100)}
            onChange={(e) => updateElement(selected.id, { x1: clampWide((e.target.value || 0) / 100) })}
          />
          <TextField
            size="small"
            label="Y inicial %"
            type="number"
            value={Math.round(selected.y1 * 100)}
            onChange={(e) => updateElement(selected.id, { y1: clampWide((e.target.value || 0) / 100) })}
          />
          <TextField
            size="small"
            label="X final %"
            type="number"
            value={Math.round(selected.x2 * 100)}
            onChange={(e) => updateElement(selected.id, { x2: clampWide((e.target.value || 0) / 100) })}
          />
          <TextField
            size="small"
            label="Y final %"
            type="number"
            value={Math.round(selected.y2 * 100)}
            onChange={(e) => updateElement(selected.id, { y2: clampWide((e.target.value || 0) / 100) })}
          />
          <Typography variant="caption">Rotacion: {arrowAngle(selected)}°</Typography>
          <Slider
            value={arrowAngle(selected)}
            min={0}
            max={360}
            onChange={(_, v) => rotateArrow(selected.id, v)}
          />
        </>
      )}

      {selected.type === "dimension" && (
        <>
          <TextField
            size="small"
            label="Numero / texto de la cota"
            placeholder="Ej: 100.4 (vacio = distancia real)"
            value={selected.value || ""}
            onChange={(e) => updateElement(selected.id, { value: e.target.value })}
            helperText="Solo visual: no cambia formula ni tamano. Tambien puedes hacer clic en el numero dentro del plano."
          />
          <TextField
            size="small"
            label="Tamano de texto (cm, 0 = auto)"
            type="number"
            value={selected.size || 0}
            onChange={(e) => updateElement(selected.id, { size: Math.max(0, Number(e.target.value) || 0) })}
          />
          <Typography variant="caption" color="text.secondary">
            Extremos (en % del claro; puedes salir del marco)
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="X1 %"
              type="number"
              value={Math.round(selected.x1 * 100)}
              onChange={(e) => updateElement(selected.id, { x1: clampWide((e.target.value || 0) / 100) })}
            />
            <TextField
              size="small"
              label="Y1 %"
              type="number"
              value={Math.round(selected.y1 * 100)}
              onChange={(e) => updateElement(selected.id, { y1: clampWide((e.target.value || 0) / 100) })}
            />
          </Stack>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="X2 %"
              type="number"
              value={Math.round(selected.x2 * 100)}
              onChange={(e) => updateElement(selected.id, { x2: clampWide((e.target.value || 0) / 100) })}
            />
            <TextField
              size="small"
              label="Y2 %"
              type="number"
              value={Math.round(selected.y2 * 100)}
              onChange={(e) => updateElement(selected.id, { y2: clampWide((e.target.value || 0) / 100) })}
            />
          </Stack>
        </>
      )}

      <Button color="error" variant="outlined" size="small" startIcon={<Delete />} onClick={deleteSelected}>
        Eliminar elemento
      </Button>
    </Stack>
  ) : (
    <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
      Selecciona un elemento para editarlo, o arrastra las divisiones y anotaciones en el plano.
    </Typography>
  );

  return (
    <Box sx={{ p: 2 }}>
      {(showBaseControls || onSave || onBack || title) && (
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
          {onBack && (
            <Tooltip title="Volver al modelo">
              <IconButton onClick={onBack}>
                <ArrowBack />
              </IconButton>
            </Tooltip>
          )}
          <Typography variant={showBaseControls ? "h5" : "h6"} sx={{ flexGrow: 1 }}>
            {title || `Studio - ${modelName}`}
          </Typography>
          <Tooltip title="Deshacer (Ctrl+Z)">
            <span>
              <IconButton onClick={undo} disabled={!historyRef.current.length}>
                <UndoIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Rehacer (Ctrl+Shift+Z)">
            <span>
              <IconButton onClick={redo} disabled={!futureRef.current.length}>
                <RedoIcon />
              </IconButton>
            </span>
          </Tooltip>
          {showBaseControls && (
            <>
              <FormControl size="small" sx={{ width: 130 }}>
                <TextField
                  label="Ancho base (cm)"
                  type="number"
                  size="small"
                  value={drawing.baseDimension.width}
                  onChange={(e) =>
                    commit((prev) => ({
                      ...prev,
                      baseDimension: { ...prev.baseDimension, width: Number(e.target.value) || 1 },
                    }))
                  }
                />
              </FormControl>
              <FormControl size="small" sx={{ width: 130 }}>
                <TextField
                  label="Alto base (cm)"
                  type="number"
                  size="small"
                  value={drawing.baseDimension.height}
                  onChange={(e) =>
                    commit((prev) => ({
                      ...prev,
                      baseDimension: { ...prev.baseDimension, height: Number(e.target.value) || 1 },
                    }))
                  }
                />
              </FormControl>
              <FormControl size="small" sx={{ width: 120 }}>
                <TextField
                  label="Perfil (cm)"
                  type="number"
                  size="small"
                  value={drawing.profile}
                  onChange={(e) => commit((prev) => ({ ...prev, profile: Number(e.target.value) || 0 }))}
                />
              </FormControl>
              <ToggleButtonGroup
                size="small"
                exclusive
                value={drawing.shape || "rect"}
                onChange={(_, v) => v && commit((prev) => ({ ...prev, shape: v }))}
              >
                <ToggleButton value="rect">Rectangular</ToggleButton>
                <ToggleButton value="arch">Arco</ToggleButton>
              </ToggleButtonGroup>
              {(drawing.shape || "rect") === "arch" && (
                <FormControl size="small" sx={{ width: 150 }}>
                  <TextField
                    label="Curvatura (%)"
                    type="number"
                    size="small"
                    value={Math.round((drawing.arcRise ?? 0.2) * 100)}
                    onChange={(e) =>
                      commit((prev) => ({
                        ...prev,
                        arcRise: Math.min(Math.max((Number(e.target.value) || 0) / 100, 0), 50),
                      }))
                    }
                  />
                </FormControl>
              )}
            </>
          )}
          {onSave && (
            <Button
              variant="contained"
              startIcon={<Save />}
              disabled={saving}
              onClick={() => onSave?.(drawing)}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          )}
        </Stack>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Paper variant="outlined" sx={{ width: { xs: "100%", md: 200 }, flexShrink: 0 }}>
          {palette}
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            flexGrow: 1,
            p: 2,
            bgcolor: "#fafafa",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 360,
          }}
        >
          <Box sx={{ width: "100%" }}>
            <DrawingView
              drawing={drawing}
              widthCm={W}
              heightCm={H}
              selectedId={selectedId}
              onSelectElement={setSelectedId}
              onElementPointerDown={handleElementPointerDown}
              onRequestValueEdit={openValueEditor}
              onCanvasPoint={dimensionMode ? handleCanvasPoint : undefined}
              onDropElement={handleDropElement}
              pendingPoint={pendingPointCm}
              viewBoxOverride={stableViewBox}
              svgRef={svgRef}
              style={{ maxHeight: 520 }}
            />
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ width: { xs: "100%", md: 240 }, flexShrink: 0 }}>
          {!hasFixedPreview && (
            <Box sx={{ p: 1, display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Probar medidas
              </Typography>
              <ToggleButton
                size="small"
                value="check"
                selected={useReal}
                onChange={() => setUseReal((v) => !v)}
              >
                Reales
              </ToggleButton>
            </Box>
          )}
          {!hasFixedPreview && useReal && (
            <Stack direction="row" spacing={1} sx={{ px: 1, pb: 1 }}>
              <TextField
                size="small"
                label="Ancho"
                type="number"
                value={realDims.width}
                onChange={(e) => setRealDims({ ...realDims, width: e.target.value })}
              />
              <TextField
                size="small"
                label="Alto"
                type="number"
                value={realDims.height}
                onChange={(e) => setRealDims({ ...realDims, height: e.target.value })}
              />
            </Stack>
          )}
          <Divider />
          {properties}
        </Paper>
      </Stack>

      {/* Edicion del numero de una cota */}
      <Dialog open={!!editingValueId} onClose={() => setEditingValueId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Editar numero de la cota</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label="Numero / texto"
            placeholder="Ej: 100.4 (vacio = distancia real)"
            value={valueDraft}
            onChange={(e) => setValueDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyValue();
            }}
            helperText="Solo visual: no cambia formula ni tamano."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingValueId(null)}>Cancelar</Button>
          <Button variant="contained" onClick={applyValue}>
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
