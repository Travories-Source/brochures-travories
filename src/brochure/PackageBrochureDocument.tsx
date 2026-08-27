/* eslint-disable jsx-a11y/alt-text -- @react-pdf's <Image> is not an <img>. */
import React from "react";
import { Document, Image, Link, Page, Path, Rect, Svg, Text, View } from "@react-pdf/renderer";

import { BROCHURE_ICONS, type BrochureIconName, type IconSpec } from "./iconPaths.js";
import { BrochureOverviewMap } from "./BrochureOverviewMap.js";
import type { BrochureDay, BrochureModel, BrochureService } from "./model.js";
import type { QrMatrix } from "./qr.js";
import { styles } from "./styles.js";
import {
  BROCHURE_COLOR as C,
  BROCHURE_CURRENCY,
  BROCHURE_PAGE,
  BROCHURE_PAGED_BODY_HEIGHT,
} from "./theme.js";

/** Travories wordmark, lifted from `components/Common/SiteLayout/Navbar/Logo.tsx`. */
const LOGO_VIEWBOX = "110 560 860 160";
const LOGO_PATHS = [
  "m243.76,680.4v20.8c-15.77,1.78-26.91.3-33.36-4.46-6.45-4.73-9.69-13.19-9.69-25.42v-2.9l22.94-17.56v20.46c0,3.11.76,5.35,2.31,6.78,1.52,1.42,3.77,2.21,6.74,2.38,2.98.2,6.65.17,11.04-.06",
  "m284.28,627.58c2.13-5.69,5.66-9.96,10.58-12.81,4.92-2.84,10.4-4.27,16.45-4.27v25.61c-7-.83-13.25.59-18.76,4.27-5.51,3.67-8.27,9.78-8.27,18.32v42.5h-22.94v-88.91h22.94v15.3Z",
  "m388.84,612.28h22.94v88.91h-22.94v-10.49c-6.87,8.65-16.54,12.98-28.98,12.98s-22.02-4.53-30.5-13.6c-8.48-9.07-12.72-20.18-12.72-33.34s4.24-24.27,12.72-33.34c8.47-9.07,18.64-13.6,30.5-13.6,12.45,0,22.11,4.33,28.98,12.98v-10.49Zm-42.32,62.51c4.62,4.68,10.49,7.02,17.6,7.02s13.01-2.34,17.7-7.02c4.68-4.68,7.02-10.7,7.02-18.05s-2.34-13.36-7.02-18.05c-4.68-4.68-10.58-7.03-17.7-7.03s-12.98,2.34-17.6,7.03c-4.62,4.68-6.94,10.7-6.94,18.05s2.31,13.37,6.94,18.05",
  "M491.09 612.28 L516.34 612.28 L482.55 701.19 L456.41 701.19 L422.62 612.28 L447.88 612.28 L469.43 674.51 Z",
  "m631.32,596.22c-12.23-12.14-27.14-18.19-44.73-18.19s-32.5,6.05-44.63,18.19c-12.14,12.13-18.22,27.01-18.22,44.63s6.08,32.47,18.22,44.6c12.13,12.17,27.01,18.22,44.63,18.22s32.5-6.05,44.73-18.22c12.2-12.13,18.32-26.98,18.32-44.6s-6.12-32.5-18.32-44.63m-21.66,68.17c-6.18,6.22-13.89,9.29-23.08,9.29s-16.86-3.07-22.98-9.29c-6.12-6.18-9.16-14.02-9.16-23.54s3.04-17.39,9.16-23.57c6.12-6.18,13.76-9.26,22.98-9.26s16.9,3.07,23.08,9.26c6.18,6.18,9.29,14.05,9.29,23.57s-3.11,17.36-9.29,23.54m7.24-54.42c-3.67,0-6.65-2.97-6.65-6.61s2.98-6.65,6.65-6.65,6.61,2.97,6.61,6.65-2.94,6.61-6.61,6.61",
  "m686.19,627.58c2.13-5.69,5.66-9.96,10.58-12.81,4.92-2.84,10.4-4.27,16.45-4.27v25.61c-7-.83-13.25.59-18.76,4.27-5.51,3.67-8.27,9.78-8.27,18.32v42.5h-22.94v-88.91h22.94v15.3Z",
  "m737.93,601.61c-3.79,0-7.08-1.39-9.87-4.18-2.79-2.78-4.18-6.08-4.18-9.87s1.39-7.11,4.18-9.96c2.78-2.84,6.07-4.27,9.87-4.27s7.26,1.42,10.05,4.27c2.78,2.84,4.18,6.17,4.18,9.96s-1.39,7.09-4.18,9.87c-2.79,2.78-6.13,4.18-10.05,4.18m-11.38,10.67h22.94v88.91h-22.94v-88.91Z",
  "m789.85,666.16c3.08,11.14,11.44,16.72,25.07,16.72,8.77,0,15.41-2.96,19.92-8.89l18.49,10.67c-8.77,12.69-21.69,19.03-38.77,19.03-14.7,0-26.49-4.45-35.39-13.34-8.89-8.89-13.34-20.09-13.34-33.61s4.38-24.57,13.16-33.52c8.77-8.95,20.03-13.43,33.79-13.43,13.04,0,23.79,4.51,32.27,13.52,8.48,9.01,12.72,20.15,12.72,33.43,0,2.96-.3,6.11-.89,9.43h-67.04Zm-.35-17.79h45.35c-1.3-6.04-4-10.55-8.09-13.51-4.09-2.96-8.74-4.44-13.96-4.44-6.17,0-11.27,1.57-15.29,4.71-4.03,3.14-6.7,7.56-8,13.25",
  "m891.39,637.53c0,2.37,1.57,4.3,4.71,5.78,3.14,1.48,6.96,2.79,11.47,3.91,4.5,1.13,9.01,2.55,13.52,4.27,4.5,1.72,8.33,4.59,11.47,8.62,3.14,4.03,4.71,9.07,4.71,15.12,0,9.13-3.41,16.16-10.22,21.07-6.82,4.92-15.32,7.38-25.52,7.38-18.26,0-30.7-7.05-37.34-21.16l19.91-11.2c2.61,7.71,8.42,11.56,17.43,11.56,8.18,0,12.27-2.55,12.27-7.65,0-2.37-1.57-4.29-4.71-5.78-3.14-1.48-6.96-2.82-11.47-4-4.51-1.18-9.01-2.67-13.52-4.44-4.51-1.78-8.33-4.59-11.47-8.45-3.14-3.85-4.71-8.69-4.71-14.5,0-8.77,3.23-15.68,9.69-20.71,6.46-5.04,14.49-7.56,24.09-7.56,7.23,0,13.81,1.63,19.74,4.89,5.92,3.26,10.61,7.91,14.05,13.96l-19.56,10.67c-2.84-6.04-7.59-9.07-14.23-9.07-2.96,0-5.42.65-7.38,1.96-1.96,1.3-2.93,3.08-2.93,5.33",
  "m610.26,642.45h-8.97c0-8.91-7.25-16.16-16.16-16.16v-8.97c13.86,0,25.13,11.27,25.13,25.13",
  "m588.25,664.38c-13.86,0-25.13-11.27-25.13-25.13h8.97c0,8.91,7.25,16.16,16.16,16.16v8.97Z",
  "M163.58 644.11 L251.04 622.99 L165.14 688.7 L190.18 652.43 Z",
  "M219.01 589.25 L219.01 626.66 L196.08 632.19 L196.08 606.77 L218.96 589.28 Z",
];


