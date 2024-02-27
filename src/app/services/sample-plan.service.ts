import { Injectable } from "@angular/core";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { StoreHelper } from "./store-helper";
import { AuthService } from "../core/auth.service";
import { CourseService } from "./courses";
import { FirebaseDbService } from "../core/firebase.db.service";
import { Message, Period } from "../models";
import { ProgressPanelService } from "./progress-panel.service";
import { ICourse } from "../interfaces";
import { updateDoc } from "@angular/fire/firestore";
import { RequirementService } from "./requirement.service";
import { NotificationListComponent } from "../common";

@Injectable()
export class SamplePlanService {
  public semesters: any = [];
  public selectedYear;
  public selectedPeriod;
  public addingSemester = false;
  public email: string = "";
  public period = 1;
  public year = 2024;

  public autoButtonClicked: boolean = false;
  public addedCourses = 0;

  public majReqs: any = [];
  public secondMajReqs: any = [];
  public thirdMajReqs: any = [];
  public pathwayReqs: any = [];
  public moduleReqs: any = [];
  public secondModuleReqs: any = [];

  public complexPreReqs: any = [];

  private courseMap: any;

  public coursePreReqAutoFillFac: any
  public coursePreReqAutoFillDep: any
  public courseSelectFromLevelDataFaculty = {
    faculty: "",
    level: 0,
    points: 0,
  }

  public courseSelectFromLevelDataDepartment = {
    department: "",
    level: 0,
    points: 0,
  }

  constructor(
    public authService: AuthService,
    public storeHelper: StoreHelper,
    public courseService: CourseService,
    public dbCourseService: FirebaseDbService,
    public progressPanelService: ProgressPanelService,

  ) {
    this.selectedYear = 2024;
    this.selectedPeriod = Period.One;
  }

  public getCourse() {
    return this.courseService.allCourses[377];
  }

  public setCourse() {
    this.autoButtonClicked = true;
    this.getEssentialCourses();
    this.complexCourses();
    
  }

