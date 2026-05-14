
'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ImageData } from '@/components/explore/image-detail-view';

// Single Image component to handle errors and lazy loading
const GridImage = ({ image, onClick }: { image: any, onClick: () => void }) => {
  const [isError, setIsError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isInView, setIsInView] = useState(false);

  const proxiedUrl = useMemo(() => `https://images.weserv.nl/?url=${encodeURIComponent(image.url)}&w=300&h=300&fit=cover&a=attention`, [image.url]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if(imgRef.current) observer.unobserve(imgRef.current);
        }
      },
      { rootMargin: "100px" }
    );
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    return () => {
      if(imgRef.current) observer.unobserve(imgRef.current);
    };
  }, []);


  if (isError) {
    return null; // Don't render anything if the image fails to load
  }

  return (
    <motion.div
      ref={imgRef as any}
      onClick={onClick}
      className="w-full cursor-pointer relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      layout
    >
      {!isLoaded && <Skeleton className="absolute inset-0 w-full h-full rounded-md" />}
      {isInView && (
        <img
          src={proxiedUrl}
          alt={image.title || 'Image'}
          className={cn(
            'w-full h-full object-cover rounded-md shadow-sm hover:shadow-lg transition-all duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0'
          )}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => setIsError(true)}
        />
      )}
    </motion.div>
  );
};


export default function TabGambar({ search, onImageClick }: { search: string, onImageClick: (image: ImageData, imageList: ImageData[]) => void }) {
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchImages = async () => {
        setLoading(true);
        setImages([]);

        try {
          // Fetch page 1 first
          const res1 = await fetch(`https://google.serper.dev/images`, {
            method: 'POST',
            headers: {
              'X-API-KEY': 'fa9a2011ce5faf0f443a13a220452a38e331c458',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: search, page: 1 })
          });
          const data1 = res1.ok ? await res1.json() : { images: [] };

          // Then fetch page 2
          const res2 = await fetch(`https://google.serper.dev/images`, {
            method: 'POST',
            headers: {
              'X-API-KEY': 'fa9a2011ce5faf0f443a13a220452a38e331c458',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ q: search, page: 2 })
          });
          const data2 = res2.ok ? await res2.json() : { images: [] };
          
          const combinedImages = [...(data1.images || []), ...(data2.images || [])];

          const newImages = combinedImages.map((img: any, index: number) => ({
            id: `${img.imageUrl}-${index}`, // Create a robust unique ID using URL and index
            url: img.imageUrl,
            title: img.title,
            source: img.source,
          }));

          setImages(newImages);

        } catch (error) {
          console.error("Failed to fetch images:", error);
          setImages([]);
        } finally {
          setLoading(false);
        }
    };
    
    if (search.length < 3) {
      setImages([]);
      return;
    }
    
    // Reset and fetch for new search term
    const debounceTimeout = setTimeout(() => {
      fetchImages();
    }, 500);

    return () => clearTimeout(debounceTimeout);
  }, [search]);

  const handleImageClick = (clickedImage: ImageData) => {
    onImageClick(clickedImage, images);
  };

  const showNoResults = !loading && images.length === 0 && search.length >= 3;

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {loading ? (
          Array.from({ length: 25 }).map((_, i) => (
            <Skeleton key={i} className="w-full aspect-square rounded-md" />
          ))
        ) : (
          images.map((img) => (
            <GridImage key={img.id} image={img} onClick={() => handleImageClick(img)} />
          ))
        )}
      </div>
      
      {showNoResults && (
        <p className="col-span-full text-center text-muted-foreground mt-4">Tidak ada hasil ditemukan.</p>
      )}
    </div>
  );
}
