package reservationsalles;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reservationsalles.room.Room;
import reservationsalles.user.Role;
import reservationsalles.user.User;

class RoomApiTest extends ApiTestBase {

    private static final String ROOMS = "/api/v1/rooms";

    private String admin;
    private String user;
    private User userAccount;

    @BeforeEach
    void accounts() {
        admin = tokenFor(createUser("admin@example.com", Role.ADMIN));
        userAccount = createUser("user@example.com", Role.USER);
        user = tokenFor(userAccount);
    }

    @Test
    void adminCanCreateUpdateAndDeleteARoom() throws Exception {
        String created = mvc.perform(post(ROOMS, admin, """
                        {"name": " A101 ", "capacity": 12, "location": "Building A",
                         "equipment": ["Projector", " Whiteboard ", "projector"], "active": true}
                        """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("A101"))
                .andExpect(jsonPath("$.capacity").value(12))
                .andExpect(jsonPath("$.equipment", hasSize(2)))
                .andReturn().getResponse().getContentAsString();
        Integer id = read(created, "$.id");

        mvc.perform(put(ROOMS + "/" + id, admin, """
                        {"name": "A101", "capacity": 20, "location": "Building A, 1st floor", "equipment": ["TV screen"], "active": false}
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.capacity").value(20))
                .andExpect(jsonPath("$.active").value(false))
                .andExpect(jsonPath("$.equipment", contains("TV screen")));

        mvc.perform(delete(ROOMS + "/" + id, admin)).andExpect(status().isNoContent());
        mvc.perform(get(ROOMS + "/" + id, admin)).andExpect(status().isNotFound());
    }

    @Test
    void regularUsersCannotManageRooms() throws Exception {
        Room room = createRoom("B204", 6);
        String body = """
                {"name": "Hacked", "capacity": 1}
                """;

        mvc.perform(post(ROOMS, user, body)).andExpect(status().isForbidden());
        mvc.perform(put(ROOMS + "/" + room.getId(), user, body)).andExpect(status().isForbidden());
        mvc.perform(delete(ROOMS + "/" + room.getId(), user)).andExpect(status().isForbidden());
        mvc.perform(get(ROOMS + "/" + room.getId(), user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("B204"));
    }

    @Test
    void validatesRoomsAndRejectsDuplicateNames() throws Exception {
        createRoom("A101", 10);

        mvc.perform(post(ROOMS, admin, """
                        {"name": "", "capacity": 0}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.capacity").exists());

        mvc.perform(post(ROOMS, admin, """
                        {"name": "a101", "capacity": 5}
                        """))
                .andExpect(status().isConflict());
    }

    @Test
    void aRoomWithReservationsCannotBeDeleted() throws Exception {
        Room room = createRoom("A101", 10);
        createReservation(room, userAccount, hoursFromNow(2), hoursFromNow(3));

        mvc.perform(delete(ROOMS + "/" + room.getId(), admin))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("This room has reservations. Deactivate it instead of deleting it."));
    }

    @Test
    void filtersByCapacityEquipmentAndAvailability() throws Exception {
        Room a101 = createRoom("A101", 12, "Projector", "Whiteboard");
        createRoom("B204", 6, "TV screen");
        createRoom("C300", 40, "Projector");
        Instant start = hoursFromNow(24);
        Instant end = hoursFromNow(26);
        createReservation(a101, userAccount, start, end);

        mvc.perform(get(ROOMS + "?minCapacity=10", user))
                .andExpect(jsonPath("$[*].name", contains("A101", "C300")));
        mvc.perform(get(ROOMS + "?equipment=projec", user))
                .andExpect(jsonPath("$[*].name", contains("A101", "C300")));
        mvc.perform(get(ROOMS + "?from=" + start.plusSeconds(1800) + "&to=" + end, user))
                .andExpect(jsonPath("$[*].name", contains("B204", "C300")));
        // Right after the booking ends, A101 is free again.
        mvc.perform(get(ROOMS + "?from=" + end + "&to=" + end.plusSeconds(3600), user))
                .andExpect(jsonPath("$[*].name", contains("A101", "B204", "C300")));
        mvc.perform(get(ROOMS + "?from=" + end, user)).andExpect(status().isBadRequest());
        mvc.perform(get(ROOMS + "?from=" + end + "&to=" + start, user)).andExpect(status().isBadRequest());
    }

    @Test
    void inactiveRoomsAreHiddenFromUsersButNotFromAdmins() throws Exception {
        createRoom("A101", 10);
        Room closed = rooms.save(new Room("Z999", 10, "Basement", java.util.List.of(), false));

        mvc.perform(get(ROOMS, user)).andExpect(jsonPath("$[*].name", contains("A101")));
        mvc.perform(get(ROOMS + "/" + closed.getId(), user)).andExpect(status().isNotFound());
        mvc.perform(get(ROOMS, admin)).andExpect(jsonPath("$[*].name", contains("A101", "Z999")));
    }

    @Test
    void showsTheBusySlotsOfARoom() throws Exception {
        Room room = createRoom("A101", 10);
        createReservation(room, userAccount, hoursFromNow(3), hoursFromNow(4));
        var cancelled = createReservation(room, userAccount, hoursFromNow(5), hoursFromNow(6));
        cancelled.cancel(Instant.now());

        mvc.perform(get(ROOMS + "/" + room.getId() + "/schedule?from=" + hoursFromNow(0) + "&to=" + hoursFromNow(48), user))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].startAt").value(hoursFromNow(3).toString()));
    }
}
