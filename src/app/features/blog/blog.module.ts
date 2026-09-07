import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { BlogComponent } from './blog.component';
import { BlogDetailComponent } from './blog-detail.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [
  { path: '', component: BlogComponent },
  { path: ':id', component: BlogDetailComponent }
];

@NgModule({
  declarations: [BlogComponent, BlogDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    MatCardModule,
    MatDividerModule,
    MatIconModule,
    MatGridListModule,
    MatPaginatorModule,
    MatProgressSpinnerModule
  ]
})
export class BlogModule { }
