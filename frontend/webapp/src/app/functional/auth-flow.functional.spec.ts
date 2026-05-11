import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { Login } from '../pages/login/login';
import { Register } from '../pages/register/register';
import { AuthService } from '../core/services/auth.service';

describe('Auth flow (functional)', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['register', 'login', 'ensureAuthenticated']);
    authService.ensureAuthenticated.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [Login, Register],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('utilisateur peut s inscrire puis se connecter', () => {
    authService.register.and.returnValue(of(void 0));
    authService.login.and.returnValue(of({ token: 'jwt-token' }));

    const registerFixture = TestBed.createComponent(Register);
    const registerComponent = registerFixture.componentInstance;
    registerComponent.email = 'test@datas.fr';
    registerComponent.password = 'secret123';
    registerComponent.confirmPassword = 'secret123';
    registerComponent.onRegister();

    expect(authService.register).toHaveBeenCalledWith('test@datas.fr', 'secret123');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);

    const loginFixture = TestBed.createComponent(Login);
    const loginComponent = loginFixture.componentInstance;
    loginComponent.email = 'test@datas.fr';
    loginComponent.password = 'secret123';
    loginComponent.onLogin();

    expect(authService.login).toHaveBeenCalledWith('test@datas.fr', 'secret123');
    expect(router.navigate).toHaveBeenCalledWith(['/my-space']);
  });
});

