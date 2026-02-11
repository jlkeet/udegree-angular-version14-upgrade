import {
  Component,
  EventEmitter,
  Input,
  Output
} from "@angular/core";
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
import { FirebaseDbService } from "../core/firebase.db.service";
import{ GoogleAnalyticsService } from '../services/google-analytics.service';
import { ProgressPanelService } from "../services/progress-panel.service";
import { AdminExportService } from "../services/admin-export.service";
import { pluck } from 'rxjs/operators';
import { SamplePlanService } from "../services/sample-plan.service";

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
  public filteredCourses: ICourse[][] = [];
  public semesterNotice = "";
  public semesterNoticeType: "ok" | "warning" = "ok";
  public loadingPlan = true;
  public loadPlanError = "";

  constructor(
    public courseService: CourseService,
    private courseEventService: CourseEventService,
    private store: Store,
    private storeHelper: StoreHelper,
    public authService: AuthService,
    private dbCourses: FirebaseDbService,
    public googleAnalyticsService: GoogleAnalyticsService,
    public progressPanelService: ProgressPanelService,
    public adminService: AdminExportService,
    public samplePlanService: SamplePlanService,
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
        (dbCoursesSavedArrayById: any[]) => {
          (this.dbCoursesSavedArrayById = dbCoursesSavedArrayById)}
      );

    this.courseCounter = this.courseService.courseCounter;
    this.selectedYear = 2024;
    this.selectedPeriod = Period.One;

    // this.authService.authState.subscribe(async (user: any) => {
    //   if (user && !this.planLoaded) {
    //     this.planLoaded = true;
    //     await this.courseService.loadPlanFromDb().then(() => {
    //       this.courseService.addSemesterFromDb().then(() => {
    //         this.updateFilteredCourses();
    //       });
    //     });
        

    //     this.authService.logInCounter++;
    //   } else if (!user) {
    //     this.planLoaded = false;
    //   }
    // });

    this.authService.authState.subscribe(async (user: any) => {
      if (user && !this.planLoaded) {
        await this.loadUserPlan();
      } else if (!user) {
        this.planLoaded = false;
        this.loadingPlan = false;
        this.loadPlanError = "";
      } else {
        this.loadingPlan = false;
      }
    });
    
  }

  public ngOnInit() {

  }

  public ngOnChanges(): void {

    this.courseService.syncSemestersWithPlannedCourses();
    this.courseService.nextSemesterCheck();
    
    if (this.samplePlanService.autoButtonClicked === true) {
      this.semesters = this.samplePlanService.getSemesters()
    }

    this.updateFilteredCourses();

  }

  public addSemester() {
    const added = this.courseService.newSemester();
    this.courseService.newSemEvent();

    if (!added) {
      this.semesterNoticeType = "warning";
      this.semesterNotice = "Couldn't add a new semester right now. Please try again.";
      return;
    }

    const latestSemester = this.getLatestSemester();
    this.semesterNoticeType = "ok";
    this.semesterNotice = latestSemester
      ? `Added ${latestSemester.year} ${this.formatPeriod(latestSemester.period)}.`
      : "Added a new semester.";
  }

  public async retryLoadPlan() {
    this.planLoaded = false;
    await this.loadUserPlan();
  }

  private filterCourses(year: number, period: Period) {
    this.courses = this.storeHelper.current("courses");
    return this.courses.filter(
      (course: ICourse) => course.year === year && course.period === period
    );
  }

  private updateFilteredCourses() {
    this.filteredCourses = this.semesters.map((semester) =>
      this.filterCourses(semester.year, semester.period)
    );
  }

  private async loadUserPlan() {
    this.loadingPlan = true;
    this.loadPlanError = "";

    try {
      this.planLoaded = true;
      await this.courseService.loadPlanFromDb();
      await this.courseService.addSemesterFromDb();
      this.courseService.syncSemestersWithPlannedCourses();
      this.updateFilteredCourses();

      this.authService.logInCounter++;
    } catch (error) {
      this.planLoaded = false;
      this.loadPlanError =
        "We couldn't load your saved plan right now. You can retry.";
      console.error("Error during loading plan or adding semester:", error);
    } finally {
      this.loadingPlan = false;
    }
  }

  private getLatestSemester(): { year: number; period: number } | null {
    if (!Array.isArray(this.semesters) || this.semesters.length === 0) {
      return null;
    }

    const sorted = [...this.semesters].sort((a, b) =>
      a.year === b.year ? a.period - b.period : a.year - b.year
    );

    const latest = sorted[sorted.length - 1];
    return { year: Number(latest.year), period: Number(latest.period) };
  }

  private formatPeriod(period: number): string {
    if (period === 0) {
      return "Summer School";
    }

    return `Semester ${period}`;
  }

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


// newSemEvent(){ 
//   this
//   .googleAnalyticsService
//   .eventEmitter("add_sem", "course-panel", "semester", "click", 10);
// } 

}
