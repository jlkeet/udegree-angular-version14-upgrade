import { UserContainer } from "../user/user-status.component";
import {
  Component,
  EventEmitter,
  Input,
  Output
} from "@angular/core";
import { Database } from '@angular/fire/database';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, query } from '@angular/fire/firestore';
import { Store } from "../app.store";
import { AuthService } from "../core/auth.service";
import { ICourse } from "../interfaces";
import {
  Message,
  Period,
} from "../models";
import {
  ClickedEvent,
  CourseEventService,
  CourseService,
  MovedEvent,
  RemovedEvent,
  StoreHelper,
} from "../services";
import { DegreeSelection } from "../select-major";
import { FirebaseDbService } from "../core/firebase.db.service";
import{ GoogleAnalyticsService } from '../services/google-analytics.service';
import { ProgressPanelService } from "../services/progress-panel.service";
import { AdminExportService } from "../services/admin-export.service";
import { pluck } from 'rxjs/operators';

/*
  Component for displaying a list of courses organised by year and semester
*/
@Component({
  host: {
    style: "flex: 3 0 auto;",
  },
  selector: "courses-panel",
  styleUrls: ["./courses-panel.component.scss"],
  templateUrl: "./courses-panel.template.html",
})
export class CoursesPanel {
  @Output() public courseMoved: EventEmitter<MovedEvent>;
  @Output() public courseRemoved: EventEmitter<RemovedEvent>;
  @Output() public courseClicked: EventEmitter<ClickedEvent>;
  @Input() public courses: ICourse[] = [];

  private messages: Message[] = [];
  public semesters: any[] = [];
  private courseCounter: number;
  public newCourses: ICourse[] = [];

  private planLoaded: boolean = false;

  public selectedYear;
  public selectedPeriod;
  public addingSemester = false;
  private semDbCount: number = 0;
  private courseDbCounter: number = 0;
  private delCount = 0;

  private onPageChange = new EventEmitter<null>();
  dbCoursesSavedArrayById: any[] = [];
  newOpen: boolean = false;
  public filteredCourses: ICourse[][] = [];

  constructor(
    public courseService: CourseService,
    private courseEventService: CourseEventService,
    private store: Store,
    private storeHelper: StoreHelper,
    private db_courses: Database,
    private db: Firestore,
    public authService: AuthService,
    private userContainer: UserContainer,
    private degreeSelection: DegreeSelection,
    private dbCourses: FirebaseDbService,
    public googleAnalyticsService: GoogleAnalyticsService,
    public progressPanelService: ProgressPanelService,
    public adminService: AdminExportService,
  ) {

    this.courseMoved = new EventEmitter<MovedEvent>();
    this.courseRemoved = new EventEmitter<RemovedEvent>();
    this.courseClicked = new EventEmitter<ClickedEvent>();

    // when the user moves a course, this will fire
    courseEventService.courseMoved.subscribe((event: MovedEvent) => {
      this.courseMoved.emit(event);
    });

    // when the user removes a course, this will fire
    courseEventService.courseRemoved.subscribe((event: RemovedEvent) => {
      this.courseRemoved.emit(event);
    });

    // when the user clicks a course, this will fire
    courseEventService.courseClicked.subscribe((event: ClickedEvent) => {
      this.courseClicked.emit(event);
    });

    this.store.changes
      .pipe(pluck("semesters"))
      .subscribe((semesters: any[]) => (this.semesters = semesters));

    // Course checker to mimic the semester one
    this.store.changes
      .pipe(pluck("courses"))
      .subscribe(
        (dbCoursesSavedArrayById: any[]) =>
          (this.dbCoursesSavedArrayById = dbCoursesSavedArrayById)
      );

    this.courseCounter = this.courseService.courseCounter;
    this.selectedYear = 2024;
    this.selectedPeriod = Period.One;

    this.authService.authState.subscribe(async (user: any) => {
      if (user && !this.planLoaded) {
        this.planLoaded = true;
        await this.courseService.loadPlanFromDb();
        this.authService.logInCounter++;
      } else if (!user) {
        this.planLoaded = false;
      }
    });
  }

  public ngOnInit() {

  }

  public ngOnChanges(): void {

    this.courseService.nextSemesterCheck();

    this.newOpen = false;
    this.filteredCourses = this.semesters.map((semester) =>
      this.filterCourses(semester.year, semester.period)
    );
  }

  private filterCourses(year: number, period: Period) {
    return this.courses.filter(
      (course: ICourse) => course.year === year && course.period === period
    );
  }

  // private canAddSemester(semester: any): boolean {
  //   return (
  //     this.semesters.filter(
  //       (s) => s.year === semester.year && s.period === semester.period
  //     ).length === 0
  //   );
  // }

