
'use client';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Type definition for a document
interface DocumentData {
  id: string;
  [key: string]: any;
}

// Type definition for a collection
interface CollectionData {
  collection: string;
  documents: DocumentData[];
}

// Helper to render complex data types in a readable format
const renderValue = (value: any): string => {
  if (value && typeof value === 'object' && value._seconds && value._nanoseconds) {
    // Convert Firestore Timestamp-like object to a readable date string
    return new Date(value._seconds * 1000).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return String(value);
};


export function DatabaseTab() {
  const [data, setData] = useState<CollectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch('/api/admin/database');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const jsonData: CollectionData[] = await response.json();
        setData(jsonData);
      } catch (error: any) {
        const message = error?.message || 'Terjadi kesalahan saat memuat data.';
        console.error("Error fetching admin data:", message);
        setErrorMessage(message);
        toast({
          variant: 'destructive',
          title: 'Gagal Memuat Data',
          description: message,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  if (loading) {
    return (
       <Card>
            <CardContent className="flex flex-col items-center justify-center min-h-[40vh] text-center text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4">Memuat data dari Firestore...</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Firestore Database Viewer</CardTitle>
            <CardDescription>Melihat data mentah langsung dari semua koleksi di database.</CardDescription>
        </CardHeader>
        <CardContent>
            {errorMessage ? (
                 <div className="text-center text-destructive p-8 border border-destructive/50 rounded-lg">
                    <h3 className="font-bold">Gagal Memuat Data</h3>
                    <p className="text-sm">{errorMessage}</p>
                 </div>
            ) : data.length === 0 ? (
                <p className="text-center text-muted-foreground p-8">Database kosong atau tidak ada koleksi yang ditemukan.</p>
            ) : (
                <Accordion type="multiple" className="w-full">
                    {data.map(({ collection, documents }) => (
                        <AccordionItem value={collection} key={collection}>
                            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                {collection} ({documents.length} dok)
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm border-separate border-spacing-0">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="sticky top-0 z-10 p-2 text-left font-semibold border-b border-l border-t rounded-tl-lg">ID Dokumen</th>
                                                <th className="sticky top-0 z-10 p-2 text-left font-semibold border-b border-r border-t rounded-tr-lg">Data</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {documents.map((doc) => (
                                                <tr key={doc.id}>
                                                    <td className="p-2 border-b border-l align-top font-mono text-xs w-1/4">{doc.id}</td>
                                                    <td className="p-2 border-b border-r">
                                                        <pre className="text-xs whitespace-pre-wrap break-all bg-muted/50 p-2 rounded-md">
                                                            {renderValue(doc)}
                                                        </pre>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </CardContent>
    </Card>
  );
}
