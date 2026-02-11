import { Injectable } from "@angular/core";
import { AuthService } from "../core/auth.service";
import { ICourse } from "../interfaces";
import { CourseStatus, Period } from "../models";
import { RequirementType } from "../models/requirement.enum";
import { FirebaseDbService } from "../core/firebase.db.service";
import { CourseService } from "./courses";
import { ProgressPanelService } from "./progress-panel.service";
import { IRequirement, RequirementService } from "./requirement.service";
import { StoreHelper } from "./store-helper";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "@angular/fire/firestore";

interface IRequirementEntry {
  requirement: IRequirement;
  sourcePriority: number;
  specificity: number;
  candidateCount: number;
  index: number;
}

interface ITempCard {
  paper: string | null;
  points: number;
  value: number;
  generatedId: number;
  department: string | null;
  departments?: string[] | null;
  faculty: string | null;
  faculties?: string[] | null;
  level: number | null;
  stages?: number[] | null;
  general?: boolean;
  autoRequirementKey?: string;
}

export type SamplePlanRunStatus = "ok" | "warning" | "error";

export interface ISamplePlanResult {
  status: SamplePlanRunStatus;
  message: string;
  addedCourses: number;
  totalCourses: number;
  addedSemesters: number;
}

@Injectable()
export class SamplePlanService {
  private readonly maxCoursesPerSemester = 4;
  private readonly planningWindowSemesters = 120;

  public autoButtonClicked = false;
  public semesters: any[] = [];
  public complexPreReqs: any = { complex: [] };

  private planningSnapshot: ICourse[] = [];
  private planningAnchorYear = new Date().getFullYear();
  private planningAnchorPeriod: Period = Period.One;
  private planningInProgress = false;

  constructor(
    public authService: AuthService,
    public storeHelper: StoreHelper,
    public courseService: CourseService,
    public dbCourseService: FirebaseDbService,
    public progressPanelService: ProgressPanelService,
    public requirementService: RequirementService
  ) {}

  public async setCourse(): Promise<ISamplePlanResult> {
    if (this.planningInProgress) {
      return this.buildResult(
        "warning",
        "Auto-plan is already running. Please wait."
      );
    }

    if (
      !Array.isArray(this.courseService.allCourses) ||
      this.courseService.allCourses.length === 0
    ) {
      return this.buildResult(
        "warning",
        "Course catalogue is still loading. Try DO IT FOR ME again in a moment."
      );
    }

    this.planningInProgress = true;
    this.autoButtonClicked = true;

    try {
      this.initialisePlanningState();
      const beforeCourseCount = this.planningSnapshot.length;
      const beforeTempCardCount = this.countTotalTempCards();
      const beforeSemesterCount = (
        this.storeHelper.current("semesters") || []
      ).length;
      const requirements = this.collectRequirementList();
      if (requirements.length === 0) {
        this.courseService.updateErrors();
        this.semesters = this.getSemesters();
        return this.buildResult(
          "warning",
          "Select a degree and major first, then try DO IT FOR ME again."
        );
      }

      // Iterate multiple times because solving one rule can unlock another.
      for (let pass = 0; pass < 3; pass++) {
        const before = this.planningSnapshot.length;

        for (const requirement of requirements) {
          await this.fulfilRequirement(requirement);
        }

        if (this.planningSnapshot.length === before) {
          break;
        }
      }

      this.courseService.updateErrors();
      const complexRequirements = Array.isArray(
        this.courseService.complexReqsForSamplePlan
      )
        ? this.courseService.complexReqsForSamplePlan
        : [];
      this.complexPreReqs = complexRequirements[0] || { complex: [] };
      this.semesters = this.getSemesters();
      const afterSemesterCount = (
        this.storeHelper.current("semesters") || []
      ).length;
      const afterTempCardCount = this.countTotalTempCards();
      const addedCourses = Math.max(
        0,
        this.planningSnapshot.length - beforeCourseCount
      );
      const addedSemesters = Math.max(0, afterSemesterCount - beforeSemesterCount);
      const addedTempCards = Math.max(0, afterTempCardCount - beforeTempCardCount);
      if (addedCourses === 0) {
        if (addedTempCards > 0) {
          const tempCardLabel = addedTempCards === 1 ? "selection card" : "selection cards";
          return this.buildResult(
            "ok",
            `Added ${addedTempCards} course ${tempCardLabel}.`,
            0,
            addedSemesters
          );
        }

        return this.buildResult(
          "warning",
          "No new courses were added. Your current plan may already satisfy the selected requirements.",
          0,
          addedSemesters
        );
      }

      const courseLabel = addedCourses === 1 ? "course" : "courses";
      const semesterSuffix =
        addedSemesters > 0
          ? ` across ${addedSemesters} new ${
              addedSemesters === 1 ? "semester" : "semesters"
            }`
          : "";
      const tempCardSuffix =
        addedTempCards > 0
          ? ` and ${addedTempCards} course selection ${
              addedTempCards === 1 ? "card" : "cards"
            }`
          : "";

      return this.buildResult(
        "ok",
        `Added ${addedCourses} ${courseLabel}${semesterSuffix}${tempCardSuffix}.`,
        addedCourses,
        addedSemesters
      );
    } catch (error) {
      console.error("Sample plan generation failed:", error);
      return this.buildResult(
        "error",
        "Something went wrong while generating your plan. Please try again."
      );
    } finally {
      this.planningInProgress = false;
    }
  }

