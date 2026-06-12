import { useRef, useState } from 'react';
import { downloadPdf } from './pdf/download';
import { validateFiles } from './pdf/fileValidation';
import { normalizePdfFilename } from './pdf/outputFilename';
import { parsePageOrder } from './pdf/pageOrder';
import { parsePageRanges } from './pdf/pageRanges';
import { type SignaturePosition } from './pdf/signPdf';

type Tool = 'images' | 'merge' | 'split' | 'reorder' | 'optimize' | 'sign';

const DEFAULT_OUTPUT_FILENAMES: Record<Tool, string> = {
  images: 'images-to-pdf.pdf',
  merge: 'merged.pdf',
  split: 'split.pdf',
  reorder: 'reordered.pdf',
  optimize: 'optimized.pdf',
  sign: 'signed.pdf',
};

const FEEDBACK_URL = 'https://github.com/lordjun/app-builder/issues/new?labels=feedback&title=PDF%20Toolbox%20feedback&body=What%20were%20you%20trying%20to%20do%3F%0A%0AWhat%20went%20wrong%20or%20felt%20unclear%3F%0A%0AWhat%20would%20make%20this%20tool%20worth%20using%20again%3F';

type WritableFile = {
  write: (data: Blob) => Promise<void>;
  close: () => Promise<void>;
};

type FileHandle = {
  createWritable: () => Promise<WritableFile>;
};

type DirectoryHandle = {
  getFileHandle: (name: string, options: { create: boolean }) => Promise<FileHandle>;
};

type WindowWithDirectoryPicker = Window & {
  showDirectoryPicker?: () => Promise<DirectoryHandle>;
};

type SaveResult = {
  destination: 'downloads' | 'selected-folder';
  filename: string;
};

const TOOL_INPUTS: Record<Tool, {
  accept: string;
  cardDescription: string;
  cardLabel: string;
  dropZoneLabel: string;
  multiple: boolean;
  requirement: string;
  selectLabel: string;
}> = {
  images: {
    accept: 'image/png,image/jpeg',
    cardDescription: 'Turn photos or scans into one PDF.',
    cardLabel: 'Images to PDF',
    dropZoneLabel: 'Image upload drop zone',
    multiple: true,
    requirement: 'Drop or choose PNG/JPEG images.',
    selectLabel: 'Select images',
  },
  merge: {
    accept: 'application/pdf',
    cardDescription: 'Combine PDFs in the order shown.',
    cardLabel: 'Merge PDFs',
    dropZoneLabel: 'PDF merge upload drop zone',
    multiple: true,
    requirement: 'Drop or choose at least two PDF files.',
    selectLabel: 'Select PDFs',
  },
  split: {
    accept: 'application/pdf',
    cardDescription: 'Keep only selected pages.',
    cardLabel: 'Split PDF',
    dropZoneLabel: 'PDF split upload drop zone',
    multiple: false,
    requirement: 'Drop or choose one PDF, then enter pages to keep.',
    selectLabel: 'Select PDF',
  },
  reorder: {
    accept: 'application/pdf',
    cardDescription: 'Set a new page order.',
    cardLabel: 'Reorder Pages',
    dropZoneLabel: 'PDF reorder upload drop zone',
    multiple: false,
    requirement: 'Drop or choose one PDF, then enter the new page order.',
    selectLabel: 'Select PDF',
  },
  optimize: {
    accept: 'application/pdf',
    cardDescription: 'Rebuild and compare file size.',
    cardLabel: 'Optimize PDF',
    dropZoneLabel: 'PDF optimize upload drop zone',
    multiple: false,
    requirement: 'Drop or choose one PDF to optimize and compare file size.',
    selectLabel: 'Select PDF',
  },
  sign: {
    accept: 'application/pdf',
    cardDescription: 'Add text or handwritten signature.',
    cardLabel: 'Sign PDF',
    dropZoneLabel: 'PDF signing upload drop zone',
    multiple: false,
    requirement: 'Drop or choose one PDF file.',
    selectLabel: 'Select PDF',
  },
};

