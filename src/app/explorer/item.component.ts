import { Component, Input, OnChanges } from '@angular/core';
import { Item } from './explorer.component';
import { ExplorerComponent } from './explorer.component';

declare const require: any;

/*
  <svg class="line" class="svg">
    <line *ngFor="let line of .lines" [attr.x1]="getLine(l1, 0, 1)" [attr.y1]="getLine(line.l1, 0, 1)" [attr.x2]="getLine(line.l2, 1, 0)" [attr.y2]="getLine(line.l2, 1, 1)" stroke="blue"/>
  </svg>
 */

@Component({
  selector: 'app-item',
  template: `
      <div class="item noselect pointer"
        [ngClass]="{selected: item.selected}"
        class="item noselect pointer"
        (click)="explorer.select(item, i)"
        >
        {{item.title}}
      </div>
  `,
  styleUrls: ["./item.component.css"],
})

export class ItemComponent implements OnChanges {
  @Input() item: Item = null as any;
  @Input() front: number = 0;
  @Input() back: number = 0;
  @Input() i: number = 0;

  constructor(public explorer: ExplorerComponent) {

  }

  ngOnChanges() {
  }

}
