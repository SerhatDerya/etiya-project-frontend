import { Routes } from '@angular/router';
import { B2c } from './pages/b2c/b2c';
import { Login } from './pages/login/login';
import { authGuard } from './guards/auth-guard';
import { CreateCustomer } from './components/create-customer/create-customer';
import { Search } from './components/search/search';

export const routes: Routes = [
    {path: 'login', component: Login},
    {
        path: 'b2c',
        component: B2c,
        canActivate: [authGuard],
        children: [
            {path: '', component: Search},
            {path: 'create-customer', component: CreateCustomer}
        ]
    },
    {path: '', redirectTo: 'b2c', pathMatch: 'full'},
    {path: 'b2c/create-customer', component: CreateCustomer},
    {path: '**', redirectTo: 'b2c'},
];
