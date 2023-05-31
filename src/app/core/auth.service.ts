import { Injectable } from '@angular/core';
import { Auth, GoogleAuthProvider, TwitterAuthProvider, User, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, doc, collection, setDoc, updateDoc } from '@angular/fire/firestore';
import { AdminExportService } from '../services/admin-export.service';
import { FacebookAuthProvider, signInWithPopup, getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable()
export class AuthService {

  public logInCounter = 0;
  public isLoggedIn = false;
  authState: Observable<User | null>;
  auth: Auth;
  db: Firestore;

  uid: string = '';

  constructor(
    public adminService: AdminExportService,

  ) {

    const app = initializeApp(environment.firebaseConfig);

    this.auth = getAuth(app);
    this.db = getFirestore(app);

    this.authState = new Observable((observer) => {
      this.auth.onAuthStateChanged((user) => {
        observer.next(user);
      });
    });

  }

  async doFacebookLogin(){
    try {
      const provider = new FacebookAuthProvider();
      const res = await signInWithPopup(this.auth, provider);
      if (!res.user.email) {
        throw new Error('Email is not available');
      }
      const userCollection = collection(this.db, 'users');
      const userDoc = doc(userCollection, res.user.email);
      await setDoc(userDoc, {email: res.user.email, name: res.user.displayName});
      this.isLoggedIn = true;
      return res;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }


  async doTwitterLogin(){
    try {
      const provider = new TwitterAuthProvider();
      const res = await signInWithPopup(this.auth, provider);
      if (!res.user.email) {
        throw new Error('Email is not available');
      }
      const userCollection = collection(this.db, 'users');
      const userDoc = doc(userCollection, res.user.email);
      await setDoc(userDoc, {email: res.user.email, name: res.user.displayName});
      this.isLoggedIn = true;
      return res;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
  

  async doGoogleLogin(){
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(this.auth, provider);
      if (!res.user.email) {
        throw new Error('Email is not available');
      }
      const userCollection = collection(this.db, 'users');
      const userDoc = doc(userCollection, res.user.email);
      await setDoc(userDoc, {email: res.user.email, name: res.user.displayName});
      this.isLoggedIn = true;
      return res;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async doRegister(value: { email: any; password: any; }) {
    try {
      await createUserWithEmailAndPassword(this.auth, value.email, value.password);
      const userDoc = doc(collection(this.db, 'users'), value.email);
      await setDoc(userDoc, value);
      await updateDoc(userDoc, {email: value.email, role: 'user', status: 0});
      this.isLoggedIn = true;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async doLogin(value: { email: any; password: any; }) {
    try {
      const res = await signInWithEmailAndPassword(this.auth, value.email, value.password);
      this.isLoggedIn = true;
      return res;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async doLogout() {
    try {
      this.adminService.storeHelper.update('courses', []);
      if (this.auth.currentUser) {
        this.isLoggedIn = false;
        await signOut(this.auth);
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  public getLoggedIn() {
    return this.auth.currentUser;
  }

}
