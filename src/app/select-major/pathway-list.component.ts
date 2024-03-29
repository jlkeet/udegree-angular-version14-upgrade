import { Component, EventEmitter, Input, Output } from '@angular/core';

/*
    Displays a list of department tiles.
    In theory this could get way more complicated
    But it looks like UoA might've stopped minors altogether

    This should be reworked to give a bit more flexibility,
    It's currently very specific for two major, one minor

    Also needs a better styling
 */
@Component({
  selector: 'pathway-list',
  templateUrl: 'pathway-list.component.html',
  styleUrls: ['pathway-list.component.scss'],
})

export class PathwayList {
  @Output() public deptClicked = new EventEmitter();
  @Input() public majors: any;
  @Input() public departments: any[] = [];
  @Input() public faculty: any;
  @Input() public allowsMinor: boolean = false;
  @Input() public allowsDoubleMajor: boolean = false;
  @Input() public pathways: any;


  // current major
  public cur = 0;
  public minor: any = null;

  public deleteDept(which: any) {
    if (which === 0) {
      this.pathways[0] = this.pathways[1];
      this.pathways[1] = null;
      if (this.pathways[0] === null) {
        this.cur = 0;
      }
    } else if (which === 1) {
      this.pathways[1] = null;
    } else if (which === 2) {
      this.minor = null;
    }
    this.deptClicked.emit({
        pathways: this.pathways,
      minor: this.minor
    });
  }

  // would be nice to split this up, but it's slightly awkward
  public clicked(path: any) {
    if ((this.cur === 0 && this.pathways[1] !== path ||
      this.cur === 1 && this.pathways[0] !== path)) {
      this.pathways[this.cur] = path;
    } else if (this.cur === 2 && this.pathways[0] !== path && this.pathways[1] !== path) {
      this.minor = path;
    } else {
      return;
    }
    this.deptClicked.emit({
      pathways: this.pathways,
      minor: this.minor
    });
  }

}
