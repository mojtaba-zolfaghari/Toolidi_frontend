import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SellerRegisterComponent } from './seller-register/seller-register.component';
import { SupplierRegisterComponent } from './supplier-register/supplier-register.component';
import { AgentRegisterComponent } from './agent-register/agent-register.component';
import { AuthLandingComponent } from './auth-landing.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'seller-register', component: SellerRegisterComponent },
  { path: 'supplier-register', component: SupplierRegisterComponent },
  { path: 'agent-register', component: AgentRegisterComponent },
  { path: '', component: AuthLandingComponent }
];

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    SellerRegisterComponent,
    SupplierRegisterComponent,
    AgentRegisterComponent,
    AuthLandingComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes)
  ]
})
export class AuthModule { }
