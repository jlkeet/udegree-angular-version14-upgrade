import { Component, Injectable, Input } from '@angular/core';
import { Database } from '@angular/fire/database';
import { AddCourseService } from './add-course.service';

@Component({
  selector: 'course-card',
  styleUrls: ['./course-card.component.scss'],
  templateUrl: 'course-card.component.html',
})

@Injectable()
export class CourseCard {
  @Input() public course : any;
  @Input() public id: number = 0;

  constructor(public addCourseService: AddCourseService, public db_courses: Database) { }

  public toggleDetails(course: any) {
    this.addCourseService.raiseDetailsToggled(course);    
  }

  public check(event: any, course: any) {
    event.stopPropagation();
    this.addCourseService.raiseCourseToggle(course);
  }
}
