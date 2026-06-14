import PptxGenJS from 'pptxgenjs';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min?url';
import type { PDFPageProxy, TextContent, TextItem, TextStyle } from 'pdfjs-dist/types/src/display/api';
import { readFileBytes } from './readFileBytes';

const POINTS_PER_INCH = 72;
const MIN_TEXT_WIDTH_INCHES = 0.35;
const MIN_TEXT_HEIGHT_INCHES = 0.12;
const DEFAULT_TEXT_COLOR = '172026';
const DEFAULT_RENDER_SCALE = 2;
const EDITABLE_TEXT_TRANSPARENCY = 25;

export type PdfToEditablePptxOptions = {
  renderPageImage?: (page: PDFPageProxy, scale: number) => Promise<string>;
};

export type PdfToEditablePptxResult = {
  bytes: Uint8Array;
  pageCount: number;
  textItemCount: number;
};

export async function convertPdfToEditablePptx(file: File, options: PdfToEditablePptxOptions = {}): Promise<PdfToEditablePptxResult> {
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
  const firstTextItemCount = await addPdfPageToDeck(pptx, firstPage, options);

  let textItemCount = firstTextItemCount;
  for (let pageNumber = 2; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    textItemCount += await addPdfPageToDeck(pptx, page, options);
  }

  const output = await pptx.write({ outputType: 'arraybuffer' });

  return {
    bytes: new Uint8Array(output as ArrayBuffer),
    pageCount: document.numPages,
    textItemCount,
  };
}

async function addPdfPageToDeck(pptx: PptxGenJS, page: PDFPageProxy, options: PdfToEditablePptxOptions): Promise<number> {
  const viewport = page.getViewport({ scale: 1 });
  const slideWidth = viewport.width / POINTS_PER_INCH;
  const slideHeight = viewport.height / POINTS_PER_INCH;
  const slide = pptx.addSlide();
  slide.background = { color: 'FFFFFF' };
  slide.addImage({
    data: await (options.renderPageImage ?? renderPageImage)(page, DEFAULT_RENDER_SCALE),
    x: 0,
    y: 0,
    w: slideWidth,
    h: slideHeight,
  });

  const textContent = await page.getTextContent();
  let textItemCount = 0;
  for (const item of textContent.items) {
    if (!isTextItem(item)) {
      continue;
    }

    const text = item.str.trim();
    if (!text) {
      continue;
    }

    textItemCount += 1;
    const [scaleX, skewY, , scaleY, x, y] = item.transform;
    const style = textContent.styles[item.fontName];
    const fontSize = Math.max(6, Math.abs(scaleY));
    const textBox = getTextBox(item, style, viewport.height, fontSize, x, y);
    const width = Math.max(item.width / POINTS_PER_INCH, MIN_TEXT_WIDTH_INCHES);
    const rotation = Math.round(Math.atan2(skewY, scaleX) * (180 / Math.PI));

    slide.addText(text, {
      x: clamp(textBox.left, 0, slideWidth),
      y: clamp(textBox.top, 0, slideHeight),
      w: width,
      h: textBox.height,
      color: DEFAULT_TEXT_COLOR,
      fontFace: mapPdfFontToOfficeFont(item.fontName, style),
      fontSize,
      margin: 0,
      rotate: rotation === 0 ? undefined : rotation,
      breakLine: false,
      fit: 'shrink',
      transparency: EDITABLE_TEXT_TRANSPARENCY,
    });
  }

  return textItemCount;
}

function isTextItem(item: unknown): item is TextItem {
  return typeof item === 'object' && item !== null && 'str' in item && 'transform' in item && 'width' in item;
}

async function renderPageImage(page: PDFPageProxy, scale: number): Promise<string> {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('This browser could not render the PDF page preview.');
  }

  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  return canvas.toDataURL('image/png');
}

function getTextBox(item: TextItem, style: TextStyle | undefined, pageHeight: number, fontSize: number, x: number, y: number) {
  const ascent = typeof style?.ascent === 'number' ? style.ascent : 0.9;
  const descent = typeof style?.descent === 'number' ? style.descent : -0.2;
  const heightPoints = Math.max(item.height || fontSize, fontSize * Math.max(1, ascent - descent));
  const topPoints = pageHeight - y - fontSize * ascent;

  return {
    left: x / POINTS_PER_INCH,
    top: topPoints / POINTS_PER_INCH,
    height: Math.max(heightPoints / POINTS_PER_INCH, MIN_TEXT_HEIGHT_INCHES),
  };
}

function mapPdfFontToOfficeFont(fontName: string, style: TextContent['styles'][string] | undefined): string {
  const fontDescriptor = `${fontName} ${style?.fontFamily ?? ''}`.toLowerCase();

  if (fontDescriptor.includes('mono') || fontDescriptor.includes('courier')) {
    return 'Courier New';
  }

  if (fontDescriptor.includes('serif') && !fontDescriptor.includes('sans')) {
    return 'Times New Roman';
  }

  return 'Arial';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
