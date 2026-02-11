import {
  Component,
  Input,
  EventEmitter,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
} from "@angular/core";
import { Store } from "../app.store";
import { ICourse } from "../interfaces";
import { CourseStatus } from "../models";
import { CourseService } from "../services/courses";
import { RequirementService } from "../services";
import { IBarState } from "./progress-bar-multi.component";
import { Subscription } from "rxjs";
import { pluck } from "rxjs/operators";

@Component({
  selector: "progress-bar-multi-container",
  styleUrls: ['./progress-bar-multi.component.scss'],
  templateUrl: "progress-bar-multi.container.template.html",
  changeDetection: ChangeDetectionStrategy.OnPush // Needed to suppress after change error for now
})

/*
 This component is the container for a progressbar. It is responsible for configuing the progress bar
 with the data it needs.
 I did trial writing one container per progress bar e.g. progress-bar-total.container, progress-bar-level-three
 But this led to a lot of classes that were virtually identical.
 Therefore settled for a generic container, where the differences (title, etc) and course filter are passed in.
 Courses are updated byt subscribing to the courses observable on the store.

 TODO: tests
*/
export class ProgressBarMultiContainer implements OnDestroy {
  @Input() public requirement: any;
  @Input() public courses: any;
  @Input() public isComplex: boolean = false;
  @Input() public index: number = 0;
  @Input() public majIndex: number = 0;
  @Input() public isTotal: boolean = false;

  public hoverText: any;
  public hoverTextComplex: any;
  public max = 0;
  public title: any;
  public inactive: boolean = false;
  public barOneState: IBarState = { value: 0, color: "#66cc00" , full: false, index: 0, majIndex: 0, isTotal: false};
  public barTwoState: IBarState = { value: 0, color: "#f2d600" , full: false, index: 0, majIndex: 0, isTotal: false};
  public barThreeState: IBarState = { value: 0, color: "#66bbff" , full: false, index: 0, majIndex: 0, isTotal: false};
  public barFourState: IBarState = { value: 0, color: "#c7d2dd", full: false, index: 0, majIndex: 0, isTotal: false };
  public onPageChange = new EventEmitter<null>();
  public complexBool: boolean = false;
  public complexRule: any;
  public combinedRule: any= [];


  public barOneStateComplex: any = [];
  public barTwoStateComplex: any = [];
  public barThreeStateComplex: any = [];
  public barFourStateComplex: any = [];
  private semesterSubscription: Subscription | null = null;

  constructor(
    private store: Store,
    private requirementService: RequirementService,
    private courseService: CourseService,
    private cdr: ChangeDetectorRef
  ) {}

  public ngOnChanges() {
    this.updateState(this.courses);
  }

  public ngOnInit() {
    this.semesterSubscription = this.store.changes
      .pipe(pluck("semesters"))
      .subscribe(() => {
        this.updateState(this.courses);
        this.cdr.markForCheck();
      });

    if (!this.requirement) {
      this.title = "";
      this.hoverText = "";
      this.max = 0;
      this.isComplex = false;
      this.updateState(this.courses);
      return;
    }

    this.title = this.requirementService.shortTitle(this.requirement);
    this.hoverText = this.requirementService.toString(this.requirement, false);
    
    if (this.requirementService.isComplex(this.requirement)) {
      this.isComplex = true;
      this.complexRule = Array.isArray(this.requirement.complex) ? this.requirement.complex : [];
      this.combinedRule = [];
      
      for (let i = 0; i < this.complexRule.length; i++)
      {
        this.combinedRule.push({
          rule: this.requirementService.toString(this.complexRule[i], false),
          complexMax: this.complexRule[i].required,
          hoverText: this.requirementService.toString(this.complexRule[i], false)
        })
        // this.max = this.combinedRule[i].complexMax
      }
  } else {
    this.max = this.requirement.required;
    this.isComplex = false;
  }

    this.updateState(this.courses);
  }

  public ngOnDestroy() {
    if (this.semesterSubscription) {
      this.semesterSubscription.unsubscribe();
      this.semesterSubscription = null;
    }
  }

  private updateState(courses: ICourse[]) {
    if (this.inactive) {
      return;
    }

    if (!this.requirement) {
      this.barOneState = Object.assign({}, this.barOneState, { value: 0 });
      this.barTwoState = Object.assign({}, this.barTwoState, { value: 0 });
      this.barThreeState = Object.assign({}, this.barThreeState, { value: 0 });
      this.barFourState = Object.assign({}, this.barFourState, { value: 0 });
      return;
    }

    if (this.requirementService.isComplex(this.requirement)) {
      // for (let i = 0; i < this.requirement.complex.length; i++) {
      // this.barOneStateComplex.push(this.getComplexBarValue(
      //   this.barOneState,
      //   this.courses,
      //   CourseStatus.Completed,
      //   this.requirement.complex[i]
      // ));

      // this.barTwoStateComplex.push(this.getComplexBarValue(
      //   this.barTwoState,
      //   this.courses,
      //   CourseStatus.Enrolled,
      //   this.requirement.complex[i],
      // ));

      // this.barThreeStateComplex.push(this.getComplexBarValue(
      //   this.barThreeState,
      //   this.courses,
      //   CourseStatus.Planned,
      //   this.requirement.complex[i],
      // ));
      // }
      this.updateComplexBars(courses)
      
    } else {

    this.barOneState = this.getBarValue(
      this.barOneState,
      courses,
      CourseStatus.Completed
    );

    this.barTwoState = this.getBarValue(
      this.barTwoState,
      courses,
      CourseStatus.Enrolled
    );
    this.barThreeState = this.getBarValue(
      this.barThreeState,
      courses,
      CourseStatus.Planned,
      false
    );
    this.barFourState = this.getTempCardBarValue(this.barFourState);
  }
}

