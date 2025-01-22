import { Component } from '@angular/core';
import { Router } from '@angular/router';  // Import the Router

@Component({
  selector: 'app-deconnexion',
  standalone: true,
  imports: [],
  templateUrl: './deconnexion.component.html',
  styleUrl: './deconnexion.component.css'
})
export class DeconnexionComponent {
  constructor(private router: Router) {}

  ngOnInit(): void {
    this.logout();
  }

  logout(): void {
    // Clear authentication data (if you're using localStorage or sessionStorage)
    localStorage.removeItem('authToken');  // Replace 'authToken' with your token's key
    sessionStorage.removeItem('authToken');  // Optional: Clear sessionStorage if needed

    // Redirect the user to the login page
    this.router.navigate(['/login']);
  }
}
