import { Injectable } from '@angular/core';

@Injectable()
export class ProgressPanelService {
    public requirements: any;
    public degreeFullyPlanned: any;
    public conjointRequirements: any;

    public majorRequirements: any;
    public majorFullyPlanned: any;
    public secondMajorRequirements: any;
    public thirdMajorRequirements: any;
    public pathwayRequirements: any;
    public moduleRequirements: any;
    public secondModuleRequirements: any;


    constructor() {

    }

    public setMajReqs(reqs: any) {
        this.majorRequirements = reqs;
    }

    public getMajReqs() {
        return this.majorRequirements;
    }

    public getSecondMajReqs() {
        return this.secondMajorRequirements
    }

    public setSecondMajReqs(reqs: any) {
        this.secondMajorRequirements = reqs;
    }

    public getThirdMajReqs() {
        return this.thirdMajorRequirements;
    }

    public setThirdMajReqs(reqs: any) {
        this.thirdMajorRequirements = reqs;
    }

    public getPathwayReqs() {
        return this.pathwayRequirements;
    }

    public setPathwayReqs(reqs: any) {
        this.pathwayRequirements = reqs;
    }

    public getModuleReqs() {
        return this.moduleRequirements;
    }

    public setModuleReqs(reqs: any) {
        this.moduleRequirements = reqs;
    }

    public getSecondModuleReqs() {
        return this.secondModuleRequirements;
    }

    public setSecondModuleReqs(reqs: any) {
        this.secondModuleRequirements = reqs;
    }

    public setMajorPlanned(majorFullyPlanned: any) {
        this.majorFullyPlanned = majorFullyPlanned
    }

    public getMajorFullyPlanned() {
        return this.majorFullyPlanned;
    }

    public setFullyPlanned(fullyPlanned: any) {
        this.degreeFullyPlanned = fullyPlanned;
    }

    public getFullyPlanned() {
        return this.degreeFullyPlanned;
    }

    public setReqs(reqs: any) {
        this.requirements = reqs
    }

    public getReqs() {
        return this.requirements;
    }

    public setConjointReqs(reqs: any) {
        this.conjointRequirements = reqs;
    }

    public getConjointReqs() {
        return this.conjointRequirements;
    }
  
  }
  
