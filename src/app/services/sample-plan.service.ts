import { Injectable } from "@angular/core";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { StoreHelper } from "./store-helper";
import { AuthService } from "../core/auth.service";
import { CourseService } from "./courses";
import { FirebaseDbService } from "../core/firebase.db.service";
import { Message, Period } from "../models";
import { ProgressPanelService } from "./progress-panel.service";
import { ICourse } from "../interfaces";
import { arrayUnion, updateDoc, writeBatch } from "@angular/fire/firestore";

@Injectable()
export class SamplePlanService {
  public semesters: any = [];
  public selectedYear;
  public selectedPeriod;
  public addingSemester = false;
  public email: string = '';
  public period = 1;
  public year = 2024;

  public counter = 0;

  public autoButtonClicked: boolean = false;
  public addedCourses = 0;

  public majReqs: any = [];
  public secondMajReqs: any = [];
  public thirdMajReqs: any = [];
  public pathwayReqs: any = [];
  public moduleReqs: any = [];
  public secondModuleReqs: any = [];

  public complexPreReqs: any = [];

  public coursePreReqAutoFillFac: any;
  public coursePreReqAutoFillDept: any;
  public pointsCardFaculty = {
    faculty: '',
    level: 0,
    points: 0,
    value: 15,
    generatedId: 0
  };

  public pointsCardDepartment = {
    department: '',
    level: 0,
    points: 0,
    value: 15,
    generatedId: 0
  };

  private courseMap: Map<string, ICourse> = new Map();

  constructor(
    public authService: AuthService,
    public storeHelper: StoreHelper,
    public courseService: CourseService,
    public dbCourseService: FirebaseDbService,
    public progressPanelService: ProgressPanelService
  ) {
    this.selectedYear = 2024;
    this.selectedPeriod = Period.One;
  }

  ngOnInit() {
    // Wait for allCourses to be initialized
    if (this.courseService.allCourses) {
      this.createCourseMap();
    }
  }

  public setCourse() {
    this.autoButtonClicked = true;
    this.getEssentialCourses();
    this.complexCourses();
  }

  private createCourseMap() {
    for (const course of this.courseService.allCourses) {
      this.courseMap.set(course.name, course);
    }
  }

