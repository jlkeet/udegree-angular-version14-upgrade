import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExplorerComponent } from './explorer.component';
import { ItemComponent } from './item.component';
import { ExplorerRoutingModule } from './explorer-routing.module';

@NgModule({
  declarations: [ExplorerComponent, ItemComponent],
  imports: [CommonModule, ExplorerRoutingModule],
  exports: [ExplorerComponent, ItemComponent]

})
export class ExplorerModule { }

