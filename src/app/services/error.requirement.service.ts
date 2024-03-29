import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { IRequirement } from ".";
import { StoreHelper } from "./store-helper";

@Injectable()
export class ErrorRequirementService {

    constructor(
        public storeHelper: StoreHelper,
        public router: Router,
    ) {

    }

    public getCourse(course: any) {
      let errorCourse = course.requirement[0]
      this.selectErrorRequirements(errorCourse)
    }

 public selectErrorRequirements(requirement: IRequirement): void {
    const stages = requirement.stage
    ? [requirement.stage]
    : requirement.aboveStage
    ? [...Array(4 - requirement.aboveStage).keys()]
        .map((n) => n + 1 + requirement.aboveStage!)
        .toString()
    : null;
  let newSem = this.storeHelper.current("semesters")
  let semester = newSem[newSem.length-1]
    newSem = this.storeHelper.current("semesters")
    semester = newSem[newSem.length-1]

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

public orNull(arg: any) {
    if (arg) {
      return arg;
    } else {
      return null;
    }
  }

}