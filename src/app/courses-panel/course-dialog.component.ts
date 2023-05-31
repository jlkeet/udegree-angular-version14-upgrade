import { Component, EventEmitter, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef, MatDialog} from "@angular/material/dialog";
import { AuthService } from "../core/auth.service";
import { UserService } from "../core/user.service";
import html2canvas from 'html2canvas';
// import * as firebase from "firebase";
// import * as firebase from 'firebase/app';
import { FirebaseDbService } from "../core/firebase.db.service";

@Component({
    selector: 'course-dialog',
    templateUrl: './course-dialog.template.html',
    styleUrls: ['./courses-panel.component.scss']
})
export class CourseDialogComponent implements OnInit {

    form: FormGroup | undefined;
    description:string;

    public email: string = "";
    private name: string = "";
    private facultyEmail: string = "";
    private toggle = false;
    private status = "Export Plan"
    private onPageChange = new EventEmitter<null>();

    constructor(
        public firebaseDbService: FirebaseDbService,
        public authService: AuthService,
        private userService: UserService,
        public dialog: MatDialog,
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<CourseDialogComponent>,
        @Inject(MAT_DIALOG_DATA) data : any) {

        this.description = data.description;
        this.userService.getCurrentUser().then((user) => {
            if (user) {
              if (user.displayName) {
                this.name = user.displayName;
              } else {
                console.log("user.displayName is null")
              }
              if (user.email) {
                this.email = user.email;
              } else {
                console.log("user.email is null")
              }
            } else {
                console.log("user is null")
            }
          });
        }
          

    ngOnInit() {
        this.form = this.fb.group({
            description: [this.description, []]
            });
    }

    save() {
        this.dialogRef.close();
    }

    close() {
        this.dialogRef.close();
    }



public exportButton() {
      //   this.facultyEmail = this.storeHelper.current("faculty").name  
      // switch(this.facultyEmail) {
      //   case "Arts":
      //     console.log("Arts Faculty Email");
      //     this.facultyEmail = "asc@auckland.ac.nz"
      //     break;
      //   case "Science":
      //     console.log("Science Faculty Email");
      //     this.facultyEmail = "scifac@auckland.ac.nz"
      //     break;
      //   }
  
      // this.facultyEmail = "jackson@udegree.co"
      // setTimeout(()=>{

// Come back to this, new firebase code needed.


      // html2canvas(document.body).then((canvas: any) =>  { 
      //   canvas.toBlob(function(blob: any) {
      //     var newImg = document.createElement('img'),
      //         url = URL.createObjectURL(blob);
      //         let dataURL = canvas.toDataURL("image/png");
      //   firebase.storage().ref("/users/" + this.auth.email + "/images/").child("plan").put(blob).then(() => {}
      //     )})})

      //   }, 2000);

      //     setTimeout(()=>{
      //       this.getImage()}, 9000);
      // }
    
      // private getImage() {
      //   var storageRef = firebase.storage().ref("/users/" + this.email + "/images/").child("plan")
      //   .getDownloadURL()
      //   .then((url: string | URL) => {
      //     var xhr = new XMLHttpRequest();
      //     xhr.responseType = 'blob';
      //     xhr.onload = (event) => {
      //       var blob = xhr.response;
      //     };
      //     xhr.open('GET', url);
      //     xhr.send();
      //     this.sendImage(url)
      //   })
      //   .catch((error: any) => {
      //     console.log(error)
      //   });
      // }
    
      // private sendImage(url: any) {
      //   const email = "jackson@mg.udegree.co"
      //   const subject = this.name + "'s Plan"
      //   const message = {
      //     from: email,
      //     to: "harry@udegree.co",
      //     // cc: "jackson.keet@udegree.co",
      //     message: {
      //         subject: subject,
      //         html: '<p>Here’s an attachment for you!</p>',
      //         attachments: [{
      //           filename: "plan.png",
      //           path: url,
      //           type: 'image/png',
      //           }],
      //     }
      //   }
        
      //   this.firebaseDbService.addSelection(this.email, "mail", message, url)
      }


}