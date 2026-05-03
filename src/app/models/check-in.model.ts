export interface CheckIn {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  date: string;
  time: string;
  createdAt: string;
  qrCodeValue: string;
}

export type CreateCheckInPayload = Omit<CheckIn, 'id' | 'date' | 'time' | 'createdAt'>;
