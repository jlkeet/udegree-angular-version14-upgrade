import {
  Component,
  EventEmitter,
  Output,
  ViewEncapsulation,
} from "@angular/core";
import { collection, doc, getDocs, deleteDoc } from "firebase/firestore";
import {
  ActivatedRoute,
  NavigationExtras,
  Router,
} from "@angular/router";
import { Store } from "../app.store";
import { ICourse } from "../interfaces";
import {
  CourseStatus
} from "../models";
import {
  CourseService,
  DepartmentService,
  FacultyService,
  IRequirement,
  LocationRef,
  ModuleService,
  RequirementService,
  StoreHelper,
} from "../services";
import { DegreeSelection } from "../select-major";
import { FirebaseDbService } from "../core/firebase.db.service";
import { UserContainer } from "../common";
// import { ProgressBarMulti } from "./progress-bar-multi.component";
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ProgressDialogComponent } from "./progress-dialog.component";
import { GoogleAnalyticsService } from "../services/google-analytics.service";
import { ProgressPanelService } from "../services/progress-panel.service";
import { AdminExportService } from "../services/admin-export.service";
import { pluck } from 'rxjs/operators';
import { AuthService } from "../core/auth.service";

/*
  Component for displaying a group of progress bars
*/

@Component({
  host: {
    style: "flex: 0 0 auto;",
  },
  selector: "progress-panel",
  styleUrls: ["./progress-panel.component.scss"],
  templateUrl: "./progress-panel.template.html",
  encapsulation: ViewEncapsulation.None,
})
export class ProgressPanel {
  @Output() public onPageChange = new EventEmitter<null>();

  public courses: ICourse[] = [];
  public majorIsSelected: boolean = false;
  public secondMajorIsSelected: boolean = false;
  public thirdMajorIsSelected: boolean = false;
  public requirements: IRequirement[] = [];
  public conjointRequirements: any;
  public majorRequirements: IRequirement[] = [];
  public secondMajorRequirements: IRequirement[] = [];
  public thirdMajorRequirements: IRequirement[] = [];
  public pathwayRequirements: IRequirement[] = [];
  public moduleRequirements: IRequirement[] = [];
  public secondModuleRequirements: IRequirement[] = [];
  public gpa: any;

  public addingModule = false;
  public addedModule = false;
  public addingSecondModule = false;
  public addedSecondModule = false;
  public addingDegree = false;
  public addedDegree = false;
  public addingMajor = false;
  public addedMajor = false;
  public addingPathway = false;
  public addedPathway = false;
  public addingConjoint = false;
  public addedConjoint = false;
  public addingSecondMajor = false;
  public addedSecondMajor = false;
  public addingThirdMajor = false;
  public addedThirdMajor = false;
  public requiresPathway = false;
  

  public faculty: any;
  public conjoint: any;
  public majors: any;
  public majorsList: any = [];
  public secondMajors: any;
  public secondMajorsList: any = [];
  public thirdMajors: any;
  public thirdMajorsList: any = [];
  public pathways: any;
  public pathwaysList: any = [];
  public modules: any;
  public faculties: any;
  public conjoints: any = [];
  public modulesList;
  public secondModules: any;
  public secondModulesList;
  public minor: any;
  public subs: any;
  public currentFaculties;
  public currentConjoints;
  public currentMajors;
  public currentSecondMajors;
  public currentThirdMajors;
  public currentPathways;
  public currentModules;
  public currentSecondModules;

  public firstSemester: any = null;

  public deleteId: any;
  public email: any;

  public collectionList = ["module", "secondModule"];
  public storeList = ["modules", "secondModules"];
  public isDisabled: boolean = false;
  public isComplex: boolean = false;
  
  public fullyPlanned: any;

