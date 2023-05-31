import { Component } from "@angular/core";
import { StoreHelper } from "../services";

import { HostListener } from "@angular/core";
import { AddCourseContainer } from "./add-course-container";
import { MobileService } from "../services/mobile.service";

@Component({
  selector: "left-panel",
  styles: [
    `
      .panel {
        width: 360px;
        background: white;
        border: 1px solid #f4f7f8;
        border-radius: 10px;
        margin-top: 10px;
        float: left;
        display: inline;
        overflow-y: scroll;
        max-height: 80vh;
      }

      .panel-mobile {
        background: white;
        border: 1px solid #f4f7f8;
        border-radius: 10px;
        margin-top: 10px;
      }

      .expand {
        background: #eee;
        height: 100px;
        color: black;
        display: flex;
        border-radius: 0px 10px 10px 0px;
        width: 20px;
        position: absolute;
        top: 10px;
        right: 15px;
        cursor: pointer;
      }

      .expand:hover {
        background: #dedede;
      }

      .margin-auto {
        margin: auto;
      }
      .relative {
        position: relative;
      }
    `,
  ],
  template: `
    <div *ngIf="!mobile" class="relative">
      <div class="panel">
        <progress-panel (onPageChange)="changePage()"></progress-panel>
      </div>
    </div>

    <div
      *ngIf="mobile"
      class="relative"
      (touchstart)="mobileService.swipe($event, 'start')"
      (touchend)="mobileService.swipe($event, 'end')"
    >
      <mat-tab-group #tabGroup mat-align-tabs="start" [(selectedIndex)]="this.mobileService.tabIndex">
        <mat-tab label="Degree View">
          <div class="panel-mobile">
            <progress-panel (onPageChange)="changePage()"></progress-panel>
          </div>
        </mat-tab>
        <mat-tab label="Semester View">
          <planner-container-mobile></planner-container-mobile>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
})
export class LeftPanelContainer {
  private progress = false;
  private collapsed = false;
  public mobile = false;
  private screenHeight: any;
  private screenWidth: any;

  constructor (

    private storeHelper: StoreHelper, 
    public mobileService: MobileService,
    // public addCourse: AddCourseContainer
    ) {
    this.onResize();
  }

  @HostListener("window:resize", ["$event"])
  onResize(event?: any) {
    this.screenHeight = window.innerHeight;
    this.screenWidth = window.innerWidth;

    if (this.screenWidth < 768) {
      this.mobile = true;
    } else {
      this.mobile = false;
    }
  }

  private ngOnInit() {
    this.progress = this.storeHelper.current("page");
    this.collapsed = this.storeHelper.current("collapsed");

    if (this.screenWidth < 768) {
      this.mobile = true;
    }
  }

  public changePage() {
    const page = this.storeHelper.update("page", !this.progress);
    this.progress = !this.progress;
  }

  public collapse() {
    const collapsed = this.storeHelper.update("collapsed", !this.collapsed);
    this.collapsed = !this.collapsed;
  }

  public whichTab() {
    // this.selectedTab = this.addCourse.tabIndex;
    return this.mobileService.tabIndex;
  }

}
