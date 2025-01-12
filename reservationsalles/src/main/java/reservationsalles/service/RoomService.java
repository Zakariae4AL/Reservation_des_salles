package reservationsalles.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reservationsalles.model.Room;
import reservationsalles.repository.RoomRepository;

import java.util.List;
import java.util.Date;

@Service
public class RoomService {
    @Autowired
    private RoomRepository roomRepository;

    public List<Room> getAllRooms() {
        return roomRepository.findAll();
    }

    public Room getRoomById(Long id) {
        return roomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Salle non trouvée"));
    }

    public List<Room> getAvailableRooms() {
        return roomRepository.findByAvailable(true);
    }

    public Room updateRoomAvailability(Long id, boolean available) {
        Room room = getRoomById(id);
        room.setAvailable(available);
        return roomRepository.save(room);
    }

    public Room updateRoomEquipment(Long id, List<String> equipment) {
        Room room = getRoomById(id);
        room.setEquipment(equipment);
        return roomRepository.save(room);
    }
}