  public getSemesters() {
    this.autoButtonClicked = false;
    this.semesters = this.storeHelper.current("semesters") || [];
    return this.semesters;
  }

  private buildResult(
    status: SamplePlanRunStatus,
    message: string,
    addedCourses: number = 0,
    addedSemesters: number = 0
  ): ISamplePlanResult {
    const totalCourses = ((this.storeHelper.current("courses") || []) as ICourse[])
      .length;

    return {
      status,
      message,
      addedCourses,
      totalCourses,
      addedSemesters,
    };
  }

  private collectRequirementList(): IRequirement[] {
    const groupedRequirements = [
      { sourcePriority: 0, requirements: this.progressPanelService.getMajReqs() },
      { sourcePriority: 1, requirements: this.progressPanelService.getSecondMajReqs() },
      { sourcePriority: 2, requirements: this.progressPanelService.getThirdMajReqs() },
      { sourcePriority: 3, requirements: this.progressPanelService.getPathwayReqs() },
      { sourcePriority: 4, requirements: this.progressPanelService.getModuleReqs() },
      { sourcePriority: 5, requirements: this.progressPanelService.getSecondModuleReqs() },
      { sourcePriority: 6, requirements: this.progressPanelService.getReqs() },
    ];

    let index = 0;
    const entries: IRequirementEntry[] = [];

    groupedRequirements.forEach((group) => {
      if (!Array.isArray(group.requirements)) {
        return;
      }

      group.requirements.forEach((requirement: IRequirement) => {
        if (!requirement) {
          return;
        }

        entries.push({
          requirement,
          sourcePriority: group.sourcePriority,
          specificity: this.requirementSpecificity(requirement),
          candidateCount: this.requirementCandidateCount(requirement),
          index: index++,
        });
      });
    });

    return entries
      .sort((entryA: IRequirementEntry, entryB: IRequirementEntry) => {
        if (entryA.sourcePriority !== entryB.sourcePriority) {
          return entryA.sourcePriority - entryB.sourcePriority;
        }

        if (entryA.specificity !== entryB.specificity) {
          return entryB.specificity - entryA.specificity;
        }

        if (entryA.candidateCount !== entryB.candidateCount) {
          return entryA.candidateCount - entryB.candidateCount;
        }

        return entryA.index - entryB.index;
      })
      .map((entry: IRequirementEntry) => entry.requirement);
  }

  private requirementSpecificity(requirement: IRequirement): number {
    let score = 0;

    if (this.requirementService.isComplex(requirement)) {
      score += 6;
    }

    if (Array.isArray(requirement.papers) && requirement.papers.length > 0) {
      const hasRange = requirement.papers.some((paper: string) =>
        paper.includes("-")
      );
      score += hasRange ? 2 : 5;
    }

    if (
      requirement.stage !== undefined ||
      requirement.aboveStage !== undefined ||
      (Array.isArray(requirement.stages) && requirement.stages.length > 0)
    ) {
      score += 3;
    }

    if (
      Array.isArray(requirement.departments) &&
      requirement.departments.length > 0
    ) {
      score += 3;
    }

    if (Array.isArray(requirement.faculties) && requirement.faculties.length > 0) {
      score += 1;
    }

    if (!this.hasRequirementCriteria(requirement)) {
      score -= 4;
    }

    return score;
  }

  private requirementCandidateCount(requirement: IRequirement): number {
    if (!this.hasRequirementCriteria(requirement)) {
      return Number.MAX_SAFE_INTEGER;
    }

    const count = this.getRequirementCandidates(requirement).length;
    return count === 0 ? Number.MAX_SAFE_INTEGER - 1 : count;
  }

  private async fulfilRequirement(
    requirement: IRequirement,
    courseNeedingRequirement?: ICourse,
    lineage: Set<string> = new Set()
  ) {
    if (!requirement || this.isRequirementFilled(requirement, courseNeedingRequirement)) {
      return;
    }

    if (this.requirementService.isComplex(requirement)) {
      await this.fulfilComplexRequirement(
        requirement,
        courseNeedingRequirement,
        lineage
      );
      return;
    }

    await this.fulfilSimpleRequirement(
      requirement,
      courseNeedingRequirement,
      lineage
    );
  }

  private async fulfilComplexRequirement(
    requirement: IRequirement,
    courseNeedingRequirement?: ICourse,
    lineage: Set<string> = new Set()
  ) {
    const subRequirements = Array.isArray(requirement.complex)
      ? requirement.complex
      : [];
    if (subRequirements.length === 0) {
      return;
    }

    const required = requirement.required
      ? Math.min(requirement.required, subRequirements.length)
      : subRequirements.length;

    let safetyCounter = 0;
    while (
      this.countSatisfiedSubRequirements(subRequirements, courseNeedingRequirement) <
        required &&
      safetyCounter < subRequirements.length * 3
    ) {
      const before = this.planningSnapshot.length;

      for (const subRequirement of subRequirements) {
        if (
          this.countSatisfiedSubRequirements(
            subRequirements,
            courseNeedingRequirement
          ) >= required
        ) {
          break;
        }

        if (!this.isRequirementFilled(subRequirement, courseNeedingRequirement)) {
          await this.fulfilRequirement(
            subRequirement,
            courseNeedingRequirement,
            lineage
          );
        }
      }

      if (this.planningSnapshot.length === before) {
        break;
      }

      safetyCounter++;
    }
  }

