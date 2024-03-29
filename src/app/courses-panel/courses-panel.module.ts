import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoursesPanel } from './courses-panel.component';
import { SemesterPanel } from './semester-panel.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatExpansionModule } from '@angular/material/expansion';
import { DragulaModule } from 'ng2-dragula';
import { CommonCourseModule } from '../common/common-course.module';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';



@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatToolbarModule,
    MatExpansionModule,
    DragulaModule,
    CommonCourseModule,
    RouterLink,
    MatFormFieldModule,
    MatSelectModule,
    NgbDropdownModule
  ],
  declarations: [
    CoursesPanel,
    SemesterPanel,
  ],
  providers: [

    ],
  exports: [
    CoursesPanel,
    ]
})
export class CoursesPanelModule { }
