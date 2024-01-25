import { ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApplicationState } from '../../services/applicationstate';
import { Utilities } from '../../services/utilities';
import { DataValidation } from '../../services/data-validation';
import { Circle, NostrProfileDocument } from '../../services/interfaces';
import { ProfileService } from '../../services/profile';
import { CircleService } from '../../services/circle';
import { CircleDialog } from '../../shared/create-circle-dialog/create-circle-dialog';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthenticationService } from '../../services/authentication';
import { copyToClipboard } from '../../shared/utilities';
import { Subscription, tap } from 'rxjs';
import { DataService } from '../../services/data';
import { NavigationService } from '../../services/navigation';
import { ApiService } from '../../services/api.service';
import * as L from 'leaflet';
import { round, chain, add, larger } from 'mathjs';

@Component({
  selector: 'app-land',
  templateUrl: './land.component.html',
  styleUrls: ['./land.component.css'],
})
export class LandRegistryComponent {
  publicKey?: string | null;
  loading = false;
  searchTerm: any;

  collections: any[] = [];

  private map: any;

  constructor(
    public navigation: NavigationService,
    public appState: ApplicationState,
    public circleService: CircleService,
    private profileService: ProfileService,
    public dialog: MatDialog,
    private validator: DataValidation,
    private utilities: Utilities,
    private authService: AuthenticationService,
    private router: Router,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private cd: ChangeDetectorRef,
    private ngZone: NgZone,
    private apiService: ApiService,
    private activatedRoute: ActivatedRoute
  ) {}

  onEachFeature(feature: any, layer: any) {
    // does this feature have a property named popupContent?
    if (feature.properties && feature.properties.popupContent) {
      layer.bindPopup(feature.properties.popupContent);
    }
  }

  roundton(num: any, n: any) {
    return Number(num.toFixed(n));
  }

  closestNumber(n: number, m: number) {
    return Math.floor(n / m) * m;
  }

  getTile(n: number, m: number) {
    let lower = Math.floor(n / m) * m;
    let upper = lower + m;

    return {
      lower: lower,
      upper: upper,
    };
  }

  ngOnDestroy() {
    this.utilities.unsubscribe(this.subscriptions);
  }

  async deleteCircle(id: number) {
    const pubKeys = this.getFollowingInCircle(id).map((f) => f.pubkey);

    await this.circleService.delete(id);

    for (var i = 0; i < pubKeys.length; i++) {
      await this.profileService.setCircle(pubKeys[i], 0);
    }
  }

  countMembers(circle: Circle) {
    return this.getFollowingInCircle(circle.id).length;
  }

  subscriptions: Subscription[] = [];

  copy(text: string) {
    copyToClipboard(text);

    this.snackBar.open('Copied to clipboard', 'Hide', {
      duration: 2500,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
    });
  }

  getFollowingInCircle(id?: number) {
    if (id == null) {
      return this.profileService.following.filter(
        (f) => f.circle == null || f.circle == 0
      );
    } else {
      return this.profileService.following.filter((f) => f.circle == id);
    }
  }

  copyPubKeys(circle: Circle) {
    let pubkeys = this.getPublicKeys(circle);
    pubkeys = pubkeys.map((k) => this.utilities.getNostrIdentifier(k));
    this.copy(JSON.stringify(pubkeys));
  }

  copyPubKeysHex(circle: Circle) {
    const pubkeys = this.getPublicKeys(circle);
    this.copy(JSON.stringify(pubkeys));
  }

  private getPublicKeys(circle: Circle) {
    const profiles = this.getFollowingInCircle(circle.id);
    const pubkeys = profiles.map((p) => p.pubkey);
    return pubkeys;
  }

  private getPublicPublicKeys() {
    // console.log(this.items);
    console.log(this.profileService.following);

    const items: string[] = [];

    for (let i = 0; i < this.circleService.circles.length; i++) {
      const circle = this.circleService.circles[i];

      if (circle.public) {
        const profiles = this.getFollowingInCircle(circle.id);
        const pubkeys = profiles.map((p) => p.pubkey);
        items.push(...pubkeys);
      }
    }

    return items;
  }

  getNpub(hex: string) {
    return this.utilities.getNostrIdentifier(hex);
  }

  createCircle(): void {
    const dialogRef = this.dialog.open(CircleDialog, {
      data: { name: '', style: 1, public: true },
      maxWidth: '100vw',
      panelClass: 'full-width-dialog',
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      if (!result) {
        return;
      }

      this.circleService.put(result);
    });
  }

