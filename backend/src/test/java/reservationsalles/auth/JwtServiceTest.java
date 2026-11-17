package reservationsalles.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;
import reservationsalles.user.Role;
import reservationsalles.user.User;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-unit-test-secret-1234";
    private static final Instant NOW = Instant.parse("2026-01-15T10:00:00Z");

    private static User user(long id) {
        User user = new User("Unit", "unit@example.com", "hash", Role.USER);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static JwtService service(Instant now) {
        return new JwtService(SECRET, Duration.ofHours(1), Clock.fixed(now, ZoneOffset.UTC), new MockEnvironment());
    }

    @Test
    void aTokenIsValidUntilItExpires() {
        String token = service(NOW).generate(user(42));

        assertThat(service(NOW).verify(token)).contains(42L);
        assertThat(service(NOW.plus(Duration.ofMinutes(59))).verify(token)).contains(42L);
        assertThat(service(NOW.plus(Duration.ofMinutes(61))).verify(token)).isEmpty();
    }

    @Test
    void rejectsTamperedTokens() {
        String token = service(NOW).generate(user(42));
        String tampered = token.substring(0, token.length() - 2) + (token.endsWith("A") ? "BB" : "AA");

        assertThat(service(NOW).verify(tampered)).isEmpty();
        assertThat(service(NOW).verify("")).isEmpty();
        assertThat(service(NOW).verify("a.b.c")).isEmpty();
    }

    @Test
    void refusesWeakOrDefaultSecrets() {
        Clock clock = Clock.systemUTC();
        assertThatThrownBy(() -> new JwtService("too-short", Duration.ofHours(1), clock, new MockEnvironment()))
                .isInstanceOf(IllegalStateException.class);

        MockEnvironment prod = new MockEnvironment();
        prod.setActiveProfiles("prod");
        assertThatThrownBy(() -> new JwtService(
                        "dev-only-secret-change-me-dev-only-secret-change-me", Duration.ofHours(1), clock, prod))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }
}
