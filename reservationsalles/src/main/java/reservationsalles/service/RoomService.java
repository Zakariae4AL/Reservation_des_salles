package reservationsalles.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import reservationsalles.model.Room;
import reservationsalles.repository.RoomRepository;

import java.util.List;

@Service
public class RoomService {

    private static final Logger logger = LoggerFactory.getLogger(RoomService.class);

    @Autowired
    private RoomRepository roomRepository;
    public List<Room> searchRoomsByEquipment(String equipment) {
        logger.info("Searching for rooms with equipment: {}", equipment);
        return roomRepository.findByEquipmentContainingIgnoreCase(equipment);
    }

    public Room getRoomByNumber(String number) {
        logger.info("Searching for room with number: {}", number);
        Room room = roomRepository.findByNumber(number);
        if (room != null) {
            logger.info("Found room: {}", room);
        } else {
            logger.warn("No room found with number: {}", number);
        }
        return room;
    }
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

    // Add the createRoom method
    public Room createRoom(Room room) {
        // Save the new room to the database
        return roomRepository.save(room);
    }
}
