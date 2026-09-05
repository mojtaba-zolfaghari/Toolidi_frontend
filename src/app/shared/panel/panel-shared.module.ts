import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';

import { PersianDatePipe } from '../persian-date.pipe';
import { PersianNumberPipe } from '../persian-number.pipe';
import { StatCardComponent } from '../components/stat-card/stat-card.component';
import { PageHeaderComponent } from '../components/page-header/page-header.component';
import { DataTableComponent } from '../components/data-table/data-table.component';
import { ActionButtonComponent } from '../components/action-button/action-button.component';
import { FormInputComponent } from '../components/form-input/form-input.component';

/**
 * ماژول اجزای Material-محورِ مشترک پنل‌ها (admin/seller/supplier/agent).
 * جانشین SharedMaterialModule است؛ فقط توسط ماژول‌های لِزی پنل import می‌شود
 * تا Angular Material هرگز وارد باندل اولیه (main.js) نشود.
 */
@NgModule({
  declarations: [
    StatCardComponent,
    PageHeaderComponent,
    DataTableComponent,
    ActionButtonComponent,
    FormInputComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    PersianDatePipe,
    PersianNumberPipe,
    // Buttons & icons
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    // Layout & surfaces
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatExpansionModule,
    // Forms
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    // Table
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    // Feedback
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    // Navigation
    MatSidenavModule,
    MatToolbarModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatAutocompleteModule
  ],
  exports: [
    StatCardComponent,
    PageHeaderComponent,
    DataTableComponent,
    ActionButtonComponent,
    FormInputComponent,
    PersianDatePipe,
    PersianNumberPipe,
    RouterModule,
    // Buttons & icons
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatBadgeModule,
    // Layout & surfaces
    MatCardModule,
    MatListModule,
    MatDividerModule,
    MatExpansionModule,
    // Forms
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    // Table
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    // Feedback
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    // Navigation
    MatSidenavModule,
    MatToolbarModule,
    MatTabsModule,
    MatButtonToggleModule,
    MatAutocompleteModule
  ]
})
export class PanelSharedModule { }
