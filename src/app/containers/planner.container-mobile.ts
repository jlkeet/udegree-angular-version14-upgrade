import { Component, ViewEncapsulation } from '@angular/core';
import { Store } from '../app.store';
import { ICourse } from '../interfaces';
import {
  ClickedEvent,
  CourseService,
  IRequirement,
  MovedEvent,
  RemovedEvent,
  RequirementService,
  StoreHelper
} from '../services';

import { AppHeader } from '../app.header.component';
import { pluck } from 'rxjs/operators';

/*
  Container for the planning page.
  This container will respond to changes in the store.
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'planner-container-mobile',
  // TODO review styles
  styles: [
    `
    .planner-container {
        display: flex;
        flex-direction: row;
        width: 100%;
    }
    .fullwidth {
      width: 100%;
    }

    .planner-container-mobile {
      flex-direction: row;
      width: 100%;
  }
  .fullwidth-mobile {
    width: 100%;
  }

  `
  ],
  template: `
          <div class='flex flex-col relative fullwidth'>
              <course-details *ngIf='selected' [showAddCourse]='false' [course]='selected'
              (cancelClicked)='cancelCourse($event)'
              (changeStatus)='changeStatus($event)' (changeGrade)='changeGrade($event)'
              [messageRequirements]="messageRequirements"
              [messages]="messages" (deleteClicked)='deleteCourse($event)'
              ></course-details>
              <courses-panel  [courses]='planned' (courseMoved)='handleCourseMoved($event)'
              (courseRemoved)='handleCourseRemoved($event)' (courseClicked)='handleCourseClicked($event)'>
              </courses-panel>
          </div>
  `
})
export class PlannerContainerMobile {
  public planned: ICourse[] = [];
  public messages: string[] = [];
  public messageRequirements: IRequirement[] = [];
  public majorSelected: boolean = false;
  public selected: ICourse = null as any;
  public sub: any;
  public isMobile;

  constructor(
    public requirementService: RequirementService,
    public storeHelper: StoreHelper,
    public store: Store,
    public courseService: CourseService,
    public appHeader: AppHeader,
  ) {
    this.isMobile = appHeader.mobile;
  }

  public ngOnInit() {
    this.sub = this.store.changes.pipe(pluck('courses')).
      subscribe( (courses: ICourse[]) => this.planned = courses);
  }

  public ngOnDestroy() {
    this.sub.unsubscribe();
 }

  public handleCourseMoved(event: MovedEvent) {
    // move course to another semester
    this.courseService.moveCourse(event.courseId, event.period, event.year);
  }
  public handleCourseRemoved(event: RemovedEvent) {
    // remove course from semester
    this.courseService.deselectCourseByName(event.course);
  }

  public handleCourseClicked(event: ClickedEvent) {
    const course = event.course;
    this.messageRequirements = this.getCourseErrors(course);
    this.messages = this.messageRequirements.map((requirement: IRequirement) =>
      this.requirementService.toString(requirement, false)
    );
    this.selected = course;
  }

  private getCourseErrors(course: ICourse): IRequirement[] {
    if (
      !course ||
      !course.requirements ||
      course.period === undefined ||
      course.year === undefined
    ) {
      return [];
    }

    const errors: IRequirement[] = [];

    course.requirements.forEach((requirement: IRequirement) => {
      if (this.requirementService.isComplex(requirement)) {
        const subRequirements = requirement.complex || [];
        const failedSubRequirements = subRequirements.filter(
          (subRequirement: IRequirement) => {
            const plannedPool = this.requirementService.checkCoRequesiteFlag(
              subRequirement,
              "isCorequesite"
            )
              ? this.currentSemester(course)
              : this.beforeSemester(course);

            return !this.requirementService.requirementFilled(
              subRequirement,
              plannedPool,
              course
            );
          }
        );

        const requiredCount =
          requirement.required !== undefined
            ? Math.min(requirement.required, subRequirements.length)
            : subRequirements.length;
        const satisfiedCount = subRequirements.length - failedSubRequirements.length;

        if (satisfiedCount < requiredCount) {
          errors.push(requirement);
        }
        return;
      }

      const plannedPool = this.requirementService.checkCoRequesiteFlag(
        requirement,
        "isCorequesite"
      )
        ? this.currentSemester(course)
        : this.beforeSemester(course);
      if (!this.requirementService.requirementFilled(requirement, plannedPool, course)) {
        errors.push(requirement);
      }
    });

    return errors;
  }

  private beforeSemester(course: ICourse): ICourse[] {
    return this.planned.filter(
      (plannedCourse: ICourse) =>
        ((plannedCourse.period as number) < (course.period as number) &&
          plannedCourse.year === course.year) ||
        (plannedCourse.year as number) < (course.year as number)
    );
  }

  private currentSemester(course: ICourse): ICourse[] {
    return this.planned.filter(
      (plannedCourse: ICourse) =>
        plannedCourse.period === course.period &&
        plannedCourse.year === course.year
    );
  }
  
  
  public cancelCourse(event: any) {
    this.selected = null as any;
  }

  public changeStatus(event: any) {
    this.courseService.changeStatus(event.course, event.status);
  }

  public changeGrade(event: any) {
    this.courseService.changeGrade(event.course, event.grade);
  }

  public deleteCourse(event: any) {
    this.courseService.deselectCourseByName(event.course);
  }

}
