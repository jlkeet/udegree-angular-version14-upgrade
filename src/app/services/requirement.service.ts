import { Injectable } from '@angular/core';
import { ICourse } from '../interfaces';
import { CourseStatus } from '../models';
import { RequirementType } from '../models/requirement.enum';
import { DepartmentService } from './department.service';
import { FacultyService } from './faculty.service';
import { CourseService } from './courses';

export interface IRequirement {
  type: RequirementType;
  required: number;
  papers?: string[];
  departments?: string[];
  faculties?: string[];
  pathways?: string[];
  modules?: string[];
  secondModules?: string[];
  conjoints?: string[];
  stage?: number;
  stages?: number[]; // combine with stage or abovestage?
  papersExcluded?: string[];
  departmentsExcluded?: string[];
  facultiesExcluded?: string[];
  isCorequesite?: boolean,
  aboveStage?: number;
  general?: boolean;
  futher?: boolean;
  flags?: any;
  complex?: IRequirement[];
}

/*
 * Currently doing a course multiple times isn't handled?
 * I'm not sure what the correct response would be anyway
 *
 * General schedule is slightly more complicated
 * Each paper either has a faculty or is open
 * But it might be fine just putting an open faculty
 *
 * This seems pretty verbose at the moment
 * Trying to make a good string for each type of requirement isn't straightforward
 */

@Injectable()
export class RequirementService {

  private i = 0;
  public complexRuleForPgBar = false;
  public requirements: any = [];

  constructor(
    private departmentService: DepartmentService,
    private facultyService: FacultyService,
    ) { }

  private intersection<T>(array1: T[], array2: T[]): T[] {
    if (array1 && array2) {
      return array1.filter((str: T) => array2.includes(str));
    } else {
      return [];
    }
  }

  /*
   * Some requirements give a range of papers like ANTHRO101-203,
   * This function tests whether 'checkIncluded' is in any of the reqs
   * Currently doesn't handle general papers because of the G at the end
   */
  public paperRangeIncludes(paperRange: string[], checkIncluded: string): boolean {
    for (const range of paperRange) {
      if (range.includes('-')) {
        const index = range.search(/[0-9]/);
        const dept = range.substring(0, index);
        const codes = range.substring(index);

        const index2 = checkIncluded.search(/[0-9]/);
        const dept2 = checkIncluded.substring(0, index2);
        const code2 = parseInt(checkIncluded.substring(index2), 10);

        const codeTerminals = codes.split('-'); // splits into start and end numbers
        if (dept === dept2 && code2 >= parseInt(codeTerminals[0], 10) && code2 <= parseInt(codeTerminals[1], 10)) {
          return true;
        }
      } else if (range === checkIncluded) {
        return true;
      }
    }
    return false;
  }

  public filterByRequirement(requirement: IRequirement, courses: ICourse[]): ICourse[] {
    let filtered = courses;
    /* Could refactor this further to just make an array of includes and excludes */

    if (requirement) {
    const filters = [
      {check: requirement.papers,
        filter: (course: ICourse) => this.paperRangeIncludes(requirement.papers!, course.name.toUpperCase())},
      {check: requirement.papersExcluded,
        filter: (course: ICourse) => !requirement.papersExcluded!.includes(course.name.toUpperCase())},
      {check: requirement.faculties,
        filter: (course: ICourse) => this.intersection(requirement.faculties!, course.faculties).length > 0},
      {check: requirement.facultiesExcluded,
        filter: (course: ICourse) => this.intersection(requirement.faculties!, course.faculties).length === 0},
      {check: requirement.departments,
        // filter: (course: ICourse) => requirement.departments.includes(course.department)},
        filter: (course: ICourse) => this.intersection(requirement.departments!, course.department).length > 0},
      {check: requirement.departmentsExcluded,
        filter: (course: ICourse) => course.faculties.toString() !== requirement.faculties![0]},
      {check: this.checkFlag(requirement, 'General'),
        // filter: (course: ICourse) => course.name.toUpperCase().substring(-1) === 'G'}, // -1 takes the last character

      filter: (course: ICourse) => course.name.toUpperCase().lastIndexOf("G") === course.name.length - 1}, // -1 takes the last character
      {check: requirement.stage,
        filter: (course: ICourse) => requirement.stage === course.stage},
      {check: requirement.stages,
        filter: (course: ICourse) => requirement.stages!.includes(course.stage!)},
      {check: requirement.aboveStage,
        filter: (course: ICourse) => requirement.aboveStage! < course.stage!},
    ].filter((filter) =>
      !(filter.check === undefined || filter.check === false ||
        filter.check === null));

    // apply each of the filters in 'filters'
    
    filters.forEach((filter) => { filtered = filtered.filter(filter.filter)});
  
    return filtered;
      }
      return [];
  }

