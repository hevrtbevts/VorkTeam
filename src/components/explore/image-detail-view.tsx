'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Download, Share2, AlertTriangle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface ImageData {
  id: string;
  title: string;
  url: string;
  source?: string;
}

// Using a reliable image proxy to handle CORS and formatting issues
const getProxiedUrl = (url: string | undefined): string => {
    if (!url) return '';
    // For Google Drive links, we need to ensure we use a direct-ish link for the proxy
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
        // Construct a known good URL format for google user content before proxying
        const gdriveUrl = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
        return `https://images.weserv.nl/?url=${encodeURIComponent(gdriveUrl)}`;
    }
    // For other URLs, proxy them directly
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
};


const getThumbnailUrl = (url: string | undefined): string => {
    if (!url) return '';
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}`;
    }
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=200&h=200&fit=cover`;
};

const MainImage = ({ src, alt }: { src: string; alt: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  
  useEffect(() => {
    setIsLoaded(false);
    setIsError(false);
  }, [src]);

  return (
    <div className="w-full aspect-square relative bg-muted/30 rounded-lg flex items-center justify-center">
      {!isLoaded && !isError && <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />}
      {isError && (
        <div className="text-center text-destructive p-4 flex flex-col items-center gap-2">
            <AlertTriangle className="w-8 h-8" />
            <p className="text-sm font-semibold">Gagal memuat gambar</p>
            <p className="text-xs">Link mungkin rusak atau memerlukan izin.</p>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
            'w-full h-full object-contain transition-opacity duration-300', 
            isLoaded && !isError ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setIsError(true)}
        crossOrigin="anonymous"
      />
    </div>
  );
};

const RelatedImagesGrid = ({ images, onSelect, currentImageId }: { images: ImageData[]; onSelect: (image: ImageData) => void; currentImageId: string; }) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
      {images.map(img => (
        <button key={img.id} onClick={() => onSelect(img)} className={cn(
            "w-full aspect-square bg-muted/50 rounded-md overflow-hidden relative transition-all",
             img.id === currentImageId && "ring-2 ring-primary ring-offset-2 ring-offset-background"
             )}>
          <img src={getThumbnailUrl(img.url)} alt={img.title} className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
        </button>
      ))}
    </div>
);

interface ImageDetailViewProps {
    image: ImageData;
    imageList: ImageData[];
    onBack: () => void;
    onSelectImage: (image: ImageData) => void;
}

export function ImageDetailView({ image, imageList, onBack, onSelectImage }: ImageDetailViewProps) {
  const [mainImage, setMainImage] = useState(image);

  useEffect(() => {
    setMainImage(image);
  }, [image]);

  const proxiedUrl = getProxiedUrl(mainImage.url);

  const handleDownload = async () => {
    if (!proxiedUrl) {
      toast.error('URL gambar tidak valid.');
      return;
    }
    toast.info('Mengunduh gambar...');
    try {
      const response = await fetch(proxiedUrl);
      if (!response.ok) throw new Error(`Gagal mengambil gambar: ${response.statusText}`);
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const fileName = (mainImage.title.replace(/[^a-zA-Z0-9\s]/g, '') || 'image') + '.jpg';
      link.href = url;
      link.download = fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Gambar berhasil diunduh!');
    } catch (error) {
      console.error('Gagal mengunduh gambar:', error);
      window.open(proxiedUrl, '_blank');
      toast.error('Gagal mengunduh otomatis. Coba simpan manual dari tab baru.');
    }
  };

  const handleShare = async () => {
    if (!proxiedUrl) {
      toast.error("URL Gambar tidak valid.");
      return;
    }

    if (!navigator.share) {
      toast.error("Fitur berbagi tidak didukung di browser ini. Link disalin.");
      navigator.clipboard.writeText(mainImage.url);
      return;
    }

    try {
      toast.info("Mempersiapkan gambar untuk dibagikan...");
      const response = await fetch(proxiedUrl);
      const blob = await response.blob();
      const file = new File([blob], 'image.jpg', { type: blob.type });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: mainImage.title,
          text: `Lihat gambar ini: ${mainImage.title}`,
        });
      } else {
        await navigator.share({
            title: mainImage.title,
            text: `Lihat gambar ini: ${mainImage.title}`,
            url: mainImage.url, // Share original URL as fallback
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Gagal membagikan:', error);
        toast.error("Gagal membagikan. Mencoba membagikan link...");
        try {
            await navigator.share({
                title: mainImage.title,
                url: mainImage.url,
            });
        } catch (fallbackError: any) {
            if (fallbackError.name !== 'AbortError') {
                toast.error("Berbagi link juga gagal. Link disalin ke clipboard.");
                navigator.clipboard.writeText(mainImage.url);
            }
        }
      }
    }
  };


  return (
    <div className="w-full space-y-4">
      <header className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft />
        </Button>
      </header>

      <AnimatePresence mode="wait">
        <motion.div
            key={mainImage.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
        >
            <MainImage src={proxiedUrl} alt={mainImage.title} />
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-around bg-card p-2 rounded-full shadow-sm border">
        <Button variant="ghost" onClick={handleDownload} className="flex flex-col h-auto p-2 text-muted-foreground hover:bg-transparent hover:text-foreground">
            <Download className="h-5 w-5 mb-1"/>
            <span className="text-xs">Unduh</span>
        </Button>
         <Button variant="ghost" onClick={handleShare} className="flex flex-col h-auto p-2 text-muted-foreground hover:bg-transparent hover:text-foreground">
            <Share2 className="h-5 w-5 mb-1"/>
            <span className="text-xs">Bagikan</span>
        </Button>
      </div>

      {imageList.length > 1 && (
          <div className="space-y-3 pt-4">
            <h2 className="text-sm font-semibold text-center text-muted-foreground">Gambar Terkait</h2>
            <RelatedImagesGrid images={imageList} onSelect={onSelectImage} currentImageId={mainImage.id} />
          </div>
      )}
    </div>
  );
}
