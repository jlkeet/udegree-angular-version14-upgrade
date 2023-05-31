import { NgModule } from '@angular/core';
import { CourseDetails } from './course-details.component';
import { CourseDraggable } from './course-draggable.component';
import { CourseStatusBar } from './course-status-bar.component';
import { Course } from './course.component';
import { CourseDeleteIcon } from './course-delete-icon.component';
import { NotificationIconComponent } from './notification-icon.component';
import { NotificationListComponent } from './notification-list.component';
import { TitlePanel } from './title-panel.component';
import { ToggleSwitchComponent } from './ios-toggle-switch.component';
import { NotificationComponent } from './notification.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';




@NgModule({
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,


  ],
  declarations: [
    CourseDeleteIcon,
    CourseDetails,
    CourseDraggable,
    CourseStatusBar,
    Course,
    ToggleSwitchComponent,
    NotificationIconComponent,
    NotificationListComponent,
    NotificationComponent,
    TitlePanel,
    
  ],
  providers: [

    ],
  exports: [
    CourseDetails,
    NotificationIconComponent,
    NotificationListComponent,
    CourseDraggable,

  ]
})
export class CommonCourseModule { }
