import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, map, shareReplay, Observable } from 'rxjs';
import { AuthenticationService } from './authentication';
import { Action } from './interfaces';
import { Location } from '@angular/common';
import { Title } from '@angular/platform-browser';
import { Direction } from '@angular/cdk/bidi';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class ApplicationState {
  constructor(
    public translate: TranslateService,
    private breakpointObserver: BreakpointObserver,
    private authService: AuthenticationService,
    private location: Location,
    private titleService: Title
  ) {
    this.isSmallScreen$ = this.breakpointObserver
      .observe('(max-width: 599px)')
      .pipe(
        map((result) => result.matches),
        shareReplay()
      );

    this.displayLabels$ = this.breakpointObserver
      .observe('(max-width: 720px)')
      .pipe(
        map((result) => result.matches),
        shareReplay()
      );

    this.connected$ = this.connectedChanged.asObservable();

    this.visibility$ = this.visibilityChanged.asObservable();

    this.title$ = this.titleChanged.asObservable();

    this.initialized$ = this.initializedChanged.asObservable();

    this.authenticated$ = this.authenticatedChanged.asObservable();
  }

  identity: any;

  short: any;

  enableDebugUser = false;

  #authenticated: boolean = false;

  get authenticated() {
    return this.#authenticated;
  }

  set authenticated(value: boolean) {
    this.#authenticated = value;
    this.authenticatedChanged.next(value);
  }

  authenticated$: Observable<boolean>;

  authenticatedChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  approved: boolean = false;

  admin = false;

  payload: any;

  reset() {
    this.identity = null;
    this.authenticated = false;
    this.admin = false;
    this.approved = false;
  }

  debugUser() {
    this.identity =
      'did:is:b0204d42c4d14ce5135ecb198ae97e8c296149daaed0bdebcd3a79553d3d386a';
    this.authenticated = true;
    this.admin = true;
    this.approved = true;
  }

  getPublicKey(): string {
    return this.authService.authInfo$.getValue().publicKeyHex!;
  }

  getPublicKeyDisplay(): string {
    return this.authService.authInfo$.getValue().publicKey!;
  }

  navigateBack() {
    this.location.back();
  }

  title = 'Free City Hub';

  title$: Observable<string>;

  titleChanged: BehaviorSubject<string> = new BehaviorSubject<string>(
    this.title
  );

  updateTitle(title: string) {
    this.title = title;
    this.titleService.setTitle(title + ' - Free City Hub');
    this.titleChanged.next(this.title);
  }

  goBack = false;

  showBackButton = false;

  backUrl?: string;

  searchText?: string;

  showSearch = false;

  showLogo = true;

  actions: Action[] = [];

  documentDirection: Direction = 'ltr';

  /** Parameters that comes from query string during activation of the extension. */
  params: any;

  isSmallScreen$: Observable<boolean>;

  displayLabels$: Observable<boolean>;

  connected$: Observable<boolean>;

  initialized$: Observable<boolean>;

  connected = false;

  connectedChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    this.connected
  );

  initializedChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  /** This will check if status has changed and trigger. If status is the same, the observable is not triggered. */
  updateConnectionStatus(status: boolean) {
    if (this.connected != status) {
      this.connected = status;
      this.connectedChanged.next(status);
    }
  }

  visibility$: Observable<boolean>;

  visibilityChanged: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );

  visibility(status: boolean) {
    this.visibilityChanged.next(status);
  }

  initialized = false;

  setInitialized() {
    this.initialized = true;
    this.initializedChanged.next(this.initialized);
  }

  setLanguage(language: string) {
    this.translate.use(language);
  }
}
