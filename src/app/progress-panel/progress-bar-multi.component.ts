import { Component, Input, OnChanges, SimpleChange } from '@angular/core';
import { MatExpansionPanel } from '@angular/material/expansion';
import { RequirementService } from '../services';
import { ProgressPanelService } from '../services/progress-panel.service';
import { ProgressBarMultiContainer } from './progress-bar-multi.container';
// import { ProgressPanel } from './progress-panel.component';

export interface IBarState {
  color: string;
  value: number;
  full: boolean;
  index: number;
  majIndex: number;
  isTotal: boolean;
}

@Component({
  selector: "progress-bar-multi",
  styleUrls: ["./progress-bar-multi.component.scss"],
  templateUrl: "./progress-bar-multi.template.html",
  viewProviders: [MatExpansionPanel],
})
export class ProgressBarMulti implements OnChanges {
  @Input() public isTotal: boolean = false; // true if this is the total progress bar
  @Input() public inactive: boolean = false; // if true the progress bar is greyed out counts do not update
  @Input() public isComplex: boolean = false;
  @Input() public max: number = 0;
  @Input() public title: string = "";
  @Input() public hoverText: string = ""; // text to show on hover over
  @Input() public barOne: IBarState = null as any;
  @Input() public barTwo: IBarState = null as any;
  @Input() public barThree: IBarState = null as any;
  @Input() public rule: string = "";
  @Input() public index: number = 0;
  @Input() public majIndex: number = 0;

  public states: any[] = [];
  private total: number = 0;
  private percentage: number = 0;
  public barOneWidth: number = 0;
  public barTwoWidth: number = 0;
  public barThreeWidth: number = 0;
  public barThreeHeight: number = 0;
  private showText: boolean = false;
  public barOneHoverText: string = "";
  public barTwoHoverText: string = "";
  public barThreeHoverText: string = "";
  private requirements: any = [];
  private combinedRule: any = [];

  public fullyPlannedEnrolledCompleted = false;

  private isDisabled = false;
  public degreeFullyPlanned = false;
  public majorFullyPlanned = false;

  constructor(
    private requirementService: RequirementService,
    private progressBarMultiContainer: ProgressBarMultiContainer,
    // private progressPanel: ProgressPanel,
    private progressPanelService: ProgressPanelService,
  ) {}

  public ngOnInit() {
    this.updatePercentage();
    this.updateProgress();
    this.updateTotal();
    this.barThree.index = this.index;
    this.barThree.majIndex = this.majIndex;

  }

  public ngOnChanges(changes: any) {

    if (this.barThree.value + this.barTwo.value + this.barOne.value >= this.max) {
      this.fullyPlannedEnrolledCompleted = true;
    } else {
      this.fullyPlannedEnrolledCompleted = false;
    }

    if (this.barThree.value >= this.max) {
      this.barThree.full = true;
    } else {
      this.barThree.full = false;
    }
    if (this.barTwo.value >= this.max) {
      this.barTwo.full = true;
    } else {
      this.barTwo.full = false;
    }
    if (this.barOne.value >= this.max) {
      this.barOne.full = true;
    } else {
      this.barOne.full = false;
    }
    if (this.title === "Complex rule") {
      this.isComplex = true;
    } else {
      this.isComplex = false;
    }

    if (this.inactive) {
      return;
    }
    if (changes['barOne'] || changes['barTwo'] || changes['barThree']) {
      this.updatePercentage();
      this.updateProgress();
      this.updateTotal();
      this.updateHelpText();
    }

    if (changes['max']) {
      this.updatePercentage(changes['max'].currentValue);
      this.updateProgress();
      this.updateTotal();
      this.updateHelpText();
    }

    this.degreeCheck();

    // Defer majorCheck to avoid Angular's ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => this.majorCheck(), 0);
  }

  private updatePercentage(max?: number) {
    
    if (max !== undefined) {
      this.percentage = Math.floor(
        ((this.barOne.value + this.barTwo.value + this.barThree.value) / max) *
          100
      ); // eslint-disable-line
    } else {
      this.percentage = this.calculatePercentage(
        this.barOne.value + this.barTwo.value + this.barThree.value
      ); // eslint-disable-line
    }
  }

  private updateProgress() {
    this.barOneWidth = this.calculatePercentage(this.barOne.value);
    this.barTwoWidth = this.calculatePercentage(
      this.barOne.value + this.barTwo.value
    );
    this.barThreeWidth = this.calculatePercentage(
      this.barOne.value + this.barTwo.value + this.barThree.value
    ); // eslint-disable-line
  }

  private updateTotal() {
    this.total = this.barOne.value + this.barTwo.value + this.barThree.value;
    this.total = this.total > this.max ? this.max : this.total;
  }

  private updateHelpText() {
    this.barOneHoverText = `${this.barOne.value} completed out of ${this.max}`;
    this.barTwoHoverText = `${this.barTwo.value} enrolled out of ${this.max}`;
    this.barThreeHoverText = `${this.barThree.value} planned out of ${this.max}`;
  }

  private onMouseOver() {
    this.showText = true;
  }

  private onMouseLeave() {
    this.showText = false;
  }

  private calculatePercentage(value: number) {
    const width = Math.floor((value / this.max) * 100);
    return width > 100 ? 100 : width;
  }

  private expansionOnClick() {
    this.requirements = this.requirementService.requirements;
    this.isDisabled = false;
    return this.isDisabled;
  }

  private noExpansionOnClick() {
    this.isDisabled = true;
    return this.isDisabled;
  }

  private populateCombined() {
    this.combinedRule = this.progressBarMultiContainer.combinedRule;
    for (let i = 0; i < this.combinedRule.length; i++) {
      //  this.max = this.combinedRule[i].complexMax;
    }
  }

  private newMax(newMax: any) {
    this.progressBarMultiContainer.max = newMax;
    this.max = newMax;
    //  this.progressBarMultiContainer.
  }

  private degreeCheck() {
    let degreeCheckArray = this.progressPanelService.requirements;
    let count = 0;
  
    for (let i = 0; i < degreeCheckArray.length; i++) {
      if (i === this.barThree.index) {
        degreeCheckArray[i].full = degreeCheckArray[i].required === this.barThree.value;
      }
  
      if (degreeCheckArray[i].full) {
        count++;
      }
    }
  
    this.progressPanelService.setFullyPlanned(count === degreeCheckArray.length);
  }

  private majorCheck() {
    let majorCheckArray = this.progressPanelService.majorRequirements;
    let majCount = 0;
  
    for (let i = 0; i < majorCheckArray.length; i++) {
      if (majorCheckArray[i] !== undefined) {
        if (i === this.barThree.majIndex) {
          majorCheckArray[i].full = majorCheckArray[i].required === this.barThree.value;
        }
  
        if (majorCheckArray[i].full) {
          majCount++;
        }
      }
    }
  
    this.progressPanelService.setMajorPlanned(majCount === majorCheckArray.length);
  }
  
}



  

