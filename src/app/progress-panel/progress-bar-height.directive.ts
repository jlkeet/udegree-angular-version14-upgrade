import { OnChanges, SimpleChange, Directive, ElementRef, Input, Renderer2, ViewChild } from '@angular/core';

@Directive(
    { selector: '[uProgressHeight]' }
    )

export class ProgressHeightDirective implements OnChanges  {
    
    @Input('uProgressHeight') progressHeight: number;
    
    private defaultHeight: number = 100;

    ngOnChanges(changes: {[value: number]: SimpleChange}) {
        this.setHeight(this.progressHeight || this.defaultHeight)

    }
    public setHeight(height: number) {
        this.renderer.setStyle(this.el.nativeElement, 'height', `${height}%`);
        //    this.renderer.setElementStyle(this.el.nativeElement.parentElement, 'height', "20px");
    //    setTimeout(() => {this.renderer.setElementStyle(this.el.nativeElement.parentElement, 'height', "10px");}, 600) 
    }

    constructor(private el: ElementRef, private renderer: Renderer2) { }

}