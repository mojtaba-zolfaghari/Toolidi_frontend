import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

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
    SharedModule
  ]
})
export class BlogModule { }