  constructor(
    public location: LocationRef,
    public route: ActivatedRoute,
    public router: Router,
    public store: Store,
    public storeHelper: StoreHelper,
    public requirementService: RequirementService,
    public degreeSelect: DegreeSelection,
    public moduleService: ModuleService,
    public dbCourses: FirebaseDbService,
    public userService: UserContainer,
    public departmentService: DepartmentService,
    public facultyService: FacultyService,
    public dialog: MatDialog,
    public courseService: CourseService,
    public googleAnalyticsService: GoogleAnalyticsService,
    public progressPanelService: ProgressPanelService,
    public adminService: AdminExportService,
    public authService: AuthService,
  ) {
    this.currentPathways = degreeSelect.currentPathways;
    this.pathwaysList = degreeSelect.pathways;
    this.currentMajors = degreeSelect.currentMajors;
    this.majorsList = degreeSelect.majors;
    // this.faculties = degreeSelect.faculties;
    this.currentFaculties = degreeSelect.currentFaculties;
    this.conjoints = degreeSelect.conjoints;
    this.currentConjoints = degreeSelect.currentConjoint;
    this.secondMajorsList = degreeSelect.currentSecondMajors;
    this.currentSecondMajors = degreeSelect.currentSecondMajors;
    this.thirdMajorsList = degreeSelect.currentThirdMajors;
    this.currentThirdMajors = degreeSelect.currentThirdMajors;
    this.currentModules = degreeSelect.currentModules;
    this.modulesList = degreeSelect.modules;
    this.currentSecondModules = degreeSelect.currentSecondModules;
    this.secondModulesList = degreeSelect.secondModules;
    // this.isComplex = progressMulti.isComplex
  }

  public ngOnInit() {
    this.adminService.getAuthState();

    this.subs = [
      this.store.changes.pipe(pluck("faculty")).subscribe((faculty: any) => {
        this.faculty = faculty;
        this.updateRequirementList();
      }),

      this.store.changes.pipe(pluck("conjoint")).subscribe((conjoint: any) => {
        this.conjoint = conjoint;
        this.updateRequirementList();
      }),

      this.store.changes.pipe(pluck("majors")).subscribe((majors: any) => {
        this.majors = majors;
        this.updateRequirementList();
      }),

      this.store.changes.pipe(pluck("pathways")).subscribe((pathways: any) => {
        this.pathways = pathways;
        this.updateRequirementList();
      }),

      this.store.changes.pipe(pluck("secondMajors")).subscribe((secondMajors: any) => {
        this.secondMajors = secondMajors;
        this.updateRequirementList();
      }),

      this.store.changes.pipe(pluck("thirdMajors")).subscribe((thirdMajors: any) => {
        this.thirdMajors = thirdMajors;
        this.updateRequirementList();
      }),

      this.store.changes.pipe(pluck("minor")).subscribe((minor: any) => {
        this.minor = minor;
        this.updateRequirementList();
      }),

      this.store.changes.pipe(pluck("courses")).subscribe((courses: ICourse[]) => {
        this.courses = courses;
        this.calculateGPA();
      }),

      this.store.changes.pipe(pluck("modules")).subscribe((modules: any) => {
        this.modules = modules;
        this.updateRequirementList();
      }),

      this.store.changes.pipe(pluck("secondModules")).subscribe((secondModules: any) => {
        this.secondModules = secondModules;
        this.updateRequirementList();
      }),

      this.store.changes.pipe(pluck("semesters")).subscribe((semesters: any[]) => {
        const allSemesters = semesters;
        if (allSemesters.length > 0) {
          this.firstSemester = allSemesters[0];
        } else {
          this.firstSemester = null;
        }
      }),
    ];
  }

  public ngOnChanges() {
    this.calculateGPA();
  }
  

  public ngOnDestroy() {
    this.subs.forEach((sub: { unsubscribe: () => any; }) => sub.unsubscribe());
  }

  //TESTING: Am only attempting single Major at this time as array not working in degree select.
  // Have commented out the major[0] for now will but will come back for it later.