export default function App() {
  const [tool, setTool] = useState<Tool>('images');
  const [message, setMessage] = useState('Choose a tool to start.');
  const [pageRanges, setPageRanges] = useState('');
  const [pageOrder, setPageOrder] = useState('');
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [signature, setSignature] = useState('');
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition>('bottom-right');
  const [hasHandwrittenSignature, setHasHandwrittenSignature] = useState(false);
  const [hasCompletedOutput, setHasCompletedOutput] = useState(false);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFilename, setOutputFilename] = useState(DEFAULT_OUTPUT_FILENAMES.images);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [saveDirectory, setSaveDirectory] = useState<DirectoryHandle | null>(null);
  const processingRef = useRef(false);
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const supportsDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  const inputConfig = TOOL_INPUTS[tool];
  const selectedFileProblem = getSelectedFileProblem(tool, selectedFiles);
  const pageRangeProblem = selectedFiles.length > 0 ? getPageRangeProblem(tool, pageRanges, pdfPageCount) : null;
  const pageOrderProblem = selectedFiles.length > 0 ? getPageOrderProblem(tool, pageOrder, pdfPageCount) : null;
  const signatureProblem = selectedFiles.length > 0 ? getSignatureProblem(tool, signature, hasHandwrittenSignature) : null;
  const startProblem = selectedFileProblem ?? pageRangeProblem ?? pageOrderProblem ?? signatureProblem;
  const canStartProcessing = selectedFiles.length > 0 && !startProblem && !isProcessing;

  function changeTool(nextTool: Tool) {
    setTool(nextTool);
    setSelectedFiles([]);
    setHasCompletedOutput(false);
    setOutputFilename(DEFAULT_OUTPUT_FILENAMES[nextTool]);
    setPageRanges('');
    setPageOrder('');
    setPdfPageCount(null);
    setMessage('Choose source files, then start processing.');
  }

  function selectFiles(files: FileList | File[] | null) {
    const selected = Array.from(files ?? []);
    setSelectedFiles(selected);
    setHasCompletedOutput(false);
    setPdfPageCount(null);
    setMessage(selected.length > 0 ? `${selected.length} source file${selected.length === 1 ? '' : 's'} selected.` : 'Choose source files, then start processing.');
    void updatePdfPageCount(selected);
  }

  async function updatePdfPageCount(files: File[]) {
    if ((tool !== 'split' && tool !== 'reorder') || files.length !== 1 || files[0].type !== 'application/pdf') {
      return;
    }

    const [pdfFile] = files;
    try {
      const { getPdfPageCount } = await import('./pdf/pdfPageCount');
      const pageCount = await getPdfPageCount(pdfFile);
      setPdfPageCount(pageCount);
      if (tool === 'split') {
        setPageRanges((currentValue) => currentValue.trim().length > 0 ? currentValue : `1-${pageCount}`);
      }
      if (tool === 'reorder') {
        setPageOrder((currentValue) => currentValue.trim().length > 0 ? currentValue : makeDefaultPageOrder(pageCount));
      }
    } catch {
      setPdfPageCount(null);
    }
  }

  function handleUploadDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDraggingFiles(false);
    selectFiles(event.dataTransfer.files);
  }

  function removeFile(fileIndex: number) {
    setSelectedFiles((files) => {
      const nextFiles = files.filter((_, index) => index !== fileIndex);
      setHasCompletedOutput(false);
      setMessage(nextFiles.length > 0 ? `${nextFiles.length} source file${nextFiles.length === 1 ? '' : 's'} selected.` : 'Choose source files, then start processing.');
      return nextFiles;
    });
  }

  function moveFile(fileIndex: number, direction: -1 | 1) {
    setSelectedFiles((files) => {
      const nextIndex = fileIndex + direction;
      if (nextIndex < 0 || nextIndex >= files.length) {
        return files;
      }

      const nextFiles = [...files];
      [nextFiles[fileIndex], nextFiles[nextIndex]] = [nextFiles[nextIndex], nextFiles[fileIndex]];
      return nextFiles;
    });
  }

  async function chooseSaveDirectory() {
    const picker = (window as WindowWithDirectoryPicker).showDirectoryPicker;
    if (!picker) {
      setMessage('Folder selection is not supported in this browser. The PDF will use browser downloads.');
      return;
    }

    try {
      const directory = await picker();
      setSaveDirectory(directory);
      setMessage('Save folder selected.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setMessage('Save folder selection canceled.');
        return;
      }
      setMessage(error instanceof Error ? error.message : 'Could not select a save folder.');
    }
  }

  async function runCurrentTool() {
    if (processingRef.current) {
      return;
    }

    processingRef.current = true;
    setHasCompletedOutput(false);
    setIsProcessing(true);

    try {
      if (tool === 'images') {
        await runImages(selectedFiles);
        return;
      }

      if (tool === 'merge') {
        await runMerge(selectedFiles);
        return;
      }

      if (tool === 'split') {
        await runSplit(selectedFiles);
        return;
      }

      if (tool === 'reorder') {
        await runReorder(selectedFiles);
        return;
      }

      if (tool === 'optimize') {
        await runOptimize(selectedFiles);
        return;
      }

      await runSign(selectedFiles);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }

  async function runImages(files: File[]) {
    await runSafely(async () => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        setValidationErrorMessage(validation.errors);
        return;
      }

      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setMessage('Choose at least one image.');
        return;
      }

      const { createPdfFromImages } = await import('./pdf/imageToPdf');
      const bytes = await createPdfFromImages(imageFiles);
      const saveResult = await saveOutput(bytes, DEFAULT_OUTPUT_FILENAMES.images);
      setCompletedMessage(`Created PDF from ${imageFiles.length} image file${imageFiles.length === 1 ? '' : 's'}.`, saveResult);
    });
  }

  async function runMerge(files: File[]) {
    await runSafely(async () => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        setValidationErrorMessage(validation.errors);
        return;
      }

      const pdfFiles = files.filter((file) => file.type === 'application/pdf');
      if (pdfFiles.length < 2) {
        setMessage('Choose at least two PDFs to merge.');
        return;
      }

      const { mergePdfs } = await import('./pdf/mergePdfs');
      const bytes = await mergePdfs(pdfFiles);
      const saveResult = await saveOutput(bytes, DEFAULT_OUTPUT_FILENAMES.merge);
      setCompletedMessage(`Merged ${pdfFiles.length} PDF files.`, saveResult);
    });
  }

  async function runSplit(files: File[]) {
    await runSafely(async () => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        setValidationErrorMessage(validation.errors);
        return;
      }

      const [pdfFile] = files.filter((file) => file.type === 'application/pdf');
      if (!pdfFile) {
        setMessage('Choose one PDF to split.');
        return;
      }

      const trimmedPageRanges = pageRanges.trim();
      if (trimmedPageRanges.length === 0) {
        setMessage('Enter pages to keep, such as 1-3,5.');
        return;
      }

      const { splitPdf } = await import('./pdf/splitPdf');
      const bytes = await splitPdf(pdfFile, trimmedPageRanges);
      const saveResult = await saveOutput(bytes, DEFAULT_OUTPUT_FILENAMES.split);
      setCompletedMessage(`Split ${pdfFile.name} into a new PDF.`, saveResult);
    });
  }

  async function runReorder(files: File[]) {
    await runSafely(async () => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        setValidationErrorMessage(validation.errors);
        return;
      }

      const [pdfFile] = files.filter((file) => file.type === 'application/pdf');
      if (!pdfFile) {
        setMessage('Choose one PDF to reorder.');
        return;
      }

      const trimmedPageOrder = pageOrder.trim();
      if (trimmedPageOrder.length === 0) {
        setMessage('Enter the new page order, such as 3,1,2.');
        return;
      }

      const { reorderPdf } = await import('./pdf/reorderPdf');
      const bytes = await reorderPdf(pdfFile, trimmedPageOrder);
      const saveResult = await saveOutput(bytes, DEFAULT_OUTPUT_FILENAMES.reorder);
      setCompletedMessage(`Reordered pages in ${pdfFile.name}.`, saveResult);
    });
  }

  async function runOptimize(files: File[]) {
    await runSafely(async () => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        setValidationErrorMessage(validation.errors);
        return;
      }

      const [pdfFile] = files.filter((file) => file.type === 'application/pdf');
      if (!pdfFile) {
        setMessage('Choose one PDF to optimize.');
        return;
      }

      const { optimizePdf } = await import('./pdf/optimizePdf');
      const result = await optimizePdf(pdfFile);
      const saveResult = await saveOutput(result.bytes, DEFAULT_OUTPUT_FILENAMES.optimize);
      setCompletedMessage(
        getOptimizeSummary(pdfFile.name, result.originalSize, result.optimizedSize),
        saveResult
      );
    });
  }

  async function runSign(files: File[]) {
    await runSafely(async () => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        setValidationErrorMessage(validation.errors);
        return;
      }

      const [pdfFile] = files.filter((file) => file.type === 'application/pdf');
      if (!pdfFile) {
        setMessage('Choose one PDF to sign.');
        return;
      }

      const signatureText = signature.trim();
      if (!hasHandwrittenSignature && signatureText.length === 0) {
        setMessage('Add signature text or draw a signature.');
        return;
      }

      const { signPdf } = await import('./pdf/signPdf');
      const bytes = await signPdf(pdfFile, hasHandwrittenSignature
        ? {
            type: 'image',
            imageBytes: await getSignatureCanvasBytes(),
            position: signaturePosition,
          }
        : {
            type: 'text',
            text: signatureText,
            position: signaturePosition,
          });
      const saveResult = await saveOutput(bytes, DEFAULT_OUTPUT_FILENAMES.sign);
      setCompletedMessage('Signed the PDF on the first page.', saveResult);
    });
  }

  function startSignatureStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    const { x, y } = getCanvasPoint(canvas, event);
    context.strokeStyle = '#172026';
    context.lineWidth = 3;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawingSignature(true);
    setHasHandwrittenSignature(true);
  }

  function continueSignatureStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingSignature) {
      return;
    }

    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    const { x, y } = getCanvasPoint(canvas, event);
    context.lineTo(x, y);
    context.stroke();
  }

  function endSignatureStroke() {
    setIsDrawingSignature(false);
  }

  function clearSignatureCanvas() {
    const canvas = signatureCanvasRef.current;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasHandwrittenSignature(false);
    setMessage('Signature pad cleared.');
  }

  async function getSignatureCanvasBytes(): Promise<Uint8Array> {
    const canvas = signatureCanvasRef.current;
    if (!canvas) {
      throw new Error('Signature pad is not available.');
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) {
      throw new Error('Signature image could not be created.');
    }

    return new Uint8Array(await blob.arrayBuffer());
  }

  async function saveOutput(bytes: Uint8Array, filename: string): Promise<SaveResult> {
    const normalizedFilename = normalizePdfFilename(outputFilename, filename);
    if (!saveDirectory) {
      downloadPdf(bytes, normalizedFilename);
      return {
        destination: 'downloads',
        filename: normalizedFilename,
      };
    }

    const fileHandle = await saveDirectory.getFileHandle(normalizedFilename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Blob([toArrayBuffer(bytes)], { type: 'application/pdf' }));
    await writable.close();
    return {
      destination: 'selected-folder',
      filename: normalizedFilename,
    };
  }

  async function runSafely(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'The selected file could not be processed.';
      setHasCompletedOutput(false);
      setMessage(`Processing failed. ${detail} Try again with the same files, or choose different files.`);
    }
  }

  function resetCurrentBatch() {
    setSelectedFiles([]);
    setHasCompletedOutput(false);
    setMessage('Choose source files, then start processing.');
  }

  function setCompletedMessage(summary: string, saveResult: SaveResult) {
    setHasCompletedOutput(true);
    const destination = saveResult.destination === 'downloads' ? 'through Downloads' : 'to the selected folder';
    setMessage(`${summary} Saved ${saveResult.filename} ${destination}.`);
  }

  function setValidationErrorMessage(errors: string[]) {
    setHasCompletedOutput(false);
    setMessage(`Check your files. ${errors.join(' ')} Choose different files and try again.`);
  }

  const filePicker = (
    <div
      aria-label={inputConfig.dropZoneLabel}
      className={isDraggingFiles ? 'upload-zone drag-active' : 'upload-zone'}
      onDragEnter={() => setIsDraggingFiles(true)}
      onDragLeave={() => setIsDraggingFiles(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleUploadDrop}
    >
      <p className="input-requirement">{inputConfig.requirement}</p>
      <label className="file-picker">
        {inputConfig.selectLabel}
        <input
          type="file"
          accept={inputConfig.accept}
          multiple={inputConfig.multiple}
          onChange={(event) => selectFiles(event.currentTarget.files)}
        />
      </label>
    </div>
  );

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="app-title">
        <div className="hero-topline">
          <p className="eyebrow">Local-first document tools</p>
          <a className="feedback-link" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
            Send feedback
          </a>
        </div>
        <h1 id="app-title">Privacy PDF Toolbox</h1>
        <p className="lede">Create, merge, split, reorder, optimize, and sign PDFs in your browser. Files stay local by default.</p>
      </section>

      <div className="toolbox-shell">
        <nav className="tool-rail" aria-label="PDF tools">
          <div className="rail-heading">
            <span>Tools</span>
            <strong>{Object.keys(TOOL_INPUTS).length}</strong>
          </div>
          <div className="tool-grid">
            {Object.entries(TOOL_INPUTS).map(([toolKey, config]) => (
              <button
                aria-label={config.cardLabel}
                className={tool === toolKey ? 'tool-card active' : 'tool-card'}
                key={toolKey}
                type="button"
                onClick={() => changeTool(toolKey as Tool)}
              >
                <span className="tool-card-title">{config.cardLabel}</span>
                <span className="tool-card-description">{config.cardDescription}</span>
              </button>
            ))}
          </div>
        </nav>

        <section className="workspace" aria-live="polite">
          <div className="workspace-header">
            <div>
              <p className="workspace-eyebrow">Active tool</p>
              <h2>{inputConfig.cardLabel}</h2>
              <p>{inputConfig.cardDescription}</p>
            </div>
            <span className="local-pill">No upload</span>
          </div>
          <div className="trust-bar" aria-label="Processing and save status">
            <p className="privacy-note">Files are processed in this browser tab, not uploaded to a server.</p>
            <p className="save-status">Save destination: {saveDirectory ? 'Selected folder' : 'Downloads'}</p>
          </div>
          <div className="save-row">
            {supportsDirectoryPicker ? (
              <button className="secondary-button" type="button" onClick={() => void chooseSaveDirectory()}>
                Choose save folder
              </button>
            ) : (
              <p className="save-fallback">This browser will save through Downloads.</p>
            )}
            <span className="destination-label">{saveDirectory ? 'Custom folder selected' : 'No custom folder selected'}</span>
          </div>
          {tool !== 'sign' && filePicker}
          {tool === 'split' && (
            <label className="page-range-field">
              Pages to keep
              <input
                aria-label="Pages to keep"
                placeholder="1-3,5"
                value={pageRanges}
                onChange={(event) => setPageRanges(event.target.value)}
              />
            </label>
          )}
          {tool === 'reorder' && (
            <label className="page-range-field">
              New page order
              <input
                aria-label="New page order"
                placeholder="3,1,2"
                value={pageOrder}
                onChange={(event) => setPageOrder(event.target.value)}
              />
            </label>
          )}
          {pdfPageCount !== null && (tool === 'split' || tool === 'reorder') && (
            <p className="page-count-hint">This PDF has {pdfPageCount} page{pdfPageCount === 1 ? '' : 's'}.</p>
          )}
          {tool === 'sign' && (
            <div className="signing-panel">
              <label>
                Signature text
                <input value={signature} onChange={(event) => setSignature(event.target.value)} aria-label="Signature text" />
              </label>
              <div className="signature-pad">
                <canvas
                  aria-label="Handwritten signature pad"
                  className="signature-canvas"
                  height={160}
                  ref={signatureCanvasRef}
                  width={520}
                  onPointerDown={startSignatureStroke}
                  onPointerLeave={endSignatureStroke}
                  onPointerMove={continueSignatureStroke}
                  onPointerUp={endSignatureStroke}
                />
                <button className="secondary-button compact-button" type="button" onClick={clearSignatureCanvas}>
                  Clear signature
                </button>
              </div>
              <fieldset className="position-options">
                <legend>Signature position</legend>
                <label>
                  <input
                    checked={signaturePosition === 'bottom-right'}
                    name="signature-position"
                    type="radio"
                    value="bottom-right"
                    onChange={() => setSignaturePosition('bottom-right')}
                  />
                  Bottom right
                </label>
                <label>
                  <input
                    checked={signaturePosition === 'bottom-left'}
                    name="signature-position"
                    type="radio"
                    value="bottom-left"
                    onChange={() => setSignaturePosition('bottom-left')}
                  />
                  Bottom left
                </label>
                <label>
                  <input
                    checked={signaturePosition === 'top-right'}
                    name="signature-position"
                    type="radio"
                    value="top-right"
                    onChange={() => setSignaturePosition('top-right')}
                  />
                  Top right
                </label>
                <label>
                  <input
                    checked={signaturePosition === 'top-left'}
                    name="signature-position"
                    type="radio"
                    value="top-left"
                    onChange={() => setSignaturePosition('top-left')}
                  />
                  Top left
                </label>
              </fieldset>
              {filePicker}
            </div>
          )}
          <label className="filename-field">
            Output filename
            <input
              aria-label="Output filename"
              value={outputFilename}
              onChange={(event) => setOutputFilename(event.target.value)}
            />
          </label>
          {selectedFiles.length > 0 && (
            <section className="selected-files" aria-labelledby="selected-files-title">
              <h2 id="selected-files-title">Selected files</h2>
              <ol className="file-list">
                {selectedFiles.map((file, index) => (
                  <li className="file-row" key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                    <div className="file-meta">
                      <span className="file-name">{file.name}</span>
                      <span className="file-detail">{formatFileSize(file.size)} | {file.type || 'unknown type'}</span>
                    </div>
                    <div className="file-actions">
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Move ${file.name} up`}
                        disabled={index === 0}
                        onClick={() => moveFile(index, -1)}
                      >
                        <span aria-hidden="true">^</span>
                      </button>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Move ${file.name} down`}
                        disabled={index === selectedFiles.length - 1}
                        onClick={() => moveFile(index, 1)}
                      >
                        <span aria-hidden="true">v</span>
                      </button>
                      <button className="icon-button danger" type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(index)}>
                        <span aria-hidden="true">x</span>
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
          <div className="action-row">
            <button className="primary-button" type="button" disabled={!canStartProcessing} onClick={() => void runCurrentTool()}>
              {isProcessing ? 'Processing...' : 'Start processing'}
            </button>
            {hasCompletedOutput && (
              <button className="secondary-button follow-up-button" type="button" onClick={resetCurrentBatch}>
                Process another batch
              </button>
            )}
          </div>
          {startProblem && <p className="input-warning">{startProblem}</p>}
          <p className="status">{message}</p>
        </section>
      </div>
    </main>
  );
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function getOptimizeSummary(fileName: string, originalSize: number, optimizedSize: number): string {
  const original = formatFileSize(originalSize);
  const optimized = formatFileSize(optimizedSize);

  if (optimizedSize < originalSize) {
    return `Optimized ${fileName}. Size changed from ${original} to ${optimized}.`;
  }

  if (optimizedSize === originalSize) {
    return `Optimized ${fileName}. Size stayed at ${optimized}. This PDF may already be optimized.`;
  }

  return `Optimized ${fileName}. Output is ${optimized}, larger than the original ${original}. This PDF may already be optimized.`;
}

function getSelectedFileProblem(tool: Tool, files: File[]): string | null {
  if (files.length === 0) {
    return null;
  }

  if (tool === 'images') {
    return files.every((file) => file.type === 'image/png' || file.type === 'image/jpeg')
      ? null
      : 'Use PNG or JPEG image files for this tool.';
  }

  if (tool === 'merge') {
    if (!files.every((file) => file.type === 'application/pdf')) {
      return 'Use PDF files for this tool.';
    }

    return files.length >= 2 ? null : 'Add at least two PDF files to merge.';
  }

  if (tool === 'split') {
    if (!files.every((file) => file.type === 'application/pdf')) {
      return 'Use one PDF file for splitting.';
    }

    return files.length === 1 ? null : 'Keep one PDF file for splitting.';
  }

  if (tool === 'reorder') {
    if (!files.every((file) => file.type === 'application/pdf')) {
      return 'Use one PDF file for reordering.';
    }

    return files.length === 1 ? null : 'Keep one PDF file for reordering.';
  }

  if (tool === 'optimize') {
    if (!files.every((file) => file.type === 'application/pdf')) {
      return 'Use one PDF file for optimization.';
    }

    return files.length === 1 ? null : 'Keep one PDF file for optimization.';
  }

  if (!files.every((file) => file.type === 'application/pdf')) {
    return 'Use one PDF file for signing.';
  }

  return files.length === 1 ? null : 'Keep one PDF file for signing.';
}

function getPageOrderProblem(tool: Tool, pageOrder: string, pdfPageCount: number | null): string | null {
  if (tool !== 'reorder') {
    return null;
  }

  if (pageOrder.trim().length === 0) {
    return 'Enter the new page order, such as 3,1,2.';
  }

  if (pdfPageCount === null) {
    return null;
  }

  try {
    parsePageOrder(pageOrder, pdfPageCount);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Use a valid page order.';
  }
}

function getPageRangeProblem(tool: Tool, pageRanges: string, pdfPageCount: number | null): string | null {
  if (tool !== 'split') {
    return null;
  }

  if (pageRanges.trim().length === 0) {
    return 'Enter pages to keep, such as 1-3,5.';
  }

  if (pdfPageCount === null) {
    return null;
  }

  try {
    parsePageRanges(pageRanges, pdfPageCount);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Use valid page ranges.';
  }
}

function getSignatureProblem(tool: Tool, signature: string, hasHandwrittenSignature: boolean): string | null {
  if (tool !== 'sign' || hasHandwrittenSignature || signature.trim().length > 0) {
    return null;
  }

  return 'Add signature text or draw a signature.';
}

function makeDefaultPageOrder(pageCount: number): string {
  return Array.from({ length: pageCount }, (_, index) => String(index + 1)).join(',');
}

function getCanvasPoint(canvas: HTMLCanvasElement, event: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}
