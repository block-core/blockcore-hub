import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor() {}

  baseUrl() {
    return environment.apiUrl;
  }

  async challenge() {
    const response = await fetch(`${environment.apiUrl}/authenticate`);

    if (response.status >= 400) {
      throw new Error('Unable to receive authentication challenge.');
    }

    const result = await response.json();
    return result;
  }

  async verify(challenge: string) {
    const response = await fetch(`${environment.apiUrl}/authenticate`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(challenge),
    });

    if (response.status >= 400) {
      throw new Error('Unable to verify authentication challenge.');
    }

    const result = await response.json();
    return result;
  }

  async authenticated() {
    const response = await fetch(
      `${environment.apiUrl}/authenticate/protected`
    );

    if (response.status == 200) {
      const result = await response.json();

      return result;
    } else {
      return null;
    }
  }

  async logout() {
    const response = await fetch(`${environment.apiUrl}/authenticate/logout`);

    // if (response.status >= 400) {
    //   throw new Error('Unable to receive authentication challenge.');
    // }

    const result = await response.json();
    console.log('LOGOUT RESULT:', result);
    return result;
  }
}
