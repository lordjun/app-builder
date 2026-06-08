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
});
