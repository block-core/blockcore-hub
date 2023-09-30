import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  templateUrl: 'map.component.html',
  styleUrls: ['map.component.css'],
})
export class MapComponent implements OnInit {
  collections: any[] = [];

  private map: any;

  constructor(private apiService: ApiService) {}

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

  async ngOnInit() {
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

    // L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   maxZoom: 25,
    //   maxNativeZoom: 19,
    //   attribution:
    //     '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    // }).addTo(this.map);

    L.tileLayer('https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=Nibcache_UTM33_EUREF89&zoom={z}&x={x}&y={y}', {
      maxZoom: 25,
      maxNativeZoom: 19,
      attribution:
        '<a href="http://www.kartverket.no/">Kartverket</a>',
    }).addTo(this.map);

    // L.tileLayer('https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=norges_grunnkart&zoom={z}&x={x}&y={y}', {
    //   maxZoom: 25,
    //   maxNativeZoom: 19,
    //   attribution:
    //     '<a href="http://www.kartverket.no/">Kartverket</a>',
    // }).addTo(this.map);

    // L.tileLayer('https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=terreng_norgeskart&zoom={z}&x={x}&y={y}', {
    //   maxZoom: 25,
    //   maxNativeZoom: 19,
    //   attribution:
    //     '<a href="http://www.kartverket.no/">Kartverket</a>',
    // }).addTo(this.map);

    // L.tileLayer('https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=norges_grunnkart_graatone&zoom={z}&x={x}&y={y}', {
    //   maxZoom: 25,
    //   maxNativeZoom: 19,
    //   attribution:
    //     '<a href="http://www.kartverket.no/">Kartverket</a>',
    // }).addTo(this.map);

    // L.tileLayer('https://opencache.statkart.no/gatekeeper/gk/gk.open_gmaps?layers=egk&zoom={z}&x={x}&y={y}', {
    //   maxZoom: 25,
    //   maxNativeZoom: 19,
    //   attribution:
    //     '<a href="http://www.kartverket.no/">Kartverket</a>',
    // }).addTo(this.map);

    


    this.collections = await this.apiService.categories();

    const bounderies: any = [
      {
        features: [
          {
            geometry: {
              coordinates: [
                [7.545387049162702, 58.35861905958708],
                [7.5432060438959665, 58.35890264760251],
                [7.541435502741872, 58.357705124841964],
                [7.543100891851065, 58.35677740418083],
                [7.5438733309185695, 58.35768100447337],
                [7.543226386069613, 58.35819151637294],
                [7.544118818697971, 58.35828848489767],
                [7.5447925698604585, 58.357678204028105],
                [7.545796722490535, 58.35834500211113],
                [7.545357794786366, 58.358623307661105],
              ],
              type: 'LineString',
            },
            id: '0708715c-5ca3-53ff-9ae7-23b7f6b133c3',
            properties: {
              measurement: '885.82 m',
              style: {
                stroke: {
                  color: '#FFA500',
                  lineDash: [15, 0],
                  width: 2,
                },
              },
            },
            type: 'Feature',
          },
        ],
        type: 'FeatureCollection',
      },
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              coordinates: [
                [
                  [7.546683, 58.35885],
                  [7.546683, 58.35884],
                  [7.546717, 58.35884],
                  [7.546717, 58.35885],
                  [7.546683, 58.35885],
                ],
              ],
              type: 'Polygon',
            },
          },
          // {
          //   type: 'Feature',
          //   properties: {},
          //   geometry: {
          //     coordinates: [
          //       [
          //         [7.5466834, 58.3588594],
          //         [7.5466834, 58.3588407],
          //         [7.5467176, 58.3588407],
          //         [7.5467176, 58.3588594],
          //         [7.5466834, 58.3588594],
          //       ],
          //     ],
          //     type: 'Polygon',
          //   },
          // },
          //   type: 'Feature',
          //   properties: {},
          //   geometry: {
          //     coordinates: [
          //       [
          //         [7.546683401372121, 58.35885947883315],
          //         [7.546683401372121, 58.358840706269774],
          //         [7.546717630214715, 58.358840706269774],
          //         [7.546717630214715, 58.35885947883315],
          //         [7.546683401372121, 58.35885947883315],
          //       ],
          //     ],
          //     type: 'Polygon',
          //   },
          // },
          // {
          //   type: 'Feature',
          //   properties: {},
          //   geometry: {
          //     coordinates: [
          //       [
          //         [7.546720741927459, 58.35885947883315],
          //         [7.546720741927459, 58.35883989007124],
          //         [7.54675497077011, 58.35883989007124],
          //         [7.54675497077011, 58.35885947883315],
          //         [7.546720741927459, 58.35885947883315],
          //       ],
          //     ],
          //     type: 'Polygon',
          //   },
          // },
        ],
        bbox: null,
      },
    ];

    this.map.on('click', (e: any) => {
      const lat = this.roundton(e.latlng.lat, 6);
      const lng = this.roundton(e.latlng.lng, 6);

      console.log('LAT:', lat);
      console.log('LNG:', lng);

      let num = lat;
      let decimals = (num % 1) * 1000000;
      console.log(decimals);
      let nearest = Math.floor(decimals / 9) * 9;
      console.log(nearest);
      let before = nearest * 0.000001;
      let after = (nearest + 9) * 0.000001;

      console.log(Math.floor(num) + before);
      console.log(Math.floor(num) + after);

      let num2 = lng;
      let decimals2 = (num2 % 1) * 1000000;
      console.log(decimals2);
      let nearest2 = Math.floor(decimals2 / 18) * 18;
      console.log(nearest2);
      let before2 = nearest2 * 0.000001;
      let after2 = (nearest2 + 18) * 0.000001;

      console.log(Math.floor(num2) + before2);
      console.log(Math.floor(num2) + after2);

      let tileLat1 = Math.floor(num) + after;
      let tileLng1 = Math.floor(num2) + after2;

      console.log('PRE-BOUNDS:', [tileLat1, tileLng1]);

      let tileLat2 = tileLat1 - 0.000009;
      let tileLng2 = tileLng1 - 0.000018;

      tileLat1 = Number(tileLat1.toFixed(6));
      tileLng1 = Number(tileLng1.toFixed(6));
      tileLat2 = Number(tileLat2.toFixed(6));
      tileLng2 = Number(tileLng2.toFixed(6));

      console.log('PRE-BOUNDS 2:', [tileLat2, tileLng2]);

      var bounds: any = [
        [tileLat1, tileLng1],
        [tileLat2, tileLng2],
      ];

      console.log('BOUNDS:', bounds);

      var color;
      var r = Math.floor(Math.random() * 255);
      var g = Math.floor(Math.random() * 255);
      var b = Math.floor(Math.random() * 255);
      color = 'rgb(' + r + ' ,' + g + ',' + b + ')';

      var borderColor = 'gray';

      var rectangle: any = L.rectangle(bounds, {
        fillColor: color,
        color: borderColor,
        weight: 1,
      });

      rectangle.propertyId = 'anonymous';
      rectangle.property = {
        owner: 'Anonymous',
        id: 'liberstad/anarchypark/3',
        location: tileLat1 + ':' + tileLng1 + ':' + tileLat2 + ':' + tileLng2,
        bounds: bounds,
        // topCenter: new L.LatLng(lat2, center),
        // topLeft: new L.LatLng(lat2, lng2),
        // bottomRight: new L.LatLng(lat1, lng1),
      };

      this.map.addLayer(rectangle);

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

    // L.geoJSON(bounderies[0], {
    //   onEachFeature: this.onEachFeature,
    // }).addTo(this.map);

    // L.geoJSON(bounderies, {
    //   filter: function (feature: any, layer: any) {
    //     return feature.properties.show_on_map;
    //   },
    // }).addTo(this.map);

    // const rawResponse = await fetch(serviceUrl, {
    //   method: 'POST',
    //   headers: {
    //     Accept: 'application/json',
    //     'Content-Type': 'application/json',
    //   },
    //   body: jws,
    // });

    // Due to rendering issue on smaller screens / mobile devices, we do this extra refresh here.
    // No longer needed due to fix for grid layout (overflow on content, making 100% height staying stable).
    // Left as a future example on invalidation if needed.
    //this.map.invalidateSize(false);
    // this.map.setView([58.35877, 7.54705], 19);
  }

  grid: any;

  drawGrid() {
    if (!this.map) {
      return;
    }

    const zoom = this.map.getZoom();
    const loadFeatures = zoom > 18;

    if (loadFeatures) {
      if (this.grid) {
        this.map.removeLayer(this.grid);
      }
      this.grid = L.geoJSON(this.features[0], {
        style: function () {
          return {
            color: '#777',
            stroke: true,
            weight: 0.5,
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
