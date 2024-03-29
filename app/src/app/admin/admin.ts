import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatAccordion } from '@angular/material/expansion';
import { nip19, Relay } from 'nostr-tools';
import { ApplicationState } from '../services/applicationstate';
import { StorageService } from '../services/storage';
import { EventService } from '../services/event';
import { NostrRelay } from '../services/interfaces';
import { ProfileService } from '../services/profile';
import { RelayService } from '../services/relay';
import { ThemeService } from '../services/theme';
import {
  AddRelayDialog,
  AddRelayDialogData,
} from '../shared/add-relay-dialog/add-relay-dialog';
import { OptionsService } from '../services/options';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DataService } from '../services/data';
import { NostrService } from '../services/nostr';
import { UploadService } from '../services/upload';
import {
  PasswordDialog,
  PasswordDialogData,
} from '../shared/password-dialog/password-dialog';
import { SecurityService } from '../services/security';
import * as QRCode from 'qrcode';
import { TranslateService } from '@ngx-translate/core';
import { ApiService } from '../services/api.service';
import { MatTableDataSource } from '@angular/material/table';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { catchError, map, merge, of, startWith, switchMap } from 'rxjs';

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}
const ELEMENT_DATA: PeriodicElement[] = [
  { position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H' },
  { position: 2, name: 'Helium', weight: 4.0026, symbol: 'He' },
  { position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li' },
  { position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be' },
  { position: 5, name: 'Boron', weight: 10.811, symbol: 'B' },
  { position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C' },
  { position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N' },
  { position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O' },
  { position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F' },
  { position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne' },
];

@Component({
  selector: 'app-admin',
  templateUrl: './admin.html',
  styleUrls: ['./admin.css'],
})
export class AdminComponent {
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  wiped = false;
  wipedNonFollow = false;
  wipedNotes = false;
  open = false;
  users = [];

  // displayedColumns: string[] = ['position', 'name', 'weight', 'symbol'];
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  // @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['created', 'did', 'number', 'name'];
  // exampleDatabase: ExampleHttpDatabase | null;
  data: any[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  resultsLength = 0;
  isLoadingResults = true;
  isRateLimitReached = false;

  constructor(
    private _liveAnnouncer: LiveAnnouncer,
    public uploadService: UploadService,
    private nostr: NostrService,
    public optionsService: OptionsService,
    public relayService: RelayService,
    public dialog: MatDialog,
    public appState: ApplicationState,
    private profileService: ProfileService,
    public theme: ThemeService,
    public db: StorageService,
    private snackBar: MatSnackBar,
    public dataService: DataService,
    private security: SecurityService,
    public translate: TranslateService,
    private apiService: ApiService
  ) {}

  async ngAfterViewInit() {
    // this.dataSource.sort = this.sort;

    // If the user changes the sort order, reset back to the first page.
    this.sort.sortChange.subscribe(() => {
      this.paginator.pageIndex = 0;
      console.log('SORT CHANGE!');
    });

    this.paginator.page.subscribe(() => {
      console.log('PAGE!!');
    });

    this.data = await this.apiService.users(
      this.sort.active,
      this.sort.direction,
      this.paginator.pageIndex
    );

    this.isLoadingResults = false;
    this.isRateLimitReached = this.data === null;

    if (this.data === null) {
      this.data = [];
      this.resultsLength = 0;
    } else {
      // this.resultsLength = this.data.total_count;
    }

    // merge(this.sort.sortChange, this.paginator.page)
    //   .pipe(
    //     startWith({}),
    //     switchMap(() => {
    //       this.isLoadingResults = true;
    //       return this.apiService!.users(
    //         this.sort.active,
    //         this.sort.direction,
    //         this.paginator.pageIndex
    //       ).pipe(catchError(() => of(null)));
    //     }),
    //     map((data) => {
    //       // Flip flag to show that loading has finished.
    //       this.isLoadingResults = false;
    //       this.isRateLimitReached = data === null;

    //       if (data === null) {
    //         return [];
    //       }

    //       // Only refresh the result length if there is new data. In case of rate
    //       // limit errors, we do not want to reset the paginator to zero, as that
    //       // would prevent users from re-triggering requests.
    //       this.resultsLength = data.total_count;
    //       return data.items;
    //     })
    //   )
    //   .subscribe((data) => (this.data = data));
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort | any) {
    // This example uses English messages. If your application supports
    // multiple language, you would internationalize these strings.
    // Furthermore, you can customize the message to add additional
    // details about the values being sorted.
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  toggle() {
    if (this.open) {
      this.open = false;
      this.accordion.closeAll();
    } else {
      this.open = true;
      this.accordion.openAll();
    }
  }

  openMediaPlayer() {
    this.optionsService.values.showMediaPlayer = true;
  }

  async primaryRelay(relay: NostrRelay) {
    this.optionsService.values.primaryRelay = relay.url;
    this.optionsService.save();
  }

  // async deleteRelay(relay: Relay) {
  //   await this.relayService.deleteRelay(relay.url);
  // }

  async deleteRelays() {
    await this.relayService.deleteRelays([]);
  }

  async clearProfileCache() {
    // await this.profileService.wipeNonFollow();
    this.wipedNonFollow = true;
  }

  // async onRelayChanged(relay: NostrRelay) {
  //   if (relay.metadata.enabled && relay.metadata.read) {
  //     await relay.connect();
  //   } else if (!relay.metadata.read) {
  //     await relay.close();
  //   } else {
  //     await relay.close();
  //   }

  //   await this.relayService.putRelayMetadata(relay.metadata);
  // }

  async clearNotesCache() {
    // await this.feedService.wipe();
    this.wipedNotes = true;
  }

  async getDefaultRelays() {
    // Append the default relays.
    await this.relayService.appendRelays(this.nostr.defaultRelays);
  }

  // private getPublicPublicKeys() {
  //   console.log(this.profileService.following);
  //   const items: string[] = [];

  //   for (let i = 0; i < this.circleService.circles.length; i++) {
  //     const circle = this.circleService.circles[i];

  //     if (circle.public) {
  //       const profiles = this.getFollowingInCircle(circle.id);
  //       const pubkeys = profiles.map((p) => p.pubkey);
  //       items.push(...pubkeys);
  //     }
  //   }

  //   return items;
  // }

  async getRelays() {
    const relays = await this.nostr.relays();

    // Append the default relays.
    await this.relayService.appendRelays(relays);
  }

  async ngOnInit() {
    this.appState.updateTitle('Administration');
    this.appState.showBackButton = false;
    this.appState.actions = [
      {
        icon: 'add_circle',
        tooltip: 'Add Relay',
        click: () => {
          this.addRelay();
        },
      },
    ];

    this.hasPrivateKey =
      localStorage.getItem('blockcore:notes:nostr:prvkey') != null;
  }

  registerHandler(protocol: string, parameter: string) {
    // navigator.registerProtocolHandler(protocol, `./index.html?${parameter}=%s`);
    navigator.registerProtocolHandler(protocol, `/?${parameter}=%s`);
  }

  addRelay(): void {
    const dialogRef = this.dialog.open(AddRelayDialog, {
      data: { read: true, write: true },
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result: AddRelayDialogData) => {
      if (!result) {
        return;
      }

      // Append the Web Socket prefix if missing.
      if (result.url.indexOf('://') === -1) {
        result.url = 'wss://' + result.url;
      }

      await this.relayService.appendRelay(
        result.url,
        result.read,
        result.write
      );
    });
  }

  hasPrivateKey = false;
  verifiedWalletPassword?: boolean;
  privateKey?: string;
  qrCodePrivateKey?: string;

  resetPrivateKey() {
    this.privateKey = undefined;
    this.qrCodePrivateKey = undefined;
    this.verifiedWalletPassword = undefined;
  }

  ngOnDestroy() {
    this.resetPrivateKey();
  }

  onLanguageChanged(event: any) {
    this.appState.setLanguage(this.optionsService.values.language);

    const rtlLanguages: string[] = ['ar', 'fa', 'he'];

    if (rtlLanguages.includes(this.optionsService.values.language)) {
      this.appState.documentDirection = 'rtl';
      this.optionsService.values.dir = 'rtl';
    } else {
      this.appState.documentDirection = 'ltr';
      this.optionsService.values.dir = 'ltr';
    }

    this.optionsService.save();
  }

  async exportPrivateKey() {
    const dialogRef = this.dialog.open(PasswordDialog, {
      data: { action: 'Unlock Private Key', password: '' },
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result: PasswordDialogData) => {
      if (!result) {
        return;
      }

      let prvkeyEncrypted = localStorage.getItem(
        'blockcore:notes:nostr:prvkey'
      );

      const prvkey = await this.security.decryptData(
        prvkeyEncrypted!,
        result.password
      );

      if (!prvkey) {
        this.verifiedWalletPassword = false;

        this.snackBar.open(
          `Unable to decrypt data. Probably wrong password. Try again.`,
          'Hide',
          {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
          }
        );
        return;
      }

      this.verifiedWalletPassword = true;

      const privateKey = nip19.nsecEncode(prvkey);
      this.privateKey = privateKey;

      this.qrCodePrivateKey = await QRCode.toDataURL(
        'nostr:' + this.privateKey,
        {
          errorCorrectionLevel: 'L',
          margin: 2,
          scale: 5,
        }
      );
    });

    // this.verifiedWalletPassword = null;
    // this.privateKey = null;
    // const dialogRef = this.dialog.open(PasswordDialog, {
    //   data: { password: null },
    // });

    // dialogRef.afterClosed().subscribe(async (result) => {
    //   if (result === null || result === undefined || result === '') {
    //     return;
    //   }

    //   this.verifiedWalletPassword = await this.walletManager.verifyWalletPassword(this.walletManager.activeWalletId, result);

    //   if (this.verifiedWalletPassword === true) {
    //     const network = this.identityService.getNetwork(this.walletManager.activeAccount.networkType);
    //     const identityNode = this.identityService.getIdentityNode(this.walletManager.activeWallet, this.walletManager.activeAccount);

    //     this.privateKey = this.cryptoUtility.convertToBech32(identityNode.privateKey, 'nsec');
    //     console.log(secp.utils.bytesToHex(identityNode.privateKey));
    //     //this.privateKey = secp.utils.bytesToHex(identityNode.privateKey);

    //     this.qrCodePrivateKey = await QRCode.toDataURL('nostr:' + this.privateKey, {
    //       errorCorrectionLevel: 'L',
    //       margin: 2,
    //       scale: 5,
    //     });
    //   }
  }
}
