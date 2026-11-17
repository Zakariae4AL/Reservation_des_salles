package reservationsalles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import reservationsalles.reservation.Reservation;
import reservationsalles.reservation.ReservationStatus;
import reservationsalles.room.Room;
import reservationsalles.user.Role;
import reservationsalles.user.User;

class ReservationApiTest extends ApiTestBase {

    private static final String RESERVATIONS = "/api/v1/reservations";

    private User alice;
    private User bob;
    private String aliceToken;
    private String bobToken;
    private String adminToken;
    private Room room;

    @BeforeEach
    void data() {
        alice = createUser("alice@example.com", Role.USER);
        bob = createUser("bob@example.com", Role.USER);
        aliceToken = tokenFor(alice);
        bobToken = tokenFor(bob);
        adminToken = tokenFor(createUser("admin@example.com", Role.ADMIN));
        room = createRoom("A101", 10, "Projector");
    }

    @Test
    void booksAFreeRoom() throws Exception {
        Instant start = hoursFromNow(24);
        mvc.perform(post(RESERVATIONS, aliceToken, booking(room.getId(), start, start.plusSeconds(3600), 4)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.room.name").value("A101"))
                .andExpect(jsonPath("$.owner.email").value("alice@example.com"))
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.startAt").value(start.toString()));

        mvc.perform(get(RESERVATIONS + "/mine", aliceToken)).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get(RESERVATIONS + "/mine", bobToken)).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void refusesOverlappingBookingsButAllowsBackToBack() throws Exception {
        Instant start = hoursFromNow(24);
        Instant end = hoursFromNow(26);
        mvc.perform(post(RESERVATIONS, aliceToken, booking(room.getId(), start, end, 2))).andExpect(status().isCreated());

        // Starts inside, ends inside, covers it entirely: all overlap.
        for (Instant[] slot : new Instant[][] {
                {start.plusSeconds(1800), end.plusSeconds(1800)},
                {start.minusSeconds(1800), start.plusSeconds(1800)},
                {start.minusSeconds(3600), end.plusSeconds(3600)},
                {start.plusSeconds(600), end.minusSeconds(600)}}) {
            mvc.perform(post(RESERVATIONS, bobToken, booking(room.getId(), slot[0], slot[1], 2)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.detail").value("This room is already booked during that time."));
        }

        mvc.perform(post(RESERVATIONS, bobToken, booking(room.getId(), end, end.plusSeconds(3600), 2)))
                .andExpect(status().isCreated());
        mvc.perform(post(RESERVATIONS, bobToken, booking(room.getId(), start.minusSeconds(3600), start, 2)))
                .andExpect(status().isCreated());
    }

    @Test
    void aCancelledBookingFreesTheSlot() throws Exception {
        Instant start = hoursFromNow(24);
        Reservation existing = createReservation(room, alice, start, start.plusSeconds(3600));
        existing.cancel(Instant.now());

        mvc.perform(post(RESERVATIONS, bobToken, booking(room.getId(), start, start.plusSeconds(3600), 2)))
                .andExpect(status().isCreated());
    }

    @Test
    void validatesTheTimeRange() throws Exception {
        Instant start = hoursFromNow(24);

        mvc.perform(post(RESERVATIONS, aliceToken, booking(room.getId(), start, start, 2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("The end time must be after the start time."));
        mvc.perform(post(RESERVATIONS, aliceToken, booking(room.getId(), hoursFromNow(-2), hoursFromNow(-1), 2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("A reservation can't start in the past."));
        mvc.perform(post(RESERVATIONS, aliceToken, booking(room.getId(), start, start.plusSeconds(13 * 3600), 2)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("A reservation can last at most 12 hours."));
        mvc.perform(post(RESERVATIONS, aliceToken, booking(room.getId(), hoursFromNow(24 * 400), hoursFromNow(24 * 400 + 1), 2)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void validatesTheRoomAndTheNumberOfAttendees() throws Exception {
        Instant start = hoursFromNow(24);
        Instant end = start.plusSeconds(3600);

        mvc.perform(post(RESERVATIONS, aliceToken, booking(room.getId(), start, end, 11)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value("This room holds at most 10 people."));
        mvc.perform(post(RESERVATIONS, aliceToken, booking(999_999L, start, end, 2)))
                .andExpect(status().isNotFound());
        mvc.perform(post(RESERVATIONS, aliceToken, """
                        {"roomId": null, "title": "", "attendees": 0}
                        """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.roomId").exists())
                .andExpect(jsonPath("$.errors.title").exists())
                .andExpect(jsonPath("$.errors.attendees").exists());

        room.update("A101", 10, "Building A", java.util.List.of(), false);
        rooms.flush();
        mvc.perform(post(RESERVATIONS, aliceToken, booking(room.getId(), start, end, 2)))
                .andExpect(status().isConflict());
    }

    @Test
    void ownersCanCancelTheirUpcomingReservations() throws Exception {
        Reservation mine = createReservation(room, alice, hoursFromNow(24), hoursFromNow(25));

        mvc.perform(post(RESERVATIONS + "/" + mine.getId() + "/cancel", aliceToken, ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        mvc.perform(post(RESERVATIONS + "/" + mine.getId() + "/cancel", aliceToken, ""))
                .andExpect(status().isConflict());

        assertThat(reservations.findById(mine.getId()).orElseThrow().getStatus()).isEqualTo(ReservationStatus.CANCELLED);
    }

    @Test
    void usersCannotSeeOrCancelOtherPeoplesReservations() throws Exception {
        Reservation alices = createReservation(room, alice, hoursFromNow(24), hoursFromNow(25));

        // 404 rather than 403, so the id of someone else's booking leaks nothing.
        mvc.perform(post(RESERVATIONS + "/" + alices.getId() + "/cancel", bobToken, ""))
                .andExpect(status().isNotFound());
        assertThat(reservations.findById(alices.getId()).orElseThrow().getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
    }

    @Test
    void startedReservationsCanOnlyBeCancelledByAnAdmin() throws Exception {
        Reservation ongoing = createReservation(room, alice, hoursFromNow(-1), hoursFromNow(1));

        mvc.perform(post(RESERVATIONS + "/" + ongoing.getId() + "/cancel", aliceToken, ""))
                .andExpect(status().isConflict());
        mvc.perform(post(RESERVATIONS + "/" + ongoing.getId() + "/cancel", adminToken, ""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}
