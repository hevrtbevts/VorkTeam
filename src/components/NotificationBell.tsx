
'use client';

import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Bell } from "lucide-react";
import { Client } from "@/lib/types";
import { addMonths, isToday } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "./ui/separator";

export function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasBeenOpenedToday, setHasBeenOpenedToday] = useState(false);

  useEffect(() => {
    const today = new Date().toDateString();
    const lastOpenedDate = localStorage.getItem('notifLastOpened');
    if (lastOpenedDate === today) {
        setHasBeenOpenedToday(true);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "konsumen"), where("uid", "==", userId));
    
    const unsub = onSnapshot(q, (snapshot) => {
        const now = new Date();
        let notifList: any[] = [];
        
        snapshot.docs.forEach(doc => {
            const d = doc.data() as Client;
            if (!d.tanggal) return;
            const docDate = d.tanggal.toDate();

            // 1. Prospek
            if (d.status === "PROSPEK") {
                const diffDays = (now.getTime() - docDate.getTime()) / (1000 * 3600 * 24);
                if (diffDays >= 0 && diffDays <= 3) {
                    notifList.push({
                        id: doc.id + '_prospek',
                        title: "Follow Up Prospek",
                        body: `Jangan lupa follow up klien ${d.nama}.`,
                        type: 'prospek'
                    });
                }
            }
            
            // 2. Hampir Lunas
            if (d.status === "TERKIRIM" && d.tenor && d.tenorUnit) {
                let dueDate;
                if (d.tenorUnit === "hari") {
                    dueDate = new Date(docDate.getTime() + d.tenor * 24 * 60 * 60 * 1000);
                } else { // bulan
                    dueDate = addMonths(docDate, d.tenor);
                }
                const diffDays = (dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24);
                if (diffDays <= 3 && diffDays >= 0) {
                     notifList.push({
                        id: doc.id + '_lunas',
                        title: "Segera Lunas!",
                        body: `Cicilan untuk ${d.nama} akan segera lunas.`,
                        type: 'lunas'
                    });
                }
            }
        });

        setNotifications(notifList);
      }
    );
    return () => unsub();
  }, [userId]);
  
  const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (open && !hasBeenOpenedToday) {
          setHasBeenOpenedToday(true);
          localStorage.setItem('notifLastOpened', new Date().toDateString());
      }
  }
  
  const showBadge = notifications.length > 0 && !hasBeenOpenedToday;

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button className="relative focus:outline-none">
          <Bell className="w-6 h-6" />
          {showBadge && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-red-500 text-white text-xs px-1 rounded-full">
              {notifications.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notifikasi</h4>
          </div>
          <Separator />
          <div className="grid gap-2">
            {notifications.length > 0 ? (
                notifications.map((notif) => (
                    <div key={notif.id} className="grid grid-cols-[25px_1fr] items-start pb-4 last:pb-0">
                         <span className={`flex h-2 w-2 translate-y-1 rounded-full ${notif.type === 'prospek' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                         <div className="grid gap-1">
                            <p className="text-sm font-medium">{notif.title}</p>
                            <p className="text-sm text-muted-foreground">{notif.body}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-center text-muted-foreground py-4">Tidak ada notifikasi baru.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
