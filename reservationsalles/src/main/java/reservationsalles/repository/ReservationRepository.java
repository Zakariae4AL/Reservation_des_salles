package reservationsalles.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import reservationsalles.model.Reservation;

import java.util.Date;
import java.util.List;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findByRoomId(Long roomId);
    List<Reservation> findByRoomIdAndStartDateBetween(Long roomId, Date startDate, Date endDate);
    List<Reservation> findByStartDateBetween(Date startDate, Date endDate);
}

