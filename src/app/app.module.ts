/* Angular */
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

/* Firebase */
import { FirestoreModule } from '@angular/fire/firestore';
import { FirebaseUserModel } from './core/user.model';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';


import { environment } from '../environments/environment';
import { AuthGuard } from './core/auth.guard';
import { UserService } from './core/user.service';

/* Third Party */
import { SplashScreenComponent } from './splash-screen/splash-screen-component';

/*
 * Platform and Environment providers/directives/pipes
 */

import { AppRoutingModule } from './app-routing.module';
/* App */
import { App } from './app.component';
import { AppHeader } from './app.header.component';
import { AppReadyEvent } from './app.ready.event';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InteralStateType } from './app.service';
import { Store } from './app.store';
import { DegreeSelection } from './select-major';
import { ConjointService, CourseEventService, CourseService, DepartmentService, ErrorsChangedEvent, FacultyService, IRequirement, LocationRef, ModuleService, MovedEvent, PathwayService, RemovedEvent, RequirementService, StatusEvent, StoreHelper, WindowRef } from './services';
import { UserContainer } from './user/user-status.component';
import { FirebaseDbService } from './core/firebase.db.service';

import { GoogleAnalyticsService } from './services/google-analytics.service';
import { ProgressPanelService } from './services/progress-panel.service';
import { AdminExport } from './admin-export/admin-export.component';
import { AdminExportService } from './services/admin-export.service';
import { ErrorRequirementService } from './services/error.requirement.service';
import { SamplePlanService } from './services/sample-plan.service';
import { FooterModule } from './footer/footer.module';
import { LoginModule } from './login/login.module';
import { RegisterModule } from './register/register.module';
import { ProgressPanelModule } from './progress-panel/progress-panel.module';
import { CourseSelectionModule } from './select-major/course-selection.module';
import { UserStatusModule } from './user/user-status.module';

// Application wide providers
const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  Store,
  AppState,
  AppReadyEvent
];

type StoreType = {
  state: InteralStateType;
  restoreInputValues: () => void;
  disposeOldHosts: () => void;
};

/**
 * `AppModule` is the main entry point into Angular's bootstraping process
 */
@NgModule({
  bootstrap: [App],
  declarations: [
    App,
    AppHeader,
    SplashScreenComponent,
    AdminExport,
  ],
  imports: [
    AppRoutingModule,
    MatToolbarModule,
    HttpClientModule,
    BrowserAnimationsModule,
    FirestoreModule,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideDatabase(() => getDatabase()),
    FooterModule,
    LoginModule,
    RegisterModule,
    ProgressPanelModule,
    CourseSelectionModule,
    UserStatusModule,
  ],
  providers: [
    AppHeader,
    AdminExportService,
    StoreHelper,
    Store,
    UserService,
    RequirementService,
    DepartmentService,
    FacultyService,
    CourseService,
    ErrorsChangedEvent,
    FirebaseDbService,
    FirebaseUserModel,
    SamplePlanService,
    ProgressPanelService,
    ModuleService,
    CourseEventService,
    GoogleAnalyticsService,
    UserContainer,
    LocationRef,
    DegreeSelection,
    ConjointService,
    PathwayService,
    AuthGuard,
    ErrorRequirementService,
  ],
})
export class AppModule {
 
}
