import { Injectable } from '@angular/core';
import { Store } from '../app.store';
import { ICourse } from '../interfaces';
import {
  CourseStatus,
  Message,
  MessageStatus,
  Period,
} from '../models';
import { IRequirement, RequirementService } from './requirement.service';
import { StoreHelper } from './store-helper';
import { ErrorsChangedEvent } from './course.event';
// import { Database } from '@angular/fire/database';
import { Firestore, addDoc, collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc, query, orderBy, onSnapshot, where, deleteDoc } from '@angular/fire/firestore';
import { AuthService } from '../core/auth.service';
import { async } from '@angular/core/testing';
import {Observable} from "rxjs";
import { pluck } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from "../../environments/environment";
import { initializeApp } from "@angular/fire/app";
import { Auth, getAuth } from "@angular/fire/auth";
import { Database, get, getDatabase, orderByChild, ref } from '@angular/fire/database';
import { AdminExportService } from './admin-export.service';
import { FirebaseDbService } from '../core/firebase.db.service';
import { ProgressPanelService } from './progress-panel.service';
import { GoogleAnalyticsService } from './google-analytics.service';


/*
    Helper service for courses
    Needs to be fixed for new course model
*/
@Injectable()
export class CourseService {

  public allCourses: any;
  public planned: ICourse[] = [];
  public courseCounter = 0; // need to store this
  public errors: Message[] = [];
  public email: string = "";
  public findIfCorequesite = false;
  public auth;
  public semesters: any[] = [];
  public newCourses: ICourse[] = [];

  private planLoaded: boolean = false;

  public selectedYear = 0;
  public selectedPeriod = 1;
  public addingSemester = false;

  constructor(
    public errorsChanged: ErrorsChangedEvent,
    public requirementService: RequirementService,
    public store: Store,
    public storeHelper: StoreHelper,
    // public db_courses: Database,
    public authService: AuthService,
    public adminService: AdminExportService,
    public dbCourses: FirebaseDbService,
    public progressPanelService: ProgressPanelService,
    public googleAnalyticsService: GoogleAnalyticsService,

    public db: Database,
    public user_db: Firestore
    ) {

      const app = initializeApp(environment.firebaseConfig);

      this.auth = getAuth(app);
      // this.auth = this.authService.auth.currentUser!.email
      // this.auth = "jackson.keet1989@gmail.com"
      this.db = getDatabase(app);
      this.user_db = getFirestore(app);

    this.store.changes.pipe(pluck('courses')).subscribe((courses: ICourse[]) => this.planned = courses);

  }

  public addCustom(
    year: number, period: Period, code: string, title: string, points: number, stage: number,
    department: string, faculty: string, status: CourseStatus) {

    const customCourse: ICourse = {
      canDelete: true,
      department: [department],
      desc: '',
      faculties: [faculty],
      id: -this.courseCounter,
      name: code,
      period,
      points,
      stage,
      status,
      title,
      year,
      generatedId: Math.random() * 100000
    };
    this.courseCounter++;
    this.storeHelper.add('courses', customCourse);
    this.updateErrors();
  }

