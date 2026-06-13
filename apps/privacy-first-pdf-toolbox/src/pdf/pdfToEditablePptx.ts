import PptxGenJS from 'pptxgenjs';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min?url';
import type { PDFPageProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
import { readFileBytes } from './readFileBytes';

const POINTS_PER_INCH = 72;
const MIN_TEXT_WIDTH_INCHES = 0.35;
const MIN_TEXT_HEIGHT_INCHES = 0.12;
const DEFAULT_TEXT_COLOR = '172026';

export type PdfToEditablePptxResult = {
  bytes: Uint8Array;
  pageCount: number;
  textItemCount: number;
};

export async function convertPdfToEditablePptx(file: File): Promise<PdfToEditablePptxResult> {
  const bytes = await readFileBytes(file);
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const document = await getDocument({
    data: bytes,
    useSystemFonts: true,
  }).promise;

  if (document.numPages < 1) {
    throw new Error('This PDF has no pages to convert.');
  }

  const pptx = new PptxGenJS();
  const firstPage = await document.getPage(1);
  const firstViewport = firstPage.getViewport({ scale: 1 });
  const layoutName = 'PDF_PAGE_LAYOUT';
  pptx.defineLayout({
    name: layoutName,
    width: firstViewport.width / POINTS_PER_INCH,
    height: firstViewport.height / POINTS_PER_INCH,
  });
  pptx.layout = layoutName;
  pptx.author = 'Privacy PDF Toolbox';
  pptx.subject = 'Editable PPTX converted from PDF text';
  pptx.title = file.name.replace(/\.pdf$/i, '');
  await addPdfPageToDeck(pptx, firstPage);

  let textItemCount = await countTextItems(firstPage);
  for (let pageNumber = 2; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    await addPdfPageToDeck(pptx, page);
    textItemCount += await countTextItems(page);
  }

  const output = await pptx.write({ outputType: 'arraybuffer' });

  return {
    bytes: new Uint8Array(output as ArrayBuffer),
    pageCount: document.numPages,
    textItemCount,
  };
}

async function addPdfPageToDeck(pptx: PptxGenJS, page: PDFPageProxy) {
  const viewport = page.getViewport({ scale: 1 });
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };

  const textContent = await page.getTextContent();
  for (const item of textContent.items) {
    if (!isTextItem(item)) {
      continue;
    }

    const text = item.str.trim();
    if (!text) {
      continue;
    }

    const [scaleX, skewY, , scaleY, x, y] = item.transform;
    const fontSize = Math.max(6, Math.abs(scaleY));
    const width = Math.max(item.width / POINTS_PER_INCH, MIN_TEXT_WIDTH_INCHES);
    const height = Math.max((fontSize * 1.35) / POINTS_PER_INCH, MIN_TEXT_HEIGHT_INCHES);
    const left = x / POINTS_PER_INCH;
    const top = (viewport.height - y - fontSize) / POINTS_PER_INCH;
    const rotation = Math.round(Math.atan2(skewY, scaleX) * (180 / Math.PI));

    slide.addText(text, {
      x: clamp(left, 0, viewport.width / POINTS_PER_INCH),
      y: clamp(top, 0, viewport.height / POINTS_PER_INCH),
      w: width,
      h: height,
      color: DEFAULT_TEXT_COLOR,
      fontFace: item.fontName,
      fontSize,
      margin: 0,
      rotate: rotation === 0 ? undefined : rotation,
      breakLine: false,
      fit: 'shrink',
    });
  }
}

async function countTextItems(page: PDFPageProxy): Promise<number> {
  const textContent = await page.getTextContent();
  return textContent.items.filter((item) => isTextItem(item) && item.str.trim().length > 0).length;
}

function isTextItem(item: unknown): item is TextItem {
  return typeof item === 'object' && item !== null && 'str' in item && 'transform' in item && 'width' in item;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