  public requirementCheck(requirement: IRequirement, planned: ICourse[]) {
    if (this.isComplex(requirement)) {
      this.requirements = requirement.complex;

      let filled = requirement.complex!.map((subRequirement: IRequirement) => this.requirementFilled(subRequirement, planned))
        .filter((tested: boolean) => tested).length;

      return Math.min(filled, requirement.required);


    }  else {

      let mapped: (number | undefined)[] | undefined;
      const filtered = this.filterByRequirement(requirement,
        planned.filter((course: ICourse) => course.status !== CourseStatus.Failed));
      const depts = new Set<string>();

      // Come back to fix this

      // if (this.checkFlag(requirement, 'DifferentDepts')) {
      //   filtered.forEach((course: ICourse) => depts.add(course.department));
      //   return depts.size;
      // }

      // if (this.checkFlag(requirement, 'Further')) {
      //   filtered.forEach((course: ICourse) => depts.add(course.department));
      //   return depts.size;
      // }

      if (requirement.type === RequirementType.Points) {
        mapped = filtered.map((course: ICourse) => course.points);
      } else if (requirement.type === RequirementType.Papers) {
        mapped = filtered.map(() => 1);
      } else {
      }

      if (this.checkFlag(requirement, 'isCorequesite')) {
         mapped = filtered.map((course: ICourse) => 1);
       }

       if (this.checkFlag(requirement, 'total')) {
        mapped = filtered.map((course: ICourse) => course.points);
      }

       // Ugly code here, but essentially this first checks to see if the requirement is gen ed.
       // Then it filteres the gen ed paper(s) and checks to see if there's already another paper taken from
       // the same dept, if it does then it doesnt count toward the progress bar otherwise it does.


      //  if (this.checkFlag(requirement, "General")) {
      //    let j = 0;
      //   mapped = filtered.map((course: ICourse) => {
      //     for (let i = 0; i < planned.length; i++) {
      //       if (planned[i].department === course.department) {
      //         j++;
      //       }
      //     }
      //     if (j > 1) {
      //      return 0;
      //     } else {
      //      return 15;
      //     }
      //   });
      // }

      if (mapped) { 
        const total = mapped.reduce((num1: number | undefined, num2: number | undefined) => (num1 ?? 0) + (num2 ?? 0), 0);
        return total! > requirement.required ? requirement.required : total;
      }
    }
    return -1; // Check for errors, had to put this in to return a value to make code compile
  }

