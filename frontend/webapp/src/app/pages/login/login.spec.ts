import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Login } from './login';
import { AuthService } from '../../core/services/auth.service';

describe('Login (integration)', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'hasToken', 'ensureAuthenticated']);
    authService.hasToken.and.returnValue(false);
    authService.ensureAuthenticated.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('refuse login si champs vides', () => {
    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;

    component.onLogin();

    expect(component.error).toContain('requis');
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('redirige vers /my-space au init si deja connecte', () => {
    authService.hasToken.and.returnValue(true);

    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/my-space']);
  });

  it('redirige vers /my-space si la session est restauree', () => {
    authService.hasToken.and.returnValue(false);
    authService.ensureAuthenticated.and.returnValue(of(true));

    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/my-space']);
  });

  it('navigue vers /my-space quand login reussi', () => {
    authService.login.and.returnValue(of({ token: 'jwt' }));

    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component.email = 'john@doe.fr';
    component.password = 'secret123';

    component.onLogin();

    expect(authService.login).toHaveBeenCalledWith('john@doe.fr', 'secret123');
    expect(router.navigate).toHaveBeenCalledWith(['/my-space']);
  });

  it('affiche une erreur si login echoue', () => {
    authService.login.and.returnValue(throwError(() => new Error('bad credentials')));

    const fixture = TestBed.createComponent(Login);
    const component = fixture.componentInstance;
    component.email = 'john@doe.fr';
    component.password = 'wrong';

    component.onLogin();

    expect(component.error).toContain('incorrect');
    expect(component.isLoading).toBeFalse();
  });
});