  private getBarValue(
    currentState: IBarState,
    courses: ICourse[],
    status: CourseStatus,
    includeTempCards: boolean = false,
  ) {
    const coursesForStatus = this.getCoursesForStatus(courses, status, includeTempCards);

    if (coursesForStatus === undefined || coursesForStatus.length === 0) {
      return Object.assign({}, currentState, { value: 0 });
    }

    const value = this.requirementService.fulfilledByStatus(
      this.requirement,
      coursesForStatus,
      status
    );
    return Object.assign({}, currentState, { value });
  }

  private getTempCardBarValue(currentState: IBarState) {
    const tempCardCourses = this.getTempCardPlaceholderCourses();

    if (tempCardCourses.length === 0) {
      return Object.assign({}, currentState, { value: 0 });
    }

    const value = this.requirementService.fulfilledByStatus(
      this.requirement,
      tempCardCourses,
      CourseStatus.Planned
    );

    return Object.assign({}, currentState, { value });
  }

  private getComplexBarValue(
    currentState: IBarState,
    courses: ICourse[],
    status: CourseStatus,
    requirement: any,
    includeTempCards: boolean = false
  ) {
    const coursesForStatus = this.getCoursesForStatus(courses, status, includeTempCards);
    const value = this.requirementService.fulfilledByStatus(
      requirement,
      coursesForStatus,
      status
    );
    return Object.assign({}, currentState, { value });

  }

  private getTempCardComplexBarValue(currentState: IBarState, requirement: any) {
    const tempCardCourses = this.getTempCardPlaceholderCourses();

    if (tempCardCourses.length === 0) {
      return Object.assign({}, currentState, { value: 0 });
    }

    const value = this.requirementService.fulfilledByStatus(
      requirement,
      tempCardCourses,
      CourseStatus.Planned
    );

    return Object.assign({}, currentState, { value });
  }

  private getCoursesForStatus(
    courses: ICourse[],
    status: CourseStatus,
    includeTempCards: boolean = false
  ): ICourse[] {
    const baseCourses = Array.isArray(courses) ? courses : [];

    if (status !== CourseStatus.Planned || !includeTempCards) {
      return baseCourses;
    }

    return baseCourses.concat(this.getTempCardPlaceholderCourses());
  }

  private getTempCardPlaceholderCourses(): ICourse[] {
    const semesters = this.store.getState()?.semesters || [];
    const placeholders: ICourse[] = [];

    semesters.forEach((semester: any, semesterIndex: number) => {
      const tempCards = Array.isArray(semester?.tempCards) ? semester.tempCards : [];
      tempCards.forEach((tempCard: any, tempCardIndex: number) => {
        placeholders.push(
          this.toTempCardPlaceholderCourse(
            tempCard,
            semester,
            semesterIndex * 1000 + tempCardIndex
          )
        );
      });
    });

    return placeholders;
  }

