
'use client';

import { Input } from '@/components/ui/input';

interface ClientSearchBarProps {
    searchTerm: string;
    onSearchTermChange: (term: string) => void;
}

export function ClientSearchBar({ searchTerm, onSearchTermChange }: ClientSearchBarProps) {
    return (
        <div className="flex justify-center items-center relative gap-4">
            <div className="flex-grow flex justify-center">
                <div className="relative w-full max-w-sm">
                    <Input 
                        placeholder="Cari nama, barang, atau alamat..."
                        value={searchTerm}
                        onChange={(e) => onSearchTermChange(e.target.value)}
                        className="pr-10"
                    />
                </div>
            </div>
        </div>
    );
}
