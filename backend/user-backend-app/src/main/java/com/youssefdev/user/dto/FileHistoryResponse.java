package com.youssefdev.user.dto;

import java.time.Instant;

public record FileHistoryResponse(
        String action,
        String storedFileName,
        String originalFileName,
        Instant occurredAt
) {
}

