package com.youssefdev.user.dto;

import java.time.Instant;

public record FileInfoResponse(
        String storedFileName,
        String originalFileName,
        String contentType,
        long size,
        Instant createdAt,
        boolean passwordProtected
) {
}

