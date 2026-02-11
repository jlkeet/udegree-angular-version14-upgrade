import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RegisterComponent } from './register.component';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '../core/auth.service';
import { Router } from '@angular/router';
import { of } from 'rxjs';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let authService: AuthService;
  let router: Router;

  beforeEach(async () => {
    const authServiceMock = {
      doFacebookLogin: jasmine.createSpy('doFacebookLogin').and.returnValue(of(true)),
      doTwitterLogin: jasmine.createSpy('doTwitterLogin').and.returnValue(of(true)),
      doGoogleLogin: jasmine.createSpy('doGoogleLogin').and.returnValue(of(true)),
      doRegister: jasmine.createSpy('doRegister').and.returnValue(of(true))
    };

    const routerMock = {
      navigate: jasmine.createSpy('navigate')
    };

    await TestBed.configureTestingModule({
      declarations: [ RegisterComponent ],
      providers: [
        FormBuilder,
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create form with 3 controls', () => {
    expect(component.registerForm.contains('email')).toBe(true);
    expect(component.registerForm.contains('password')).toBe(true);
    expect(component.registerForm.contains('name')).toBe(true);
  });

  it('should call AuthService.doFacebookLogin and navigate to planner when tryFacebookLogin is called', () => {
    component.tryFacebookLogin();
    expect(authService.doFacebookLogin).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/planner']);
  });

  it('should call AuthService.doTwitterLogin and navigate to planner when tryTwitterLogin is called', () => {
    component.tryTwitterLogin();
    expect(authService.doTwitterLogin).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/planner']);
  });

  it('should call AuthService.doGoogleLogin and navigate to planner when tryGoogleLogin is called', () => {
    component.tryGoogleLogin();
    expect(authService.doGoogleLogin).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/planner']);
  });

  // Add more tests for tryRegister and other methods...
});
