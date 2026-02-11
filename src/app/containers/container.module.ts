import { NgModule } from '@angular/core';

import { LeftPanelContainer } from './left.container';
import { NotificationContainer } from './notification.container';
import { PlannerContainer } from './planner.container';
import { PlannerContainerMobile } from './planner.container-mobile';
import { SelectDegreeContainer } from './select-degree.container';
import { SelectMajorContainer } from './select-major.container';
import { CommonCourseModule } from '../common/common-course.module';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CoursesPanelModule } from '../courses-panel/courses-panel.module';
import { ProgressPanelModule } from '../progress-panel/progress-panel.module';
import { MatTabsModule } from '@angular/material/tabs';
import { CourseSelectionModule } from '../select-major/course-selection.module';
import { CommonModule } from '@angular/common';
import { MobileService } from '../services/mobile.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';


@NgModule({
  imports: [
    CommonCourseModule,
    MatToolbarModule,
    MatTabsModule,
    CoursesPanelModule,
    ProgressPanelModule,
    CourseSelectionModule,
    CommonModule,
    MatFormFieldModule,
    MatSelectModule,
    RouterLink
  ],
  declarations: [
    LeftPanelContainer,
    NotificationContainer,
    PlannerContainer,
    PlannerContainerMobile,
    SelectDegreeContainer,
    SelectMajorContainer
    
  ],
  providers: [
    MobileService
    ],
  exports: [
    NotificationContainer,
    LeftPanelContainer,
    
  ]
})
export class ContainerModule { }