/**
 * Just the Travories glyph from the wordmark above (the last two shapes), for
 * the QR centre where the full lockup would be illegible.
 */
const LOGO_MARK_VIEWBOX = "160 585 95 108";
const LOGO_MARK_PATHS = [LOGO_PATHS[11], LOGO_PATHS[12]];

const CONTACT = {
  email: "sales@travories.com",
  phone: "+977-9805151985",
  website: "www.travories.com",
} as const;

const money = (amount: number): string =>
  `${BROCHURE_CURRENCY.symbol}${Number(amount || 0).toLocaleString(BROCHURE_CURRENCY.locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

/* ── Primitives ───────────────────────────────────────────────────────── */

interface DocProps {
  model: BrochureModel;
  /** url -> data URL. Anything missing renders as a neutral placeholder. */
  images: Record<string, string>;
  /**
   * Page height in points, sized so the whole brochure is one continuous page.
   * `fitToOnePage` solves for this.
   */
  height: number;
  /** QR matrix for `packageUrl`. Omitted when the package has no public page. */
  qr?: QrMatrix | null;
  /** Public package URL the QR points at, also used as the QR's link target. */
  packageUrl?: string | null;
  /**
   * Break the brochure into A4-proportioned pages instead of one tall page.
   *
   * Every block that reads as a unit — a day, a service card, the gallery, the
   * footer — then carries `wrap={false}`, so a block that will not fit in the
   * remaining space moves to the next page whole rather than being sliced
   * across the boundary.
   */
  paged?: boolean;
}

const Icon = ({ name, size, color }: { name: BrochureIconName; size: number; color?: string }) => {
  // Widen away the per-icon literal types so the shared path fields are visible.
  const icon: IconSpec = BROCHURE_ICONS[name];
  return (
    <Svg viewBox={icon.viewBox} style={{ width: size, height: size }}>
      {icon.paths.map((path, index) => (
        <Path
          key={index}
          d={path.d}
          fill={path.fill ? color ?? path.fill : "none"}
          stroke={path.stroke ? color ?? path.stroke : undefined}
          strokeWidth={path.strokeWidth}
          strokeLinecap={path.strokeLinecap}
          strokeLinejoin={path.strokeLinejoin}
          fillRule={path.fillRule}
        />
      ))}
    </Svg>
  );
};

const Picture = ({
  src,
  style,
  images,
}: {
  src: string | null | undefined;
  style: any;
  images: Record<string, string>;
}) => {
  const data = src ? images[src] : undefined;
  // A placeholder keeps the grid intact when a photo is missing or 404s.
  if (!data) return <View style={[style, { backgroundColor: C.stroke }]} />;
  return <Image src={data} style={style} />;
};

/**
 * The Figma title is a left-to-right gradient fill. @react-pdf cannot paint a
 * gradient into glyphs, so the run is split and each piece gets its
 * interpolated colour. Nested <Text> children are laid out as a single
 * attributed string, so shaping and kerning survive the split.
 *
 * The split is per *word*, not per character, because @react-pdf offers a line
 * break at every run boundary: splitting per character let it break inside a
 * word and draw a hyphen there ("Base Cam-/p Journey"), which no hyphenation
 * setting suppresses — `registerHyphenationCallback` never sees a whole word to
 * refuse. Per-word runs give the line breaker the same break opportunities as
 * undivided text, and the gradient is indistinguishable at title size.
 */
const GradientText = ({
  value,
  style,
  from,
  to,
  start = 0.3955,
  end = 0.78478,
}: {
  value: string;
  style: any;
  from: string;
  to: string;
  start?: number;
  end?: number;
}) => {
  const channels = (hex: string) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
  const [r1, g1, b1] = channels(from);
  const [r2, g2, b2] = channels(to);

  // Whitespace is kept as its own token so the reassembled string is identical
  // to `value` — the gaps have no glyphs to colour anyway.
  const tokens = value.split(/(\s+)/).filter(Boolean);
  const span = Math.max(1, value.length);
  let consumed = 0;

  return (
    <Text style={style}>
      {tokens.map((token, index) => {
        // Colour the whole word by where its middle sits in the line, so the
        // ramp stays centred on the same glyphs as a per-character split.
        const position = (consumed + token.length / 2) / span;
        consumed += token.length;

        const t = Math.min(1, Math.max(0, (position - start) / (end - start)));
        const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
        return (
          <Text key={index} style={{ color: `rgb(${mix(r1, r2)}, ${mix(g1, g2)}, ${mix(b1, b2)})` }}>
            {token}
          </Text>
        );
      })}
    </Text>
  );
};


/**
 * Brand-coloured QR with the Travories mark knocked out of the centre.
 *
 * Rendered as vector rects rather than a rasterised image so it stays crisp at
 * any print size. Modules are plain squares on purpose: rounded or "dotted"
 * styling looks nicer on screen but costs scan reliability on paper, at angles
 * and in poor light, which is exactly where this code has to work.
 *
 * The centre knockout is safe because `buildQrMatrix` encodes at error
 * correction level H — see the note there.
 */
/**
 * lucide "external-link", the same source as the `travellers` and `arrival`
 * icons in iconPaths.ts. Kept local because it belongs to the QR block rather
 * than to the Figma icon set.
 */
const EXTERNAL_LINK = {
  viewBox: "0 0 24 24",
  paths: ["M15 3h6v6", "M10 14 21 3", "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"],
};

const QR_SIZE = BROCHURE_PAGE.qrSize;
const QR_QUIET_MODULES = 2;
/** Logo box as a fraction of the symbol. Level H tolerates ~30%. */
const QR_LOGO_RATIO = 0.24;

const QrCode = ({ matrix, url }: { matrix: QrMatrix; url: string }) => {
  const span = matrix.size + QR_QUIET_MODULES * 2;
  const module = QR_SIZE / span;

  const logoBox = Math.round(QR_SIZE * QR_LOGO_RATIO);
  const logoOffset = (QR_SIZE - logoBox) / 2;
  const markPad = logoBox * 0.2;

  return (
    <Link src={url} style={styles.qrBlock}>
      <View>
        <Svg viewBox={`0 0 ${QR_SIZE} ${QR_SIZE}`} style={{ width: QR_SIZE, height: QR_SIZE }}>
          <Rect x={0} y={0} width={QR_SIZE} height={QR_SIZE} fill={C.white} />
          {matrix.dark.map((isDark, index) => {
            if (!isDark) return null;
            const row = Math.floor(index / matrix.size);
            const column = index % matrix.size;
            return (
              <Rect
                key={index}
                x={(column + QR_QUIET_MODULES) * module}
                y={(row + QR_QUIET_MODULES) * module}
                width={module}
                height={module}
                fill={C.violet}
              />
            );
          })}
          <Rect
            x={logoOffset}
            y={logoOffset}
            width={logoBox}
            height={logoBox}
            rx={logoBox * 0.22}
            ry={logoBox * 0.22}
            fill={C.white}
          />
        </Svg>

        <View style={{ position: "absolute", top: logoOffset + markPad, left: logoOffset + markPad }}>
          <Svg
            viewBox={LOGO_MARK_VIEWBOX}
            style={{ width: logoBox - markPad * 2, height: logoBox - markPad * 2 }}
          >
            {LOGO_MARK_PATHS.map((d, index) => (
              <Path key={index} d={d} fill={C.violet} />
            ))}
          </Svg>
        </View>
      </View>
      <Text style={styles.qrCaption}>Scan to view package</Text>

      {/*
       * A QR is no use to someone reading this on the phone in their hand, and
       * the whole block is already the link target — they just have no way to
       * know that. This line says so.
       */}
      <View style={styles.qrAction}>
        <Text style={styles.qrActionLabel}>or tap to open</Text>
        <Svg viewBox={EXTERNAL_LINK.viewBox} style={{ width: 9, height: 9 }}>
          {EXTERNAL_LINK.paths.map((d, index) => (
            <Path
              key={index}
              d={d}
              stroke={C.secondary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          ))}
        </Svg>
      </View>
    </Link>
  );
};

const Section = ({
  heading,
  children,
  paged,
  solid,
}: {
  heading: string;
  children: React.ReactNode;
  paged?: boolean;
  /**
   * Move the whole section rather than let it break. For sections that are
   * short by nature — a paragraph of overview, a row of price cards — this is
   * what stops the heading being stranded alone at the foot of a page with its
   * content on the next one.
   *
   * `minPresenceAhead` on the heading cannot do this: @react-pdf only breaks
   * an element that has a previous sibling to break away from, and a heading
   * is the first thing in its section.
   */
  solid?: boolean;
}) => (
  <View wrap={!paged || !solid}>
    <Text style={styles.sectionHeading}>{heading}</Text>
    {children}
  </View>
);

/* ── Sections ─────────────────────────────────────────────────────────── */

const Header = ({ model, hasQr }: { model: BrochureModel; hasQr: boolean }) => (
  <View style={styles.header}>
    <View style={styles.brandRow}>
      <Svg viewBox={LOGO_VIEWBOX} style={{ width: 172, height: 32 }}>
        {LOGO_PATHS.map((d, index) => (
          <Path key={index} d={d} fill={C.violet} />
        ))}
      </Svg>
    </View>

    <View style={hasQr ? [styles.titleBlock, styles.titleBlockWithQr] : styles.titleBlock}>
      <GradientText
        value={model.title}
        from={C.violet}
        to={C.secondary}
        style={{
          fontFamily: "BricolageGrotesqueBrochure",
          fontSize: 46,
          fontWeight: 600,
          letterSpacing: -1.84,
          textAlign: "center",
        }}
      />
      <Text style={styles.subtitle}>{model.subtitle}</Text>

      {model.pricePerPerson != null && (
        <View style={styles.pricePill}>
          <Text style={styles.pricePillLabel}>PRICE :</Text>
          <Text style={styles.pricePillLabel}>{money(model.pricePerPerson)}</Text>
          <Text style={styles.pricePillUnit}>per person</Text>
        </View>
      )}
    </View>
  </View>
);

const Gallery = ({ model, images, paged }: Pick<DocProps, "model" | "images" | "paged">) => {
  if (model.gallery.length === 0) return null;
  const shared = { images };
  return (
    <View style={styles.gallery} wrap={!paged}>
      <Picture src={model.gallery[0]} style={styles.galleryTall} {...shared} />
      <View style={styles.galleryColumn}>
        <Picture src={model.gallery[1]} style={styles.galleryShort} {...shared} />
        <Picture src={model.gallery[2]} style={styles.galleryShort} {...shared} />
      </View>
      <Picture src={model.gallery[3]} style={styles.galleryTall} {...shared} />
    </View>
  );
};

const KeyFacts = ({ model, images, paged }: Pick<DocProps, "model" | "images" | "paged">) => {
  // The design has four fixed rows; a personalised brochure adds the party and
  // arrival date, which have no slot of their own but belong with the facts.
  const facts = [
    ...model.facts,
    ...(model.travellers ? [{ icon: "travellers" as const, label: "Travellers", value: model.travellers }] : []),
    ...(model.arrival ? [{ icon: "arrival" as const, label: "Arrival Date", value: model.arrival }] : []),
  ];

  return (
  <View style={styles.keyFacts} wrap={!paged}>
    <View>
      <Text style={styles.sectionHeading}>Key Facts</Text>
      <View style={styles.keyFactsColumns}>
        <View style={styles.keyFactsLabels}>
          {facts.map((fact) => (
            <View key={fact.label} style={styles.keyFactRow}>
              <View style={styles.keyFactIconBox}>
                <Icon name={fact.icon} size={fact.icon === "suitcase" ? 19 : fact.icon === "calendar" ? 18 : 22} />
              </View>
              <Text style={styles.keyFactLabel}>{fact.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.keyFactsValues}>
          {facts.map((fact) => (
            <Text key={fact.label} style={styles.keyFactValue}>
              {fact.value}
            </Text>
          ))}
        </View>
      </View>
    </View>
    <Picture src={model.featureImage} style={styles.keyFactsImage} images={images} />
  </View>
  );
};

const TripRouteMap = ({ model, paged }: Pick<DocProps, "model" | "paged">) => {
  if (!model.overviewMap) return null;
  return (
    <Section heading="Trip Route Overview" paged={paged} solid>
      <View style={styles.overviewMapWrap}>
        <BrochureOverviewMap map={model.overviewMap} />
      </View>
      <Text style={styles.overviewMapCaption}>
        Route direction and stops are generated automatically from this package itinerary.
      </Text>
    </Section>
  );
};

const DayCard = ({
  day,
  paged,
  heading,
}: {
  day: BrochureDay;
  paged?: boolean;
  /**
   * Rendered inside this block when set, so the section heading travels with
   * the first day instead of being stranded at the foot of the previous page.
   */
  heading?: string;
}) => (
  <View style={styles.day} wrap={!paged}>
    {!!heading && (
      <Text style={[styles.sectionHeading, styles.sectionHeadingInList]}>{heading}</Text>
    )}
    <View style={styles.dayHeader}>
      <Text style={styles.dayIndex}>{day.index}</Text>
      <View style={styles.dayTitleBox}>
        <Text style={styles.dayTitle}>{day.title}</Text>
      </View>
      <Text style={styles.dayDuration}>Duration : {day.duration}</Text>
    </View>

    <View style={styles.dayCard}>
      <View style={styles.dayColumns}>
        <View style={styles.dayColumn}>
      {day.description.length > 0 && (
        <View style={styles.dayBlock}>
          <Text style={styles.dayBlockLabel}>Description</Text>
          <View style={{ gap: 8 }}>
            {day.description.map((paragraph, index) => (
              <Text key={index} style={styles.dayCopy}>
                {paragraph}
              </Text>
            ))}
          </View>
        </View>
      )}

      <View style={styles.dayBlock}>
        <Text style={styles.dayBlockLabel}>Key Facts</Text>
        <View style={styles.dayMetaRow}>
          <View style={styles.dayMetaItem}>
            <Icon name="bed" size={24} />
            <Text style={styles.dayMetaText}>{day.accommodation}</Text>
          </View>
          <View style={styles.separatorDot} />
          <View style={styles.dayMetaItem}>
            <Icon name="bus" size={24} />
            <Text style={styles.dayMetaText}>{day.transport}</Text>
          </View>
          <View style={styles.separatorDot} />
          <View style={[styles.dayMetaItem, { gap: 16 }]}>
            <View style={styles.meterTrack}>
              <View style={[styles.meterFill, { width: 140 * day.difficultyFill }]} />
            </View>
            <Text style={styles.dayMetaText}>{day.difficulty}</Text>
          </View>
        </View>
      </View>

        </View>

        <View style={styles.dayColumn}>
      {day.stops.length > 0 && (
        <View style={styles.dayBlock}>
          <Text style={styles.dayBlockLabel}>Stops in a Day</Text>
          <View>
            {day.stops.map((stop, index) => (
              <View key={`${stop}-${index}`} style={styles.stopRow}>
                <View style={styles.stopGutter}>
                  <View style={styles.stopOrdinalBox}>
                    <Text style={styles.stopOrdinal}>Stop {index + 1}</Text>
                  </View>
                  <View style={styles.stopMarkerColumn}>
                    <View style={styles.stopMarker} />
                    {/* The line joins one stop to the next, so the last has none. */}
                    {index < day.stops.length - 1 && <View style={styles.stopConnector} />}
                  </View>
                </View>
                <View style={styles.stopLabelBox}>
                  <Text style={styles.stopLabel}>{stop}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {day.activities.length > 0 && (
        <View style={styles.chipRow}>
          {day.activities.map((activity, index) => (
            <View key={`${activity}-${index}`} style={styles.chip}>
              <Text style={styles.chipText}>{activity}</Text>
            </View>
          ))}
        </View>
      )}
        </View>
      </View>
    </View>
  </View>
);

const AddOns = ({ model, images }: Pick<DocProps, "model" | "images">) => (
  <Section heading="Optional Add-Ons">
    <View style={styles.addonList}>
      {model.addons.map((addon, index) => (
        <View key={`${addon.name}-${index}`} style={styles.addon}>
          <View style={styles.addonThumbBox}>
            {addon.image && images[addon.image] && (
              <Image src={images[addon.image]} style={styles.addonThumbImage} />
            )}
          </View>
          <View style={styles.addonBody}>
            <View style={styles.addonCopy}>
              <Text style={styles.addonName}>{addon.name}</Text>
              {!!addon.description && <Text style={styles.addonDescription}>{addon.description}</Text>}
            </View>
            <View style={styles.addonPriceBox}>
              <Text style={styles.addonPrice}>
                {money(addon.amount)} <Text style={styles.addonPriceUnit}>{addon.unit}</Text>
              </Text>
              <Text style={styles.addonNote}>includes taxes and charges</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  </Section>
);

/**
 * Rough height of a service block, in points.
 *
 * Only accurate enough to answer one question: can this block move to the next
 * page whole, or must it be allowed to split? Deliberately pessimistic — a
 * character count per line rather than real measurement — because the cost of
 * over-estimating is a page break we did not need, and the cost of
 * under-estimating is content pushed off the bottom of the sheet.
 */
const SERVICE_CHARS_PER_LINE = 58;
const SERVICE_CARD_CHROME = 48 + 28;
const SERVICE_BLOCK_CHROME = 75 + 20 + 64;

const estimateServiceBlockHeight = (service: BrochureService): number => {
  const rows: number[] = [];
  for (let index = 0; index < service.groups.length; index += 2) {
    const heights = service.groups.slice(index, index + 2).map(
      (group) =>
        SERVICE_CARD_CHROME +
        group.items.reduce(
          (sum, item) => sum + 28 * Math.max(1, Math.ceil(item.length / SERVICE_CHARS_PER_LINE)),
          0,
        ),
    );
    rows.push(Math.max(...heights));
  }
  return (
    SERVICE_BLOCK_CHROME +
    rows.reduce((sum, height) => sum + height, 0) +
    SERVICE_CARD_GAP_ESTIMATE * Math.max(0, rows.length - 1)
  );
};
const SERVICE_CARD_GAP_ESTIMATE = 16;

const ServiceBlock = ({
  service,
  paged,
  first,
  heading,
}: {
  service: BrochureService;
  paged?: boolean;
  first?: boolean;
  /** Section heading, rendered inside the first block so it travels with it. */
  heading?: string;
}) => {
  // Pairs, so each row is a block that can be kept whole across a page break.
  // A pessimistic estimate decides how this block is allowed to break; see
  // estimateServiceBlockHeight.
  const fitsOnePage = estimateServiceBlockHeight(service) <= BROCHURE_PAGED_BODY_HEIGHT;

  const rows: BrochureService["groups"][] = [];
  for (let index = 0; index < service.groups.length; index += 2) {
    rows.push(service.groups.slice(index, index + 2));
  }

  return (
    /*
     * A block that fits inside one page is marked unbreakable, so it moves
     * whole rather than splitting; one that cannot is forced onto a fresh page
     * instead, which is load-bearing rather than cosmetic. When a panel began
     * with only a sliver of page left, @react-pdf stopped paginating it and
     * laid the remaining rows on top of each other at the foot of the sheet,
     * losing items outright — starting at the top gives it the most room.
     */
    <View
      style={styles.service}
      wrap={!paged || !fitsOnePage}
      break={paged && !fitsOnePage && !first}
    >
      {!!heading && (
        <Text style={[styles.sectionHeading, styles.sectionHeadingInList]}>{heading}</Text>
      )}
      <View>
        <Text style={[styles.serviceGhost, { color: service.ghostColor }]}>{service.ghost}</Text>
        <Text style={[styles.serviceLabel, { color: service.accentDeep }]}>{service.label}</Text>
      </View>
      <View style={styles.servicePanel}>
        <View style={styles.serviceCardRows}>
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.serviceCardRow} wrap={!paged}>
              {row.map((group, index) => (
                <View
                  key={`${group.category}-${index}`}
                  // A card with no partner spans the panel rather than leaving
                  // half a row blank — tidier, and shorter, since the wider
                  // text column wraps fewer lines.
                  style={row.length === 1 ? [styles.serviceCard, styles.serviceCardWide] : styles.serviceCard}
                >
                  {!!group.category && (
                    <Text style={[styles.serviceCardHeading, { color: service.accent }]}>{group.category}</Text>
                  )}
                  {group.items.map((item, itemIndex) => (
                    <View key={itemIndex} style={styles.serviceItem}>
                      <Text style={styles.serviceBullet}>•</Text>
                      <Text style={styles.serviceItemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const Footer = ({ agencyName, paged }: { agencyName: string; paged?: boolean }) => (
  <View style={styles.footer} wrap={!paged}>
    <View style={styles.footerInner}>
      <Text style={styles.footerTitle}>Experience Travel with Travories</Text>
      <Text style={styles.footerBody}>
        Travories connects travelers with trusted local experts to deliver safe, transparent, and authentic travel
        experiences across Nepal.
      </Text>
      <View style={styles.footerContacts}>
        <Link src={`mailto:${CONTACT.email}`} style={styles.footerContact}>
          <Icon name="mail" size={26} color={C.footerText} />
          <Text style={styles.footerContactText}>{CONTACT.email}</Text>
        </Link>
        <View style={styles.footerContactDot} />
        <Link src={`tel:${CONTACT.phone.replace(/[^+\d]/g, "")}`} style={styles.footerContact}>
          <Icon name="phone" size={26} color={C.footerText} />
          <Text style={styles.footerContactText}>{CONTACT.phone}</Text>
        </Link>
        <View style={styles.footerContactDot} />
        <Link src={`https://${CONTACT.website}`} style={styles.footerContact}>
          <Icon name="web" size={26} color={C.footerText} />
          <Text style={styles.footerContactText}>{CONTACT.website}</Text>
        </Link>
      </View>
      <Text style={styles.footerTagline}>Travel smarter. Travel safer. Travel with trust.</Text>
      {!!agencyName && <Text style={styles.footerHostedBy}>Hosted by {agencyName}</Text>}
    </View>
  </View>
);

