import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class AddCourseService {

  private toggleCourseSource = new Subject();
  private toggleDetailsSource = new Subject();
  public courseToggled = this.toggleCourseSource.asObservable();
  public detailsToggled = this.toggleDetailsSource.asObservable();

  public raiseCourseToggle(course: any) {
    this.toggleCourseSource.next(course);
  }

  public raiseDetailsToggled(course: any) {
    this.toggleDetailsSource.next(course);
  }
}