  private async fulfilSimpleRequirement(
    requirement: IRequirement,
    courseNeedingRequirement?: ICourse,
    lineage: Set<string> = new Set()
  ) {
    if (this.shouldUseTempCardsForRequirement(requirement, courseNeedingRequirement)) {
      await this.ensureTempCardsForRequirement(requirement);
      return;
    }

    const candidates = this.getRequirementCandidates(
      requirement,
      courseNeedingRequirement
    );

    for (const candidate of candidates) {
      if (this.isRequirementFilled(requirement, courseNeedingRequirement)) {
        break;
      }
      await this.ensureCourseAdded(candidate, lineage);
    }
  }

  private shouldUseTempCardsForRequirement(
    requirement: IRequirement,
    courseNeedingRequirement?: ICourse
  ): boolean {
    if (courseNeedingRequirement) {
      return false;
    }

    if (requirement.type !== RequirementType.Points) {
      return false;
    }

    if (Array.isArray(requirement.papers) && requirement.papers.length > 0) {
      return false;
    }

    const hasUnsupportedExclusions = Boolean(
      (requirement.papersExcluded && requirement.papersExcluded.length > 0) ||
        (requirement.departmentsExcluded &&
          requirement.departmentsExcluded.length > 0) ||
        (requirement.facultiesExcluded && requirement.facultiesExcluded.length > 0)
    );
    if (hasUnsupportedExclusions) {
      return false;
    }

    return true;
  }

  private async ensureTempCardsForRequirement(requirement: IRequirement) {
    const currentlyFilled = this.requirementService.requirementCheck(
      requirement,
      this.requirementPool()
    );
    const remainingPoints = Math.max(0, requirement.required - currentlyFilled);
    if (remainingPoints <= 0) {
      return;
    }

    const stageFilters = this.resolveRequirementStages(requirement);
    const tempCardTemplate = this.buildTempCardTemplate(requirement, stageFilters);
    const cardsToCreate = Math.ceil(remainingPoints / 15);
    if (cardsToCreate <= 0) {
      return;
    }

    for (let i = 0; i < cardsToCreate; i++) {
      const schedule = this.findNextTempCardSemester(stageFilters);
      if (!schedule) {
        break;
      }

      this.ensureSemesterExists(schedule.year, schedule.period);

      const tempCard: ITempCard = Object.assign({}, tempCardTemplate, {
        generatedId: this.generateId(),
      });

      this.addTempCardToLocalSemester(schedule.year, schedule.period, tempCard);
      await this.persistTempCard(schedule.year, schedule.period, tempCard);
    }
  }

  private buildTempCardTemplate(
    requirement: IRequirement,
    stages: number[]
  ): Omit<ITempCard, "generatedId"> {
    const departments = Array.isArray(requirement.departments)
      ? requirement.departments.slice()
      : [];
    const faculties = Array.isArray(requirement.faculties)
      ? requirement.faculties.slice()
      : [];

    return {
      paper: null,
      points: 15,
      value: 15,
      department: departments.length === 1 ? departments[0] : null,
      departments: departments.length > 0 ? departments : null,
      faculty: faculties.length === 1 ? faculties[0] : null,
      faculties: faculties.length > 0 ? faculties : null,
      level: stages.length === 1 ? stages[0] : null,
      stages: stages.length > 1 ? stages : null,
      general: this.isGeneralRequirement(requirement),
      autoRequirementKey: this.requirementToTempCardKey(requirement),
    };
  }

  private resolveRequirementStages(requirement: IRequirement): number[] {
    const availableStages = this.getAvailableStages();

    if (Array.isArray(requirement.stages) && requirement.stages.length > 0) {
      const stageSet = new Set(
        requirement.stages.filter((stage: number) => availableStages.includes(stage))
      );
      return Array.from(stageSet).sort((stageA: number, stageB: number) => stageA - stageB);
    }

    if (typeof requirement.stage === "number" && requirement.stage > 0) {
      return [requirement.stage];
    }

    if (typeof requirement.aboveStage === "number") {
      const stages = availableStages.filter(
        (stage: number) => stage > (requirement.aboveStage as number)
      );
      if (stages.length > 0) {
        return stages;
      }

      return [Math.max((requirement.aboveStage as number) + 1, 1)];
    }

    return [];
  }

  private getAvailableStages(): number[] {
    const stageSet = new Set<number>();

    (this.courseService.allCourses || []).forEach((course: ICourse) => {
      if (typeof course.stage === "number" && course.stage > 0) {
        stageSet.add(course.stage);
      }
    });

    if (stageSet.size === 0) {
      return [1, 2, 3];
    }

    return Array.from(stageSet).sort(
      (stageA: number, stageB: number) => stageA - stageB
    );
  }

  private requirementToTempCardKey(requirement: IRequirement): string {
    const departments = Array.isArray(requirement.departments)
      ? requirement.departments.slice().sort().join(",")
      : "";
    const faculties = Array.isArray(requirement.faculties)
      ? requirement.faculties.slice().sort().join(",")
      : "";
    const stages = this.resolveRequirementStages(requirement).join(",");

    return [
      requirement.type,
      requirement.required,
      departments,
      faculties,
      stages,
      requirement.aboveStage ?? "",
      this.isGeneralRequirement(requirement) ? "general" : "",
    ].join("|");
  }

