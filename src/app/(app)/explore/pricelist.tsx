
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GlobalModal } from '@/components/ui/global-modal';
import { InstallmentCalculator } from '@/components/tools/InstallmentCalculator';

interface PricelistItem {
  MERK: string;
  TYPE: string;
  MODEL: string;
  FITUR: string;
  JUAL: string;
  CAPTION: string;
}

// Helper function to parse the unique JSON format from Google Sheets gviz API
const parseGoogleSheetJSON = (jsonString: string): { data: PricelistItem[], error: string | null } => {
  try {
    // Extract the JSON object from the function call wrapper
    const jsonObject = JSON.parse(jsonString.substring(jsonString.indexOf('(') + 1, jsonString.lastIndexOf(')')));
    
    if (!jsonObject.table || !jsonObject.table.rows || !jsonObject.table.cols) {
      throw new Error("Invalid Google Sheets JSON format: table, rows, or cols property missing.");
    }
    
    const headers = jsonObject.table.cols.map((col: any) => col.label.toUpperCase().trim());
    
    // Find indices for required columns to handle any column order
    const merkIndex = headers.indexOf('MERK');
    const typeIndex = headers.indexOf('TYPE');
    const modelIndex = headers.indexOf('MODEL');
    const fiturIndex = headers.indexOf('FITUR'); // This can be -1 if not found
    const hargaIndex = headers.indexOf('JUAL'); 
    const captionIndex = headers.indexOf('CAPTION');
    
    // Validate that all required columns (except the optional 'FITUR') are present
    const requiredIndices = { 
        'MERK': merkIndex, 
        'TYPE': typeIndex, 
        'MODEL': modelIndex, 
        'JUAL': hargaIndex, 
        'CAPTION': captionIndex 
    };
    
    const missingCols = Object.entries(requiredIndices)
        .filter(([, index]) => index === -1)
        .map(([name]) => name);

    if (missingCols.length > 0) {
        throw new Error(`Kolom yang wajib ada tidak ditemukan dalam Sheet: ${missingCols.join(', ')}.`);
    }

    const data = jsonObject.table.rows.map((row: any): PricelistItem => ({
      MERK: row.c[merkIndex]?.v ?? '',
      TYPE: row.c[typeIndex]?.v ?? '',
      MODEL: row.c[modelIndex]?.v ?? '',
      FITUR: fiturIndex !== -1 ? (row.c[fiturIndex]?.v ?? '') : '', // Handle optional FITUR
      JUAL: row.c[hargaIndex]?.f ?? (row.c[hargaIndex]?.v?.toString() ?? '0'),
      CAPTION: row.c[captionIndex]?.v ?? '',
    }));

    return { data, error: null };

  } catch (e: any) {
    console.error("Failed to parse Google Sheet JSON:", e);
    return { data: [], error: e.message || "Gagal memproses data dari Google Sheet. Pastikan formatnya benar." };
  }
};


export default function TabPricelist({ search }: { search: string }) {
  const [data, setData] = useState<PricelistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PricelistItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/16MEtVRu3Vv3-6JEw46xndUisFy7Uo7ZMT86BucWeQOc/gviz/tq?tqx=out:json&sheet=List%20Harga';
        // Add a cache-busting parameter
        const urlWithCacheBust = `${sheetUrl}&_=${new Date().getTime()}`;
        const response = await fetch(urlWithCacheBust);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
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
    const allData = data.filter(item => item.JUAL && parseFloat(item.JUAL.replace(/[^0-9]/g, '')) > 0);
    if (!search) return [];
    
    const searchTerms = search.toLowerCase().split(' ').filter(term => term.trim() !== '');

    if (searchTerms.length === 0) return [];

    return allData.filter(item => {
      const combinedText = [
        item.MODEL,
        item.TYPE,
        item.FITUR,
        item.MERK,
        item.CAPTION
      ].join(' ').toLowerCase();

      return searchTerms.every(term => combinedText.includes(term));
    });
  }, [search, data]);

  const handleRowClick = (item: PricelistItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
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
        <CardContent className="p-8 text-center text-destructive">
          {error}
        </CardContent>
      </Card>
    );
  }

  if (search && filteredData.length === 0) {
    return (
        <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
                Tidak ditemukan hasil untuk '{search}' di tab Pricelist.
            </CardContent>
        </Card>
    );
  }

  if (!search) {
    return null; // Return nothing if there's no search term
  }

  return (
    <>
      <Card>
          <ScrollArea className="h-[70vh] w-full">
              <Table className="text-xs uppercase">
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="bg-muted hover:bg-muted/90">
                    <TableHead>Merk</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Harga</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => (
                    <TableRow key={index} onClick={() => handleRowClick(item)} className="cursor-pointer">
                      <TableCell>{item.MERK}</TableCell>
                      <TableCell>{item.MODEL}</TableCell>
                      <TableCell>{item.TYPE}</TableCell>
                      <TableCell>{item.JUAL}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          </ScrollArea>
      </Card>

      <GlobalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        className="sm:max-w-lg"
      >
          {selectedItem && (
            <InstallmentCalculator 
                itemDefaults={selectedItem}
            />
          )}
      </GlobalModal>
    </>
  );
}
