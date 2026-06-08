import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { readFileBytes } from './readFileBytes';

export const SIGNATURE_POSITIONS = ['bottom-right', 'bottom-left', 'top-right', 'top-left'] as const;

export type SignaturePosition = (typeof SIGNATURE_POSITIONS)[number];

export type SignatureInput =
  | {
      type: 'text';
      text: string;
      position: SignaturePosition;
    }
  | {
      type: 'image';
      imageBytes: Uint8Array;
      position: SignaturePosition;
    };

export async function signPdf(file: File, signature: string | SignatureInput): Promise<Uint8Array> {
  const normalized = normalizeSignature(signature);
  if (normalized.type === 'text' && !normalized.text.trim()) {
    throw new Error('Signature text is required.');
  }

  const pdf = await PDFDocument.load(await readFileBytes(file));
  const firstPage = pdf.getPage(0);
  const { height, width } = firstPage.getSize();

  if (normalized.type === 'image') {
    const image = await pdf.embedPng(normalized.imageBytes);
    const maxWidth = 140;
    const maxHeight = 60;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const imageWidth = image.width * scale;
    const imageHeight = image.height * scale;
    const { x, y } = getSignatureCoordinates(normalized.position, width, height, imageWidth, imageHeight);

    firstPage.drawImage(image, {
      x,
      y,
      width: imageWidth,
      height: imageHeight,
    });

    return pdf.save();
  }

  const trimmed = normalized.text.trim();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const size = 18;
  const textWidth = font.widthOfTextAtSize(trimmed, size);
  const textHeight = size;
  const { x, y } = getSignatureCoordinates(normalized.position, width, height, textWidth, textHeight);

  firstPage.drawText(trimmed, {
    x,
    y,
    size,
    font,
    color: rgb(0.05, 0.12, 0.16),
  });

  return pdf.save();
}

function normalizeSignature(signature: string | SignatureInput): SignatureInput {
  if (typeof signature === 'string') {
    return {
      type: 'text',
      text: signature,
      position: 'bottom-right',
    };
  }

  return signature;
}

function getSignatureCoordinates(
  position: SignaturePosition,
  pageWidth: number,
  pageHeight: number,
  itemWidth: number,
  itemHeight: number,
): { x: number; y: number } {
  const margin = 36;
  const x = position.endsWith('right') ? Math.max(margin, pageWidth - itemWidth - margin) : margin;
  const y = position.startsWith('top') ? Math.max(margin, pageHeight - itemHeight - margin) : margin;

  return { x, y };
}
