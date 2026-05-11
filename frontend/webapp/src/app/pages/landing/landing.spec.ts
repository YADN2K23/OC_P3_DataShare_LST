import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import { Landing } from './landing';
import { AuthService } from '../../core/services/auth.service';

describe('Landing (integration)', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['hasToken', 'ensureAuthenticated']);
    authService.ensureAuthenticated.and.returnValue(of(false));

    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('redirige vers /home-logged si token present', () => {
    authService.hasToken.and.returnValue(true);

    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/home-logged']);
  });

  it('ne redirige pas si non authentifie', () => {
    authService.hasToken.and.returnValue(false);

    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('redirige vers /home-logged si la session est restauree', () => {
    authService.hasToken.and.returnValue(false);
    authService.ensureAuthenticated.and.returnValue(of(true));

    const fixture = TestBed.createComponent(Landing);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/home-logged']);
  });

  it('navigue vers upload avec le fichier choisi', () => {
    authService.hasToken.and.returnValue(false);
    const fixture = TestBed.createComponent(Landing);
    const component = fixture.componentInstance;
    const file = new File(['x'], 'demo.txt', { type: 'text/plain' });

    component.onPickFile({ target: { files: [file] } } as any);

    expect(router.navigate).toHaveBeenCalledWith(['/upload'], {
      state: { pickedFile: file },
    });
  });
});

