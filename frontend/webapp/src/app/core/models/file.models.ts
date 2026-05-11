export interface UploadResponse {
  storedFileName: string;
  originalFileName: string;
  size: number;
  contentType: string;
}

export interface ShareLinkResponse {
  token: string;
  expiresAt: string;
  shareUrl: string;
  storedFileName: string;
}

export interface FileInfo {
  storedFileName: string;
  originalFileName: string;
  contentType: string;
  size: number;
  createdAt: string;
  passwordProtected?: boolean;
  expiresAt?: string;
}

export interface FileHistoryEvent {
  action: string;
  storedFileName: string;
  originalFileName: string;
  occurredAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

