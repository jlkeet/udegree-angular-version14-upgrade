
import { Component, OnInit } from '@angular/core';
import { GoogleAnalyticsService } from '../services/google-analytics.service';
import { Router } from '@angular/router';

@Component({
  selector: 'footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit {
  // Fill out application configuration in src/config
  public title: string = "";
  public company: string = "";
  public author: string = "";
  public email: string = "";
  public year: number = 0;
  public website: string = "";
  public street: string = "";
  public city: string = "";
  public state: string = "";
  public zip: string = "";
  public country: string = "";

  constructor(public googleAnalyticsService: GoogleAnalyticsService, private router: Router,) {
  }

  ngOnInit() {
  }

  privacyPolicyRouting() {
    this.router.navigate(['/privacy']);
  }

  newPrivacyEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("privacy_policy", "planner", "privacy", "click", 10);
  } 

  newContactEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("contact_us", "planner", "contact", "click", 10);
  } 



}