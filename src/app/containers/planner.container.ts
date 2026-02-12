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
} from '../services';

import { AppHeader } from '../app.header.component';
import { FirebaseDbService } from '../core/firebase.db.service';
import { SamplePlanService } from '../services/sample-plan.service';
import { Router } from '@angular/router';
import { pluck } from 'rxjs/operators';

/*
  Container for the planning page.
  This container will respond to changes in the store.
 */
@Component({
  encapsulation: ViewEncapsulation.None,
  selector: 'planner-container',
  // TODO review styles
  styles: [
    `
    .planner-container {
        display: flex;
        flex-direction: row;
        width: 100%;
        gap: 12px;
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

  .planner-actions {
    width: calc(100% - 28px);
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 28px;
    margin-top: 4px;
    margin-bottom: 14px;
  }

  .planner-toolbar {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: fit-content;
    background: #f8fbfd;
    border: 1px solid #e1ebf1;
    border-radius: 9px;
    padding: 5px;
    box-shadow: 0 6px 14px rgba(47, 87, 112, 0.08);
  }

  .action-btn {
    border: 1px solid #9cb3c2;
    border-radius: 7px;
    background: #ffffff;
    color: #4f6a7b;
    font-weight: 700;
    font-size: 14px;
    letter-spacing: 0.01em;
    padding: 8px 14px;
    transition: all 0.2s ease;
    cursor: pointer;
  }

  .action-btn:hover:not(:disabled) {
    border-color: #4f9fcc;
    color: #2e5b76;
  }

  .action-btn:disabled {
    opacity: 0.6;
    cursor: wait;
  }

  .action-btn--primary {
    background: linear-gradient(145deg, #2b9fdf 0%, #1b89ca 100%);
    border-color: #1b89ca;
    color: #fff;
    box-shadow: 0 8px 18px rgba(27, 137, 202, 0.25);
  }

  .action-btn--primary:hover:not(:disabled) {
    border-color: #1378b4;
    background: linear-gradient(145deg, #2796d3 0%, #157bb5 100%);
    color: #fff;
  }

  .planner-status {
    font-size: 13px;
    color: #657a88;
    min-height: 20px;
    padding-left: 2px;
  }

  .planner-status--running {
    color: #2c83b1;
  }

  .planner-status--ready {
    color: #2e7f3a;
  }

  @media (max-width: 1200px) {
    .planner-actions {
      width: calc(100% - 10px);
      padding-left: 12px;
      margin-top: 2px;
    }
  }

  `
  ],
  template: `
        <div *ngIf="!isMobile" class='planner-container'>

          <left-panel></left-panel>

          <div class='flex flex-col relative fullwidth'>
            <div class="planner-actions">
              <div class="planner-toolbar">
                <button class="action-btn action-btn--primary" [disabled]="autoPlanRunning" (click)="samplePlan()">
                  {{ autoPlanRunning ? 'PLANNING...' : 'DO IT FOR ME' }}
                </button>
                <button class="action-btn" (click)="explorerClick()">EXPLORER</button>
              </div>
              <div
                class="planner-status"
                [class.planner-status--running]="autoPlanRunning"
                [class.planner-status--ready]="!autoPlanRunning && autoPlanStatusMessage !== defaultPlanHint"
              >
                {{ autoPlanStatusMessage }}
              </div>
            </div>
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
        </div>


        <div *ngIf="isMobile" class='planner-container-mobile'>
        <left-panel></left-panel>
      </div>

  `
})
export class PlannerContainer {

  public planned: ICourse[] = [];
  public messages: string[] = [];
  public messageRequirements: IRequirement[] = [];
  public majorSelected: boolean = false;
  public selected: ICourse = null as any;
  public sub: any;
  public isMobile;
  public autoPlanRunning = false;
  public readonly defaultPlanHint =
    "Autoplan will fill your schedule and add selection cards where choices remain.";
  public autoPlanStatusMessage = this.defaultPlanHint;

  constructor(
    private requirementService: RequirementService,
    private store: Store,
    private courseService: CourseService,
    private appHeader: AppHeader,
    public dbCourses: FirebaseDbService,
    public samplePlanService: SamplePlanService,
    private router: Router,
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
    
    // This calls the Firebase audit-log previous value on course deletion
    // this.dbCourses.setAuditLogDeleteCourse(event.course.name);

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
  

  public explorerClick() {
    this.router.navigate(["/explorer"]);
  }

  public cancelCourse(even: any) {
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

  public async samplePlan() {
    this.autoPlanRunning = true;
    this.autoPlanStatusMessage = "Building your plan...";

    try {
      await this.samplePlanService.setCourse();
      this.autoPlanStatusMessage = "Plan updated. Review highlighted selection cards.";
    } finally {
      this.autoPlanRunning = false;
    }
  }

}
