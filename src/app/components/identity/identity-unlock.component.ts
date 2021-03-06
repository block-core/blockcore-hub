/* eslint-disable */

import { Component, ViewEncapsulation, ChangeDetectionStrategy, HostBinding, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ApplicationStateService } from '../../services/application-state.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Identity, IdentityContainer } from '@models/identity';
import { IdentityService } from 'src/app/services/identity.service';
import { Location } from '@angular/common';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { debounceTime } from 'rxjs/operators';
import { ImageCroppedEvent } from 'ngx-image-cropper';
import { Link } from '@models/link';
import { LinkAddComponent } from './link-add.component';
import { MatDialog } from '@angular/material/dialog';
import { ProfileImageService } from 'src/app/services/profile-image.service';

@Component({
    selector: 'app-identity-unlock',
    templateUrl: './identity-unlock.component.html',
    styleUrls: ['./identity-unlock.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class IdentityUnlockComponent implements OnDestroy, OnInit {
    @HostBinding('class.identity-edit') hostClass = true;

    // identity: Identity;
    // originalIdentity: Identity;
    identityContainer: IdentityContainer;
    originalIdentityContainer: IdentityContainer;

    form: FormGroup;
    apiError: string;
    image: any;
    publishWarning = false;
    hide = true;
    invalidPassword: boolean;

    private subscription: any;
    private id: string;

    // eslint-disable-next-line @typescript-eslint/member-ordering
    formErrors = {
        password: '',
        shortname: '',
        alias: '',
        title: '',
        email: '',
        url: '',
        image: '',
        address: '',
        amount: '',
        fee: '',
        restorekey: ''
    };

    // eslint-disable-next-line @typescript-eslint/member-ordering
    validationMessages = {
        name: {
            required: 'A name is required.',
            minlength: 'A name is at least 1 characters long.',
            maxlength: 'A name is at maximum 250 characters long.'
        },
        shortname: {
            required: 'A short name is required.',
            minlength: 'A short name is at least 1 characters long.',
            maxlength: 'A short name is at maximum 30 characters long.'
        },
        address: {
            required: 'An address is required.',
            minlength: 'An address is at least 26 characters long.'
        },
        email: {
            email: 'Invalid e-mail address.'
        },
        url: {
            url: 'Invalid url.'
        },
        image: {
            image: 'Invalid image url.'
        },
        amount: {
            required: 'An amount is required.',
            pattern: 'Enter a valid transaction amount. Only positive numbers and no more than 8 decimals are allowed.',
            min: 'The amount has to be more or equal to 0.00001 City.',
            max: 'The total transaction amount exceeds your available balance.'
        },
        fee: {
            required: 'A fee is required.'
        },
        password: {
            required: 'Your password is required.'
        },
        restorekey: {
            pattern: 'The restore key must be valid public key.'
        }
    };

    constructor(
        private appState: ApplicationStateService,
        private profileImageService: ProfileImageService,
        private route: ActivatedRoute,
        private location: Location,
        private fb: FormBuilder,
        public identityService: IdentityService,
        public dialog: MatDialog,
        private readonly cd: ChangeDetectorRef,
        public router: Router) {
        this.appState.pageMode = false;

    }

    ngOnInit() {
        this.id = this.route.snapshot.paramMap.get('id');

        // Make sure we only edit a copy of the identity.
        this.originalIdentityContainer = this.identityService.get(this.id);
        this.identityContainer = this.jsonCopy(this.originalIdentityContainer);

        this.buildSendForm();
    }

    private buildSendForm(): void {
        this.form = this.fb.group({
            name: [this.identityContainer.content.name, Validators.compose([Validators.maxLength(250)])],
            shortname: [this.identityContainer.content.shortname, Validators.compose([Validators.maxLength(30)])],
            alias: [this.identityContainer.content.alias],
            password: [''],
            title: [this.identityContainer.content.title],
            published: [this.identityContainer.published],
            publish: [this.identityContainer.publish],
            email: [this.identityContainer.content.email, Validators.compose([Validators.email])],
            url: [this.identityContainer.content.url, Validators.compose([Validators.maxLength(2000)])],
            image: [this.identityContainer.content.image, Validators.compose([Validators.maxLength(2000)])],
            // amount: ['', Validators.compose([Validators.required, Validators.pattern(/^([0-9]+)?(\.[0-9]{0,8})?$/), Validators.min(0.00001), (control: AbstractControl) => Validators.max((2 - 3) / 100000000)(control)])],
            // restorekey: [this.identity.restorekey]
        });

        this.form.valueChanges.pipe(debounceTime(300))
            .subscribe(data => this.onValueChanged(data));
    }

    get formName(): any { return this.form.get('name').value; }
    get formShortName(): any { return this.form.get('shortname').value; }
    get formAlias(): any { return this.form.get('alias').value; }
    get formTitle(): any { return this.form.get('title').value; }
    get formPublished(): any { return this.form.get('published').value; }
    get formPublish(): any { return this.form.get('publish').value; }
    get formPassword(): any { return this.form.get('password').value; }

    // async addLink() {
    //     const dialogRef = this.dialog.open(LinkAddComponent, {
    //         width: '440px',
    //         data: { url: '', type: '' }
    //     });

    //     dialogRef.afterClosed().subscribe(result => {
    //         console.log('The dialog was closed', result);

    //         if (result) {
    //             console.log('RESULT:', result);
    //             this.identity.links.push(result);
    //             // this.hubService.add(result).then(data => {
    //             //     // Update the local list of hubs with the one persisted in settings.
    //             //     this.hubs = this.settings.hubs;
    //             //     this.cd.markForCheck();
    //             // });
    //         }
    //     });
    // }

    onChanged(event) {
        if (this.originalIdentityContainer.published && !this.formPublish) {
            this.publishWarning = true;
        } else {
            this.publishWarning = false;
        }
    }

    unlock() {

        this.formErrors.password = 'Whops!';
        this.invalidPassword = false;

        try {
            const valid = this.identityService.verifyPassword(this.formPassword);
            this.router.navigate(['identity', this.id, 'export']);
        }
        catch (err) {
            console.log('Unlock failure: ', err);
            this.formErrors.password = 'Failed to unlock your fallet. Please check your password.';
            console.log('Set forms error!');
            this.invalidPassword = true;

            this.cd.detectChanges();
        }

        // Save the image.
        // TODO: Make sure we check if image is actually changed, if not, then don't save it.
        // this.profileImageService.setImage(this.identity.id, this.image);

        // eslint-disable-next-line guard-for-in
        // for (const field in this.form.controls) {
        //     // Copy all input fields onto our identity.

        //     if (field === 'published' || field === 'publish') {
        //         continue;
        //     }

        //     this.identityContainer.content[field] = this.form.get(field).value;
        // }

        // // Set the published from the form.
        // this.identityContainer.publish = this.form.get('publish').value;
        // this.identityContainer.published = this.form.get('publish').value;

        // this.identityService.add(this.identityContainer);
        // this.router.navigateByUrl('/identity');
    }

    jsonCopy(src) {
        return JSON.parse(JSON.stringify(src));
    }

    // removeLink(link: Link) {
    //     const index = this.identity.links.findIndex(l => l === link);
    //     this.identity.links.splice(index, 1);
    //     // console.log('Trying to remove:' + id);
    //     // this.hubService.remove(id);
    //     // this.hubs = this.settings.hubs;
    //     // this.cd.markForCheck();
    // }

    imageUpdated(event: ImageCroppedEvent) {
        this.image = event.base64;
        console.log(event);
    }

    onValueChanged(data?: any) {
        if (!this.form) { return; }

        // eslint-disable-next-line guard-for-in
        for (const field in this.formErrors) {
            this.formErrors[field] = '';
            const control = this.form.get(field);
            if (control && control.dirty && !control.valid) {
                const messages = this.validationMessages[field];

                // eslint-disable-next-line guard-for-in
                for (const key in control.errors) {
                    this.formErrors[field] += messages[key] + ' ';
                }
            }
        }

        this.apiError = '';

        // if (this.sendForm.get('address').valid && this.sendForm.get('amount').valid) {
        //     this.estimateFee();
        // }
    }

    send() {
        // this.isSending = true;

        // this.showInputField = false;
        // this.showConfirmationField = false;
        // this.showSendingField = true;

        // this.buildTransaction();
    }

    ngOnDestroy() {
        // this.subscription.unsubscribe();
    }

    back() {
        this.location.back();
    }
}
