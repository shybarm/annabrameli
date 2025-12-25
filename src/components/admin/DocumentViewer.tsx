import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Download, RotateCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Document {
  id: string;
  title: string;
  file_path: string;
  mime_type: string | null;
  created_at: string;
}

interface DocumentViewerProps {
  documents: Document[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ documents, initialIndex = 0, isOpen, onClose }: DocumentViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  const currentDoc = documents[currentIndex];

  const getDocumentUrl = async (filePath: string) => {
    if (imageUrls[filePath]) return imageUrls[filePath];
    
    const { data } = await supabase.storage
      .from('patient-documents')
      .createSignedUrl(filePath, 3600);
    
    if (data?.signedUrl) {
      setImageUrls(prev => ({ ...prev, [filePath]: data.signedUrl }));
      return data.signedUrl;
    }
    return '';
  };

  const handlePrev = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : documents.length - 1));
    setZoom(1);
    setRotation(0);
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < documents.length - 1 ? prev + 1 : 0));
    setZoom(1);
    setRotation(0);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  const handleDownload = async () => {
    if (!currentDoc) return;
    const url = await getDocumentUrl(currentDoc.file_path);
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = currentDoc.title;
      link.click();
    }
  };

  const isImage = currentDoc?.mime_type?.startsWith('image/');
  const isPdf = currentDoc?.mime_type === 'application/pdf';

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-4">
            <DialogTitle className="text-lg">
              {currentDoc?.title || 'מסמך'}
            </DialogTitle>
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {documents.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleZoomOut} title="הקטן">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn} title="הגדל">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRotate} title="סובב">
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload} title="הורד">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative overflow-hidden bg-muted/30">
          {/* Navigation buttons */}
          {documents.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
                onClick={handlePrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 rounded-full shadow-lg"
                onClick={handleNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </>
          )}

          {/* Document content */}
          <ScrollArea className="h-full w-full">
            <div className="min-h-full flex items-center justify-center p-8">
              <DocumentContent
                doc={currentDoc}
                getDocumentUrl={getDocumentUrl}
                zoom={zoom}
                rotation={rotation}
                isImage={isImage}
                isPdf={isPdf}
              />
            </div>
          </ScrollArea>
        </div>

        {/* Thumbnail strip */}
        {documents.length > 1 && (
          <div className="border-t p-3 shrink-0 bg-background">
            <ScrollArea className="w-full">
              <div className="flex gap-2">
                {documents.map((doc, index) => (
                  <ThumbnailButton
                    key={doc.id}
                    doc={doc}
                    isActive={index === currentIndex}
                    onClick={() => {
                      setCurrentIndex(index);
                      setZoom(1);
                      setRotation(0);
                    }}
                    getDocumentUrl={getDocumentUrl}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DocumentContent({
  doc,
  getDocumentUrl,
  zoom,
  rotation,
  isImage,
  isPdf,
}: {
  doc: Document | undefined;
  getDocumentUrl: (path: string) => Promise<string>;
  zoom: number;
  rotation: number;
  isImage: boolean;
  isPdf: boolean;
}) {
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (doc) {
      setLoading(true);
      setUrl('');
      getDocumentUrl(doc.file_path).then(u => {
        setUrl(u);
        setLoading(false);
      });
    }
  }, [doc?.file_path]);

  if (!doc) {
    return <p className="text-muted-foreground">אין מסמך להצגה</p>;
  }

  if (loading || !url) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (isImage) {
    return (
      <img
        src={url}
        alt={doc.title}
        className="max-w-full transition-transform duration-200"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transformOrigin: 'center center',
        }}
      />
    );
  }

  if (isPdf) {
    return (
      <iframe
        src={url}
        className="w-full h-[70vh] border-0 rounded-lg"
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
        }}
        title={doc.title}
      />
    );
  }

  // For other file types, show download option
  return (
    <div className="text-center space-y-4">
      <p className="text-muted-foreground">
        לא ניתן להציג את הקובץ ישירות
      </p>
      <Button onClick={() => window.open(url, '_blank')}>
        <Download className="h-4 w-4 ml-2" />
        הורד קובץ
      </Button>
    </div>
  );
}

function ThumbnailButton({
  doc,
  isActive,
  onClick,
  getDocumentUrl,
}: {
  doc: Document;
  isActive: boolean;
  onClick: () => void;
  getDocumentUrl: (path: string) => Promise<string>;
}) {
  const [url, setUrl] = useState<string>('');
  const isImage = doc.mime_type?.startsWith('image/');

  useEffect(() => {
    if (isImage) {
      getDocumentUrl(doc.file_path).then(setUrl);
    }
  }, [doc.file_path, isImage]);

  return (
    <button
      onClick={onClick}
      className={`
        w-16 h-16 rounded-lg border-2 overflow-hidden shrink-0 transition-all
        ${isActive ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'}
      `}
    >
      {isImage && url ? (
        <img src={url} alt={doc.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted text-xs text-muted-foreground p-1">
          {doc.title.slice(0, 8)}
        </div>
      )}
    </button>
  );
}
