import { getDatabase, ref, get, orderByChild, query } from "firebase/database";
import { Injectable } from '@angular/core';
import { Database } from "@angular/fire/database";
import { initializeApp } from "@angular/fire/app";
import { environment } from "src/environments/environment";

@Injectable()
export class ConjointService {
  public conjoints: any;

  constructor(
    public db: Database,
  ) {
    const app = initializeApp(environment.firebaseConfig);
    this.db = getDatabase(app);
  }

  public async getConjoints(): Promise<any[]> {
    const conjointsRef = ref(this.db, '/3');
    const orderedConjointsQuery = query(conjointsRef, orderByChild('/conjoints_admin/name'));
    
    return get(orderedConjointsQuery).then((snapshot) => {
      if (snapshot.exists()) {
        this.conjoints = snapshot.val().conjoints_admin;
        this.conjoints.sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name));
        this.conjoints.map((cons: { canDelete: boolean; }) => (cons.canDelete = true));
        return this.conjoints;
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