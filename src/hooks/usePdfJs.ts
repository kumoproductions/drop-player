import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useRef, useState } from 'react';

/** Lazy-loaded pdfjs-dist module (dynamic import to avoid bundling when not used) */
let PdfjsModule: typeof import('pdfjs-dist') | null = null;
let pdfjsImportPromise: Promise<typeof import('pdfjs-dist') | null> | null =
  null;
let workerConfigured = false;

async function importPdfJs(
  workerSrc?: string,
  onError?: (error: Error) => void
): Promise<typeof import('pdfjs-dist') | null> {
  if (PdfjsModule) return PdfjsModule;
  if (pdfjsImportPromise) return pdfjsImportPromise;

  pdfjsImportPromise = import(/* webpackIgnore: true */ 'pdfjs-dist')
    .then(async (mod) => {
      if (!workerConfigured) {
        if (workerSrc) {
          mod.GlobalWorkerOptions.workerSrc = workerSrc;
        } else {
          try {
            const workerModule = await import(
              // @ts-expect-error pdfjs-dist worker module
              /* webpackIgnore: true */ 'pdfjs-dist/build/pdf.worker.min.mjs'
            );
            mod.GlobalWorkerOptions.workerSrc =
              workerModule.default ?? workerModule;
          } catch {
            // Fall back to no worker (main-thread parsing)
            mod.GlobalWorkerOptions.workerSrc = '';
          }
        }
        workerConfigured = true;
      }
      PdfjsModule = mod;
      pdfjsImportPromise = null;
      return mod;
    })
    .catch((error) => {
      const importError =
        error instanceof Error
          ? error
          : new Error('Failed to load pdfjs-dist module');
      console.warn('[drop-player] Failed to load pdfjs-dist:', importError);
      onError?.(importError);
      pdfjsImportPromise = null;
      return null;
    });

  return pdfjsImportPromise;
}

interface UsePdfJsOptions {
  src: string | null;
  enabled: boolean;
  workerSrc?: string;
  onError?: (error: Error) => void;
  onLoad?: () => void;
}

interface UsePdfJsReturn {
  pdfDocument: PDFDocumentProxy | null;
  totalPages: number;
  isAvailable: boolean;
  isLoaded: boolean;
}

export function usePdfJs(options: UsePdfJsOptions): UsePdfJsReturn {
  const { src, enabled, workerSrc, onError, onLoad } = options;

  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const onErrorRef = useRef(onError);
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onErrorRef.current = onError;
    onLoadRef.current = onLoad;
  });

  useEffect(() => {
    if (!enabled || !src) return;

    let destroyed = false;
    let doc: PDFDocumentProxy | null = null;

    const setup = async () => {
      const pdfjsLib = await importPdfJs(workerSrc, onErrorRef.current);
      if (!pdfjsLib || destroyed) return;

      setIsAvailable(true);

      try {
        doc = await pdfjsLib.getDocument(src).promise;
        if (destroyed) {
          doc.destroy();
          return;
        }
        setPdfDocument(doc);
        setTotalPages(doc.numPages);
        setIsLoaded(true);
        onLoadRef.current?.();
      } catch (error) {
        if (destroyed) return;
        const loadError =
          error instanceof Error
            ? error
            : new Error('Failed to load PDF document');
        loadError.name = 'errorNetwork';
        onErrorRef.current?.(loadError);
      }
    };

    setup();

    return () => {
      destroyed = true;
      if (doc) {
        doc.destroy();
      }
      setPdfDocument(null);
      setTotalPages(0);
      setIsLoaded(false);
    };
  }, [src, enabled, workerSrc]);

  return { pdfDocument, totalPages, isAvailable, isLoaded };
}
