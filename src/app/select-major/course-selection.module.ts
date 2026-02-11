import { NgModule } from '@angular/core';
import { DegreeSelection } from './degree-select.component';
import { DepartmentList } from './department-list.component';
import { FacultyList } from './faculty-list.component';
import { ModuleList } from './module-list.component';
import { PathwayList } from './pathway-list.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';


@NgModule({
  imports: [
    MatToolbarModule,
    MatFormFieldModule,
    MatSelectModule,
    CommonModule,
    

  ],
  declarations: [

    DegreeSelection,
    DepartmentList,
    FacultyList,
    ModuleList,
    PathwayList,

  ],
  providers: [

    ],
    exports: [
        DegreeSelection,
        DepartmentList,
        FacultyList,
        ModuleList,
        PathwayList,
    ]
})
export class CourseSelectionModule { }
