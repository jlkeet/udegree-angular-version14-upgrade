import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrivacyContainer } from './privacy-policy.component';
import { PrivacyRoutingModule } from './privacy-policy-routing.module';

@NgModule({
  declarations: [PrivacyContainer],
  imports: [CommonModule, PrivacyRoutingModule],
  exports: [PrivacyContainer]

})
export class PrivacyPolicyModule { }

