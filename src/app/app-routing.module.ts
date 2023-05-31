import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddCourseContainer, PlannerContainer, SelectDegreeContainer, SelectMajorContainer } from './containers';
import { NoContent } from './no-content';
import { LoginComponent } from './login/login.component';
import { UserComponent } from './user/user.component';
import { RegisterComponent } from './register/register.component';
import { UserResolver } from './user/user.resolver';
import { AuthGuard } from './core/auth.guard';
import { PrivacyContainer } from './privacy-policy/privacy-policy.component';
import { ExplorerComponent } from './explorer/explorer.component';



export const routes: Routes = [
  { path: 'planner', component: PlannerContainer },
  { path: 'privacy', component: PrivacyContainer },
  { path: 'degree', component: SelectDegreeContainer },
  { path: 'major', component: SelectMajorContainer },
  { path: 'add', component: AddCourseContainer },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [AuthGuard] },
  { path: 'user', component: UserComponent,  resolve: { data: UserResolver}},
  { path: 'explorer', component: ExplorerComponent },
  { path: '',      redirectTo: '/planner',  pathMatch: 'full' },
  { path: '**',    component: NoContent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
