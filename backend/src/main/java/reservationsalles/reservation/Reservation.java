package reservationsalles.reservation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import reservationsalles.room.Room;
import reservationsalles.user.User;

@Entity
@Table(
        name = "reservations",
        indexes = {
            @Index(name = "idx_reservation_room_time", columnList = "room_id, start_at, end_at"),
            @Index(name = "idx_reservation_user", columnList = "user_id")
        })
public class Reservation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false)
    private int attendees;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 12)
    private ReservationStatus status = ReservationStatus.CONFIRMED;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    private Instant cancelledAt;

    protected Reservation() {
    }

    public Reservation(Room room, User user, String title, int attendees, Instant startAt, Instant endAt) {
        this.room = room;
        this.user = user;
        this.title = title;
        this.attendees = attendees;
        this.startAt = startAt;
        this.endAt = endAt;
    }

    public void cancel(Instant when) {
        this.status = ReservationStatus.CANCELLED;
        this.cancelledAt = when;
    }

    public Long getId() {
        return id;
    }

    public Room getRoom() {
        return room;
    }

    public User getUser() {
        return user;
    }

    public String getTitle() {
        return title;
    }

    public int getAttendees() {
        return attendees;
    }

    public Instant getStartAt() {
        return startAt;
    }

    public Instant getEndAt() {
        return endAt;
    }

    public ReservationStatus getStatus() {
        return status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }
}
