import { Component } from "@angular/core";
import { AuthService } from "../core/auth.service";
import { AdminExportService } from "../services/admin-export.service"

/*
      A component for exporting to admin site.
  */

@Component({
  selector: "admin-export",
  templateUrl: "./admin-export.template.html",
  styleUrls: ["./admin-export.component.scss"],
})
export class AdminExport {
  public adminStatus: any;
  public isAdmin: any;

  constructor(public adminService: AdminExportService, public authService: AuthService) {

  }

  public ngOnInit() {
    // this.adminService.getExportStatus();
    // this.adminService.getAdmin();

  }

}