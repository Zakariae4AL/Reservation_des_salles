package reservationsalles.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import reservationsalles.model.Room;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    List<Room> findByAvailable(boolean available);
}