  project: any;

  async ngOnInit() {
    this.appState.updateTitle('Projects');
    this.appState.showBackButton = true;
    this.appState.actions = [];

    this.subscriptions.push(
      this.activatedRoute.paramMap.subscribe(async (params) => {
        const id: any = params.get('id');

        if (!id) {
          this.router.navigateByUrl('/registries');
          return;
        }

        this.project = await this.apiService.registry(id);

        // The map still needs to be outside the ngIf, need to delay this code after rendered.
        this.initMap();
      })
    );

    // this.subscriptions.push(this.profileService.items$.subscribe((profiles) => (this.following = profiles)) as Subscription);
  }

  selectedTiles: Map<string, any> = new Map<any, any>();

  copyGeoJson() {
    this.selectedTiles.forEach((value, key) => {
      // console.log(key, value);
      console.log(value.toGeoJSON());
    });
  }

  initMap() {
    this.map = L.map('map', {
      attributionControl: true,

      center: [58.358786, 7.547088],
      zoom: 19,

      minZoom: 10,
      maxZoom: 23,
      // maxBounds: [
      //   [58.3, 7.6],
      //   [58.4, 7.5],
      // ],
    });

    // initialize the map on the "map" div with a given center and zoom
    // this.map = L.map('map', {
    //   center: [51.505, -0.09],
    //   zoom: 13,
    // });

    this.map.attributionControl.setPrefix('');

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 25,
      maxNativeZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    // L.tileLayer('https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=Nibcache_UTM33_EUREF89&zoom={z}&x={x}&y={y}', {
    //   maxZoom: 25,
    //   maxNativeZoom: 19,
    //   attribution:
    //     '<a href="http://www.kartverket.no/">Kartverket</a>',
    // }).addTo(this.map);

    this.map.on('click', (e: any) => {
      const lat = this.roundton(e.latlng.lat, 6);
      const lng = this.roundton(e.latlng.lng, 6);

      let num = lat;
      let decimals = (num % 1) * 1000000;
      console.log(decimals);
      let nearest = Math.floor(decimals / 9) * 9;
      console.log(nearest);
      let before = nearest * 0.000001;
      let after = (nearest + 9) * 0.000001;

      let num2 = lng;
      let decimals2 = (num2 % 1) * 1000000;
      console.log(decimals2);
      let nearest2 = Math.floor(decimals2 / 18) * 18;
      console.log(nearest2);
      let before2 = nearest2 * 0.000001;
      let after2 = (nearest2 + 18) * 0.000001;

      let tileLat1 = Math.floor(num) + after;
      let tileLng1 = Math.floor(num2) + after2;

      let tileLat2 = tileLat1 - 0.000009;
      let tileLng2 = tileLng1 - 0.000018;

      tileLat1 = Number(tileLat1.toFixed(6));
      tileLng1 = Number(tileLng1.toFixed(6));
      tileLat2 = Number(tileLat2.toFixed(6));
      tileLng2 = Number(tileLng2.toFixed(6));

      var bounds: any = [
        [tileLat1, tileLng1],
        [tileLat2, tileLng2],
      ];

      var color;
      var r = Math.floor(Math.random() * 255);
      var g = Math.floor(Math.random() * 255);
      var b = Math.floor(Math.random() * 255);
      color = 'rgb(' + r + ' ,' + g + ',' + b + ')';

      var borderColor = 'gray';

      var rectangle: any = L.rectangle(bounds, {
        fillColor: color,
        color: borderColor,
        weight: 4,
      });

      const tileId =
        tileLat1 + ':' + tileLng1 + ':' + tileLat2 + ':' + tileLng2;

      console.log('TILE ID: ' + tileId);

      let existingTile = this.selectedTiles.get(tileId);

      console.log(this.selectedTiles);

      if (existingTile) {
        console.log('EXISTS, REMOVE!!!');
        this.map.removeLayer(existingTile);
        this.selectedTiles.delete(tileId);
      } else {
        rectangle.propertyId = 'anonymous';
        rectangle.property = {
          owner: 'Anonymous',
          id: 'liberstad/anarchypark/3',
          location: tileId,
          bounds: bounds,
          // topCenter: new L.LatLng(lat2, center),
          // topLeft: new L.LatLng(lat2, lng2),
          // bottomRight: new L.LatLng(lat1, lng1),
        };

        this.selectedTiles.set(tileId, rectangle);
        console.log(rectangle.property.location);

        this.map.addLayer(rectangle);
      }

      // let before = decimals * 0.0000001;
      // let after = (decimals + 9) * 0.0000001;
      // // Log to console
      // console.log('before', Math.floor(num) + before);
      // console.log('after', Math.floor(num) + after);

      // decimals = decimals * 0.0000001;

      // let num = 58.358208 * 1000000;
      // let closest = this.closestNumber(num, 9);
      // let decimals = num / 1000000;

      // 58.358209

      // lat : 58.358214254714134
      // lng : 7.54912555217743
    });

    this.map.whenReady(() => {
      this.drawGrid();
    });
    this.map.on('move', () => {
      this.drawGrid();
    });
  }