/* ── Document ─────────────────────────────────────────────────────────── */

export function PackageBrochureDocument({ model, images, height, qr, packageUrl, paged }: DocProps) {
  const shared = { model, images };

  // Two modes. With a party, the cards are that party's priced breakdown; with
  // none, they are the package's group-size brackets — the same information the
  // booking page shows before anyone picks traveller counts.
  //
  // A package with no fare on record still gets a Pricing section: silently
  // dropping it makes the brochure look broken, whereas "On request" is simply
  // true. That is about the *package* having no fare — a $0 line for a
  // free-travelling infant is a real price and prints as $0.
  const hasFare = model.quote
    ? model.quote.pricePerPerson > 0
    : model.tiers.some((tier) => tier.pricePerPerson > 0);
  const fare = (amount: number) => (hasFare ? money(amount) : "On request");

  const pricingCards = model.quote
    ? [
        ...model.quote.lines.map((line) => ({
          label: line.note ? `${line.label} (${line.note})` : line.label,
          value: fare(line.amount),
        })),
        {
          label: `Total (${model.quote.travellers} ${model.quote.travellers === 1 ? "traveller" : "travellers"})`,
          value: fare(model.quote.total),
        },
      ]
    : model.tiers.length > 0
      ? model.tiers.map((tier) => ({ label: tier.label, value: fare(tier.pricePerPerson) }))
      : [{ label: "Base price per person", value: "On request" }];

  // Footnotes under the cards: the group-size rule and age concessions matter
  // when no party has been chosen, since the cards alone do not explain them.
  const pricingNotes = [
    model.quote?.groupSizeWarning,
    model.quote ? undefined : "Prices are per person and set by the number of adults.",
    model.quote ? undefined : model.concessions,
  ].filter(Boolean) as string[];

  // The header title reserves the QR corner, so both decisions have to come
  // from the same expression.
  const showQr = Boolean(qr && packageUrl);

  return (
    <Document title={model.title} author={model.agencyName || "Travories"} creator="Travories">
      <Page
        size={{ width: BROCHURE_PAGE.width, height }}
        style={paged ? [styles.page, styles.pagePaged] : styles.page}
      >
        {showQr && <QrCode matrix={qr!} url={packageUrl!} />}

        <Header model={model} hasQr={showQr} />

        <View style={styles.content}>
          <Gallery {...shared} paged={paged} />

          {model.overview.length > 0 && (
            <Section heading="Overview" paged={paged} solid>
              <View style={{ gap: 10 }}>
                {model.overview.map((paragraph, index) => (
                  <Text key={index} style={styles.overviewCopy}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            </Section>
          )}

          <KeyFacts {...shared} paged={paged} />

          <TripRouteMap model={model} paged={paged} />

          <Section heading="Pricing" paged={paged} solid>
              <View style={styles.priceRow} wrap={!paged}>
                {pricingCards.map((card, index) => (
                  <View key={`${card.label}-${index}`} style={styles.priceCard}>
                    <Text style={styles.priceCardLabel}>{card.label}</Text>
                    <Text style={styles.priceCardValue}>{card.value}</Text>
                  </View>
                ))}
              </View>
            {pricingNotes.map((note) => (
              <Text key={note} style={styles.priceNote}>
                {note}
              </Text>
            ))}
          </Section>

          {model.days.length > 0 && (
            <View style={styles.dayList}>
              {model.days.map((day, index) => (
                <DayCard
                  key={day.index}
                  day={day}
                  paged={paged}
                  heading={index === 0 ? "Itinerary" : undefined}
                />
              ))}
            </View>
          )}

          {model.addons.length > 0 && <AddOns {...shared} />}

          {model.services.length > 0 && (
            <View style={styles.serviceList}>
              {model.services.map((service, index) => (
                <ServiceBlock
                  key={service.ghost}
                  service={service}
                  paged={paged}
                  first={index === 0}
                  heading={index === 0 ? "Services" : undefined}
                />
              ))}
            </View>
          )}
        </View>

        <Footer agencyName={model.agencyName} paged={paged} />
      </Page>
    </Document>
  );
}
