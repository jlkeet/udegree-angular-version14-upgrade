import { Component } from "@angular/core";
import { UserService } from "../core/user.service";
import { AuthService } from "../core/auth.service";
import { Router } from "@angular/router";
import { FirestoreModule } from '@angular/fire/firestore';
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { UserDialogComponent } from "./user-dialog-component";
import { doc, getDoc } from 'firebase/firestore';
import { FirebaseDbService } from "../core/firebase.db.service";

@Component({
  selector: "user-container",
  templateUrl: "user-status.component.html",
  styleUrls: ["./user-status.component.scss"],
})

export class UserContainer {
  public isLoggedIn: Boolean;
  public displayName: string = "";
  public photoURL: string = "";
  public email: string = "";
  public uid: string = "";
  public isMobile: boolean = false;

  public currentUser: any = null

  constructor(
    public userService: UserService,
    public authService: AuthService,
    public db: FirestoreModule,
    private router: Router,
    private dialog: MatDialog,
    public firebaseDbService: FirebaseDbService,
  ) {

    this.authService.authState.subscribe((user: any) => {
      this.currentUser = user;
      this.photoURL = user?.photoURL;
      
      if (!this.currentUser) {
        // this.isMobile = leftPanel.mobile;
        this.isLoggedIn = false;
        this.displayName = "";
        
        // If user is not on the register page, navigate to the login page
        if (this.router.url !== "/register") {
          this.router.navigate(["/login"]);
        }
      } else {
        this.router.navigate(["planner"]);
        this.isLoggedIn = true; // User is logged in
      }
    });
  }

  // This function gets the users name from firestore collection.
  async getUserName(collection: any, document: any) {
    try {
      const docRef = doc(this.firebaseDbService.db, `${collection}/${document}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return docSnap.data()["name"];
      } else {
        console.log('No such document!');
      }
    } catch (err) {
      console.log('Error getting document:', err);
    }
  }

  public openDialog() {

    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      id: 1,
      title: 'Angular For Beginners'
  };

    const dialogRef = this.dialog.open(UserDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
        (data: any) => console.log("Dialog output:", data)
    );    
}

}
