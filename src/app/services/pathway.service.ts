export class PathwayService {
    public pathways;
  
    constructor() {
      this.pathways = require('../../assets/data/pathways.json');
    }
  
    public getPathways() {
      return this.pathways;
    }
  
    public pathwaysInDepartment(faculty: any) {
      return (this.pathways.filter((department: any) => faculty.pathways.includes(faculty.name)));
    }
  
    public allowedPaper() {
      return;
    }
  
    public checkFlag(pathway: any, flag: string): boolean {
      return pathway.flags.map((str: string) => str.toLowerCase()).includes(flag);
    }
  
  }
  