import {
  Component,
  EventEmitter,
  Injectable,
  Input,
  Output,
} from '@angular/core';
import { ICourse } from '../interfaces';
import { CourseStatus } from '../models';
import { DepartmentService, FacultyService, RequirementService, ConjointService, CourseService } from '../services';
import { AppHeader } from '../app.header.component';
import { GoogleAnalyticsService } from '../services/google-analytics.service';

/*
    Component for filtering a list of courses by eligibility / search term
    TODO: split into smaller components
 */
@Component({
  selector: 'course-filter',
  styleUrls: ['./course-filter.component.scss'],
  templateUrl: './course-filter.template.html'
})

@Injectable()
export class CourseFilter {
  @Output() public toggleChange = new EventEmitter();
  @Output() public searchChange = new EventEmitter();

  @Input() public courses: ICourse[] = [];
  @Input() public planned: ICourse[] = [];
  @Input() public filterParams: any;

  public panelOpenStateFaculty = false;
  public panelOpenStateDepartment = false;
  public panelOpenStateCampus = false;
  public panelOpenStateStage = false;
  public loading = false;

  public initialDataLoaded: boolean = false;

  public facultyChoices: any[] = [];
  public conjointChoices: any[] = [];
  public departmentChoices: any[] = [];
  public campusChoices = [
    {value: 'City', label: 'City'},
    {value: 'Tamaki', label: 'Tamaki'},
    {value: 'Grafton', label: 'Grafton'},
    {value: 'Newmarket', label: 'Newmarket'},
    {value: 'Epsom', label: 'Epsom'},
  ];

  public plannedNames: string[] = [];
  public stageChoices = [
    {value: 1, label: '100'},
    {value: 2, label: '200'},
    {value: 3, label: '300'},
    {value: 4, label: '400+'}
  ];

  constructor(
    private departmentService: DepartmentService,
    private facultyService: FacultyService,
    private requirementService: RequirementService,
    private conjointService: ConjointService,
    private courseService: CourseService,
    public appHeader: AppHeader,
    public googleAnalyticsService: GoogleAnalyticsService
  ) { }

  public async ngOnInit() {
    this.departmentChoices = this.departmentService.departments;

    this.departmentChoices = this.departmentChoices.map((department) => {
        return { value: department.name, label: department.name };
      });

    this.facultyChoices = this.facultyService.faculties;

    this.facultyChoices = this.facultyChoices.map((faculty) => {
        return { value: faculty.name, label: faculty.name };
      });

  this.conjointChoices = this.conjointService.conjoints;

  this.conjointChoices.map((conjoint: any) => {
    return { value: conjoint.name, label: conjoint.name };
  });

}

  public ngOnChanges() {
    this.plannedNames = this.planned.filter((course: ICourse) => course.status !== CourseStatus.Failed)
      .map((course: ICourse) => course.name);
    this.onChange(null, null, null);
  }

