import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { Register } from './register';
import { AuthService } from '../../core/services/auth.service';

describe('Register (integration)', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['register']);

    await TestBed.configureTestingModule({
      imports: [Register],
      providers: [provideRouter([]), { provide: AuthService, useValue: authService }],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('bloque si passwords differents', () => {
    const fixture = TestBed.createComponent(Register);
    const component = fixture.componentInstance;

    component.email = 'john@doe.fr';
    component.password = 'secret123';
    component.confirmPassword = 'different';
    component.onRegister();

    expect(component.error).toContain('correspondent pas');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('bloque si des champs sont manquants', () => {
    const fixture = TestBed.createComponent(Register);
    const component = fixture.componentInstance;

    component.email = 'john@doe.fr';
    component.password = '';
    component.confirmPassword = '';
    component.onRegister();

    expect(component.error).toContain('requis');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('bloque si mot de passe trop court', () => {
    const fixture = TestBed.createComponent(Register);
    const component = fixture.componentInstance;

    component.email = 'john@doe.fr';
    component.password = '12345';
    component.confirmPassword = '12345';
    component.onRegister();

    expect(component.error).toContain('au moins 6');
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('navigue vers /login quand register reussi', () => {
    authService.register.and.returnValue(of(void 0));

    const fixture = TestBed.createComponent(Register);
    const component = fixture.componentInstance;

    component.email = 'john@doe.fr';
    component.password = 'secret123';
    component.confirmPassword = 'secret123';
    component.onRegister();

    expect(authService.register).toHaveBeenCalledWith('john@doe.fr', 'secret123');
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('affiche une erreur si register echoue', () => {
    authService.register.and.returnValue(throwError(() => new Error('exists')));

    const fixture = TestBed.createComponent(Register);
    const component = fixture.componentInstance;

    component.email = 'john@doe.fr';
    component.password = 'secret123';
    component.confirmPassword = 'secret123';
    component.onRegister();

    expect(component.error).toContain('Erreur lors de l\'inscription');
  });
});

