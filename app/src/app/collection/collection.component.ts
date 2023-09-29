import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-collection',
  templateUrl: 'collection.component.html',
})
export class CollectionComponent implements OnInit {
  collections: any[] = [];

  constructor(private apiService: ApiService) {}

  async ngOnInit() {
    this.collections = await this.apiService.collections();

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
