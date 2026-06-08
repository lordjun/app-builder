import { PDFDocument } from 'pdf-lib';
import { readFileBytes } from './readFileBytes';

export async function createPdfFromImages(files: File[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();

  for (const file of files) {
    const bytes = await readFileBytes(file);
    const image = file.type === 'image/png'
      ? await pdf.embedPng(bytes)
      : await pdf.embedJpg(bytes);

    const page = pdf.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height
    });
  }

  return pdf.save();
}
