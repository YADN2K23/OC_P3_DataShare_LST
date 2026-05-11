package com.youssefdev.user.service;

import com.youssefdev.user.configuration.UploadProperties;
import com.youssefdev.user.dto.FileHistoryResponse;
import com.youssefdev.user.dto.FileInfoResponse;
import com.youssefdev.user.dto.ShareLinkResponse;
import com.youssefdev.user.dto.UploadResponse;
import com.youssefdev.user.entity.AppUserEntity;
import com.youssefdev.user.entity.FileAssetEntity;
import com.youssefdev.user.entity.ShareLinkEntity;
import com.youssefdev.user.exception.EmptyFileException;
import com.youssefdev.user.exception.FileAccessDeniedException;
import com.youssefdev.user.exception.FileTooLargeException;
import com.youssefdev.user.exception.InvalidFileNameException;
import com.youssefdev.user.exception.ShareLinkExpiredException;
import com.youssefdev.user.exception.ShareLinkNotFoundException;
import com.youssefdev.user.exception.StoredFileNotFoundException;
import com.youssefdev.user.exception.StorageQuotaExceededException;
import com.youssefdev.user.exception.UnsupportedFileTypeException;
import com.youssefdev.user.repository.AppUserRepository;
import com.youssefdev.user.repository.FileAssetRepository;
import com.youssefdev.user.repository.ShareLinkRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final String FILES_DIR = "files";

    private final UploadProperties uploadProperties;
    private final FileAssetRepository fileAssetRepository;
    private final ShareLinkRepository shareLinkRepository;
    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public FileStorageService(UploadProperties uploadProperties,
                              FileAssetRepository fileAssetRepository,
                              ShareLinkRepository shareLinkRepository,
                              AppUserRepository appUserRepository,
                              PasswordEncoder passwordEncoder) {
        this.uploadProperties = uploadProperties;
        this.fileAssetRepository = fileAssetRepository;
        this.shareLinkRepository = shareLinkRepository;
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UploadResponse store(MultipartFile file) {
        return store(file, "unknown");
    }

    public UploadResponse store(MultipartFile file, String ownerLogin) {
        return store(file, ownerLogin, null);
    }

    public UploadResponse store(MultipartFile file, String ownerLogin, String password) {
        validate(file);

        AppUserEntity owner = appUserRepository.findByLogin(ownerLogin)
                .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable: " + ownerLogin));

        String originalName = file.getOriginalFilename() == null ? "file.bin" : file.getOriginalFilename();
        String safeOriginalName = normalizeFileName(originalName);
        Path filesDir = filesDir();

        try {
            Files.createDirectories(filesDir);

            ensureQuota(filesDir, file.getSize());

            Path target = createUniqueTarget(filesDir, safeOriginalName);
            Files.copy(file.getInputStream(), target);

            String storedName = target.getFileName().toString();
            boolean passwordProtected = password != null && !password.isBlank();

            // Sauvegarder les métadonnées en base de données
            FileAssetEntity fileAsset = new FileAssetEntity();
            fileAsset.setOwner(owner);
            fileAsset.setOriginalName(safeOriginalName);
            fileAsset.setStoragePath(storedName);
            fileAsset.setSizeBytes(file.getSize());
            fileAsset.setContentType(file.getContentType() == null ? "application/octet-stream" : file.getContentType());
            fileAsset.setPasswordProtected(passwordProtected);
            fileAsset.setPasswordHash(passwordProtected ? passwordEncoder.encode(password.trim()) : null);
            fileAsset.setCreatedAt(Instant.now());

            fileAssetRepository.save(fileAsset);

            return new UploadResponse(storedName, safeOriginalName, file.getContentType(), file.getSize());
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de stocker le fichier", e);
        }
    }

    public DownloadedFile loadOwnedFile(String storedFileName, String ownerLogin) {
        FileAssetEntity fileAsset = fileAssetRepository.findByStoragePath(storedFileName)
                .orElseThrow(() -> new StoredFileNotFoundException("Fichier introuvable"));

        if (!Objects.equals(fileAsset.getOwner().getLogin(), ownerLogin)) {
            throw new FileAccessDeniedException("Acces au fichier refuse");
        }

        return toDownloadedFile(fileAsset);
    }

    public DownloadedFile loadSharedFile(String token, String password) {
        ShareLinkEntity shareLink = shareLinkRepository.findByToken(token)
                .orElseThrow(() -> new ShareLinkNotFoundException("Lien de partage introuvable"));

        if (Instant.now().isAfter(shareLink.getExpiresAt())) {
            throw new ShareLinkExpiredException("Lien de partage expire");
        }

        assertDownloadPassword(shareLink.getFile(), password);
        return toDownloadedFile(shareLink.getFile());
    }

    public ShareLinkResponse createShareLink(String storedFileName, String ownerLogin, long expiresInSeconds, String frontendBaseUrl) {
        FileAssetEntity fileAsset = fileAssetRepository.findByStoragePath(storedFileName)
                .orElseThrow(() -> new StoredFileNotFoundException("Fichier introuvable"));

        if (!Objects.equals(fileAsset.getOwner().getLogin(), ownerLogin)) {
            throw new FileAccessDeniedException("Acces au fichier refuse");
        }

        String token = UUID.randomUUID().toString().replace("-", "");
        Instant now = Instant.now();
        Instant expiresAt = expiresInSeconds <= 0 ? now.minusSeconds(1) : now.plusSeconds(expiresInSeconds);

        ShareLinkEntity shareLink = new ShareLinkEntity();
        shareLink.setFile(fileAsset);
        shareLink.setToken(token);
        shareLink.setExpiresAt(expiresAt);
        shareLink.setCreatedAt(now);

        shareLinkRepository.save(shareLink);

        String normalizedBaseUrl = frontendBaseUrl.endsWith("/") ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1) : frontendBaseUrl;
        String state = fileAsset.isPasswordProtected() ? "pwd" : "warn";
        String shareUrl = normalizedBaseUrl + "/download/" + token + "?state=" + state;

        return new ShareLinkResponse(token, shareUrl, storedFileName, expiresAt);
    }

    public void deleteOwnedFile(String storedFileName, String ownerLogin) {
        FileAssetEntity fileAsset = fileAssetRepository.findByStoragePath(storedFileName)
                .orElseThrow(() -> new StoredFileNotFoundException("Fichier introuvable"));

        if (!Objects.equals(fileAsset.getOwner().getLogin(), ownerLogin)) {
            throw new FileAccessDeniedException("Acces au fichier refuse");
        }

        try {
            // Supprimer les liens de partage associés (cascade delete géré par JPA)
            List<ShareLinkEntity> shareLinks = shareLinkRepository.findByFile_Id(fileAsset.getId());
            shareLinkRepository.deleteAll(shareLinks);

            // Supprimer le fichier du disque
            Files.deleteIfExists(filePath(storedFileName));

            // Supprimer la métadonnée de la base de données
            fileAssetRepository.delete(fileAsset);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de supprimer le fichier", e);
        }
    }

    public Page<FileInfoResponse> listOwnedFiles(String ownerLogin, Pageable pageable) {
        Page<FileAssetEntity> fileAssets = fileAssetRepository.findByOwner_Login(ownerLogin, pageable);

        return fileAssets.map(asset -> new FileInfoResponse(
                asset.getStoragePath(),
                asset.getOriginalName(),
                asset.getContentType(),
                asset.getSizeBytes(),
                asset.getCreatedAt(),
                asset.isPasswordProtected()
        ));
    }

    public Page<FileHistoryResponse> listOwnedHistory(String ownerLogin, Pageable pageable) {
        // Historique metier non persiste pour ce MVP; contrat pagine pret pour l'extension.
        return new PageImpl<>(List.of(), pageable, 0);
    }


    // L'historique peut être enregistré en base de données dans une prochaine itération

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new EmptyFileException("Le fichier est vide");
        }

        if (file.getSize() > uploadProperties.getMaxSizeBytes()) {
            throw new FileTooLargeException("Le fichier depasse la taille maximale autorisee");
        }

        String contentType = file.getContentType();
        if (contentType == null || uploadProperties.getAllowedContentTypes().stream().noneMatch(contentType::equalsIgnoreCase)) {
            throw new UnsupportedFileTypeException("Type de fichier non autorise");
        }

        if (!hasExpectedSignature(file, contentType)) {
            throw new UnsupportedFileTypeException("Signature de fichier incoherente avec le type declare");
        }
    }

    private boolean hasExpectedSignature(MultipartFile file, String contentType) {
        byte[] header = new byte[8];
        int read;
        try (var inputStream = file.getInputStream()) {
            read = inputStream.read(header);
        } catch (IOException e) {
            throw new UncheckedIOException("Impossible de lire le fichier", e);
        }

        if (read < 0) {
            return false;
        }

        byte[] actual = Arrays.copyOf(header, read);
        String normalizedContentType = contentType.toLowerCase();

        return switch (normalizedContentType) {
            case "application/pdf" -> startsWith(actual, new byte[]{0x25, 0x50, 0x44, 0x46});
            case "image/png" -> startsWith(actual, new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A});
            case "image/jpeg" -> startsWith(actual, new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF});
            case "text/plain" -> looksLikeText(actual);
            default -> false;
        };
    }

    private boolean startsWith(byte[] actual, byte[] expectedPrefix) {
        if (actual.length < expectedPrefix.length) {
            return false;
        }
        for (int i = 0; i < expectedPrefix.length; i++) {
            if (actual[i] != expectedPrefix[i]) {
                return false;
            }
        }
        return true;
    }

    private boolean looksLikeText(byte[] actual) {
        for (byte value : actual) {
            int unsigned = value & 0xFF;
            if (unsigned == 0 || (unsigned < 0x09) || (unsigned > 0x0D && unsigned < 0x20)) {
                return false;
            }
        }
        return true;
    }

    private String normalizeFileName(String rawName) {
        String normalizedSeparators = rawName.replace("\\", "/");
        int lastSlash = normalizedSeparators.lastIndexOf('/');
        String baseName = (lastSlash >= 0 ? normalizedSeparators.substring(lastSlash + 1) : normalizedSeparators).trim();
        String cleaned = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");
        cleaned = cleaned.replaceAll("_+", "_");

        if (cleaned.isBlank() || cleaned.equals(".") || cleaned.equals("..")) {
            throw new InvalidFileNameException("Nom de fichier invalide");
        }

        int maxLength = uploadProperties.getMaxFileNameLength();
        if (cleaned.length() > maxLength) {
            int extensionIndex = cleaned.lastIndexOf('.');
            if (extensionIndex > 0 && extensionIndex < cleaned.length() - 1) {
                String extension = cleaned.substring(extensionIndex);
                int nameMax = Math.max(1, maxLength - extension.length());
                cleaned = cleaned.substring(0, Math.min(nameMax, extensionIndex)) + extension;
            } else {
                cleaned = cleaned.substring(0, maxLength);
            }
        }

        return cleaned;
    }

    private void ensureQuota(Path filesDir, long incomingFileSize) throws IOException {
        long used = 0L;

        if (Files.exists(filesDir)) {
            try (var files = Files.walk(filesDir)) {
                used = files
                        .filter(Files::isRegularFile)
                        .mapToLong(path -> {
                            try {
                                return Files.size(path);
                            } catch (IOException e) {
                                return 0L;
                            }
                        })
                        .sum();
            }
        }

        if (used + incomingFileSize > uploadProperties.getMaxTotalSizeBytes()) {
            throw new StorageQuotaExceededException("Quota de stockage depasse");
        }
    }

    private Path createUniqueTarget(Path filesDir, String safeOriginalName) {
        for (int i = 0; i < 10; i++) {
            String candidate = UUID.randomUUID() + "-" + safeOriginalName;
            Path target = filesDir.resolve(candidate).normalize();
            if (target.startsWith(filesDir) && !Files.exists(target)) {
                return target;
            }
        }
        throw new StorageQuotaExceededException("Impossible de reserver un nom de fichier unique");
    }

    private DownloadedFile toDownloadedFile(FileAssetEntity fileAsset) {
        Path filePath = filePath(fileAsset.getStoragePath());
        if (!Files.exists(filePath)) {
            throw new StoredFileNotFoundException("Fichier introuvable");
        }

        return new DownloadedFile(filePath, fileAsset.getOriginalName(), fileAsset.getContentType(), fileAsset.getSizeBytes());
    }

    private void assertDownloadPassword(FileAssetEntity fileAsset, String password) {
        if (!fileAsset.isPasswordProtected()) {
            return;
        }

        if (password == null || password.isBlank()) {
            throw new FileAccessDeniedException("Mot de passe requis pour ce fichier");
        }

        if (fileAsset.getPasswordHash() == null || !passwordEncoder.matches(password.trim(), fileAsset.getPasswordHash())) {
            throw new FileAccessDeniedException("Mot de passe incorrect");
        }
    }

    private Path filePath(String storedFileName) {
        Path target = filesDir().resolve(storedFileName).normalize();
        if (!target.startsWith(filesDir())) {
            throw new StoredFileNotFoundException("Fichier introuvable");
        }
        return target;
    }

    private Path filesDir() {
        return Path.of(uploadProperties.getStorageDir()).toAbsolutePath().normalize().resolve(FILES_DIR);
    }

    public record DownloadedFile(Path filePath, String originalFileName, String contentType, long size) {
    }
}

