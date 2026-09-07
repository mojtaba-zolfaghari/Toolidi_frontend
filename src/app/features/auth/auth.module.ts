import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { SellerRegisterComponent } from './seller-register/seller-register.component';
import { SupplierRegisterComponent } from './supplier-register/supplier-register.component';
import { AgentRegisterComponent } from './agent-register/agent-register.component';
import { AuthLandingComponent } from './auth-landing.component';
import { OfflineComponent } from './offline.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'seller-register', component: SellerRegisterComponent },
  { path: 'supplier-register', component: SupplierRegisterComponent },
  { path: 'agent-register', component: AgentRegisterComponent },
  { path: 'offline', component: OfflineComponent },
  { path: '', component: AuthLandingComponent }
];

@NgModule({
  declarations: [
    LoginComponent,
    RegisterComponent,
    SellerRegisterComponent,
    SupplierRegisterComponent,
    AgentRegisterComponent,
    AuthLandingComponent,
    OfflineComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatRippleModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    RouterModule.forChild(routes)
  ]
})
export class AuthModule { }
