import { Component } from '@angular/core';
import {
  ActivatedRoute,
  Router
} from '@angular/router';
import {
  AddCourseService,
} from '../add-course';
import { AppHeader } from '../app.header.component';
import { Store } from '../app.store';
import { FirebaseDbService } from '../core/firebase.db.service';
import { ICourse } from '../interfaces';
import {
  DepartmentCoursesModel,
  Message,
  Period
} from '../models';
import {
  CourseEventService,
  CourseService,
  IRequirement,
  ModuleService,
  RequirementService,
  StoreHelper
} from '../services';
import { GoogleAnalyticsService } from '../services/google-analytics.service';
import { pluck } from 'rxjs/operators';

/*
  Container for addding a course to a semester.
  TODO:: Split this up!
 */

@Component({
  selector: 'add-course-container',
  styleUrls: ['./add-course-container.scss'],
  templateUrl: './add-course-container.template.html'
})

export class AddCourseContainer {

  public majorSelected: boolean = false;
  public semesterText!: string;
  public semesterCourses!: ICourse[];
  public lastSelection: number = 0;
  public selected!: ICourse;
  public searchTerm: string = '';
  public planned: ICourse[] = [];
  public beforeSemester!: ICourse[];
  public currentSemester!: ICourse[];
  public shown: ICourse[] = [];
  public filterParams;
  public modules: any;
  public tabIndex = 0;

  // list of departments and their courses for a faculty
  public departmentCourses: DepartmentCoursesModel[];
  public messages: Message[] = [];
  public browseTitle: string = '';
  public showSemesterFullMessage: boolean = false;

  public period: Period;
  public year: number;
  public allCourses: any;
  public semesters: any;
  public facultyChoices: any;
  public departmentChoices: any;
  public subscriptions: any[] = [];

  public custom: any;

  constructor(

    public addCourseService: AddCourseService,
    public moduleService: ModuleService,
    public storeHelper: StoreHelper,
    public route: ActivatedRoute,
    public router: Router,
    public store: Store,
    public coursesService: CourseService,
    public courseEventService: CourseEventService,
    public requirementService: RequirementService,
    public appHeader: AppHeader,
    public googleAnalyticsService: GoogleAnalyticsService,
    public dbCourses: FirebaseDbService,
  ) {

    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.period = Number(this.route.snapshot.queryParams['period']);
    this.year = Number(this.route.snapshot.queryParams['year']);
    const defaultFaculties = [this.storeHelper.current('faculty')];
   // let facultyFilter = this.mapToArray(this.route.snapshot.queryParams.faculties);
   // facultyFilter = facultyFilter.length !== 0 ? facultyFilter :
   //   (defaultFaculties[0] ? defaultFaculties.map((faculty) => faculty.name) : []);
    this.filterParams = {
      departments: this.mapToArray(this.route.snapshot.queryParams['departments']),
      //faculties: facultyFilter,
      faculties: this.mapToArray(this.route.snapshot.queryParams['faculties']),
      general: this.orNull(this.route.snapshot.queryParams['general']),
      corequesite: this.orNull(this.route.snapshot.queryParams['corequesite']),
      hidePlanned: this.orNull(this.route.snapshot.queryParams['hidePlanned']),
      ineligible: this.orNull(this.route.snapshot.queryParams['ineligible']),
      searchTerm: this.orNull(this.route.snapshot.queryParams['searchTerm']),
      stage: this.mapToArray(this.route.snapshot.queryParams['stage']).map((n) => Number(n))
    };
    this.semesters = this.storeHelper.current('semesters');
    
    this.addCourseService.mapToDeptModel(this.addCourseService.groupByDepartment(this.coursesService.allCourses));
    this.reset();

  }

  public ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  // sidebarfilter changed
  public filterChanged(event: any) {
    this.shown = event.shown;

    if (event.modules) {
      this.addCourseService.departmentCourses = this.mapToModuleModel(this.shown);
    } else {
      this.addCourseService.departmentCourses = this.addCourseService.mapToDeptModel(
        this.addCourseService.groupByDepartment(this.shown)
      );
    }
    // console.log(this.addCourseService.departmentCourses);
    /*if (event.noUpdate !== true) {
       this.router.navigate(['/add'], {queryParams});
    }*/
    this.updateView();

  }

  public intersection<T>(array1: T[], array2: T[]): T[] {
    if (array1 && array2) {
      return array1.filter((str: T) => array2.includes(str));
    } else {
      return [];
    }
  }


  public mapToModuleModel(shown: ICourse[]): any[] {
    return this.modules.map((mod: any) => {
      return {
        title: mod.name,
        courses: this.intersection(mod.courses, shown),
        compulsary: this.nullIfEmpty(this.intersection(mod.compulsary, shown))
      }}).filter((mod: any) => mod.courses.length !== 0);
  }