  public async loadPlanFromDb() {
    const userRef = doc(
      this.dbCourseService.db,
      `users/${this.authService.auth.currentUser!.email}`
    );
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const coursesCollectionRef = collection(userRef, 'courses');
      const coursesSnap = await getDocs(coursesCollectionRef);

      if (!coursesSnap.empty) {
        // Check to see if documents exist in the courses collection
        coursesSnap.forEach((doc) => {
          // Loop to get all the ids of the docs
          this.addSemesterFromDb(doc.id);
          this.loadCourseFromDb(doc.id); // Call to loading the courses on the screen, by id
        });
      }
    }
  }

  private courseDocIds = new Map<any, any>();

  public loadCourseFromDb(courseDbId: any) {
    this.getCourseFromDb(courseDbId)
      .then((copy) => {
        if (copy) {
          this.courseDocIds.set(copy.generatedId, courseDbId);
          return Object.assign({
            department: copy.department,
            desc: copy.desc,
            faculties: copy.faculties,
            id: copy.id,
            generatedId: copy.generatedId,
            name: copy.name,
            period: copy.period,
            points: copy.points,
            requirements: copy.requirements,
            stage: copy.stage,
            status: copy.status,
            title: copy.title,
            year: copy.year,
            canDelete: true,
          });
        }
      })
      .then(() => {
        // Notice we return the next promise here
        return this.getCourseFromDb(courseDbId);
      })
      .then((res) => {
        // this.storeHelper.findAndDelete("courses", res);
        // this.storeHelper.add("courses", res);
        this.storeHelper.findAndUpdate('courses', res);
        this.courseService.updateErrors();
      })
      .catch((error) => {
        console.error(error);
      });
  }

  private getCourseFromDb(courseDbId: string) {
    return new Promise<any>((resolve) => {
      const semesterFromDb = {
        course: this.dbCourseService
          .getCollection('users', 'courses', courseDbId)
          .then((res) => {
            resolve(res);
          }),
      };
    });
  }

  public addSemesterFromDb(courseDbId: string) {
    var newSemesterFromDb = {
      year: Number(),
      period: Number(),
      both: String(),
      tempCards: [] as any[],
    };

    // The following code is super gumby, because of the promised value not being returned before executing the next lines
    // I put everything into the promise on line 194 by chaining then() functions. It works though.

    this.getSemesterFromDb(courseDbId)
      .then((theYear) => {
        this.selectedYear = theYear;
      })
      .then(
        () =>
          (newSemesterFromDb = {
            year: this.selectedYear,
            period: 0,
            both: '',
            tempCards: [] as any[],
          })
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
            both: this.selectedYear + ' ' + this.selectedPeriod,
            tempCards: [] as any[],
          })
      )
      .then(async () => {
        // Updates the period value withing the newSemesterFromDb variable
        if (this.canAddSemester(newSemesterFromDb)) {
          // Here is the rest of the code to execute within the chained then statements. So that it can occur within the promise
          this.semesters.push(newSemesterFromDb);
          this.semesters.sort(
            (
              s1: { year: number; period: number },
              s2: { year: number; period: number }
            ) =>
              s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
          );
          // this.dbCourses.addSelection(this.email, "semester", newSemesterFromDb, "semesters")
          this.storeHelper.update('semesters', this.semesters);
          this.addingSemester = false; // Reverts the semester panel back to neutral
          this.selectedPeriod = Period.One; // Revert to the default value
          this.selectedYear++; // Increment the selected year so that it defaults to the next one, this avoids confusion if accidentally trying to add the same period and year, probably worth putting in a catch on the error at some point
        } else {
        }
      });
  }

  private async getSemesterFromDb(courseDbId: string, retryCount = 3) {
    for (let i = 0; i < retryCount; i++) {
      try {
        const res = await this.dbCourseService.getCollection(
          'users',
          'courses',
          courseDbId
        );
        if (res && res['year']) {
          return res['year'];
        } else {
          console.warn(`Year not found for ${courseDbId}, retrying...`);
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
        }
      } catch (error) {
        console.error(error);
      }
    }

    throw new Error(
      `Year not found for ${courseDbId} after ${retryCount} attempts`
    );
  }

  // This function gets the semester period from the course

  private getPeriodFromDb(courseDbId: string) {
    return new Promise<any>((resolve) => {
      const periodFromDb = {
        period: Number(
          this.dbCourseService
            .getCollection('users', 'courses', courseDbId)
            .then((res) => {
              if (res) {
                resolve(res['period']);
              }
            })
        ),
      };
    });
  }

  private canAddSemester(semester: {
    year: any;
    period: any;
    both?: string;
    tempCards?: any[];
  }): boolean {
    return (
      this.semesters.filter(
        (s: { year: any; period: any }) =>
          s.year === semester.year && s.period === semester.period
      ).length === 0
    );
  }

  public getRandomCourse(max: number) {
    return Math.floor(Math.random() * max);
  }

  public periodSwitcheroo() {
    if (this.period == 1) {
      this.period = 2;
    } else {
      this.period = 1;
    }
  }

  public newYear() {
    this.year += 1;
  }

  public getEssentialCourses() {
    this.majReqs.push(this.progressPanelService.getMajReqs());
    this.secondMajReqs.push(this.progressPanelService.getSecondMajReqs());
    this.thirdMajReqs.push(this.progressPanelService.getThirdMajReqs());
    this.pathwayReqs.push(this.progressPanelService.getPathwayReqs());
    this.moduleReqs.push(this.progressPanelService.getModuleReqs());
    this.secondModuleReqs.push(this.progressPanelService.getSecondModuleReqs());

    let allReqs = [
      ...this.majReqs,
      ...this.secondMajReqs,
      ...this.thirdMajReqs,
      ...this.pathwayReqs,
      ...this.moduleReqs,
      ...this.secondModuleReqs,
    ];

    // Create a map for easy lookup of course names
    this.courseMap = new Map();
    for (let course of this.courseService.allCourses) {
      this.courseMap.set(course.name, course);
    }

    for (let z = 0; z < allReqs.length; z++) {
      if (allReqs[z]) {
        for (let x = 0; x < allReqs[z].length; x++) {
          if (allReqs[z][x] && allReqs[z][x].papers) {
            if (!allReqs[z][x].papers[0].includes('-')) {
              for (let paper of allReqs[z][x].papers) {
                // Use the map for constant time lookup
                if (this.courseMap.has(paper)) {
                  const existingCourse = this.storeHelper
                    .current('courses')
                    .find((course: { name: any }) => course.name === paper);
                  if (
                    !existingCourse ||
                    (existingCourse && existingCourse.status === 3)
                  ) {
                    if (this.addedCourses % 4 == 0 && this.addedCourses > 0) {
                      // Checks if there are already 4 courses in the current semester
                      this.periodSwitcheroo(); // Move to next period
                      if (this.period === 1) {
                        // If it's the first period of the year, move to next year
                        this.newYear();
                      }
                    }
                    this.courseService.setCourseDb(
                      this.courseMap.get(paper),
                      Math.floor(Math.random() * 100000),
                      this.period,
                      this.year
                    );
                    this.addedCourses++;
                  } else {
                    // Course was not added, decrement addedCourses
                    // this.addedCourses--;
                  }
                }
              }
            }
          } else {
            const requirement = allReqs[z][x];
            if (requirement && requirement.required && requirement.departments[0] && requirement.aboveStage) {
              this.getMajorRequirementPoints(requirement.departments[0], requirement.aboveStage + 1, requirement.required);
            }
          }
          
        }
      }
    }
    const hasThirdYear = this.semesters.some((semester: any) => semester.year === semester.year + 2);
      // If there is no third year, add it
  if (!hasThirdYear) {
    this.addNewSemester(this.year + 2, Period.One);
    this.addNewSemester(this.year + 2, Period.Two);
  }
  }

  public async complexCourses() {
    this.majReqs.push(this.progressPanelService.getMajReqs());
    this.secondMajReqs.push(this.progressPanelService.getSecondMajReqs());
    this.thirdMajReqs.push(this.progressPanelService.getThirdMajReqs());
    this.pathwayReqs.push(this.progressPanelService.getPathwayReqs());
    this.moduleReqs.push(this.progressPanelService.getModuleReqs());
    this.secondModuleReqs.push(this.progressPanelService.getSecondModuleReqs());

    let allReqsComplex = [
      ...this.majReqs,
      ...this.secondMajReqs,
      ...this.thirdMajReqs,
      ...this.pathwayReqs,
      ...this.moduleReqs,
      ...this.secondModuleReqs,
    ];

    for (let z = 0; z < allReqsComplex.length; z++) {
      if (!allReqsComplex[z]) continue;

      for (let i = 0; i < allReqsComplex[z].length; i++) {
        if (!(allReqsComplex[z][i] && allReqsComplex[z][i].papers)) continue;

        let shown = this.courseService.allCourses;
        if (allReqsComplex[z][i].papers[0].includes('-')) {
          const terms = allReqsComplex[z][i].papers[0].split(' ');
          shown = shown.filter((course: any) =>
            terms.some((term: string) => {
              const index = term.indexOf('-');
              if (index > 3) {
                const lower = Number(term.substring(index - 3, index));
                const num = Number(course.name.substring(index - 3, index));
                const upper = Number(term.substring(index + 1, index + 4));

                return (
                  num <= upper &&
                  num >= lower &&
                  course.name.substring(0, index - 4).toLowerCase() ===
                    term.substring(0, index - 4).toLowerCase()
                );
              }
              return false;
            })
          );

          let complexCourseArray = shown;
          for (let i = 0; i < 3; i++) {
            let random = this.getRandomCourse(complexCourseArray.length);
            const courseToAdd = complexCourseArray[random];
            if (!this.duplicateChecker(courseToAdd)) {
              if (
                !this.storeHelper
                  .current('courses')
                  .some(
                    (course: { name: string }) =>
                      course.name === courseToAdd.name
                  )
              ) {
                this.courseService.setCourseDb(
                  courseToAdd,
                  Math.floor(Math.random() * 100000),
                  this.period,
                  this.year
                );
                this.addedCourses++;
                this.yearPeriodChecker(this.addedCourses);
                complexCourseArray.splice(random, 1);
              }
            } else {
              // Course was not added, decrement addedCourses
              // this.addedCourses--;
            }
          }
        }
        this.loadPlanFromDb();
      }
    }
    this.finalizeCourseAdding();
    this.sortCoursesIntoYears();
  }

  private finalizeCourseAdding() {
    // Check if there are courses in the last semester that haven't triggered a new semester addition
    if (this.addedCourses % 4 > 0) {
      this.addNewSemester(this.year, this.period);
    }
  }

  public yearPeriodChecker(addedCourses: number) {
    if (addedCourses > 0) {
      if (addedCourses % 8 == 0) {
        this.addNewSemester(this.year, this.period);
        this.newYear();
      }

      if (addedCourses % 4 == 0 || addedCourses == 0) {
        if (addedCourses % 8 != 0) {
          this.addNewSemester(this.year, this.period);
        }
        this.periodSwitcheroo();
      }
    }
  }

  public duplicateChecker(course: ICourse) {
    if (this.storeHelper.current('courses').includes(course)) {
      return true;
    } else {
      return false;
    }
  }

  public async addNewSemester(year: number, period: Period) {
    let newSemester = {
      year: year,
      period: period,
      both: year + ' ' + period,
      tempCards: [] as any[],
    };
    try {
      this.dbCourseService.addSelection(
        this.authService.auth.currentUser.email,
        'semester',
        newSemester,
        'semesters'
      );
  
      // Find the correct index to insert the new semester
      const insertIndex = this.semesters.findIndex(
        (semester: any) => semester.year > year || (semester.year === year && semester.period > period)
      );
  
      if (insertIndex === -1) {
        // If no semester is found after the new semester, add it to the end
        this.storeHelper.add('semesters', newSemester);
      } else {
        // Insert the new semester at the appropriate index
        this.semesters.splice(insertIndex, 0, newSemester);
        this.storeHelper.update('semesters', this.semesters);
      }
  
      this.semesters = this.storeHelper.current('semesters');
    } catch (error) {
      console.error('Error adding new semester:', error);
    }
  }

  // Code for sorting courses into levels after they have been automatically added to the plan

  private async sortCoursesIntoYears() {
    const sortedCourses: ICourse[][] = [[], [], []]; // Adjust for more years if needed

    for (const course of this.storeHelper.current('courses')) {
      const yearIndex = course.stage - 1; // As stage gives 1, 2, or 3
      if (yearIndex >= 0 && yearIndex < sortedCourses.length) {
        sortedCourses[yearIndex].push(course);
      }
    }

    this.distributeCoursesAcrossSemesters(sortedCourses);
    await this.updateCoursesInFirebase();
  }

  private distributeCoursesAcrossSemesters(sortedCourses: ICourse[][]) {
    this.year = 2024;
    sortedCourses.forEach((yearCourses, yearIndex) => {
      let semesterIndex = 0; // Reset for each year

      yearCourses.forEach((course) => {
        const actualYear = this.year + yearIndex;
        const period = semesterIndex % 2 === 0 ? Period.One : Period.Two;

        if (!this.semesterExists(actualYear, period)) {
          this.addNewSemester(actualYear, period);
        }

        course.year = actualYear;
        course.period = period;
        semesterIndex++; // Increment for each course
      });

      // Check if there's a need to add an empty second semester
      if (semesterIndex % 2 !== 0) {
        const actualYear = this.year + yearIndex;
        if (!this.semesterExists(actualYear, Period.Two)) {
          this.addNewSemester(actualYear, Period.Two);
        }
      }
    });

    this.storeHelper.update('courses', this.flattenCourses(sortedCourses));
    this.storeHelper.update('semesters', this.semesters);
  }

  private semesterExists(year: number, period: Period): boolean {
    return this.semesters.some(
      (semester: { year: number; period: Period }) =>
        semester.year === year && semester.period === period
    );
  }

  private flattenCourses(sortedCourses: ICourse[][]): ICourse[] {
    return sortedCourses.reduce((acc, val) => acc.concat(val), []);
  }

  private async updateCoursesInFirebase() {
    const userEmail = this.authService.auth.currentUser.email;
    for (const course of this.storeHelper.current('courses')) {
      setTimeout(async () => {
        if (course.generatedId) {
          const firebaseDocId = this.courseDocIds.get(course.generatedId);

          if (firebaseDocId != undefined) {
            const courseRef = doc(
              this.dbCourseService.db,
              `users/${userEmail}/courses`,
              firebaseDocId
            );
            await updateDoc(courseRef, {
              year: course.year,
              period: course.period,
            });
          }
        }
        // I have to run this function in a timeout because it was running before the courses were loaded from the database
        // and therefore the courseDocIds map was empty, and the firebaseDocId was undefined
        // this is not the best way and will have to be fixed, but it works for now.
        // Additionally, I hafe to run loadPlanFromDb() again to update the courses in the store and the UI
        this.getPrereqs();
        this.getComplexReqs();
        this.loadPlanFromDb();
      }, 2500);
    }
  }

  public getSemesters() {
    this.autoButtonClicked = false;
    return this.semesters;
  }

  public getPrereqs() {

    setTimeout(async () => {
      await this.getPreReqPointsFac();
      await this.getPreReqPointsDept();
    }, 3000);
  }

  public async getPreReqPointsFac() {
    const facultyLevelPoints: { [key: string]: number } = {};
  
    for (let e = 0; e < this.courseService.errors.length; e++) {
      if (
        this.courseService.errors[e].requirement.type === 0 &&
        this.courseService.errors[e].requirement.faculties
      ) {
        const faculty = this.courseService.errors[e].requirement.faculties[0];
        const level = this.courseService.errors[e].requirement.stage;
        const points = this.courseService.errors[e].requirement.required;
        const key = `${faculty}-${level}`;
        facultyLevelPoints[key] = Math.max(facultyLevelPoints[key] || 0, points);
      }
    }
  
    for (const key in facultyLevelPoints) {
      const [faculty, level] = key.split('-');
      const points = facultyLevelPoints[key];
      this.pointsCardFaculty = {
        faculty,
        level: parseInt(level),
        points,
        value: 15,
        generatedId: Math.floor(Math.random() * 100000),
      };
  
      let courseSelectFromLevel = 0;
      for (let i = 0; i < this.courseService.planned.length; i++) {
        if (
          this.courseService.planned[i].faculties[0] === faculty &&
          this.courseService.planned[i].stage === parseInt(level)
        ) {
          if (courseSelectFromLevel + this.courseService.planned[i].points <= points) {
            courseSelectFromLevel += 15;
          }
        }
      }
  
      // Determine the number of temp cards needed
      const numTempCards = Math.ceil((points - courseSelectFromLevel) / 15);
  
      // Initialize variables for tracking the current year and period
      let currentYear = Math.min(
        ...this.storeHelper.current('semesters').map((semester: any) => semester.year)
      );
      let currentPeriod = Math.min(
        ...this.storeHelper
          .current('semesters')
          .filter((semester: any) => semester.year === currentYear)
          .map((semester: any) => semester.period)
      );
  
      // Adjust the current year based on the level
      if (parseInt(level) === 2) {
        currentYear++;
      }
  
      // Iterate over the number of temp cards needed
      for (let i = 0; i < numTempCards; i++) {
        // Get the semester ID for the current year and period
        const semesterId = await this.getSemesterId(currentYear, currentPeriod);
        if (semesterId) {
          // Get the semester data for the current year and period
          const semesterData = this.getSemesterByYearAndPeriod(currentYear, currentPeriod);
          if (semesterData) {
            // Check if the semester has capacity for another course
            if (this.countCoursesInSemester(semesterData) < 4) {
              // Add the temp card to the semester
              await this.addTempCardToSemester(semesterId, this.pointsCardFaculty);
            } else {
              // Move to the next semester
              if (currentPeriod === Period.Two) {
                currentYear++;
                currentPeriod = Period.One;
              } else {
                currentPeriod = Period.Two;
              }
              i--; // Retry adding the temp card in the next semester
            }
          }
        }
      }
  
      // Process the data for the current faculty and level combination
      this.coursePreReqAutoFillFac = points / 15;
      this.coursePreReqAutoFillFac = Array.from(
        { length: this.coursePreReqAutoFillFac },
        (_, i) => i + 1
      );
    }
  }

