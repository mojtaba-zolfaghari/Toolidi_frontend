import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared.module';
import { DealsComponent } from './deals.component';

const routes: Routes = [{ path: '', component: DealsComponent }];

@NgModule({
  declarations: [DealsComponent],
  imports: [CommonModule, RouterModule.forChild(routes), SharedModule]
})
export class DealsModule {}
