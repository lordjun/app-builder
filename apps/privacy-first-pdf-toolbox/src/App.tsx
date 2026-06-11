import { useRef, useState } from 'react';
import { downloadPdf } from './pdf/download';
import { validateFiles } from './pdf/fileValidation';
import { normalizePdfFilename } from './pdf/outputFilename';
import { type SignaturePosition } from './pdf/signPdf';

type Tool = 'images' | 'merge' | 'split' | 'sign';

const DEFAULT_OUTPUT_FILENAMES: Record<Tool, string> = {
  images: 'images-to-pdf.pdf',
  merge: 'merged.pdf',
  split: 'split.pdf',
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
  dropZoneLabel: string;
  multiple: boolean;
  requirement: string;
  selectLabel: string;
}> = {
  images: {
    accept: 'image/png,image/jpeg',
    dropZoneLabel: 'Image upload drop zone',
    multiple: true,
    requirement: 'Drop or choose PNG/JPEG images.',
    selectLabel: 'Select images',
  },
  merge: {
    accept: 'application/pdf',
    dropZoneLabel: 'PDF merge upload drop zone',
    multiple: true,
    requirement: 'Drop or choose at least two PDF files.',
    selectLabel: 'Select PDFs',
  },
  split: {
    accept: 'application/pdf',
    dropZoneLabel: 'PDF split upload drop zone',
    multiple: false,
    requirement: 'Drop or choose one PDF, then enter pages to keep.',
    selectLabel: 'Select PDF',
  },
  sign: {
    accept: 'application/pdf',
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
  const pageRangeProblem = selectedFiles.length > 0 ? getPageRangeProblem(tool, pageRanges) : null;
  const signatureProblem = selectedFiles.length > 0 ? getSignatureProblem(tool, signature, hasHandwrittenSignature) : null;
  const startProblem = selectedFileProblem ?? pageRangeProblem ?? signatureProblem;
  const canStartProcessing = selectedFiles.length > 0 && !startProblem && !isProcessing;

  function changeTool(nextTool: Tool) {
    setTool(nextTool);
    setSelectedFiles([]);
    setHasCompletedOutput(false);
    setOutputFilename(DEFAULT_OUTPUT_FILENAMES[nextTool]);
    setPageRanges('');
    setMessage('Choose source files, then start processing.');
  }

  function selectFiles(files: FileList | File[] | null) {
    const selected = Array.from(files ?? []);
    setSelectedFiles(selected);
    setHasCompletedOutput(false);
    setMessage(selected.length > 0 ? `${selected.length} source file${selected.length === 1 ? '' : 's'} selected.` : 'Choose source files, then start processing.');
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
        <p className="lede">Create, merge, split, and sign PDFs in your browser. Files stay local by default.</p>
      </section>

      <section className="tool-grid" aria-label="PDF tools">
        <button className={tool === 'images' ? 'tool-card active' : 'tool-card'} type="button" onClick={() => changeTool('images')}>Images to PDF</button>
        <button className={tool === 'merge' ? 'tool-card active' : 'tool-card'} type="button" onClick={() => changeTool('merge')}>Merge PDFs</button>
        <button className={tool === 'split' ? 'tool-card active' : 'tool-card'} type="button" onClick={() => changeTool('split')}>Split PDF</button>
        <button className={tool === 'sign' ? 'tool-card active' : 'tool-card'} type="button" onClick={() => changeTool('sign')}>Sign PDF</button>
      </section>

      <section className="workspace" aria-live="polite">
        <p className="privacy-note">Processed locally in your browser. No upload step is used.</p>
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
                      <span aria-hidden="true">↑</span>
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Move ${file.name} down`}
                      disabled={index === selectedFiles.length - 1}
                      onClick={() => moveFile(index, 1)}
                    >
                      <span aria-hidden="true">↓</span>
                    </button>
                    <button className="icon-button danger" type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(index)}>
                      <span aria-hidden="true">×</span>
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
        <button className="primary-button" type="button" disabled={!canStartProcessing} onClick={() => void runCurrentTool()}>
          {isProcessing ? 'Processing...' : 'Start processing'}
        </button>
        {startProblem && <p className="input-warning">{startProblem}</p>}
        <p className="status">{message}</p>
        {hasCompletedOutput && (
          <button className="secondary-button follow-up-button" type="button" onClick={resetCurrentBatch}>
            Process another batch
          </button>
        )}
      </section>
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

  if (!files.every((file) => file.type === 'application/pdf')) {
    return 'Use one PDF file for signing.';
  }

  return files.length === 1 ? null : 'Keep one PDF file for signing.';
}

function getPageRangeProblem(tool: Tool, pageRanges: string): string | null {
  if (tool !== 'split' || pageRanges.trim().length > 0) {
    return null;
  }

  return 'Enter pages to keep, such as 1-3,5.';
}

function getSignatureProblem(tool: Tool, signature: string, hasHandwrittenSignature: boolean): string | null {
  if (tool !== 'sign' || hasHandwrittenSignature || signature.trim().length > 0) {
    return null;
  }

  return 'Add signature text or draw a signature.';
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
