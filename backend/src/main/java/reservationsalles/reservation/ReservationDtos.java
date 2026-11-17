package reservationsalles.reservation;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class ReservationDtos {

    private ReservationDtos() {
    }

    public record ReservationRequest(
            @NotNull Long roomId,
            @NotBlank @Size(max = 100) String title,
            @NotNull @Min(1) @Max(1000) Integer attendees,
            @NotNull Instant startAt,
            @NotNull Instant endAt) {
    }

    public record RoomSummary(Long id, String name) {
    }

    public record OwnerSummary(Long id, String fullName, String email) {
    }

    public record ReservationResponse(
            Long id,
            RoomSummary room,
            OwnerSummary owner,
            String title,
            int attendees,
            Instant startAt,
            Instant endAt,
            ReservationStatus status,
            Instant createdAt) {

        public static ReservationResponse from(Reservation r) {
            return new ReservationResponse(
                    r.getId(),
                    new RoomSummary(r.getRoom().getId(), r.getRoom().getName()),
                    new OwnerSummary(r.getUser().getId(), r.getUser().getFullName(), r.getUser().getEmail()),
                    r.getTitle(),
                    r.getAttendees(),
                    r.getStartAt(),
                    r.getEndAt(),
                    r.getStatus(),
                    r.getCreatedAt());
        }
    }
}
