package reservationsalles.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import reservationsalles.model.Room;

import java.util.List;

public interface RoomRepository extends JpaRepository<Room, Long> {
    Room findByNumber(String number);
    List<Room> findByAvailable(boolean available);
    List<Room> findByEquipmentContainingIgnoreCase(String equipment);
}

