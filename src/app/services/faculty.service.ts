import { getDatabase, ref, get, orderByChild, query } from "firebase/database";
import { Injectable } from '@angular/core';
import { Database } from "@angular/fire/database";
import { initializeApp } from "@angular/fire/app";
import { environment } from "src/environments/environment";

@Injectable()
export class FacultyService {
  public faculties: any;

  constructor(
    public db: Database,
  ) {
    const app = initializeApp(environment.firebaseConfig);
    this.db = getDatabase(app);
  }

  public async getFaculties(): Promise<any[]> {
    const facultiesRef = ref(this.db, '/1');
    const orderedFacultiesQuery = query(facultiesRef, orderByChild('/faculties_admin/name'));
    
    return get(orderedFacultiesQuery).then((snapshot) => {
      if (snapshot.exists()) {
        this.faculties = snapshot.val().faculties_admin;
        this.faculties.sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name));
        this.faculties.map((facs: { canDelete: boolean; }) => (facs.canDelete = true));
        return this.faculties;
      } else {
        console.log("No data available");
        return [];
      }
    }).catch((error) => {
      console.error(error);
      return [];
    });
}

  public isPrescribed(faculty: any): boolean {
    return this.checkFlag(faculty, 'prescribed');
  }

  public allowsMinor(faculty: any): boolean {
    return this.checkFlag(faculty, 'mnr');
  }

  public allowsDoubleMajor(faculty: any): boolean {
    return this.checkFlag(faculty, 'dbl mjr');
  }

  public checkFlag(faculty: { flags: string[]; }, flag: string): boolean {
    return faculty.flags.map((str: string) => str.toLowerCase()).includes(flag);
  }

}
