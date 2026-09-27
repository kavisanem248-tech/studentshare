import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  FileText,
  AlertCircle,
  Loader2,
  Presentation,
  CheckCircle2,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import { Material } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface DocumentReaderProps {
  material: Material;
  previewUrl: string;
  onDownload: () => void;
  className?: string;
}

interface PptxSlide {
  slideNum: number;
  title: string;
  bullets: string[];
}

export const DocumentReader: React.FC<DocumentReaderProps> = ({
  material,
  previewUrl,
  onDownload,
  className = '',
}) => {
  const fileType = material.fileType.toLowerCase();
  const isPdf = fileType === 'pdf';
  const isDocx = fileType === 'docx';
  const isPptx = fileType === 'pptx';

  // Common viewer states
  const [zoom, setZoom] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // PDF states
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});
  const renderTasksRef = useRef<{ [key: number]: any }>({});
  const [useIframeFallback, setUseIframeFallback] = useState<boolean>(false);

  // DOCX states
  const [docxHtml, setDocxHtml] = useState<string>('');

  // PPTX states
  const [pptxSlides, setPptxSlides] = useState<PptxSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Load document content based on type
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setUseIframeFallback(false);

    async function loadDocument() {
      try {
        if (isPdf) {
          try {
            const loadingTask = pdfjsLib.getDocument({
              url: previewUrl,
              withCredentials: true,
            });
            const loadedDoc = await loadingTask.promise;
            if (isCancelled) return;
            setPdfDoc(loadedDoc);
            setNumPages(loadedDoc.numPages);
            setCurrentPage(1);
          } catch (pdfErr: any) {
            console.warn('pdfjs-dist render failed, falling back to browser embedded viewer:', pdfErr);
            if (!isCancelled) {
              setUseIframeFallback(true);
            }
          }
        } else if (isDocx) {
          const res = await fetch(previewUrl, { credentials: 'include' });
          if (!res.ok) throw new Error(`Failed to stream DOCX file (HTTP ${res.status})`);
          const arrayBuffer = await res.arrayBuffer();
          if (isCancelled) return;

          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocxHtml(result.value);
        } else if (isPptx) {
          const res = await fetch(previewUrl, { credentials: 'include' });
          if (!res.ok) throw new Error(`Failed to stream PPTX file (HTTP ${res.status})`);
          const arrayBuffer = await res.arrayBuffer();
          if (isCancelled) return;

          const zip = await JSZip.loadAsync(arrayBuffer);
          const slides: PptxSlide[] = [];

          // Find slide files in ppt/slides/
          const slideFiles = Object.keys(zip.files).filter(
            (fileName) => fileName.startsWith('ppt/slides/slide') && fileName.endsWith('.xml')
          );

          // Sort naturally by slide number
          slideFiles.sort((a, b) => {
            const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
            const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
            return numA - numB;
          });

          const parser = new DOMParser();

          for (let i = 0; i < slideFiles.length; i++) {
            const file = zip.files[slideFiles[i]];
            const textContent = await file.async('string');
            const xmlDoc = parser.parseFromString(textContent, 'application/xml');

            // Extract text paragraphs
            const textElements = xmlDoc.getElementsByTagName('a:t');
            const allTexts: string[] = [];
            for (let j = 0; j < textElements.length; j++) {
              const text = textElements[j].textContent?.trim();
              if (text) allTexts.push(text);
            }

            const title = allTexts.length > 0 ? allTexts[0] : `Slide ${i + 1}`;
            const bullets = allTexts.length > 1 ? allTexts.slice(1) : [];

            slides.push({
              slideNum: i + 1,
              title,
              bullets,
            });
          }

          if (slides.length === 0) {
            slides.push({
              slideNum: 1,
              title: material.title,
              bullets: ['Presentation slides loaded from uploaded deck.'],
            });
          }

          setPptxSlides(slides);
          setCurrentSlideIndex(0);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Document load error:', err);
          setError(err.message || 'Failed to render document preview.');
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    loadDocument();

    return () => {
      isCancelled = true;
      // Cancel active renders
      Object.values(renderTasksRef.current).forEach((task) => {
        try {
          task?.cancel?.();
        } catch {
          // ignore
        }
      });
    };
  }, [previewUrl, isPdf, isDocx, isPptx, material.title]);

  // Render PDF pages on canvas
  useEffect(() => {
    const activeDoc = pdfDoc;
    if (!activeDoc || useIframeFallback) return;

    let isMounted = true;

    async function renderPage(pageNum: number) {
      try {
        if (!activeDoc) return;
        const canvas = canvasRefs.current[pageNum];
        if (!canvas) return;

        // Cancel previous render on this page if running
        if (renderTasksRef.current[pageNum]) {
          try {
            renderTasksRef.current[pageNum].cancel();
          } catch {
            // ignore
          }
        }

        const page = await activeDoc.getPage(pageNum);
        if (!isMounted) return;

        const baseScale = (zoom / 100) * 1.5; // High resolution rendering
        const viewport = page.getViewport({ scale: baseScale });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Set CSS display width for crisp high-DPI
        canvas.style.width = `${viewport.width / 1.5}px`;
        canvas.style.height = `${viewport.height / 1.5}px`;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
          canvas: canvas,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current[pageNum] = renderTask;
        await renderTask.promise;
      } catch (renderErr: any) {
        if (renderErr?.name !== 'RenderingCancelledException') {
          console.warn(`Render error on page ${pageNum}:`, renderErr);
        }
      }
    }

    // Render all pages for continuous scrolling
    for (let p = 1; p <= numPages; p++) {
      renderPage(p);
    }

    return () => {
      isMounted = false;
    };
  }, [pdfDoc, zoom, numPages, useIframeFallback]);

  // Handle scroll detection for current page indicator
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!isPdf || numPages <= 1) return;
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;

    // Approximate which page is currently in view
    let foundPage = 1;
    for (let p = 1; p <= numPages; p++) {
      const el = canvasRefs.current[p]?.parentElement;
      if (el) {
        const top = el.offsetTop - target.offsetTop;
        if (scrollTop >= top - 200) {
          foundPage = p;
        }
      }
    }
    setCurrentPage(foundPage);
  };

  const scrollToPage = (targetPage: number) => {
    const pageNum = Math.max(1, Math.min(targetPage, numPages));
    setCurrentPage(pageNum);
    const canvasEl = canvasRefs.current[pageNum];
    if (canvasEl) {
      canvasEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleZoomIn = () => setZoom((z) => Math.min(z + 25, 200));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 25, 50));
  const handleZoomReset = () => setZoom(100);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(console.warn);
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(console.warn);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`bg-slate-900 rounded-3xl border border-slate-800 shadow-xl flex flex-col overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[80vh]'
      } ${className}`}
    >
      {/* Top Document Viewer Control Bar */}
      <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 font-mono text-[10px] font-bold uppercase tracking-wider border border-indigo-500/20">
            {material.fileType} Reader
          </span>

          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            {material.fileName}
          </span>
        </div>

        {/* Reader Navigation & Zoom Controls */}
        <div className="flex items-center gap-2">
          {/* PDF Page Navigation */}
          {isPdf && !useIframeFallback && numPages > 0 && (
            <div className="flex items-center bg-slate-800/80 rounded-xl px-2 py-1 border border-slate-700/60 text-xs">
              <button
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-xs text-slate-200">
                Page {currentPage} / {numPages}
              </span>
              <button
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* PPTX Slide Navigation */}
          {isPptx && pptxSlides.length > 0 && (
            <div className="flex items-center bg-slate-800/80 rounded-xl px-2 py-1 border border-slate-700/60 text-xs">
              <button
                onClick={() => setCurrentSlideIndex((i) => Math.max(i - 1, 0))}
                disabled={currentSlideIndex <= 0}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition"
                title="Previous Slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-xs text-slate-200">
                Slide {currentSlideIndex + 1} / {pptxSlides.length}
              </span>
              <button
                onClick={() => setCurrentSlideIndex((i) => Math.min(i + 1, pptxSlides.length - 1))}
                disabled={currentSlideIndex >= pptxSlides.length - 1}
                className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition"
                title="Next Slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Zoom In / Zoom Out Controls */}
          <div className="flex items-center bg-slate-800/80 rounded-xl px-1.5 py-1 border border-slate-700/60 text-xs">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 50}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomReset}
              className="px-2 font-mono text-xs text-slate-200 hover:text-indigo-400 transition"
              title="Reset Zoom to 100%"
            >
              {zoom}%
            </button>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 200}
              className="p-1 text-slate-300 hover:text-white disabled:opacity-30 rounded transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Document Reading Canvas */}
      <div
        className="flex-1 bg-slate-950/80 overflow-auto p-4 sm:p-6 flex flex-col items-center custom-scrollbar relative"
        onScroll={handleScroll}
      >
        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs z-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-xs text-slate-300 font-medium">Rendering document stream...</p>
          </div>
        )}

        {/* Error State */}
        {error ? (
          <div className="my-auto text-center p-8 bg-slate-900 border border-slate-800 rounded-3xl max-w-md space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <div>
              <h4 className="text-base font-bold text-white">Document Preview Error</h4>
              <p className="text-xs text-slate-400 mt-1">{error}</p>
            </div>
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md transition"
            >
              Download File Instead
            </button>
          </div>
        ) : isPdf ? (
          useIframeFallback ? (
            /* Fallback to browser embedded PDF viewer */
            <div className="w-full h-full rounded-2xl overflow-hidden bg-white shadow-2xl">
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=1`}
                title={material.title}
                className="w-full h-full border-none"
              />
            </div>
          ) : (
            /* Real PDF Canvas Reader (Continuous Scroll with all pages) */
            <div
              className="space-y-6 flex flex-col items-center transition-all duration-150 origin-top pb-12"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              {Array.from({ length: numPages }, (_, index) => {
                const pageNum = index + 1;
                return (
                  <div
                    key={pageNum}
                    className="relative bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-800/20 group"
                  >
                    <canvas
                      ref={(el) => (canvasRefs.current[pageNum] = el)}
                      className="block max-w-full"
                    />
                    <div className="absolute bottom-2 right-3 text-[10px] text-slate-400 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded border border-slate-200 font-mono shadow-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      Page {pageNum} of {numPages}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : isDocx ? (
          /* Real DOCX Document Reader */
          <div
            className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 space-y-6 transition-all duration-150 my-4"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            <div className="border-b border-slate-200 pb-4 mb-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
                <FileText className="w-4 h-4" />
                <span>Word Document Reader</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{material.title}</h1>
              <p className="text-xs text-slate-500 mt-1">
                {material.subject} • {material.unit} • Uploaded by {material.uploaderName || 'Student'}
              </p>
            </div>

            {docxHtml ? (
              <div
                className="prose prose-slate max-w-none text-sm leading-relaxed docx-preview-content space-y-4 text-slate-800"
                dangerouslySetInnerHTML={{ __html: docxHtml }}
              />
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                No previewable text content found in document.
              </div>
            )}
          </div>
        ) : isPptx ? (
          /* Real PPTX Presentation Reader */
          <div
            className="w-full max-w-3xl flex flex-col items-center gap-4 transition-all duration-150 my-4"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
          >
            {pptxSlides.length > 0 && pptxSlides[currentSlideIndex] ? (
              <div className="w-full aspect-[16/10] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl shadow-2xl p-8 sm:p-12 flex flex-col justify-between border border-indigo-900/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Slide Header */}
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2">
                    <Presentation className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-300">
                      Slide {currentSlideIndex + 1} of {pptxSlides.length}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">{material.subject}</span>
                </div>

                {/* Slide Body */}
                <div className="py-6 space-y-4 my-auto">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                    {pptxSlides[currentSlideIndex].title}
                  </h2>

                  {pptxSlides[currentSlideIndex].bullets.length > 0 && (
                    <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
                      {pptxSlides[currentSlideIndex].bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-indigo-400 font-bold mt-0.5">•</span>
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Slide Footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-3">
                  <span>StudentShare Presentation Reader</span>
                  <span>{material.title}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-slate-400 text-xs py-12">
                No presentation slides extracted.
              </div>
            )}

            {/* Slide Quick Picker Thumbnails */}
            {pptxSlides.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto max-w-full p-2 bg-slate-900/60 rounded-2xl border border-slate-800">
                {pptxSlides.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlideIndex(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-semibold transition ${
                      idx === currentSlideIndex
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Slide {idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* General file types */
          <div className="my-auto text-center p-8 bg-slate-900 rounded-3xl border border-slate-800 max-w-md space-y-3">
            <FileText className="w-12 h-12 text-indigo-400 mx-auto" />
            <h4 className="text-base font-bold text-white">{material.fileName}</h4>
            <p className="text-xs text-slate-400">
              Preview is ready. You can view the document directly or download a copy.
            </p>
            <button
              onClick={onDownload}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Download File
            </button>
          </div>
        )}
      </div>

      {/* Reader Bottom Bar */}
      <div className="px-6 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Real-time In-App Document Stream</span>
        </div>

        <span>Viewing this document does not count toward download limits</span>
      </div>
    </div>
  );
};
