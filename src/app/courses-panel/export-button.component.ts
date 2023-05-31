import {
  Component,
  EventEmitter,
} from "@angular/core";
import { Firestore } from "@angular/fire/firestore";
import { AuthService } from "../core/auth.service";
import { UserService } from "../core/user.service";
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { CourseDialogComponent } from "./course-dialog.component";
import { GoogleAnalyticsService } from "../services/google-analytics.service";

@Component({
    host: {
      style: "flex: 3 0 auto;",
    },
    selector: "export-button",
    styleUrls: ["./courses-panel.component.scss"],
    templateUrl: "./export-button.template.html",
  })
  export class ExportButton {
    static exportButton() {
        throw new Error("Method not implemented.");
    }
  
    public email: string = "";
    public name: string = "";
    public facultyEmail: string = "";
    public url: any;
    public toggle = false;
    public status = "Export Plan"
    public onPageChange = new EventEmitter<null>();
  
    constructor(
      public db: Firestore,
      public authService: AuthService,
      public userService: UserService,
      public dialog: MatDialog,
      public googleAnalyticsService: GoogleAnalyticsService,
    ) {
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

   public openDialog() {

      const dialogConfig = new MatDialogConfig();

      dialogConfig.disableClose = true;
      dialogConfig.autoFocus = true;

      dialogConfig.data = {
        id: 1,
        title: 'Angular For Beginners'
    };

      const dialogRef = this.dialog.open(CourseDialogComponent, dialogConfig);

      dialogRef.afterClosed().subscribe(
        (          data: any) => console.log("Dialog output:", data)
      );    
  }

    public changeColor() {
      this.toggle = !this.toggle;
      this.status = this.toggle ? 'Plan Sent ✓' : 'Export Plan';
    }


    newExportEvent(){ 
      this
      .googleAnalyticsService
      .eventEmitter("export_button", "export-panel", "export", "click", 10);
    } 

}