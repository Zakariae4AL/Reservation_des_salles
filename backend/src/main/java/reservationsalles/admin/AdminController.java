package reservationsalles.admin;

import java.time.Clock;
import java.time.Instant;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reservationsalles.reservation.ReservationDtos.ReservationResponse;
import reservationsalles.reservation.ReservationRepository;
import reservationsalles.reservation.ReservationService;
import reservationsalles.reservation.ReservationStatus;
import reservationsalles.room.RoomRepository;
import reservationsalles.user.UserRepository;
import reservationsalles.user.UserResponse;

/** Admin-only endpoints (protected in SecurityConfig). */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    public record Stats(long rooms, long activeRooms, long users, long upcomingReservations, long ongoingReservations) {
    }

    private final ReservationService reservationService;
    private final ReservationRepository reservations;
    private final RoomRepository rooms;
    private final UserRepository users;
    private final Clock clock;

    public AdminController(
            ReservationService reservationService,
            ReservationRepository reservations,
            RoomRepository rooms,
            UserRepository users,
            Clock clock) {
        this.reservationService = reservationService;
        this.reservations = reservations;
        this.rooms = rooms;
        this.users = users;
        this.clock = clock;
    }

    @GetMapping("/reservations")
    public List<ReservationResponse> reservations(@RequestParam(required = false) ReservationStatus status) {
        return reservationService.all(status);
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public List<UserResponse> users() {
        return users.findAllByOrderByCreatedAtAsc().stream().map(UserResponse::from).toList();
    }

    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public Stats stats() {
        Instant now = clock.instant();
        long activeRooms = rooms.findAll().stream().filter(r -> r.isActive()).count();
        return new Stats(
                rooms.count(),
                activeRooms,
                users.count(),
                reservations.countByStatusAndStartAtGreaterThanEqual(ReservationStatus.CONFIRMED, now),
                reservations.countByStatusAndStartAtLessThanAndEndAtGreaterThan(ReservationStatus.CONFIRMED, now, now));
    }
}
