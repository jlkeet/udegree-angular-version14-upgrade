/* Angular */
import 'reflect-metadata'
import { HttpClientModule } from '@angular/common/http';
import { ApplicationRef, ChangeDetectorRef, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import {
  createInputTransfer,
  createNewHosts,
  removeNgStyles
} from '@angularclass/hmr';
import { HammerGestureConfig , HAMMER_GESTURE_CONFIG } from '@angular/platform-browser';
// import {NgxLongClickModule} from 'ngx-long-click';

/* Firebase */

import { FirestoreModule } from '@angular/fire/firestore';
import { Storage } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { FirebaseUserModel } from './core/user.model';
import { Database, getDatabase, provideDatabase } from '@angular/fire/database';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideFirebaseApp, getApp, initializeApp } from '@angular/fire/app';


import { environment } from '../environments/environment';
// import { LoginComponent } from './login/login.component';
import { UserComponent } from './user/user.component';
import { RegisterComponent } from './register/register.component';
import { UserResolver } from './user/user.resolver';
import { AuthGuard } from './core/auth.guard';
import { AuthService } from './core/auth.service';
import { UserService } from './core/user.service';
import { ReactiveFormsModule } from '@angular/forms';

/* Third Party */
import { DragulaModule } from 'ng2-dragula';
import { DragulaService } from 'ng2-dragula';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
// import { NgxInfiniteScrollerModule } from 'ngx-infinite-scroller';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MultiSelectModule } from 'primeng/multiselect';
import Html2canvas from 'html2canvas';

import { SplashScreenComponent } from './splash-screen/splash-screen-component';
import { AvatarModule } from 'ngx-avatars';
import { MatExpansionModule } from '@angular/material/expansion';

/*
 * Platform and Environment providers/directives/pipes
 */

import { AppRoutingModule } from './app-routing.module';
import { ENV_PROVIDERS } from '../environments/environment.prod'

/* App */
import {
  AddCoursePanel,
  AddCourseService,
  CourseCard
} from './add-course';
// import { CourseFilter } from './add-course/course-filter.component';
import { App } from './app.component';
import { AppHeader } from './app.header.component';
import { AppReadyEvent } from './app.ready.event';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InteralStateType } from './app.service';
import { Store } from './app.store';
import * as common from './common';
import {
  AddCourseContainer,
  LeftPanelContainer,
  // NotificationContainer,
  PlannerContainer,
  PlannerContainerMobile,
  // SelectDegreeContainer,
  // SelectMajorContainer
} from './containers';
import {
  CoursesPanel,
  SemesterPanel
} from './courses-panel';
import { NoContent } from './no-content';
import * as progress from './progress-panel';
import { DegreeSelection, DepartmentList, FacultyList, PathwayList, ModuleList } from './select-major';
import { ClickedEvent, ConjointService, CourseEventService, CourseService, DepartmentService, ErrorsChangedEvent, FacultyService, IRequirement, LocationRef, ModuleService, MovedEvent, PathwayService, RemovedEvent, RequirementService, StatusEvent, StoreHelper, WindowRef } from './services';
import { UserContainer } from './user/user-status.component';
import { ExportButton } from './courses-panel/export-button.component';
import { FirebaseDbService } from './core/firebase.db.service';
import { ProgressBarMultiContainer, ProgressPanel, ProgressWidthDirective } from './progress-panel';
import { ProgressBarMulti } from './progress-panel';
import { CourseDialogComponent } from './courses-panel/course-dialog.component';
import { ProgressDialogComponent } from './progress-panel/progress-dialog.component'
import { UserDialogComponent } from './user/user-dialog-component';
import { PrivacyContainer } from './privacy-policy/privacy-policy.component';
// import { FooterComponent } from './footer/footer.component';
import { Course, CourseDeleteIcon, CourseDetails, CourseDraggable, CourseStatusBar, NotificationComponent, NotificationIconComponent, NotificationListComponent, TitlePanel, ToggleSwitchComponent } from './common';
import { ExplorerComponent } from './explorer/explorer.component';

