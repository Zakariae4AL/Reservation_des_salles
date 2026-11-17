import { Component } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule} from '@angular/forms'; // Import FormsModule
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  user = {
    nomComplet: '',
    email: '',
    password: '',
    role: '',
  };

  onSubmit() {
    console.log('User Information:', this.user);
    // You can call an API or service here to handle the form submission
  }
}
