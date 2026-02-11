# UdegreeMasterVersion14

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 14.2.11.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Playwright smoke tests are configured for the planner flow.

1. Capture auth state (one-time per account): `npm run e2e:auth`
2. Run planner smoke checks: `npm run e2e:smoke`
3. Run all e2e specs: `npm run e2e`

Optional env vars for non-interactive auth setup:
- `UDEGREE_E2E_EMAIL`
- `UDEGREE_E2E_PASSWORD`

Auth state is stored in `e2e/.auth/user.json` and is ignored by git.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
