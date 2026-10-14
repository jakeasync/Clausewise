import type { ReviewDoc } from "./types";

const docs = new Map<string, ReviewDoc>();
const pdfBuffers = new Map<string, Buffer>();

export const getDoc = (id: string): ReviewDoc | null => docs.get(id) ?? null;
export const saveDoc = (d: ReviewDoc): void => void docs.set(d.id, d);

export const savePdfBuffer = (id: string, buf: Buffer): void => void pdfBuffers.set(id, buf);
export const getPdfBuffer = (id: string): Buffer | null => pdfBuffers.get(id) ?? null;
