export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  role: 'admin' | 'user';
  active?: boolean;
  createdAt: string;
}

export type CurrentUser = Omit<User, 'password' | 'createdAt'>;
