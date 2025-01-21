import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chambres',
  standalone: true,
  imports: [CommonModule, RouterModule,HttpClientModule],
  templateUrl: './chambres.component.html',
  styleUrls: ['./chambres.component.css'],
})
export class ChambresComponent implements OnInit {
  rooms: any[] = [];
  loading: boolean = false;

  private apiUrl = 'http://localhost:8009/api/rooms';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchRooms();
  }

  fetchRooms(): void {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl).subscribe({
      next: (data) => {
        this.rooms = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching rooms:', err);
        this.loading = false;
      },
    });
  }

  editRoom(room: any): void {
    console.log('Edit room:', room);
  }

  deleteRoom(roomId: number): void {
    // Make an HTTP DELETE request to the backend
    this.http.delete(`${this.apiUrl}/${roomId}`).subscribe({
      next: () => {
        // Filter the room out from the local list of rooms after successful deletion
        this.rooms = this.rooms.filter((room) => room.id !== roomId);
        console.log('Deleted room with ID:', roomId);
      },
      error: (err) => {
        console.error('Error deleting room:', err);
      },
    });
  }
}
