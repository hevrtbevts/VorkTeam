
import type { Timestamp } from 'firebase/firestore';

export type User = {
  id: string; // This will be the Firebase UID
  name: string;
  email: string;
  avatarUrl?: string;
  role: 'sales' | 'penyelam' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
  weeklyTarget: number;
  phoneNumber?: string; // from blueprint
  createdAt?: any; // Firestore timestamp
  fcmToken?: string;
};

// New Client Status Types based on the blueprint
export type ClientPipelineStatus = 'PROSPEK' | 'SURVEY';
export type ClientArchivedStatus = 'DI PENDING';
export type ClientFinalStatus = 'TERKIRIM' | 'PENDING';
export type ClientCancelledStatus = 'BATAL';
export type ClientIntermediateStatus = 'ACC';

export type ClientStatus = ClientPipelineStatus | ClientArchivedStatus | ClientFinalStatus | ClientCancelledStatus | ClientIntermediateStatus;

export const PIPELINE_STATUSES: ClientPipelineStatus[] = ['PROSPEK', 'SURVEY'];
export const ARCHIVED_STATUSES: ClientArchivedStatus[] = ['DI PENDING'];
export const FINAL_CLIENT_STATUSES: ClientFinalStatus[] = ['TERKIRIM', 'PENDING'];

export type ActivityLog = {
    uid: string;
    userName: string;
    oldStatus: ClientStatus;
    newStatus: ClientStatus;
    timestamp: Timestamp | Date | string; // Allow string for serialization
    keterangan?: string;
};

// New Client Schema based on the blueprint
export type Client = {
  id: string; // Firestore document ID
  tanggal: Timestamp;
  nama: string;
  alamat: string;
  nomor: string;
  konsumen: 'BARU' | 'EKS' | 'LANGGAN';
  barang: string;
  angsuran: number;
  tenor: number;
  tenorUnit: 'hari' | 'bulan';
  omset: number; // Dihitung otomatis: angsuran * tenor
  status: ClientStatus;
  uid: string; // ID user pemilik data
  updatedAt: Timestamp;
  avatarUrl?: string; // Keep for consistency
  keterangan?: string; // Untuk alasan status DI PENDING
  activityLogs?: ActivityLog[]; // Array of logs
};

export type Target = {
    id: string; // same as user id
    omset: number;
    target: number;
}


// WhatsApp Automation Types
export interface WhatsAppDevice {
  id: string;
  deviceName: string;
  phoneNumber: string;
  status: 'online' | 'offline' | 'connecting';
  qrCode?: string;
  lastSeen?: Timestamp;
}

export interface WhatsAppMessage {
  id: string;
  recipientNumber: string;
  message: string;
  imageUrl?: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'pending';
  sentAt: Timestamp;
  errorMessage?: string;
}

export interface WhatsAppBroadcast {
  id: string;
  recipients: string[];
  messageTemplate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
