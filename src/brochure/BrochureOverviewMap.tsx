import React from "react";
import { Path, Rect, Svg, Text, View } from "@react-pdf/renderer";

import type { BrochureMapRoute, BrochureOverviewMap as OverviewMap } from "./model.js";
import { BROCHURE_COLOR as C } from "./theme.js";

const WIDTH = 720;
const HEIGHT = 360;
const PAD_X = 76;
const PAD_Y = 42;
const MAX_KEY_STOPS = 7;

type Point = { x: number; y: number };

const routeStyle = (mode: BrochureMapRoute["mode"]) => {
  if (mode === "walking") return { color: C.secondary, dash: "3 6", label: "Trek" };
  if (mode === "air") return { color: C.violet, dash: "9 7", label: "Flight" };
  if (mode === "driving") return { color: C.primary, dash: undefined, label: "Drive" };
  return { color: C.muted, dash: "3 5", label: "Route" };
};

const keyStops = <T extends { sequence: number }>(stops: T[]): T[] => {
  if (stops.length <= MAX_KEY_STOPS) return stops;
  const selected = new Set<number>();
  for (let index = 0; index < MAX_KEY_STOPS; index += 1) {
    selected.add(Math.round((index * (stops.length - 1)) / (MAX_KEY_STOPS - 1)));
  }
  return stops.filter((_, index) => selected.has(index));
};

type LabelBox = { left: number; top: number; width: number; height: number };
const overlaps = (a: LabelBox, b: LabelBox) =>
  a.left < b.left + b.width && a.left + a.width > b.left && a.top < b.top + b.height && a.top + a.height > b.top;

const labelCandidates = (point: Point): LabelBox[] => [
  { left: point.x + 12, top: point.y - 25, width: 116, height: 24 },
  { left: point.x - 128, top: point.y - 25, width: 116, height: 24 },
  { left: point.x + 12, top: point.y + 11, width: 116, height: 24 },
  { left: point.x - 128, top: point.y + 11, width: 116, height: 24 },
].map((box) => ({
  ...box,
  left: Math.min(WIDTH - box.width - 8, Math.max(8, box.left)),
  top: Math.min(HEIGHT - box.height - 8, Math.max(4, box.top)),
}));

const shortName = (name: string) => name.length > 22 ? `${name.slice(0, 20).trim()}…` : name;

/**
 * A data-only map for PDFs. It deliberately does not use web tiles: brochure
 * generation remains private, deterministic, fast, and free from map-token or
 * tile-attribution concerns. Coordinates retain their north-up geography.
 */
