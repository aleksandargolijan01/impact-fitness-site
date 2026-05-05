export type LegacyMembershipApplicationStatus =
  | 'novo'
  | 'kontaktirano'
  | 'potvrdjeno'
  | 'odbijeno';

export type MembershipApplicationStatus = 'aktivirano' | 'na_cekanju' | 'blokirano';

export type StoredMembershipApplicationStatus =
  | MembershipApplicationStatus
  | LegacyMembershipApplicationStatus
  | 'Aktivirano'
  | 'Blokirano';

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
  status: StoredMembershipApplicationStatus;
  createdAt: string;
}

export function normalizeMembershipStatus(
  status: StoredMembershipApplicationStatus | string | undefined,
): MembershipApplicationStatus {
  const normalized = `${status || ''}`.trim().toLowerCase();

  if (normalized === 'aktivirano') {
    return 'aktivirano';
  }

  if (normalized === 'odbijeno' || normalized === 'blokirano') {
    return 'blokirano';
  }

  return 'na_cekanju';
}

export function getMembershipStatusLabel(status: StoredMembershipApplicationStatus | string): string {
  const normalized = normalizeMembershipStatus(status);

  if (normalized === 'aktivirano') {
    return 'Aktivirano';
  }

  return normalized === 'blokirano' ? 'Blokirano' : 'Na čekanju';
}

export function getMembershipStatusClass(status: StoredMembershipApplicationStatus | string): string {
  return `status-badge--membership-${normalizeMembershipStatus(status)}`;
}

export function isMembershipActive(status: StoredMembershipApplicationStatus | string): boolean {
  return normalizeMembershipStatus(status) === 'aktivirano';
}
