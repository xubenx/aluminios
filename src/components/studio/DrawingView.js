"use client";
import React, { useId } from "react";
import {
  sanitizeDrawing,
  computePanels,
  computeBars,
  computeHinge,
  computeDividerLine,
  computeViewBox,
  resolveDimensionValue,
  resolveTextValue,
  dimensionLabel,
  cotaDistanceCm,
  dedupeDimensions,
  svgPointToCm,
  buildOuterPath,
  buildInnerPath,
  DEFAULT_PROFILE_CM,
} from "../../utils/drawing";

const STROKE = "#1f2933";
const GLASS = "#eaf2fb";
const COTA = "#b3261e";

/**
 * Renderer SVG parametrico de un drawing.
 *
 * Es una funcion pura: recibe la plantilla (drawing) y las medidas reales en cm
 * y dibuja el plano a escala exacta. El mismo componente alimenta el editor,
 * las tarjetas, el detalle y las ordenes de trabajo.
 */
export default function DrawingView({
  drawing,
  widthCm,
  heightCm,
  showDimensions = true,
  valueOverrides = null,
  selectedId = null,
  onSelectElement,
  onElementPointerDown,
  onRequestValueEdit,
  onCanvasPoint,
  onDropElement,
  pendingPoint = null,
  viewBoxOverride = null,
  svgRef,
  style,
  className,
}) {
  const rawId = useId().replace(/[:]/g, "");
  const markerId = `arrow-${rawId}`;
  const clipId = `clip-${rawId}`;
  const screenId = `screen-${rawId}`;
  const d = sanitizeDrawing(drawing);
  if (!d) return null;

  const W = Number(widthCm) > 0 ? Number(widthCm) : d.baseDimension.width || 100;
  const H = Number(heightCm) > 0 ? Number(heightCm) : d.baseDimension.height || 100;
  const profile = Math.min(Math.max(d.profile ?? DEFAULT_PROFILE_CM, 0), Math.min(W, H) / 2);
  const unit = Math.max(0.3, Math.max(W, H) * 0.004);
  const margin = Math.max(8, Math.max(W, H) * 0.09);
  const panels = computePanels(d, W, H);
  const outerPath = buildOuterPath(d, W, H);
  const innerPath = buildInnerPath(d, W, H);
  const view = viewBoxOverride || computeViewBox(d, W, H, valueOverrides);
  const screenGrid = Math.max(3, Math.min(W, H) * 0.045);
  const interactive = typeof onSelectElement === "function";

  const dividers = d.elements.filter((e) => e.type === "divider");
  const bars = d.elements.filter((e) => e.type === "bars");
  const hinges = d.elements.filter((e) => e.type === "hinge");
  const texts = d.elements.filter((e) => e.type === "text");
  const arrows = d.elements.filter((e) => e.type === "arrow");
  const dimensionsAll = d.elements.filter((e) => e.type === "dimension");
  // En vistas de solo lectura se ocultan las cotas duplicadas superpuestas.
  const dimensions = interactive ? dimensionsAll : dedupeDimensions(dimensionsAll);
  // Si no hay cotas definidas, se muestran las medidas reales por defecto.
  const activeDimensions = showDimensions ? dimensions : [];
  const autoHCota = showDimensions && dimensions.length === 0;
  const autoVCota = showDimensions && dimensions.length === 0;

  const pickingPoints = typeof onCanvasPoint === "function";
  const draggable = !pickingPoints && typeof onElementPointerDown === "function";
  // Al crear una cota, el plano solo toma puntos de referencia: no selecciona
  // ni mueve elementos (el clic sube al lienzo para capturar el punto).
  const groupProps = (el) =>
    interactive && !pickingPoints
      ? {
          onClick: (ev) => {
            ev.stopPropagation();
            onSelectElement(el.id);
          },
          onPointerDown: draggable
            ? (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                onSelectElement(el.id);
                onElementPointerDown(ev, el);
              }
            : undefined,
          style: { cursor: draggable ? "move" : "pointer" },
        }
      : {};

  const labelProps = (el) => {
    if (pickingPoints || typeof onRequestValueEdit !== "function") return {};
    return {
      style: { cursor: "text" },
      onPointerDown: (ev) => ev.stopPropagation(),
      onClick: (ev) => {
        ev.stopPropagation();
        if (interactive) onSelectElement(el.id);
        onRequestValueEdit(el.id);
      },
    };
  };

  return (
    <svg
      ref={svgRef}
      className={className}
      viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
      width="100%"
      style={{
        display: "block",
        maxHeight: "100%",
        cursor: typeof onCanvasPoint === "function" ? "crosshair" : undefined,
        ...style,
      }}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      onClick={(ev) => {
        if (typeof onCanvasPoint !== "function") return;
        const pt = svgPointToCm(ev.currentTarget, ev.clientX, ev.clientY);
        if (pt) onCanvasPoint(pt.x, pt.y);
      }}
      onDragOver={(ev) => {
        if (typeof onDropElement !== "function") return;
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(ev) => {
        if (typeof onDropElement !== "function") return;
        ev.preventDefault();
        const kind = ev.dataTransfer.getData("text/plain") || "";
        const pt = svgPointToCm(ev.currentTarget, ev.clientX, ev.clientY);
        if (pt) onDropElement(kind, pt.x, pt.y);
      }}
    >
      <defs>
        <marker
          id={markerId}
          markerWidth={unit * 16}
          markerHeight={unit * 16}
          refX={unit * 13}
          refY={unit * 8}
          orient="auto"
          markerUnits="userSpaceOnUse"
        >
          <path d={`M0,0 L${unit * 16},${unit * 8} L0,${unit * 16} z`} fill={STROKE} />
        </marker>
        <clipPath id={clipId}>
          <path d={innerPath} />
        </clipPath>
        {/* Rejilla del mosquitero (#) */}
        <pattern
          id={screenId}
          width={screenGrid}
          height={screenGrid}
          patternUnits="userSpaceOnUse"
        >
          <rect width={screenGrid} height={screenGrid} fill={GLASS} />
          <path
            d={`M ${screenGrid} 0 L 0 0 0 ${screenGrid}`}
            fill="none"
            stroke="#8a97a6"
            strokeWidth={Math.max(unit * 0.5, 0.15)}
          />
        </pattern>
      </defs>

      {/* Interior (recortado al claro): paneles, barrotes, divisiones y aperturas */}
      <g clipPath={`url(#${clipId})`}>
        {/* Paneles (vidrio o mosquitero por seccion) */}
        {panels.map((p) => {
          const screened =
            d.screen && (d.screenPanels.length === 0 || d.screenPanels.includes(p.index));
          return (
            <rect
              key={`panel-${p.index}`}
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill={screened ? `url(#${screenId})` : GLASS}
            />
          );
        })}

        {/* Barrotes */}
      {bars.map((el) => {
        const panel = panels.find((p) => p.index === el.panel) || panels[0];
        return (
          <g key={el.id} {...groupProps(el)}>
            {computeBars(el, panel).map((ln, i) => (
              <line
                key={i}
                x1={ln.x1}
                y1={ln.y1}
                x2={ln.x2}
                y2={ln.y2}
                stroke={el.id === selectedId ? "#1976d2" : STROKE}
                strokeWidth={unit}
              />
            ))}
          </g>
        );
      })}

      {/* Divisiones (mullones/travesanos), con extension libre */}
      {dividers.map((el) => {
        const line = computeDividerLine(el, W, H, profile);
        const isSelected = el.id === selectedId;
        const handleR = Math.max(margin * 0.06, 2.5);
        return (
          <g key={el.id} {...groupProps(el)}>
            <line
              {...line}
              stroke={isSelected ? "#1976d2" : STROKE}
              strokeWidth={Math.max(profile * 0.6, unit * 2)}
              strokeLinecap="butt"
            />
            <line
              {...line}
              stroke="transparent"
              strokeWidth={Math.max(profile * 1.6, Math.max(W, H) * 0.03)}
            />
            {draggable && (
              <>
                <circle
                  cx={line.x1}
                  cy={line.y1}
                  r={handleR}
                  fill="#fff"
                  stroke={isSelected ? "#1976d2" : STROKE}
                  strokeWidth={unit}
                  style={{ cursor: "crosshair" }}
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    if (interactive) onSelectElement(el.id);
                    onElementPointerDown(ev, el, "a");
                  }}
                />
                <circle
                  cx={line.x2}
                  cy={line.y2}
                  r={handleR}
                  fill="#fff"
                  stroke={isSelected ? "#1976d2" : STROKE}
                  strokeWidth={unit}
                  style={{ cursor: "crosshair" }}
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    if (interactive) onSelectElement(el.id);
                    onElementPointerDown(ev, el, "b");
                  }}
                />
              </>
            )}
          </g>
        );
      })}

      {/* Simbolos de apertura */}
      {hinges.map((el) => {
        const panel = panels.find((p) => p.index === el.panel) || panels[0];
        const h = computeHinge(el, panel);
        if (!h) return null;
        return (
          <g
            key={el.id}
            {...groupProps(el)}
            stroke={el.id === selectedId ? "#1976d2" : STROKE}
            fill="none"
            strokeWidth={unit}
          >
            <line x1={h.pivot.x} y1={h.pivot.y} x2={h.p1.x} y2={h.p1.y} />
            <line x1={h.pivot.x} y1={h.pivot.y} x2={h.p2.x} y2={h.p2.y} />
            <path d={h.path} strokeDasharray={`${unit * 3} ${unit * 2}`} />
          </g>
        );
      })}
      </g>

      {/* Marco: banda entre el contorno exterior (rect o arco) y el claro interior */}
      <path d={outerPath} fill="none" stroke={STROKE} strokeWidth={unit * 2} />
      <path d={innerPath} fill="none" stroke={STROKE} strokeWidth={unit * 2} />

      {/* Flechas (mas cortas, gruesas y rotables) */}
      {arrows.map((el) => (
        <line
          key={el.id}
          x1={el.x1 * W}
          y1={el.y1 * H}
          x2={el.x2 * W}
          y2={el.y2 * H}
          stroke={el.id === selectedId ? "#1976d2" : STROKE}
          strokeWidth={unit * 2.6}
          strokeLinecap="round"
          markerEnd={`url(#${markerId})`}
          {...groupProps(el)}
        />
      ))}

      {/* Texto (soporta varias lineas, interlineado y ancho de cuadro) */}
      {texts.map((el) => {
        const size = el.size;
        const boxW = (el.boxWidth || 0) * W;
        // Los textos "en vivo" toman el valor de las medidas reales actuales.
        const rawLines = resolveTextValue(el, W, H).split("\n");
        const lines = [];
        rawLines.forEach((seg) => {
          if (!boxW || boxW <= 0) {
            lines.push(seg);
            return;
          }
          const words = seg.split(/\s+/);
          let cur = "";
          words.forEach((w) => {
            const test = cur ? `${cur} ${w}` : w;
            if (test.length * size * 0.62 > boxW && cur) {
              lines.push(cur);
              cur = w;
            } else {
              cur = test;
            }
          });
          lines.push(cur);
        });
        const lineGap = el.lineGap || 1.3;
        return (
          <text
            key={el.id}
            x={el.x * W}
            y={el.y * H}
            fontSize={size}
            fill={el.id === selectedId ? "#1976d2" : STROKE}
            fontFamily="sans-serif"
            {...groupProps(el)}
          >
            {lines.map((ln, i) => (
              <tspan key={i} x={el.x * W} dy={i === 0 ? 0 : size * lineGap}>
                {ln || " "}
              </tspan>
            ))}
          </text>
        );
      })}

      {/* Cotas libres: van de un punto a otro, con valor, tamano y posicion editables */}
      {activeDimensions.map((el) => {
        const size = el.size > 0 ? el.size : Math.max(4, margin * 0.34);
        const ax = el.x1 * W;
        const ay = el.y1 * H;
        const bx = el.x2 * W;
        const by = el.y2 * H;
        const dx = bx - ax;
        const dy = by - ay;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        // Normal perpendicular para las marcas de extremo
        const nx = -uy;
        const ny = ux;
        const tick = Math.max(margin * 0.07, size * 0.5);
        const head = Math.max(tick * 1.2, 3);
        const label = dimensionLabel(
          resolveDimensionValue(el, cotaDistanceCm(el, W, H), valueOverrides)
        );
        const isSelected = el.id === selectedId;
        const color = isSelected ? "#1976d2" : COTA;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle > 90 || angle < -90) angle += 180; // mantener el texto legible
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const textOff = size * 0.9;
        return (
          <g key={el.id} stroke={color} fill={color} strokeWidth={unit} {...groupProps(el)}>
            <line x1={ax} y1={ay} x2={bx} y2={by} />
            {/* Marcas de extremo */}
            <line x1={ax + nx * tick} y1={ay + ny * tick} x2={ax - nx * tick} y2={ay - ny * tick} />
            <line x1={bx + nx * tick} y1={by + ny * tick} x2={bx - nx * tick} y2={by - ny * tick} />
            {/* Puntas de flecha en ambos extremos */}
            <path
              d={`M ${ax + ux * head} ${ay + uy * head} L ${ax + nx * head * 0.5} ${ay + ny * head * 0.5} L ${ax - nx * head * 0.5} ${ay - ny * head * 0.5} Z`}
              stroke="none"
            />
            <path
              d={`M ${bx - ux * head} ${by - uy * head} L ${bx + nx * head * 0.5} ${by + ny * head * 0.5} L ${bx - nx * head * 0.5} ${by - ny * head * 0.5} Z`}
              stroke="none"
            />
            {/* Zona de agarre */}
            <line x1={ax} y1={ay} x2={bx} y2={by} stroke="transparent" strokeWidth={Math.max(len * 0.06, 6)} />
            {draggable && (
              <>
                <circle
                  cx={ax}
                  cy={ay}
                  r={Math.max(margin * 0.06, 2.5)}
                  fill="#fff"
                  stroke={color}
                  strokeWidth={unit}
                  style={{ cursor: "crosshair" }}
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    if (interactive) onSelectElement(el.id);
                    onElementPointerDown(ev, el, "a");
                  }}
                />
                <circle
                  cx={bx}
                  cy={by}
                  r={Math.max(margin * 0.06, 2.5)}
                  fill="#fff"
                  stroke={color}
                  strokeWidth={unit}
                  style={{ cursor: "crosshair" }}
                  onPointerDown={(ev) => {
                    ev.stopPropagation();
                    ev.preventDefault();
                    if (interactive) onSelectElement(el.id);
                    onElementPointerDown(ev, el, "b");
                  }}
                />
              </>
            )}
            <text
              x={mx + nx * textOff}
              y={my + ny * textOff}
              fontSize={size}
              textAnchor="middle"
              stroke="none"
              transform={`rotate(${angle} ${mx + nx * textOff} ${my + ny * textOff})`}
              {...labelProps(el)}
            >
              {label}
            </text>
          </g>
        );
      })}

      {/* Cotas automaticas cuando el dibujo no tiene ninguna definida */}
      {autoHCota && (
        <g stroke={COTA} fill={COTA} strokeWidth={unit}>
          <line x1={0} y1={H + margin * 0.35} x2={W} y2={H + margin * 0.35} />
          <line x1={0} y1={H + margin * 0.28} x2={0} y2={H + margin * 0.42} />
          <line x1={W} y1={H + margin * 0.28} x2={W} y2={H + margin * 0.42} />
          <text
            x={W / 2}
            y={H + margin * 0.28}
            fontSize={Math.max(4, margin * 0.32)}
            textAnchor="middle"
            stroke="none"
          >
            {dimensionLabel(resolveDimensionValue({ id: "__auto_h" }, W, valueOverrides))}
          </text>
        </g>
      )}
      {autoVCota && (
        <g stroke={COTA} fill={COTA} strokeWidth={unit}>
          <line x1={-margin * 0.35} y1={0} x2={-margin * 0.35} y2={H} />
          <line x1={-margin * 0.42} y1={0} x2={-margin * 0.28} y2={0} />
          <line x1={-margin * 0.42} y1={H} x2={-margin * 0.28} y2={H} />
          <text
            x={-margin * 0.45}
            y={H / 2}
            fontSize={Math.max(4, margin * 0.32)}
            textAnchor="middle"
            stroke="none"
            transform={`rotate(-90 ${-margin * 0.45} ${H / 2})`}
          >
            {dimensionLabel(resolveDimensionValue({ id: "__auto_v" }, H, valueOverrides))}
          </text>
        </g>
      )}

      {/* Marcador del primer punto al crear una cota de 2 puntos */}
      {pendingPoint && (
        <g stroke="#1976d2" fill="none" strokeWidth={unit * 1.5}>
          <circle cx={pendingPoint.x} cy={pendingPoint.y} r={Math.max(margin * 0.08, 2)} />
          <line
            x1={pendingPoint.x - margin * 0.12}
            y1={pendingPoint.y}
            x2={pendingPoint.x + margin * 0.12}
            y2={pendingPoint.y}
          />
          <line
            x1={pendingPoint.x}
            y1={pendingPoint.y - margin * 0.12}
            x2={pendingPoint.x}
            y2={pendingPoint.y + margin * 0.12}
          />
        </g>
      )}

      {/* Insignias de opciones (esquina superior derecha): VISTA y ABRE */}
      {showDimensions && (() => {
        const label = (kind, value) => {
          if (value === "none") return null;
          const side = value === "outside" ? "FUERA" : "DENTRO";
          return `${kind}: ${side}`;
        };
        const lines = [
          label("VISTA", d.viewSide),
          label("ABRE", d.opensTo),
        ].filter(Boolean);
        if (lines.length === 0) return null;
        const fs = Math.max(4, margin * 0.3);
        return (
          <g
            fontSize={fs}
            fontFamily="sans-serif"
            fontWeight="bold"
            textAnchor="end"
            fill={STROKE}
            stroke="#ffffff"
            strokeWidth={Math.max(margin * 0.08, 1)}
            strokeLinejoin="round"
            paintOrder="stroke"
            pointerEvents="none"
          >
            {lines.map((text, i) => (
              <text key={text} x={W} y={-margin * (0.62 - i * 0.36)}>
                {text}
              </text>
            ))}
          </g>
        );
      })()}
    </svg>
  );
}
