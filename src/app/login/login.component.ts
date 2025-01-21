import { Component } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [
    CommonModule,
    FormsModule, HttpClientModule
  ],
  standalone: true,
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    // Construct the login payload
    const loginData = {
      email: this.email,
      password: this.password
    };

    // Send the POST request to the Spring Boot backend
    this.http.post('http://localhost:8009/api/users/login', loginData)
      .subscribe(
        (response: any) => {
          console.log('Login successful', response);
          // No need to save the token, just redirect on successful login
          this.router.navigate(['/dash']);  // Redirect to /dash
        },
        (error) => {
          console.error('Login failed', error);
          alert('Login failed. Please check your credentials.');
        }
      );
  }
}
