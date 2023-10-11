import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { ApplicationState } from './applicationstate';
import { AuthenticationService } from './authentication';

@Injectable()
export class AuthGuardService implements CanActivate {
  constructor(
    public appState: ApplicationState,
    private authService: AuthenticationService,
    public router: Router
  ) {}
  canActivate() {
    return this.appState.authenticated;

    // console.log('Can activate??');

    // return this.appState.authenticated$
    // .pipe(
    //   take(1),
    //   switchMap((allowAccess: boolean) => !allowAccess ?  this.router.navigateByUrl('/connect') : of(true)));

    //   return this.http.login().map((res: Response)=>{
    //     if ( res.status === 200 ) return true;
    //     return false;
    //  });

    //   return this.appState.authenticated$.pipe(map(authenticated) => {
    //     if (!authenticated) {
    //       this.router.navigateByUrl('/connect');
    //     }
    //   });

    // if (this.authService.authInfo$.getValue().authenticated()) {
    //   return true;
    // }

    // return this.authService.getAuthInfo().then((authInfo: UserInfo) => {
    //   debugger;
    //   if (authInfo.authenticated()) {
    //     return true;
    //   } else {
    //     this.router.navigateByUrl('/connect');
    //     return false;
    //   }
    // });
  }
}

@Injectable()
export class AuthGuardAdminService implements CanActivate {
  constructor(
    public appState: ApplicationState,
    private authService: AuthenticationService,
    public router: Router
  ) {}
  canActivate() {
    return this.appState.authenticated && this.appState.admin;
  }
}
