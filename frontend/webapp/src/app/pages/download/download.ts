import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FileService } from '../../core/services/file.service';

@Component({
  selector: 'app-download',
  imports: [RouterLink, FormsModule],
  templateUrl: './download.html',
  styleUrl: './download.scss',
})
export class Download implements OnInit {
  token = '';
  password = '';
  isDownloading = false;
  error = '';
  state: 'pwd' | 'warn' | 'expired' = 'pwd';

  constructor(
    private route: ActivatedRoute,
    private fileService: FileService
  ) {}

  ngOnInit() {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';

    const stateQuery = (this.route.snapshot.queryParamMap.get('state') ?? '').toLowerCase();
    if (stateQuery === 'warn' || stateQuery === 'expired' || stateQuery === 'pwd') {
      this.state = stateQuery;
    }

    if (!this.token) {
      this.state = 'expired';
    }
  }

  onDownloadShared() {
    if (!this.token || this.state === 'expired') {
      this.error = 'Lien de partage invalide.';
      return;
    }

    if (this.state === 'pwd' && !this.password.trim()) {
      this.error = 'Veuillez renseigner le mot de passe.';
      return;
    }

    this.isDownloading = true;
    this.error = '';
    this.fileService.downloadSharedFile(this.token, this.password).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `shared-${this.token}.bin`;
        link.click();
        window.URL.revokeObjectURL(url);
        this.isDownloading = false;
      },
      error: () => {
        this.error = 'Lien invalide ou expire.';
        this.state = 'expired';
        this.isDownloading = false;
      },
    });
  }

  get canDownload(): boolean {
    if (this.state === 'expired') {
      return false;
    }

    if (this.state === 'pwd') {
      return !!this.password.trim() && !!this.token;
    }

    return !!this.token;
  }

}
