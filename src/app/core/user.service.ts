import { Injectable } from "@angular/core";
// import 'rxjs/add/operator/toPromise';
import { Auth, User, getAuth, onAuthStateChanged, updateProfile } from '@angular/fire/auth';
import { initializeApp } from "@angular/fire/app";
import { environment } from "src/environments/environment";


@Injectable()
export class UserService {

  auth: Auth;

  constructor(
 ){

  const app = initializeApp(environment.firebaseConfig);

  this.auth = getAuth(app);
  }

  getCurrentUser() {
    return new Promise<User | null>((resolve, reject) => {
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          resolve(user);
        } else {
          reject('No user logged in');
        }
      });
    });
  }
  
  async updateCurrentUser(value: { name: any; photoURL: any; }) {
    try {
      if (this.auth.currentUser) {
        await updateProfile(this.auth.currentUser, {
          displayName: value.name, // This is for future application having a profile if necessary
          photoURL: value.photoURL,
        });
      } else {
        throw new Error('No user logged in');
      }
    } catch (err) {
      console.log('Error updating profile:', err);
      throw err;
    }
  }
  
}
