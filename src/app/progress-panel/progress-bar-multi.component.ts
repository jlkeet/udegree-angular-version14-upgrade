import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
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
export class ProgressBarMulti implements OnChanges, OnDestroy {
  @Input() public isTotal: boolean = false; // true if this is the total progress bar
  @Input() public inactive: boolean = false; // if true the progress bar is greyed out counts do not update
  @Input() public isComplex: boolean = false;
  @Input() public max: number = 0;
  @Input() public title: string = "";
  @Input() public hoverText: string = ""; // text to show on hover over
  @Input() public barOne: IBarState = null as any;
  @Input() public barTwo: IBarState = null as any;
  @Input() public barThree: IBarState = null as any;
  @Input() public barFour: IBarState = null as any;
  @Input() public rule: string = "";
  @Input() public index: number = 0;
  @Input() public majIndex: number = 0;

  public states: any[] = [];
  private total: number = 0;
  private percentage: number = 0;
  public barOneWidth: number = 0;
  public barTwoWidth: number = 0;
  public barThreeWidth: number = 0;
  public barFourWidth: number = 0;
  public barThreeHeight: number = 0;
  private showText: boolean = false;
  public barOneHoverText: string = "";
  public barTwoHoverText: string = "";
  public barThreeHoverText: string = "";
  public barFourHoverText: string = "";
  private requirements: any = [];
  private combinedRule: any = [];

  public fullyPlannedEnrolledCompleted = false;
  public showCompletionBadge = false;

