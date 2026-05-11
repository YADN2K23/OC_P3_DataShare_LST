import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { HomeLogged } from './home-logged';

describe('HomeLogged (integration)', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeLogged],
      providers: [provideRouter([])],
    }).compileComponents();

    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
  });

  it('navigue vers upload avec le fichier choisi', () => {
    const fixture = TestBed.createComponent(HomeLogged);
    const component = fixture.componentInstance;
    const file = new File(['x'], 'demo.txt', { type: 'text/plain' });

    component.onPickFile({ target: { files: [file] } } as any);

    expect(router.navigate).toHaveBeenCalledWith(['/upload'], {
      state: { pickedFile: file },
    });
  });

  it('ne fait rien si aucun fichier', () => {
    const fixture = TestBed.createComponent(HomeLogged);
    const component = fixture.componentInstance;

    component.onPickFile({ target: { files: [] } } as any);

    expect(router.navigate).not.toHaveBeenCalled();
  });
});

