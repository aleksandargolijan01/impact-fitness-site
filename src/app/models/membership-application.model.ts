export type MembershipApplicationStatus =
  | 'novo'
  | 'kontaktirano'
  | 'potvrdjeno'
  | 'aktivirano'
  | 'odbijeno';

export interface MembershipApplication {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  packageId: string;
  packageName: string;
  packagePrice: string;
  startDate: string;
  documentNumber: string;
  note: string;
  status: MembershipApplicationStatus;
  createdAt: string;
}