  private toTempCardPlaceholderCourse(
    tempCard: any,
    semester: any,
    fallbackIndex: number
  ): ICourse {
    const generatedId = Number(tempCard?.generatedId);
    const resolvedGeneratedId = Number.isFinite(generatedId)
      ? generatedId
      : -(fallbackIndex + 1);
    const departments = Array.isArray(tempCard?.departments)
      ? tempCard.departments.filter((department: any) => typeof department === "string")
      : [];
    const faculties = Array.isArray(tempCard?.faculties)
      ? tempCard.faculties.filter((faculty: any) => typeof faculty === "string")
      : [];
    const resolvedDepartments =
      departments.length > 0
        ? departments
        : typeof tempCard?.department === "string"
        ? [tempCard.department]
        : [];
    const resolvedFaculties =
      faculties.length > 0
        ? faculties
        : typeof tempCard?.faculty === "string"
        ? [tempCard.faculty]
        : this.inferFacultiesFromDepartments(
            departments.length > 0
              ? (departments as string[])
              : typeof tempCard?.department === "string"
              ? [tempCard.department]
              : []
          );
    const resolvedStage =
      typeof tempCard?.level === "number" && tempCard.level > 0
        ? tempCard.level
        : Array.isArray(tempCard?.stages) &&
          tempCard.stages.length === 1 &&
          typeof tempCard.stages[0] === "number"
        ? tempCard.stages[0]
        : undefined;
    const resolvedStages = Array.isArray(tempCard?.stages)
      ? Array.from(
          new Set(
            tempCard.stages.filter(
              (stage: number) => typeof stage === "number" && stage > 0
            )
          )
        )
      : [];
    const nameSuffix = tempCard?.general ? "G" : "";
    const resolvedName =
      typeof tempCard?.paper === "string" && tempCard.paper.trim().length > 0
        ? tempCard.paper.trim().toUpperCase()
        : `TEMPCARD${Math.abs(resolvedGeneratedId)}${nameSuffix}`;

    return {
      id: resolvedGeneratedId,
      generatedId: resolvedGeneratedId,
      name: resolvedName,
      desc: "Auto-generated selection placeholder",
      faculties: resolvedFaculties,
      department: resolvedDepartments,
      points:
        typeof tempCard?.points === "number" && tempCard.points > 0
          ? tempCard.points
          : typeof tempCard?.value === "number" && tempCard.value > 0
          ? tempCard.value
          : 15,
      stage: resolvedStage,
      tempCardStages:
        resolvedStages.length > 0
          ? resolvedStages
          : resolvedStage !== undefined
          ? [resolvedStage]
          : undefined,
      status: CourseStatus.Planned,
      year: Number(semester?.year),
      period: Number(semester?.period) as any,
      canDelete: false,
    };
  }

  private inferFacultiesFromDepartments(departments: any[]): string[] {
    if (!Array.isArray(departments) || departments.length === 0) {
      return [];
    }

    const normalisedDepartments = this.normaliseDepartmentValues(departments);
    if (normalisedDepartments.length === 0) {
      return [];
    }

    const faculties = new Set<string>();
    (this.courseService.allCourses || []).forEach((course: ICourse) => {
      const courseDepartments = this.normaliseDepartmentValues(
        Array.isArray(course.department) ? course.department : []
      );
      const matchesDepartment = courseDepartments.some((department: string) =>
        normalisedDepartments.includes(department)
      );
      if (!matchesDepartment) {
        return;
      }

      (Array.isArray(course.faculties) ? course.faculties : []).forEach(
        (faculty: string) => {
          if (typeof faculty === "string" && faculty.trim().length > 0) {
            faculties.add(faculty);
          }
        }
      );
    });

    return Array.from(faculties);
  }

  private normaliseDepartmentValues(rawDepartments: any[]): string[] {
    const flattened: any[] = [];
    (Array.isArray(rawDepartments) ? rawDepartments : []).forEach(
      (department: any) => {
        if (Array.isArray(department)) {
          flattened.push(...department);
          return;
        }
        flattened.push(department);
      }
    );

    const normalised = flattened
      .map((department: any) => this.departmentValueToString(department))
      .filter((department: string | null): department is string => !!department)
      .map((department: string) => department.trim())
      .filter((department: string) => department.length > 0);

    const seen = new Set<string>();
    const unique: string[] = [];
    normalised.forEach((department: string) => {
      const key = department.toUpperCase();
      if (seen.has(key)) {
        return;
      }
      seen.add(key);
      unique.push(department);
    });

    return unique;
  }

  private departmentValueToString(department: any): string | null {
    if (typeof department === "string") {
      return department;
    }
    if (typeof department === "number") {
      return String(department);
    }
    if (department && typeof department === "object") {
      if (typeof department.department === "string") {
        return department.department;
      }
      if (typeof department.code === "string") {
        return department.code;
      }
      if (typeof department.name === "string") {
        return department.name;
      }
    }

    return null;
  }

  public updateComplexBars(courses: ICourse[]) {
    if (!this.requirement || !Array.isArray(this.requirement.complex)) {
      this.barOneStateComplex = [];
      this.barTwoStateComplex = [];
      this.barThreeStateComplex = [];
      this.barFourStateComplex = [];
      return;
    }

    this.barOneStateComplex = [],
    this.barTwoStateComplex = [],
    this.barThreeStateComplex = [],
    this.barFourStateComplex = []

    for (let i = 0; i < this.requirement.complex.length; i++) {
      this.barOneStateComplex.push(this.getComplexBarValue(
        this.barOneState,
        courses,
        CourseStatus.Completed,
        this.requirement.complex[i]
      ));

      this.barTwoStateComplex.push(this.getComplexBarValue(
        this.barTwoState,
        courses,
        CourseStatus.Enrolled,
        this.requirement.complex[i],
      ));

      this.barThreeStateComplex.push(this.getComplexBarValue(
        this.barThreeState,
        courses,
        CourseStatus.Planned,
        this.requirement.complex[i],
        false
      ));

      this.barFourStateComplex.push(
        this.getTempCardComplexBarValue(this.barFourState, this.requirement.complex[i])
      );
      }
  }

}
