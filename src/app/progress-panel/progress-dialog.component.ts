import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: 'progress-dialog',
    templateUrl: './progress-dialog.template.html',
    styleUrls: ['./progress-panel.component.scss']
})
export class ProgressDialogComponent implements OnInit {

    form: FormGroup;
    description:string;
    degSelectId:number;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<ProgressDialogComponent>,
        @Inject(MAT_DIALOG_DATA) data: any) {

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