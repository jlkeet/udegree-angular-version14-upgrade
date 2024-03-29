import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { AuthService } from "../core/auth.service";


@Component({
    selector: 'user-dialog',
    templateUrl: './user-dialog.template.html',
    styleUrls: ['../progress-panel/progress-panel.component.scss']
})
export class UserDialogComponent implements OnInit {

    form: FormGroup;
    description:string;
    degSelectId:number;

    constructor(
        public authService: AuthService,
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<UserDialogComponent>,
        @Inject(MAT_DIALOG_DATA) data : any) {

        this.description = data.description;
        this.degSelectId = data.id;
    }

    ngOnInit() {
        this.form = this.fb.group({
            description: [this.description, []]
            });
    }

    save() {
        this.dialogRef.close(this.form.value);
    }

    close() {
        this.dialogRef.close();
    }
}