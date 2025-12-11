import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: 'login', 
        loadComponent: ()=> import('./login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: ()=> import('./register/register').then(m => m.Register)
    },
    {
        path: 'home',
        loadComponent: ()=> import('./dashboard/dashboard').then(m => m.Dashboard)
        
    },
    {
        path:'**', redirectTo:'/login',pathMatch: 'full'
    },
];
