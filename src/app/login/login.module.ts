import { AuthService } from '../core/auth.service'
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgModule } from '@angular/core';
import { LoginComponent } from './login.component';


@NgModule({
  imports: [
    ReactiveFormsModule
  ],
  declarations: [
    LoginComponent
  ],
  providers: [
    AuthService,
    // Router,
    // FormBuilder,
    // FormGroup,
    // Validators
    ],
})
export class LoginModule { }
