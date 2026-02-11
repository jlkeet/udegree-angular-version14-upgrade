import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExplorerComponent } from './explorer.component';
import { ItemComponent } from './item.component';

export const routes: Routes = [
  { path: '', component: ExplorerComponent },
  { path: 'item', component: ItemComponent },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ExplorerRoutingModule { }
