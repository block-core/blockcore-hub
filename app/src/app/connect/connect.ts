import { ChangeDetectorRef, Inject, NgZone } from '@angular/core';
import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ApplicationState } from '../services/applicationstate';
import { AuthenticationService } from '../services/authentication';
import { RelayService } from '../services/relay';
import { ThemeService } from '../services/theme';
import { Utilities } from '../services/utilities';
import { ConsentDialog } from './consent-dialog/consent-dialog';
import { SpacesService } from '../services/spaces';
import { WebProvider } from '@blockcore/provider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-connect',
  templateUrl: './connect.html',
  styleUrls: ['./connect.css'],
})
export class ConnectComponent {
  extensionDiscovered = false;
  timeout: any;
  consent: boolean = false;
  readOnlyLogin = false;
  provider?: WebProvider;
  apple = false;

  deviceType = 'desktop';
  loginAction = 'action';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public spacesService: SpacesService,
    public theme: ThemeService,
    private appState: ApplicationState,
    private cd: ChangeDetectorRef,
    private relayService: RelayService,
    private authService: AuthenticationService,
    private utilities: Utilities,
    private router: Router,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    public dialog: MatDialog
  ) {
    // if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    //   console.log('This is an iOS device.');
    //   this.apple = true;
    // } else {
    //   console.log('This is not an iOS device!');
    // }

    const ua = navigator.userAgent;

    if (/android/i.test(ua)) {
      this.deviceType = 'android';
    } else if (/iPad|iPhone|iPod/.test(ua)) {
      this.deviceType = 'apple';
    }
  }

  persist() {
    localStorage.setItem('blockcore:hub:consent', this.consent.toString());
  }

  giveConsent() {
    const dialogRef = this.dialog.open(ConsentDialog, {
      data: false,
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }

      if (result === true) {
        this.consent = true;
        this.persist();
      }
    });
  }

  async request(method: string, params?: object | unknown[]) {
    if (!params) {
      params = [];
    }

    const result: any = await this.provider!.request({
      method: method,
      params: params,
    });
    console.log('Result:', result);

    return result;
  }

  async login() {
    const challengeResult = await this.authService.challenge();
    const challenge = challengeResult.challenge;

    // this.document.location.href = `https://wallet.blockcore.net/index.html?challenge=${challenge}&methods=did%3Ais&action=login&content={}&params={}&app=Free City Hub`;

    const params = JSON.stringify([
      {
        callback: 'https://hub.freeplatform.city/index.html?payload=%s',
        // callback: 'http://localhost:5050/index.html?payload=%s',
        reason: 'Website login',
        methods: 'did:is',
        challenge: challenge,
      },
    ]);
    // const content = JSON.stringify({ content: challenge });
    const content = challenge;

    this.document.location.href = `https://wallet.freeplatform.city/index.html?action=did.request&content=${content}&params=${params}&app=Free City Hub`;
  }

  async connect() {
    if (!this.provider) {
      this.provider = await WebProvider.Create();
    }

    try {
      const challengeResult = await this.authService.challenge();
      const challenge = challengeResult.challenge;

      // Request a JWS from the Web5 wallet.
      const result = await this.request('did.request', [
        {
          challenge: challenge,
          methods: 'did:is',
          reason: 'Choose a DID that has permission to this Blockcore Vault.',
        },
      ]);

      this.parseConnectResult(result.response);
    } catch (err) {
      console.error('Failed to authenticate.', err);
    }
  }

  async parseConnectResult(response: any) {
    const verify = await this.authService.verify(response);

    if (verify.error) {
      this.appState.reset();
      this.snackBar.open(verify.error, 'OK', { duration: 3000 });
    } else {
      this.appState.authenticated = true;
      this.appState.identity = verify.user.did;
      this.appState.admin = verify.user.admin;
      this.appState.approved = verify.user.approved;

      // const publicKey = await gt.nostr.getPublicKey();
      const userInfo = this.authService.createDidUser(verify.user.did);

      localStorage.setItem('blockcore:hub:pubkey', verify.user.did);

      this.authService.authInfo$.next(userInfo);

      if (userInfo.authenticated()) {
        this.router.navigateByUrl('/');
      }
    }
  }

  async connect2() {
    // if (!this.consent) {
    //   const element = document.getElementById('consent-card');
    //   // document.body.scroll(0, 5000);
    //   element!.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    //   return;
    // }

    const userInfo = await this.authService.login();

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  scroll(value: number) {
    const element = document.getElementById('container');

    if (!element) {
      console.log('NOT FOUND!');
      return;
    }

    element.scroll(0, value);

    // element.scrollIntoView();
    // element.scrollIntoView(false);
    // element.scrollIntoView({ block: 'end' });
    // element.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'nearest' });
    // element.scrollBy({top: 500, left: 0, behavior: 'smooth'})
  }

  async anonymous(readOnlyKey?: string) {
    const userInfo = await this.authService.anonymous(readOnlyKey);

    if (userInfo.authenticated()) {
      this.router.navigateByUrl('/');
    }
  }

  async ngOnInit() {
    this.consent = localStorage.getItem('blockcore:hub:consent') === 'true';
    this.checkForExtension();

    debugger;
    if (this.appState.payload) {
      let copyOfPayload = this.appState.payload;
      this.appState.payload = null;
      await this.parseConnectResult(copyOfPayload);

      // debugger;

      // if (!this.appState.approved) {
      //   this.router.navigateByUrl('/create');
      // }
    }
  }

  ngOnDestroy() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  readOnlyKey =
    'npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m';

  checkedTimes = 0;
  showInstallLink = false;
  searchingForExtension = true;

  checkForExtension() {
    this.checkedTimes++;
    const gt = globalThis as any;

    if (gt.blockcore) {
      this.searchingForExtension = false;
      this.extensionDiscovered = true;
      return;
    }

    if (this.checkedTimes > 10) {
      this.searchingForExtension = false;
      this.showInstallLink = true;

      return;
    }

    this.timeout = setTimeout(() => {
      this.ngZone.run(() => {
        this.checkForExtension();
      });
    }, 250);
  }
}