  public getAllCourses(): Observable<ICourse[]> {
    const coursesRef = ref(this.db, '/0/courses_admin');
  
    get(coursesRef).then((snapshot) => {
      if (snapshot.exists()) {
        this.allCourses = Object.values(snapshot.val());
        this.allCourses.sort((a: any, b: any) => a.name.localeCompare(b.name));
        this.allCourses.map((course: ICourse) => course.canDelete = true);
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
  
    return of(this.allCourses);
  }

  // rename this to coursesbyyear
  public getCourses(year: number, period: Period): ICourse[] {
    return this.planned.filter(
      (course: ICourse) => course.year === year && (period === null || period === course.period));
  }

  public moveCourse(courseId: number, period: Period, year: number) {
    const index = this.planned.findIndex((course: ICourse) => course.id === courseId);
    const copy = Object.assign({}, this.planned[index]);
    copy.period = period;
    copy.year = year;
    this.storeHelper.findAndUpdate('courses', copy);
    this.updateErrors();
  }

  public selectCourse(courseId: number, period: Period, year: number, status?: CourseStatus) {
    const index = this.allCourses.findIndex((course: ICourse) => course.id === courseId);
    const copy = Object.assign({}, this.allCourses[index]);
    copy.status = status ? status : CourseStatus.Planned;
    copy.period = period;
    copy.year = year;
    copy.id = courseId;  //this.courseCounter++;     I'm not exactly sure why we were making the course id linked to the course counter but have commented this out for now so we can match the index to the db.
    copy.generatedId = Math.floor(Math.random() * 100000);
    // this.storeHelper.add('courses', copy);
    this.updateErrors();
    this.courseCounter++;
    this.setCourseDb(copy ,courseId, period, year, status)
  }

  public async setCourseDb(course: any, courseId: any, coursePeriod: number, courseYear: number, status?: CourseStatus, grade?: null) {
    this.storeHelper.add('courses', course);
    let result = course;
    
    const coursesRef = collection(doc(this.user_db, `users/${this.email}`), "courses");
  
    await addDoc(coursesRef, Object.assign({
      department: result['department'] || null,
      desc: result['desc'] || null,
      faculties: result['faculties'] || null,
      id: result['id'] || null,
      name: result['name'] || null,
      period: coursePeriod,
      points: result['points'] || null,
      requirements: result['requirements'] || null,
      stage: result['stage'] || null,
      title: result['title'] || null,
      year: courseYear,
      status: status ? status : CourseStatus.Planned,
      grade: grade ? grade : null,
      canDelete: true,
      generatedId: course.generatedId || Math.floor(Math.random() * 100000),
    }));
  }



  public deselectCourse(course: number) { // Is this redundant now?
    this.storeHelper.findAndDelete('courses', course);
    this.updateErrors();
  }

  // Note that this is also linked to semester-panel.component, called there to remove all courses when exiting semester.

  public async deselectCourseByName(courseObject: any) {
    let course: any;
  
    if (courseObject.status !== 3) {
      course = this.findPlanned(courseObject.name);
    } else {
      course = this.findFailed(courseObject.name);
    }
  
    // this.dbCourses.setAuditLogDeleteCourse(courseName)
  
    this.storeHelper.findAndDelete('courses', course);
    
    this.updateErrors();
    this.courseCounter--;
  
    const coursesRef = collection(doc(this.user_db, `users/${this.email}`), "courses");
    const q = query(coursesRef, where('generatedId', '==', course.generatedId));
    
    const snapshot = await getDocs(q);
    
    snapshot.forEach(docSnap => {
      deleteDoc(doc(this.user_db, `users/${this.email}/courses/${docSnap.id}`));
    });
  }


  public async changeStatus(courseToChange: ICourse, status: CourseStatus) {
    const lookupCourse = this.planned.find((course: ICourse) => course.generatedId === courseToChange.generatedId);
    const copy = Object.assign({}, lookupCourse);
    copy.status = status;
    this.storeHelper.findAndUpdate('courses', copy);
    let course = courseToChange;
  
    const coursesRef = collection(doc(this.user_db, `users/${this.authService.auth.currentUser.email}`), "courses");
    const q = query(coursesRef, where('generatedId', '==', course.generatedId));
    
    const snapshot = await getDocs(q);
    
    snapshot.forEach(docSnap => {
      updateDoc(doc(this.user_db, `users/${this.authService.auth.currentUser.email}/courses/${docSnap.id}`), {status: copy.status});
    });
      
    this.updateErrors();
  }
  
  public async changeGrade(courseToChange: ICourse, grade: number) {
    const lookupCourse = this.planned.find((course: ICourse) => course.generatedId === courseToChange.generatedId);
    const copy = Object.assign({}, lookupCourse);
    copy.grade = grade;
    this.storeHelper.findAndUpdate('courses', copy);
    let course = courseToChange;
  
    const coursesRef = collection(doc(this.user_db, `users/${this.authService.auth.currentUser.email}`), "courses");
    const q = query(coursesRef, where('generatedId', '==', course.generatedId));
    
    const snapshot = await getDocs(q);
    
    snapshot.forEach(docSnap => {
      updateDoc(doc(this.user_db, `users/${this.authService.auth.currentUser.email}/courses/${docSnap.id}`), {grade: copy.grade});
    });
      
    this.updateErrors();
  }

  public updateErrors() {
    this.errors = [];
    let courseErrors: any;
    let courseErrorsCoreq;

    this.planned.forEach((course: ICourse) => {
      if (course.requirements !== undefined && course.requirements !== null) {
      courseErrors = course.requirements.filter((requirement: IRequirement) =>
      {
        if (this.requirementService.checkFlag(requirement, "isCorequesite")) {
          return !this.requirementService.requirementFilled(requirement,this.currentSemester(course))
        } else {
          return !this.requirementService.requirementFilled(requirement,this.beforeSemester(course))
        }
      });
      this.errors = this.errors.concat(courseErrors
        .map((unfilled: IRequirement) => this.requirementService.toString(unfilled, false))
        .map((unfilled: string) => new Message(course.name, course.name + ": " + unfilled, MessageStatus.Error, courseErrors)));
        course.isError = courseErrors.length > 0;
  

        //this.errors.push({'course': course.title, 'errors': courseErrors});
      } else {
        course.isError = false;
      }
    });
    this.storeHelper.update('messages', this.errors); // needs to be changed if different sources for messages
    //this.errorsChanged.raiseErrorsChanged(this.errors);
  }

  public beforeSemester(beforeCourse: any) {
    return this.planned.filter((course: ICourse) =>
      course.period! < beforeCourse.period &&
      course.year === beforeCourse.year ||
      course.year! < beforeCourse.year
    );
  }

  public currentSemester(currentCourse: any) {
    return this.planned.filter((course: ICourse) =>
      course.period === currentCourse.period &&
      course.year === currentCourse.year
    );
  }
  

  public findPlanned(courseName: string): ICourse {
    let generalToggle = this.generalToggle(courseName);
    let completed = this.completed(courseName);
    return completed ? completed : this.completed(generalToggle); //check general version as well
  }

  public completed(courseName: string): ICourse {
    const courses = this.storeHelper.current('courses');
    return courses.filter((course: ICourse) => course.status !== CourseStatus.Failed)
      .find((course: ICourse) => course.name === courseName);
  }

  public findFailed(courseName: string): ICourse {
    const courses = this.storeHelper.current('courses');
    return courses.filter((course: ICourse) => course.status === CourseStatus.Failed)
    .find((course: ICourse) => course.name === courseName);
  }

  public generalToggle(courseName: string): string {
    if (this.isGeneral(courseName)) {
      return courseName.substring(0, courseName.length - 1);
    } else {
     // return courseName + 'G';
     return courseName; // If there's an error check this, I needed to return something couldn't have it not a return a value.
    }
  }

  public isGeneral(courseName: string): boolean {
    return courseName.lastIndexOf("G") === courseName.length - 1;
  }

  public stringToCourse(courseName: string) {
    return this.allCourses.find((course: ICourse) => course.name === courseName);
  }

  public courseCounterOnDelete() {
    this.courseCounter--;
  }

  public async loadPlanFromDb() {

    this.authService.authState.subscribe(async (user: any) => {
      
      if (user.email) {
        this.adminService.getAdmin(user.email);
        this.adminService.getExportStatus(user.email);
        
        const userDocRef = doc(this.dbCourses.db, 'users', user.email);
        const userDocSnap = await getDoc(userDocRef);
    
        if (userDocSnap.exists()) {
          const coursesQuery = query(collection(this.dbCourses.db, `users/${user.email}/courses`));
          const coursesSnapshot = await getDocs(coursesQuery);
    
          if (!coursesSnapshot.empty) {
            // Check to see if documents exist in the courses collection
            coursesSnapshot.forEach((doc) => {
              // Loop to get all the ids of the docs
              this.addSemesterFromDb(doc.id);
              this.loadCourseFromDb(doc.id); // Call to loading the courses on the screen, by id
            });
          } else {
            this.storeHelper.deleteAll();
            this.storeHelper.update("semesters", []);
            this.progressPanelService.setFullyPlanned(false);
          }
        }
      }
    });
      }
    
      public async loadPlanFromDbAfterDel() {
        if (this.authService.auth.currentUser.email !== undefined) {
          const userDocRef = doc(this.dbCourses.db, 'users', this.authService.auth.currentUser.email);
          const userDocSnap = await getDoc(userDocRef);
      
          if (userDocSnap.exists()) {
            const coursesQuery = query(collection(this.dbCourses.db, `users/${this.authService.auth.currentUser.email}/courses`));
            const coursesSnapshot = await getDocs(coursesQuery);
      
            if (!coursesSnapshot.empty) {
              // Check to see if documents exist in the courses collection
              coursesSnapshot.forEach((doc) => {
                // Loop to get all the ids of the docs
                this.loadCourseFromDbAfterDel(doc.id); // Call to loading the courses on the screen, by id
              });
            }
          }
        }
      }
    
      private getCourseFromDb(courseDbId: string) {
        return new Promise<any>((resolve) => {
          const semesterFromDb = {
            course: 
              this.dbCourses.getCollection("users", "courses", courseDbId).then( (res) => {resolve((res))} )
          };
        });
      }
    
      private loadCourseFromDb(courseDbId: string) {
        const courseDb = this.getCourseFromDb(courseDbId).then((copy) => {
          Object.assign({
            department: copy[0],
            desc: copy[1],
            faculties: copy[2],
            id: copy[3],
            name: copy[4],
            period: copy[5],
            points: copy[6],
            requirements: copy[7],
            stage: copy[8],
            status: copy[9],
            title: copy[10],
            year: copy[11],
            canDelete: true,
          });
          this.getCourseFromDb(courseDbId).then((res) => {
              this.storeHelper.addIfNotExists("courses", res);
              this.updateErrors();
          });
        });
      }
    
      private loadCourseFromDbAfterDel(courseDbId: string) {
        const courseDb = this.getCourseFromDb(courseDbId).then((copy) => {
          Object.assign({
            department: copy[0] || null,
            desc: copy[1] || null,
            faculties: copy[2] || null,
            id: copy[3] || null,
            name: copy[4] || null,
            period: copy[5] || null,
            points: copy[6] || null,
            requirements: copy[7] || null,
            stage: copy[8] || null,
            status: copy[9] || null,
            title: copy[10] || null,
            year: copy[11] || null,
            canDelete: true,
          })
          this.getCourseFromDb(courseDbId).then((res) => {
            this.planned = this.storeHelper.current("courses")
        for (let i = 0; i < this.planned.length; i++) {    
          if (res.id === this.planned[i].id) {
            if (res.year !== this.planned[i].year || res.period !== this.planned[i].period) {
          this.storeHelper.findAndDelete("courses", this.planned[i].id)  
          this.storeHelper.add("courses", res)
            
          // Will change this code when I eventually understand the findAndUpdate part of the storehelper.
        
          }
        }
      }
        })
      })
    }

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

    public addSemesterFromDb(courseDbId: string) {
    
      var newSemesterFromDb = { year: Number(), period: Number(), both: String() };
  
      // The following code is super gumby, because of the promised value not being returned before executing the next lines
      // I put everything into the promise on line 194 by chaining then() functions. It works though.
  
      this.getSemesterFromDb(courseDbId)
        .then((theYear) => {
          this.selectedYear = theYear;
        })
        .then(
          () => (newSemesterFromDb = { year: this.selectedYear, period: null as any, both: null as any})
        ); // Updates the year value withing the newSemesterFromDb variable
      this.getPeriodFromDb(courseDbId)
        .then(
          // This call is the first chained then
          (thePeriod) => (this.selectedPeriod = thePeriod)
        )
        .then(
          () =>
            (newSemesterFromDb = {
              year: this.selectedYear,
              period: this.selectedPeriod,
              both: this.selectedYear + " " + this.selectedPeriod
            }
          )
        )
        .then(() => {
          // Updates the period value withing the newSemesterFromDb variable
          if (this.canAddSemester(newSemesterFromDb)) {
            // Here is the rest of the code to execute within the chained then statements. So that it can occur within the promise
            this.semesters.push(newSemesterFromDb);
            this.semesters.sort((s1, s2) =>
              s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
            );
           // this.dbCourses.addSelection(this.email, "semester", newSemesterFromDb, "semesters")
            this.storeHelper.update("semesters", this.semesters);
            this.addingSemester = false; // Reverts the semster panel back to neutral
            this.selectedPeriod = Period.One; // Revert to the default value
            this.selectedYear++; // Increment the selected year so that it defaults to the next one, this avoids confusion if accidentally trying to add the same period and year, probably worth putting in a catch on the error at some point
          } else {
          }
        });
    }

    public newSemester(): void {
      const newSemester = {
        year: Number(this.selectedYear),
        period: Number(this.selectedPeriod),
        both: this.selectedYear + " " + this.selectedPeriod
      };
      if (this.canAddSemester(newSemester)) {
        this.semesters.push(newSemester);
        this.semesters.sort((s1, s2) =>
          s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
        );
        this.storeHelper.update("semesters", this.semesters);
       // this.dbCourses.addSelection(this.email, "semester", newSemester, "semesters")
        this.addingSemester = false;
        this.nextSemesterCheck();
      } else {
        this.nextSemesterCheck();
        const newSemester = {
          year: Number(this.selectedYear),
          period: Number(this.selectedPeriod),
          both: this.selectedYear + " " + this.selectedPeriod
        };
        this.semesters.push(newSemester);
        this.semesters.sort((s1, s2) =>
          s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
        );
        this.storeHelper.update("semesters", this.semesters);
  
        // this.dbCourses.addSelection(this.email, "semester", newSemester, "semesters")
        // this.dbCourses.setAuditLogSemester(newSemester);
  
        this.addingSemester = false;
      }
    }
  

    public canAddSemester(semester: any): boolean {
      return (
        this.semesters.filter(
          (s) => s.year === semester.year && s.period === semester.period
        ).length === 0
      );
    }

      // Function that updates to the correct year and period when selecting to add a new semester
  public nextSemesterCheck() {

    if (this.semesters.length > 0) {
      let latestYear = this.semesters[this.semesters.length-1]['year']
      let latestPeriod = this.semesters[this.semesters.length-1]['period']
      switch (latestPeriod) {
        case 0:
          this.selectedPeriod = 1;
          this.selectedYear = latestYear;
          break
        case 1:
          this.selectedPeriod = 2;
          this.selectedYear = latestYear;
          break
        case 2:
          this.selectedPeriod = 0;
          this.selectedYear = latestYear + 1;
          break
      }
    }
  }

// Function that updates the correct year and period when deleting a semester

public updateSemesterCheck() {

  if (this.semesters.length > 0) {
    
    let latestYear = this.semesters[this.semesters.length-1]['year']
    let latestPeriod = this.semesters[this.semesters.length-1]['period']

    switch (latestPeriod) {
      case 0:
        this.selectedPeriod = 0;
        this.selectedYear = latestYear;
        break
      case 1:
        this.selectedPeriod = 1;
        this.selectedYear = latestYear;
        break
      case 2:
        this.selectedPeriod = 2;
        this.selectedYear = latestYear;
        break
    }
    }
}

newSemEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("add_sem", "course-panel", "semester", "click", 10);
} 

}
