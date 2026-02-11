import { ICourse } from "../interfaces";
import { RequirementType } from "../models/requirement.enum";
import { RequirementService } from "../services/requirement.service";
import { PlannerContainer } from "./planner.container";

describe("PlannerContainer", () => {
  let container: PlannerContainer;

  function createContainer() {
    const requirementService = new RequirementService({} as any, {} as any);
    container = new PlannerContainer(
      requirementService as any,
      {} as any,
      {
        moveCourse: (): void => undefined,
        deselectCourseByName: (): void => undefined,
        changeStatus: (): void => undefined,
        changeGrade: (): void => undefined,
      } as any,
      { mobile: false } as any,
      {} as any,
      { setCourse: (): void => undefined } as any,
      { navigate: (): void => undefined } as any
    );
  }

  function buildCourse(
    name: string,
    year: number,
    period: number,
    points: number,
    department: string
  ): ICourse {
    return {
      id: Math.floor(Math.random() * 10000),
      generatedId: Math.floor(Math.random() * 10000),
      name,
      title: name,
      desc: name,
      faculties: ["Arts"],
      department: [department],
      points,
      stage: Number(name.replace(/^\D+/g, "")[0]),
      year,
      period: period as any,
    };
  }

  it("flags a prerequisite error when qualifying points are only in a later semester", () => {
    createContainer();

    const politics209 = buildCourse("POLITICS209", 2025, 2, 15, "Politics");
    politics209.requirements = [
      {
        type: RequirementType.Points,
        required: 15,
        departments: ["Politics"],
        stage: 1,
      },
    ];

    const politics106 = buildCourse("POLITICS106", 2026, 1, 15, "Politics");

    container.planned = [politics209, politics106];
    container.handleCourseClicked({ course: politics209 } as any);

    expect(container.messages.length).toBe(1);
    expect(container.messageRequirements.length).toBe(1);
  });

  it("does not flag the error when qualifying points are completed beforehand", () => {
    createContainer();

    const politics209 = buildCourse("POLITICS209", 2025, 2, 15, "Politics");
    politics209.requirements = [
      {
        type: RequirementType.Points,
        required: 15,
        departments: ["Politics"],
        stage: 1,
      },
    ];

    const politics106 = buildCourse("POLITICS106", 2025, 1, 15, "Politics");

    container.planned = [politics106, politics209];
    container.handleCourseClicked({ course: politics209 } as any);

    expect(container.messages.length).toBe(0);
    expect(container.messageRequirements.length).toBe(0);
  });
});
