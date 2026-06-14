import JSZip from 'jszip';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convertPdfToEditablePptx } from './pdfToEditablePptx';

const ONE_PIXEL_PNG_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

const getPage = vi.fn();

vi.mock('pdfjs-dist/legacy/build/pdf', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage,
    }),
  })),
}));

vi.mock('pdfjs-dist/legacy/build/pdf.worker.min?url', () => ({
  default: 'pdf.worker.min.js',
}));

describe('convertPdfToEditablePptx', () => {
  beforeEach(() => {
    getPage.mockResolvedValue({
      getViewport: () => ({ width: 612, height: 864 }),
      getTextContent: async () => ({
        styles: {
          g_d0_f1: { fontFamily: 'sans-serif', ascent: 1.07, descent: -0.27 },
        },
        items: [
          {
            str: 'UK Visas & Immigration',
            fontName: 'g_d0_f1',
            transform: [26.25, 0, 0, 26.25, 73.5, 804.3],
            width: 270.09,
            height: 26.25,
          },
        ],
      }),
    });
  });

  it('preserves page appearance with a background while making replacement text visible and editable', async () => {
    const file = new File(['pdf'], 'application.pdf', { type: 'application/pdf' });

    const result = await convertPdfToEditablePptx(file, {
      renderPageImage: async () => ONE_PIXEL_PNG_DATA_URI,
    });
    const pptx = await JSZip.loadAsync(result.bytes);
    const slideXml = await pptx.file('ppt/slides/slide1.xml')?.async('string');

    expect(slideXml).toContain('<a:blip');
    expect(slideXml).toContain('<a:srgbClr val="FFFFFF"/>');
    expect(slideXml).toContain('<a:srgbClr val="172026"/></a:solidFill>');
    expect(slideXml).not.toContain('<a:srgbClr val="172026"><a:alpha val="0"/></a:srgbClr>');
    expect(slideXml).toContain('typeface="Arial"');
    expect(slideXml).not.toContain('g_d0_f1');

    const textShapeMatch = slideXml?.match(/name="Text 1"[\s\S]*?<a:ext cx="(\d+)"/);
    expect(Number(textShapeMatch?.[1])).toBeGreaterThan(3_900_000);
  });
});
