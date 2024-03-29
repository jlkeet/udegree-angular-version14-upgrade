import { Component } from '@angular/core';
import { AuthService } from '../core/auth.service'
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    public authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.createForm();
   }

    loginRouting() {
      this.router.navigate(['/login']);
    }


   // This is where we set the registration form options, could add further fields if necessary

   createForm() {
     this.registerForm = this.fb.group({
       email: ['', Validators.required ],
       password: ['',Validators.required],
       name: ['',Validators.required],
     });
   }

   tryFacebookLogin(){
     this.authService.doFacebookLogin()
     .then(res =>{
       this.router.navigate(['/planner']);
     }, err => console.log(err)
     )
   }

   tryTwitterLogin(){
     this.authService.doTwitterLogin()
     .then(res =>{
       this.router.navigate(['/planner']);
     }, err => console.log(err)
     )
   }

   tryGoogleLogin(){
     this.authService.doGoogleLogin()
     .then(res =>{
       this.router.navigate(['/planner']);
     }, err => console.log(err)
     )
   }

   tryRegister(value: any){
     this.authService.doRegister(value)
     .then(res => {
       this.errorMessage = "";
       this.successMessage = "Your account has been created";
       this.router.navigate(['/planner']);
     }, err => {
       this.errorMessage = err.message;
       this.successMessage = "";
     })
   }

}
