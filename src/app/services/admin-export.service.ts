import { formatDate } from "@angular/common";
import { Injectable } from "@angular/core";
import { getAuth } from "@angular/fire/auth";
import { Firestore, doc, getDoc, getFirestore, setDoc } from '@angular/fire/firestore';
import { initializeApp } from "@angular/fire/app";
import { StoreHelper } from "./store-helper";
import { environment } from "../../environments/environment";

@Injectable()
export class AdminExportService {
  public adminStatus: any;
  public isAdmin: any;
  public user: any;
  public auth: any;
  private readonly defaultStatus = 0;

  constructor(
    // public authService: AuthService,
    public db: Firestore,
    public storeHelper: StoreHelper,
  ) {

    const app = initializeApp(environment.firebaseConfig);

    this.auth = getAuth(app);
    this.db = getFirestore(app);

  }

  private resolveUserEmail(userEmail?: any): string | null {
    if (typeof userEmail === "string" && userEmail.trim().length > 0) {
      return userEmail.trim();
    }

    const authEmail = this.auth?.currentUser?.email;
    if (typeof authEmail === "string" && authEmail.trim().length > 0) {
      return authEmail.trim();
    }

    return null;
  }

  public async getAdmin(userEmail: any) {
    const resolvedEmail = this.resolveUserEmail(userEmail);
    if (!resolvedEmail) {
      return;
    }

    const userRef = doc(this.db, `users/${resolvedEmail}`);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      this.isAdmin = docSnap.data()["role"] === "admin";
    }
  }

  public async setExportStatus(adminStatus: any, userEmail: any) {
    const resolvedEmail = this.resolveUserEmail(userEmail);
    if (!resolvedEmail) {
      this.adminStatus = this.defaultStatus;
      return false;
    }

    const userRef = doc(this.db, `users/${resolvedEmail}`);
    await setDoc(userRef, { status: adminStatus }, { merge: true });
    this.adminStatus = adminStatus;
    return true;
  }

  public getStatus() {
    return this.adminStatus ?? this.defaultStatus;
  }

  public async getExportStatus(userEmail: any) {
    const resolvedEmail = this.resolveUserEmail(userEmail);
    if (!resolvedEmail) {
      this.adminStatus = this.defaultStatus;
      return this.adminStatus;
    }

    return new Promise<any>(async (resolve) => {
      const userRef = doc(this.db, `users/${resolvedEmail}`);
      const docSnap = await getDoc(userRef);
    
      if (docSnap.exists()) {
        this.adminStatus = docSnap.data()["status"];
      } else {
        this.adminStatus = this.defaultStatus;
      }

      resolve(this.adminStatus);
    });
  }

  public async setExportStatusTimestamp(userEmail: any) {
    const resolvedEmail = this.resolveUserEmail(userEmail);
    if (!resolvedEmail) {
      return false;
    }

    let timestamp = Date.now();
    let timestampString = formatDate(timestamp, "dd/MM/yyyy, h:mm a", "en");
    
    const userRef = doc(this.db, `users/${resolvedEmail}`);
    await setDoc(userRef, { timestamp: timestampString }, { merge: true });
    return true;
  }

  public getAuthState() {
    return(this.user !== null)
  }
}
