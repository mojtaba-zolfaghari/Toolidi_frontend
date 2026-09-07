import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersianNumberPipe } from '../../shared/persian-number.pipe';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatTabGroup } from '@angular/material/tabs';



import { AsyncPipe, DatePipe, DecimalPipe, NgIf, NgFor, NgClass } from '@angular/common';

import { ProfileComponent } from './profile.component';

const routes: Routes = [
  { path: '', component: ProfileComponent }
];

@NgModule({
  declarations: [ProfileComponent],
  imports: [
    CommonModule,
    PersianNumberPipe,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatTabsModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatDividerModule,
    MatIconModule,
    MatTabGroup,
    AsyncPipe,
    DatePipe,
    DecimalPipe,
    NgIf,
    NgFor,
    NgClass
  ]
})
export class ProfileModule { }
