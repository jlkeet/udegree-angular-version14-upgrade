import { Component } from '@angular/core';
import { HostListener } from "@angular/core";
import { pluck } from 'rxjs/operators';


/*
  Component that displays the site header
*/
@Component({
  selector: 'app-header',
  styles: [`
    .app-header-logo {
            width:40px;
            height: 45px;
            vertical-align: middle;
            margin: 0 15px 0 20px;    //Left margin to align with cards content
    }
    .app-header-strap {
        display: inline-block;
    }
    .mat-toolbar{
      height:75px;
      border-bottom: 1px solid #eee;
      background: #fff;
      -webkit-touch-callout: none; /* iOS Safari */
      -webkit-user-select: none; /* Safari */
      -khtml-user-select: none; /* Konqueror HTML */
      -moz-user-select: none; /* Firefox */
      -ms-user-select: none; /* Internet Explorer/Edge */
      user-select: none; /* Non-prefixed version, currently supported by Chrome and Opera */
    }
    .title {
      font-size:26px;
      font-family: 'Open Sans', sans-serif;
      color: #565656;
      pointer: default; 
    }
    a:hover {
      text-decoration: none;
    }
    .u{
      font-weight:bold
    }
    .right-side {
      color: #444;
      padding-right: 50px;
    }

    .header {
      width: 360px;
    }
  `],
  template: `
      <mat-toolbar>
        <span>
          <a href><img src="./assets/img/logo.png" class="app-header-logo"  [routerLink]="['/planner']"/></a>
        </span>
        <a href><span class="title" [routerLink]="['/planner']">
        <span class="u">Udegree</span>
        </span></a>
        <span class="spacer"> </span>
        <span *ngIf="!this.mobile" class="right-side">
          <user-container></user-container>
        </span>
        <span *ngIf="this.mobile">
        <user-container></user-container>
      </span>
      </mat-toolbar>
  `,
})
export class AppHeader {

public mobile = false;
private screenHeight: any;
private screenWidth: any;

// private slogan: string;
//     constructor(private store: Store ) {
//           this.store.changes.pipe(pluck('slogan'))
//         .subscribe((slogan: string) => {
//           this.slogan = slogan;
//         });
//         this.onResize();
//     }

    @HostListener('window:resize', ['$event'])
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
  if (this.screenWidth < 768) {
    this.mobile = true;
  }
}

}

