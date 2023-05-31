export class ConjointService {
    private conjoints;
  
    constructor() {
      this.conjoints = require('../../assets/data/conjoints.json');
    }
  
    public getConjoints() {
      return this.conjoints;
    }
  
    public isPrescribed(conjoint: any): boolean {
      return this.checkFlag(conjoint, 'prescribed');
    }
  
    public allowsMinor(conjoint: any): boolean {
      return this.checkFlag(conjoint, 'mnr');
    }
  
    public allowsDoubleMajor(conjoint: any): boolean {
      return this.checkFlag(conjoint, 'dbl mjr');
    }
  
    private checkFlag(conjoint: { flags: string[]; }, flag: string): boolean {
      return conjoint.flags.map((str: string) => str.toLowerCase()).includes(flag);
    }
  
  }
  