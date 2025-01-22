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
      numeroSalle: ['', [Validators.required]],  // Frontend name for 'number'
      capacite: [0, [Validators.required]],     // Frontend name for 'capacity'
      disponibilite: [true, [Validators.required]], // Frontend name for 'available'
      equipment: [[]],                          // Optional, ensure it's an array
  });
  }

  submitRoom() {
    if (this.roomForm.valid) {
        // Map frontend fields to backend fields
        const roomData = {
            number: this.roomForm.value.numeroSalle?.toString() || '', // Map numeroSalle -> number
            capacity: Number(this.roomForm.value.capacite) || 0,       // Map capacite -> capacity
            available: this.roomForm.value.disponibilite === true,    // Map disponibilite -> available
            equipment: this.roomForm.value.equipment || [],           // Map equipment (ensure it's an array)
        };

        // Log mapped data for debugging
        console.log('Mapped Room Data:', roomData);

        // Send data to backend
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