  private isGeneralRequirement(requirement: IRequirement): boolean {
    if (requirement?.general === true) {
      return true;
    }

    const flags = requirement?.flags;
    if (!flags) {
      return false;
    }

    if (Array.isArray(flags)) {
      return flags.some(
        (flag: any) =>
          typeof flag === "string" && flag.toLowerCase() === "general"
      );
    }

    if (typeof flags === "object") {
      if (flags.General === true || flags.general === true) {
        return true;
      }
    }

    return false;
  }

  private findNextTempCardSemester(
    stages: number[]
  ): { year: number; period: Period } | null {
    const preferredStage = stages.length > 0 ? Math.min(...stages) : 1;
    const preferredStartYear =
      this.planningAnchorYear + Math.max(preferredStage - 1, 0);

    const preferredMatch = this.searchTempCardSemesterFrom(
      preferredStartYear,
      this.planningAnchorPeriod
    );
    if (preferredMatch) {
      return preferredMatch;
    }

    return this.searchTempCardSemesterFrom(
      this.planningAnchorYear,
      this.planningAnchorPeriod
    );
  }

  private searchTempCardSemesterFrom(
    startYear: number,
    startPeriod: Period
  ): { year: number; period: Period } | null {
    let candidateYear = startYear;
    let candidatePeriod = startPeriod;

    for (let guard = 0; guard < this.planningWindowSemesters; guard++) {
      const load =
        this.countCoursesInSemester(candidateYear, candidatePeriod) +
        this.countTempCardsInSemester(candidateYear, candidatePeriod);

      if (load < this.maxCoursesPerSemester) {
        return { year: candidateYear, period: candidatePeriod };
      }

      const nextSemester = this.getNextSemester(candidateYear, candidatePeriod);
      candidateYear = nextSemester.year;
      candidatePeriod = nextSemester.period;
    }

    return null;
  }

  private countTempCardsInSemester(year: number, period: Period): number {
    const semesters = this.storeHelper.current("semesters") || [];
    const semester = semesters.find(
      (entry: any) =>
        Number(entry.year) === year && Number(entry.period) === period
    );
    if (!semester) {
      return 0;
    }

    return Array.isArray(semester.tempCards) ? semester.tempCards.length : 0;
  }

  private tempCardIdsMatch(leftCard: { generatedId?: any }, rightCard: { generatedId?: any }): boolean {
    if (!leftCard || !rightCard) {
      return false;
    }

    const leftId = leftCard.generatedId;
    const rightId = rightCard.generatedId;
    if (leftId === undefined || leftId === null || rightId === undefined || rightId === null) {
      return false;
    }

    const numericLeft = Number(leftId);
    const numericRight = Number(rightId);
    if (Number.isFinite(numericLeft) && Number.isFinite(numericRight)) {
      return numericLeft === numericRight;
    }

    return String(leftId) === String(rightId);
  }

  private addTempCardToLocalSemester(
    year: number,
    period: Period,
    tempCard: ITempCard
  ) {
    const semesters = (this.storeHelper.current("semesters") || []).map(
      (semester: any) =>
        Object.assign({}, semester, {
          tempCards: Array.isArray(semester.tempCards)
            ? semester.tempCards.slice()
            : [],
        })
    );

    let semester = semesters.find(
      (entry: any) => Number(entry.year) === year && Number(entry.period) === period
    );

    if (!semester) {
      semester = {
        year,
        period,
        both: `${year} ${period}`,
        tempCards: [],
      };
      semesters.push(semester);
    }

    if (
      semester.tempCards.some(
        (existingCard: ITempCard) => this.tempCardIdsMatch(existingCard, tempCard)
      )
    ) {
      return;
    }

    semester.tempCards = semester.tempCards.concat([tempCard]);
    semesters.sort((semesterA: any, semesterB: any) =>
      semesterA.year === semesterB.year
        ? semesterA.period - semesterB.period
        : semesterA.year - semesterB.year
    );

    this.storeHelper.update("semesters", semesters);
    this.semesters = semesters;
  }

  private async persistTempCard(
    year: number,
    period: Period,
    tempCard: ITempCard
  ) {
    const email = this.getCurrentUserEmail();
    if (!email) {
      return;
    }

    try {
      const semesterId = await this.getSemesterId(year, period, true);
      if (!semesterId) {
        return;
      }

      const semesterRef = doc(
        this.dbCourseService.db,
        `users/${email}/semester/${semesterId}`
      );
      await updateDoc(semesterRef, {
        tempCards: arrayUnion(tempCard),
      });
    } catch (error) {
      console.warn("Unable to persist temp card", error);
    }
  }

  private getRequirementCandidates(
    requirement: IRequirement,
    courseNeedingRequirement?: ICourse
  ): ICourse[] {
    if (!this.hasRequirementCriteria(requirement)) {
      return [];
    }

    const filtered = this.requirementService.filterByRequirement(
      requirement,
      this.courseService.allCourses
    );
    const byName = new Map<string, ICourse>();

    filtered.forEach((course: ICourse) => {
      if (!course || !course.name || course.isActive === false) {
        return;
      }

      if (courseNeedingRequirement && course.name === courseNeedingRequirement.name) {
        return;
      }

      if (this.hasPlannedCourse(course.name)) {
        return;
      }

      if (!byName.has(course.name)) {
        byName.set(course.name, course);
      }
    });

    return Array.from(byName.values()).sort((courseA: ICourse, courseB: ICourse) => {
      const stageComparison = (courseA.stage || 0) - (courseB.stage || 0);
      if (stageComparison !== 0) {
        return stageComparison;
      }

      const prereqCountComparison =
        this.coursePrerequisiteCount(courseA) - this.coursePrerequisiteCount(courseB);
      if (prereqCountComparison !== 0) {
        return prereqCountComparison;
      }

      const pointsComparison = (courseA.points || 0) - (courseB.points || 0);
      if (pointsComparison !== 0) {
        return pointsComparison;
      }

      return courseA.name.localeCompare(courseB.name);
    });
  }

