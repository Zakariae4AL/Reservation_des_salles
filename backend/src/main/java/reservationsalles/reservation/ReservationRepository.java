package reservationsalles.reservation;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    /**
     * Two time ranges overlap when each one starts before the other ends.
     * Back-to-back bookings (10:00–11:00 then 11:00–12:00) don't overlap.
     */
    @Query("""
            select count(r) > 0 from Reservation r
            where r.room.id = :roomId and r.status = :status
              and r.startAt < :endAt and r.endAt > :startAt
            """)
    boolean existsOverlap(
            @Param("roomId") Long roomId,
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt,
            @Param("status") ReservationStatus status);

    @Query("""
            select distinct r.room.id from Reservation r
            where r.status = :status and r.startAt < :endAt and r.endAt > :startAt
            """)
    List<Long> findBusyRoomIds(
            @Param("startAt") Instant startAt,
            @Param("endAt") Instant endAt,
            @Param("status") ReservationStatus status);

    @Query("""
            select r from Reservation r
            where r.room.id = :roomId and r.status = :status
              and r.startAt < :to and r.endAt > :from
            order by r.startAt
            """)
    List<Reservation> findSchedule(
            @Param("roomId") Long roomId,
            @Param("from") Instant from,
            @Param("to") Instant to,
            @Param("status") ReservationStatus status);

    @Query("select r from Reservation r join fetch r.room where r.user.id = :userId order by r.startAt desc")
    List<Reservation> findByUserWithRoom(@Param("userId") Long userId);

    @Query("""
            select r from Reservation r join fetch r.room join fetch r.user
            where r.status in :statuses
            order by r.startAt desc
            """)
    List<Reservation> findAllWithDetails(@Param("statuses") Collection<ReservationStatus> statuses);

    @Query("select r from Reservation r join fetch r.room join fetch r.user where r.id = :id")
    Optional<Reservation> findWithDetails(@Param("id") Long id);

    boolean existsByRoomId(Long roomId);

    long countByStatusAndStartAtGreaterThanEqual(ReservationStatus status, Instant from);

    long countByStatusAndStartAtLessThanAndEndAtGreaterThan(ReservationStatus status, Instant before, Instant after);
}
