import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoginComponent } from './login.component';
import { AuthService } from '../core/auth.service';
import { Router } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { fakeAsync, tick } from '@angular/core/testing';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['doGoogleLogin', 'doLogin']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ LoginComponent ],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        FormBuilder
      ],
      imports: [
        FormsModule,
        ReactiveFormsModule
      ]
    })
    .compileComponents();

    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

//   it('should navigate to planner after Facebook login', () => {
//     mockAuthService.doFacebookLogin.and.returnValue(Promise.resolve({} as any));
//     component.tryFacebookLogin();
//     expect(mockRouter.navigate).toHaveBeenCalledWith(['/planner']);
//   });

//   it('should navigate to planner after Twitter login', () => {
//     mockAuthService.doTwitterLogin.and.returnValue(Promise.resolve({} as any));
//     component.tryTwitterLogin();
//     expect(mockRouter.navigate).toHaveBeenCalledWith(['/planner']);
//   });

it('should navigate to planner after Google login', fakeAsync(() => {
    mockAuthService.doGoogleLogin.and.returnValue(Promise.resolve({} as any));
    component.tryGoogleLogin();
    tick();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/planner']);
  }));

  it('should navigate to planner after successful login', async () => {
    mockAuthService.doLogin.and.returnValue(Promise.resolve({} as any));
    await component.tryLogin({email: 'user@example.com', password: 'TestPassword123!'});
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/planner']);
  });

  it('should set errorMessage after failed login', async () => {
    const error = { message: 'test error' };
    mockAuthService.doLogin.and.returnValue(Promise.reject(error));
    await component.tryLogin({email: 'test@example.com', password: 'testPassword'});
    expect(component.errorMessage).toBe(error.message);
  });
});
