import { NgModule } from '@angular/core';
import { CourseCard } from './course-card.component';
import { CourseFilter } from './course-filter.component';
import { AddCoursePanel } from './add-courses-panel.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { AddCourseService } from './add-course.service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { CommonModule } from '@angular/common';
import { AddCourseRoutingModule } from './add-course-routing.module';
import { AddCourseContainer } from './add-course-container';
import { ContainerModule } from '../containers/container.module';
import { CommonCourseModule } from '../common/common-course.module';
import { MatToolbarModule } from '@angular/material/toolbar';

@NgModule({
  imports: [
    ReactiveFormsModule,
    FormsModule,
    InfiniteScrollModule,
    CommonModule,
    MatSelectModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatInputModule,
    MatToolbarModule,
    AddCourseRoutingModule,
    ContainerModule,
    CommonCourseModule
  ],
  declarations: [
    CourseFilter,
    CourseCard,
    AddCoursePanel,
    AddCourseContainer,
  ],
  providers: [
    AddCourseService,
    ],
  exports: [
    CourseFilter,
    AddCoursePanel,
    CourseCard,
  ],
})
export class AddCourseModule { }
