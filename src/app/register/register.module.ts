import { AuthService } from '../core/auth.service'
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgModule } from '@angular/core';
import { RegisterComponent } from './register.component';


@NgModule({
  imports: [
    ReactiveFormsModule,
    // FormBuilder,
    // FormGroup,
    // Router,
    // Validators,

  ],
  declarations: [
    RegisterComponent,
  ],
  providers: [
    AuthService,
    ],
})
export class RegisterModule { }