  // public requirementFilled(requirement: IRequirement, planned: ICourse[], course?: ICourse): boolean {
  //   if (this.isComplex(requirement)) {
  //     let filled = requirement.complex!.map((subRequirement: IRequirement) => this.requirementFilled(subRequirement, planned, course))
  //       .filter((tested: boolean) => tested).length;
  //    return filled >= requirement.required;
  //   }  else {
  //     return this.requirementCheck(requirement, planned) === requirement.required;
  //   }
  // }

public requirementFilled(requirement: IRequirement, planned: ICourse[], course?: ICourse): boolean {
  if (this.isComplex(requirement)) {
      for (let subRequirement of requirement.complex!) {
          // Check if it is a corequisite
          if (subRequirement.flags && subRequirement.flags.isCorequesite) {
              if (this.corequisiteCheck(subRequirement, planned, course)) {
                  return true; // Requirement fulfilled if any corequisite is fulfilled
              }
          } else {
              // Handle normal requirements
              if (this.requirementFilled(subRequirement, planned, course)) {
                  return true; // Requirement fulfilled if any sub-requirement is fulfilled
              }
          }
      }
      // If none of the sub-requirements are fulfilled
      return false;
  } else {
      return this.requirementCheck(requirement, planned) >= (requirement.required || 0);
  }
}


public corequisiteCheck(subRequirement: IRequirement, planned: ICourse[], course?: ICourse): boolean {
  for (let paper of subRequirement.papers) {
      // Find the plannedCourse for the current paper
      const plannedCourse = planned.find(coursePaper => coursePaper.name === paper);
      // If the plannedCourse exists and its period and year match those of the corequisite requirement
      // console.log(planned)
      if (plannedCourse && subRequirement.flags.isCorequesite &&
          plannedCourse.period === course.period && plannedCourse.year === course.year) {
          return true;
      }
  }
  return false;
}


  

  // need to rework this to deal with certain rules
  // e.g. 3 different subjects faiils if given two different statuses
  public fulfilledByStatus(requirement: IRequirement, planned: ICourse[], status: CourseStatus): number {
    const result = this.requirementCheck(requirement, planned.filter((course: ICourse) => course.status === status));
    return result !== undefined ? result : 0;
  }
  

  public shortTitle(requirement: IRequirement) {
    if (this.isComplex(requirement)) {
      return 'Complex Rule';
      // return this.toString(requirement, null)
    }

    if (requirement.papers !== undefined) {
      if (requirement.papers.length <= 4 &&
        requirement.papers.filter((paper: string) => paper.includes('-')).length === 0) {
         return requirement.required + (requirement.type === RequirementType.Points ? ' Points' : ' Courses') + ' From ' + requirement.papers.join(', ');
      } else {
        // Change this to reflect the hyphenated rule
        return requirement.required + (requirement.type === RequirementType.Points ? ' Points' : ' Courses') + ' From List (Click to see list)';
      }
    }

    // This kind of looks insane, but it's a reasonably obvious pattern
    const str = requirement.required +
      (this.checkFlag(requirement, "General") ? ' General Education Points'  : '') +
      (requirement.type === RequirementType.Points && this.checkFlag(requirement, 'General') === false ? ' Points' : '') +
      (requirement.type === RequirementType.Papers && this.checkFlag(requirement, 'General') === false ? ' Courses' : '') +
      (requirement.stage !== undefined ? ' ' + requirement.stage + '00-level' : '') +
      (requirement.aboveStage !== undefined ? ' above ' + requirement.aboveStage + '00-level' : '') +
      (requirement.departments !== undefined ? ' from ' + requirement.departments.join(', ') : '') +
      (requirement.departmentsExcluded !== undefined ? ' outside ' + requirement.departments!.join(', ') : '') +
      (this.checkFlag(requirement, 'DifferentDepts') ? ' of different subjects' : '') +
      (this.checkFlag(requirement, 'Further') ? ' from any subject' : '') +
      (this.checkFlag(requirement, 'Major') ? ' from major' : '') +
      (this.checkFlag(requirement, 'MajorOne') ? ' from first major' : '') +
      (this.checkFlag(requirement, 'MajorTwo') ? ' from second major' : '') +
      (this.checkFlag(requirement, 'isCorequesite') ? ' as a co-requesite' : '') +
      (this.checkFlag(requirement, 'total') ? ' Total' : '') +
      (requirement.faculties !== undefined && this.checkFlag(requirement, 'General') === false ? ' from ' + requirement.faculties.join(', ') : '') +
      (requirement.facultiesExcluded !== undefined ? ' outside ' + requirement.facultiesExcluded.join(', ') : '') +
      '';


      if (requirement.papers !== undefined) {
        const papers = requirement.papers as string[]; // cast the type to string[]
      
        if (papers.length === requirement.required) {
          return papers.join(', ');
        } else {
          return str + " from: " + papers.join(', ');
        }
      }
      
    return str;
  }

