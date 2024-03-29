import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Observable } from 'rxjs';
import { ICourse } from './interfaces';
import {
  Message,
  SemesterModel
} from './models';
import { distinctUntilChanged } from 'rxjs/operators';


export interface State {
  degreeType: string;
  courses: ICourse[];
  faculty: any;
  conjoint: any;
  majors: any[];
  secondMajors: any[];
  thirdMajors: any[];
  pathways: any[];
  modules: any[];
  secondModules: any[];
  majorSelected: boolean;
  minor: any;
  messages: Message[];
  semesters: any[];
  summerSchools: boolean[];
  page: any;
  collapsed: boolean;
}

const defaultState: any = {
  courses: [],
  faculty: null,
  conjoint: null,
  majorSelected: false,
  majors: [null, null],
  secondMajors: [null, null],
  thirdMajors: [null, null],
  pathways: [null, null],
  modules: [null, null],
  secondModules: [null, null],
  messages: [],
  minor: null,
  page: false,
  semesters: [],
  slogan: 'Degree planning made easy',
  summerSchools: [false, false, false, false]
};

/**
 * @ngdoc service
 * @name Store
 * @description The store for our application.
 * Lightweight Reactive Store. We use RxJS Behaviour Subject to act Reactively
 *
 * ## Notes
 */

let _store = new BehaviorSubject<State>(defaultState);


@Injectable()
export class Store {
  private _store = _store;
  public changes: Observable<State> = this._store.asObservable().pipe(distinctUntilChanged());

  public setState(state: State) {
    this._store.next(state);
  }

  public getState(): State {
    return this._store.value;
  }

  public purge() {
    this._store.next(defaultState);
  }
}