  private hasRequirementCriteria(requirement: IRequirement): boolean {
    return Boolean(
      (requirement.papers && requirement.papers.length) ||
        (requirement.departments && requirement.departments.length) ||
        (requirement.faculties && requirement.faculties.length) ||
        (requirement.stages && requirement.stages.length) ||
        requirement.stage !== undefined ||
        requirement.aboveStage !== undefined ||
        (requirement.papersExcluded && requirement.papersExcluded.length) ||
        (requirement.departmentsExcluded &&
          requirement.departmentsExcluded.length) ||
        (requirement.facultiesExcluded && requirement.facultiesExcluded.length)
    );
  }

  private isRequirementFilled(
    requirement: IRequirement,
    courseNeedingRequirement?: ICourse
  ): boolean {
    if (this.requirementService.isComplex(requirement)) {
      const subRequirements = Array.isArray(requirement.complex)
        ? requirement.complex
        : [];
      if (subRequirements.length === 0) {
        return true;
      }

      const required = requirement.required
        ? Math.min(requirement.required, subRequirements.length)
        : subRequirements.length;

      return (
        this.countSatisfiedSubRequirements(subRequirements, courseNeedingRequirement) >=
        required
      );
    }

    return (
      this.requirementService.requirementCheck(
        requirement,
        this.requirementPool(courseNeedingRequirement)
      ) === requirement.required
    );
  }

  private countSatisfiedSubRequirements(
    requirements: IRequirement[],
    courseNeedingRequirement?: ICourse
  ): number {
    return requirements.filter((requirement: IRequirement) =>
      this.isRequirementFilled(requirement, courseNeedingRequirement)
    ).length;
  }

  private requirementPool(courseNeedingRequirement?: ICourse): ICourse[] {
    if (!courseNeedingRequirement) {
      return this.planningSnapshot.concat(this.tempCardPlaceholderCourses());
    }

    return this.planningSnapshot.filter(
      (plannedCourse: ICourse) => plannedCourse.name !== courseNeedingRequirement.name
    );
  }

  private tempCardPlaceholderCourses(): ICourse[] {
    const semesters = this.storeHelper.current("semesters") || [];
    const placeholders: ICourse[] = [];

    semesters.forEach((semester: any, semesterIndex: number) => {
      const year = Number(semester?.year);
      const period = this.normalisePeriod(Number(semester?.period));
      const tempCards = Array.isArray(semester?.tempCards) ? semester.tempCards : [];

      tempCards.forEach((tempCard: ITempCard, tempCardIndex: number) => {
        placeholders.push(
          this.toTempCardPlaceholderCourse(
            tempCard,
            year,
            period,
            semesterIndex * 1000 + tempCardIndex
          )
        );
      });
    });

    return placeholders;
  }

  private toTempCardPlaceholderCourse(
    tempCard: ITempCard,
    year: number,
    period: Period,
    fallbackIndex: number
  ): ICourse {
    const generatedId = Number(tempCard?.generatedId);
    const resolvedGeneratedId = Number.isFinite(generatedId)
      ? generatedId
      : -(fallbackIndex + 1);
    const departments = Array.isArray(tempCard?.departments)
      ? tempCard.departments.filter((department: string | null) => !!department)
      : [];
    const faculties = Array.isArray(tempCard?.faculties)
      ? tempCard.faculties.filter((faculty: string | null) => !!faculty)
      : [];
    const resolvedDepartments =
      departments.length > 0
        ? departments
        : tempCard?.department
        ? [tempCard.department]
        : [];
    const resolvedFaculties =
      faculties.length > 0
        ? faculties
        : tempCard?.faculty
        ? [tempCard.faculty]
        : [];
    const resolvedStage =
      typeof tempCard?.level === "number" && tempCard.level > 0
        ? tempCard.level
        : Array.isArray(tempCard?.stages) &&
          tempCard.stages.length === 1 &&
          typeof tempCard.stages[0] === "number"
        ? tempCard.stages[0]
        : undefined;
    const resolvedStages = Array.isArray(tempCard?.stages)
      ? Array.from(
          new Set(
            tempCard.stages.filter(
              (stage: number) => typeof stage === "number" && stage > 0
            )
          )
        )
      : [];
    const nameSuffix = tempCard?.general ? "G" : "";
    const resolvedName =
      typeof tempCard?.paper === "string" && tempCard.paper.trim().length > 0
        ? tempCard.paper.trim().toUpperCase()
        : `TEMPCARD${Math.abs(resolvedGeneratedId)}${nameSuffix}`;

    return {
      id: resolvedGeneratedId,
      generatedId: resolvedGeneratedId,
      name: resolvedName,
      desc: "Auto-generated selection placeholder",
      faculties: resolvedFaculties,
      department: resolvedDepartments,
      points:
        typeof tempCard?.points === "number" && tempCard.points > 0
          ? tempCard.points
          : typeof tempCard?.value === "number" && tempCard.value > 0
          ? tempCard.value
          : 15,
      stage: resolvedStage,
      tempCardStages:
        resolvedStages.length > 0
          ? resolvedStages
          : resolvedStage !== undefined
          ? [resolvedStage]
          : undefined,
      status: CourseStatus.Planned,
      year: Number.isFinite(year) ? year : this.planningAnchorYear,
      period,
      canDelete: false,
    };
  }