import { GoogleAnalyticsService } from './services/google-analytics.service';
import { ProgressPanelService } from './services/progress-panel.service';
import { AdminExport } from './admin-export/admin-export.component';
import { AdminExportService } from './services/admin-export.service';
import { ErrorRequirementService } from './services/error.requirement.service';
import { SamplePlanService } from './services/sample-plan.service';
import { ItemComponent } from './explorer/item.component';
import { FooterModule } from './footer/footer.module';
import { AddCourseModule } from './add-course/add-course.module';
import { ContainerModule } from './containers/container.module';
import { CommonCourseModule } from './common/common-course.module';
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

// const avatarSourcesOrder = [AvatarSource.FACEBOOK, AvatarSource.GOOGLE, AvatarSource.CUSTOM, AvatarSource.INITIALS];

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [App],
  declarations: [
    App,
    AppHeader,
    SplashScreenComponent,
    // CourseFilter,
    // UserContainer,
    // UserComponent,
    // UserDialogComponent,
    // NotificationContainer,
    // NotificationIconComponent,
    // NotificationComponent,
    // NotificationListComponent,
    AdminExport,
    // LeftPanelContainer,
    // PlannerContainer,
    // PlannerContainerMobile,
    // AddCoursePanel,
    // CourseCard,

    // ProgressPanel,
    // ProgressBarMultiContainer,
    // ProgressBarMulti,
    // ProgressWidthDirective,

    // SemesterPanel,

    // CourseDetails,
    // CourseDeleteIcon,
    // CourseDialogComponent,
    // SelectDegreeContainer,
    // SelectMajorContainer,
    // CourseDraggable,
    // Course,
    // ProgressDialogComponent,
    // CourseStatusBar,
    // ToggleSwitchComponent,
    // AddCourseContainer,
    // CoursesPanel,
    // DegreeSelection,
    // DepartmentList,
    // FacultyList,
    // ModuleList,
    // PathwayList,

    // ExportButton,
    ExplorerComponent,
    ItemComponent,
    // FooterComponent,
    // LoginComponent,
    // RegisterComponent,

  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatOptionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatToolbarModule,
    MatDialogModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatTabsModule,
    MatInputModule,
    MatButtonModule,
    MatOptionModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatToolbarModule,
    MatToolbarModule,
    MatSidenavModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatDialogModule,
    MatTabsModule,
    MatRadioModule,
    MatCheckboxModule,
    MatIconModule,
    MatListModule,

    AvatarModule,
    NgbModule,
    HttpClientModule,



    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    // NotificationContainer

    DragulaModule,
    FirestoreModule,
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    provideDatabase(() => getDatabase()),
    // CourseCard

    InfiniteScrollModule,
    FooterModule,
    AddCourseModule,
    ContainerModule,
    CommonCourseModule,
    LoginModule,
    RegisterModule,
    ProgressPanelModule,
    CourseSelectionModule,
    UserStatusModule


  ],
  providers: [
    // NotificationContainer,
    AuthService,
    AppHeader,
    AdminExportService,
    StoreHelper,
    Store,
    UserService,
    // SelectDegreeContainer,
    // SelectMajorContainer,
    RequirementService,
    DepartmentService,
    FacultyService,
    CourseService,
    ErrorsChangedEvent,
    FirebaseDbService,
    FirebaseUserModel,
    SamplePlanService,
    ProgressPanelService,
    // AddCourseContainer,
    AddCourseService,
    ModuleService,
    CourseEventService,
    GoogleAnalyticsService,
    UserContainer,
    LocationRef,
    DegreeSelection,
    ConjointService,
    PathwayService,
    // LeftPanelContainer,
    AuthGuard,
    UserResolver,
    ErrorRequirementService,
    



  ],
   entryComponents: [CourseDialogComponent, ProgressDialogComponent, UserDialogComponent],
})
export class AppModule {
 
}