  public updateRequirementList() {
    const toRequirementArray = (requirements: any): IRequirement[] =>
      Array.isArray(requirements)
        ? requirements.filter((requirement: IRequirement | null | undefined) => !!requirement)
        : [];

    this.requirements = toRequirementArray(
      this.faculty ? this.faculty.majorRequirements : []
    );

    this.conjointRequirements = toRequirementArray(
      this.conjoint
        ? this.majors
          ? this.conjoint.majorRequirements
          : this.conjoint.doubleMajorRequirements
        : []
    );

    if (this.conjoint && this.faculty) {
        if (this.faculty.conjointTotal[0].required >= this.conjoint.conjointTotal[0].required) {
          this.conjointRequirements.push(this.faculty.conjointTotal[0])
        } else {
          this.conjointRequirements.push(this.conjoint.conjointTotal[0])
      }
  }


    if (this.conjointRequirements.length > 0) {
      this.requirements = toRequirementArray(
        this.faculty && this.majors ? this.faculty.doubleMajorRequirements : []
      );
    }

    this.majorRequirements = toRequirementArray(
      this.majors ? this.majors.requirements : []
    );
    if (this.storeHelper.current('pathways') !== undefined) {
      this.pathwayRequirements = toRequirementArray(
        this.pathways ? this.pathways.requirements : []
      );
    } else {
      this.pathwayRequirements = [];
    }

    this.secondMajorRequirements = toRequirementArray(
      this.secondMajors ? this.secondMajors.requirements : []
    );

    this.thirdMajorRequirements = [];
    if (this.storeHelper.current('conjoint') && this.secondMajors && this.thirdMajors) {
      if (this.storeHelper.current('conjoint') !== undefined) {
        this.thirdMajorRequirements = toRequirementArray(
          this.thirdMajors.conjointRequirements
        );
      }
    }

    // this.thirdMajorRequirements = [].concat(
    //   this.thirdMajors ? this.thirdMajors.requirements : []
    // );

    //  .concat(this.minor ? this.minor.requirements : []);

    this.moduleRequirements = toRequirementArray(
      this.modules ? this.modules.requirements : []
    );

    this.secondModuleRequirements = toRequirementArray(
      this.secondModules ? this.secondModules.requirements : []
    );

    this.progressPanelService.setReqs(this.requirements)
    this.progressPanelService.setMajReqs(this.majorRequirements)
    this.progressPanelService.setSecondMajReqs(this.secondMajorRequirements)
    this.progressPanelService.setThirdMajReqs(this.thirdMajorRequirements)
    this.progressPanelService.setPathwayReqs(this.pathwayRequirements)
    this.progressPanelService.setModuleReqs(this.moduleRequirements)
    this.progressPanelService.setSecondModuleReqs(this.secondModuleRequirements)

  }

  public navigateToSelectMajor() {
    const navigationExtras: NavigationExtras = {
      fragment: this.location.location.hash.toString(),
    };

    this.router.navigate(["/major"], navigationExtras);
  }

  public isAlreadySelected(
    alreadyCounted: ICourse[],
    course: ICourse
  ): boolean {
    // check to see if same subject already selected
    const found = alreadyCounted.find(
      (c: ICourse) => c.name.indexOf(course.name.substr(0, 4)) !== -1
    );

    return found !== undefined;
  }