  private hasPlannedCourse(courseName: string): boolean {
    return this.planningSnapshot.some(
      (course: ICourse) =>
        course.name === courseName && course.status !== CourseStatus.Failed
    );
  }

  private coursePrerequisiteCount(course: ICourse): number {
    const requirements = Array.isArray(course.requirements)
      ? course.requirements
      : [];

    return requirements.filter((requirement: IRequirement) =>
      this.shouldResolveCourseRequirement(requirement)
    ).length;
  }

  private shouldResolveCourseRequirement(requirement: IRequirement): boolean {
    if (this.requirementService.isComplex(requirement)) {
      return true;
    }

    if (!this.hasRequirementCriteria(requirement)) {
      return false;
    }

    const hasPaperOrDepartmentConstraint = Boolean(
      (requirement.papers && requirement.papers.length) ||
        (requirement.departments && requirement.departments.length) ||
        (requirement.papersExcluded && requirement.papersExcluded.length) ||
        (requirement.departmentsExcluded &&
          requirement.departmentsExcluded.length)
    );

    if (hasPaperOrDepartmentConstraint) {
      return true;
    }

    const hasStageConstraint =
      requirement.stage !== undefined ||
      requirement.aboveStage !== undefined ||
      (Array.isArray(requirement.stages) && requirement.stages.length > 0);

    if (hasStageConstraint) {
      return true;
    }

    // Faculty-only point rules are usually broad progression constraints.
    return false;
  }

  private async ensureCourseAdded(course: ICourse, lineage: Set<string>) {
    if (!course || !course.name || this.hasPlannedCourse(course.name)) {
      return;
    }

    if (lineage.has(course.name)) {
      return;
    }

    lineage.add(course.name);

    try {
      const requirements = Array.isArray(course.requirements)
        ? course.requirements
        : [];

      for (const requirement of requirements) {
        if (!this.shouldResolveCourseRequirement(requirement)) {
          continue;
        }

        await this.fulfilRequirement(requirement, course, lineage);
      }

      if (!this.hasPlannedCourse(course.name)) {
        await this.addCourseToPlan(course);
      }
    } finally {
      lineage.delete(course.name);
    }
  }

  private async addCourseToPlan(course: ICourse): Promise<boolean> {
    const schedule = this.findNextValidSemester(course);
    if (!schedule) {
      return false;
    }

    this.ensureSemesterExists(schedule.year, schedule.period);

    const plannedCourse: ICourse = Object.assign({}, course, {
      year: schedule.year,
      period: schedule.period,
      status: CourseStatus.Planned,
      canDelete: true,
      generatedId: this.generateId(),
    });

    await this.courseService.setCourseDb(
      plannedCourse,
      plannedCourse.generatedId,
      schedule.period,
      schedule.year,
      CourseStatus.Planned
    );

    this.planningSnapshot = this.planningSnapshot.concat(plannedCourse);
    return true;
  }

  private findNextValidSemester(
    course: ICourse
  ): { year: number; period: Period } | null {
    const preferredStart = this.getPreferredStartSemester(course);
    const preferredMatch = this.searchValidSemesterFrom(
      course,
      preferredStart.year,
      preferredStart.period
    );

    if (preferredMatch) {
      return preferredMatch;
    }

    return this.searchValidSemesterFrom(
      course,
      this.planningAnchorYear,
      this.planningAnchorPeriod
    );
  }

  private searchValidSemesterFrom(
    course: ICourse,
    startYear: number,
    startPeriod: Period
  ): { year: number; period: Period } | null {
    let candidateYear = startYear;
    let candidatePeriod = startPeriod;

    for (let guard = 0; guard < this.planningWindowSemesters; guard++) {
      const load = this.countCoursesInSemester(candidateYear, candidatePeriod);
      if (
        load < this.maxCoursesPerSemester &&
        this.canScheduleCourseInSemester(course, candidateYear, candidatePeriod)
      ) {
        return { year: candidateYear, period: candidatePeriod };
      }

      const nextSemester = this.getNextSemester(candidateYear, candidatePeriod);
      candidateYear = nextSemester.year;
      candidatePeriod = nextSemester.period;
    }

    return null;
  }

  private getPreferredStartSemester(course: ICourse): {
    year: number;
    period: Period;
  } {
    const stage = course.stage || 1;
    const yearOffset = stage > 0 ? stage - 1 : 0;

    return {
      year: this.planningAnchorYear + yearOffset,
      period: this.planningAnchorPeriod,
    };
  }

  private canScheduleCourseInSemester(
    course: ICourse,
    year: number,
    period: Period
  ): boolean {
    return !this.hasCourseErrorsAtSemester(course, year, period);
  }

