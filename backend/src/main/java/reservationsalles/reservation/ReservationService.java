package reservationsalles.reservation;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reservationsalles.auth.AuthUser;
import reservationsalles.common.ApiException;
import reservationsalles.reservation.ReservationDtos.ReservationRequest;
import reservationsalles.reservation.ReservationDtos.ReservationResponse;
import reservationsalles.room.Room;
import reservationsalles.room.RoomRepository;
import reservationsalles.user.User;
import reservationsalles.user.UserRepository;

@Service
public class ReservationService {

    static final Duration MAX_DURATION = Duration.ofHours(12);
    static final Duration MAX_ADVANCE = Duration.ofDays(365);

    private final ReservationRepository reservations;
    private final RoomRepository rooms;
    private final UserRepository users;
    private final Clock clock;

    public ReservationService(
            ReservationRepository reservations, RoomRepository rooms, UserRepository users, Clock clock) {
        this.reservations = reservations;
        this.rooms = rooms;
        this.users = users;
        this.clock = clock;
    }

    /**
     * Books a room. The room row is locked during the check, so two simultaneous
     * requests for the same slot can't both succeed.
     */
    @Transactional
    public ReservationResponse create(AuthUser principal, ReservationRequest request) {
        Instant now = clock.instant();
        Instant start = request.startAt();
        Instant end = request.endAt();

        if (!end.isAfter(start)) {
            throw ApiException.badRequest("The end time must be after the start time.");
        }
        if (!start.isAfter(now)) {
            throw ApiException.badRequest("A reservation can't start in the past.");
        }
        if (Duration.between(start, end).compareTo(MAX_DURATION) > 0) {
            throw ApiException.badRequest("A reservation can last at most 12 hours.");
        }
        if (start.isAfter(now.plus(MAX_ADVANCE))) {
            throw ApiException.badRequest("Reservations can be made at most one year in advance.");
        }

        Room room = rooms.findByIdForUpdate(request.roomId())
                .orElseThrow(() -> ApiException.notFound("Room not found."));
        if (!room.isActive()) {
            throw ApiException.conflict("This room is not available for booking.");
        }
        if (request.attendees() > room.getCapacity()) {
            throw ApiException.badRequest("This room holds at most " + room.getCapacity() + " people.");
        }
        if (reservations.existsOverlap(room.getId(), start, end, ReservationStatus.CONFIRMED)) {
            throw ApiException.conflict("This room is already booked during that time.");
        }

        User user = users.findById(principal.id()).orElseThrow(() -> ApiException.notFound("User not found."));
        Reservation saved = reservations.save(
                new Reservation(room, user, request.title().trim(), request.attendees(), start, end));
        return ReservationResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> mine(AuthUser principal) {
        return reservations.findByUserWithRoom(principal.id()).stream()
                .map(ReservationResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> all(ReservationStatus status) {
        var statuses = status == null ? EnumSet.allOf(ReservationStatus.class) : EnumSet.of(status);
        return reservations.findAllWithDetails(statuses).stream().map(ReservationResponse::from).toList();
    }

    /**
     * Owners can cancel their upcoming reservations; admins can cancel any.
     * Someone else's reservation answers 404, so its existence isn't revealed.
     */
    @Transactional
    public ReservationResponse cancel(AuthUser principal, Long id) {
        Reservation reservation = reservations.findWithDetails(id)
                .filter(r -> principal.isAdmin() || r.getUser().getId().equals(principal.id()))
                .orElseThrow(() -> ApiException.notFound("Reservation not found."));
        if (reservation.getStatus() == ReservationStatus.CANCELLED) {
            throw ApiException.conflict("This reservation is already cancelled.");
        }
        Instant now = clock.instant();
        if (!principal.isAdmin() && !reservation.getStartAt().isAfter(now)) {
            throw ApiException.conflict("A reservation that has already started can't be cancelled.");
        }
        reservation.cancel(now);
        return ReservationResponse.from(reservation);
    }
}
