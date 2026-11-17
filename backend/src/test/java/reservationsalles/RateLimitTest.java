package reservationsalles;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.TestPropertySource;

@TestPropertySource(properties = "app.security.auth-requests-per-minute=3")
class RateLimitTest extends ApiTestBase {

    @Test
    void blocksRepeatedLoginAttemptsButNotOtherRoutes() throws Exception {
        String attempt = """
                {"email": "brute@example.com", "password": "Guess1234"}
                """;
        for (int i = 0; i < 3; i++) {
            mvc.perform(post("/api/v1/auth/login", null, attempt)).andExpect(status().isUnauthorized());
        }
        mvc.perform(post("/api/v1/auth/login", null, attempt))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.status").value(429));

        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
