import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-chambres',
  standalone: true,
  imports: [CommonModule,
    RouterModule,],
  templateUrl: './chambres.component.html',
  styleUrl: './chambres.component.css'
})
export class ChambresComponent {
  rooms = [
    { id: 1, name: 'Room 1', description: 'This is a description for Room 1.' },
    { id: 2, name: 'Room 2', description: 'This is a description for Room 2.' },
    { id: 3, name: 'Room 3', description: 'This is a description for Room 3.' },
  ];

  constructor() { }

  ngOnInit(): void {
    // Load rooms from backend or local storage
  }

  editRoom(room: any): void {
    // Logic to edit the room (e.g., open a form or navigate to a room editing page)
    console.log('Edit room:', room);
  }

  deleteRoom(roomId: number): void {
    // Logic to delete the room (e.g., make an API call to delete)
    this.rooms = this.rooms.filter(room => room.id !== roomId);
    console.log('Deleted room with ID:', roomId);
  }
}
