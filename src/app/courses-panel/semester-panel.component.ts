import { Component, Input, EventEmitter, ViewEncapsulation } from "@angular/core";
import { collection, doc, getDocs, query, updateDoc, where, deleteDoc } from "firebase/firestore";
import { ICourse } from "../interfaces";
import { CourseStatus } from "../models";
import { CourseEventService, CourseService, StoreHelper } from "../services";
import { Router } from "@angular/router";
import { UserContainer } from "../common";
import { GoogleAnalyticsService } from '../services/google-analytics.service';
import { FirebaseDbService } from "../core/firebase.db.service";
import { CdkDrag, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: "semester-panel",
  styleUrls: ["./semester-panel.component.scss"],
  encapsulation: ViewEncapsulation.None,
  templateUrl: "semester-panel.template.html",
})

export class SemesterPanel {
  // @ViewChild('autoscroll') autoscroll: ElementRef;
  @Input() public semester: any;
  @Input() public courses: ICourse[] = [];

  public addingSemester = false;
  public MAX_POINTS = 80;
  public toggled = true;
  public bagName: string = "courses";
  public atMaxPoints: boolean = false;
  public gpa: number = 0;
  public courseCounter: number = 0;
  public email: string;
  public collapsed = false;
  public yearListArray: any[] = [];
  public periodListArray: any[] = [];
  public isDisabled = false;
  public savedNewSem: any
  public savedNewYear: any;
  public previousYear: any
  public previousPeriod: any
  public semcheck = {};
  public boolCheck = true;
  public onPageChange = new EventEmitter<null>();

  public course: ICourse = null as any;
  public semesters: any[] = [];

  public groupedCourses: {semester: any, courses: ICourse[]}[] = [];

  constructor(
    public courseService: CourseService,
    public courseEventService: CourseEventService,
    public storeHelper: StoreHelper,
    public router: Router,
    public userContainer: UserContainer,
    public googleAnalyticsService: GoogleAnalyticsService,
    public dbCourses: FirebaseDbService,
  ) {
    this.email = this.courseService.email;
    
    
  }

  public ngOnInit() {
  }

