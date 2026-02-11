import { ICourse } from "../interfaces";
import { CourseService } from "./courses";

describe("CourseService semester sync", () => {
  function createHarness(initialSemesters: any[], initialCourses: ICourse[]) {
    const state: any = {
      semesters: initialSemesters,
      courses: initialCourses,
    };
    const updates: any[] = [];

    const harness: any = {
      semesters: [],
      storeHelper: {
        current: (prop: "semesters" | "courses") => state[prop],
        update: (prop: string, value: any) => {
          state[prop] = value;
          updates.push({ prop, value });
        },
      },
    };

    harness.normalizeSemester = (CourseService.prototype as any).normalizeSemester;
    harness.mergeSemesters = (CourseService.prototype as any).mergeSemesters;
    harness.sameSemesterSet = (CourseService.prototype as any).sameSemesterSet;

    return { harness, state, updates };
  }

  it("rebuilds missing semesters from planned courses", () => {
    const { harness, state, updates } = createHarness([], [
      { name: "BIOSCI101", year: 2024, period: 1 },
      { name: "CHEM110", year: 2024, period: 2 },
      { name: "CHEM120", year: 2024, period: 2 },
    ]);

    const added = (CourseService.prototype as any).syncSemestersWithPlannedCourses.call(
      harness
    );

    expect(added).toBe(2);
    expect(updates.length).toBe(1);
    expect(state.semesters).toEqual([
      { year: 2024, period: 1, both: "2024 1", tempCards: [] },
      { year: 2024, period: 2, both: "2024 2", tempCards: [] },
    ]);
  });

  it("preserves existing semester temp cards when merging with planned courses", () => {
    const existingTempCards = [{ generatedId: 123 }];
    const { harness, state, updates } = createHarness(
      [{ year: 2024, period: 1, both: "2024 1", tempCards: existingTempCards }],
      [{ name: "BIOSCI101", year: 2024, period: 1 }]
    );

    const added = (CourseService.prototype as any).syncSemestersWithPlannedCourses.call(
      harness
    );

    expect(added).toBe(0);
    expect(updates.length).toBe(0);
    expect(state.semesters[0].tempCards).toEqual(existingTempCards);
  });
});
