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
  selector: 'department-list',
  templateUrl: 'department-list.component.html',
  styleUrls: ['department-list.component.scss'],
})

export class DepartmentList {
  @Output() public deptClicked = new EventEmitter();
  @Input() public majors: any;
  @Input() public departments: any[] = [];
  @Input() public faculty: any;
  @Input() public allowsMinor: boolean = false;
  @Input() public allowsDoubleMajor: boolean = false;

  // current major
  public cur = 0;
  public minor: any = null;

  public deleteDept(which: any) {
    if (which === 0) {
      this.majors[0] = this.majors[1];
      this.majors[1] = null;
      if (this.majors[0] === null) {
        this.cur = 0;
      }
    } else if (which === 1) {
      this.majors[1] = null;
    } else if (which === 2) {
      this.minor = null;
    }
    this.deptClicked.emit({
      majors: this.majors,
      minor: this.minor
    });
  }

  // would be nice to split this up, but it's slightly awkward
  public clicked(dept: any) {
    if ((this.cur === 0 && this.majors[1] !== dept ||
      this.cur === 1 && this.majors[0] !== dept) && this.minor !== dept) {
      this.majors[this.cur] = dept;
    } else if (this.cur === 2 && this.majors[0] !== dept && this.majors[1] !== dept) {
      this.minor = dept;
    } else {
      return;
    }
    this.deptClicked.emit({
      majors: this.majors,
      minor: this.minor
    });
  }

}
