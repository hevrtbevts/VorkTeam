
'use client'

import { useState, useEffect } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from '@/components/ui/button'
import { ChevronDown, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { RupiahInput } from '@/components/ui/rupiah-input'
import { Label } from '../ui/label'

type TipeProduk = 'HP' | 'Royal' | 'Furniture' | 'Guhdo' | 'Elektronik';
type Tenor = 30 | 60 | 90 | 120 | 150 | 180;

interface PricelistItem {
  MERK: string;
  TYPE: string;
  MODEL: string;
  JUAL: string;
}

const aturanMargin: Record<TipeProduk, { maksHari: number, margin: number }[]> = {
  HP: [ { maksHari: 60, margin: 0.26 }, { maksHari: 120, margin: 0.41 } ],
  Royal: [ { maksHari: 90, margin: 0.36 }, { maksHari: 180, margin: 0.51 } ],
  Furniture: [ { maksHari: 90, margin: 0.36 }, { maksHari: 180, margin: 0.51 } ],
  Guhdo: [ { maksHari: 90, margin: 0.46 }, { maksHari: 180, margin: 0.66 } ],
  Elektronik: [ { maksHari: 90, margin: 0.31 }, { maksHari: 180, margin: 0.46 } ]
};

const aturanPotongan: Partial<Record<TipeProduk, number>> = {
  Royal: 0.17,
  Guhdo: 0.38
};

const formatRupiah = (value: number) => {
  if (isNaN(value) || value === null || value === 0) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function InstallmentCalculator({ itemDefaults }: { itemDefaults?: PricelistItem | null }) {
  const [modal, setModal] = useState<number | undefined>()
  const [dp, setDp] = useState<number | undefined>()
  const [tipe, setTipe] = useState<TipeProduk | ''>('')
  const [tenor, setTenor] = useState<Tenor | ''>('')
  const [nawar, setNawar] = useState<number | undefined>()
  
  const [productDetails, setProductDetails] = useState({ model: '', merk: '', type: '' });

  const [angsuranHarian, setAngsuranHarian] = useState<number>(0)
  const [estimasiPotongan, setEstimasiPotongan] = useState<number>(0)
  
  useEffect(() => {
    if (itemDefaults) {
        // Add '000' by multiplying by 1000
        const priceValue = (parseFloat(itemDefaults.JUAL.replace(/[^0-9]/g, '')) * 1000);
        setModal(priceValue);
        
        const typeMap: { [key: string]: TipeProduk } = {
            'ROYAL': 'Royal',
            'GUHDO': 'Guhdo',
            'ELEKTRONIK': 'Elektronik',
            'FURNITURE': 'Furniture',
            'HP': 'HP',
        };
        const productType = typeMap[itemDefaults.MERK.toUpperCase()] || 'Elektronik';
        setTipe(productType);

        setProductDetails({
            model: itemDefaults.MODEL,
            merk: itemDefaults.MERK,
            type: itemDefaults.TYPE
        });
    } else {
        setProductDetails({ model: '', merk: '', type: '' });
    }
  }, [itemDefaults]);


  useEffect(() => {
    const calculate = () => {
      const modalAwalNum = modal || 0;
      const dpNum = dp || 0;
      const tenorNum = tenor;
      const nawarNum = nawar || 0;

      if (!modalAwalNum || !tipe || !tenorNum) {
        setAngsuranHarian(0);
        setEstimasiPotongan(0);
        return;
      }
      
      let modalNum = modalAwalNum;
      
      const potonganTipe = aturanPotongan[tipe];
      if (potonganTipe) {
          modalNum = modalAwalNum * (1 - potonganTipe);
      }
      
      const sisaModal = modalNum - dpNum;
      if (sisaModal < 0) {
        setAngsuranHarian(0);
        setEstimasiPotongan(0);
        return;
      }
      
      const aturan = aturanMargin[tipe];
      let margin = 0;
      const sortedRules = [...aturan].sort((a,b) => a.maksHari - b.maksHari);

      for (const rule of sortedRules) {
          if (tenorNum <= rule.maksHari || rule.maksHari === 0) {
              margin = rule.margin;
              break;
          }
      }
       if (margin === 0 && sortedRules.length > 0) {
        margin = sortedRules[sortedRules.length - 1].margin;
      }


      const hargaJual = sisaModal * (1 + margin);
      const angsuran = hargaJual / tenorNum;
      setAngsuranHarian(angsuran);

      let potongan = 0;
      if (nawarNum > 0) {
        const selisihHarian = angsuran - nawarNum;
        const totalSelisih = selisihHarian * tenorNum;
        potongan = totalSelisih / (1 + margin);
      }
      setEstimasiPotongan(potongan);
    };

    calculate();
  }, [modal, dp, tipe, tenor, nawar]);
  
  const copyToClipboard = () => {
    const nawarNum = nawar || 0;
    const dpNum = dp || 0;

    const angsuranUntukClipboard = nawarNum > 0 ? nawarNum : angsuranHarian;

    // Conditionally create the "Est. Potongan/DP" text
    let potonganText = '';
    if (dpNum > 0 || nawarNum > 0) {
        potonganText = `Est. Potongan/DP: ${formatRupiah(estimasiPotongan)}`;
    }

    const textToCopy = `
Simulasi Angsuran
${productDetails.model || ''} ${productDetails.merk || ''} ${productDetails.type || ''}
-----------------
DP: ${formatRupiah(dpNum)}
Tenor: ${tenor} hari
Angsuran/Hari: ${formatRupiah(angsuranUntukClipboard)}
${potonganText ? `${potonganText}\n` : ''}-----------------
    `.trim().replace(/^\s*\n/gm, "\n").replace(/\n\n/g, '\n');

    navigator.clipboard.writeText(textToCopy);
    toast.success('Hasil simulasi disalin ke clipboard!');
  };

  const isNawarFilled = (nawar || 0) > 0;

  return (
    <div className="p-6 pt-12">
      <div className="text-center mb-6">
          <h2 className="text-xl font-bold">Simulasi Angsuran</h2>
          {productDetails.model && (
              <p className="text-sm text-muted-foreground uppercase">
                  {productDetails.model} {productDetails.merk} {productDetails.type}
              </p>
          )}
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="modal">Harga / Modal</Label>
            <RupiahInput id="modal" placeholder="Rp 0" value={modal} onValueChange={setModal} autoMultiply={true} />
        </div>
        
        <div className="space-y-2">
            <Label>Tipe Produk</Label>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                        {tipe || "Pilih Tipe Produk"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    {Object.keys(aturanMargin).map((key) => (
                        <DropdownMenuItem key={key} onSelect={() => setTipe(key as TipeProduk)}>
                            {key}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="dp">DP / Uang Muka</Label>
                <RupiahInput id="dp" placeholder="Rp 0" value={dp} onValueChange={setDp} />
            </div>
            <div className="space-y-2">
                <Label>Tenor (Hari)</Label>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between">
                            {tenor ? `${tenor} Hari` : "Pilih Tenor"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                        {[30, 60, 90, 120, 150, 180].map((hari) => (
                            <DropdownMenuItem key={hari} onSelect={() => setTenor(hari as Tenor)}>
                                {hari} Hari
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        
        <div className="space-y-2">
            <Label htmlFor="nawar">Harga Nawar</Label>
            <RupiahInput 
              id="nawar" 
              placeholder="Rp 0" 
              value={nawar} 
              onValueChange={setNawar}
              className={cn(isNawarFilled && "border-destructive ring-destructive ring-1")}
              autoMultiply={true}
            />
        </div>

        <div className="space-y-3 pt-4">
            <div className="flex justify-between items-center bg-green-500 text-black dark:text-white p-3 rounded-lg">
                <span className="font-medium">Angsuran / Hari</span>
                <span className="font-bold text-lg">{formatRupiah(angsuranHarian)}</span>
            </div>
            <div className={cn(
                "flex justify-between items-center p-3 rounded-lg transition-colors text-black dark:text-white",
                isNawarFilled 
                    ? "bg-destructive" 
                    : "bg-secondary text-secondary-foreground"
            )}>
                <span className="font-medium">Est. Potongan / DP</span>
                <span className="font-bold text-lg">{formatRupiah(estimasiPotongan)}</span>
            </div>
        </div>

        <Button variant="default" className="w-full" onClick={copyToClipboard} disabled={!modal || !tipe || !tenor}>
            <Copy className="w-4 h-4 mr-2" />
            Salin Hasil
        </Button>
        </div>
    </div>
  )
}
