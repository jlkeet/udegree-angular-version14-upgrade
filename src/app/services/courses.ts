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
import { getAuth } from "@angular/fire/auth";
import { Database, get, getDatabase, ref } from '@angular/fire/database';
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
  public complexReqsForSamplePlan: any[] = [];
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

  public async setCourseDb(course: any, generatedId: any, coursePeriod: number, courseYear: number, status?: CourseStatus, grade?: null) {
    course.generatedId = generatedId || Math.floor(Math.random() * 100000);
    this.storeHelper.add('courses', course);
    let result = course;
    
    const coursesRef = collection(doc(this.user_db, `users/${this.authService.auth.currentUser.email}`), "courses");
  
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
      generatedId: generatedId,
    }));
  }

  public deselectCourse(course: number) { // Is this redundant now?
    this.storeHelper.findAndDelete('courses', course);
    this.updateErrors();
  }

  // Note that this is also linked to semester-panel.component, called there to remove all courses when exiting semester.

  public async deselectCourseByName(courseObject: any) {

    let course: any;
    course = courseObject; // gets rid of generatedId error issue, might have to fix later
  
    // if (courseObject.status !== 3) {
    //   course = this.findPlanned(courseObject.name);
    // } else {
    //   course = this.findFailed(courseObject.name);
    // }  

    // console.log("Course Object:", courseObject);
    // console.log("Course:", course);

    // this.dbCourses.setAuditLogDeleteCourse(courseName)
    this.storeHelper.findAndDelete('courses', course);
    
    this.updateErrors();
    this.courseCounter--;
    const coursesRef = collection(doc(this.user_db, `users/${this.authService.auth.currentUser.email}`), "courses");
    const q = query(coursesRef, where('generatedId', '==', course.generatedId));
    
    const snapshot = await getDocs(q);
    
    snapshot.forEach(docSnap => {
      deleteDoc(doc(this.user_db, `users/${this.authService.auth.currentUser.email}/courses/${docSnap.id}`));
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
    
    this.planned.forEach((course: ICourse) => {
      if (course.requirements !== undefined && course.requirements !== null) {
        let courseErrors: IRequirement[] = [];
        
        course.requirements.forEach((requirement: IRequirement) => {
          if (this.requirementService.isComplex(requirement)) {
            let complexReqSample = requirement
            this.complexReqsForSamplePlan.push(requirement)
            let complexErrors: IRequirement[] = [];

            
            requirement.complex.forEach((subRequirement: IRequirement) => {
              if (this.requirementService.checkCoRequesiteFlag(subRequirement, "isCorequesite")) {
                if (!this.requirementService.requirementFilled(subRequirement, this.currentSemester(course), course)) {
                  complexErrors.push(subRequirement);
                }
              } else {
                if (!this.requirementService.requirementFilled(subRequirement, this.beforeSemester(course), course)) {
                  complexErrors.push(subRequirement);
                }
              }
            });
  
            // Only push complex errors if all requirements are not filled
            if (complexErrors.length === requirement.complex.length) {
              courseErrors = courseErrors.concat(complexErrors);
              this.complexReqsForSamplePlan.push(complexReqSample)
            }
          } else {
            if (!this.requirementService.requirementFilled(requirement, this.planned, course)) {
              courseErrors.push(requirement);
            }
          }
        });

        if (courseErrors.length > 0) {
          courseErrors.forEach((unfilled: IRequirement) => {
            const errorMessage = this.requirementService.toString(unfilled, false);
            const message = new Message(course.name, course.name + ": " + errorMessage, MessageStatus.Error, unfilled);
            this.errors.push(message);
          });
        }
        course.isError = courseErrors.length > 0;
      } else {
        course.isError = false;
      }
    });
  
    this.storeHelper.update('messages', this.errors); // needs to be changed if different sources for messages
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
  if (courseName) {  
    if (this.isGeneral(courseName)) {
      return courseName.substring(0, courseName.length - 1);
    } else {
     // return courseName + 'G';
     return courseName; // If there's an error check this, I needed to return something couldn't have it not a return a value.
    }
  } else {
    return "";
  }
  }

  public isGeneral(courseName: string): boolean {
    // console.log(courseName)
    return courseName.lastIndexOf("G") === courseName.length - 1;
  }

  public stringToCourse(courseName: string) {
    return this.allCourses.find((course: ICourse) => course.name === courseName);
  }

  public courseCounterOnDelete() {
    this.courseCounter--;
  }

  public async loadPlanFromDb() {
    try {
      const userEmail = this.authService.auth.currentUser.email;
      const userDocRef = doc(this.dbCourses.db, 'users', userEmail);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        const coursesQuery = query(collection(this.dbCourses.db, `users/${userEmail}/courses`));
        const coursesSnapshot = await getDocs(coursesQuery);
  
        if (!coursesSnapshot.empty) {
          // Load all courses in parallel
          const loadCoursePromises = coursesSnapshot.docs.map(doc => this.loadCourseFromDb(doc.id));
          await Promise.all(loadCoursePromises);
        } else {
          this.storeHelper.deleteAll();
          this.storeHelper.update("semesters", []);
          this.progressPanelService.setFullyPlanned(false);
        }
      }
    } catch (error) {
      console.error('Error loading plan from DB:', error);
      // Handle the error appropriately
    }
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

      private async loadCourseFromDb(courseDbId: string) {
        try {
          const copy = await this.getCourseFromDb(courseDbId);
          const course: any = {
            department: copy["department"],
            desc: copy["desc"],
            faculties: copy["faculties"],
            id: copy["id"],
            generatedId: copy["generatedId"],
            name: copy["name"],
            period: copy["period"],
            points: copy["points"],
            requirements: copy["requirements"],
            stage: copy["stage"],
            status: copy["status"],
            title: copy["title"],
            year: copy["year"],
            canDelete: true,
          };
          this.storeHelper.addIfNotExists("courses", course);
          this.updateErrors();
        } catch (error) {
          console.error('Error loading course from DB:', error);
          // Handle the error appropriately
        }
      }
      

    private async loadCourseFromDbAfterDel(courseDbId: string) {
      try {
          const copy = await this.getCourseFromDb(courseDbId);
          const course = {
              department: copy[0] || null,
              desc: copy[1] || null,
              faculties: copy[2] || null,
              id: copy[3] || null,
              generatedId: copy[4] || null,
              name: copy[5] || null,
              period: copy[6] || null,
              points: copy[7] || null,
              requirements: copy[8] || null,
              stage: copy[9] || null,
              status: copy[10] || null,
              title: copy[11] || null,
              year: copy[12] || null,
              canDelete: true,
          };
          
          const plannedCourses = this.storeHelper.current("courses");
          const targetCourseIndex = plannedCourses.findIndex((c: { generatedId: any; }) => c.generatedId === course.generatedId);
          
          if (targetCourseIndex !== -1 && 
             (course.year !== plannedCourses[targetCourseIndex].year || 
             course.period !== plannedCourses[targetCourseIndex].period)) {
              this.storeHelper.findAndDelete("courses", plannedCourses[targetCourseIndex].generatedId);
              this.storeHelper.add("courses", course);
          }
  
      } catch (error) {
          // Handle the error here
          console.error('Failed to load course:', error);
      }
  }

  private async getSemesterFromDb(semesterDbId: string): Promise<number> {
    const res = await this.dbCourses.getCollection("users", "semester", semesterDbId);
    return res.year; // Assuming 'year' is a number
  }
  
  private async getPeriodFromDb(periodDbId: string): Promise<number> {
    const res = await this.dbCourses.getCollection("users", "semester", periodDbId);
    return res.period; // Assuming 'period' is a number
  }

  private async getTempCardsFromDb(tempCardsDbId: string): Promise<any[]> {
    const res = await this.dbCourses.getCollection("users", "semester", tempCardsDbId);
    return res.tempCards; // Assuming 'period' is a number
  }


  public async addSemesterFromDb() {
    try {
      const userEmail = this.authService.auth.currentUser.email;
      const semestersQuery = query(collection(this.dbCourses.db, `users/${userEmail}/semester`));
      const semestersSnapshot = await getDocs(semestersQuery);
  
      if (!semestersSnapshot.empty) {
        const semesterPromises = semestersSnapshot.docs.map(async (doc) => {
          const [year, period, tempCards] = await Promise.all([
            this.getSemesterFromDb(doc.id), 
            this.getPeriodFromDb(doc.id),
            this.getTempCardsFromDb(doc.id)
          ]);
  
          const newSemester: { year: number, period: number, both: string, tempCards: any[] } = { year, period, both: year + " " + period, tempCards};
          return this.canAddSemester(newSemester) ? newSemester : null;
        });
  
        const semesters = (await Promise.all(semesterPromises)).filter(semester => semester !== null);
        
        semesters.sort((s1, s2) => s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year);
        this.storeHelper.update("semesters", semesters);
      }
    } catch (error) {
      console.error('Error adding semester from DB:', error);
      // Handle the error appropriately
    }
  }
  
  
  

    public newSemester(): void {
      // console.log("firing")

      this.semesters = this.storeHelper.current("semesters");

      if (this.selectedYear === 0) {
        this.selectedYear = 2023;
      }

      this.nextSemesterCheck();



      const newSemester = {
        year: Number(this.selectedYear),
        period: Number(this.selectedPeriod),
        both: this.selectedYear + " " + this.selectedPeriod,
        tempCards: [] as any[]
      };
      if (this.canAddSemester(newSemester)) {
        this.semesters.push(newSemester);
        this.semesters.sort((s1, s2) =>
          s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
        );
        this.storeHelper.update("semesters", this.semesters);
        this.addingSemester = false;
        this.nextSemesterCheck();
      } else {
        this.nextSemesterCheck();
        const newSemester = {
          year: Number(this.selectedYear),
          period: Number(this.selectedPeriod),
          both: this.selectedYear + " " + this.selectedPeriod,
          tempCards: [] as any[]
        };
        this.semesters.push(newSemester);
        this.semesters.sort((s1, s2) =>
          s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
        );
        this.storeHelper.update("semesters", this.semesters);
        // this.dbCourses.setAuditLogSemester(newSemester);
  
        this.addingSemester = false;
      }
     this.dbCourses.addSelection(this.authService.auth.currentUser.email, "semester", newSemester, "semesters")
    //  console.log(semId)
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
