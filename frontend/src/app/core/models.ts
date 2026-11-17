export type Role = 'USER' | 'ADMIN';
export type ReservationStatus = 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  expiresInSeconds: number;
  user: User;
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  location?: string;
  equipment: string[];
  active: boolean;
}

export interface RoomInput {
  name: string;
  capacity: number;
  location?: string | null;
  equipment: string[];
  active: boolean;
}

export interface RoomFilters {
  from?: string;
  to?: string;
  minCapacity?: number | null;
  equipment?: string | null;
}

export interface BusySlot {
  startAt: string;
  endAt: string;
}

export interface Reservation {
  id: number;
  room: { id: number; name: string };
  owner: { id: number; fullName: string; email: string };
  title: string;
  attendees: number;
  startAt: string;
  endAt: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface ReservationInput {
  roomId: number;
  title: string;
  attendees: number;
  startAt: string;
  endAt: string;
}

export interface Stats {
  rooms: number;
  activeRooms: number;
  users: number;
  upcomingReservations: number;
  ongoingReservations: number;
}

/** RFC 9457 problem details returned by the API on errors. */
export interface Problem {
  status?: number;
  title?: string;
  detail?: string;
  errors?: Record<string, string>;
}
