
import { db } from '@/lib/firebase';
import { ClientStatus, User } from '@/lib/types';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  Timestamp,
  arrayUnion,
  deleteDoc,
} from 'firebase/firestore';

type ClientFormData = {
  tanggal: Date;
  nama: string;
  alamat: string;
  nomor?: string;
  konsumen?: 'BARU' | 'EKS' | 'LANGGAN';
  barang?: string;
  angsuran?: number;
  tenor?: number;
  tenorUnit?: 'hari' | 'bulan';
};

const KONSUMEN_COLLECTION = 'konsumen';

// 1. Logic to add a new client to the 'konsumen' collection
export async function addClientToPipeline(formData: ClientFormData, uid: string): Promise<void> {
  const { angsuran = 0, tenor = 0, tenorUnit = 'hari', barang = '', nama, alamat, nomor = '-', konsumen = 'BARU', ...rest } = formData;

  // Smart status determination
  const isSurvey = angsuran > 0 && tenor > 0 && barang && konsumen;
  const status: ClientStatus = isSurvey ? 'SURVEY' : 'PROSPEK';
  
  const omset = angsuran * tenor;

  const newClientData = {
    ...rest,
    nama: nama.toUpperCase(),
    alamat: alamat.toUpperCase(),
    nomor: nomor,
    barang: barang.toUpperCase(),
    konsumen: konsumen,
    angsuran,
    tenor,
    tenorUnit,
    omset,
    status,
    uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    tanggal: Timestamp.fromDate(formData.tanggal),
    activityLogs: [], // Initialize with an empty array
  };

  try {
    await addDoc(collection(db, KONSUMEN_COLLECTION), newClientData);
  } catch (error) {
    console.error('Error adding client to konsumen collection: ', error);
    throw new Error('Failed to add client.');
  }
}

// 2. Logic to handle status changes and create activity log
export async function updateClientStatus(
  docId: string,
  newStatus: ClientStatus,
  user: User,
  oldStatus: ClientStatus,
  keterangan?: string
): Promise<void> {
    try {
        const clientRef = doc(db, KONSUMEN_COLLECTION, docId);

        const newLogEntry = {
            uid: user.id,
            userName: user.name,
            oldStatus,
            newStatus,
            timestamp: Timestamp.now(),
            ...(keterangan && { keterangan }),
        };

        const updateData: any = {
            status: newStatus,
            updatedAt: serverTimestamp(),
            activityLogs: arrayUnion(newLogEntry)
        };

        if (newStatus === 'DI PENDING' || newStatus === 'BATAL') {
          updateData.keterangan = keterangan;
        }

        await updateDoc(clientRef, updateData);

    } catch (error) {
        console.error('Error updating client status: ', error);
        throw new Error('Failed to update client status.');
    }
}


// 3. Logic to update client data (for edit functionality)
export async function updateClient(docId: string, formData: ClientFormData): Promise<void> {
    const { angsuran = 0, tenor = 0, tenorUnit = 'hari', ...rest } = formData;
    const omset = angsuran * tenor;

    const updatedData = {
        ...rest,
        nama: formData.nama.toUpperCase(),
        alamat: formData.alamat.toUpperCase(),
        barang: (formData.barang || '').toUpperCase(),
        konsumen: formData.konsumen || 'BARU',
        angsuran,
        tenor,
        tenorUnit,
        omset,
        updatedAt: serverTimestamp(),
        tanggal: Timestamp.fromDate(formData.tanggal),
    };

    try {
        const docRef = doc(db, KONSUMEN_COLLECTION, docId);
        await updateDoc(docRef, updatedData);
    } catch (error) {
        console.error('Error updating client data: ', error);
        throw new Error('Failed to update client data.');
    }
}

// 4. Logic to permanently delete a client document
export async function deleteClient(docId: string): Promise<void> {
    try {
        const docRef = doc(db, KONSUMEN_COLLECTION, docId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting client: ', error);
        throw new Error('Failed to delete client.');
    }
}
