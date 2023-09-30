import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-admin',
  templateUrl: 'admin.component.html',
  styleUrls: ['admin.component.css'],
})
export class AdminComponent implements OnInit {
  categories: any[] = [];
  collections: any[] = [];
  users: any[] = [];

  constructor(private apiService: ApiService) {}

  ngOnInit() {}

  async loadCategories(type: string) {
    this.categories = await this.apiService.categories();
  }

  async loadCollections(type: string) {
    this.collections = await this.apiService.collections();
  }

  async loadUsers(type: string) {
    this.users = await this.apiService.users();
  }

  newCategory() {
    this.categories.push({ name: '' });
  }

  newUser() {
    this.users.push({ name: '' });
  }

  async saveCategory(item: any) {
    const id = item._id;
    console.log(item);

    if (id) {
      const doc = await this.apiService.updateCategory(id, item);
      const pos = this.categories.findIndex((el) => el._id === id);
      this.categories[pos] = doc;
    } else {
      const doc = await this.apiService.insertCategory(item);
      const pos = this.categories.findIndex((i) => i === item);
      this.categories[pos] = doc;
    }
  }

  async deleteCategory(id: string) {
    await this.apiService.deleteCategory(id);

    const pos = this.categories.findIndex((el) => el._id === id);
    if (pos >= 0) {
      this.categories.splice(pos, 1);
    }
  }

  async saveUser(item: any) {
    const id = item._id;
    console.log(item);

    if (id) {
      const doc = await this.apiService.updateUser(id, item);
      const pos = this.users.findIndex((el) => el._id === id);
      this.users[pos] = doc;
    } else {
      const doc = await this.apiService.insertUser(item);
      const pos = this.users.findIndex((i) => i === item);
      this.users[pos] = doc;
    }
  }

  async deleteUser(id: string) {
    await this.apiService.deleteUser(id);

    const pos = this.users.findIndex((el) => el._id === id);
    if (pos >= 0) {
      this.users.splice(pos, 1);
    }
  }
}