  private hasCourseErrorsAtSemester(
    course: ICourse,
    year: number,
    period: Period
  ): boolean {
    const requirements = Array.isArray(course.requirements) ? course.requirements : [];
    if (requirements.length === 0) {
      return false;
    }

    const simulatedCourse: ICourse = Object.assign({}, course, {
      year,
      period,
      status: CourseStatus.Planned,
    });
    const simulatedPlan = this.planningSnapshot.concat(simulatedCourse);

    for (const requirement of requirements) {
      if (this.requirementService.isComplex(requirement)) {
        const subRequirements = Array.isArray(requirement.complex)
          ? requirement.complex
          : [];
        if (subRequirements.length === 0) {
          continue;
        }

        let complexErrors = 0;
        for (const subRequirement of subRequirements) {
          const planned = this.requirementService.checkCoRequesiteFlag(
            subRequirement,
            "isCorequesite"
          )
            ? this.currentSemester(simulatedPlan, simulatedCourse)
            : this.beforeSemester(simulatedPlan, simulatedCourse);

          if (
            !this.requirementService.requirementFilled(
              subRequirement,
              planned,
              simulatedCourse
            )
          ) {
            complexErrors++;
          }
        }

        if (complexErrors === subRequirements.length) {
          return true;
        }
        continue;
      }

      const planned = this.requirementService.checkCoRequesiteFlag(
        requirement,
        "isCorequesite"
      )
        ? this.currentSemester(simulatedPlan, simulatedCourse)
        : this.beforeSemester(simulatedPlan, simulatedCourse);

      if (
        !this.requirementService.requirementFilled(
          requirement,
          planned,
          simulatedCourse
        )
      ) {
        return true;
      }
    }

    return false;
  }

  private beforeSemester(plan: ICourse[], beforeCourse: ICourse): ICourse[] {
    return plan.filter(
      (course: ICourse) =>
        ((course.period as number) < (beforeCourse.period as number) &&
          course.year === beforeCourse.year) ||
        (course.year as number) < (beforeCourse.year as number)
    );
  }

  private currentSemester(plan: ICourse[], currentCourse: ICourse): ICourse[] {
    return plan.filter(
      (course: ICourse) =>
        course.period === currentCourse.period && course.year === currentCourse.year
    );
  }

  private countCoursesInSemester(year: number, period: Period): number {
    return this.planningSnapshot.filter(
      (course: ICourse) =>
        course.year === year &&
        this.normalisePeriod(course.period as number) === period
    ).length;
  }

  private initialisePlanningState() {
    const courses = this.storeHelper.current("courses") || [];
    this.planningSnapshot = courses.map((course: ICourse) =>
      Object.assign({}, course)
    );

    const scheduledCourses = this.planningSnapshot
      .filter(
        (course: ICourse) =>
          typeof course.year === "number" && typeof course.period === "number"
      )
      .sort((courseA: ICourse, courseB: ICourse) =>
        (courseA.year as number) === (courseB.year as number)
          ? this.normalisePeriod(courseA.period as number) -
            this.normalisePeriod(courseB.period as number)
          : (courseA.year as number) - (courseB.year as number)
      );

    if (scheduledCourses.length === 0) {
      const earliestSemester = this.getEarliestSemesterAnchor();
      if (earliestSemester) {
        this.planningAnchorYear = earliestSemester.year;
        this.planningAnchorPeriod = earliestSemester.period;
        return;
      }

      this.planningAnchorYear = this.getDefaultAnchorYear();
      this.planningAnchorPeriod = this.getDefaultAnchorPeriod();
      return;
    }

    const earliestCourse = scheduledCourses[0];
    this.planningAnchorYear = earliestCourse.year as number;
    this.planningAnchorPeriod = this.normalisePeriod(earliestCourse.period as number);
  }

  private getEarliestSemesterAnchor(): { year: number; period: Period } | null {
    const semesters = this.storeHelper.current("semesters") || [];
    const normalized = semesters
      .map((semester: any) => {
        const year = Number(semester?.year);
        const periodNumber = Number(semester?.period);
        if (!Number.isFinite(year) || !Number.isFinite(periodNumber)) {
          return null;
        }

        return {
          year,
          period: this.normalisePeriod(periodNumber),
        };
      })
      .filter(
        (
          semester: { year: number; period: Period } | null
        ): semester is { year: number; period: Period } => !!semester
      )
      .sort((semesterA: { year: number; period: Period }, semesterB: { year: number; period: Period }) =>
        semesterA.year === semesterB.year
          ? semesterA.period - semesterB.period
          : semesterA.year - semesterB.year
      );

    return normalized.length > 0 ? normalized[0] : null;
  }

  private getDefaultAnchorYear(): number {
    return new Date().getFullYear();
  }

  private getDefaultAnchorPeriod(): Period {
    const month = new Date().getMonth() + 1;
    return month >= 7 ? Period.Two : Period.One;
  }

  private ensureSemesterExists(year: number, period: Period) {
    const semesters = (this.storeHelper.current("semesters") || []).map(
      (semester: any) => Object.assign({}, semester)
    );
    const exists = semesters.some(
      (semester: any) =>
        Number(semester.year) === year && Number(semester.period) === period
    );

    if (exists) {
      return;
    }

    semesters.push({
      year,
      period,
      both: `${year} ${period}`,
      tempCards: [],
    });

    semesters.sort((semesterA: any, semesterB: any) =>
      semesterA.year === semesterB.year
        ? semesterA.period - semesterB.period
        : semesterA.year - semesterB.year
    );

    this.storeHelper.update("semesters", semesters);
    this.ensureSemesterDocument(year, period).catch((error: any) =>
      console.warn("Unable to ensure semester document", error)
    );
  }

