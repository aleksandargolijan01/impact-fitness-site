export type NotificationType = 'info' | 'success' | 'warning';

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
}
