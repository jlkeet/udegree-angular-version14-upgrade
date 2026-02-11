import { ICourse } from "../interfaces";
import { RequirementType } from "../models/requirement.enum";
import { IRequirement, RequirementService } from "./requirement.service";

describe("RequirementService", () => {
  let service: RequirementService;

  beforeEach(() => {
    service = new RequirementService({} as any, {} as any);
  });

  function buildCourse(
    name: string,
    points: number,
    department: string,
    stage: number
  ): ICourse {
    return {
      id: Math.floor(Math.random() * 100000),
      generatedId: Math.floor(Math.random() * 100000),
      name,
      desc: "test",
      faculties: ["Arts"],
      department: [department],
      points,
      stage,
    };
  }

  it("evaluates complex rules using the complex required count", () => {
    const complexRequirement: IRequirement = {
      type: RequirementType.Papers,
      required: 2,
      complex: [
        {
          type: RequirementType.Points,
          required: 30,
          departments: ["Anthropology"],
        },
        {
          type: RequirementType.Points,
          required: 60,
        },
      ],
    };

    const plannedThirtyAnthro = [
      buildCourse("ANTHRO100", 15, "Anthropology", 1),
      buildCourse("ANTHRO101", 15, "Anthropology", 1),
    ];

    const plannedSixtyTotal = plannedThirtyAnthro.concat([
      buildCourse("HISTORY100", 15, "History", 1),
      buildCourse("ECON100", 15, "Economics", 1),
    ]);

    expect(
      service.requirementFilled(complexRequirement, plannedThirtyAnthro)
    ).toBeFalse();
    expect(
      service.requirementFilled(complexRequirement, plannedSixtyTotal)
    ).toBeTrue();
  });

  it("renders complex requirement strings as a single string", () => {
    const requirement: IRequirement = {
      type: RequirementType.Papers,
      required: 1,
      complex: [
        {
          type: RequirementType.Papers,
          required: 1,
          papers: ["ANTHRO100"],
        },
        {
          type: RequirementType.Papers,
          required: 1,
          papers: ["ANTHRO101"],
        },
      ],
    };

    const rendered = service.toString(requirement, false);

    expect(typeof rendered).toBe("string");
    expect(rendered).toContain("Requires");
  });
});
