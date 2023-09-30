import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-category',
  templateUrl: 'category.component.html',
})
export class CategoryComponent implements OnInit {
  collections: any[] = [];

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    this.collections = await this.apiService.categories();

    // const rawResponse = await fetch(serviceUrl, {
    //   method: 'POST',
    //   headers: {
    //     Accept: 'application/json',
    //     'Content-Type': 'application/json',
    //   },
    //   body: jws,
    // });
  }
}
