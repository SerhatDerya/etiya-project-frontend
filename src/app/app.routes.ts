import { Routes } from '@angular/router';
import { B2c } from './pages/b2c/b2c';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {path: 'login', component: Login},
    {path: 'b2c', component: B2c, canActivate: [authGuard]},
    {path: '', redirectTo: 'b2c', pathMatch: 'full'},
    {path: '**', redirectTo: 'b2c'}
];