  public async loadPlanFromDb() {
    const userRef = doc(this.dbCourseService.db, `users/${this.authService.auth.currentUser!.email}`);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const coursesCollectionRef = collection(userRef, "courses");
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
        this.storeHelper.findAndUpdate("courses", res);
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
          .getCollection("users", "courses", courseDbId)
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
            both: "",
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
            both: this.selectedYear + " " + this.selectedPeriod,
          })
      )
      .then(async () => {
        // Updates the period value withing the newSemesterFromDb variable
        if (this.canAddSemester(newSemesterFromDb)) {
          // Here is the rest of the code to execute within the chained then statements. So that it can occur within the promise
          this.semesters.push(newSemesterFromDb);
          this.semesters.sort((s1: { year: number; period: number; }, s2: { year: number; period: number; }) =>
            s1.year === s2.year ? s1.period - s2.period : s1.year - s2.year
          );
          // console.log(this.semesters)
          // this.dbCourses.addSelection(this.email, "semester", newSemesterFromDb, "semesters")
          this.storeHelper.update("semesters", this.semesters);
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
          "users",
          "courses",
          courseDbId
        );
        if (res && res["year"]) {
          return res["year"];
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
            .getCollection("users", "courses", courseDbId)
            .then((res) => {
              if (res) {
              resolve(res["period"]);
            }
            })
        ),
      };
    });
  }

  private canAddSemester(semester: { year: any; period: any; both?: string; }): boolean {
    return (
      this.semesters.filter(
        (s: { year: any; period: any; }) => s.year === semester.year && s.period === semester.period
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
            if (!allReqs[z][x].papers[0].includes("-")) {
              for (let paper of allReqs[z][x].papers) {
                // Use the map for constant time lookup
                if (this.courseMap.has(paper)) {
                  const existingCourse = this.storeHelper
                    .current("courses")
                    .find((course: { name: any; }) => course.name === paper);
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
          }
        }
      }
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
        if (allReqsComplex[z][i].papers[0].includes("-")) {
          const terms = allReqsComplex[z][i].papers[0].split(" ");
          shown = shown.filter((course: any) =>
            terms.some((term: string) => {
              const index = term.indexOf("-");
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
                  .current("courses")
                  .some((course: { name: string; }) => course.name === courseToAdd.name)
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
    if (this.storeHelper.current("courses").includes(course)) {
      return true;
    } else {
      return false;
    }
  }

  public async addNewSemester(year: number, period: Period) {
    let newSemester = {
      year: year,
      period: period,
      both: year + " " + period,
    }
    try {
      this.dbCourseService.addSelection(this.authService.auth.currentUser.email, "semester", newSemester, "semesters");
      this.storeHelper.add("semesters", newSemester);
      this.semesters = this.storeHelper.current("semesters");
    } catch (error) {
        console.error("Error adding new semester:", error);
    }
}

// Code for sorting courses into levels after they have been automatically added to the plan

private async sortCoursesIntoYears() {
  const sortedCourses: ICourse[][] = [[], [], []]; // Adjust for more years if needed

  for (const course of this.storeHelper.current("courses")) {
    const yearIndex = course.stage - 1; // As stage gives 1, 2, or 3
    if (yearIndex >= 0 && yearIndex < sortedCourses.length) {
      sortedCourses[yearIndex].push(course);
    }
  }

  this.distributeCoursesAcrossSemesters(sortedCourses);
  await this.updateCoursesInFirebase();
}

private distributeCoursesAcrossSemesters(sortedCourses: ICourse[][]) {
  this.year = 2024
  sortedCourses.forEach((yearCourses, yearIndex) => {
    let semesterIndex = 0; // Reset for each year

    yearCourses.forEach(course => {
      const actualYear = this.year + yearIndex;
      const period = (semesterIndex % 2 === 0) ? Period.One : Period.Two;

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

  this.storeHelper.update("courses", this.flattenCourses(sortedCourses));
  this.storeHelper.update("semesters", this.semesters);
}


private semesterExists(year: number, period: Period): boolean {
  return this.semesters.some((semester: { year: number; period: Period; }) => semester.year === year && semester.period === period);
}


private flattenCourses(sortedCourses: ICourse[][]): ICourse[] {
  return sortedCourses.reduce((acc, val) => acc.concat(val), []);
}

private async updateCoursesInFirebase() {
  const userEmail = this.authService.auth.currentUser.email;
  for (const course of this.storeHelper.current("courses")) {
    // console.log(course)
  setTimeout( async () => {
    if (course.generatedId) {
      const firebaseDocId = this.courseDocIds.get(course.generatedId);

      // console.log(firebaseDocId)

    if (firebaseDocId != undefined) {
    const courseRef = doc(this.dbCourseService.db, `users/${userEmail}/courses`, firebaseDocId);
    await updateDoc(courseRef, {
      year: course.year,
      period: course.period
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
}, 2500)
  }
}

public getSemesters() {
  this.autoButtonClicked = false;
  return this.semesters;
}

public getPrereqs() {
  // console.log(this.courseService.errors);
  // console.log(this.courseService.planned);
  this.getPreReqPointsFac();
  this.getPreReqPointsDept();
  this.getPreReqCourse();
}

public getPreReqPointsFac() {

  for (let e = 0; e < this.courseService.errors.length; e++) {
    if (this.courseService.errors[e].requirement.type === 0 && this.courseService.errors[e].requirement.faculties) {
       this.courseSelectFromLevelDataFaculty = {
        faculty: this.courseService.errors[e].requirement.faculties[0],
        level: this.courseService.errors[e].requirement.stage,
        points: this.courseService.errors[e].requirement.required,
      };

      let courseSelectFromLevel = 0;

      for (let i = 0; i < this.courseService.planned.length; i++) {
        if (this.courseService.planned[i].faculties[0] == this.courseSelectFromLevelDataFaculty.faculty && this.courseService.planned[i].stage == this.courseSelectFromLevelDataFaculty.level) {
          if (courseSelectFromLevel + this.courseService.planned[i].points <= this.courseSelectFromLevelDataFaculty.points) {
            courseSelectFromLevel += 15;
          } 
        }
      }

      // Process the data for the current error
      // console.log(this.courseSelectFromLevelData.points - courseSelectFromLevel);
      this.coursePreReqAutoFillFac = (this.courseSelectFromLevelDataFaculty.points - courseSelectFromLevel) / 15;
      this.coursePreReqAutoFillFac = Array.from({ length: this.coursePreReqAutoFillFac }, (_, i) => i + 1);
      // Now, coursePreReqAutoFill is specific to the current error
      // You might want to collect these results in an array or handle them as needed
      // this.processAutoFillForError(coursePreReqAutoFill, e); // Example function call
    }
  }
}

public getPreReqPointsDept() {

  for (let e = 0; e < this.courseService.errors.length; e++) {
    if (this.courseService.errors[e].requirement.type === 0 && this.courseService.errors[e].requirement.departments) {
       this.courseSelectFromLevelDataDepartment = {
        department: this.courseService.errors[e].requirement.departments[0],
        level: this.courseService.errors[e].requirement.stage,
        points: this.courseService.errors[e].requirement.required,
      };

      let courseSelectFromLevel = 0;

      for (let i = 0; i < this.courseService.planned.length; i++) {
        if (this.courseService.planned[i].faculties[0] == this.courseSelectFromLevelDataDepartment.department && this.courseService.planned[i].stage == this.courseSelectFromLevelDataDepartment.level) {
          if (courseSelectFromLevel + this.courseService.planned[i].points <= this.courseSelectFromLevelDataDepartment.points) {
            courseSelectFromLevel += 15;
          } 
        }
      }

      // Process the data for the current error
      // console.log(this.courseSelectFromLevelData.points - courseSelectFromLevel);
      this.coursePreReqAutoFillDep = (this.courseSelectFromLevelDataDepartment.points - courseSelectFromLevel) / 15;
      this.coursePreReqAutoFillDep = Array.from({ length: this.coursePreReqAutoFillDep }, (_, i) => i + 1);
      // Now, coursePreReqAutoFill is specific to the current error
      // You might want to collect these results in an array or handle them as needed
      // this.processAutoFillForError(coursePreReqAutoFill, e); // Example function call
    }
  }

}

public getComplexReqs() {
  this.complexPreReqs = this.courseService.complexReqsForSamplePlan[0]
}


public async getPreReqCourse() {
  // Map to hold the course references
  this.courseMap = new Map();


  for (let course of this.courseService.allCourses) {
    this.courseMap.set(course.name, course);
  }
  for (let e = 0; e < this.courseService.errors.length; e++) {
    const error = this.courseService.errors[e];
    const requirement = error.requirement;

    if (requirement.type === 1 && requirement.required === 1 && !requirement.complex) {
      const courseName = requirement.papers[0];
      const course = this.courseMap.get(courseName);

      if (!this.isCourseAlreadyAdded(course)) {
        const { correctYear, correctPeriod } = this.findAvailableSemesterForPreReq(course, error);

        await this.courseService.setCourseDb(
          course,
          Math.floor(Math.random() * 100000),
          correctPeriod,
          correctYear
        );
        this.addedCourses++;
      } else {
        console.error(`Course not found or already added: ${courseName}`);
      }
    }
  }
  // await this.loadPlanFromDb();
}

private isCourseAlreadyAdded(courseName: ICourse): boolean {
  return this.storeHelper.current("courses").some((course: { name: string }) => 
    course.name === courseName.name);
}


private findAvailableSemesterForPreReq(course: { stage: any; }, error: Message) {
    const targetCourseName = error.name; // Stage of prerequisite course
    const targetCourse = this.courseMap.get(targetCourseName);
    const requiredCourseName = error.requirement.papers[0];
    const requiredCourse = this.courseMap.get(requiredCourseName);
    if (!requiredCourse) {
      console.error(`Required course not found: ${requiredCourseName}`);
      return { correctYear: this.selectedYear, correctPeriod: Period.One }; // Default value or handle error
    }
  
    const targetCourseStage = targetCourse.stage; // Stage of the course that requires the prerequisite
    const prereqTargetYear = this.selectedYear + targetCourseStage - 1; // Assuming prerequisite should be taken one year before
    const semestersInTargetYear = this.semesters.filter((s: { year: number; }) => s.year === prereqTargetYear);
  
    let availableSemester = null;

  // Find a semester before the required course with space
  for (const semester of semestersInTargetYear) {
    if (semester.period < targetCourseStage && this.countCoursesInSemester(semester) < 4) {
      availableSemester = semester;
      break;
    }
  }

  // If no semester found in the target year, use the first available semester in the previous year
  if (!availableSemester) {
    availableSemester = this.findFirstAvailableSemester(prereqTargetYear - 1, course);
  }

  return { correctYear: availableSemester.year, correctPeriod: availableSemester.period };
}


private countCoursesInSemester(semester: { year: any; period: any; }) {
  return this.storeHelper.current("courses").filter((course: { year: any; period: any; }) => course.year === semester.year && course.period === semester.period).length;
}

private findFirstAvailableSemester(startYear: number, course: ICourse) {
  let year = startYear;
  while (year >= this.selectedYear - course.stage) {
    for (const period of [Period.One, Period.Two]) {
      if (this.countCoursesInSemester({ year, period }) <= 4) {
        return { year, period };
      }
    }
    year--;
  }
  // If no semester found, return a default value or handle the error
  return { year: this.selectedYear, period: Period.One };
}

}
