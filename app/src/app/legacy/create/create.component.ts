import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { FormArray } from '@angular/forms';

@Component({
  selector: 'app-create',
  templateUrl: 'create.component.html',
  styleUrls: ['./create.component.css'],
})
export class CreateComponent implements OnInit {
  constructor(private fb: FormBuilder) {}

  ngOnInit() {}

  preview = false;
  favoriteSeason?: string = 'sell';
  seasons: string[] = ['give', 'buy', 'sell'];

  adForm = this.fb.group({
    reason: ['sell', Validators.required],
    title: ['', Validators.required],
    description: [''],
    price: [''],
    location: [''],
    address: this.fb.group({
      street: [''],
      city: [''],
      state: [''],
      zip: [''],
    }),
    aliases: this.fb.array([this.fb.control('')]),
  });

  get aliases() {
    return this.adForm.get('aliases') as FormArray;
  }

  updateProfile() {
    // this.adForm.patchValue({
    //   firstName: 'Nancy',
    //   address: {
    //     street: '123 Drew Street',
    //   },
    // });
  }

  addAlias() {
    this.aliases.push(this.fb.control(''));
  }

  edit() {
    this.preview = false;
  }

  data: any;

  onSubmit() {
    // TODO: Use EventEmitter with form value
    console.warn(this.adForm.value);

    this.data = this.adForm.value;
    this.preview = true;
  }
}
