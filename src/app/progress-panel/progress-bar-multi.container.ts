import { Component, Input, EventEmitter, ChangeDetectionStrategy } from "@angular/core";
import { Store } from "../app.store";
import { ICourse } from "../interfaces";
import { CourseStatus } from "../models";
import { RequirementService } from "../services";
import { IBarState } from "./progress-bar-multi.component";

@Component({
  selector: "progress-bar-multi-container",
  styleUrls: ['./progress-bar-multi.component.scss'],
  templateUrl: "progress-bar-multi.container.template.html",
  changeDetection: ChangeDetectionStrategy.OnPush // Needed to suppress after change error for now
})

/*
 This component is the container for a progressbar. It is responsible for configuing the progress bar
 with the data it needs.
 I did trial writing one container per progress bar e.g. progress-bar-total.container, progress-bar-level-three
 But this led to a lot of classes that were virtually identical.
 Therefore settled for a generic container, where the differences (title, etc) and course filter are passed in.
 Courses are updated byt subscribing to the courses observable on the store.

 TODO: tests
*/
export class ProgressBarMultiContainer {
  @Input() public requirement: any;
  @Input() public courses: any;
  @Input() public isComplex: boolean = false;
  @Input() public index: number = 0;
  @Input() public majIndex: number = 0;
  @Input() public isTotal: boolean = false;

  public hoverText: any;
  public hoverTextComplex: any;
  public max = 0;
  public title: any;
  public inactive: boolean = false;
  public barOneState: IBarState = { value: 0, color: "#66cc00" , full: false, index: 0, majIndex: 0, isTotal: false};
  public barTwoState: IBarState = { value: 0, color: "#f2d600" , full: false, index: 0, majIndex: 0, isTotal: false};
  public barThreeState: IBarState = { value: 0, color: "#66bbff" , full: false, index: 0, majIndex: 0, isTotal: false};
  public onPageChange = new EventEmitter<null>();
  public complexBool: boolean = false;
  public complexRule: any;
  public combinedRule: any= [];


  public isDisabled = false;

  public barOneStateComplex: any = [];
  public barTwoStateComplex: any = [];
  public barThreeStateComplex: any = [];

  constructor(
    private store: Store,
    private requirementService: RequirementService,
  ) {}

  public ngOnChanges() {
    this.updateState(this.courses);
  }

  public ngOnInit() {
    this.title = this.requirementService.shortTitle(this.requirement);
    this.hoverText = this.requirementService.toString(this.requirement, false);
    
    if (this.requirementService.isComplex(this.requirement)) {
      this.isComplex = true;
      this.complexRule = this.requirement.complex
      
      for (let i = 0; i < this.hoverText.length; i++)
      {
        this.combinedRule.push({
          rule: this.requirementService.toString(this.complexRule[i], false),
          complexMax: this.complexRule[i].required,
          hoverText: this.requirementService.toString(this.complexRule[i], false)
        })
        // this.max = this.combinedRule[i].complexMax
      }
  } else {
    this.max = this.requirement.required;
    this.isComplex = false;
  }
  }

  private updateState(courses: ICourse[]) {
    if (this.inactive) {
      return;
    }

    if (this.requirementService.isComplex(this.requirement)) {
      // for (let i = 0; i < this.requirement.complex.length; i++) {
      // this.barOneStateComplex.push(this.getComplexBarValue(
      //   this.barOneState,
      //   this.courses,
      //   CourseStatus.Completed,
      //   this.requirement.complex[i]
      // ));

      // this.barTwoStateComplex.push(this.getComplexBarValue(
      //   this.barTwoState,
      //   this.courses,
      //   CourseStatus.Enrolled,
      //   this.requirement.complex[i],
      // ));

      // this.barThreeStateComplex.push(this.getComplexBarValue(
      //   this.barThreeState,
      //   this.courses,
      //   CourseStatus.Planned,
      //   this.requirement.complex[i],
      // ));
      // }
      this.updateComplexBars(this.courses)
      
    } else {

    this.barOneState = this.getBarValue(
      this.barOneState,
      this.courses,
      CourseStatus.Completed
    );

    this.barTwoState = this.getBarValue(
      this.barTwoState,
      this.courses,
      CourseStatus.Enrolled
    );
    this.barThreeState = this.getBarValue(
      this.barThreeState,
      this.courses,
      CourseStatus.Planned
    );
  }
}

  private getBarValue(
    currentState: IBarState,
    courses: ICourse[],
    status: CourseStatus,
  ) {
    if (courses === undefined || courses.length === 0) {
      return Object.assign({}, currentState, { value: 0 });
    }
    if (this.requirementService.isComplex(this.requirement)) { // Check this code, its auto done so I don't know if it returns correct property
      const value = this.requirementService.fulfilledByStatus(
        this.requirement,
        courses,
        status
      );
      return Object.assign({}, currentState, { value });
    } else {
    const value = this.requirementService.fulfilledByStatus(
      this.requirement,
      courses,
      status
    );
    return Object.assign({}, currentState, { value });
    }
  }

  private getComplexBarValue(
    currentState: IBarState,
    courses: ICourse[],
    status: CourseStatus,
    requirement: any
  ) {
    const value = this.requirementService.fulfilledByStatus(
      requirement,
      courses,
      status
    );
    return Object.assign({}, currentState, { value });

  }

  public updateComplexBars(courses: ICourse[]) {

    this.barOneStateComplex = [],
    this.barTwoStateComplex = [],
    this.barThreeStateComplex = []

    for (let i = 0; i < this.requirement.complex.length; i++) {
      this.barOneStateComplex.push(this.getComplexBarValue(
        this.barOneState,
        this.courses,
        CourseStatus.Completed,
        this.requirement.complex[i]
      ));

      this.barTwoStateComplex.push(this.getComplexBarValue(
        this.barTwoState,
        this.courses,
        CourseStatus.Enrolled,
        this.requirement.complex[i],
      ));

      this.barThreeStateComplex.push(this.getComplexBarValue(
        this.barThreeState,
        this.courses,
        CourseStatus.Planned,
        this.requirement.complex[i],
      ));
      }
  }


  public expansionOnClick() {
    this.isDisabled = false;
    this.updateComplexBars(this.courses)
    return this.isDisabled;
  }

  public noExpansionOnClick() {
    this.isDisabled = true;
    return this.isDisabled;
  }

}
