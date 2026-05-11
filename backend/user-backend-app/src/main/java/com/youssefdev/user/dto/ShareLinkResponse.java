package com.youssefdev.user.dto;

import java.time.Instant;

public record ShareLinkResponse(
        String token,
        String shareUrl,
        String storedFileName,
        Instant expiresAt
) {
}

