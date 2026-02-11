import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
// import { AddCoursePanel } from './add-courses-panel.component';
import { CourseCard } from './course-card.component';
import { CourseFilter } from './course-filter.component';
import { AddCourseContainer } from './add-course-container';


export const routes: Routes = [
  { path: '', component: AddCourseContainer },
  { path: 'card', component: CourseCard },
  { path: 'filter', component: CourseFilter}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AddCourseRoutingModule { }
