import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  BusySlot,
  Reservation,
  ReservationInput,
  ReservationStatus,
  Room,
  RoomFilters,
  RoomInput,
  Stats,
  User,
} from './models';

/** Typed access to every endpoint of the Spring Boot API. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  register(body: { fullName: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/register`, body);
  }

  login(body: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/auth/login`, body);
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.base}/auth/me`);
  }

  rooms(filters: RoomFilters = {}): Observable<Room[]> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    }
    return this.http.get<Room[]>(`${this.base}/rooms`, { params });
  }

  schedule(roomId: number, from: string, to: string): Observable<BusySlot[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<BusySlot[]>(`${this.base}/rooms/${roomId}/schedule`, { params });
  }

  createRoom(body: RoomInput): Observable<Room> {
    return this.http.post<Room>(`${this.base}/rooms`, body);
  }

  updateRoom(id: number, body: RoomInput): Observable<Room> {
    return this.http.put<Room>(`${this.base}/rooms/${id}`, body);
  }

  deleteRoom(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/rooms/${id}`);
  }

  myReservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.base}/reservations/mine`);
  }

  book(body: ReservationInput): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/reservations`, body);
  }

  cancel(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.base}/reservations/${id}/cancel`, {});
  }

  allReservations(status?: ReservationStatus): Observable<Reservation[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<Reservation[]>(`${this.base}/admin/reservations`, { params });
  }

  users(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/admin/users`);
  }

  stats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.base}/admin/stats`);
  }
}