  public async deleteDegree() {
    this.email = this.authService?.auth?.currentUser?.email;

    let collectionList = [
      "degree",
      "conjoint",
      "major",
      "pathway",
      "secondMajor",
      "thirdMajor",
      "module",
      "secondModule",
    ];
    let storeList = [
      "faculty",
      "conjoint",
      "majors",
      "pathways",
      "secondMajors",
      "thirdMajors",
      "modules",
      "secondModules",
    ];

    for (let i = 0; i < collectionList.length; i++) {
      const userCollectionRef = collection(this.dbCourses.db, `users/${this.email}/${collectionList[i]}`);
      const snapshot = await getDocs(userCollectionRef);
    
      if (snapshot.docs.length > 0) {
        snapshot.forEach((ref) => {
          this.deleteId = ref.id;
          this.storeHelper.update(storeList[i], null);
    
          const docRef = doc(this.dbCourses.db, `users/${this.email}/${collectionList[i]}/${this.deleteId}`);
          deleteDoc(docRef);
        });
      }
    }
    this.addingDegree = false;
    this.addedDegree = false;
    this.addingMajor = false;
    this.addedMajor = false;
    this.currentFaculties[0] = null;
    this.currentMajors[0] = null;
    if (this.email) {
      this.adminService.setExportStatus(0, this.email).catch((error: any) => {
        console.error("Failed to update export status:", error);
      });
    }
    // this.dbCourses.setAuditLogDeleteDegree()
  }

  public async deleteMajor() {
    this.email = this.authService.auth.currentUser.email;

    let collectionList = [
      "degree",
      "conjoint",
      "major",
      "pathway",
      "secondMajor",
      "thirdMajor",

    ];
    let storeList = [
      "faculty",
      "conjoint",
      "majors",
      "pathways",
      "secondMajors",
      "thirdMajors",
    ];
    for (let i = 0; i < collectionList.length; i++) {
      const userCollectionRef = collection(this.dbCourses.db, `users/${this.email}/${collectionList[i]}`);
      const snapshot = await getDocs(userCollectionRef);
    
      if (snapshot.docs.length > 0) {
        snapshot.forEach((ref) => {
          this.deleteId = ref.id;
          this.storeHelper.update(storeList[i], null);
    
          const docRef = doc(this.dbCourses.db, `users/${this.email}/${collectionList[i]}/${this.deleteId}`);
          deleteDoc(docRef);
        });
      }
    }
    this.addingMajor = false;
    this.addedMajor = false;
    this.currentMajors[0] = null;
    // this.dbCourses.setAuditLogDeleteMajor()
  }

  public async deletePathway() {
    this.email = this.authService.auth.currentUser.email;

    let collectionList = [
      "pathway",
    ];
    let storeList = [
      "pathways",
    ];
    for (let i = 0; i < collectionList.length; i++) {
      const userCollectionRef = collection(this.dbCourses.db, `users/${this.email}/${collectionList[i]}`);
      const snapshot = await getDocs(userCollectionRef);
    
      if (snapshot.docs.length > 0) {
        snapshot.forEach((ref) => {
          this.deleteId = ref.id;
          this.storeHelper.update(storeList[i], null);
    
          const docRef = doc(this.dbCourses.db, `users/${this.email}/${collectionList[i]}/${this.deleteId}`);
          deleteDoc(docRef);
        });
      }
    }
    this.addingPathway = false;
    this.addedPathway = false;
    this.currentPathways[0] = null;
    this.deleteMajor();
  }

  public async deleteConjoint() {
    this.email = this.authService.auth.currentUser.email;

    let collectionList = [
      "conjoint",
    ];
    let storeList = [
      "conjoint",
    ];
    for (let i = 0; i < collectionList.length; i++) {
      const userCollectionRef = collection(this.dbCourses.db, `users/${this.email}/${collectionList[i]}`);
      const snapshot = await getDocs(userCollectionRef);
    
      if (snapshot.docs.length > 0) {
        snapshot.forEach((ref) => {
          this.deleteId = ref.id;
          this.storeHelper.update(storeList[i], null);
    
          const docRef = doc(this.dbCourses.db, `users/${this.email}/${collectionList[i]}/${this.deleteId}`);
          deleteDoc(docRef);
        });
      }
    }
    this.addingConjoint = false;
    this.addedConjoint = false;
    this.currentConjoints[0] = null;
    this.deleteSecondMajor();
    this.deleteThirdMajor();
    // this.dbCourses.setAuditLogDeleteConjoint()
  }


