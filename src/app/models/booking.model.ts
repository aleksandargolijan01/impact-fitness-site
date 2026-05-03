export type BookingStatus = 'novo' | 'kontaktirano' | 'zavrseno' | 'otkazano';

export interface Booking {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  goal: string;
  serviceType: string;
  service?: string;
  trainerId?: string;
  trainerName?: string;
  message: string;
  date?: string;
  time?: string;
  createdAt?: string;
  submittedAt: string;
  status: BookingStatus;
  userId: string;
  preferredDate?: string;
  preferredTime?: string;
  source: 'public' | 'user';
}