  public drop(event: CdkDragDrop<ICourse[]>) {
    const droppedCourse = {
      id: Number(event.item.data.id),
      period: Number(event.item.data.period),
      year: Number(event.item.data.year),
      newPeriod: Number(event.container.data),
      newYear: Number(event.container.data),
    };

    if (!this.sameTime(droppedCourse)) {
      let moveHere = this.courses.some((course: ICourse) => course.id === droppedCourse.id);
      if (!moveHere) {
        console.error(`could not move course id: ${droppedCourse.id} to semester ${this.semester.id} `);
      } else {
        this.droppedCourseSaveDB(droppedCourse);
        this.courseEventService.raiseCourseMoved({
          courseId: droppedCourse.id,
          period: droppedCourse.newPeriod,
          year: droppedCourse.newYear,
        });
      }
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data,
                        event.container.data,
                        event.previousIndex,
                        event.currentIndex);
    }
  }

  public ngOnChanges() {
    const courseGrades = this.courses
      .filter(
        (course: ICourse) =>
          course.status === CourseStatus.Completed &&
          course.grade !== undefined &&
          course.grade !== -42
      )
      .map((course: ICourse) => (course.grade! < 0 ? 0 : course.grade!));
    const failed = this.courses.filter(
      (course: ICourse) => course.status === CourseStatus.Failed
    ).length;
    this.gpa =
      courseGrades.reduce((gradeTotal, grade) => gradeTotal + grade!, 0) /
      (courseGrades.length + failed);
  
    const totalPoints = this.courses
      .filter((course: ICourse) => course.points !== undefined)
      .reduce(
        (points, course) => points + course.points!,
        0
      );
    this.atMaxPoints = totalPoints >= this.MAX_POINTS;
  
    this.courseCounter = this.courseService.courseCounter;
  }
  

  public sameTime(course: any) {
    return (
      this.semester.year === Number(course.year) &&
      this.semester.period === Number(course.period)
    );
  }

  public onRemoveModel(args: [any, any]) {
    const [el, source] = args;
    el.dataset.id = Number(el.dataset.id);
    el.dataset.period = Number(el.dataset.period);
    el.dataset.year = Number(el.dataset.year);

    if (this.sameTime(el.dataset)) {
      this.courseEventService.raiseCourseRemoved({
        course: el.dataset.name,
        courseId: el.dataset.id,
        period: el.dataset.semester,
        year: el.dataset.year,
      });
    }
  }

  public collapse() {
    const collapsed = this.storeHelper.update("collapsed", !this.collapsed);
    this.collapsed = !this.collapsed;
  }

  public toggle() {
    this.toggled = !this.toggled;
  }

  public courseClicked(course: ICourse) {
    this.courseEventService.raiseCourseClicked({ course });
  }

  public longCourseClicked(course: ICourse) {
    this.courseEventService.raiseLongCourseClicked({ course })
    this.course = course
  }

  public async droppedCourseSaveDB(course: { id: any; period?: number; year?: number; newPeriod: any; newYear: any; }) {
    const userCoursesQuery = query(collection(this.dbCourses.db, `users/${this.email}/courses`), where("id", "==", course.id));
    const snapshot = await getDocs(userCoursesQuery);
  
    snapshot.forEach((ref) => {
      const courseRef = doc(this.dbCourses.db, `users/${this.email}/courses/${ref.id}`);
      updateDoc(courseRef, {
        year: course.newYear,
        period: course.newPeriod,
      });
    });
  }

  public async deleteCourse(course: ICourse) {
    this.courseService.courseCounterOnDelete();
    if (this.sameTime(course)) {
      if (course.period !== undefined && course.year !== undefined) {
        this.courseEventService.raiseCourseRemoved({
          course: course,
          courseId: course.id,
          period: course.period,
          year: course.year,
        });
      } else {
        console.log("course.period or course.year is undefined");
      }
    }
  
    const userCoursesQuery = query(collection(this.dbCourses.db, `users/${this.email}/courses`), where("generatedId", "==", course.generatedId));
    const snapshot = await getDocs(userCoursesQuery);
  
    snapshot.forEach((ref) => {
      const courseRef = doc(this.dbCourses.db, `users/${this.email}/courses/${ref.id}`);
      deleteDoc(courseRef);
    });
  }

  public deleteSemester() {
    this.courseService.updateSemesterCheck();
    this.courses.forEach((course: ICourse) =>
      this.courseService.deselectCourseByName(course)
    );
    let semesters = this.storeHelper.current("semesters");
    semesters = semesters.filter(
      (semester: { year: string | number; period: string | number; }) =>
        semester.year !== this.semester.year ||
        semester.period !== this.semester.period
    );
    this.storeHelper.update("semesters", semesters);
    // this.delSemDB();
    setTimeout(() => {
      this.semesterSort();
    }, 1000);

    // this.dbCourses.setAuditLogDeleteSemester(semesters);
  }

  public smallCourseStatusBar(courseStatus: number) {
    switch (courseStatus) {
      case 0:
        return "#66bbff";
      case 1:
        return "#f3d602";
      case 2:
        return "#65cc01";
      case 3:
        return "#ff8087";
    }
    return "#ddd"
  }

  public smallCourseStatusBarHover(course: { name: any; }) {
    return course.name;
  }

  public newSemesterDD() {
    this.addingSemester = true;
  }

  public expansionOnClick() {
    this.isDisabled = false;
    return this.isDisabled;
  }

  public noExpansionOnClick() {
    this.isDisabled = true;
    return this.isDisabled;
  }

  public yearList() {
    this.yearListArray = [];
   // let i = new Date().getFullYear();
    let i = 2010
    while (i < 2030) {
      this.yearListArray.push(i);
      i++;
    }
    return this.yearListArray[0 - 9];
  }

  public periodList() {
    this.periodListArray = [];
    let i = 0;
    while (i < 3) {
      if (i === 0) {
        this.periodListArray.push("Summer School");
        i++;
      } else {
        this.periodListArray.push("Semester " + i);
        i++;
      }
    }
    this.periodListArray.forEach( (item, index) => {
      if(item === "Semester " + this.semester.period || item === "Summer School" && this.semester.period === 0)  this.periodListArray.splice(index,1);
    });
    return this.periodListArray[0 - 2];
  }

  public getSelectedYear(i: string | number) {
    
    this.previousYear = this.semester.year;
    this.semester.year = i;
    this.saveChangedSemCourse(i);
  }

  public getSelectedSem(j: any) {
    this.previousPeriod = this.semester.period;
    let k;
    switch (j) {
      case "Summer School":
        this.semester.period = 0;
        k = 0;
        break;
      case "Semester 1":
        this.semester.period = 1;
        k = 1;
        break;
      case "Semester 2":
        this.semester.period = 2;
        k = 2;
        break;
    }
    this.saveChangedSemCourse(k);
  }

  public updatePeriodsInCourse(period: any) {
    return period;
  }

  public updateYearsInCourse(year: any) {
    return year;
  }

  public async saveChangedSemCourse(i: any) {

    this.boolCheck = true;
    let courses = this.storeHelper.current("courses");
    if (i < 10) {
      this.savedNewSem = this.updatePeriodsInCourse(i);
    } else {
      this.savedNewSem = this.semester.period;
      this.previousPeriod = this.semester.period;
    }
    if (i > 10) {
      this.savedNewYear = this.updateYearsInCourse(i);
    } else {
      this.savedNewYear = this.semester.year;
      // this.previousYear = this.semester.year;
    }

    this.semcheck = {
      year: Number(this.savedNewYear),
      period: Number(this.savedNewSem),
    };

    this.checkIfArrayIsUnique(this.storeHelper.current("semesters"))

    if (this.boolCheck) {
      for (let j = 0; j < courses.length; j++) {
        const userCoursesQuery = query(collection(this.dbCourses.db, `users/${this.email}/courses`), where("id", "==", String(courses[j].id)));
        const snapshot = await getDocs(userCoursesQuery);
      
        snapshot.forEach((ref) => {
          if (courses[j].year === this.previousYear && courses[j].period === this.previousPeriod) {
            const courseRef = doc(this.dbCourses.db, `users/${this.email}/courses/${ref.id}`);
            updateDoc(courseRef, {
              year: this.savedNewYear,
              period: this.savedNewSem,
            });
          }
        });
      }
  
      // this.changeSemDB()
      this.semesterSort();
    }
  }

  public semesterSort() {
    this.storeHelper
      .current("semesters")
      .sort((s1: { year: number; period: number; }, s2: { year: number; period: number; }) =>
        s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
      );
    this.courseService.loadPlanFromDbAfterDel();
    return this.storeHelper.update("courses", this.courseService.planned);
  }

  public checkIfArrayIsUnique(myArray: string | any[]) 
  {
      for (var i = 0; i < myArray.length; i++) 
      {
          for (var j = 0; j < myArray.length; j++) 
          {
              if (i != j) 
              {
                  if (myArray[i].period === myArray[j].period && myArray[i].year === myArray[j].year) 
                  {
                      return this.boolCheck = false; // means there are duplicate values
                  }
              }
          }
      }
      return this.boolCheck = true; // means there are no duplicate values.
  }

  newCourseEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("new_course", "semester-panel", "course", "click", 10);
  } 

}
