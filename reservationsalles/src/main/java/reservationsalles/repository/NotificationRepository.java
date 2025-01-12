package reservationsalles.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import reservationsalles.model.Notification;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserId(Long userId);
}