  public onChange(event?: any, whichSwitch?: any, noUpdate?: any) {

    // let shown = this.courses;
    let shown = this.courseService.allCourses;
    // console.log(shown)
    const flags: any = [];
    const modules = this.filterParams.modules;
    if (this.filterParams.ineligible) {
      shown = shown.filter((course: ICourse) => course.canAdd);
    }
    if (this.filterParams.general) {
      flags['General'] = true;
      shown = shown.filter((course: ICourse) => course.general);

    }
    if (this.filterParams.hidePlanned) {
      shown = shown.filter((course: ICourse) => !this.plannedNames.includes(course.name));
    }

   if (event) {
    if (event.checked === true) {
    switch (whichSwitch) {
      case 'faculty':
        this.filterParams.faculties.push(event.source.value)
        break;
      case 'department':
        this.filterParams.departments.push(event.source.value)
        break;
      // case 'campus':
      //   this.filterParams.campus.push(event.source.value)
      // case 'stage':
      //   this.filterParams.stages.push(event.source.value)
    }  

    } else {

      switch (whichSwitch) {
        case 'faculty':
          let i = this.filterParams.faculties.indexOf(event.source.value);
          this.filterParams.faculties.splice(i, 1);
          break;
        case 'department':
          let j = this.filterParams.departments.indexOf(event.source.value);
          this.filterParams.departments.splice(j, 1);
          break;
        // case 'campus':
        //   let k = this.filterParams.campus.indexOf(event.source.value);
        //   this.filterParams.campus.splice(k, 1);
        // case 'stage':
        //   let l = this.filterParams.stages.indexOf(event.source.value);
        //   this.filterParams.stages.splice(l, 1);
    }
  }
}

    const requirement = {
      departments: this.filterParams.departments.length !== 0 ? this.toArray(this.filterParams.departments) : null,
      faculties: this.filterParams.faculties.length !== 0 ? this.toArray(this.filterParams.faculties)  : null,
      flags,
      required: 0,
      stages: this.filterParams.stage.length !== 0 ? this.toArray(this.filterParams.stage).map((n: any) => Number(n)) : null,
      type: 0
    };
    shown = this.requirementService.filterByRequirement(requirement, shown);
    // This has grown too much, try to simplify
    if (this.filterParams.searchTerm !== '' && this.filterParams.searchTerm !== null) {
      let terms = [this.filterParams.searchTerm];
      if (this.filterParams.searchTerm.includes(',')) {
        terms = this.filterParams.searchTerm.split(',').map((term: string) => term.trim());
      }
      shown = shown.filter((course: ICourse) =>
        terms.filter((term: string) => {
          const index = term.indexOf('-');
          if (index > 3) {
            const lower = Number(term.substring(index - 3, index));
            const num = Number(course.name.substring(index - 3, index));
            const upper = Number(term.substring(index + 1, index + 4));
            return num <= upper && num >= lower &&
            course.name.substring(0, index - 4).toLowerCase() ===
              term.substring(0, index - 4).toLowerCase();
          } else {
            return course.name.toLowerCase().includes(term.toLowerCase());
          }
        })
        .length > 0);
    }
    this.toggleChange.emit({
      noUpdate,
      shown,
      modules
    });
  }

  private toArray(arg: any) {
    if (!arg) {
      return [];
    }
    if (arg.constructor === Array) {
      return arg;
    }
    return arg.split(',');
  }

  public clearAll() {
    this.loading = true;
    this.ngOnInit();
    this.filterParams.corequesite = null;
    this.filterParams.departments = [];
    this.filterParams.faculties = [];
    this.filterParams.general = null;
    this.filterParams.hidePlanned = null;
    this.filterParams.ineligible = null;
    this.filterParams.searchTerm = "";
    this.filterParams.stage = [];
    
    setTimeout(() => {     
      this.loading = false; }, 600 )
  
  }

  public collapseAll() {
    this.panelOpenStateFaculty = false;
    this.panelOpenStateDepartment = false;
    this.panelOpenStateCampus = false;
    this.panelOpenStateStage = false;
  }


  newFacultyFilterEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("faculty_filter", "course-filter", "filter", "click", 10);
  } 

  newDepartmentFilterEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("department_filter", "course-filter", "filter", "click", 10);
  } 

  newCampusFilterEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("campus_filter", "course-filter", "filter", "click", 10);
  } 

  newStageFilterEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("stage", "course-filter", "filter", "click", 10);
  } 

  newEligibleFilterEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("eligible_filter", "course-filter", "filter", "click", 10);
  } 

  newGeneralFilterEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("general_filter", "course-filter", "filter", "click", 10);
  } 

  newPlannedFilterEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("planned_filter", "course-filter", "filter", "click", 10);
  } 

  newSearchFilterEvent(){ 
    this
    .googleAnalyticsService
    .eventEmitter("search_filter", "course-filter", "filter", "click", 10);
  } 

  
}