  public nullIfEmpty(array: any[]) {
    return array.length === 0 ? null : array;
  }

  public cancel() {
    if (this.lastSelection !== null) {
      this.coursesService.deselectCourse(this.lastSelection);
    }
    this.router.navigate(['/planner']);
  }

  public cancelCourse() {
    this.selected = null as any;
    this.custom = false;
  }

  public toggleCourse(courseToToggle: ICourse) {
    const alreadyPlanned = this.coursesService.findPlanned(courseToToggle.name);
    if (alreadyPlanned) {
      // this doesn't make sense if there's multiple of one course
      this.coursesService.deselectCourseByName(courseToToggle);
    } else {
      this.coursesService.selectCourse(courseToToggle.id, this.period, this.year);
    }
  }

  public addCourse(event: any) {
    this.coursesService.selectCourse(event.course.id, this.period, this.year, event.status);
    this.selected = null as any;
    // this.dbCourses.setAuditLogCourse(event.course.name)
  }

  public deleteCourse(event: any) {
    this.coursesService.deselectCourseByName(event.course);
    // this.dbCourses.setAuditLogDeleteCourse(event.course.name)
  }

  public courseSelected(event: any) {
    this.selected = event.value;
  }

  public async reset(): Promise<void> {

    this.semesterText = `${this.year} ${this.getSemesterNameInWords(this.period)}`;
    this.sameTime = this.sameTime.bind(this);

    this.coursesService.getAllCourses().subscribe( (res) => { if (res) { this.allCourses = res.filter((course: ICourse) =>
      course.periods ? course.periods.includes(this.period) : true)
      this.allCourses = this.allCourses.filter((course: ICourse) => 
      course.isActive !== false // Remove inactive courses from the course selection
    )
    this.shown = this.allCourses;
    this.modules = this.moduleService.getModules();
    // this.addCourseService.mapToDeptModel(this.addCourseService.groupByDepartment(this.allCourses));
    // this.departmentCourses = this.addCourseService.mapToDeptModel(
    //   this.addCourseService.groupByDepartment(this.allCourses)
    // );
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());


    // this.allCourses = (await this.coursesService.getAllCourses().then())
    // .filter((course: ICourse) =>
    //   course.periods ? course.periods.includes(this.period) : true);
    //   this.allCourses = this.allCourses.filter((course: ICourse) => 
    //   course.isActive !== false // Remove inactive courses from the course selection
    // );    
    // this.shown = this.allCourses;
    // this.modules = this.moduleService.getModules();
    // this.departmentCourses = this.mapToDeptModel(
    //   this.groupByDepartment(this.shown)
    // );
    // this.subscriptions.forEach((subscription) => subscription.unsubscribe());

    // the id of the semester to add the course to

    this.subscriptions = [
      this.addCourseService.courseToggled.subscribe((course: any) => this.toggleCourse(course)),
      this.addCourseService.detailsToggled.subscribe((course: any) => this.selected = course),
      this.store.changes.pipe(pluck('courses'))
      .subscribe((courses: ICourse[]) => {
        this.planned = courses;
        this.beforeSemester = this.planned.filter((course: ICourse) =>
        (course.period !== undefined && course.period < this.period && course.year === this.year) ||
        (course.year !== undefined && course.year < this.year)
      );
        this.currentSemester = this.planned.filter((course: ICourse) =>
          course.period === this.period && course.year === this.year
        );
        this.updateView();
      }),
      this.store.changes.pipe(pluck('messages')).subscribe((messages: Message[]) => { this.messages = messages; }),
      this.courseEventService.courseRemoved
      .subscribe((event: any) => this.coursesService.deselectCourseByName(event.course)),
    ];
  }} )
  }

  public sameTime(course: ICourse): boolean {
    return course.period === this.period && course.year === this.year;
  }

  public updateView() {
    this.semesterCourses = this.cloneArray(this.planned.filter(this.sameTime));
    this.showSemesterFullMessage = this.semesterCourses.length >= 6;
    this.flagIneligible();
  }

  public checkRequirements(course: ICourse): string[] | any[] {
    if (course && course.requirements !== undefined) {
      // if (this.currentSemester.length > 0) {
      //   return course.requirements.filter((requirement: IRequirement) => 
      //   !this.requirementService.requirementFilled(requirement, this.currentSemester))
      //     .map((requirement: IRequirement) => this.requirementService.toString(requirement, false));
      // } else {
      return course.requirements.filter((requirement: IRequirement) =>
        !this.requirementService.requirementFilled(requirement, this.beforeSemester, course))
          .map((requirement: IRequirement) => this.requirementService.toString(requirement, false));
      // }



    } else {
      return [];
    }
  }

  public coursePlanned(courseToCheck: ICourse): boolean {
    return this.planned.map((course: ICourse) => course.id).includes(courseToCheck.id);
  }

  public removeInactive(course: any): void {
        if (course.isActive !== undefined) {
          if (course.isActive !== false) {
          course.canAdd = true;
          } else {
            course.canAdd = false;
          }
        }
  }

  public flagIneligible(): void {
    this.coursesService.allCourses.forEach(
      (course: ICourse) => {
        if (course.requirements !== undefined && course.requirements !== null) {
          // To find which courses are ineligible, flag all courses that have at least one unfilled requirement
          course.canAdd = course.requirements.filter((requirement: IRequirement) =>
            !this.requirementService.requirementFilled(requirement, this.beforeSemester, course)
          ).length === 0;
        } else {
          course.canAdd = true;
        }
        //this.removeInactive(course)
      });
  }

  // public groupByDepartment(courses: ICourse[]) {
  //   const grouped = courses.reduce((groups: any, course) => {
  //   for (let i = 0; i < course.department.length; i++) {  
  //     const key = course.department[i];
  //     (groups[key] = groups[key] || []).push(course);
  //   }
  //     return groups;
  //   }, {});
  //   return grouped;
  // }

  // public mapToDeptModel(grouped: any) {
  //   const departmentCourses: DepartmentCoursesModel[] = [];
  //   for (const property in grouped) {
  //     if (grouped.hasOwnProperty(property)) {
  //       const department = departmentCourses.find(
  //         (dept: DepartmentCoursesModel) => dept.department === property);
  //       if (department === undefined) {
  //         departmentCourses.push(
  //           new DepartmentCoursesModel(
  //             null as any,
  //             property,
  //             property,
  //             grouped[property]
  //           )
  //         );
  //       } else {
  //         department.courses.push(grouped[property]);
  //       }
  //     }
  //   }
  //   return departmentCourses;
  // }

  public getSemesterNameInWords(period: Period) {
    switch (period) {
      case Period.Summer:
        return 'Summer School';
      case Period.One:
        return 'Semester One';
      case Period.Two:
        return 'Semester Two';
      default:
        return 'na';
    }
  }

  public cloneArray<T>(originalArray: T[]) {
    return originalArray.map((obj: T) => Object.assign({}, obj));
  }

  public prevSemester(): void {
    const index = this.currentSemesterIndex() - 1;
    if (index >= 0) {
      const queryParams = this.getQueryParams();
      const nextSemester = this.semesters[index];
      queryParams.year = nextSemester.year;
      queryParams.period = nextSemester.period;
      this.router.navigate(['add'], {queryParams});
      this.period = Number(nextSemester.period);
      this.year = Number(nextSemester.year);
      this.semesterText = `${this.year} ${this.getSemesterNameInWords(this.period)}`;
    }
  }

  public currentSemesterIndex(): number {
    for (let i = 0; i < this.semesters.length; i++) {
      if (this.semesters[i].year === this.year && this.semesters[i].period === this.period) {
        return i;
      }
    }
    return -1;
  }

  public addCustom(): void {
    this.custom = true;
    this.selected = null as any;
  }

  public nextSemester(): void {
    const index = this.currentSemesterIndex() + 1;
    if (index < this.semesters.length) {
      const queryParams = this.getQueryParams();
      const nextSemester = this.semesters[index];
      queryParams.year = nextSemester.year;
      queryParams.period = nextSemester.period;
      this.router.navigate(['add'], {queryParams});
      this.period = Number(nextSemester.period);
      this.year = Number(nextSemester.year);
      this.semesterText = `${this.year} ${this.getSemesterNameInWords(this.period)}`;
    }

  }

  public getQueryParams(): any {
    return {
      departments: this.filterParams.departments.length !== 0 ? this.filterParams.departments.toString() : null,
      faculties: this.filterParams.faculties.length !== 0 ? this.filterParams.faculties.toString() : null,
      general: this.orNull(this.filterParams.general),
      corequesite: this.orNull(this.filterParams.corequesite),
      hidePlanned: this.orNull(this.filterParams.hidePlanned),
      ineligible: this.orNull(this.filterParams.ineligible),
      period: this.period,
      searchTerm: this.orNull(this.filterParams.searchTerm),
      stage: this.filterParams.stage.length !== 0 ? this.filterParams.stage.toString() : null,
      year: this.year,
    };
  }

  public orNull(arg: any): any {
    return arg ? arg : null;
  }

  // maps a string to an array
  public mapToArray(arg: any): any[] {
    if (!arg) {
      return [];
    } else if (arg.constructor === Array) {
      return arg;
    }
    return arg.split(',');
  }

  public orEmpty(arg: any): any[] {
    return arg ? arg : [];
  }


  newCustomCourseEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("add_custom", "add-course", "custom_course", "click", 10);
  } 

  newPrevSemEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("prev_sem", "add-course", "semester", "click", 10);
  } 

  newNextSemEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("next_sem", "add-course", "semester", "click", 10);
  } 

}
