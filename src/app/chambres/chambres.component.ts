import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chambres',
  standalone: true,
  imports: [CommonModule, RouterModule,HttpClientModule,FormsModule],
  templateUrl: './chambres.component.html',
  styleUrls: ['./chambres.component.css'],
})
export class ChambresComponent implements OnInit {
  rooms: any[] = [];
  loading: boolean = false;
  editingRoom: any = null;

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

  // Start editing a room by creating a copy
  editRoom(room: any): void {
    this.editingRoom = { ...room }; // Create a copy of the room for editing
  }

  // Save the updated room to the backend
  saveRoom(): void {
    if (this.editingRoom) {
      this.http
        .put(`http://localhost:8009/api/rooms/${this.editingRoom.id}`, this.editingRoom)
        .subscribe(
          (response) => {
            console.log('Room updated successfully', response);
            this.fetchRooms(); // Reload rooms after updating
            this.editingRoom = null; // Reset editing state
          },
          (error) => {
            console.error('Error updating room', error);
          }
        );
    }
  }

  // Cancel the edit operation
  cancelEdit(): void {
    this.editingRoom = null; // Reset editing state
  }
  deleteRoom(roomId: number): void {
    // Make an HTTP DELETE request to the backend
    this.http.delete(`http://localhost:8009/api/rooms/${roomId}`).subscribe({
      next: () => {
        // Assuming 'rooms' is an array that holds the list of rooms
        this.rooms = this.rooms.filter((room) => room.id !== roomId);
        console.log('Deleted room with ID:', roomId);
        alert('Room deleted successfully!');
      },
      error: (err) => {
        console.error('Error deleting room:', err);
        alert('An error occurred while deleting the room.');
      },
    });
  }

  
  
}
