import { Component, EventEmitter, Injectable, Input, Output, SimpleChanges } from '@angular/core';
import { Database } from '@angular/fire/database';
import { FirestoreModule } from '@angular/fire/firestore';
import { ICourse } from '../interfaces';
import { CourseService, StoreHelper } from '../services';

@Component({
  selector: 'add-course-panel',
  styleUrls: ['./courses-panel.component.scss'],
  templateUrl: 'courses-panel.component.html',
})

@Injectable()
export class AddCoursePanel {
  @Input() public departmentCourses: any;

  @Output() public addCourseClicked = new EventEmitter();
  @Output() public cancelClicked = new EventEmitter();

  public courseStatus: any;
  public curScroll: any;
  public scrollTo: any;
  

  constructor(public courseService: CourseService, public storeHelper: StoreHelper, public db_courses: Database, public db: FirestoreModule) { }

  ngOnChanges(changes: SimpleChanges){
    this.scrollTo = 10;
    this.curScroll = this.departmentCourses.slice(0, this.scrollTo);
  }

  // should change to appending to curScroll
  public onScroll() {
    this.scrollTo = Math.min(this.scrollTo + 2, this.departmentCourses.length);
    this.curScroll = this.departmentCourses.slice(0, this.scrollTo);
  }

  public mapCourse(course: ICourse) {
    const mappedCourse: any = {
      checked: null,
      desc: course.desc,
      id: course.id,
      message: null,
      name: course.name,
      points: course.points,
      requirements: course.requirements,
      title: course.title,
    };
    const plannedCourse = this.courseService.findPlanned(course.name);
    if (plannedCourse !== undefined) {
      mappedCourse.checked = 'checked'; // to use the html element, you need to specify checked instead of a boolean
      mappedCourse.message = 'Course planned in ' + plannedCourse.year + ', Semester ' + plannedCourse.period;
    }
    return mappedCourse;
  }
}
