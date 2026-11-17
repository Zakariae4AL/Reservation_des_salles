package reservationsalles.room;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class RoomDtos {

    private RoomDtos() {
    }

    public record RoomRequest(
            @NotBlank @Size(max = 30) String name,
            @NotNull @Min(1) @Max(1000) Integer capacity,
            @Size(max = 100) String location,
            @Size(max = 20) List<@NotBlank @Size(max = 40) String> equipment,
            Boolean active) {
    }

    public record RoomResponse(Long id, String name, int capacity, String location, List<String> equipment, boolean active) {

        public static RoomResponse from(Room room) {
            return new RoomResponse(
                    room.getId(),
                    room.getName(),
                    room.getCapacity(),
                    room.getLocation(),
                    room.getEquipment().stream().sorted().toList(),
                    room.isActive());
        }
    }

    /** A busy period in a room's schedule — no personal data, visible to every user. */
    public record BusySlot(Instant startAt, Instant endAt) {
    }
}
