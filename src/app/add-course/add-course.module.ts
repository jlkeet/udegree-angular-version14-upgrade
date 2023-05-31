import { NgModule } from '@angular/core';
import { CourseCard } from './course-card.component';
import { CourseFilter } from './course-filter.component';
import { AddCoursePanel } from './courses-panel.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { MatExpansionModule } from '@angular/material/expansion';
import { AddCourseService } from './add-course.service';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [
    ReactiveFormsModule,
    FormsModule,
    InfiniteScrollModule,
    CommonModule,
    MatOptionModule,
    MatSelectModule,
    MatFormFieldModule,
    MatExpansionModule,
    MatCheckboxModule,

  ],
  declarations: [
    CourseFilter,
    CourseCard,
    AddCoursePanel

  ],
  providers: [
    AddCourseService
    ],
  exports: [
    CourseFilter,
    AddCoursePanel,
    CourseCard,
  ],
})
export class AddCourseModule { }
