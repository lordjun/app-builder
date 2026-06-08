import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createPdfFromImages } from './pdf/imageToPdf';
import { downloadPdf } from './pdf/download';
import { signPdf } from './pdf/signPdf';

vi.mock('./pdf/imageToPdf', () => ({
  createPdfFromImages: vi.fn(async () => new Uint8Array([1, 2, 3])),
}));

vi.mock('./pdf/download', () => ({
  downloadPdf: vi.fn(),
}));

vi.mock('./pdf/signPdf', () => ({
  signPdf: vi.fn(async () => new Uint8Array([4, 5, 6])),
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Reflect.deleteProperty(window, 'showDirectoryPicker');
  });

  it('renders the product name, privacy promise, and three tool entries', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Privacy PDF Toolbox' })).toBeInTheDocument();
    expect(screen.getByText(/Files stay local by default/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Images to PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Merge PDFs' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign PDF' })).toBeInTheDocument();
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
