import { ICourse } from "../interfaces";
import { CourseStatus, Period } from "../models";
import { RequirementType } from "../models/requirement.enum";
import { RequirementService } from "./requirement.service";
import { SamplePlanService } from "./sample-plan.service";

describe("SamplePlanService", () => {
  let state: any;
  let storeHelper: any;
  let courseService: any;
  let progressPanelService: any;
  let service: SamplePlanService;

  function createService(
    allCourses: ICourse[],
    majorRequirements: any[],
    existingCourses: ICourse[] = [],
    existingSemesters: any[] = [],
    conjointRequirements: any[] = [],
    degreeRequirements: any[] = []
  ) {
    state = {
      courses: existingCourses.map((course: ICourse) => Object.assign({}, course)),
      semesters: existingSemesters.map((semester: any) => Object.assign({}, semester)),
    };

    storeHelper = {
      current: jasmine
        .createSpy("current")
        .and.callFake((key: string) => state[key]),
      update: jasmine
        .createSpy("update")
        .and.callFake((key: string, value: any) => {
          state[key] = value;
        }),
    };

    courseService = {
      allCourses,
      setCourseDb: jasmine
        .createSpy("setCourseDb")
        .and.callFake(async (course: ICourse) => {
          state.courses.push(course);
        }),
      updateErrors: jasmine.createSpy("updateErrors"),
    };

    progressPanelService = {
      getReqs: (): any[] => degreeRequirements,
      getMajReqs: () => majorRequirements,
      getSecondMajReqs: (): any[] => [],
      getThirdMajReqs: (): any[] => [],
      getConjointReqs: (): any[] => conjointRequirements,
      getPathwayReqs: (): any[] => [],
      getModuleReqs: (): any[] => [],
      getSecondModuleReqs: (): any[] => [],
    };

    const requirementService = new RequirementService({} as any, {} as any);
    service = new SamplePlanService(
      {} as any,
      storeHelper,
      courseService,
      {} as any,
      progressPanelService,
      requirementService
    );
  }

  function isBefore(courseA: ICourse, courseB: ICourse): boolean {
    if ((courseA.year as number) < (courseB.year as number)) {
      return true;
    }

    return (
      courseA.year === courseB.year &&
      (courseA.period as number) < (courseB.period as number)
    );
  }

  it("adds prerequisite courses and schedules dependent papers in a later semester", async () => {
    const anthro100: ICourse = {
      id: 1,
      generatedId: 1001,
      name: "ANTHRO100",
      desc: "Intro anthropology",
      faculties: ["Arts"],
      department: ["Anthropology"],
      points: 15,
      stage: 1,
    };

    const anthro200: ICourse = {
      id: 2,
      generatedId: 2001,
      name: "ANTHRO200",
      desc: "Advanced anthropology",
      faculties: ["Arts"],
      department: ["Anthropology"],
      points: 15,
      stage: 2,
      requirements: [
        {
          type: RequirementType.Papers,
          required: 1,
          complex: [
            {
              type: RequirementType.Papers,
              required: 1,
              papers: ["ANTHRO100"],
            },
          ],
        },
      ],
    };

    createService(
      [anthro200, anthro100],
      [{ type: RequirementType.Papers, required: 1, papers: ["ANTHRO200"] }]
    );

    const result = await service.setCourse();

    const addedNames = courseService.setCourseDb
      .calls.allArgs()
      .map((args: any[]) => args[0].name);

    expect(addedNames).toEqual(["ANTHRO100", "ANTHRO200"]);
    expect(state.semesters.length).toBeGreaterThanOrEqual(2);

    const plannedAnthro100 = state.courses.find(
      (course: ICourse) => course.name === "ANTHRO100"
    );
    const plannedAnthro200 = state.courses.find(
      (course: ICourse) => course.name === "ANTHRO200"
    );

    expect(isBefore(plannedAnthro100, plannedAnthro200)).toBeTrue();
    expect(courseService.updateErrors).toHaveBeenCalled();
    expect(result.status).toBe("ok");
    expect(result.addedCourses).toBe(2);
  });

  it("does not re-add a non-failed course that already exists in the plan", async () => {
    const anthro100: ICourse = {
      id: 1,
      generatedId: 3001,
      name: "ANTHRO100",
      desc: "Intro anthropology",
      faculties: ["Arts"],
      department: ["Anthropology"],
      points: 15,
      stage: 1,
    };

    const existingCourse: ICourse = Object.assign({}, anthro100, {
      year: 2023,
      period: Period.One,
      status: CourseStatus.Completed,
    });

    createService(
      [anthro100],
      [{ type: RequirementType.Papers, required: 1, papers: ["ANTHRO100"] }],
      [existingCourse]
    );

    await service.setCourse();

    expect(courseService.setCourseDb).not.toHaveBeenCalled();
    expect(courseService.updateErrors).toHaveBeenCalled();
  });

  it("keeps early semesters dense even when an earlier requirement resolves to a later-semester paper", async () => {
    const prereq: ICourse = {
      id: 10,
      generatedId: 4010,
      name: "PREREQ100",
      desc: "Prerequisite paper",
      faculties: ["Arts"],
      department: ["History"],
      points: 15,
      stage: 1,
    };

    const advanced: ICourse = {
      id: 11,
      generatedId: 4011,
      name: "ADV200",
      desc: "Advanced paper",
      faculties: ["Arts"],
      department: ["History"],
      points: 15,
      stage: 2,
      requirements: [
        {
          type: RequirementType.Papers,
          required: 1,
          complex: [
            {
              type: RequirementType.Papers,
              required: 1,
              papers: ["PREREQ100"],
            },
          ],
        },
      ],
    };

    const easy: ICourse = {
      id: 12,
      generatedId: 4012,
      name: "EASY100",
      desc: "Easy paper",
      faculties: ["Arts"],
      department: ["History"],
      points: 15,
      stage: 1,
    };

    createService(
      [advanced, prereq, easy],
      [
        { type: RequirementType.Papers, required: 1, papers: ["ADV200"] },
        { type: RequirementType.Papers, required: 1, papers: ["EASY100"] },
      ]
    );

    await service.setCourse();

    const plannedPrereq = state.courses.find(
      (course: ICourse) => course.name === "PREREQ100"
    );
    const plannedAdvanced = state.courses.find(
      (course: ICourse) => course.name === "ADV200"
    );
    const plannedEasy = state.courses.find(
      (course: ICourse) => course.name === "EASY100"
    );

    expect(plannedPrereq).toBeTruthy();
    expect(plannedAdvanced).toBeTruthy();
    expect(plannedEasy).toBeTruthy();
    expect(isBefore(plannedPrereq, plannedAdvanced)).toBeTrue();
    expect(plannedEasy.year).toBe(plannedPrereq.year);
    expect(plannedEasy.period).toBe(plannedPrereq.period);
  });

  it("biases stage 300 papers into third-year-or-later semesters", async () => {
    const intro: ICourse = {
      id: 21,
      generatedId: 5021,
      name: "INTRO100",
      desc: "Intro paper",
      faculties: ["Arts"],
      department: ["History"],
      points: 15,
      stage: 1,
    };

    const advanced: ICourse = {
      id: 22,
      generatedId: 5022,
      name: "ADV300",
      desc: "Advanced stage-3 paper",
      faculties: ["Arts"],
      department: ["History"],
      points: 15,
      stage: 3,
    };

    createService(
      [advanced, intro],
      [
        { type: RequirementType.Papers, required: 1, papers: ["ADV300"] },
        { type: RequirementType.Papers, required: 1, papers: ["INTRO100"] },
      ]
    );

    const result = await service.setCourse();

    const plannedIntro = state.courses.find(
      (course: ICourse) => course.name === "INTRO100"
    );
    const plannedAdvanced = state.courses.find(
      (course: ICourse) => course.name === "ADV300"
    );
    const expectedMinimumAdvancedYear = new Date().getFullYear() + 2;

    expect(plannedIntro).toBeTruthy();
    expect(plannedAdvanced).toBeTruthy();
    expect(plannedAdvanced.year).toBeGreaterThanOrEqual(expectedMinimumAdvancedYear);
    expect(isBefore(plannedIntro, plannedAdvanced)).toBeTrue();
    expect(result.status).toBe("ok");
  });

  it("creates temp cards for broad point requirements instead of auto-selecting random courses", async () => {
    const biosci201: ICourse = {
      id: 31,
      generatedId: 6031,
      name: "BIOSCI201",
      desc: "Cell biology",
      faculties: ["Science"],
      department: ["Biological Sciences"],
      points: 15,
      stage: 2,
    };
    const biosci202: ICourse = {
      id: 32,
      generatedId: 6032,
      name: "BIOSCI202",
      desc: "Genetics",
      faculties: ["Science"],
      department: ["Biological Sciences"],
      points: 15,
      stage: 2,
    };

    createService(
      [biosci201, biosci202],
      [
        {
          type: RequirementType.Points,
          required: 60,
          departments: ["Biological Sciences"],
          stage: 2,
        },
      ]
    );

    const result = await service.setCourse();
    const tempCards = (state.semesters || []).flatMap((semester: any) =>
      Array.isArray(semester.tempCards) ? semester.tempCards : []
    );

    expect(courseService.setCourseDb).not.toHaveBeenCalled();
    expect(tempCards.length).toBe(4);
    tempCards.forEach((card: any) => {
      expect(card.department).toBe("Biological Sciences");
      expect(card.level).toBe(2);
      expect(card.paper).toBeNull();
    });
    expect(result.status).toBe("ok");
  });

  it("creates a fallback temp card for unconstrained degree points requirements", async () => {
    const biosci101: ICourse = {
      id: 35,
      generatedId: 6035,
      name: "BIOSCI101",
      desc: "Life! Origins and Mechanisms",
      faculties: ["Science"],
      department: ["Biological Sciences"],
      points: 15,
      stage: 1,
    };

    createService(
      [biosci101],
      [
        {
          type: RequirementType.Points,
          required: 15,
        },
      ]
    );

    const result = await service.setCourse();
    const tempCards = (state.semesters || []).flatMap((semester: any) =>
      Array.isArray(semester.tempCards) ? semester.tempCards : []
    );

    expect(courseService.setCourseDb).not.toHaveBeenCalled();
    expect(tempCards.length).toBe(1);
    expect(tempCards[0].paper).toBeNull();
    expect(tempCards[0].department).toBeNull();
    expect(tempCards[0].faculty).toBeNull();
    expect(tempCards[0].level).toBeNull();
    expect(tempCards[0].stages).toBeNull();
    expect(result.status).toBe("ok");
  });

  it("reuses specific temp cards when satisfying overlapping total-points requirements", async () => {
    const biosci201: ICourse = {
      id: 36,
      generatedId: 7036,
      name: "BIOSCI201",
      desc: "Cell biology",
      faculties: ["Science"],
      department: ["Biological Sciences"],
      points: 15,
      stage: 2,
    };

    createService(
      [biosci201],
      [
        {
          type: RequirementType.Points,
          required: 30,
          departments: ["Biological Sciences"],
        },
        {
          type: RequirementType.Points,
          required: 30,
        },
      ]
    );

    await service.setCourse();

    const tempCards = (state.semesters || []).flatMap((semester: any) =>
      Array.isArray(semester.tempCards) ? semester.tempCards : []
    );
    const genericCards = tempCards.filter(
      (card: any) =>
        card.department === null &&
        card.departments === null &&
        card.faculty === null &&
        card.faculties === null &&
        card.level === null &&
        card.stages === null
    );

    expect(tempCards.length).toBe(2);
    expect(genericCards.length).toBe(0);
  });

  it("reuses stage-range science temp cards for broader science requirements", async () => {
    const biosci201: ICourse = {
      id: 37,
      generatedId: 7037,
      name: "BIOSCI201",
      desc: "Cell biology",
      faculties: ["Science"],
      department: ["Biological Sciences"],
      points: 15,
      stage: 2,
    };
    const biosci301: ICourse = {
      id: 38,
      generatedId: 7038,
      name: "BIOSCI301",
      desc: "Advanced stage 3",
      faculties: ["Science"],
      department: ["Biological Sciences"],
      points: 15,
      stage: 3,
    };
    const biosci401: ICourse = {
      id: 39,
      generatedId: 7039,
      name: "BIOSCI401",
      desc: "Advanced stage 4",
      faculties: ["Science"],
      department: ["Biological Sciences"],
      points: 15,
      stage: 4,
    };
    const biosci701: ICourse = {
      id: 40,
      generatedId: 7040,
      name: "BIOSCI701",
      desc: "Advanced stage 7",
      faculties: ["Science"],
      department: ["Biological Sciences"],
      points: 15,
      stage: 7,
    };

    createService(
      [biosci201, biosci301, biosci401, biosci701],
      [
        {
          type: RequirementType.Points,
          required: 15,
          faculties: ["Science"],
          stages: [2, 3, 4, 7],
        },
        {
          type: RequirementType.Points,
          required: 15,
          faculties: ["Science"],
        },
      ]
    );

    await service.setCourse();

    const tempCards = (state.semesters || []).flatMap((semester: any) =>
      Array.isArray(semester.tempCards) ? semester.tempCards : []
    );
    const stageRangeCards = tempCards.filter(
      (card: any) =>
        Array.isArray(card.stages) &&
        card.stages.length === 2 &&
        card.stages.includes(2) &&
        card.stages.includes(3)
    );
    const genericScienceCards = tempCards.filter(
      (card: any) =>
        !Array.isArray(card.stages) &&
        card.level === null &&
        card.faculty === "Science"
    );

    expect(tempCards.length).toBe(1);
    expect(stageRangeCards.length).toBe(1);
    expect(genericScienceCards.length).toBe(0);
  });

  it("does not duplicate auto-generated temp cards on repeated DO IT FOR ME runs", async () => {
    const biosci201: ICourse = {
      id: 33,
      generatedId: 6033,
      name: "BIOSCI201",
      desc: "Cell biology",
      faculties: ["Science"],
      department: ["Biological Sciences"],
      points: 15,
      stage: 2,
    };

    const existingCard: any = {
      paper: null,
      points: 15,
      value: 15,
      generatedId: 800001,
      department: "BIOLOGICAL SCIENCES",
      departments: ["BIOLOGICAL SCIENCES"],
      faculty: null,
      faculties: null,
      level: 2,
      stages: null,
      autoRequirementKey: "0|30|BIOLOGICAL SCIENCES||2||",
    };

    createService(
      [biosci201],
      [
        {
          type: RequirementType.Points,
          required: 30,
          departments: ["Biological Sciences"],
          stage: 2,
        },
      ],
      [],
      [{ year: 2024, period: 1, both: "2024 1", tempCards: [existingCard] }]
    );

    await service.setCourse();
    await service.setCourse();

    const tempCards = (state.semesters || []).flatMap((semester: any) =>
      Array.isArray(semester.tempCards) ? semester.tempCards : []
    );
    expect(tempCards.length).toBe(2);
  });

  it("marks general education temp cards with the general filter", async () => {
    const genEdCourse: ICourse = {
      id: 34,
      generatedId: 6034,
      name: "ARTSGEN101G",
      desc: "General education paper",
      faculties: ["Arts"],
      department: ["Arts General"],
      points: 15,
      stage: 1,
      general: true,
    };

    createService(
      [genEdCourse],
      [
        {
          type: RequirementType.Points,
          required: 30,
          flags: ["General"],
        },
      ]
    );

    await service.setCourse();

    const tempCards = (state.semesters || []).flatMap((semester: any) =>
      Array.isArray(semester.tempCards) ? semester.tempCards : []
    );

    expect(tempCards.length).toBe(2);
    tempCards.forEach((card: any) => {
      expect(card.general).toBeTrue();
    });
  });

  it("plans against conjoint requirements so conjoint bars can be fulfilled", async () => {
    const history200: ICourse = {
      id: 60,
      generatedId: 9060,
      name: "HISTORY200",
      desc: "History paper",
      faculties: ["Arts"],
      department: ["History"],
      points: 15,
      stage: 2,
    };

    createService(
      [history200],
      [],
      [],
      [],
      [
        {
          type: RequirementType.Points,
          required: 30,
          departments: ["History"],
        },
      ]
    );

    const result = await service.setCourse();
    const tempCards = (state.semesters || []).flatMap((semester: any) =>
      Array.isArray(semester.tempCards) ? semester.tempCards : []
    );

    expect(tempCards.length).toBe(2);
    expect(result.status).toBe("ok");
  });

  it("returns a warning when there are no selected requirements to fulfil", async () => {
    const easy: ICourse = {
      id: 50,
      generatedId: 9050,
      name: "EASY100",
      desc: "Easy paper",
      faculties: ["Arts"],
      department: ["History"],
      points: 15,
      stage: 1,
    };

    createService([easy], []);

    const result = await service.setCourse();

    expect(result.status).toBe("warning");
    expect(result.addedCourses).toBe(0);
    expect(courseService.setCourseDb).not.toHaveBeenCalled();
  });
});
