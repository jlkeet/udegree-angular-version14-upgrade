import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { SplashAnimationType } from "./splash-animation-type";

@Component({
  selector: "splash-screen",
  templateUrl: "./splash-screen-component.html",
  styleUrls: ["./splash-screen-component.scss"]
})
export class SplashScreenComponent implements OnInit, OnDestroy {
  windowWidth: string = "";
  splashTransition: string = "";
  opacityChange: number = 1;
  showSplash = true;
  showHint = false;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private hintTimer: ReturnType<typeof setTimeout> | null = null;
  private failSafeTimer: ReturnType<typeof setTimeout> | null = null;

  @Input() duration: number = 0.5;
  @Input() startDelayMs: number = 600;
  @Input() hintAfterMs: number = 3000;
  @Input() maxVisibleMs: number = 8000;
  @Input() animationType: SplashAnimationType = SplashAnimationType.SlideLeft;

  ngOnInit(): void {
    this.hintTimer = setTimeout(() => {
      if (this.showSplash) {
        this.showHint = true;
      }
    }, this.hintAfterMs);

    this.failSafeTimer = setTimeout(() => {
      this.hideSplash();
    }, this.maxVisibleMs);

    this.startTimer = setTimeout(() => {
      let transitionStyle = "";

      // Determine the splashscreen style from the html and in that case execute one of the styles

      switch (this.animationType) {
        case SplashAnimationType.SlideLeft:
          this.windowWidth = "-" + window.innerWidth + "px";
          transitionStyle = "left " + this.duration + "s";
          break;
        case SplashAnimationType.SlideRight:
          this.windowWidth = window.innerWidth + "px";
          transitionStyle = "left " + this.duration + "s";
          break;
        case SplashAnimationType.FadeOut:
          transitionStyle = "opacity " + this.duration + "s";
          this.opacityChange = 0;
      }

      this.splashTransition = transitionStyle;

      this.hideTimer = setTimeout(() => {
        this.hideSplash();
      }, this.duration * 1000);
    }, this.startDelayMs);
  }

  ngOnDestroy(): void {
    this.clearTimers();
  }

  private hideSplash() {
    this.showSplash = false;
    this.showHint = false;
    this.clearTimers();
  }

  private clearTimers() {
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
    if (this.hintTimer) {
      clearTimeout(this.hintTimer);
      this.hintTimer = null;
    }
    if (this.failSafeTimer) {
      clearTimeout(this.failSafeTimer);
      this.failSafeTimer = null;
    }
  }
}