  public isComplex(requirement: IRequirement) {
    return requirement.hasOwnProperty('complex');
  }

  /*
   * This will require some testing with real requirements, there's may be weird sounding possible strings
   */
  public toString(requirement: IRequirement, omitRequires: boolean) {

    if (this.isComplex(requirement)) {
      let complexString = omitRequires ? '' : 'Requires ';
      let newComplexString: any = []
      if (requirement.required === requirement.complex!.length) {
        complexString = requirement.complex!.map((req: IRequirement) => this.toString(req, true)).join(' AND ');
      } else {
        if (requirement.required !== 1) {
          complexString += requirement.required + ' of: ';
        }

       complexString += requirement.complex!.map((req: IRequirement) => this.toString(req, true)).join('; OR ');
       newComplexString = requirement.complex!.map((req: IRequirement) => this.toString(req,true))

      }

    if (typeof newComplexString !== 'string') {
      return newComplexString;
    } else {
      return complexString;
    }
  }

    if (
      requirement.type === RequirementType.Papers &&
      requirement.papers !== undefined &&
      requirement.papers.length === requirement.required
    ) {
      if (this.checkFlag(requirement, "isCorequesite")) {
        return (
          (omitRequires ? "" : "Requires ") +
          requirement.papers.join(", ") +
          " as a co-requesite"
        );
      } else {
        return (
          (omitRequires ? "" : "Requires ") + requirement.papers.join(", ")
        );
      }
    }
    

    const str = (omitRequires ? '' : 'Requires ') + requirement.required +
      (requirement.type === RequirementType.Points ? ' points' : ' courses') +
      (requirement.papers !== undefined ? ' from ' + requirement.papers.join(', ') : '') +
      (requirement.papersExcluded !== undefined ? ' excluding ' + requirement.papersExcluded.join(', ') : '') +
      (requirement.stage !== undefined ? ' at ' + requirement.stage + '00-level' : '') +
      (requirement.aboveStage !== undefined ? ' above ' + requirement.aboveStage + '00-level' : '') +
      (requirement.departments !== undefined ? ' from ' + requirement.departments.join(', ') : '') +
      (requirement.departmentsExcluded !== undefined ? ' outside ' + requirement.departments!.join(', ') : '') +
      (this.checkFlag(requirement, 'DifferentDepts') ? ' of different subjects' : '') +
      (this.checkFlag(requirement, 'Further') ? ' from any subject' : '') +
      (this.checkFlag(requirement, 'Major') ? ' from major' : '') +
      (this.checkFlag(requirement, 'MajorOne') ? ' from first major' : '') +
      (this.checkFlag(requirement, 'MajorTwo') ? ' from second major' : '') +
      (this.checkFlag(requirement, 'total') ? ' Total' : '') +
      (requirement.faculties !== undefined ? ' from ' + requirement.faculties.join(', ') : '') +
      (requirement.facultiesExcluded !== undefined ? ' outside ' + requirement.facultiesExcluded.join(', ') : '') +
      (this.checkFlag(requirement, "General") ? ' General schedule' : '') + '';
    return str;
  }

  public checkFlag(requirement: IRequirement, flag: string) {
    return requirement.flags !== undefined && requirement.flags[0] === flag;

    // .map((str: string) => str.toLowerCase())
    // .includes(flag.toLowerCase());
  }

  public checkCoRequesiteFlag(requirement: IRequirement, flag: string): boolean {
      // console.log(requirement)
      if (requirement.flags !== undefined && requirement.flags.isCorequesite) {
        return true;
      } else {
        return false;
    }
  }
  

}
