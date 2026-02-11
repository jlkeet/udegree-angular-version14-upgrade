import { Store } from "../app.store";
import { StoreHelper } from "./store-helper";

describe("StoreHelper tempCard deletion", () => {
  function createStoreHelperWithSemesters(semesters: any[]) {
    const store = new Store();
    const currentState: any = store.getState();
    store.setState(
      Object.assign({}, currentState, {
        semesters,
      })
    );

    return {
      store,
      helper: new StoreHelper(store),
    };
  }

  it("removes tempCards when target id is a string and stored id is numeric", () => {
    const { store, helper } = createStoreHelperWithSemesters([
      {
        year: 2024,
        period: 1,
        both: "2024 1",
        tempCards: [{ generatedId: 101 }, { generatedId: 202 }],
      },
    ]);

    helper.deleteTempCard({ generatedId: "101" });

    const semesters: any[] = store.getState().semesters as any[];
    expect(semesters[0].tempCards).toEqual([{ generatedId: 202 }]);
  });

  it("removes tempCards when target id is numeric and stored id is a string", () => {
    const { store, helper } = createStoreHelperWithSemesters([
      {
        year: 2024,
        period: 1,
        both: "2024 1",
        tempCards: [{ generatedId: "303" }, { generatedId: "404" }],
      },
    ]);

    helper.deleteTempCard({ generatedId: 303 });

    const semesters: any[] = store.getState().semesters as any[];
    expect(semesters[0].tempCards).toEqual([{ generatedId: "404" }]);
  });
});
