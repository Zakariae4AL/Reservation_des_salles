package reservationsalles.room;

import java.time.Instant;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reservationsalles.common.ApiException;
import reservationsalles.reservation.ReservationRepository;
import reservationsalles.reservation.ReservationStatus;
import reservationsalles.room.RoomDtos.BusySlot;
import reservationsalles.room.RoomDtos.RoomRequest;
import reservationsalles.room.RoomDtos.RoomResponse;

@Service
public class RoomService {

    private final RoomRepository rooms;
    private final ReservationRepository reservations;

    public RoomService(RoomRepository rooms, ReservationRepository reservations) {
        this.rooms = rooms;
        this.reservations = reservations;
    }

    /**
     * Rooms matching the filters. With a time range, only active rooms that are
     * free for the whole range are returned. Regular users never see inactive rooms.
     */
    @Transactional(readOnly = true)
    public List<RoomResponse> search(
            Instant from, Instant to, Integer minCapacity, String equipment, boolean includeInactive) {
        if ((from == null) != (to == null)) {
            throw ApiException.badRequest("Provide both 'from' and 'to', or neither.");
        }
        if (from != null && !to.isAfter(from)) {
            throw ApiException.badRequest("'to' must be after 'from'.");
        }
        Set<Long> busy = from == null
                ? Set.of()
                : new HashSet<>(reservations.findBusyRoomIds(from, to, ReservationStatus.CONFIRMED));
        String wanted = equipment == null ? null : equipment.trim().toLowerCase(Locale.ROOT);

        return rooms.findAllByOrderByNameAsc().stream()
                .filter(room -> room.isActive() || (includeInactive && from == null))
                .filter(room -> minCapacity == null || room.getCapacity() >= minCapacity)
                .filter(room -> wanted == null || wanted.isEmpty() || room.getEquipment().stream()
                        .anyMatch(item -> item.toLowerCase(Locale.ROOT).contains(wanted)))
                .filter(room -> !busy.contains(room.getId()))
                .map(RoomResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RoomResponse get(Long id, boolean includeInactive) {
        Room room = find(id);
        if (!room.isActive() && !includeInactive) {
            throw ApiException.notFound("Room not found.");
        }
        return RoomResponse.from(room);
    }

    @Transactional(readOnly = true)
    public List<BusySlot> schedule(Long id, Instant from, Instant to) {
        if (from == null || to == null || !to.isAfter(from)) {
            throw ApiException.badRequest("Provide a valid 'from' / 'to' range.");
        }
        find(id);
        return reservations.findSchedule(id, from, to, ReservationStatus.CONFIRMED).stream()
                .map(r -> new BusySlot(r.getStartAt(), r.getEndAt()))
                .toList();
    }

    @Transactional
    public RoomResponse create(RoomRequest request) {
        String name = request.name().trim();
        if (rooms.existsByNameIgnoreCase(name)) {
            throw ApiException.conflict("A room with this name already exists.");
        }
        Room room = new Room(name, request.capacity(), clean(request.location()), equipment(request),
                request.active() == null || request.active());
        return RoomResponse.from(rooms.save(room));
    }

    @Transactional
    public RoomResponse update(Long id, RoomRequest request) {
        Room room = find(id);
        String name = request.name().trim();
        rooms.findByNameIgnoreCase(name)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw ApiException.conflict("A room with this name already exists.");
                });
        room.update(name, request.capacity(), clean(request.location()), equipment(request),
                request.active() == null || request.active());
        return RoomResponse.from(room);
    }

    /** Rooms with booking history can't be deleted (it would erase that history): deactivate them instead. */
    @Transactional
    public void delete(Long id) {
        Room room = find(id);
        if (reservations.existsByRoomId(id)) {
            throw ApiException.conflict("This room has reservations. Deactivate it instead of deleting it.");
        }
        rooms.delete(room);
    }

    private Room find(Long id) {
        return rooms.findById(id).orElseThrow(() -> ApiException.notFound("Room not found."));
    }

    private static Set<String> equipment(RoomRequest request) {
        // Trimmed, without blanks, and without case-insensitive duplicates ("Projector" == "projector").
        Set<String> items = new LinkedHashSet<>();
        Set<String> seen = new HashSet<>();
        if (request.equipment() != null) {
            request.equipment().stream()
                    .map(String::trim)
                    .filter(item -> !item.isEmpty() && seen.add(item.toLowerCase(Locale.ROOT)))
                    .forEach(items::add);
        }
        return items;
    }

    private static String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
