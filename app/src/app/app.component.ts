import { Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { ApiService } from './services/api.service';
import { WebProvider } from '@blockcore/provider';
import { AuthService } from './services/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApplicationState } from './services/applicationstate.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  @ViewChild(MatSidenav) sidenav!: MatSidenav;

  opened: boolean = true;

  events: string[] = [];

  title = 'Blockcore Market';

  provider?: WebProvider;

  loading = true;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    public appState: ApplicationState,
    private router: Router
  ) {
    // Minor hack to avoid the flickering of the icons.
    document.fonts.ready.then((fontFaceSet) => {
      setTimeout(() => {
        document.getElementById('waitScreen')!.style.display = 'none';
      }, 0);
    });
  }

  async ngOnInit() {
    // Verify if the user is already authenticated.
    if (!this.appState.authenticated) {
      const authenticated = await this.authService.authenticated();

      if (authenticated && !authenticated.error) {
        this.appState.authenticated = true;
        this.appState.identity = authenticated.user.did;
        this.appState.admin = authenticated.user.admin;
        this.appState.approved = authenticated.user.approved;
      } else {
        this.appState.reset();
      }
    }

    this.loading = false;
  }

  async login() {
    if (!this.provider) {
      this.provider = await WebProvider.Create();
    }

    try {
      // console.log('authenticateUrl:', this.authenticateUrl);

      const challengeResult = await this.authService.challenge();
      const challenge = challengeResult.challenge;

      console.log('challengeResult:', challengeResult);

      // Request a JWS from the Web5 wallet.
      const result = await this.request('did.request', [
        {
          challenge: challenge,
          methods: 'did:is',
          reason: 'Choose a DID that has permission to this Blockcore Vault.',
        },
      ]);

      const verify = await this.authService.verify(result.response);
      console.log('VERIFY:', verify);

      if (verify.error) {
        this.appState.reset();
        this.snackBar.open(verify.error, 'OK', { duration: 3000 });
      } else {
        this.appState.authenticated = true;
        this.appState.identity = verify.user.did;
        this.appState.admin = verify.user.admin;
        this.appState.approved = verify.user.approved;
      }

      //   // const identity = new BlockcoreIdentity(null);
      //   // this.appState.identity = content.user.did;
      //   // this.appState.short = identity.shorten(content.user.did);
      //   // console.log(this.appState);

      //   // this.appState.authenticated = true;
      //   // this.router.navigateByUrl('/');

      //   // const postResponse2 = await fetch(this.authenticateUrl + '/protected', {
      //   //   method: 'GET',
      //   //   headers: {
      //   //     Accept: 'application/json',
      //   //     'Content-Type': 'application/json',
      //   //   },
      //   // });

      //   // if (postResponse2.status == 200) {
      //   //   console.log('PROTECTED WORKS!!!!');
      //   //   // const content2 = await postResponse2.json();
      //   //   // console.log(content2);

      //   //   // // Make sure we keep the URL which is used by the setup account page.
      //   //   // // this.appState.vaultUrl = this.vault.url;
      //   //   // this.appState.authenticated = true;
      //   //   // this.router.navigateByUrl('/');

      //   //   // Make the current vault available in the app state.
      //   //   // this.appState.vault = result;
      //   //   // this.appState.authenticated = true;
      //   //   // this.router.navigateByUrl('/');
      //   // } else {
      //   //   console.log('PROTECTED NO!');
      //   //   // this.error = postResponse.statusText;
      //   // }
      // } else {
      //   // this.error = postResponse.statusText;
      //   console.log(
      //     'Failed to authenticate. Status: ',
      //     postResponse.statusText
      //   );
      // }
    } catch (err) {
      // this.error = err.toString();
      console.error('Failed to authenticate.', err);
    }
  }

  async logout() {
    this.loading = true;
    await this.authService.logout();

    this.appState.authenticated = false;
    this.appState.admin = false;
    this.appState.identity = null;

    this.loading = false;

    this.router.navigateByUrl('/');
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
}
