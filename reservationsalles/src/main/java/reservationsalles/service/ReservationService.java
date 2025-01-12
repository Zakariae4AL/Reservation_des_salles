package reservationsalles.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reservationsalles.model.Notification;
import reservationsalles.model.Reservation;
import reservationsalles.repository.NotificationRepository;
import reservationsalles.repository.ReservationRepository;
import reservationsalles.repository.RoomRepository;
import java.util.Date;
import java.util.List;
@Service
public class ReservationService {
    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    public List<Reservation> getAllReservations() {
        return reservationRepository.findAll();
    }
    public Reservation createReservation(Reservation reservation) {
        // Vérifier si la salle est disponible
        if (!isRoomAvailable(reservation.getRoom().getId(),
                reservation.getStartDate(),
                reservation.getEndDate())) {
            throw new RuntimeException("La salle n'est pas disponible pour cette période");
        }

        // Définir le statut initial
        reservation.setStatus("CONFIRMÉE");

        // Sauvegarder la réservation
        Reservation savedReservation = reservationRepository.save(reservation);

        // Créer une notification
        createNotification(savedReservation, "RESERVATION_CREATED");

        return savedReservation;
    }

    public void cancelReservation(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Réservation non trouvée"));

        reservation.setStatus("ANNULÉE");
        reservationRepository.save(reservation);

        createNotification(reservation, "RESERVATION_CANCELLED");
    }

    public List<Reservation> getReservationsByRoom(Long roomId) {
        return reservationRepository.findByRoomId(roomId);
    }

    private boolean isRoomAvailable(Long roomId, Date startDate, Date endDate) {
        List<Reservation> conflictingReservations = reservationRepository
                .findByRoomIdAndStartDateBetween(roomId, startDate, endDate);
        return conflictingReservations.isEmpty();
    }

    private void createNotification(Reservation reservation, String type) {
        Notification notification = new Notification();
        notification.setType(type);
        notification.setUser(reservation.getUser());
        notificationRepository.save(notification);
    }

    public List<Reservation> getReservationsByDateRange(Date startDate, Date endDate) {
        return reservationRepository.findByStartDateBetween(startDate, endDate);
    }
}

