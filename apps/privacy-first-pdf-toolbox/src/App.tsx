import { useState } from 'react';
import { downloadPdf } from './pdf/download';
import { validateFiles } from './pdf/fileValidation';
import { createPdfFromImages } from './pdf/imageToPdf';
import { mergePdfs } from './pdf/mergePdfs';
import { signPdf } from './pdf/signPdf';

type Tool = 'images' | 'merge' | 'sign';

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

export default function App() {
  const [tool, setTool] = useState<Tool>('images');
  const [message, setMessage] = useState('Choose a tool to start.');
  const [signature, setSignature] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [saveDirectory, setSaveDirectory] = useState<DirectoryHandle | null>(null);

  const supportsDirectoryPicker = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

  function changeTool(nextTool: Tool) {
    setTool(nextTool);
    setSelectedFiles([]);
    setMessage('Choose source files, then start processing.');
  }

  function selectFiles(files: FileList | null) {
    const selected = Array.from(files ?? []);
    setSelectedFiles(selected);
    setMessage(selected.length > 0 ? `${selected.length} source file${selected.length === 1 ? '' : 's'} selected.` : 'Choose source files, then start processing.');
  }

  function removeFile(fileIndex: number) {
    setSelectedFiles((files) => {
      const nextFiles = files.filter((_, index) => index !== fileIndex);
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
    if (tool === 'images') {
      await runImages(selectedFiles);
      return;
    }

    if (tool === 'merge') {
      await runMerge(selectedFiles);
      return;
    }

    await runSign(selectedFiles);
  }

  async function runImages(files: File[]) {
    await runSafely(async () => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        setMessage(validation.errors.join(' '));
        return;
      }

      const imageFiles = files.filter((file) => file.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setMessage('Choose at least one image.');
        return;
      }

      const bytes = await createPdfFromImages(imageFiles);
      await saveOutput(bytes, 'images-to-pdf.pdf');
      setMessage(`Created PDF from ${imageFiles.length} image file${imageFiles.length === 1 ? '' : 's'}.`);
    });
  }

  async function runMerge(files: File[]) {
    await runSafely(async () => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        setMessage(validation.errors.join(' '));
        return;
      }

      const pdfFiles = files.filter((file) => file.type === 'application/pdf');
      if (pdfFiles.length < 2) {
        setMessage('Choose at least two PDFs to merge.');
        return;
      }

      const bytes = await mergePdfs(pdfFiles);
      await saveOutput(bytes, 'merged.pdf');
      setMessage(`Merged ${pdfFiles.length} PDF files.`);
    });
  }

  async function runSign(files: File[]) {
    await runSafely(async () => {
      const validation = validateFiles(files);
      if (!validation.valid) {
        setMessage(validation.errors.join(' '));
        return;
      }

      const [pdfFile] = files.filter((file) => file.type === 'application/pdf');
      if (!pdfFile) {
        setMessage('Choose one PDF to sign.');
        return;
      }

      const bytes = await signPdf(pdfFile, signature);
      await saveOutput(bytes, 'signed.pdf');
      setMessage('Signed the PDF on the first page.');
    });
  }

  async function saveOutput(bytes: Uint8Array, filename: string) {
    if (!saveDirectory) {
      downloadPdf(bytes, filename);
      return;
    }

    const fileHandle = await saveDirectory.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(new Blob([toArrayBuffer(bytes)], { type: 'application/pdf' }));
    await writable.close();
  }

  async function runSafely(action: () => Promise<void>) {
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The selected file could not be processed.');
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="app-title">
        <p className="eyebrow">Local-first document tools</p>
        <h1 id="app-title">Privacy PDF Toolbox</h1>
        <p className="lede">Create, merge, and sign PDFs in your browser. Files stay local by default.</p>
      </section>

      <section className="tool-grid" aria-label="PDF tools">
        <button className={tool === 'images' ? 'tool-card active' : 'tool-card'} type="button" onClick={() => changeTool('images')}>Images to PDF</button>
        <button className={tool === 'merge' ? 'tool-card active' : 'tool-card'} type="button" onClick={() => changeTool('merge')}>Merge PDFs</button>
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
        {tool === 'images' && (
          <label className="file-picker">
            Select images
            <input type="file" accept="image/png,image/jpeg" multiple onChange={(event) => selectFiles(event.currentTarget.files)} />
          </label>
        )}
        {tool === 'merge' && (
          <label className="file-picker">
            Select PDFs
            <input type="file" accept="application/pdf" multiple onChange={(event) => selectFiles(event.currentTarget.files)} />
          </label>
        )}
        {tool === 'sign' && (
          <div className="signing-panel">
            <label>
              Signature text
              <input value={signature} onChange={(event) => setSignature(event.target.value)} aria-label="Signature text" />
            </label>
            <label className="file-picker">
              Select PDF
              <input type="file" accept="application/pdf" onChange={(event) => selectFiles(event.currentTarget.files)} />
            </label>
          </div>
        )}
        {selectedFiles.length > 0 && (
          <section className="selected-files" aria-labelledby="selected-files-title">
            <h2 id="selected-files-title">Selected files</h2>
            <ol className="file-list">
              {selectedFiles.map((file, index) => (
                <li className="file-row" key={`${file.name}-${file.size}-${file.lastModified}-${index}`}>
                  <div className="file-meta">
                    <span className="file-name">{file.name}</span>
                    <span className="file-detail">{formatFileSize(file.size)} · {file.type || 'unknown type'}</span>
                  </div>
                  <div className="file-actions">
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Move ${file.name} up`}
                      disabled={index === 0}
                      onClick={() => moveFile(index, -1)}
                    >
                      Up
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      aria-label={`Move ${file.name} down`}
                      disabled={index === selectedFiles.length - 1}
                      onClick={() => moveFile(index, 1)}
                    >
                      Down
                    </button>
                    <button className="icon-button danger" type="button" aria-label={`Remove ${file.name}`} onClick={() => removeFile(index)}>
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
        <button className="primary-button" type="button" disabled={selectedFiles.length === 0} onClick={() => void runCurrentTool()}>
          Start processing
        </button>
        <p className="status">{message}</p>
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
