import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { GoogleAnalyticsService } from '../services/google-analytics.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;
  let googleAnalyticsService: GoogleAnalyticsService;
  let router: Router;

  beforeEach(async () => {
    const googleAnalyticsServiceMock = {
      eventEmitter: jasmine.createSpy('eventEmitter').and.returnValue(of(true))
    };

    const routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      declarations: [ FooterComponent ],
      providers: [
        { provide: GoogleAnalyticsService, useValue: googleAnalyticsServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    googleAnalyticsService = TestBed.inject(GoogleAnalyticsService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call GoogleAnalyticsService.eventEmitter with correct parameters when newPrivacyEvent is called', () => {
    component.newPrivacyEvent();
    expect(googleAnalyticsService.eventEmitter).toHaveBeenCalledWith("privacy_policy", "planner", "privacy", "click", 10);
  });

  it('should call GoogleAnalyticsService.eventEmitter with correct parameters when newContactEvent is called', () => {
    component.newContactEvent();
    expect(googleAnalyticsService.eventEmitter).toHaveBeenCalledWith("contact_us", "planner", "contact", "click", 10);
  });

  it('should call Router.navigate with correct parameter when privacyPolicyRouting is called', () => {
    component.privacyPolicyRouting();
    expect(router.navigate).toHaveBeenCalledWith(['/privacy']);
  });

});
