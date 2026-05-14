
'use client';

import React, { useEffect, useState } from "react"; 
import { motion, AnimatePresence, PanInfo } from "framer-motion"; 
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageData { 
    id: string; 
    title: string; 
    url: string; 
    fullResUrl?: string; 
}

interface ImageViewerModalProps { 
    isOpen: boolean;
    onClose: () => void;
    initialImage: ImageData;
    imageList: ImageData[];
}

const getFileIdFromUrl = (url: string | undefined): string | null => { 
    if (!url) return null; 
    const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{28,})/); 
    return match ? match[1] : null; 
};

const getPreviewUrl = (url: string | undefined): string | null => { 
    const fileId = getFileIdFromUrl(url); 
    return fileId ? `https://lh3.googleusercontent.com/d/${fileId}` : (url || null);
};

const getDownloadUrl = (url: string | undefined): string | null => { 
    const fileId = getFileIdFromUrl(url); 
    return fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : (url || null);
};


const ImageWithLoader: React.FC<{ src: string; alt: string }> = ({ src, alt }) => { 
    const [loaded, setLoaded] = useState(false); 
    const [error, setError] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setError(false);
    }, [src]);

    return ( 
        <div className="relative h-full w-full flex justify-center items-center"> 
            {!loaded && !error && <Loader2 className="h-8 w-8 animate-spin text-primary" />} 
            {error && <div className="text-sm text-destructive text-center p-4">Gagal memuat gambar. Pastikan file dapat diakses publik.</div>} 
            <img 
                src={src} 
                alt={alt} 
                onLoad={() => setLoaded(true)} 
                onError={() => setError(true)} 
                className={cn(
                    'max-h-full max-w-full object-contain transition-opacity duration-300',
                    loaded && !error ? 'opacity-100' : 'opacity-0'
                )}
            /> 
        </div> 
    ); 
};

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ isOpen, onClose, initialImage, imageList }) => { 
    const [currentIndex, setCurrentIndex] = useState(() => imageList.findIndex(img => img.id === initialImage.id));
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        const newIndex = imageList.findIndex(img => img.id === initialImage.id);
        if (newIndex !== -1) {
            setCurrentIndex(newIndex);
        }
    }, [initialImage, imageList]);

    const currentImage = imageList[currentIndex];
    
    const previewUrl = getPreviewUrl(currentImage?.url); 
    const downloadUrl = getDownloadUrl(currentImage?.url); 

    const goToNext = (e?: React.SyntheticEvent) => {
        e?.stopPropagation();
        setDirection(1);
        setCurrentIndex((prevIndex) => (prevIndex + 1) % imageList.length);
    };

    const goToPrevious = (e?: React.SyntheticEvent) => {
        e?.stopPropagation();
        setDirection(-1);
        setCurrentIndex((prevIndex) => (prevIndex - 1 + imageList.length) % imageList.length);
    };
    
    useEffect(() => { 
        const handleKeyDown = (e: KeyboardEvent) => { 
            if (e.key === "Escape") onClose(); 
            if (e.key === "ArrowRight") goToNext();
            if (e.key === "ArrowLeft") goToPrevious();
        }; 
        window.addEventListener("keydown", handleKeyDown); 
        return () => window.removeEventListener("keydown", handleKeyDown); 
    }, [onClose, currentIndex]); 

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const swipeThreshold = 50;
        if (info.offset.x > swipeThreshold) {
            goToPrevious();
        } else if (info.offset.x < -swipeThreshold) {
            goToNext();
        }
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0
        })
    };

    if (!isOpen || !currentImage) return null;

    return ( 
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col p-4" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    onClick={onClose}
                > 
                    <div className="flex-shrink-0 w-full z-10 p-2 text-center">
                        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="absolute top-4 right-4 text-white hover:bg-white/20 hover:text-white rounded-full bg-black/20">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Image and Navigation */}
                    <div 
                        className="flex-grow flex items-center justify-center relative h-full w-full min-h-0"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Desktop Arrow Buttons */}
                        {imageList.length > 1 && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={goToPrevious}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 rounded-full h-12 w-12 bg-black/20 hover:bg-black/40 text-white hidden sm:flex"
                                >
                                <ArrowLeft className="h-6 w-6" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={goToNext}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 rounded-full h-12 w-12 bg-black/20 hover:bg-black/40 text-white hidden sm:flex"
                                >
                                    <ArrowRight className="h-6 w-6" />
                                </Button>
                            </>
                        )}
                        
                        <AnimatePresence initial={false} custom={direction}>
                             <motion.div
                                key={currentIndex}
                                custom={direction}
                                variants={variants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{
                                    x: { type: "spring", stiffness: 300, damping: 30 },
                                    opacity: { duration: 0.2 }
                                }}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.2}
                                onDragEnd={handleDragEnd}
                                className="h-full w-full flex items-center justify-center absolute"
                            >
                                {previewUrl ? (
                                    <ImageWithLoader src={previewUrl} alt={currentImage.title} />
                                ) : (
                                    <div className="text-sm text-destructive text-center p-4">URL gambar tidak valid.</div>
                                )}
                             </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex-shrink-0 w-full mt-4 flex justify-center z-10">
                         <div className="flex items-center gap-4 p-2 bg-black/20 rounded-full backdrop-blur-sm">
                             {downloadUrl && (
                                <a href={downloadUrl} download target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" aria-label="Download" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                                        <Download className="h-5 w-5" />
                                    </Button>
                                </a>
                             )}
                              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" className="text-white hover:bg-white/20 hover:text-white rounded-full">
                                <X className="h-5 w-5" />
                            </Button>
                         </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    ); 
};
