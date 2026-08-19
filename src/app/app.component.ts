import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from './core/services/api/auth.service';
import { AuthStateService, AuthUser } from './core/services/auth-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'toolidi';
  currentUser: AuthUser | null = null;

  private subscription?: Subscription;

  constructor(
    private readonly authState: AuthStateService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.authState.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /** خروج از حساب کاربری و هدایت به صفحه اصلی */
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.authState.clear();
      this.router.navigate(['/']);
    });
  }
}