  private getNextSemester(
    year: number,
    period: Period
  ): { year: number; period: Period } {
    if (period === Period.One) {
      return { year, period: Period.Two };
    }

    if (period === Period.Two) {
      return { year: year + 1, period: Period.One };
    }

    return { year, period: Period.One };
  }

  private normalisePeriod(period: number): Period {
    return period === Period.Two ? Period.Two : Period.One;
  }

  private generateId(): number {
    let generatedId = Math.floor(Math.random() * 1000000);
    while (
      this.planningSnapshot.some(
        (course: ICourse) => course.generatedId === generatedId
      ) ||
      this.tempCardIdExists(generatedId)
    ) {
      generatedId = Math.floor(Math.random() * 1000000);
    }

    return generatedId;
  }

  private tempCardIdExists(generatedId: number): boolean {
    const semesters = this.storeHelper.current("semesters") || [];

    return semesters.some((semester: any) =>
      (Array.isArray(semester.tempCards) ? semester.tempCards : []).some(
        (card: ITempCard) => card.generatedId === generatedId
      )
    );
  }

  private countTotalTempCards(): number {
    const semesters = this.storeHelper.current("semesters") || [];

    return semesters.reduce((total: number, semester: any) => {
      const count = Array.isArray(semester.tempCards)
        ? semester.tempCards.length
        : 0;
      return total + count;
    }, 0);
  }

  private getCurrentUserEmail(): string | null {
    const email = this.authService?.auth?.currentUser?.email;
    if (typeof email !== "string" || email.length === 0) {
      return null;
    }

    return email;
  }

  public async getSemesterId(
    year: number,
    period: Period,
    createIfMissing: boolean = false
  ) {
    const email = this.getCurrentUserEmail();
    if (!email) {
      return null;
    }

    const colRef = collection(
      this.dbCourseService.db,
      `users/${email}/semester/`
    );
    const docSnap = await getDocs(colRef);
    for (const semesterDoc of docSnap.docs) {
      if (semesterDoc.data()["year"] === year && semesterDoc.data()["period"] === period) {
        return semesterDoc.id;
      }
    }

    if (createIfMissing) {
      return this.ensureSemesterDocument(year, period);
    }

    return null;
  }

  private async ensureSemesterDocument(
    year: number,
    period: Period
  ): Promise<string | null> {
    const email = this.getCurrentUserEmail();
    if (!email) {
      return null;
    }

    const existingId = await this.getSemesterId(year, period, false);
    if (existingId) {
      return existingId;
    }

    try {
      const semesterCollectionRef = collection(
        this.dbCourseService.db,
        `users/${email}/semester`
      );
      const createdDoc = await addDoc(semesterCollectionRef, {
        year,
        period,
        both: `${year} ${period}`,
        tempCards: [],
      });
      return createdDoc.id;
    } catch (error) {
      console.warn("Unable to create semester document", error);
      return null;
    }
  }

  public async addTempCardToSemester(semesterId: string, tempCard: any) {
    const email = this.getCurrentUserEmail();
    if (!email) {
      return;
    }

    const semesterRef = doc(
      this.dbCourseService.db,
      `users/${email}/semester/${semesterId}`
    );
    await updateDoc(semesterRef, {
      tempCards: arrayUnion(tempCard),
    });

    const semesterDoc = await getDoc(semesterRef);
    if (!semesterDoc.exists()) {
      return;
    }

    const semesterData = semesterDoc.data();
    const semesters = (this.storeHelper.current("semesters") || []).map((semester: any) =>
      Object.assign({}, semester)
    );
    const semester = semesters.find(
      (entry: any) => entry.both === semesterData["both"]
    );
    if (!semester) {
      return;
    }

    const tempCards = Array.isArray(semester.tempCards) ? semester.tempCards : [];
    if (tempCards.some((card: any) => this.tempCardIdsMatch(card, tempCard))) {
      return;
    }

    semester.tempCards = tempCards.concat([tempCard]);
    this.storeHelper.update("semesters", semesters);
    this.semesters = semesters;
  }

  public async removeTempCardFromSemester(semesterId: string, tempCard: any) {
    const email = this.getCurrentUserEmail();
    if (!email) {
      return;
    }

    const semesterRef = doc(
      this.dbCourseService.db,
      `users/${email}/semester/${semesterId}`
    );
    const snapshot = await getDoc(semesterRef);
    if (!snapshot.exists()) {
      return;
    }

    const semesterData = snapshot.data();
    const updatedTempCards = (semesterData["tempCards"] || []).filter(
      (card: any) => !this.tempCardIdsMatch(card, tempCard)
    );

    await updateDoc(semesterRef, { tempCards: updatedTempCards });

    const semesters = (this.storeHelper.current("semesters") || []).map((semester: any) =>
      Object.assign({}, semester)
    );
    const semester = semesters.find(
      (entry: any) => entry.both === semesterData["both"]
    );
    if (!semester) {
      return;
    }

    semester.tempCards = updatedTempCards;
    this.storeHelper.update("semesters", semesters);
    this.semesters = semesters;
  }

  public async sortTempCardsIntoYears() {
    this.semesters = this.storeHelper.current("semesters") || [];
  }
}
