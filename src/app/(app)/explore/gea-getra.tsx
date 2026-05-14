
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ImageData } from '@/components/explore/image-detail-view';

interface GeaGetraItem {
  filename: string;
  caption: string;
  gdrive_link: string;
  imageUrl?: string;
  id: string;
  url: string;
  title: string;
  fullResUrl?: string; 
  source: string;
}

const parseGoogleSheetJSON = (jsonString: string): { data: GeaGetraItem[], error: string | null } => {
  try {
    const jsonObject = JSON.parse(jsonString.substring(jsonString.indexOf('(') + 1, jsonString.lastIndexOf(')')));
    
    if (!jsonObject.table || !jsonObject.table.rows) {
      throw new Error("Invalid Google Sheets JSON format.");
    }

    const data = jsonObject.table.rows.map((row: any, index: number): GeaGetraItem => {
        const filename = row.c[0]?.v ?? '';
        const caption = row.c[1]?.v ?? '';
        const gdrive_link = row.c[2]?.v ?? '';
        return {
            filename: filename,
            caption: caption,
            gdrive_link: gdrive_link,
            id: `${filename}-${gdrive_link}-${index}`, // More robust ID
            url: gdrive_link, 
            title: caption || filename,
            source: 'Google Drive (GEA & GETRA)',
        }
    }).filter(item => item.gdrive_link); 

    return { data, error: null };
  } catch (e: any) {
    console.error("Failed to parse Google Sheet JSON:", e);
    return { data: [], error: e.message || "Gagal memproses data dari Google Sheet." };
  }
};

const convertToThumbnailLink = (url: string): string => {
    if (!url) return '';
    const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${fileIdMatch[1]}`;
    }
    return '';
};


const ImageCard = ({ item, onClick }: { item: GeaGetraItem, onClick: () => void }) => {
  const [isError, setIsError] = useState(false);
  const thumbnailUrl = useMemo(() => convertToThumbnailLink(item.url || ''), [item.url]);

  if (!thumbnailUrl) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full cursor-pointer"
      onClick={onClick}
    >
        {isError ? (
            <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center text-xs text-center p-2 text-muted-foreground">
                Gagal memuat
            </div>
        ) : (
            <img
                src={thumbnailUrl}
                alt={item.caption}
                className="w-full h-full object-cover rounded-md shadow-sm"
                loading="lazy"
                onError={() => setIsError(true)}
            />
        )}
    </motion.div>
  );
};


export default function TabGeaGetra({ search, onImageClick }: { search: string, onImageClick: (image: ImageData, imageList: ImageData[]) => void }) {
  const [data, setData] = useState<GeaGetraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://docs.google.com/spreadsheets/d/16ifxXxqttStNA4sYIJfDoV6Rw5fX0z8A5tcDd9U1BXQ/gviz/tq?tqx=out:json&sheet=CACHE');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const text = await response.text();
        const { data: parsedData, error: parseError } = parseGoogleSheetJSON(text);

        if (parseError) {
          setError(parseError);
        } else {
           setData(parsedData);
        }

      } catch (e: any) {
        console.error("Fetch error:", e);
        setError(e.message || "Gagal mengambil data dari Google Sheet.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredData = useMemo(() => {
    if (!search) return [];
    const searchTerms = search.toLowerCase().split(' ').filter(term => term.trim() !== '');
    if (searchTerms.length === 0) return [];

    return data.filter(item => {
      const combinedText = `${item.caption.toLowerCase()} ${item.filename.toLowerCase()}`;
      return searchTerms.every(term => combinedText.includes(term));
    });
  }, [search, data]);
  
  const handleImageClick = (clickedItem: GeaGetraItem) => {
    // Convert GeaGetraItem[] to ImageData[] before passing
    const imageList: ImageData[] = filteredData.map(item => ({
        id: item.id,
        url: item.gdrive_link,
        title: item.title,
        source: item.source,
    }));
    const selectedImageData: ImageData = {
        id: clickedItem.id,
        url: clickedItem.gdrive_link,
        title: clickedItem.title,
        source: clickedItem.source,
    };
    onImageClick(selectedImageData, imageList);
  };

  if (loading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-destructive">{error}</CardContent>
      </Card>
    );
  }
  
  if (!search) {
    return null;
  }

  if (filteredData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Tidak ditemukan gambar yang cocok.</CardContent>
      </Card>
    );
  }
  
  return (
    <AnimatePresence>
        <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"
        >
            {filteredData.map((item) => (
                <ImageCard key={item.id} item={item} onClick={() => handleImageClick(item)} />
            ))}
        </motion.div>
    </AnimatePresence>
  );
}
