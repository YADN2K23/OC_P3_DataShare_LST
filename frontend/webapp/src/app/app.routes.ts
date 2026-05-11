import { Routes } from '@angular/router';
import { Download } from './pages/download/download';
import { HomeLogged } from './pages/home-logged/home-logged';
import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { MySpace } from './pages/my-space/my-space';
import { Register } from './pages/register/register';
import { Upload } from './pages/upload/upload';
import { UploadConfirm } from './pages/upload-confirm/upload-confirm';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', component: Landing },
  { path: 'home-logged', component: HomeLogged, canActivate: [AuthGuard] },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'upload', component: Upload, canActivate: [AuthGuard] },
  { path: 'upload/confirm', component: UploadConfirm },
  { path: 'download', component: Download },
  { path: 'download/:token', component: Download },
  { path: 'my-space', component: MySpace, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];
