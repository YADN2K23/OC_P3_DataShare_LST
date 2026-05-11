import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-home-logged',
  imports: [RouterLink],
  templateUrl: './home-logged.html',
  styleUrl: './home-logged.scss',
})
export class HomeLogged {
  constructor(private router: Router) {}

  onPickFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    this.router.navigate(['/upload'], {
      state: { pickedFile: file },
    });
  }
}

