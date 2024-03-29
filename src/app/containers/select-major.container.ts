import { Component } from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { Store } from '../app.store';
import { ICourse } from '../interfaces';
import { DepartmentService, FacultyService, ConjointService, PathwayService, ModuleService, StoreHelper } from '../services';
import { pluck } from 'rxjs/operators';

/*
  Container for select major page.
 */
@Component({
  selector: 'select-major-container',
  // TODO review styles -move all container styles to outlet?
  styles: [``],
  template: `
    <div class='full-page'>
      <div class='flex flex-row'>
        <progress-panel></progress-panel>
        <div class='flex flex-col flex-grow'>
          <department-list [departments]='departments' [faculty]='faculty'
          [allowsDoubleMajor]='allowsDoubleMajor' [allowsMinor]='allowsMinor'
          (deptClicked)='deptClicked($event)' [majors]='majors'></department-list>
        </div>
      </div>
    </div>
  `
})

export class SelectMajorContainer {
  public planned: ICourse[] = []; // required for the progress panel
  public majorSelected: boolean = false;
  public selected: ICourse = null as any;
  public departments: any[] = [];
  public faculty;
  public conjoint;
  public majors;
  public secondMajors;
  public thirdMajors;
  public pathways;
  public modules;
  public secondModules;
  public allowsMinor: boolean = false;
  public allowsDoubleMajor: boolean = false;
  public sub: any;

  constructor(
    public facultyService: FacultyService,
    public conjointService: ConjointService,
    public router: Router,
    public route: ActivatedRoute,
    public storeHelper: StoreHelper,
    public store: Store,
    public departmentService: DepartmentService
  ) {
    this.faculty = this.storeHelper.current('faculty');
    this.majors = this.storeHelper.current('majors');
    this.conjoint = this.storeHelper.current('conjoint');
    this.secondMajors = this.storeHelper.current('secondMajors')
    this.thirdMajors = this.storeHelper.current('secondMajors')
    this.pathways = this.storeHelper.current('pathways')
    this.modules = this.storeHelper.current('modules')
    this.secondModules = this.storeHelper.current('secondModules')
    this.allowsDoubleMajor = this.facultyService.allowsDoubleMajor(this.faculty);
    this.allowsMinor = this.facultyService.allowsMinor(this.faculty);
    this.departments = this.departmentService.departmentsInFaculty(this.faculty);

  }

  public deptClicked(event: any) {
    this.storeHelper.update('majorSelected', true);
    this.storeHelper.update('majors', event.majors);
    // this.storeHelper.update('secondMajors', event.secondMajors);
    this.storeHelper.update('minor', event.minor);
  }

  public ngOnInit() {
    this.sub = this.store.changes.pipe(pluck('courses')).subscribe((courses: ICourse[]) => this.planned = courses);
  }

  public ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