  grid: any;

  drawGrid() {
    if (!this.map) {
      return;
    }

    const zoom = this.map.getZoom();
    const bounds = this.map.getBounds();

    const northWest = bounds.getNorthWest();
    const southEast = bounds.getSouthEast();

    // We must ensure that we find the nearest correct starting point from these values:

    // LAT = "height".
    let lat1 = northWest.lat;
    let lat2 = southEast.lat;

    // LNG = "width".
    let lng1 = northWest.lng;
    let lng2 = southEast.lng;

    let num = lat1;
    let decimals = (num % 1) * 1000000;
    let nearest = Math.floor(decimals / 9) * 9;
    let before = nearest * 0.000001;
    let after = (nearest + 9) * 0.000001;

    let num2 = lng1;
    let decimals2 = (num2 % 1) * 1000000;
    let nearest2 = Math.floor(decimals2 / 18) * 18;
    let before2 = nearest2 * 0.000001;
    let after2 = (nearest2 + 18) * 0.000001;

    let tileLat1 = round(Math.floor(num) + after, 6);
    let tileLng1 = round(Math.floor(num2) + after2, 6);

    let base = chain(tileLat1);

    this.features[0].features[0].geometry.coordinates = [];

    let j = 0;

    // This will render horisontal (longitude) lines, starting on top and going down (north to south).
    while (base > lat2) {
      base = base.add(-0.000009);

      const value = base.round(6).valueOf();

      this.features[0].features[0].geometry.coordinates.push([
        [lng1, value],
        [lng2, value],
      ]);

      j++;
    }

    let baseLng = chain(tileLng1);
    let i = 0;

    // This will render vertical (latitude) lines, starting on the left and going right (west to east).
    while (baseLng < lng2) {
      baseLng = baseLng.add(0.000018);

      const value = baseLng.round(6).valueOf();

      this.features[0].features[0].geometry.coordinates.push([
        [value, lat1],
        [value, lat2],
      ]);

      i++;
    }

    const loadFeatures = zoom > 18;

    if (loadFeatures) {
      if (this.grid) {
        this.map.removeLayer(this.grid);
      }
      this.grid = L.geoJSON(this.features[0], {
        style: function () {
          return {
            color: 'rgb(180, 180, 180)',
            stroke: true,
            weight: 1,
          };
        },
      }).addTo(this.map);
    } else {
      if (this.grid) {
        this.map.removeLayer(this.grid);
        this.grid = null;
      }
    }
  }

  features: any = [
    {
      features: [
        {
          geometry: {
            coordinates: [
              [
                [7.543198, 58.358218],
                [7.549565, 58.358218],
              ],
              [
                [7.543198, 58.358227],
                [7.549565, 58.358227],
              ],
              [
                [7.543198, 58.358236],
                [7.549565, 58.358236],
              ],
              [
                [7.543198, 58.358245],
                [7.549565, 58.358245],
              ],
              [
                [7.543198, 58.358254],
                [7.549565, 58.358254],
              ],
              // [
              //   [7.5491, 58.358096],
              //   [7.5491, 58.359221],
              // ],
              [
                [7.549126, 58.358096],
                [7.549126, 58.359221],
              ],
              [
                [7.549144, 58.358096],
                [7.549144, 58.359221],
              ],
              [
                [7.549162, 58.358096],
                [7.549162, 58.359221],
              ],
            ],
            type: 'MultiLineString',
          },
          type: 'Feature',
          properties: {},
        },
      ],
      type: 'FeatureCollection',
    },
  ];
}
