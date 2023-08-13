import { EventEmitter, Injectable, Output } from "@angular/core";
import { Auth, getAuth } from '@angular/fire/auth';
import { FirebaseUserModel } from "./user.model";
import { Firestore, addDoc, collection, doc, getDoc, getDocs, getFirestore, setDoc } from '@angular/fire/firestore';
import { StoreHelper } from "../services";
import { AdminExportService } from "../services/admin-export.service";
import { initializeApp } from "@angular/fire/app";
import { environment } from 'src/environments/environment';

@Injectable()
export class FirebaseDbService {
  @Output() private onPageChange = new EventEmitter<null>();
  uid: string = '';

  public auditDocRef: any;
  public previousValue: any;
  auth: Auth;
  db: Firestore;

  constructor(
    public userdata: FirebaseUserModel,
    private storeHelper: StoreHelper,
    public adminExportService: AdminExportService
  ) {

    const app = initializeApp(environment.firebaseConfig);

    this.auth = getAuth(app);
    this.db = getFirestore(app);

  }

  async getCollection(firstCollection?: string, secondCollection?: string, courseDbId?: string): Promise<any> {
    try {
      if (this.auth.currentUser && this.auth.currentUser.email) {  
      const docRef = doc(this.db, `${firstCollection}/${this.auth.currentUser.email}/${secondCollection}/${courseDbId}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return Promise.resolve(docSnap.data());
      } else {
        // doc.data() will be undefined in this case
        console.log('No such document!');
        return Promise.resolve(null);
      }
    }
    else {
      // Handle the case when email is not available
      console.error('Email is not available');
    } 
  }
  catch (err) {
    console.log('Error getting document:', err);
    return Promise.reject(err);
  }
}

  async setSelection(email: any, collectionName: string, collectionData: any, document: string) {
    try {
      const docRef = doc(this.db, `users/${email}/${document}/${collectionName}`);
      await setDoc(docRef, collectionData);
    } catch (err) {
      console.log('Error setting document:', err);
    }
  }
  
  async addSelection(email: any, collectionName: any, collectionData: any, document: any) {
    try {
      const collectionRef = collection(this.db, `users/${email}/${document}`);
      await addDoc(collectionRef, collectionData);
    } catch (err) {
      console.log('Error adding document:', err);
    }
  }

  async getID(email: any, collectionName: string, storeHelperName: string) {
    try {
      const collectionRef = collection(this.db, `users/${email}/${collectionName}`);
      const querySnapshot = await getDocs(collectionRef);
    
      if (!querySnapshot.empty) {
        querySnapshot.forEach((doc) => {
          this.loadPlanFromDb(collectionName, doc.id, storeHelperName);
        });
      }
    } catch (err) {
      console.log('Error getting documents:', err);
    }
  }
  
  async getPlanFromDb(collectionName: any, degId: any): Promise<any> {
    try {
     if (this.auth.currentUser && this.auth.currentUser.email) {  
      const docRef = doc(this.db, `users/${this.auth.currentUser.email}/${collectionName}/${degId}`);
      const docSnap = await getDoc(docRef);
  
      if (docSnap.exists()) {
        return Promise.resolve(docSnap.data());
      } else {
        console.log('No such document!');
        return Promise.resolve(null);
      }
    } else {
      // Handle the case when email is not available
      console.error('Email is not available');
    } 
  }
    catch (err) {
      console.log('Error getting document:', err);
      return Promise.reject(err);
    }
  }


  public loadPlanFromDb(collectionName: any, degId: any, storeHelperName: any) {
    this.getPlanFromDb(collectionName, degId).then(async (copy) => {
      Object.assign({
        abbrv: copy['abbrv'] || null,
        blurb: copy['blurb'] || null,
        doubleMajorRequirements: copy['doubleMajorRequirements'] || null,
        flags: copy['flags'] || null,
        majorRequirements: copy['majorRequirements'] || null,
        majors: copy['majors'] || null,
        name: copy['name'] || null,
        conjointRequirements: ['conjointRequirements'] || null,
        faculties: copy['faculties'] || null,
        requirements: copy['requirements'] || null,
        courses: copy['courses'] || null,
      });
      this.getPlanFromDb(collectionName, degId).then((res) => {
        this.storeHelper.update(storeHelperName, res)
      });
    });
  }

//   public getStudentEmailForAudit() {
//     return new Promise<any>(async (resolve) => {
//     this.db
//     .collection("users")
//     .doc(this.afAuth.auth.currentUser.email)
//     .get()
//     .toPromise()
//     .then( (res: { data: () => any; }) => {  resolve(res.data()); } )
//   })
// }


  public setAuditLogAction() {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')
//     this.getStudentEmailForAudit().then( (res) => 

//     this.db
//     .collection("audit-log")
//     .add({ admin: this.afAuth.auth.currentUser.email, student: res.student, timestamp: timestampString , actions: [] })
//     .then( (docRef: { id: any; }) => this.auditDocRef = docRef.id))
//   }
  }

//   public setAuditLogDegree(degree: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("degree")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Degree", new: degree, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeleteDegree() {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("degree")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Removed Degree", new: "", previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogMajor(major: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("major")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Major", new: major, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeleteMajor() {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("major")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Removed Major", new: "", previous: this.previousValue || "" })
//     }
//   }


//   public setAuditLogSecondMajor(secondMajor: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("secondMajor")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Second Major", new: secondMajor, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeleteSecondMajor() {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("secondMajor")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Removed Second Major", new: "", previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogThirdMajor(thirdMajor: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("thirdMajor")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Third Major", new: thirdMajor, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeleteThirdMajor() {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("thirdMajor")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Removed Third Major", new: "", previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogModule(module: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("module")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Module", new: module, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeleteModule() {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("module")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Module", new: "", previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogSecondModule(secondModule: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("secondModule")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Second Module", new: module, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeleteSecondModule() {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("secondModule")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Removed Second Module", new: "", previous: this.previousValue || "" })
//     }
//   }


//   public setAuditLogConjoint(conjoint: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("conjoint")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Conjoint", new: conjoint, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeleteConjoint() {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("conjoint")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Removed Conjoint", new: "", previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogPathway(pathway: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("pathway")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Pathway", new: pathway, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeletePathway() {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = this.storeHelper.current("pathway")
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Removed pathway", new: "", previous: this.previousValue || "" })
//     }
//   }


//   public setAuditLogCourse(course: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Course", new: course, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeleteCourse(course: string) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')
//     this.previousValue = course
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Removed Course", new: "", previous: this.previousValue || "" })
//     }
//   }


//   public setAuditLogSemester(semester: { year: number; period: number; both: string; }) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Added Semester", new: semester, previous: this.previousValue || "" })
//     }
//   }

//   public setAuditLogDeleteSemester(semester: any) {
//     if (!this.adminExportService.isAdmin) {
//     let timestamp = Date.now();
//     let timestampString = formatDate(timestamp, 'dd/MM/yyyy, h:mm a', 'en')

//     this.previousValue = semester
//     this.db
//     .collection("audit-log")
//     .doc(this.auditDocRef)
//     .collection("actions")
//     .add({ timestamp: timestampString ,action: "Removed Semester", new: "", previous: this.previousValue || "" })
//     }
//   }

}
