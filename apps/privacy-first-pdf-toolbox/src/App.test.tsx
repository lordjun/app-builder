import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createPdfFromImages } from './pdf/imageToPdf';
import { downloadPdf } from './pdf/download';
import { getPdfPageCount } from './pdf/pdfPageCount';
import { optimizePdf } from './pdf/optimizePdf';
import { reorderPdf } from './pdf/reorderPdf';
import { signPdf } from './pdf/signPdf';
import { splitPdf } from './pdf/splitPdf';

vi.mock('./pdf/imageToPdf', () => ({
  createPdfFromImages: vi.fn(async () => new Uint8Array([1, 2, 3])),
}));

vi.mock('./pdf/download', () => ({
  downloadPdf: vi.fn(),
}));

vi.mock('./pdf/pdfPageCount', () => ({
  getPdfPageCount: vi.fn(async () => 4),
}));

vi.mock('./pdf/optimizePdf', () => ({
  optimizePdf: vi.fn(async () => ({
    bytes: new Uint8Array([13, 14, 15]),
    optimizedSize: 300,
    originalSize: 600,
  })),
}));

vi.mock('./pdf/reorderPdf', () => ({
  reorderPdf: vi.fn(async () => new Uint8Array([10, 11, 12])),
}));

vi.mock('./pdf/signPdf', () => ({
  signPdf: vi.fn(async () => new Uint8Array([4, 5, 6])),
}));