  public async deleteSecondMajor() {
    this.email = this.authService.auth.currentUser.email;

    let collectionList = [
      "secondMajor",
    ];
    let storeList = [
      "secondMajors",
    ];
    for (let i = 0; i < collectionList.length; i++) {
      const userCollectionRef = collection(this.dbCourses.db, `users/${this.email}/${collectionList[i]}`);
      const snapshot = await getDocs(userCollectionRef);
    
      if (snapshot.docs.length > 0) {
        snapshot.forEach((ref) => {
          this.deleteId = ref.id;
          this.storeHelper.update(storeList[i], null);
    
          const docRef = doc(this.dbCourses.db, `users/${this.email}/${collectionList[i]}/${this.deleteId}`);
          deleteDoc(docRef);
        });
      }
    }
    this.addingSecondMajor = false;
    this.addedSecondMajor = false;
    this.currentSecondMajors[0] = null;
  }

  public async deleteThirdMajor() {
    this.email = this.authService.auth.currentUser.email;

    let collectionList = [
      "thirdMajor",
    ];
    let storeList = [
      "thirdMajors",
    ];
    for (let i = 0; i < collectionList.length; i++) {
      const userCollectionRef = collection(this.dbCourses.db, `users/${this.email}/${collectionList[i]}`);
      const snapshot = await getDocs(userCollectionRef);
    
      if (snapshot.docs.length > 0) {
        snapshot.forEach((ref) => {
          this.deleteId = ref.id;
          this.storeHelper.update(storeList[i], null);
    
          const docRef = doc(this.dbCourses.db, `users/${this.email}/${collectionList[i]}/${this.deleteId}`);
          deleteDoc(docRef);
        });
      }
    }
    this.addingThirdMajor = false;
    this.addedThirdMajor = false;
    this.currentThirdMajors[0] = null;
  }

  public async deleteModule() {
    this.email = this.authService.auth.currentUser.email;

    let collectionList = [
      "module",
    ];
    let storeList = [
      "modules",
    ];
    for (let i = 0; i < collectionList.length; i++) {
      const userCollectionRef = collection(this.dbCourses.db, `users/${this.email}/${collectionList[i]}`);
      const snapshot = await getDocs(userCollectionRef);
    
      if (snapshot.docs.length > 0) {
        snapshot.forEach((ref) => {
          this.deleteId = ref.id;
          this.storeHelper.update(storeList[i], null);
    
          const docRef = doc(this.dbCourses.db, `users/${this.email}/${collectionList[i]}/${this.deleteId}`);
          deleteDoc(docRef);
        });
      }
    }
    this.addingModule = false;
    this.addedModule = false;
    this.currentModules[0] = null;
    this.degreeSelect.getFilteredModules();
  }

  public async deleteSecondModule() {
    this.email = this.authService.auth.currentUser.email;

    let collectionList = [
      "secondModule",
    ];
    let storeList = [
      "secondModules",
    ];
    for (let i = 0; i < collectionList.length; i++) {
      for (let i = 0; i < collectionList.length; i++) {
        const userCollectionRef = collection(this.dbCourses.db, `users/${this.email}/${collectionList[i]}`);
        const snapshot = await getDocs(userCollectionRef);
      
        if (snapshot.docs.length > 0) {
          snapshot.forEach((ref) => {
            this.deleteId = ref.id;
            this.storeHelper.update(storeList[i], null);
      
            const docRef = doc(this.dbCourses.db, `users/${this.email}/${collectionList[i]}/${this.deleteId}`);
            deleteDoc(docRef);
          });
        }
      }
    }
    this.addingSecondModule = false;
    this.addedSecondModule = false;
    this.currentSecondModules[0] = null;
   this.degreeSelect.getFilteredSecondModules();
  }

