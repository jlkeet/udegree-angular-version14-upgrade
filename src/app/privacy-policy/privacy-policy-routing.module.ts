import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PrivacyContainer } from './privacy-policy.component';

export const routes: Routes = [
  { path: '', component: PrivacyContainer },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PrivacyRoutingModule { }
