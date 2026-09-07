import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { QuicklinkStrategy } from 'ngx-quicklink';
import { routes } from './app.routes';

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: QuicklinkStrategy })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
