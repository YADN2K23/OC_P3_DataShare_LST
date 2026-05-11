package com.youssefdev.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.youssefdev.user.dto.LoginRequest;
import com.youssefdev.user.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import jakarta.servlet.http.Cookie;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

@SpringBootTest(properties = {
        "jwt.secret=test_secret_key_for_integration_tests_very_long",
})
@AutoConfigureMockMvc
class AuthFlowIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void loginThenCallProtectedEndpointShouldSucceed() throws Exception {
        String login = "user-" + UUID.randomUUID();
        String password = "motdepasse123";
        registerUser(login, password);

        LoginRequest request = new LoginRequest(login, password);

        MvcResult loginResult = mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(jsonPath("$.token").isString())
                .andReturn();

        JsonNode root = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String token = root.get("token").asText();

        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.login").value(login));
    }

    @Test
    void protectedEndpointWithoutTokenShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectedEndpointWithMalformedTokenShouldReturnUnauthorized() throws Exception {
        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void loginWithInvalidCredentialsShouldReturnUnauthorized() throws Exception {
        String login = "user-" + UUID.randomUUID();
        registerUser(login, "motdepasse123");

        LoginRequest request = new LoginRequest(login, "wrong-password");

        mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void repeatedInvalidLoginShouldReturnTooManyRequests() throws Exception {
        String login = "user-" + UUID.randomUUID();
        registerUser(login, "motdepasse123");

        LoginRequest request = new LoginRequest(login, "wrong-password");

        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests());
    }

    @Test
    void loginWithBlankCredentialsShouldReturnBadRequest() throws Exception {
        LoginRequest request = new LoginRequest("", "");

        mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void registerThenLoginShouldSucceed() throws Exception {
        String login = "user-" + UUID.randomUUID();
        RegisterRequest registerRequest = new RegisterRequest(login, "motdepasse123");

        mockMvc.perform(post("/api/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isNoContent());

        LoginRequest loginRequest = new LoginRequest(login, "motdepasse123");

        mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(jsonPath("$.token").isString());
    }

    @Test
    void refreshShouldRotateRefreshTokenAndKeepSessionValid() throws Exception {
        String login = "user-" + UUID.randomUUID();
        String password = "motdepasse123";
        registerUser(login, password);

        MvcResult loginResult = mockMvc.perform(post("/api/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(login, password))))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andReturn();

        Cookie refreshCookie = loginResult.getResponse().getCookie("refresh_token");

        MvcResult refreshResult = mockMvc.perform(post("/api/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(jsonPath("$.token").isString())
                .andReturn();

        String rotatedAccessToken = objectMapper.readTree(refreshResult.getResponse().getContentAsString())
                .get("token").asText();
        Cookie rotatedRefreshCookie = refreshResult.getResponse().getCookie("refresh_token");

        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + rotatedAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.login").value(login));

        mockMvc.perform(post("/api/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/logout")
                        .cookie(rotatedRefreshCookie))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("refresh_token", 0));
    }

    @Test
    void registerWithExistingLoginShouldReturnConflict() throws Exception {
        String login = "user-" + UUID.randomUUID();
        registerUser(login, "motdepasse123");

        RegisterRequest request = new RegisterRequest(login, "motdepasse123");

        mockMvc.perform(post("/api/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("existe")));
    }

    @Test
    void registerWithInvalidPayloadShouldReturnBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest("ab", "123");

        mockMvc.perform(post("/api/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    private void registerUser(String login, String password) throws Exception {
        RegisterRequest request = new RegisterRequest(login, password);
        mockMvc.perform(post("/api/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNoContent());
    }
}


