import { Injectable } from '@angular/core';
import { State, Store } from '../app.store';
import { ICourse } from '../interfaces';

/**
 * @ngdoc service
 * @name StoreHelper
 * @description Helper class to ensure we always pass new refernced to the store.
 *
 * ## Notes
 * This is because we are using asObservable().distinctUntilChanged()
 * See: https://www.learnrxjs.io/operators/filtering/distinctuntilchanged.html
 */
@Injectable()
export class StoreHelper {
  constructor(private store: Store) {}

  public update(prop: any, state: any) {
    // console.log('update called from', new Error().stack);
    const currentState = this.store.getState();
    this.store.setState(Object.assign({}, currentState, { [prop]: state }));
  }

  public current(prop: keyof State) {
    const currentState = this.store.getState();
    return currentState[prop];
  }

  public add(prop: keyof State, state: ICourse) {
    // console.log('add called from', new Error().stack);
    const currentState = this.store.getState();
    const collection = currentState[prop];
    this.store.setState(
      Object.assign({}, currentState, { [prop]: [...collection, state] })
    );
  }

  public addIfNotExists(prop: keyof State, state: { id: any; }) {
    const currentState = this.store.getState();
    const collection = currentState[prop];

    const index = collection.findIndex((item: { id: any; }) => {
      return item.id === state.id;
    });

    if (index < 0) {
      this.store.setState(
        Object.assign({}, currentState, { [prop]: [...collection, state] })
      );
    }
  }

  public findAndUpdate(prop: keyof State, state: ICourse) {
    const currentState = this.store.getState();
    const collection = currentState[prop];
    if (state.generatedId) {
    this.store.setState(
      Object.assign({}, currentState, {
        [prop]: collection.map((item: { id: number; generatedId: number; }) => {
          // skip if this is not the droid we are looking for
          if (item.id !== state.id) {
            return item;
          }
          if (item?.generatedId !== state?.generatedId) {
            return item;
          }
          // if it is, update it
          return Object.assign({}, item, state);
        })
      })
    );
    } else {
    }
  }

  public findAndDelete(prop: keyof State, course: any) {
  
    const currentState = this.store.getState();
    const collection = currentState[prop];
    this.store.setState(
      Object.assign({}, currentState, {
        [prop]: collection.filter((item: { generatedId: any; }) => item.generatedId !== course.generatedId)
      })
    );
  }
  
  public deleteAll() {
    this.store.purge()
  }

  public deleteTempCard(tempCard: any) {
    const currentState = this.store.getState();
    const semester = currentState.semesters;

    const updatedSemester = semester.filter((item: any) => item.generatedId !== tempCard.generatedId);

    this.store.setState(
      Object.assign({}, currentState, {
        semester: updatedSemester
      })
    );
  }

}
