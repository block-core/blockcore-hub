import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { SortDirection } from '@angular/material/sort';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor() {}

  baseUrl() {
    return environment.apiUrl;
  }

  async categories() {
    const response = await this.fetch(`${environment.apiUrl}/category/root`);

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  async collections() {
    const response = await this.fetch(`${environment.apiUrl}/collection`);

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  async projects() {
    const response = await this.fetch(`${environment.apiUrl}/project`, {
      credentials: 'include',
    });

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  async registries() {
    const response = await this.fetch(`${environment.apiUrl}/registry`, {
      credentials: 'include',
    });

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  async project(id: string) {
    const response = await this.fetch(`${environment.apiUrl}/project/${id}`);

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  async registry(id: string) {
    const response = await this.fetch(`${environment.apiUrl}/registry/${id}`);

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  async users(sort: string, order: SortDirection, page: number) {
    const response = await this.fetch(
      `${environment.apiUrl}/user?sort=${sort}&order=${order}&page=${page + 1}`
    );

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  async usersAll() {
    const response = await this.fetch(`${environment.apiUrl}/user`);

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  // async deleteCategory() {
  //   const response = await fetch(`${environment.apiUrl}/collection`);

  //   if (response.status >= 400) {
  //     throw new Error(response.statusText);
  //   }

  //   const result = await response.json();
  //   return result;
  // }

  async insertCategory(item: any) {
    const response = await this.fetch(`${environment.apiUrl}/category`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result.item;
  }

  async updateCategory(id: string, item: any) {
    const response = await this.fetch(`${environment.apiUrl}/category/${id}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result.item;
  }

  async deleteCategory(id: string) {
    const response = await this.fetch(`${environment.apiUrl}/category/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  async insertUser(item: any) {
    const response = await this.fetch(`${environment.apiUrl}/user`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result.item;
  }

  async updateUser(id: string, item: any) {
    const response = await this.fetch(`${environment.apiUrl}/user/${id}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result.item;
  }

  async deleteUser(id: string) {
    const response = await this.fetch(`${environment.apiUrl}/user/${id}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (response.status >= 400) {
      throw new Error(response.statusText);
    }

    const result = await response.json();
    return result;
  }

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    init = init || {};
    init.credentials = 'include';

    return fetch(input, init);
  }
}
