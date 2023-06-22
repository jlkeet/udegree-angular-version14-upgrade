import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PlannerContainer, SelectDegreeContainer, SelectMajorContainer } from './containers';
import { NoContent } from './no-content';
import { LoginComponent } from './login/login.component';
import { UserComponent } from './user/user.component';
import { RegisterComponent } from './register/register.component';
import { UserResolver } from './user/user.resolver';
import { AuthGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'planner', component: PlannerContainer },
  { path: 'privacy', loadChildren: () => import('./privacy-policy/privacy-policy.module').then(m => m.PrivacyPolicyModule) },
  { path: 'degree', component: SelectDegreeContainer },
  { path: 'major', component: SelectMajorContainer },
  { path: 'add', loadChildren: () => import('./add-course/add-course.module').then(m => m.AddCourseModule) },
  { path: 'login', component: LoginComponent, canActivate: [AuthGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [AuthGuard] },
  { path: 'user', component: UserComponent,  resolve: { data: UserResolver}},
  { path: '',      redirectTo: '/planner',  pathMatch: 'full' },
  { path: 'explorer', loadChildren: () => import('./explorer/explorer.module').then(m => m.ExplorerModule) },
  { path: '**',    component: NoContent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
