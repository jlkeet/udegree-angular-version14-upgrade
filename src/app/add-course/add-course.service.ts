import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { ICourse } from '../interfaces';
import { DepartmentCoursesModel } from '../models';

@Injectable()
export class AddCourseService {

  public curScroll: any;

  public departmentCourses: DepartmentCoursesModel[] = [];
  
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

  public groupByDepartment(courses: ICourse[]) {
    const grouped = courses.reduce((groups: any, course) => {
      // Check if course.department exists
      if (course?.department) {  
        for (let i = 0; i < course.department.length; i++) {
          const key = course.department[i];
          (groups[key] = groups[key] || []).push(course);
        }
      }
      return groups;
    }, {});
    return grouped;
  }
  

  public mapToDeptModel(grouped: any) {
    const departmentCourses: DepartmentCoursesModel[] = [];
    for (const property in grouped) {
      if (grouped.hasOwnProperty(property)) {
        const department = departmentCourses.find(
          (dept: DepartmentCoursesModel) => dept.department === property);
        if (department === undefined) {
          departmentCourses.push(
            new DepartmentCoursesModel(
              null,
              property,
              property,
              grouped[property]
            )
          );
        } else {
          department.courses.push(grouped[property]);
        }
      }
    }
    this.departmentCourses = departmentCourses;
    return departmentCourses;
  }
}