public async getSemesterId(year: number, period: Period) {
  const colRef = collection(
    this.dbCourseService.db,
    `users/${this.authService.auth.currentUser!.email}/semester/`
  );
  const docSnap = await getDocs(colRef);
  for (const doc of docSnap.docs) {
    if (doc.data()["year"] === year && doc.data()["period"] === period) {
      return doc.id;
    }
  }

  return null;
}

private getSemesterByYearAndPeriod(year: number, period: Period) {
  return this.storeHelper.current('semesters').find(
    (semester: any) => semester.year === year && semester.period === period
  );
}

public async getPreReqPointsDept() {
  const departmentLevelPoints: { [key: string]: number } = {};

  for (let e = 0; e < this.courseService.errors.length; e++) {
    if (
      this.courseService.errors[e].requirement.type === 0 &&
      this.courseService.errors[e].requirement.departments
    ) {
      const department = this.courseService.errors[e].requirement.departments[0];
      const level = this.courseService.errors[e].requirement.stage;
      const points = this.courseService.errors[e].requirement.required;
      const key = `${department}-${level}`;
      departmentLevelPoints[key] = Math.max(departmentLevelPoints[key] || 0, points);
    }
  }

  for (const key in departmentLevelPoints) {
    const [department, level] = key.split('-');
    const points = departmentLevelPoints[key];
    this.pointsCardDepartment = {
      department,
      level: parseInt(level),
      points,
      value: 15,
      generatedId: Math.floor(Math.random() * 100000),
    };

    let courseSelectFromLevel = 0;
    for (let i = 0; i < this.courseService.planned.length; i++) {
      if (
        this.courseService.planned[i].department[0] === department &&
        this.courseService.planned[i].stage === parseInt(level)
      ) {
        if (courseSelectFromLevel + this.courseService.planned[i].points <= points) {
          courseSelectFromLevel += 15;
        }
      }
    }

    // Determine the number of temp cards needed
    const numTempCards = Math.ceil((points - courseSelectFromLevel) / 15);

    // Initialize variables for tracking the current year and period
    let currentYear = Math.min(
      ...this.storeHelper.current('semesters').map((semester: any) => semester.year)
    );
    let currentPeriod = Math.min(
      ...this.storeHelper
        .current('semesters')
        .filter((semester: any) => semester.year === currentYear)
        .map((semester: any) => semester.period)
    );

    // Adjust the current year based on the level
    if (parseInt(level) === 200) {
      currentYear++;
    }

    // Iterate over the number of temp cards needed
    for (let i = 0; i < numTempCards; i++) {
      // Get the semester ID for the current year and period
      const semesterId = await this.getSemesterId(currentYear, currentPeriod);
      if (semesterId) {
        // Get the semester data for the current year and period
        const semesterData = this.getSemesterByYearAndPeriod(currentYear, currentPeriod);
        if (semesterData) {
          // Check if the semester has capacity for another course
          if (this.countCoursesInSemester(semesterData) < 4) {
            // Add the temp card to the semester
            await this.addTempCardToSemester(semesterId, this.pointsCardDepartment);
          } else {
            // Move to the next semester
            if (currentPeriod === Period.Two) {
              currentYear++;
              currentPeriod = Period.One;
            } else {
              currentPeriod = Period.Two;
            }
            i--; // Retry adding the temp card in the next semester
          }
        }
      }
    }

    // Process the data for the current department and level combination
    this.coursePreReqAutoFillDept = points / 15;
    this.coursePreReqAutoFillDept = Array.from(
      { length: this.coursePreReqAutoFillDept },
      (_, i) => i + 1
    );
  }
}

  public getComplexReqs() {
    this.complexPreReqs = this.courseService.complexReqsForSamplePlan[0];
  }

  private addedCourseNames: Set<string> = new Set();

  public async getPreReqCourse() {
    for (const error of this.courseService.errors) {
      const requirement = error.requirement;

      if (
        requirement.type === 1 &&
        requirement.required === 1 &&
        !requirement.complex
      ) {
        const courseName = requirement.papers[0];
        const course = this.courseMap.get(courseName);
        if (!this.isCourseAlreadyAdded(course)) {
          if (course && !this.addedCourseNames.has(courseName)) {
            const { correctYear, correctPeriod } =
              this.findAvailableSemesterForPreReq(course, error);

            await this.courseService.setCourseDb(
              course,
              Math.floor(Math.random() * 100000),
              correctPeriod,
              correctYear
            );
            this.addedCourses++;
            this.addedCourseNames.add(courseName);
          } else {
            console.error(`Course not found or already added: ${courseName}`);
          }
        }
      }
    }
  }

  private isCourseAlreadyAdded(courseName: ICourse): boolean {
    return this.storeHelper
      .current('courses')
      .some((course: { name: string }) => course.name === courseName.name);
  }

  private findAvailableSemesterForPreReq(course: ICourse, error: Message) {
    const targetCourseName = error.name;
    const targetCourse = this.courseMap.get(targetCourseName);
    const targetCourseYear = this.selectedYear + (targetCourse?.stage || 0) - 1;

    for (let year = targetCourseYear - 1; year >= this.selectedYear; year--) {
      for (const period of [Period.One, Period.Two]) {
        if (this.countCoursesInSemester({ year, period }) < 4) {
          return { correctYear: year, correctPeriod: period };
        }
      }
    }
    // If no available semester found, return a default value or handle the error
    return { correctYear: this.selectedYear, correctPeriod: Period.One };
  }

  private countCoursesInSemester(semester: any) {
    const realCoursesCount = this.storeHelper
      .current('courses')
      .filter(
        (course: { year: any; period: any }) =>
          course.year === semester.year && course.period === semester.period
      ).length;
  
    const tempCardsCount = semester.tempCards ? semester.tempCards.length : 0;
  
    return realCoursesCount + tempCardsCount;
  }

  public async addTempCardToSemester(semesterId: string, tempCard: any) {
    try {
      const semesterRef = doc(
        this.dbCourseService.db,
        `users/${this.authService.auth.currentUser.email}/semester/${semesterId}`
      );
      await updateDoc(semesterRef, {
        tempCards: arrayUnion(tempCard),
      });
  
      // Retrieve the document data
      const docSnap = await getDoc(semesterRef);
      if (docSnap.exists()) {
        const semesterData = docSnap.data();
  
        // Update the local store
        const semester = this.storeHelper
          .current('semesters')
          .find((sem: any) => sem.both === semesterData["both"]);
  
        if (semester) {
          const tempCardExists = semester.tempCards.some(
            (card: any) => card.generatedId === tempCard.generatedId
          );
  
          if (!tempCardExists) {
            semester.tempCards.push(tempCard);
            this.storeHelper.update('semesters', this.semesters);
          }
        }
      }
    } catch (error) {
      console.error('Error adding temp card to semester:', error);
    }

  }

  public async getMajorRequirementPoints(department: string, level: number, requiredPoints: number): Promise<void> {
    const departmentLevelPoints: { [key: string]: number } = {};
    const key = `${department}-${level}`;
    departmentLevelPoints[key] = requiredPoints;
  
    for (const key in departmentLevelPoints) {
      const [department, levelStr] = key.split('-');
      const level = parseInt(levelStr);
      const points = departmentLevelPoints[key];
  
      const courses = this.courseService.allCourses.filter((course: { department?: string[]; stage: number; }) =>
        course.department && course.department[0] === department && course.stage >= level
      );
  
      let courseSelectFromLevel = 0;
      for (const course of courses) {
        if (this.courseService.planned.includes(course)) {
          if (courseSelectFromLevel + course.points <= points) {
            courseSelectFromLevel += course.points;
          }
        }
      }
  
      const numTempCards = Math.ceil((points - courseSelectFromLevel) / 15);
  
      // Wait for the semesters data to be available
      await new Promise<void>((resolve) => {
        const checkSemesters = () => {
          const semesters = this.storeHelper.current('semesters');
          if (semesters.length > 0) {
            resolve();
          } else {
            setTimeout(checkSemesters, 100); // Check again after a short delay
          }
        };
        checkSemesters();
      });
  
      let currentYear = Math.min(
        ...this.storeHelper.current('semesters').map((semester: any) => semester.year)
      );
      let currentPeriod = Math.min(
        ...this.storeHelper
          .current('semesters')
          .filter((semester: any) => semester.year === currentYear)
          .map((semester: any) => semester.period)
      );
  
      if (level >= 200) {
        currentYear += Math.floor((level - 100) / 100);
      }
  
      for (let i = 0; i < numTempCards; i++) {
        const semesterId = await this.getSemesterId(currentYear, currentPeriod);
        if (semesterId) {
          const semesterData = this.getSemesterByYearAndPeriod(currentYear, currentPeriod);
          if (semesterData) {
            if (this.countCoursesInSemester(semesterData) < 4) {
              await this.addTempCardToSemester(semesterId, {
                department,
                level,
                points: 15,
                value: 15,
                generatedId: Math.floor(Math.random() * 100000),
              });
            } else {
              if (currentPeriod === Period.Two) {
                currentYear++;
                currentPeriod = Period.One;
              } else {
                currentPeriod = Period.Two;
              }
              i--;
            }
          }
        }
      }
    }
    await this.sortTempCardsIntoYears();
  }

  private async sortTempCardsIntoYears() {
    const sortedTempCards: any[][] = [[], [], []]; // Adjust for more years if needed
  
    for (const semester of this.semesters) {
      for (const tempCard of semester.tempCards) {
        if (tempCard.level) {
          const yearIndex = Math.floor((tempCard.level - 1) / 1);
          if (yearIndex >= 0 && yearIndex < sortedTempCards.length) {
            sortedTempCards[yearIndex].push({ ...tempCard, originalSemester: semester });
          }
        }
      }
    }
    await this.distributeTempCardsAcrossSemesters(sortedTempCards);
    // Update the semesters in the database asynchronously
    this.updateSemestersInDatabase(this.semesters);
  }

  private async distributeTempCardsAcrossSemesters(sortedTempCards: any[][]): Promise<void> {
    const updatedSemesters = [...this.semesters];
  
    for (const [yearIndex, yearTempCards] of sortedTempCards.entries()) {
      let semesterIndex = 0; // Reset for each year
  
      for (const tempCard of yearTempCards) {
        const actualYear = this.year + yearIndex;
        const period = semesterIndex % 2 === 0 ? Period.One : Period.Two;
  
        const semester = updatedSemesters.find(
          (semester: any) => semester.year === actualYear && semester.period === period
        );
  
        if (semester) {
          // Remove the tempCard from its original semester
          const originalSemester = updatedSemesters.find(
            (semester: any) => semester.both === tempCard.originalSemester.both
          );
          if (originalSemester) {
            originalSemester.tempCards = originalSemester.tempCards.filter(
              (card: any) => card.generatedId !== tempCard.generatedId
            );
          }
  
          // Add the tempCard to the new semester
          semester.tempCards.push(tempCard);
        }
  
        semesterIndex++; // Increment for each tempCard
      }
    }
    // Update the local store with the updated semesters
    return new Promise<void>((resolve) => {
      this.storeHelper.update('semesters', updatedSemesters);
      resolve();
    });
  }

  private async updateSemestersInDatabase(semesters: any[]) {
    try {
      const batch = writeBatch(this.dbCourseService.db);
  
      for (const semester of semesters) {
        const semesterId = await this.getSemesterId(semester.year, semester.period);
        if (semesterId) {
          const semesterRef = doc(
            this.dbCourseService.db,
            `users/${this.authService.auth.currentUser.email}/semester/${semesterId}`
          );
  
          batch.update(semesterRef, {
            tempCards: semester.tempCards,
          });
        }
      }
  
      await batch.commit();
    } catch (error) {
      console.error('Error updating semesters in database:', error);
    }
  }

  
}
