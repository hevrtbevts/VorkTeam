
import { db } from '@/lib/firebase';
import type { ClientStatus, User } from '@/lib/types';
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

type ProfileFormData = {
  name: string;
  phoneNumber: string;
  weeklyTarget: number;
};

type PendingUserFormData = {
  name: string;
  phoneNumber: string;
}

type UserManagementData = Partial<Pick<User, 'role' | 'status'>>;


const KONSUMEN_COLLECTION = 'konsumen';
const USERS_COLLECTION = 'users';

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

    const updatedData: { [key: string]: any } = {
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
        tanggal: Timestamp.fromDate(formData.tanggal)
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


/**
 * Updates a user's profile information in Firestore.
 * @param uid The user's unique ID.
 * @param data The profile data to update.
 */
export async function updateUserProfile(uid: string, data: ProfileFormData): Promise<void> {
  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update user profile.');
  }
}

/**
 * Updates a user's role and status by an admin.
 * This function now calls a server-side API route.
 * @param userToUpdate The full user object of the user being updated.
 * @param data The role and/or status to update.
 * @param adminUser The authenticated admin user object.
 */
export async function updateUserManagement(userToUpdate: User, data: UserManagementData, adminUser: User & { firebaseUser?: any }): Promise<void> {
    if (adminUser.role !== 'admin') {
        throw new Error('Hanya admin yang dapat mengubah data pengguna.');
    }
    
    try {
        const idToken = await adminUser.firebaseUser?.getIdToken();
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
                userIdToUpdate: userToUpdate.id,
                updates: data
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Gagal memperbarui pengguna.');
        }

    } catch (error: any) {
        console.error(`Error calling API to update user ${userToUpdate.id}:`, error);
        throw error;
    }
}


/**
 * Updates a pending user's name and phone number.
 * @param uid The user's unique ID.
 * @param data The user's name and phone number.
 */
export async function updatePendingUser(uid: string, data: PendingUserFormData): Promise<void> {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, {
            name: data.name,
            phoneNumber: data.phoneNumber,
            updatedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error in updatePendingUser:', error);
        throw error;
    }
}
