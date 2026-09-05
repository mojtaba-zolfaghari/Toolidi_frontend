import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { SearchPageComponent } from './search-page.component';

const routes: Routes = [
  { path: '', component: SearchPageComponent }
];

@NgModule({
  declarations: [SearchPageComponent],
  imports: [CommonModule, FormsModule, SharedModule, RouterModule.forChild(routes)]
})
export class SearchModule {}
