package reservationsalles;

import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;

import com.jayway.jsonpath.JsonPath;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;
import reservationsalles.auth.JwtService;
import reservationsalles.reservation.Reservation;
import reservationsalles.reservation.ReservationRepository;
import reservationsalles.room.Room;
import reservationsalles.room.RoomRepository;
import reservationsalles.user.Role;
import reservationsalles.user.User;
import reservationsalles.user.UserRepository;

/**
 * Starts the whole application (H2 in memory) and sends real HTTP requests through
 * the security filter chain. Each test runs in a transaction that is rolled back.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
public abstract class ApiTestBase {

    protected static final String PASSWORD = "Secret123";

    @Autowired
    protected WebApplicationContext context;

    @Autowired
    protected UserRepository users;

    @Autowired
    protected RoomRepository rooms;

    @Autowired
    protected ReservationRepository reservations;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected JwtService jwtService;

    protected MockMvc mvc;

    @BeforeEach
    void setUpMockMvc() {
        mvc = MockMvcBuilders.webAppContextSetup(context).apply(springSecurity()).build();
    }

    protected User createUser(String email, Role role) {
        return users.save(new User("Test " + role, email, passwordEncoder.encode(PASSWORD), role));
    }

    protected String tokenFor(User user) {
        return "Bearer " + jwtService.generate(user);
    }

    protected Room createRoom(String name, int capacity, String... equipment) {
        return rooms.save(new Room(name, capacity, "Building A", List.of(equipment), true));
    }

    protected Reservation createReservation(Room room, User user, Instant start, Instant end) {
        return reservations.save(new Reservation(room, user, "Meeting", 2, start, end));
    }

    /** A whole hour, N hours from now. */
    protected static Instant hoursFromNow(long hours) {
        return Instant.now().truncatedTo(ChronoUnit.HOURS).plus(hours, ChronoUnit.HOURS);
    }

    protected static MockHttpServletRequestBuilder get(String url) {
        return MockMvcRequestBuilders.get(url);
    }

    protected static MockHttpServletRequestBuilder get(String url, String token) {
        return MockMvcRequestBuilders.get(url).header(HttpHeaders.AUTHORIZATION, token);
    }

    protected static MockHttpServletRequestBuilder post(String url, String token, String json) {
        MockHttpServletRequestBuilder request = MockMvcRequestBuilders.post(url)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json);
        return token == null ? request : request.header(HttpHeaders.AUTHORIZATION, token);
    }

    protected static MockHttpServletRequestBuilder put(String url, String token, String json) {
        return MockMvcRequestBuilders.put(url)
                .header(HttpHeaders.AUTHORIZATION, token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json);
    }

    protected static MockHttpServletRequestBuilder delete(String url, String token) {
        return MockMvcRequestBuilders.delete(url).header(HttpHeaders.AUTHORIZATION, token);
    }

    protected static <T> T read(String json, String path) {
        return JsonPath.read(json, path);
    }

    /** Builds a reservation request body. */
    protected static String booking(Long roomId, Instant start, Instant end, int attendees) {
        return """
                {"roomId": %d, "title": "Team meeting", "attendees": %d, "startAt": "%s", "endAt": "%s"}
                """.formatted(roomId, attendees, start, end);
    }
}
