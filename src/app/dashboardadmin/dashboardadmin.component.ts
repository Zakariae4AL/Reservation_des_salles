import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
@Component({
  selector: 'app-dashboardadmin',
  standalone: true,
  imports: [RouterModule, HttpClientModule, ReactiveFormsModule,],
  templateUrl: './dashboardadmin.component.html',
  styleUrl: './dashboardadmin.component.css'
})
export class DashboardadminComponent {
  roomForm: FormGroup;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.roomForm = this.fb.group({
      numeroSalle: ['', Validators.required],
      capacite: ['', Validators.required],
      disponibilite: ['', Validators.required],
      equipment: [[], Validators.required],
    });
  }

  submitRoom() {
    if (this.roomForm.valid) {
      const roomData = this.roomForm.value;
      this.http.post('http://localhost:8009/api/rooms', roomData).subscribe({
        next: (response) => {
          console.log('Room added successfully:', response);
          alert('Room added successfully!');
        },
        error: (error) => {
          console.error('Error adding room:', error);
          alert('An error occurred while adding the room.');
        },
      });
    } else {
      alert('Please fill out all required fields.');
    }
  }
}
