package reservationsalles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import org.junit.jupiter.api.Test;
import reservationsalles.user.Role;
import reservationsalles.user.User;

class AuthApiTest extends ApiTestBase {

    private static final String REGISTER = "/api/v1/auth/register";
    private static final String LOGIN = "/api/v1/auth/login";

    @Test
    void registersAUserWithAHashedPasswordAndReturnsAToken() throws Exception {
        String body = mvc.perform(post(REGISTER, null, """
                        {"fullName": "  Sara Benali ", "email": "Sara@Example.com", "password": "Secret123"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.expiresInSeconds").value(3600))
                .andExpect(jsonPath("$.user.email").value("sara@example.com"))
                .andExpect(jsonPath("$.user.fullName").value("Sara Benali"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andExpect(content().string(not(containsString("password"))))
                .andReturn().getResponse().getContentAsString();

        User saved = users.findByEmailIgnoreCase("sara@example.com").orElseThrow();
        assertThat(saved.getPasswordHash()).startsWith("$2").doesNotContain("Secret123");
        assertThat(passwordEncoder.matches("Secret123", saved.getPasswordHash())).isTrue();

        String token = read(body, "$.token");
        mvc.perform(get("/api/v1/auth/me", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("sara@example.com"));
    }

    @Test
    void cannotRegisterAsAdmin() throws Exception {
        mvc.perform(post(REGISTER, null, """
                        {"fullName": "Mallory", "email": "mallory@example.com", "password": "Secret123", "role": "ADMIN"}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("USER"));

        assertThat(users.findByEmailIgnoreCase("mallory@example.com").orElseThrow().getRole()).isEqualTo(Role.USER);
    }

    @Test
    void rejectsADuplicateEmailWhateverItsCase() throws Exception {
        createUser("taken@example.com", Role.USER);

        mvc.perform(post(REGISTER, null, """
                        {"fullName": "Other", "email": "TAKEN@example.com", "password": "Secret123"}
                        """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("An account already exists with this email."));
    }

    @Test
    void validatesTheRegistrationForm() throws Exception {
        mvc.perform(post(REGISTER, null, """
                        {"fullName": "", "email": "not-an-email", "password": "short"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.fullName").exists())
                .andExpect(jsonPath("$.errors.email").exists())
                .andExpect(jsonPath("$.errors.password").exists());

        mvc.perform(post(REGISTER, null, """
                        {"fullName": "A", "email": "a@example.com", "password": "onlyletters"}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.password").value("must contain at least one letter and one digit"));
    }

    @Test
    void logsInWithTheRightPasswordOnly() throws Exception {
        createUser("login@example.com", Role.USER);

        mvc.perform(post(LOGIN, null, """
                        {"email": "LOGIN@example.com", "password": "Secret123"}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("login@example.com"));

        String wrongPassword = mvc.perform(post(LOGIN, null, """
                        {"email": "login@example.com", "password": "Wrong1234"}
                        """))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();
        String unknownEmail = mvc.perform(post(LOGIN, null, """
                        {"email": "nobody@example.com", "password": "Wrong1234"}
                        """))
                .andExpect(status().isUnauthorized())
                .andReturn().getResponse().getContentAsString();

        // Same answer, so attackers can't tell which emails have an account.
        assertThat(read(wrongPassword, "$.detail").toString()).isEqualTo("Invalid email or password.");
        assertThat(read(unknownEmail, "$.detail").toString()).isEqualTo("Invalid email or password.");
    }

    @Test
    void protectedRoutesNeedAValidToken() throws Exception {
        User user = createUser("user@example.com", Role.USER);

        mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/rooms")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/v1/reservations/mine")).andExpect(status().isUnauthorized());

        String forged = Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .claim("role", "ADMIN")
                .expiration(new Date(System.currentTimeMillis() + 60_000))
                .signWith(Keys.hmacShaKeyFor("another-secret-another-secret-another-secret".getBytes(StandardCharsets.UTF_8)))
                .compact();
        String expired = Jwts.builder()
                .subject(String.valueOf(user.getId()))
                .expiration(new Date(System.currentTimeMillis() - 60_000))
                .signWith(Keys.hmacShaKeyFor("test-secret-that-is-long-enough-for-hmac-sha256-1234".getBytes(StandardCharsets.UTF_8)))
                .compact();
        Base64.Encoder b64 = Base64.getUrlEncoder().withoutPadding();
        String unsigned = b64.encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8)) + "."
                + b64.encodeToString(("{\"sub\":\"" + user.getId() + "\"}").getBytes(StandardCharsets.UTF_8)) + ".";

        for (String token : new String[] {forged, expired, unsigned, "garbage"}) {
            mvc.perform(get("/api/v1/auth/me", "Bearer " + token))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(get("/api/v1/auth/me", tokenFor(user)))
                .andExpect(status().isOk());
    }

    @Test
    void aDeletedAccountLosesAccessImmediately() throws Exception {
        User user = createUser("gone@example.com", Role.USER);
        String token = tokenFor(user);
        users.delete(user);
        users.flush();

        mvc.perform(get("/api/v1/auth/me", token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void healthCheckIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