  // public newSemester(): void {
  //   const newSemester = {
  //     year: Number(this.selectedYear),
  //     period: Number(this.selectedPeriod),
  //     both: this.selectedYear + " " + this.selectedPeriod
  //   };
  //   if (this.coursesService.canAddSemester(newSemester)) {
  //     this.semesters.push(newSemester);
  //     this.semesters.sort((s1, s2) =>
  //       s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
  //     );
  //     this.storeHelper.update("semesters", this.semesters);
  //    // this.dbCourses.addSelection(this.email, "semester", newSemester, "semesters")
  //     this.addingSemester = false;
  //     this.nextSemesterCheck();
  //   } else {
  //     this.nextSemesterCheck();
  //     const newSemester = {
  //       year: Number(this.selectedYear),
  //       period: Number(this.selectedPeriod),
  //       both: this.selectedYear + " " + this.selectedPeriod
  //     };
  //     this.semesters.push(newSemester);
  //     this.semesters.sort((s1, s2) =>
  //       s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
  //     );
  //     this.storeHelper.update("semesters", this.semesters);

  //     // this.dbCourses.addSelection(this.email, "semester", newSemester, "semesters")
  //     // this.dbCourses.setAuditLogSemester(newSemester);

  //     this.addingSemester = false;
  //   }
  // }

  // This function gets the year from the course

  private getSemesterFromDb(courseDbId: string) {
    return new Promise<any>((resolve) => {
      const semesterFromDb = {
        year:
          this.dbCourses.getCollection("users", "courses", courseDbId).then( (res) => {resolve((res["year"]))} )
      };
    });
  }

  // This function gets the semester period from the course

  private getPeriodFromDb(courseDbId: string) {
    return new Promise<any>((resolve) => {
      const periodFromDb = {
        period: Number(
          this.dbCourses.getCollection("users", "courses", courseDbId).then( (res) => {resolve((res["period"]))} )
        ),
      };
    });
  }

  // public addSemesterFromDb(courseDbId: string) {
    
  //   var newSemesterFromDb = { year: Number(), period: Number(), both: String() };

  //   // The following code is super gumby, because of the promised value not being returned before executing the next lines
  //   // I put everything into the promise on line 194 by chaining then() functions. It works though.

