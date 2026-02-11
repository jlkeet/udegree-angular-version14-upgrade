import { NgModule } from '@angular/core';
import { FooterComponent } from './footer.component';
import { Router, RouterModule } from '@angular/router';
import { GoogleAnalyticsService } from '../services/google-analytics.service';

@NgModule({
  imports: [
    RouterModule
  ],
  declarations: [
    FooterComponent
  ],
  providers: [
    ],
  exports: [ FooterComponent ],
})
export class FooterModule { }