vi.mock('./pdf/splitPdf', () => ({
  splitPdf: vi.fn(async () => new Uint8Array([7, 8, 9])),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Reflect.deleteProperty(window, 'showDirectoryPicker');
  });

  it('renders the product name, privacy promise, and six tool entries', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Privacy PDF Toolbox' })).toBeInTheDocument();
    expect(screen.getByText(/Files stay local by default/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Images to PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge PDFs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Split PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reorder Pages' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Optimize PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign PDF' })).toBeInTheDocument();
  });

  it('shows short descriptions inside the tool cards', () => {
    render(<App />);

    expect(screen.getAllByText('Turn photos or scans into one PDF.').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Combine PDFs in the order shown.')).toBeInTheDocument();
    expect(screen.getByText('Keep only selected pages.')).toBeInTheDocument();
    expect(screen.getByText('Set a new page order.')).toBeInTheDocument();
    expect(screen.getByText('Rebuild and compare file size.')).toBeInTheDocument();
    expect(screen.getByText('Add text or handwritten signature.')).toBeInTheDocument();
  });

  it('renders the workbench navigation and active tool panel', () => {
    render(<App />);

    expect(screen.getByRole('navigation', { name: 'PDF tools' })).toBeInTheDocument();
    expect(screen.getByText('Active tool')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Images to PDF' })).toBeInTheDocument();
    expect(screen.getByLabelText('Product highlights')).toHaveTextContent('Browser-only processing');
    expect(screen.getByLabelText('Create tools')).toBeInTheDocument();
    expect(screen.getByLabelText('Organize tools')).toBeInTheDocument();
    expect(screen.getByText('Your source files stay on this device until the browser creates the output PDF.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));

    expect(screen.getByRole('heading', { name: 'Split PDF' })).toBeInTheDocument();
  });

  it('uses tool-specific primary action copy while keeping one confirmation action name', () => {
    render(<App />);

    expect(screen.getByRole('button', { name: 'Start processing' })).toHaveTextContent('Convert to PDF');
    expect(screen.getByText('0 files selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Merge PDFs' }));
    expect(screen.getByRole('button', { name: 'Start processing' })).toHaveTextContent('Merge PDFs');

    fireEvent.click(screen.getByRole('button', { name: 'Reorder Pages' }));
    expect(screen.getByRole('button', { name: 'Start processing' })).toHaveTextContent('Apply page order');
  });

  it('shows local processing and save destination status', () => {
    render(<App />);

    expect(screen.getByText('Files are processed in this browser tab, not uploaded to a server.')).toBeInTheDocument();
    expect(screen.getByText('Save destination: Downloads')).toBeInTheDocument();
  });

  it('links users to the feedback issue form', () => {
    render(<App />);

    const feedbackLink = screen.getByRole('link', { name: 'Send feedback' });

    expect(feedbackLink).toHaveAttribute('href', expect.stringContaining('https://github.com/lordjun/app-builder/issues/new'));
    expect(feedbackLink).toHaveAttribute('href', expect.stringContaining('labels=feedback'));
    expect(feedbackLink).toHaveAttribute('target', '_blank');
    expect(feedbackLink).toHaveAttribute('rel', 'noreferrer');
  });

  it('waits for explicit confirmation before processing selected files', async () => {
    render(<App />);

    const image = new File(['image'], 'scan.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Select images'), { target: { files: [image] } });

    expect(createPdfFromImages).not.toHaveBeenCalled();
    expect(downloadPdf).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    await waitFor(() => expect(createPdfFromImages).toHaveBeenCalledWith([image]));
    expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]), 'images-to-pdf.pdf');
  });

  it('accepts files dropped on the upload zone', () => {
    render(<App />);

    const image = new File(['image'], 'dropped-scan.png', { type: 'image/png' });
    fireEvent.drop(screen.getByLabelText('Image upload drop zone'), {
      dataTransfer: { files: [image] },
    });

    expect(screen.getByText('dropped-scan.png')).toBeInTheDocument();
    expect(screen.getByText('1 source file selected.')).toBeInTheDocument();
  });

  it('shows the current tool input requirements near the file picker', () => {
    render(<App />);

    expect(screen.getByText('Drop or choose PNG/JPEG images.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Merge PDFs' }));
    expect(screen.getByText('Drop or choose at least two PDF files.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    expect(screen.getByText('Drop or choose one PDF, then enter pages to keep.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Reorder Pages' }));
    expect(screen.getByText('Drop or choose one PDF, then enter the new page order.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Optimize PDF' }));
    expect(screen.getByText('Drop or choose one PDF to optimize and compare file size.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sign PDF' }));
    expect(screen.getByText('Drop or choose one PDF file.')).toBeInTheDocument();
  });

  it('disables processing and explains why when the selected files do not fit the tool', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Merge PDFs' }));
    fireEvent.change(screen.getByLabelText('Select PDFs'), {
      target: { files: [new File(['pdf'], 'only-one.pdf', { type: 'application/pdf' })] },
    });

    expect(screen.getByRole('button', { name: 'Start processing' })).toBeDisabled();
    expect(screen.getByText('Add at least two PDF files to merge.')).toBeInTheDocument();
  });

  it('shows the output filename and download destination after processing', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Select images'), {
      target: { files: [new File(['image'], 'scan.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    expect(await screen.findByText(/Saved images-to-pdf\.pdf through Downloads/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Process another batch' })).toBeInTheDocument();
  });

  it('clears completed files when starting another batch', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Select images'), {
      target: { files: [new File(['image'], 'scan.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Process another batch' }));

    expect(screen.queryByText('scan.png')).not.toBeInTheDocument();
    expect(screen.getByText('Choose source files, then start processing.')).toBeInTheDocument();
  });

  it('shows the selected folder destination after processing', async () => {
    const writable = {
      close: vi.fn(async () => undefined),
      write: vi.fn(async () => undefined),
    };
    const directoryHandle = {
      getFileHandle: vi.fn(async () => ({
        createWritable: vi.fn(async () => writable),
      })),
    };
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: vi.fn(async () => directoryHandle),
    });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Choose save folder' }));
    await waitFor(() => expect(window.showDirectoryPicker).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByLabelText('Select images'), {
      target: { files: [new File(['image'], 'scan.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    expect(await screen.findByText(/Saved images-to-pdf\.pdf to the selected folder/i)).toBeInTheDocument();
    expect(directoryHandle.getFileHandle).toHaveBeenCalledWith('images-to-pdf.pdf', { create: true });
  });

  it('shows processing state and prevents duplicate processing clicks', async () => {
    let finishProcessing: ((bytes: Uint8Array) => void) | undefined;
    vi.mocked(createPdfFromImages).mockImplementationOnce(async () => new Promise<Uint8Array>((resolve) => {
      finishProcessing = resolve;
    }));
    render(<App />);

    const image = new File(['image'], 'scan.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Select images'), { target: { files: [image] } });
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    const processingButton = await screen.findByRole('button', { name: 'Processing...' });
    expect(processingButton).toBeDisabled();

    fireEvent.click(processingButton);
    expect(createPdfFromImages).toHaveBeenCalledTimes(1);

    finishProcessing?.(new Uint8Array([7, 8, 9]));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Start processing' })).toBeEnabled());
    expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([7, 8, 9]), 'images-to-pdf.pdf');
  });

  it('explains how to recover from file validation errors', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Select images'), {
      target: { files: [new File([new Uint8Array(26 * 1024 * 1024)], 'large.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    expect(await screen.findByText(/Check your files/i)).toBeInTheDocument();
    expect(screen.getByText(/Choose different files and try again/i)).toBeInTheDocument();
  });

  it('explains how to recover from PDF processing errors', async () => {
    vi.mocked(createPdfFromImages).mockRejectedValueOnce(new Error('Image decoding failed.'));
    render(<App />);

    fireEvent.change(screen.getByLabelText('Select images'), {
      target: { files: [new File(['image'], 'scan.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    expect(await screen.findByText(/Processing failed/i)).toBeInTheDocument();
    expect(screen.getByText(/Try again with the same files, or choose different files/i)).toBeInTheDocument();
  });

  it('lets supported browsers choose a save folder before processing', async () => {
    const directoryHandle = {};
    Object.defineProperty(window, 'showDirectoryPicker', {
      configurable: true,
      value: vi.fn(async () => directoryHandle),
    });
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Choose save folder' }));

    await waitFor(() => expect(window.showDirectoryPicker).toHaveBeenCalledTimes(1));
    expect(screen.getByText('Save folder selected.')).toBeInTheDocument();
  });

  it('shows selected files and lets users remove one before processing', () => {
    render(<App />);

    const first = new File(['first'], 'first.png', { type: 'image/png' });
    const second = new File(['second'], 'second.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Select images'), { target: { files: [first, second] } });

    expect(screen.getByRole('heading', { name: 'Selected files' })).toBeInTheDocument();
    expect(screen.getByText('first.png')).toBeInTheDocument();
    expect(screen.getByText('second.png')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove first.png' }));

    expect(screen.queryByText('first.png')).not.toBeInTheDocument();
    expect(screen.getByText('second.png')).toBeInTheDocument();
  });

  it('uses compact file action icons while keeping accessible action names', () => {
    render(<App />);

    const first = new File(['first'], 'first.png', { type: 'image/png' });
    const second = new File(['second'], 'second.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Select images'), { target: { files: [first, second] } });

    expect(screen.getByRole('button', { name: 'Move second.png up' })).toHaveTextContent('^');
    expect(screen.getByRole('button', { name: 'Move first.png down' })).toHaveTextContent('v');
    expect(screen.getByRole('button', { name: 'Remove first.png' })).toHaveTextContent('x');
  });

  it('processes files in the user-adjusted order', async () => {
    render(<App />);

    const first = new File(['first'], 'first.png', { type: 'image/png' });
    const second = new File(['second'], 'second.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Select images'), { target: { files: [first, second] } });

    fireEvent.click(screen.getByRole('button', { name: 'Move second.png up' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    await waitFor(() => expect(createPdfFromImages).toHaveBeenCalledWith([second, first]));
  });

  it('shows handwritten signature controls and position choices', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign PDF' }));

    expect(screen.getByLabelText('Handwritten signature pad')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear signature' })).toBeInTheDocument();
    expect(screen.getByLabelText('Top left')).toBeInTheDocument();
    expect(screen.getByLabelText('Top right')).toBeInTheDocument();
    expect(screen.getByLabelText('Bottom left')).toBeInTheDocument();
    expect(screen.getByLabelText('Bottom right')).toBeChecked();
  });

  it('passes the selected text signature position to the PDF signer', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign PDF' }));
    fireEvent.change(screen.getByLabelText('Signature text'), { target: { value: 'Jane Doe' } });
    fireEvent.click(screen.getByLabelText('Top left'));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [new File(['pdf'], 'contract.pdf', { type: 'application/pdf' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    await waitFor(() => expect(signPdf).toHaveBeenCalledWith(expect.any(File), {
      type: 'text',
      text: 'Jane Doe',
      position: 'top-left',
    }));
    expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([4, 5, 6]), 'signed.pdf');
  });

  it('requires signature text or handwriting before signing a PDF', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Sign PDF' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [new File(['pdf'], 'contract.pdf', { type: 'application/pdf' })] },
    });

    expect(screen.getByRole('button', { name: 'Start processing' })).toBeDisabled();
    expect(screen.getByText('Add signature text or draw a signature.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Signature text'), { target: { value: 'Jane Doe' } });

    expect(screen.getByRole('button', { name: 'Start processing' })).toBeEnabled();
  });

  it('requires a page range before splitting a PDF while the page count is not known', () => {
    vi.mocked(getPdfPageCount).mockImplementationOnce(async () => new Promise<number>(() => undefined));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [new File(['pdf'], 'source.pdf', { type: 'application/pdf' })] },
    });

    expect(screen.getByRole('button', { name: 'Start processing' })).toBeDisabled();
    expect(screen.getByText('Enter pages to keep, such as 1-3,5.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pages to keep'), { target: { value: '1-3,5' } });

    expect(screen.getByRole('button', { name: 'Start processing' })).toBeEnabled();
  });

  it('prefills the full page range after selecting a PDF for splitting', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [new File(['pdf'], 'source.pdf', { type: 'application/pdf' })] },
    });

    await screen.findByText('This PDF has 4 pages.');

    expect(screen.getByLabelText('Pages to keep')).toHaveValue('1-4');
    expect(screen.getByRole('button', { name: 'Start processing' })).toBeEnabled();
  });

  it('shows the PDF page count after selecting a PDF for splitting', async () => {
    render(<App />);

    const source = new File(['pdf'], 'source.pdf', { type: 'application/pdf' });
    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [source] },
    });

    await waitFor(() => expect(getPdfPageCount).toHaveBeenCalledWith(source));
    expect(await screen.findByText('This PDF has 4 pages.')).toBeInTheDocument();
  });

  it('validates split page ranges before processing when the page count is known', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [new File(['pdf'], 'source.pdf', { type: 'application/pdf' })] },
    });
    await screen.findByText('This PDF has 4 pages.');

    fireEvent.change(screen.getByLabelText('Pages to keep'), { target: { value: '1-5' } });

    expect(screen.getByRole('button', { name: 'Start processing' })).toBeDisabled();
    expect(screen.getByText('Page 5 is outside this 4-page PDF.')).toBeInTheDocument();
  });

  it('splits a PDF after explicit confirmation', async () => {
    render(<App />);

    const source = new File(['pdf'], 'source.pdf', { type: 'application/pdf' });
    fireEvent.click(screen.getByRole('button', { name: 'Split PDF' }));
    fireEvent.change(screen.getByLabelText('Pages to keep'), { target: { value: '1-3,5' } });
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [source] },
    });

    expect(splitPdf).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    await waitFor(() => expect(splitPdf).toHaveBeenCalledWith(source, '1-3,5'));
    expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([7, 8, 9]), 'split.pdf');
  });

  it('requires a page order before reordering a PDF while the page count is not known', () => {
    vi.mocked(getPdfPageCount).mockImplementationOnce(async () => new Promise<number>(() => undefined));
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Reorder Pages' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [new File(['pdf'], 'source.pdf', { type: 'application/pdf' })] },
    });

    expect(screen.getByRole('button', { name: 'Start processing' })).toBeDisabled();
    expect(screen.getByText('Enter the new page order, such as 3,1,2.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('New page order'), { target: { value: '3,1,2' } });

    expect(screen.getByRole('button', { name: 'Start processing' })).toBeEnabled();
  });

  it('prefills the natural page order after selecting a PDF for reordering', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Reorder Pages' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [new File(['pdf'], 'source.pdf', { type: 'application/pdf' })] },
    });

    await screen.findByText('This PDF has 4 pages.');

    expect(screen.getByLabelText('New page order')).toHaveValue('1,2,3,4');
    expect(screen.getByRole('button', { name: 'Start processing' })).toBeEnabled();
  });

  it('shows the PDF page count after selecting a PDF for reordering', async () => {
    render(<App />);

    const source = new File(['pdf'], 'source.pdf', { type: 'application/pdf' });
    fireEvent.click(screen.getByRole('button', { name: 'Reorder Pages' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [source] },
    });

    await waitFor(() => expect(getPdfPageCount).toHaveBeenCalledWith(source));
    expect(await screen.findByText('This PDF has 4 pages.')).toBeInTheDocument();
  });

  it('validates reorder page order before processing when the page count is known', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Reorder Pages' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [new File(['pdf'], 'source.pdf', { type: 'application/pdf' })] },
    });
    await screen.findByText('This PDF has 4 pages.');

    fireEvent.change(screen.getByLabelText('New page order'), { target: { value: '1,2,2,4' } });

    expect(screen.getByRole('button', { name: 'Start processing' })).toBeDisabled();
    expect(screen.getByText('Page 2 appears more than once.')).toBeInTheDocument();
  });

  it('reorders a PDF after explicit confirmation', async () => {
    render(<App />);

    const source = new File(['pdf'], 'source.pdf', { type: 'application/pdf' });
    fireEvent.click(screen.getByRole('button', { name: 'Reorder Pages' }));
    fireEvent.change(screen.getByLabelText('New page order'), { target: { value: '3,1,2' } });
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [source] },
    });

    expect(reorderPdf).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    await waitFor(() => expect(reorderPdf).toHaveBeenCalledWith(source, '3,1,2'));
    expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([10, 11, 12]), 'reordered.pdf');
  });

  it('optimizes a PDF after explicit confirmation and reports size change', async () => {
    render(<App />);

    const source = new File(['pdf'], 'source.pdf', { type: 'application/pdf' });
    fireEvent.click(screen.getByRole('button', { name: 'Optimize PDF' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [source] },
    });

    expect(optimizePdf).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    await waitFor(() => expect(optimizePdf).toHaveBeenCalledWith(source));
    expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([13, 14, 15]), 'optimized.pdf');
    expect(await screen.findByText(/Optimized source\.pdf\. Size changed from 600 B to 300 B/i)).toBeInTheDocument();
  });

  it('explains when an optimized PDF output is larger than the original', async () => {
    vi.mocked(optimizePdf).mockResolvedValueOnce({
      bytes: new Uint8Array([16, 17, 18]),
      originalSize: 300,
      optimizedSize: 600,
    });

    render(<App />);

    const source = new File(['pdf'], 'source.pdf', { type: 'application/pdf' });
    fireEvent.click(screen.getByRole('button', { name: 'Optimize PDF' }));
    fireEvent.change(screen.getByLabelText('Select PDF'), {
      target: { files: [source] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    await waitFor(() => expect(optimizePdf).toHaveBeenCalledWith(source));
    expect(await screen.findByText(/Optimized source\.pdf\. Output is 600 B, larger than the original 300 B\. This PDF may already be optimized\./i)).toBeInTheDocument();
  });

  it('uses the custom output filename when processing files', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Output filename'), { target: { value: 'client/report:final' } });
    fireEvent.change(screen.getByLabelText('Select images'), {
      target: { files: [new File(['image'], 'scan.png', { type: 'image/png' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Start processing' }));

    await waitFor(() => expect(downloadPdf).toHaveBeenCalledWith(new Uint8Array([1, 2, 3]), 'client-report-final.pdf'));
  });
});