  //   this.getSemesterFromDb(courseDbId)
  //     .then((theYear) => {
  //       this.selectedYear = theYear;
  //     })
  //     .then(
  //       () => (newSemesterFromDb = { year: this.selectedYear, period: null as any, both: null as any})
  //     ); // Updates the year value withing the newSemesterFromDb variable
  //   this.getPeriodFromDb(courseDbId)
  //     .then(
  //       // This call is the first chained then
  //       (thePeriod) => (this.selectedPeriod = thePeriod)
  //     )
  //     .then(
  //       () =>
  //         (newSemesterFromDb = {
  //           year: this.selectedYear,
  //           period: this.selectedPeriod,
  //           both: this.selectedYear + " " + this.selectedPeriod
  //         }
  //       )
  //     )
  //     .then(() => {
  //       // Updates the period value withing the newSemesterFromDb variable
  //       if (this.canAddSemester(newSemesterFromDb)) {
  //         // Here is the rest of the code to execute within the chained then statements. So that it can occur within the promise
  //         this.semesters.push(newSemesterFromDb);
  //         this.semesters.sort((s1, s2) =>
  //           s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
  //         );
  //        // this.dbCourses.addSelection(this.email, "semester", newSemesterFromDb, "semesters")
  //         this.storeHelper.update("semesters", this.semesters);
  //         this.addingSemester = false; // Reverts the semster panel back to neutral
  //         this.selectedPeriod = Period.One; // Revert to the default value
  //         this.selectedYear++; // Increment the selected year so that it defaults to the next one, this avoids confusion if accidentally trying to add the same period and year, probably worth putting in a catch on the error at some point
  //       } else {
  //       }
  //     });
  // }


// public async loadPlanFromDb() {

// this.authService.authState.subscribe(async (user: any) => {
  
//   if (user.email) {
//     this.adminService.getAdmin(user.email);
//     this.adminService.getExportStatus(user.email);
    
//     const userDocRef = doc(this.dbCourses.db, 'users', user.email);
//     const userDocSnap = await getDoc(userDocRef);

//     if (userDocSnap.exists()) {
//       const coursesQuery = query(collection(this.dbCourses.db, `users/${user.email}/courses`));
//       const coursesSnapshot = await getDocs(coursesQuery);

//       if (!coursesSnapshot.empty) {
//         // Check to see if documents exist in the courses collection
//         coursesSnapshot.forEach((doc) => {
//           // Loop to get all the ids of the docs
//           this.addSemesterFromDb(doc.id);
//           this.loadCourseFromDb(doc.id); // Call to loading the courses on the screen, by id
//         });
//       } else {
//         this.storeHelper.deleteAll();
//         this.storeHelper.update("semesters", []);
//         this.progressPanelService.setFullyPlanned(false);
//       }
//     }
//   }
// });
//   }

//   public async loadPlanFromDbAfterDel() {
//     if (this.authService.auth.currentUser.email !== undefined) {
//       const userDocRef = doc(this.dbCourses.db, 'users', this.authService.auth.currentUser.email);
//       const userDocSnap = await getDoc(userDocRef);
  
//       if (userDocSnap.exists()) {
//         const coursesQuery = query(collection(this.dbCourses.db, `users/${this.authService.auth.currentUser.email}/courses`));
//         const coursesSnapshot = await getDocs(coursesQuery);
  
//         if (!coursesSnapshot.empty) {
//           // Check to see if documents exist in the courses collection
//           coursesSnapshot.forEach((doc) => {
//             // Loop to get all the ids of the docs
//             this.loadCourseFromDbAfterDel(doc.id); // Call to loading the courses on the screen, by id
//           });
//         }
//       }
//     }
//   }

//   private getCourseFromDb(courseDbId: string) {
//     return new Promise<any>((resolve) => {
//       const semesterFromDb = {
//         course: 
//           this.dbCourses.getCollection("users", "courses", courseDbId).then( (res) => {resolve((res))} )
//       };
//     });
//   }

//   private loadCourseFromDb(courseDbId: string) {
//     const courseDb = this.getCourseFromDb(courseDbId).then((copy) => {
//       Object.assign({
//         department: copy[0],
//         desc: copy[1],
//         faculties: copy[2],
//         id: copy[3],
//         name: copy[4],
//         period: copy[5],
//         points: copy[6],
//         requirements: copy[7],
//         stage: copy[8],
//         status: copy[9],
//         title: copy[10],
//         year: copy[11],
//         canDelete: true,
//       });
//       this.getCourseFromDb(courseDbId).then((res) => {
//           this.storeHelper.add("courses", res);
//           this.coursesService.updateErrors();
//       });
//     });
//   }

//   private loadCourseFromDbAfterDel(courseDbId: string) {
//     const courseDb = this.getCourseFromDb(courseDbId).then((copy) => {
//       Object.assign({
//         department: copy[0] || null,
//         desc: copy[1] || null,
//         faculties: copy[2] || null,
//         id: copy[3] || null,
//         name: copy[4] || null,
//         period: copy[5] || null,
//         points: copy[6] || null,
//         requirements: copy[7] || null,
//         stage: copy[8] || null,
//         status: copy[9] || null,
//         title: copy[10] || null,
//         year: copy[11] || null,
//         canDelete: true,
//       })
//       this.getCourseFromDb(courseDbId).then((res) => {
//         this.courses = this.storeHelper.current("courses")
//     for (let i = 0; i < this.courses.length; i++) {    
//       if (res.id === this.courses[i].id) {
//         if (res.year !== this.courses[i].year || res.period !== this.courses[i].period) {
//       this.storeHelper.findAndDelete("courses", this.courses[i].id)  
//       this.storeHelper.add("courses", res)
        
//       // Will change this code when I eventually understand the findAndUpdate part of the storehelper.
    
//       }
//     }
//   }
//     })
//   })
// }

//   // Function that updates to the correct year and period when selecting to add a new semester
//   private nextSemesterCheck() {

//     if (this.semesters.length > 0) {
//       let latestYear = this.semesters[this.semesters.length-1]['year']
//       let latestPeriod = this.semesters[this.semesters.length-1]['period']
//       switch (latestPeriod) {
//         case 0:
//           this.selectedPeriod = 1;
//           this.selectedYear = latestYear;
//           break
//         case 1:
//           this.selectedPeriod = 2;
//           this.selectedYear = latestYear;
//           break
//         case 2:
//           this.selectedPeriod = 0;
//           this.selectedYear = latestYear + 1;
//           break
//       }
//     }
//   }

// // Function that updates the correct year and period when deleting a semester

// public updateSemesterCheck() {

//   if (this.semesters.length > 0) {
    
//     let latestYear = this.semesters[this.semesters.length-1]['year']
//     let latestPeriod = this.semesters[this.semesters.length-1]['period']

//     switch (latestPeriod) {
//       case 0:
//         this.selectedPeriod = 0;
//         this.selectedYear = latestYear;
//         break
//       case 1:
//         this.selectedPeriod = 1;
//         this.selectedYear = latestYear;
//         break
//       case 2:
//         this.selectedPeriod = 2;
//         this.selectedYear = latestYear;
//         break
//     }
//     }
// }

// newSemEvent(){ 
//   this
//   .googleAnalyticsService
//   .eventEmitter("add_sem", "course-panel", "semester", "click", 10);
// } 

}