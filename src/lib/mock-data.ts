import { Client, User } from './types';
import { Timestamp } from 'firebase/firestore';

export const mockUsers: User[] = [
  { id: '1', name: 'Alex Doe', email: 'alex.doe@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'admin', status: 'approved', weeklyTarget: 50000 },
  { id: '2', name: 'Brenda Smith', email: 'brenda.smith@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'sales', status: 'approved', weeklyTarget: 40000 },
  { id: '3', name: 'Charlie Brown', email: 'charlie.brown@example.com', avatarUrl: 'https://placehold.co/100x100.png', role: 'sales', status: 'pending', weeklyTarget: 45000 },
];

// This mock data is now outdated due to the new schema.
// It should be removed or updated if needed for local testing without Firestore.
// For now, it's unused by the new components which fetch from Firestore directly.
export const mockClients: Client[] = [];
