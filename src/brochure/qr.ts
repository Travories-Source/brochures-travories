import QRCode from "qrcode";

export interface QrMatrix {
  /** Modules per side, excluding the quiet zone. */
  size: number;
  /** `true` where a module is dark. Row-major, `size * size` long. */
  dark: boolean[];
}

/**
 * Encode a URL as a QR matrix for vector rendering.
 *
 * Error-correction level H (recovers ~30% of the symbol) is what makes the
 * centre logo safe: the Travories mark covers roughly a fifth of the area, well
 * inside that budget. Anything lower and the knockout would start costing real
 * scans.
 */
export function buildQrMatrix(text: string): QrMatrix | null {
  try {
    const { modules } = QRCode.create(text, { errorCorrectionLevel: "H" });
    const size = modules.size;
    const data = modules.data as unknown as ArrayLike<number>;

    const dark: boolean[] = new Array(size * size);
    for (let index = 0; index < size * size; index += 1) dark[index] = data[index] === 1;

    return { size, dark };
  } catch {
    return null;
  }
}