export const BrochureOverviewMap = ({ map }: { map: OverviewMap }) => {
  const all = [...map.stops.map((stop) => [stop.lat, stop.lng] as const), ...map.routes.flatMap((route) => route.coordinates)];
  const minLat = Math.min(...all.map(([lat]) => lat));
  const maxLat = Math.max(...all.map(([lat]) => lat));
  const minLng = Math.min(...all.map(([, lng]) => lng));
  const maxLng = Math.max(...all.map(([, lng]) => lng));
  const midLat = (minLat + maxLat) / 2;
  // Longitude is shortened at higher latitudes so the map keeps real bearings.
  const lngScale = Math.max(0.15, Math.cos((midLat * Math.PI) / 180));
  const spanX = Math.max(0.0001, (maxLng - minLng) * lngScale);
  const spanY = Math.max(0.0001, maxLat - minLat);
  const usableWidth = WIDTH - PAD_X * 2;
  const usableHeight = HEIGHT - PAD_Y * 2;
  const scale = Math.min(usableWidth / spanX, usableHeight / spanY);
  const contentWidth = spanX * scale;
  const contentHeight = spanY * scale;
  const offsetX = (WIDTH - contentWidth) / 2;
  const offsetY = (HEIGHT - contentHeight) / 2;
  const project = ([lat, lng]: [number, number]): Point => ({
    x: offsetX + (lng - minLng) * lngScale * scale,
    y: offsetY + (maxLat - lat) * scale,
  });
  const routePath = (coordinates: Array<[number, number]>) =>
    coordinates.map((coordinate, index) => {
      const point = project(coordinate);
      return `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`;
    }).join(" ");
  const arrow = (coordinates: Array<[number, number]>) => {
    if (coordinates.length < 2) return null;
    const at = Math.max(1, Math.floor(coordinates.length * 0.58));
    const from = project(coordinates[at - 1]);
    const to = project(coordinates[Math.min(coordinates.length - 1, at)]);
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const size = 7;
    const left = [to.x - size * Math.cos(angle - 0.55), to.y - size * Math.sin(angle - 0.55)];
    const right = [to.x - size * Math.cos(angle + 0.55), to.y - size * Math.sin(angle + 0.55)];
    return `M${left[0]} ${left[1]} L${to.x} ${to.y} L${right[0]} ${right[1]}`;
  };
  const displayedStops = keyStops(map.stops);
  const occupied: LabelBox[] = [];
  const labels = displayedStops.flatMap((stop) => {
    const position = project([stop.lat, stop.lng]);
    const box = labelCandidates(position).find((candidate) => !occupied.some((used) => overlaps(candidate, used)));
    if (!box) return [];
    occupied.push(box);
    const endpoint = stop.sequence === 1 ? "START · " : stop.sequence === map.stops.length ? "END · " : "";
    return [{ stop, box, text: `${endpoint}${stop.sequence}. ${shortName(stop.name)}` }];
  });

  return (
    <View style={{ width: WIDTH, height: HEIGHT, position: "relative", borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: C.stroke, backgroundColor: "#F7FAFC" }}>
      <Svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: WIDTH, height: HEIGHT }}>
        <Rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="#F7FAFC" />
        {/* Subtle contour-like lines give a print-map feeling without claiming terrain accuracy. */}
        {[48, 108, 176, 242, 306].map((y, index) => (
          <Path key={y} d={`M0 ${y} C140 ${y - 25 + index * 4}, 330 ${y + 30}, ${WIDTH} ${y - 10}`} stroke="#DDE8E3" strokeWidth={1} fill="none" />
        ))}
        {map.routes.map((route, index) => {
          const style = routeStyle(route.mode);
          return (
            <React.Fragment key={index}>
              <Path d={routePath(route.coordinates)} stroke="#FFFFFF" strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              <Path d={routePath(route.coordinates)} stroke={style.color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={style.dash} />
              {arrow(route.coordinates) && <Path d={arrow(route.coordinates)!} stroke={style.color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />}
            </React.Fragment>
          );
        })}
        {displayedStops.map((stop) => {
          const point = project([stop.lat, stop.lng]);
          const first = stop.sequence === 1;
          const last = stop.sequence === map.stops.length;
          const color = first ? C.successDeep : last ? C.violet : C.primary;
          return (
            <React.Fragment key={`${stop.name}-${stop.sequence}`}>
              <Rect x={point.x - 9} y={point.y - 9} width={18} height={18} rx={9} ry={9} fill={C.white} stroke={color} strokeWidth={2.5} />
              <Rect x={point.x - 4.5} y={point.y - 4.5} width={9} height={9} rx={4.5} ry={4.5} fill={color} />
            </React.Fragment>
          );
        })}
        <Path d="M31 44 L39 20 L47 44 L39 38 Z" fill={C.violet} />
        <Text x={35} y={58} style={{ fontSize: 10, fontWeight: 700, color: C.violet }}>N</Text>
      </Svg>

      {labels.map(({ stop, box, text }) => {
        return <Text key={`${stop.name}-${stop.sequence}-label`} style={{ position: "absolute", width: box.width, left: box.left, top: box.top, fontSize: 9, lineHeight: 1.15, fontWeight: 600, color: C.text }}>{text}</Text>;
      })}

      <View style={{ position: "absolute", right: 14, bottom: 12, flexDirection: "row", gap: 10, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 5, backgroundColor: "rgba(255,255,255,0.92)" }}>
        {["driving", "walking", "air"].filter((mode) => map.routes.some((route) => route.mode === mode)).map((mode) => {
          const style = routeStyle(mode as BrochureMapRoute["mode"]);
          return <View key={mode} style={{ flexDirection: "row", gap: 4, alignItems: "center" }}><View style={{ width: 10, height: 3, backgroundColor: style.color }} /><Text style={{ fontSize: 8, color: C.text }}>{style.label}</Text></View>;
        })}
      </View>
      {map.stops.length > displayedStops.length && (
        <Text style={{ position: "absolute", left: 14, bottom: 14, fontSize: 8, color: C.muted }}>
          {`${displayedStops.length} key stops shown of ${map.stops.length}`}
        </Text>
      )}
    </View>
  );
};
