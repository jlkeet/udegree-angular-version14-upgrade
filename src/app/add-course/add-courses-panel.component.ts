import { Component, EventEmitter, Injectable, Input, Output, SimpleChanges } from '@angular/core';
import { Database } from '@angular/fire/database';
import { FirestoreModule } from '@angular/fire/firestore';
import { ICourse } from '../interfaces';
import { CourseService, StoreHelper } from '../services';
import { AddCourseService } from './add-course.service';

@Component({
  selector: 'add-course-panel',
  styleUrls: ['./add-courses-panel.component.scss'],
  templateUrl: './add-courses-panel.component.html',
})

@Injectable()
export class AddCoursePanel {
  @Input() public departmentCourses: any;

  @Output() public addCourseClicked = new EventEmitter();
  @Output() public cancelClicked = new EventEmitter();

  public courseStatus: any;
  public curScroll: any;
  public scrollTo: any;
  

  constructor(public courseService: CourseService, public storeHelper: StoreHelper, public addCourseService: AddCourseService) { }

  ngOnChanges(changes: SimpleChanges){
    this.scrollTo = 10;

    this.addCourseService.curScroll = this.addCourseService.departmentCourses?.slice(0, this.scrollTo);
    // this.curScroll = this.departmentService.departments.slice(0, this.scrollTo);    
  }

  // should change to appending to curScroll
  public onScroll() {
    this.scrollTo = Math.min(this.scrollTo + 2, this.addCourseService.departmentCourses.length);
    this.addCourseService.curScroll = this.addCourseService.departmentCourses.slice(0, this.scrollTo);

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
