package reservationsalles;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reservationsalles.room.Room;
import reservationsalles.user.Role;
import reservationsalles.user.User;

class AdminApiTest extends ApiTestBase {

    private String admin;
    private String user;
    private User alice;

    @BeforeEach
    void data() {
        admin = tokenFor(createUser("admin@example.com", Role.ADMIN));
        alice = createUser("alice@example.com", Role.USER);
        user = tokenFor(alice);
    }

    @Test
    void onlyAdminsReachTheAdminApi() throws Exception {
        for (String url : new String[] {"/api/v1/admin/stats", "/api/v1/admin/users", "/api/v1/admin/reservations"}) {
            mvc.perform(get(url, user)).andExpect(status().isForbidden());
            mvc.perform(get(url)).andExpect(status().isUnauthorized());
            mvc.perform(get(url, admin)).andExpect(status().isOk());
        }
    }

    @Test
    void returnsDashboardStats() throws Exception {
        Room a = createRoom("A101", 10);
        createRoom("B204", 6);
        rooms.save(new Room("Z999", 4, "Basement", java.util.List.of(), false));
        createReservation(a, alice, hoursFromNow(-1), hoursFromNow(1));
        createReservation(a, alice, hoursFromNow(5), hoursFromNow(6));
        createReservation(a, alice, hoursFromNow(8), hoursFromNow(9)).cancel(Instant.now());

        mvc.perform(get("/api/v1/admin/stats", admin))
                .andExpect(jsonPath("$.rooms").value(3))
                .andExpect(jsonPath("$.activeRooms").value(2))
                .andExpect(jsonPath("$.users").value(2))
                .andExpect(jsonPath("$.upcomingReservations").value(1))
                .andExpect(jsonPath("$.ongoingReservations").value(1));
    }

    @Test
    void listsUsersWithoutPasswordsAndFiltersReservations() throws Exception {
        Room a = createRoom("A101", 10);
        createReservation(a, alice, hoursFromNow(5), hoursFromNow(6));
        createReservation(a, alice, hoursFromNow(8), hoursFromNow(9)).cancel(Instant.now());

        mvc.perform(get("/api/v1/admin/users", admin))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(content().string(not(containsString("password"))));
        mvc.perform(get("/api/v1/admin/reservations", admin)).andExpect(jsonPath("$", hasSize(2)));
        mvc.perform(get("/api/v1/admin/reservations?status=CANCELLED", admin)).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/v1/admin/reservations?status=NOPE", admin)).andExpect(status().isBadRequest());
    }
}
