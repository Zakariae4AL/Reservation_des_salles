package reservationsalles.config;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import reservationsalles.reservation.Reservation;
import reservationsalles.reservation.ReservationRepository;
import reservationsalles.room.Room;
import reservationsalles.room.RoomRepository;
import reservationsalles.user.Role;
import reservationsalles.user.User;
import reservationsalles.user.UserRepository;

/**
 * Creates demo accounts, rooms and bookings on an empty database (local development only).
 * Disabled with SEED_DEMO=false, and always off in the 'prod' profile.
 */
@Component
@ConditionalOnProperty(name = "app.seed.demo", havingValue = "true")
public class DemoDataSeeder implements ApplicationRunner {

    public static final String ADMIN_EMAIL = "admin@salles.dev";
    public static final String USER_EMAIL = "user@salles.dev";
    public static final String DEMO_PASSWORD = "Demo1234";

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    private final UserRepository users;
    private final RoomRepository rooms;
    private final ReservationRepository reservations;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public DemoDataSeeder(
            UserRepository users,
            RoomRepository rooms,
            ReservationRepository reservations,
            PasswordEncoder passwordEncoder,
            Clock clock) {
        this.users = users;
        this.rooms = rooms;
        this.reservations = reservations;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (users.count() > 0) {
            return;
        }
        String hash = passwordEncoder.encode(DEMO_PASSWORD);
        User admin = users.save(new User("Admin Salles", ADMIN_EMAIL, hash, Role.ADMIN));
        User user = users.save(new User("Sara Benali", USER_EMAIL, hash, Role.USER));

        Room a101 = rooms.save(new Room("A101", 12, "Building A, 1st floor", List.of("Projector", "Whiteboard"), true));
        Room b204 = rooms.save(new Room("B204", 6, "Building B, 2nd floor", List.of("TV screen", "Whiteboard"), true));
        Room amphi = rooms.save(new Room("Amphi C", 120, "Building C", List.of("Projector", "Microphone", "Videoconference"), true));
        rooms.save(new Room("D012", 4, "Building D, ground floor", List.of("Whiteboard"), true));
        rooms.save(new Room("E310", 20, "Building E, 3rd floor", List.of("Videoconference", "TV screen"), false));

        Instant base = clock.instant().truncatedTo(ChronoUnit.DAYS).plus(1, ChronoUnit.DAYS);
        reservations.save(new Reservation(a101, user, "Project kick-off", 8,
                base.plus(9, ChronoUnit.HOURS), base.plus(10, ChronoUnit.HOURS)));
        reservations.save(new Reservation(b204, user, "Weekly sync", 5,
                base.plus(14, ChronoUnit.HOURS), base.plus(15, ChronoUnit.HOURS)));
        reservations.save(new Reservation(amphi, admin, "Induction day", 90,
                base.plus(1, ChronoUnit.DAYS).plus(8, ChronoUnit.HOURS), base.plus(1, ChronoUnit.DAYS).plus(12, ChronoUnit.HOURS)));

        log.info("Demo data created. Log in as {} or {} with password {}", ADMIN_EMAIL, USER_EMAIL, DEMO_PASSWORD);
    }
}
