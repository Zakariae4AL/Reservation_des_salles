import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { DashboardadminComponent } from './dashboardadmin/dashboardadmin.component';
import { ProfileComponent } from './profile/profile.component';
import { ChambresComponent } from './chambres/chambres.component';
import { DeconnexionComponent } from './deconnexion/deconnexion.component';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'dash', component: DashboardadminComponent },
    { path: 'profile', component: ProfileComponent },
    { path: 'chambres', component: ChambresComponent },
    { path: 'deconnexion', component: DeconnexionComponent },
    
    
    

    
];


