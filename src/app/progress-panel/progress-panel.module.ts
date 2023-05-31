import { NgModule } from '@angular/core';
import { ProgressBarMulti } from './progress-bar-multi.component';
import { ProgressBarMultiContainer } from './progress-bar-multi.container';
import { ProgressDialogComponent } from './progress-dialog.component';
import { ProgressPanel } from './progress-panel.component';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProgressWidthDirective } from './progress-bar-width.directive';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialogModule } from '@angular/material/dialog';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';




@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatDialogModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatSelectModule,



  ],
  declarations: [
    ProgressBarMulti,
    ProgressBarMultiContainer,
    ProgressDialogComponent,
    ProgressPanel,
    ProgressWidthDirective,
  ],
  providers: [

    ],
    exports: [
        ProgressPanel,
    ]
})
export class ProgressPanelModule { }
