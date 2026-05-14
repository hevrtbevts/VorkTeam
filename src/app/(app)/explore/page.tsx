'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import TabGambar from './gambar';
import TabPricelist from './pricelist';
import { ImageDetailView, ImageData } from '@/components/explore/image-detail-view';
import TabGeaGetra from './gea-getra';

export default function ExplorePage() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const currentSearch = useMemo(() => searchParams.get('search') || '', [searchParams]);
  
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);
  const [allImages, setAllImages] = useState<ImageData[]>([]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (newSearchTerm) {
      params.set('search', newSearchTerm);
    } else {
      params.delete('search');
    }

    startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const openImageDetail = (image: ImageData, imageList: ImageData[]) => {
    setSelectedImage(image);
    setAllImages(imageList);
  };

  const closeImageDetail = () => {
    setSelectedImage(null);
    setAllImages([]);
  };

  const handleSelectRelatedImage = (image: ImageData) => {
    setSelectedImage(image);
  }

  // Simplified conditional rendering without AnimatePresence to ensure stability
  if (selectedImage) {
    return (
        <ImageDetailView 
            image={selectedImage}
            imageList={allImages}
            onBack={closeImageDetail}
            onSelectImage={handleSelectRelatedImage}
        />
    );
  }

  return (
    <div className="flex flex-col gap-4">
        <div className="flex justify-center">
            <Image
                src="/app-logo.png"
                alt="Team Rewang Logo"
                width={100}
                height={100}
                data-ai-hint="logo"
            />
        </div>
        <div className="relative w-full max-w-lg mx-auto p-1 rounded-full bg-card">
          <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                  placeholder="Cari konten di semua tab..."
                  defaultValue={currentSearch}
                  onChange={handleSearchChange}
                  className="pl-10 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 h-11"
              />
          </div>
        </div>

        <Tabs defaultValue="gambar" className="w-full">
          <div className="flex justify-center">
              <TabsList className="bg-transparent p-0 h-auto">
                  <TabsTrigger value="gambar">Gambar</TabsTrigger>
                  <TabsTrigger value="pricelist">Pricelist</TabsTrigger>
                  <TabsTrigger value="gea-getra">Gea &amp; Getra</TabsTrigger>
              </TabsList>
          </div>
          <TabsContent value="gambar" className="mt-4">
            <TabGambar search={currentSearch} onImageClick={openImageDetail} />
          </TabsContent>
          <TabsContent value="pricelist" className="mt-4">
             <TabPricelist search={currentSearch} />
          </TabsContent>
          <TabsContent value="gea-getra" className="mt-4">
             <TabGeaGetra search={currentSearch} onImageClick={openImageDetail} />
          </TabsContent>
        </Tabs>
    </div>
  );
}