  public yearAndPeriod(): any {
    const period = Number(this.route.snapshot.queryParams["period"]);
    const year = Number(this.route.snapshot.queryParams["year"]);
    if (!period) {
      if (this.firstSemester !== null) {
        return {
          period: this.firstSemester.period,
          year: this.firstSemester.year,
        };
      } else {
        return null;
      }
    } else {
      return { period, year };
    }
  }

  public selectRequirements(requirement: any): void {

    const stages = requirement.stage
      ? [requirement.stage]
      : requirement.aboveStage
      ? [...Array(4 - requirement.aboveStage).keys()]
          .map((n) => n + 1 + requirement.aboveStage)
          .toString()
      : null;
    let newSem = this.storeHelper.current("semesters")
    let semester = newSem[newSem.length-1]
    if (semester === undefined) {
      this.courseService.newSemester()
      newSem = this.storeHelper.current("semesters")
      semester = newSem[newSem.length-1]
    }

    const queryParams = {
      departments: requirement.departments
        ? requirement.departments.length !== 0
          ? requirement.departments.toString()
          : null
        : null,
      faculties: requirement.faculties
        ? requirement.faculties.length !== 0
          ? requirement.faculties.toString()
          : null
        : null,
      conjoints: requirement.conjoints
        ? requirement.conjoints.length !== 0
          ? requirement.conjoints.toString()
          : null
        : null,
      pathways: requirement.pathways
        ? requirement.pathways.length !== 0
          ? requirement.pathways.toString()
          : null
        : null,
      modules: requirement.modules
        ? requirement.modules.length !== 0
          ? requirement.modules.toString()
          : null
        : null,
      secondModules: requirement.secondModules
        ? requirement.secondModules.length !== 0
          ? requirement.secondModules.toString()
          : null
        : null,
      general:
        requirement.flags && requirement.flags.includes("General")
          ? true
          : null,
      // further:
      //   requirement.flags && requirement.flags.includes("further")
      //     ? true
      //       : null,
      
      period: semester.period,
      searchTerm: this.orNull(
        requirement.papers ? requirement.papers.toString() : null
      ),
      stage: stages,
      year: semester.year,
    };

    
    if (requirement.complex !== undefined) {
  } else {
    this.router.navigate(["/add"], { queryParams });
  }
}

  public orNull(arg: string) {
    if (arg) {
      return arg;
    } else {
      return null;
    }
  }

  public changeFaculty(which: any, event: { value: { name: any; }; }) {
    this.degreeSelect.changeFaculty(which, event);
    const userEmail = this.authService?.auth?.currentUser?.email;
    if (userEmail) {
      this.adminService.setExportStatus(1, userEmail).catch((error: any) => {
        console.error("Failed to update export status:", error);
      });
    }
    // this.dbCourses.setAuditLogDegree(event.value.name)
  }

  public changeMajor(which: any, event: { value: { name: any; }; }) {
    this.degreeSelect.changeMajor(which, event);
    // this.dbCourses.setAuditLogMajor(event.value.name)
  }

  public changePathway(which: any, event: { value: { name: any; }; }) {
    this.degreeSelect.changePathway(which, event);
    // this.dbCourses.setAuditLogPathway(event.value.name)
  }

  public changeConjoint(which: any, event: { value: { name: any; }; }) {
    this.degreeSelect.changeConjoint(which, event);
    // this.dbCourses.setAuditLogConjoint(event.value.name)
  }

  public changeSecondMajor(which: any, event: { value: { name: any; }; }) {
    this.degreeSelect.changeSecondMajor(which, event);
    // this.dbCourses.setAuditLogSecondMajor(event.value.name)
  }

  public changeThirdMajor(which: any, event: { value: { name: any; }; }) {
    this.degreeSelect.changeThirdMajor(which, event);
    // this.dbCourses.setAuditLogThirdMajor(event.value.name)
  }

  public changeModule(which: any, event: { value: { name: any; }; }) {
    this.degreeSelect.changeModule(which, event);
    // this.dbCourses.setAuditLogModule(event.value.name)
  }

