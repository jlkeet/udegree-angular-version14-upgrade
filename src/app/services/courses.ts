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
import { Firestore, addDoc, collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc, query, orderBy, onSnapshot, where, deleteDoc, arrayRemove } from '@angular/fire/firestore';
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

  public tempCard: any;

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
    this.complexReqsForSamplePlan = [];

    this.planned.forEach((course: ICourse) => {
      if (course.requirements !== undefined && course.requirements !== null) {
        let courseErrors: IRequirement[] = [];
        
        course.requirements.forEach((requirement: IRequirement) => {
          if (this.requirementService.isComplex(requirement)) {
            let complexErrors: IRequirement[] = [];
            const complexRequirements = requirement.complex || [];

            complexRequirements.forEach((subRequirement: IRequirement) => {
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
  
            const requiredCount = requirement.required !== undefined
              ? Math.min(requirement.required, complexRequirements.length)
              : complexRequirements.length;
            const satisfiedCount = complexRequirements.length - complexErrors.length;

            if (satisfiedCount < requiredCount) {
              courseErrors = courseErrors.concat(complexErrors);
              this.complexReqsForSamplePlan.push(requirement);
            }
          } else {
            const plannedPool = this.requirementService.checkCoRequesiteFlag(requirement, "isCorequesite")
              ? this.currentSemester(course)
              : this.beforeSemester(course);
            if (!this.requirementService.requirementFilled(requirement, plannedPool, course)) {
              courseErrors.push(requirement);
            }
          }
        });

        if (courseErrors.length > 0) {
          // console.log(courseErrors)
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
    return this.planned.filter(
      (course: ICourse) =>
        ((course.period as number) < (beforeCourse.period as number) &&
          course.year === beforeCourse.year) ||
        (course.year as number) < (beforeCourse.year as number)
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
          this.syncSemestersWithPlannedCourses();
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
        const userEmail = this.authService?.auth?.currentUser?.email;
        if (!userEmail) {
          return;
        }

        const userDocRef = doc(this.dbCourses.db, 'users', userEmail);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          return;
        }

        const coursesQuery = query(collection(this.dbCourses.db, `users/${userEmail}/courses`));
        const coursesSnapshot = await getDocs(coursesQuery);

        if (coursesSnapshot.empty) {
          return;
        }

        await Promise.all(
          coursesSnapshot.docs.map((snapshotDoc) =>
            this.loadCourseFromDbAfterDel(snapshotDoc.id)
          )
        );
        this.syncSemestersWithPlannedCourses();
      }
    
      private getCourseFromDb(courseDbId: string) {
        return new Promise<any>((resolve) => {
          const semesterFromDb = {
            course: 
              this.dbCourses.getCollection("users", "courses", courseDbId).then( (res) => {resolve((res))} )
          };
        });
      }

      private normalizeCourseFromDb(rawCourse: any): ICourse | null {
        if (!rawCourse) {
          return null;
        }

        if (Array.isArray(rawCourse)) {
          return {
            department: rawCourse[0] || [],
            desc: rawCourse[1] || "",
            faculties: rawCourse[2] || [],
            id: rawCourse[3] || 0,
            generatedId: rawCourse[4] || 0,
            name: rawCourse[5] || "",
            period: rawCourse[6] || null,
            points: rawCourse[7] || 0,
            requirements: rawCourse[8] || [],
            stage: rawCourse[9] || null,
            status: rawCourse[10] || null,
            title: rawCourse[11] || "",
            year: rawCourse[12] || null,
            grade: rawCourse[13] || null,
            canDelete: true,
          };
        }

        return Object.assign({}, rawCourse, { canDelete: true }) as ICourse;
      }

      private async loadCourseFromDb(courseDbId: string) {
        try {
          const rawCourse = await this.getCourseFromDb(courseDbId);
          const course = this.normalizeCourseFromDb(rawCourse);
          if (!course) {
            return;
          }
          this.storeHelper.addIfNotExists("courses", course as any);
          this.updateErrors();
        } catch (error) {
          console.error('Error loading course from DB:', error);
          // Handle the error appropriately
        }
      }
      

    private async loadCourseFromDbAfterDel(courseDbId: string) {
      try {
          const rawCourse = await this.getCourseFromDb(courseDbId);
          const course = this.normalizeCourseFromDb(rawCourse);
          if (!course) {
            return;
          }

          const plannedCourses = this.storeHelper.current("courses") || [];
          const targetCourseIndex = plannedCourses.findIndex(
            (plannedCourse: ICourse) => plannedCourse.generatedId === course.generatedId
          );

          if (targetCourseIndex === -1) {
            this.storeHelper.addIfNotExists("courses", course as any);
            return;
          }

          if (
             course.year !== plannedCourses[targetCourseIndex].year || 
             course.period !== plannedCourses[targetCourseIndex].period
          ) {
              this.storeHelper.findAndDelete("courses", plannedCourses[targetCourseIndex].generatedId);
              this.storeHelper.add("courses", course);
          }
  
      } catch (error) {
          // Handle the error here
          console.error('Failed to load course:', error);
      }
  }

  public async addSemesterFromDb() {
    try {
      const userEmail = this.authService?.auth?.currentUser?.email;
      if (!userEmail) {
        return;
      }

      const semestersQuery = query(
        collection(this.dbCourses.db, `users/${userEmail}/semester`)
      );
      const semestersSnapshot = await getDocs(semestersQuery);

      const semesterDocs = semestersSnapshot.docs
        .map((snapshotDoc) => this.normalizeSemester(snapshotDoc.data()))
        .filter((semester): semester is { year: number; period: number; both: string; tempCards: any[] } => !!semester);

      const semestersFromStore = Array.isArray(this.storeHelper.current("semesters"))
        ? this.storeHelper.current("semesters")
        : [];

      const mergedSemesters = this.mergeSemesters(semestersFromStore, semesterDocs);
      if (mergedSemesters.length > 0) {
        this.semesters = mergedSemesters;
        this.storeHelper.update("semesters", mergedSemesters);
      }

      this.syncSemestersWithPlannedCourses();
    } catch (error) {
      console.error('Error adding semester from DB:', error);
      // Handle the error appropriately
    }
  }
  
  
  

    public newSemester(): boolean {
      const semestersFromStore = this.storeHelper.current("semesters");
      this.semesters = Array.isArray(semestersFromStore) ? [...semestersFromStore] : [];

      if (this.semesters.length > 0) {
        this.nextSemesterCheck();
      } else {
        this.selectedYear = 2024;
        this.selectedPeriod = 1;
      }

      if (!this.selectedYear || this.selectedYear === 0) {
        this.selectedYear = 2024;
      }
      if (
        this.selectedPeriod === undefined ||
        this.selectedPeriod === null ||
        Number.isNaN(Number(this.selectedPeriod))
      ) {
        this.selectedPeriod = 1;
      }

      let newSemester = {
        year: Number(this.selectedYear),
        period: Number(this.selectedPeriod),
        both: `${this.selectedYear} ${this.selectedPeriod}`,
        tempCards: [] as any[],
      };

      // Guarantee we always insert the next available slot instead of silently no-oping.
      let guard = 0;
      while (!this.canAddSemester(newSemester) && guard < 24) {
        const next = this.getNextSemesterSlot(newSemester.year, newSemester.period);
        newSemester = {
          year: next.year,
          period: next.period,
          both: `${next.year} ${next.period}`,
          tempCards: [] as any[],
        };
        guard++;
      }

      if (!this.canAddSemester(newSemester)) {
        return false;
      }

      this.semesters.push(newSemester);
      this.semesters.sort((s1, s2) =>
        s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
      );
      this.storeHelper.update("semesters", this.semesters);
      this.addingSemester = false;

      const userEmail = this.authService?.auth?.currentUser?.email;
      if (userEmail) {
        this.dbCourses
          .addSelection(userEmail, "semester", newSemester, "semesters")
          .catch((error: any) =>
            console.error("Error saving semester to database:", error)
          );
      }

      return true;
    }
  

	  public canAddSemester(semester: any): boolean {
	      
	      return (
	        this.semesters.filter(
	          (s) => s.year === semester.year && s.period === semester.period
	        ).length === 0
	      );
	    }

  public syncSemestersWithPlannedCourses(): number {
    const semestersFromStore = Array.isArray(this.storeHelper.current("semesters"))
      ? this.storeHelper.current("semesters")
      : [];
    const coursesFromStore = Array.isArray(this.storeHelper.current("courses"))
      ? this.storeHelper.current("courses")
      : [];

    const courseDerivedSemesters = (coursesFromStore as ICourse[])
      .map((course: ICourse) =>
        this.normalizeSemester({
          year: course.year,
          period: course.period,
          tempCards: [],
        })
      )
      .filter(
        (
          semester: { year: number; period: number; both: string; tempCards: any[] } | null
        ): semester is { year: number; period: number; both: string; tempCards: any[] } =>
          !!semester
      );

    const merged = this.mergeSemesters(semestersFromStore, courseDerivedSemesters);
    const normalizedStore = this.mergeSemesters(semestersFromStore, []);
    const addedSemesters = Math.max(0, merged.length - normalizedStore.length);

    if (!this.sameSemesterSet(normalizedStore, merged)) {
      this.semesters = merged;
      this.storeHelper.update("semesters", merged);
    } else {
      this.semesters = merged;
    }

    return addedSemesters;
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

private getNextSemesterSlot(year: number, period: number): { year: number; period: number } {
  switch (period) {
    case 0:
      return { year, period: 1 };
    case 1:
      return { year, period: 2 };
    case 2:
      return { year: year + 1, period: 0 };
    default:
      return { year, period: 1 };
		}
}

  private normalizeSemester(rawSemester: any): { year: number; period: number; both: string; tempCards: any[] } | null {
    if (!rawSemester) {
      return null;
    }

    const year = Number(rawSemester.year);
    const period = Number(rawSemester.period);
    if (!Number.isFinite(year) || !Number.isFinite(period)) {
      return null;
    }

    return {
      year,
      period,
      both: `${year} ${period}`,
      tempCards: Array.isArray(rawSemester.tempCards) ? rawSemester.tempCards : [],
    };
  }

  private mergeSemesters(
    primarySemesters: any[],
    secondarySemesters: any[]
  ): { year: number; period: number; both: string; tempCards: any[] }[] {
    const semesterByKey = new Map<string, { year: number; period: number; both: string; tempCards: any[] }>();

    const insertSemester = (candidate: any) => {
      const normalized = this.normalizeSemester(candidate);
      if (!normalized) {
        return;
      }

      const key = `${normalized.year}-${normalized.period}`;
      if (!semesterByKey.has(key)) {
        semesterByKey.set(key, normalized);
        return;
      }

      const existing = semesterByKey.get(key)!;
      const existingTempCards = Array.isArray(existing.tempCards) ? existing.tempCards : [];
      const incomingTempCards = Array.isArray(normalized.tempCards)
        ? normalized.tempCards
        : [];

      if (existingTempCards.length === 0 && incomingTempCards.length > 0) {
        semesterByKey.set(key, normalized);
      }
    };

    primarySemesters.forEach(insertSemester);
    secondarySemesters.forEach(insertSemester);

    return Array.from(semesterByKey.values()).sort((s1, s2) =>
      s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
    );
  }

  private sameSemesterSet(semestersA: any[], semestersB: any[]): boolean {
    if (semestersA.length !== semestersB.length) {
      return false;
    }

    const keyOf = (semester: any) => `${semester.year}-${semester.period}`;
    const keysA = semestersA.map(keyOf).join(",");
    const keysB = semestersB.map(keyOf).join(",");
    return keysA === keysB;
  }

  private tempCardIdsMatch(leftCard: any, rightCard: any): boolean {
    if (!leftCard || !rightCard) {
      return false;
    }

    const leftId = leftCard.generatedId;
    const rightId = rightCard.generatedId;
    if (leftId === undefined || leftId === null || rightId === undefined || rightId === null) {
      return false;
    }

    const numericLeft = Number(leftId);
    const numericRight = Number(rightId);
    if (Number.isFinite(numericLeft) && Number.isFinite(numericRight)) {
      return numericLeft === numericRight;
    }

    return String(leftId) === String(rightId);
  }

  public async deleteTempCard(tempCard: any) {
    if (!tempCard || tempCard.generatedId === undefined || tempCard.generatedId === null) {
      return;
    }

    const email = this.authService?.auth?.currentUser?.email;
    if (email) {
      const userRef = doc(this.user_db, `users/${email}`);
      const semesterRef = collection(userRef, "semester");
      const q = query(semesterRef);
      const snapshot = await getDocs(q);

      const updates: Promise<any>[] = [];

      snapshot.forEach((docSnap) => {
        const docRef = doc(semesterRef, docSnap.id);
        const tempCards: any[] = Array.isArray(docSnap.data()["tempCards"])
          ? docSnap.data()["tempCards"]
          : [];

        const updatedTempCards = tempCards.filter(
          (card: any) => !this.tempCardIdsMatch(card, tempCard)
        );
        if (updatedTempCards.length === tempCards.length) {
          return;
        }

        updates.push(
          updateDoc(docRef, { tempCards: updatedTempCards }).catch((error) => {
            console.error("Error removing tempCard from the document: ", error);
          })
        );
      });

      if (updates.length > 0) {
        await Promise.all(updates);
      }
    }

    this.storeHelper.deleteTempCard(tempCard);
  }

newSemEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("add_sem", "course-panel", "semester", "click", 10);
} 

}