  private isDisabled = false;
  public degreeFullyPlanned = false;
  public majorFullyPlanned = false;
  private completionCheckTimeout: ReturnType<typeof setTimeout> | null = null;

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
    if (this.barThree) {
      this.barThree.index = this.index;
      this.barThree.majIndex = this.majIndex;
    }
    if (this.barFour) {
      this.barFour.index = this.index;
      this.barFour.majIndex = this.majIndex;
    }

  }

  public ngOnChanges(changes: any) {

    const plannedTotal = this.getPlannedTotal();
    const overallTotal = this.getOverallTotal();
    const realCourseTotal =
      (this.barOne?.value || 0) +
      (this.barTwo?.value || 0) +
      (this.barThree?.value || 0);

    if (overallTotal >= this.max) {
      this.fullyPlannedEnrolledCompleted = true;
    } else {
      this.fullyPlannedEnrolledCompleted = false;
    }
    this.showCompletionBadge =
      this.fullyPlannedEnrolledCompleted && realCourseTotal >= this.max;

    if (plannedTotal >= this.max && this.barThree) {
      this.barThree.full = true;
    } else if (this.barThree) {
      this.barThree.full = false;
    }
    if (plannedTotal >= this.max && this.barFour) {
      this.barFour.full = true;
    } else if (this.barFour) {
      this.barFour.full = false;
    }
    if (this.barTwo && this.barTwo.value >= this.max) {
      this.barTwo.full = true;
    } else if (this.barTwo) {
      this.barTwo.full = false;
    }
    if (this.barOne && this.barOne.value >= this.max) {
      this.barOne.full = true;
    } else if (this.barOne) {
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
    if (changes['barOne'] || changes['barTwo'] || changes['barThree'] || changes['barFour']) {
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

    this.scheduleCompletionChecks();
  }

  public ngOnDestroy() {
    if (this.completionCheckTimeout !== null) {
      clearTimeout(this.completionCheckTimeout);
      this.completionCheckTimeout = null;
    }
  }

  private updatePercentage(max?: number) {
    const totalValue = this.getOverallTotal();

    if (max !== undefined) {
      this.percentage = max > 0 ? Math.floor((totalValue / max) * 100) : 0;
    } else {
      this.percentage = this.calculatePercentage(totalValue);
    }
  }

  private updateProgress() {
    const barOneValue = this.barOne?.value || 0;
    const barTwoValue = this.barTwo?.value || 0;
    const barThreeValue = this.barThree?.value || 0;
    const barFourValue = this.barFour?.value || 0;

    this.barOneWidth = this.calculatePercentage(barOneValue);
    this.barTwoWidth = this.calculatePercentage(
      barOneValue + barTwoValue
    );
    this.barThreeWidth = this.calculatePercentage(
      barOneValue + barTwoValue + barThreeValue
    ); // eslint-disable-line
    this.barFourWidth = this.calculatePercentage(
      barOneValue + barTwoValue + barThreeValue + barFourValue
    );
  }

  private updateTotal() {
    this.total = this.getOverallTotal();
    this.total = this.total > this.max ? this.max : this.total;
  }

  private updateHelpText() {
    const barOneValue = this.barOne?.value || 0;
    const barTwoValue = this.barTwo?.value || 0;
    const barThreeValue = this.barThree?.value || 0;
    const barFourValue = this.barFour?.value || 0;

    this.barOneHoverText = `${barOneValue} completed out of ${this.max}`;
    this.barTwoHoverText = `${barTwoValue} enrolled out of ${this.max}`;
    this.barThreeHoverText = `${barThreeValue} planned courses out of ${this.max}`;
    this.barFourHoverText = `${barFourValue} selection card points out of ${this.max}`;
  }

  private onMouseOver() {
    this.showText = true;
  }

  private onMouseLeave() {
    this.showText = false;
  }

  private calculatePercentage(value: number) {
    if (this.max <= 0) {
      return 0;
    }
    const width = Math.floor((value / this.max) * 100);
    return width > 100 ? 100 : width;
  }

  private getPlannedTotal() {
    return (this.barThree?.value || 0) + (this.barFour?.value || 0);
  }

  private getOverallTotal() {
    return (this.barOne?.value || 0) + (this.barTwo?.value || 0) + this.getPlannedTotal();
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

  private scheduleCompletionChecks() {
    if (this.completionCheckTimeout !== null) {
      clearTimeout(this.completionCheckTimeout);
    }

    // Run after the current CD tick to avoid ExpressionChangedAfterItHasBeenCheckedError.
    this.completionCheckTimeout = setTimeout(() => {
      this.completionCheckTimeout = null;
      this.degreeCheck();
      this.majorCheck();
    }, 0);
  }

  private degreeCheck() {
    const degreeCheckArray = Array.isArray(this.progressPanelService.requirements)
      ? this.progressPanelService.requirements
      : [];
    const degreeIndex = this.barThree?.index ?? this.index;
    let count = 0;

    if (degreeCheckArray.length === 0) {
      this.progressPanelService.setFullyPlanned(false);
      return;
    }
  
    for (let i = 0; i < degreeCheckArray.length; i++) {
      if (i === degreeIndex) {
        const plannedTotal = this.getPlannedTotal();
        degreeCheckArray[i].full = plannedTotal >= degreeCheckArray[i].required;
      }
  
      if (degreeCheckArray[i].full) {
        count++;
      }
    }
  
    this.progressPanelService.setFullyPlanned(count === degreeCheckArray.length);
  }

  private majorCheck() {
    const majorCheckArray = Array.isArray(this.progressPanelService.majorRequirements)
      ? this.progressPanelService.majorRequirements
      : [];
    const majorIndex = this.barThree?.majIndex ?? this.majIndex;
    let majCount = 0;

    if (majorCheckArray.length === 0) {
      this.progressPanelService.setMajorPlanned(false);
      return;
    }
  
    for (let i = 0; i < majorCheckArray.length; i++) {
      if (majorCheckArray[i] !== undefined) {
        if (i === majorIndex) {
          const plannedTotal = this.getPlannedTotal();
          majorCheckArray[i].full = plannedTotal >= majorCheckArray[i].required;
        }
  
        if (majorCheckArray[i].full) {
          majCount++;
        }
      }
    }
  
    this.progressPanelService.setMajorPlanned(majCount === majorCheckArray.length);
  }
  
}



  
