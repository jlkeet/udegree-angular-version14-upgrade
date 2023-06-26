import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { UserContainer } from './user-status.component';
import { UserDialogComponent } from './user-dialog-component';
import { MatDialogModule } from '@angular/material/dialog';
import { AvatarModule } from 'ngx-avatars';
import { CommonCourseModule } from '../common/common-course.module';
import { ContainerModule } from '../containers/container.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';


@NgModule({
  imports: [
    BrowserModule,
    MatDialogModule,
    AvatarModule,
    CommonCourseModule,
    ContainerModule,
    FormsModule,
    ReactiveFormsModule,
    NgbDropdownModule,



],
  declarations: [
    UserContainer,
    UserDialogComponent,
],
  exports: [
    UserContainer
],
})
export class UserStatusModule {}