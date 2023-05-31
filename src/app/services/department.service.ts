import { getDatabase, ref, child, get, orderByChild, query } from "firebase/database";
import { Injectable } from '@angular/core';
import { filter } from 'rxjs-compat/operator/filter';
import { initializeApp } from "@angular/fire/app";
import { environment } from "src/environments/environment";
import { Database } from "@angular/fire/database";

@Injectable()
export class DepartmentService {
  public departments: any;

  constructor(
    public db: Database,

  ) {
    // this.departments = require('../../assets/data/departments.json');
    const app = initializeApp(environment.firebaseConfig);
    this.db = getDatabase(app);

  }

  public async getDepartments(): Promise<any[]> {

    const departmentsRef = ref(this.db, '/2');
    const orderedFacultiesQuery = query(departmentsRef, orderByChild('/departments_admin/name'));
    
    return get(orderedFacultiesQuery).then((snapshot) => {
      if (snapshot.exists()) {
        this.departments = snapshot.val().departments_admin;
        this.departments.sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name));
        this.departments.map((depts: { canDelete: boolean; }) => (depts.canDelete = true));
        return this.departments;
      } else {
        console.log("No data available");
        return [];
      }
    }).catch((error) => {
      console.error(error);
      return [];
    });
}

  // public async getDepartments() {
  //   this.db_depts
  //   .list("/", (ref) => ref.orderByChild("name"))
  //   .valueChanges()
  //   .subscribe((result: any) => {this.departments = result[2].departments_admin, this.departments.sort((a,b) => a.name.localeCompare(b.name)), this.departments.map((depts) => depts.canDelete = true)})

  //   return new Promise((resolve) => { setTimeout(() => {resolve(this.departments)}, 50)})
  // }

  public departmentsInFaculty(faculty: { name: any; }) {
    return this.departments.filter((department: { faculties: string | any[]; }) => {
      return department.faculties.includes(faculty.name);
    });
  }

  // public departmentsInFaculty(faculty) {
  //   this.departments.filter((department) => {faculty.majors.includes(department.name)})
  //   return this.departments.filter((department) => faculty.name.includes(department.faculties[0]))
  // }

  public allowedPaper() {
    return;
  }

  public checkFlag(department: { flags: string[]; }, flag: string): boolean {
    return department.flags.map((str: string) => str.toLowerCase()).includes(flag);
  }

}
