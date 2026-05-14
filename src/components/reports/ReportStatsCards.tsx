
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, Search } from "lucide-react";

interface Stats {
  terkirim: number;
  pending: number;
  survey: number;
}

interface ReportStatsCardsProps {
  stats: Stats;
}

const formatRupiah = (value: number) => {
    if (isNaN(value)) return "Rp 0";
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export function ReportStatsCards({ stats }: ReportStatsCardsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 my-4">
      <Card className="bg-teal-600 text-black export-card">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            TERKIRIM <CheckCircle className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold">{formatRupiah(stats.terkirim)}</div>
        </CardContent>
      </Card>
      <Card className="bg-yellow-500 text-black export-card">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            PENDING <Clock className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold">{formatRupiah(stats.pending)}</div>
        </CardContent>
      </Card>
      <Card className="bg-blue-500 text-black export-card">
        <CardHeader className="p-4">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            SURVEY <Search className="h-4 w-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-2xl font-bold">{formatRupiah(stats.survey)}</div>
        </CardContent>
      </Card>
    </div>
  );
}
