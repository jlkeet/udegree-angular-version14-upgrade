import { formatDate } from "@angular/common";
import { Injectable } from "@angular/core";
import { getAuth } from "@angular/fire/auth";
import { Firestore, doc, getDoc, getFirestore, updateDoc } from '@angular/fire/firestore';
import { initializeApp } from "@angular/fire/app";
import { StoreHelper } from "./store-helper";
import { environment } from "../../environments/environment";

@Injectable()
export class AdminExportService {
  public adminStatus: any;
  public isAdmin: any;
  public user: any;
  public auth: any;

  constructor(
    // public authService: AuthService,
    public db: Firestore,
    public storeHelper: StoreHelper,
  ) {

    const app = initializeApp(environment.firebaseConfig);

    this.auth = getAuth(app);
    this.db = getFirestore(app);

  }

  public async getAdmin(userEmail: any) {
    const userRef = doc(this.db, `users/${userEmail}`);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      this.isAdmin = docSnap.data()["role"] === "user";
    }
  }

  public async setExportStatus(adminStatus: any, userEmail: any) {
    const userRef = doc(this.db, `users/${userEmail}`);
    await updateDoc(userRef, { status: adminStatus });
    this.adminStatus = adminStatus;
  }

  public getStatus() {
    return this.adminStatus;
  }

  public async getExportStatus(userEmail: any) {
    return new Promise<any>(async (resolve) => {
      const userRef = doc(this.db, `users/${userEmail}`);
      const docSnap = await getDoc(userRef);
    
      if (docSnap.exists()) {
        this.adminStatus = docSnap.data()["status"];
        resolve(this.adminStatus);
      }
    });
  }

  public async setExportStatusTimestamp(userEmail: any) {
    let timestamp = Date.now();
    let timestampString = formatDate(timestamp, "dd/MM/yyyy, h:mm a", "en");
    
    const userRef = doc(this.db, `users/${userEmail}`);
    await updateDoc(userRef, { timestamp: timestampString });
  }

  public getAuthState() {
    return(this.user !== null)
  }
}
