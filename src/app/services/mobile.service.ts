import { formatDate } from "@angular/common";
import { Injectable } from "@angular/core";
import { Component, Input } from "@angular/core";
import { getAuth } from "@angular/fire/auth";
import { Firestore, addDoc, collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from '@angular/fire/firestore';
import { initializeApp } from "@angular/fire/app";
import { StoreHelper } from "./store-helper";
import { environment } from "../../environments/environment";

@Injectable()
export class MobileService { 

    public selected = false;
    public swipeCoord?: [number, number];
    public swipeTime?: number;
    public tabIndex: number = 0;

    constructor() {

    }


public swipe(e: TouchEvent, when: string): void {
    if (this.selected) {
    }  
      const coord: [number, number] = [
        e.changedTouches[0].clientX,
        e.changedTouches[0].clientY,
      ];
      const time = new Date().getTime();
      if (when === "start") {
        this.swipeCoord = coord;
        this.swipeTime = time;
      } else if (when === "end") {
        const direction = [
          coord[0] - this.swipeCoord[0],
          coord[1] - this.swipeCoord[1],
        ];
        const duration = time - this.swipeTime;
        if (
          duration < 1000 && //
          Math.abs(direction[0]) > 30 && // Long enough
          Math.abs(direction[0]) > Math.abs(direction[1] * 3)
        ) {
          // Horizontal enough
          const swipe = direction[0] < 0 ? "next" : "previous";
          if (swipe === "next") {
            const isFirst = this.tabIndex === 0;
            if (this.tabIndex <= 3) {
              this.tabIndex = isFirst ? 1 : this.tabIndex + 1;
            }
          } else if (swipe === "previous") {
            const isLast = this.tabIndex === 1;
            if (this.tabIndex >= 1) {
              this.tabIndex = this.tabIndex - 1;
            }
          }
        }
      }
    }
}