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

  private normaliseTextValues(rawValues: any): string[] {
    const flattened: any[] = [];
    (Array.isArray(rawValues) ? rawValues : [rawValues]).forEach((value: any) => {
      if (Array.isArray(value)) {
        flattened.push(...value);
        return;
      }
      flattened.push(value);
    });

    const normalised = flattened
      .map((value: any) => {
        if (typeof value === "string") {
          return value;
        }

        if (typeof value === "number") {
          return String(value);
        }

        if (value && typeof value === "object") {
          if (typeof value.department === "string") {
            return value.department;
          }
          if (typeof value.faculty === "string") {
            return value.faculty;
          }
          if (typeof value.code === "string") {
            return value.code;
          }
          if (typeof value.name === "string") {
            return value.name;
          }
          if (typeof value.value === "string") {
            return value.value;
          }
          if (typeof value.label === "string") {
            return value.label;
          }
        }

        return null;
      })
      .filter((value: string | null): value is string => !!value)
      .map((value: string) => value.trim().toUpperCase())
      .filter((value: string) => value.length > 0);

    return Array.from(new Set(normalised));
  }

  private hasNormalisedIntersection(left: any, right: any): boolean {
    const leftValues = this.normaliseTextValues(left);
    const rightValues = this.normaliseTextValues(right);
    if (leftValues.length === 0 || rightValues.length === 0) {
      return false;
    }

    const rightSet = new Set(rightValues);
    return leftValues.some((value: string) => rightSet.has(value));
  }

  private hasActiveTextList(values: any): boolean {
    return this.normaliseTextValues(values).length > 0;
  }

  private hasActiveStages(stages: any): boolean {
    return (
      Array.isArray(stages) &&
      stages.some(
        (stage: any) => typeof stage === "number" && Number.isFinite(stage) && stage > 0
      )
    );
  }

  private courseStages(course: ICourse): number[] {
    const explicitStage =
      typeof course?.stage === "number" && course.stage > 0 ? [course.stage] : [];
    const tempCardStages = Array.isArray(course?.tempCardStages)
      ? course.tempCardStages.filter(
          (stage: number) => typeof stage === "number" && stage > 0
        )
      : [];

    return Array.from(new Set(explicitStage.concat(tempCardStages)));
  }

  private tempCardCandidateStages(course: ICourse): number[] {
    if (!Array.isArray(course?.tempCardStages)) {
      return [];
    }

    return Array.from(
      new Set(
        course.tempCardStages.filter(
          (stage: number) => typeof stage === "number" && stage > 0
        )
      )
    );
  }

  private matchesStageRequirement(course: ICourse, requiredStage: number): boolean {
    const stages = this.courseStages(course);
    if (stages.length === 0) {
      return false;
    }

    const tempCardStages = this.tempCardCandidateStages(course);
    if (tempCardStages.length > 0) {
      // A selection card only counts for strict stage requirements when every allowed
      // stage on that card satisfies the requirement.
      return tempCardStages.every((stage: number) => stage === requiredStage);
    }

    return stages.includes(requiredStage);
  }

  private matchesStagesRequirement(course: ICourse, requiredStages: number[]): boolean {
    const stages = this.courseStages(course);
    if (stages.length === 0) {
      return false;
    }

    const allowedStages = new Set(
      requiredStages.filter((stage: number) => typeof stage === "number" && stage > 0)
    );
    if (allowedStages.size === 0) {
      return false;
    }

    const tempCardStages = this.tempCardCandidateStages(course);
    if (tempCardStages.length > 0) {
      return tempCardStages.every((stage: number) => allowedStages.has(stage));
    }

    return stages.some((stage: number) => allowedStages.has(stage));
  }

  private matchesAboveStageRequirement(course: ICourse, aboveStage: number): boolean {
    const stages = this.courseStages(course);
    if (stages.length === 0) {
      return false;
    }

    const tempCardStages = this.tempCardCandidateStages(course);
    if (tempCardStages.length > 0) {
      return tempCardStages.every((stage: number) => stage > aboveStage);
    }

    return stages.some((stage: number) => stage > aboveStage);
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
	      {check: this.hasActiveTextList(requirement.papers),
	        filter: (course: ICourse) => this.paperRangeIncludes(requirement.papers!, (course.name || "").toUpperCase())},
	      {check: this.hasActiveTextList(requirement.papersExcluded),
	        filter: (course: ICourse) => !requirement.papersExcluded!.includes((course.name || "").toUpperCase())},
	      {check: this.hasActiveTextList(requirement.faculties),
	        filter: (course: ICourse) => this.hasNormalisedIntersection(requirement.faculties, course.faculties)},
	      {check: this.hasActiveTextList(requirement.facultiesExcluded),
	        filter: (course: ICourse) => !this.hasNormalisedIntersection(requirement.facultiesExcluded, course.faculties)},
	      {check: this.hasActiveTextList(requirement.departments),
	        // filter: (course: ICourse) => requirement.departments.includes(course.department)},
	        filter: (course: ICourse) => this.hasNormalisedIntersection(requirement.departments, course.department)},
	      {check: this.hasActiveTextList(requirement.departmentsExcluded),
	        filter: (course: ICourse) => !this.hasNormalisedIntersection(requirement.departmentsExcluded, course.department)},
	      {check: this.checkFlag(requirement, 'General'),
	        // filter: (course: ICourse) => course.name.toUpperCase().substring(-1) === 'G'}, // -1 takes the last character

	      filter: (course: ICourse) => {
	        const courseName = (course.name || "").toUpperCase();
	        return courseName.lastIndexOf("G") === courseName.length - 1;
	      }}, // -1 takes the last character
	      {check: typeof requirement.stage === "number" && requirement.stage > 0,
	        filter: (course: ICourse) => this.matchesStageRequirement(course, requirement.stage!)},
	      {check: this.hasActiveStages(requirement.stages),
	        filter: (course: ICourse) => this.matchesStagesRequirement(course, requirement.stages!)},
	      {check: typeof requirement.aboveStage === "number" && Number.isFinite(requirement.aboveStage),
	        filter: (course: ICourse) => this.matchesAboveStageRequirement(course, requirement.aboveStage!)},
	    ].filter((filter) =>
	      !(filter.check === undefined || filter.check === false ||
	        filter.check === null));

    // apply each of the filters in 'filters'
    
    filters.forEach((filter) => { filtered = filtered.filter(filter.filter)});
  
    return filtered;
      }
      return [];
  }

  public requirementCheck(requirement: IRequirement | undefined | null, planned: ICourse[]) {
    if (!requirement) {
      return 0;
    }

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

  public requirementFilled(requirement: IRequirement | undefined | null, planned: ICourse[], course?: ICourse): boolean {
    if (!requirement) {
      return false;
    }

    if (this.isComplex(requirement)) {
        const subRequirements = requirement.complex || [];
        const requiredCount = requirement.required !== undefined
          ? requirement.required
          : subRequirements.length;
        let filled = 0;

        for (let subRequirement of subRequirements) {
            // check if it is a corequisite
            if (this.checkCoRequesiteFlag(subRequirement, "isCorequesite")) {
                filled += this.corequisiteCheck(subRequirement, planned, course) ? 1 : 0;
            } else {
                // handle normal requirements
                filled += this.requirementFilled(subRequirement, planned, course) ? 1 : 0;
            }

            if (filled >= requiredCount) {
              return true;
            }
        }

        return filled >= requiredCount;
    } else {
        return this.requirementCheck(requirement, planned) === requirement.required;
    }
}


public corequisiteCheck(subRequirement: IRequirement, planned: ICourse[], course?: ICourse): boolean {
  if (!subRequirement || !subRequirement.papers || !course) {
    return false;
  }

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
  public fulfilledByStatus(requirement: IRequirement | undefined | null, planned: ICourse[], status: CourseStatus): number {
    if (!requirement) {
      return 0;
    }

    const result = this.requirementCheck(requirement, planned.filter((course: ICourse) => course.status === status));
    return result !== undefined ? result : 0;
  }
  

  public shortTitle(requirement: IRequirement | undefined | null) {
    if (!requirement) {
      return "";
    }

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

  public isComplex(requirement: IRequirement | undefined | null) {
    return !!requirement && Object.prototype.hasOwnProperty.call(requirement, 'complex');
  }

  /*
   * This will require some testing with real requirements, there's may be weird sounding possible strings
   */
  public toString(requirement: IRequirement | undefined | null, omitRequires: boolean): string {
    if (!requirement) {
      return "";
    }

    if (this.isComplex(requirement)) {
      const subRules = requirement.complex || [];
      const requiredCount = requirement.required !== undefined
        ? requirement.required
        : subRules.length;
      const prefix = omitRequires ? '' : 'Requires ';

      if (subRules.length === 0) {
        return prefix.trim();
      }

      const rendered: string[] = subRules.map((req: IRequirement) => this.toString(req, true));

      if (requiredCount >= subRules.length) {
        return prefix + rendered.join(' AND ');
      }

      if (requiredCount === 1) {
        return prefix + 'one of: ' + rendered.join('; OR ');
      }

      return prefix + requiredCount + ' of: ' + rendered.join('; OR ');
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

  public checkFlag(requirement: IRequirement | undefined | null, flag: string) {
    if (!requirement || requirement.flags === undefined || requirement.flags === null) {
      return false;
    }

    const flagLower = flag.toLowerCase();

    if (Array.isArray(requirement.flags)) {
      return requirement.flags.some(
        (entry: any) =>
          typeof entry === "string" && entry.toLowerCase() === flagLower
      );
    }

    if (typeof requirement.flags === "object") {
      return Object.keys(requirement.flags).some((key: string) => {
        if (key.toLowerCase() !== flagLower) {
          return false;
        }
        return Boolean(requirement.flags[key]);
      });
    }

    if (typeof requirement.flags === "string") {
      return requirement.flags.toLowerCase() === flagLower;
    }

    return false;

    // .map((str: string) => str.toLowerCase())
    // .includes(flag.toLowerCase());
  }

  public checkCoRequesiteFlag(requirement: IRequirement | undefined | null, flag: string): boolean {
      // console.log(requirement)
      if (requirement && requirement.flags !== undefined && requirement.flags.isCorequesite) {
        return true;
      } else {
        return false;
    }
  }
  

}
