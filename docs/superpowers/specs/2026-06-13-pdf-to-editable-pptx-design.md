# PDF to Editable PPTX Design

## Goal

Add a high-demand editing workflow to Privacy PDF Toolbox: let users convert a PDF into an editable PowerPoint file, edit it in PowerPoint, Keynote, WPS, or similar tools, then export back to PDF from that editor.

The feature should preserve the product's local-first promise. The PDF must be processed in the browser and source files must not be uploaded.

## Product Positioning

Tool name:

```text
Edit PDF
```

Tool card description:

```text
Convert PDF to editable PowerPoint.
```

Upload instruction:

```text
Choose one PDF. The app will create a PPTX you can edit in PowerPoint, Keynote, or WPS.
```

Success message:

```text
Created editable PowerPoint. Text may be editable when the PDF contains selectable text. Export from PowerPoint to PDF after editing.
```

Image-based PDF warning:

```text
This PDF may be image-based. The PPTX will preserve each page visually, but text may not be editable without OCR.
```

## User Flow

1. User chooses `Edit PDF`.
2. User uploads one PDF.
3. App reads page count and basic text availability.
4. User clicks `Create editable PPTX`.
5. App creates a `.pptx` file:
   - Each PDF page becomes one slide.
   - Each slide gets a rendered page image as a visual reference/background.
   - Extractable text is added as editable text boxes when reasonable coordinates are available.
6. User downloads `editable-pdf.pptx`.
7. User edits the PPTX in an office app and exports to PDF there.

## Scope

### In Scope

- Add `Edit PDF` as a new tool card.
- Accept exactly one PDF.
- Output a PPTX file, not a PDF.
- Render PDF pages to slide backgrounds.
- Extract selectable text where possible and place it as editable text boxes.
- Show honest limitations for scanned/image-only PDFs.
- Keep processing browser-local.
- Add unit tests for tool routing, labels, validation, and success messaging.

### Out of Scope

- OCR for scanned PDFs.
- Perfect Word-quality document reconstruction.
- Perfect table reconstruction.
- Preserving every original font.
- Converting the edited PPTX back to PDF inside this app.
- Uploading PDFs to an external conversion API.
- Server-side LibreOffice conversion.

## Technical Approach

Use PDF.js for browser PDF parsing, page rendering, and text extraction. PDF.js is a web-based PDF parsing and rendering project from Mozilla.

Use PptxGenJS for creating and downloading `.pptx` files in the browser.

The implementation should add a new PDF module, likely:

```text
src/pdf/pdfToPptx.ts
```

Suggested interface:

```ts
type PdfToPptxResult = {
  bytes: Uint8Array;
  pageCount: number;
  extractedTextItemCount: number;
};

export async function convertPdfToEditablePptx(file: File): Promise<PdfToPptxResult>;
```

The app-level flow should remain consistent with existing tools:

- lazy import the conversion module only when the user runs the tool;
- validate file count and file type before processing;
- use the existing output filename field;
- save through Downloads or the selected folder when supported;
- show a clear success or recoverable error message.

## Conversion Detail

For each PDF page:

1. Load the page with PDF.js.
2. Render the page to a canvas at a moderate scale.
3. Convert the canvas to PNG data.
4. Add a PPTX slide with the same aspect ratio as the PDF page.
5. Add the rendered PNG as a full-slide background.
6. Call PDF.js text extraction for the page.
7. For text items with usable transform data:
   - add transparent or visible editable text boxes;
   - approximate position and font size;
   - keep text selectable/editable even if exact layout is imperfect.

The first MVP will place extracted text over the rendered page background when coordinates are usable. This can create visual duplication if the overlaid text is visible, so the implementation should keep text overlays visually subtle while still editable. The initial implementation prioritizes editable text and page visual reference over pixel-level fidelity.

## User Expectation Boundaries

The UI must not promise perfect conversion. It should say:

- selectable text can become editable;
- scanned PDFs may remain visual-only unless OCR is added later;
- complex layouts may need manual adjustment after opening the PPTX;
- users should export back to PDF from their office editor.

## Error Handling

Show recoverable messages for:

- unsupported file type;
- more than one selected PDF;
- encrypted or unreadable PDF;
- browser memory failure;
- PPTX generation failure;
- no selectable text found.

If no text is found but page images render, the app should still produce a PPTX and show the image-based PDF warning.

## Testing Plan

Automated tests:

- `Edit PDF` tool appears in navigation.
- It accepts one PDF and rejects non-PDF files.
- Processing stays disabled with no file selected.
- The visible confirmation button says `Create editable PPTX`.
- It lazy-loads the conversion module and saves `editable-pdf.pptx`.
- Success message includes page count and the edit/export guidance.
- Image-based warning appears when `extractedTextItemCount` is `0`.

Manual checks:

- Convert `numbered-4-pages.pdf` fixture.
- Confirm output `.pptx` opens in PowerPoint/WPS.
- Confirm slide count matches PDF page count.
- Confirm page image backgrounds are visible.
- Confirm at least some selectable PDF text is editable.
- Confirm a scanned/image-only PDF still produces visual slides with a warning.

## Risks

- PDF.js and PptxGenJS add bundle weight. Mitigation: lazy-load conversion code.
- Text positioning may be imperfect. Mitigation: frame the feature as editable PPTX creation, not perfect conversion.
- Scanned PDFs need OCR. Mitigation: explicit warning and later OCR experiment.
- PPTX output cannot be reliably converted back to PDF in-browser. Mitigation: instruct users to export from their office app.
- Mobile memory may be limited. Mitigation: keep file size validation and show recoverable errors.

## Success Criteria

- Users can convert a simple text PDF into a PPTX with the same number of pages.
- Users can open the PPTX in a mainstream office editor.
- Users can edit at least extractable text from non-scanned PDFs.
- Users understand that scanned PDFs need OCR for editable text.
- The feature keeps the local-first privacy promise.

## References

- PDF.js official project: https://mozilla.github.io/pdf.js/
- PptxGenJS official documentation: https://gitbrent.github.io/PptxGenJS/
- Existing project release checklist: `docs/release/privacy-first-pdf-toolbox-checklist.md`