  public changeSecondModule(which: any, event: { value: { name: any; }; }) {
    this.degreeSelect.changeSecondModule(which, event);
    // this.dbCourses.setAuditLogSecondModule(event.value.name)
  }

  public calculateGPA() {
    const courseGrades = this.courses
      .filter(
        (course: ICourse) =>
          course.status === CourseStatus.Completed &&
          course.grade !== undefined &&
          course.grade !== -42
      )
      .map((course: ICourse) => (course.grade ?? 0) < 0 ? 0 : (course.grade ?? 0));
    const failed = this.courses.filter(
      (course: ICourse) => course.status === CourseStatus.Failed
    ).length;
    this.gpa =
      courseGrades.reduce((gradeTotal, grade) => gradeTotal + grade, 0) /
      (courseGrades.length + failed);
  }
  
  public pathwayCheck(value: { name: any; }) {

    for (let i = 0; i < this.degreeSelect.pathways.length; i++) {
      if (this.degreeSelect.pathways[0][i].value.faculties.includes(value.name)) {
        this.requiresPathway = true;
        this.addedMajor = false;
      }
    }
  }

  public pathwayClicked(value: any) {
    this.addingPathway = true;
  }

  public moduleClicked() {
   this.addingModule = true;
    this.modulesList = this.degreeSelect.modules;
    for (let i = this.modulesList[0].length - 1; i > 0; i--) {
      if (!this.modulesList[0][i].value.faculties.includes(this.faculty.name)) {
        this.modulesList.splice(i, 1);
      }
      if (
        this.modulesList[0][i].value.name === this.modules.name ||
        this.modulesList[0][i].value.name === this.secondModules.name
      ) {
        this.modulesList.splice(i, 2);
      }
    }
  }

  public secondModuleClicked() {
    this.addingSecondModule = true;
     this.secondModulesList = this.degreeSelect.secondModules;
     for (let i = this.secondModulesList[0].length - 1; i > 0; i--) {
       if (!this.secondModulesList[0][i].value.faculties.includes(this.faculty.name)) {
         this.secondModulesList.splice(i, 1);
       }
       if (
         this.secondModulesList[0][i].value.name === this.modules.name ||
         this.secondModulesList[0][i].value.name === this.secondModules.name
       ) {
         this.secondModulesList.splice(i, 2);
       }
     }
   }

  public pathwayFilter() {
    for (let i = this.degreeSelect.pathways.length[0] - 1; i >= 0; i--) {
      if (!this.degreeSelect.pathways[0][i].value.faculties.includes(this.currentMajors[0].name)) 
      {
      this.degreeSelect.pathways[0].splice([i], 1);

      }
    }
  }

  public expansionOnClick() {
    this.isDisabled = false;
    return this.isDisabled;
  }

  public noExpansionOnClick() {
    this.isDisabled = true;
    return this.isDisabled;
  }

  public openDialog(degSelectId: any) {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;

    dialogConfig.data = {
      id: degSelectId,
  };
  
    const dialogRef = this.dialog.open(ProgressDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(
      (        data: any) => console.log("Dialog output:", data)
    );    
}

newDegreeEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("add_deg", "progress-panel", "degree", "click", 10);
} 

newMajorEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("add_maj", "progress-panel", "major", "click", 10);
} 

newConjointEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("add_con", "progress-panel", "conjoint", "click", 10);
} 

newSecondMajorEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("add_secondMaj", "progress-panel", "second_major", "click", 10);
} 



newPGDegreeEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("pg_deg", "progress-panel", "degree", "click", 10);
} 


newPGMajorEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("pg_majpr", "progress-panel", "major", "click", 10);
} 


newPGSecondMajorEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("pg_secondMaj", "progress-panel", "secondMajor", "click", 10);
} 


newPGConjointEvent(){ 
  this
  .googleAnalyticsService
  .eventEmitter("pg_conjoint", "progress-panel", "conjoint", "click", 10);
}

}
