import { Injectable } from '@angular/core';
import { CanActivate, Router } from "@angular/router";
// import { Auth } from '@angular/fire/auth';
import { UserService } from '../core/user.service';


@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    // public afAuth: Auth,
    public userService: UserService,
    private router: Router
  ) {}

  canActivate(): Promise<boolean>{
    return new Promise((resolve, reject) => {
      this.userService.getCurrentUser()
      .then(user => {
        this.router.navigate(['/planner']);
        return resolve(false);
      }, err => {
        return resolve(true);
      })
    })
  }
}
