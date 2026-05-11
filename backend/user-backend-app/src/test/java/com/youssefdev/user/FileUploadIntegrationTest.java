package com.youssefdev.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.youssefdev.user.dto.LoginRequest;
import com.youssefdev.user.dto.RegisterRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.hamcrest.Matchers;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "jwt.secret=test_secret_key_for_integration_tests_very_long",
        "app.upload.storage-dir=target/test-uploads",
        "app.upload.max-size-bytes=1024",
        "app.upload.max-total-size-bytes=1500",
        "app.upload.max-file-name-length=60",
        "app.upload.allowed-content-types=text/plain,image/png"
})
@AutoConfigureMockMvc
class FileUploadIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @AfterEach
    void cleanUploadFolder() throws IOException {
        Path uploadDir = Path.of("target/test-uploads");
        if (Files.exists(uploadDir)) {
            try (var stream = Files.walk(uploadDir)) {
                stream.sorted(Comparator.reverseOrder())
                        .forEach(path -> {
                            try {
                                Files.deleteIfExists(path);
                            } catch (IOException ignored) {
                                // Cleanup best-effort for test artifacts.
                            }
                        });
            }
        }
    }

    @Test
    void listShouldReturnOwnedFilesOnly() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile first = new MockMultipartFile("file", "a.txt", "text/plain", "a".getBytes());
        MockMultipartFile second = new MockMultipartFile("file", "b.txt", "text/plain", "b".getBytes());

        mockMvc.perform(multipart("/api/files")
                        .file(first)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(multipart("/api/files")
                        .file(second)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/files")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", Matchers.hasSize(2)))
                .andExpect(jsonPath("$.content[0].storedFileName").isString())
                .andExpect(jsonPath("$.content[0].originalFileName").isString())
                .andExpect(jsonPath("$.content[0].createdAt").isString())
                .andExpect(jsonPath("$.content[0].passwordProtected").isBoolean())
                .andExpect(jsonPath("$.totalElements").value(2));
    }

    @Test
    void uploadWithPasswordShouldBeFlaggedInList() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "secret.txt", "text/plain", "secret".getBytes());

        mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .param("password", "MonSecret123")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/files")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", Matchers.hasSize(1)))
                .andExpect(jsonPath("$.content[0].passwordProtected").value(true));
    }

    @Test
    void uploadShouldSucceedWithValidTokenAndAllowedType() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "note.txt", "text/plain", "hello upload".getBytes());

        mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.storedFileName").isString())
                .andExpect(jsonPath("$.originalFileName").value("note.txt"))
                .andExpect(jsonPath("$.contentType").value("text/plain"));
    }

    @Test
    void uploadShouldReturnUnauthorizedWithoutToken() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "note.txt", "text/plain", "hello upload".getBytes());

        mockMvc.perform(multipart("/api/files")
                        .file(file))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void uploadShouldReturnBadRequestForEmptyFile() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "empty.txt", "text/plain", new byte[0]);

        mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void uploadShouldReturnPayloadTooLargeWhenFileExceedsLimit() throws Exception {
        String token = loginAndGetToken();
        byte[] data = new byte[2048];
        MockMultipartFile file = new MockMultipartFile("file", "big.txt", "text/plain", data);

        mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isPayloadTooLarge());
    }

    @Test
    void uploadShouldReturnUnsupportedMediaTypeForForbiddenType() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "script.exe", "application/octet-stream", "exe".getBytes());

        mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void uploadShouldReturnUnsupportedMediaTypeWhenSignatureDoesNotMatchContentType() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "fake.png", "image/png", "not a png".getBytes());

        mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    void uploadShouldNormalizeDangerousFileName() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "../evil name?.txt", "text/plain", "safe".getBytes());

        mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.originalFileName").value("evil_name_.txt"));
    }

    @Test
    void uploadShouldReturnInsufficientStorageWhenQuotaIsExceeded() throws Exception {
        String token = loginAndGetToken();
        byte[] part = "a".repeat(900).getBytes();
        MockMultipartFile first = new MockMultipartFile("file", "first.txt", "text/plain", part);
        MockMultipartFile second = new MockMultipartFile("file", "second.txt", "text/plain", part);

        mockMvc.perform(multipart("/api/files")
                        .file(first)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(multipart("/api/files")
                        .file(second)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isInsufficientStorage());
    }

    @Test
    void downloadShouldReturnStoredFileContentForOwner() throws Exception {
        String token = loginAndGetToken();
        byte[] payload = "download me".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "report.txt", "text/plain", payload);

        MvcResult uploadResult = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadRoot = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String storedFileName = uploadRoot.get("storedFileName").asText();

        mockMvc.perform(get("/api/files/{storedFileName}", storedFileName)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(content().bytes(payload))
                .andExpect(header().string("Content-Disposition", Matchers.containsString("report.txt")));
    }

    @Test
    void downloadShouldReturnUnauthorizedWithoutToken() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "private.txt", "text/plain", "secret".getBytes());

        MvcResult uploadResult = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode uploadRoot = objectMapper.readTree(uploadResult.getResponse().getContentAsString());
        String storedFileName = uploadRoot.get("storedFileName").asText();

        mockMvc.perform(get("/api/files/{storedFileName}", storedFileName))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shareLinkShouldAllowPublicDownload() throws Exception {
        String token = loginAndGetToken();
        byte[] payload = "shared content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "share.txt", "text/plain", payload);

        MvcResult uploadResult = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String storedFileName = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("storedFileName")
                .asText();

        MvcResult shareResult = mockMvc.perform(post("/api/files/{storedFileName}/shares?expiresInSeconds=3600", storedFileName)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.shareUrl").value(Matchers.containsString("http://localhost:4200/download/")))
                .andExpect(jsonPath("$.shareUrl").value(Matchers.containsString("state=warn")))
                .andReturn();

        JsonNode shareRoot = objectMapper.readTree(shareResult.getResponse().getContentAsString());
        String shareToken = shareRoot.get("token").asText();

        mockMvc.perform(get("/api/files/shared/{token}", shareToken))
                .andExpect(status().isOk())
                .andExpect(content().bytes(payload))
                .andExpect(header().string("Content-Disposition", Matchers.containsString("share.txt")));
    }

    @Test
    void protectedShareLinkShouldRequirePasswordAndExposePasswordState() throws Exception {
        String token = loginAndGetToken();
        byte[] payload = "protected shared content".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "protected.txt", "text/plain", payload);

        MvcResult uploadResult = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .param("password", "share-secret")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String storedFileName = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("storedFileName")
                .asText();

        MvcResult shareResult = mockMvc.perform(post("/api/files/{storedFileName}/shares", storedFileName)
                        .param("expiresInSeconds", "3600")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.shareUrl").value(Matchers.containsString("state=pwd")))
                .andReturn();

        String shareToken = objectMapper.readTree(shareResult.getResponse().getContentAsString())
                .get("token")
                .asText();

        mockMvc.perform(get("/api/files/shared/{token}", shareToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/files/shared/{token}", shareToken)
                        .param("password", "share-secret"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(payload));
    }

    @Test
    void expiredShareLinkShouldReturnGone() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "expire.txt", "text/plain", "ttl".getBytes());

        MvcResult uploadResult = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String storedFileName = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("storedFileName")
                .asText();

        MvcResult shareResult = mockMvc.perform(post("/api/files/{storedFileName}/shares?expiresInSeconds=0", storedFileName)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String shareToken = objectMapper.readTree(shareResult.getResponse().getContentAsString())
                .get("token")
                .asText();

        mockMvc.perform(get("/api/files/shared/{token}", shareToken))
                .andExpect(status().isGone());
    }

    @Test
    void deleteShouldReturnNoContentForOwner() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "to-delete.txt", "text/plain", "bye".getBytes());

        MvcResult uploadResult = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String storedFileName = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("storedFileName")
                .asText();

        mockMvc.perform(delete("/api/files/{storedFileName}", storedFileName)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/files/{storedFileName}", storedFileName)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteShouldReturnUnauthorizedWithoutToken() throws Exception {
        mockMvc.perform(delete("/api/files/{storedFileName}", "unknown-file.txt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteShouldReturnNotFoundForMissingFile() throws Exception {
        String token = loginAndGetToken();

        mockMvc.perform(delete("/api/files/{storedFileName}", "missing-file.txt")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteShouldInvalidateExistingShareLink() throws Exception {
        String token = loginAndGetToken();
        MockMultipartFile file = new MockMultipartFile("file", "shared-delete.txt", "text/plain", "shared".getBytes());

        MvcResult uploadResult = mockMvc.perform(multipart("/api/files")
                        .file(file)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String storedFileName = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .get("storedFileName")
                .asText();

        MvcResult shareResult = mockMvc.perform(post("/api/files/{storedFileName}/shares", storedFileName)
                        .param("expiresInSeconds", "3600")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        String shareToken = objectMapper.readTree(shareResult.getResponse().getContentAsString())
                .get("token")
                .asText();

        mockMvc.perform(delete("/api/files/{storedFileName}", storedFileName)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/files/shared/{token}", shareToken))
                .andExpect(status().isNotFound());
    }

    private String loginAndGetToken() throws Exception {
        String login = "file-user-" + UUID.randomUUID();
        String password = "motdepasse123";

        RegisterRequest registerRequest = new RegisterRequest(login, password);
        mockMvc.perform(post("/api/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isNoContent());

        LoginRequest request = new LoginRequest(login, password);

        MvcResult loginResult = mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode root = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        return root.get("token").asText();
    }
}


