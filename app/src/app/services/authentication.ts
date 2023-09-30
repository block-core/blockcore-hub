import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { Utilities } from './utilities';
import { environment } from '../../environments/environment';

export class UserInfo {
  publicKey?: string;

  publicKeyHex?: string;

  short?: string;

  authenticated() {
    return !!this.publicKeyHex;
  }
}

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  static UNKNOWN_USER = new UserInfo();

  authInfo$: BehaviorSubject<UserInfo> = new BehaviorSubject<UserInfo>(
    AuthenticationService.UNKNOWN_USER
  );

  constructor(private utilities: Utilities, private router: Router) {}

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

    localStorage.removeItem('blockcore:hub:pubkey');

    const result = await response.json();
    console.log('LOGOUT RESULT:', result);
    return result;
  }

  async login() {
    const gt = globalThis as any;

    const publicKey = await gt.nostr.getPublicKey();
    const user = this.createUser(publicKey);

    localStorage.setItem('blockcore:hub:pubkey', publicKey);

    this.authInfo$.next(user);
    return user;
  }

  anonymous(readOnlyKey?: string) {
    if (readOnlyKey) {
      readOnlyKey = this.utilities.ensureHexIdentifier(readOnlyKey);
    }

    const publicKey =
      readOnlyKey ||
      '354faab36ca511a7956f0bfc2b64e06fe5395cd7208d9b65d6665270298743d8';
    const user = this.createUser(publicKey);
    localStorage.setItem('blockcore:hub:pubkey', publicKey);

    this.authInfo$.next(user);
    return user;
  }

  logout2() {
    localStorage.removeItem('blockcore:hub:pubkey');
    localStorage.removeItem('blockcore:notes:nostr:prvkey');
    this.authInfo$.next(AuthenticationService.UNKNOWN_USER);
    this.router.navigateByUrl('/connect');
  }

  private createUser(publicKey: string) {
    const user = new UserInfo();
    user.publicKeyHex = publicKey;
    user.publicKey = this.utilities.getNostrIdentifier(publicKey);
    user.short = publicKey.substring(0, 10) + '...'; // TODO: Figure out a good way to minimize the public key, "5...5"?
    return user;
  }

  createDidUser(publicKey: string) {
    const user = new UserInfo();
    user.publicKeyHex = publicKey;
    // user.publicKey = this.utilities.getNostrIdentifier(publicKey);
    user.short = publicKey.substring(0, 10) + '...'; // TODO: Figure out a good way to minimize the public key, "5...5"?
    return user;
  }

  async getAuthInfo() {
    let publicKey = localStorage.getItem('blockcore:hub:pubkey');

    if (publicKey) {
      try {
        this.utilities.getNostrIdentifier(publicKey);
      } catch (err) {
        // If we cannot parse the public key, reset the storage.
        publicKey = '';
        localStorage.setItem('blockcore:hub:pubkey', '');
        return AuthenticationService.UNKNOWN_USER;
      }

      const user = this.createUser(publicKey);
      this.authInfo$.next(user);
      return user;
    } else {
      this.authInfo$.next(AuthenticationService.UNKNOWN_USER);
      return AuthenticationService.UNKNOWN_USER;
    }
  }
}
