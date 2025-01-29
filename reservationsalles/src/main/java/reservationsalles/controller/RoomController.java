package reservationsalles.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reservationsalles.model.Room;
import reservationsalles.service.RoomService;

import java.util.List;


@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "http://localhost:4200")
public class RoomController {

    private static final Logger logger = LoggerFactory.getLogger(RoomController.class);

    @Autowired
    private RoomService roomService;

    @GetMapping("/search")
    public ResponseEntity<List<Room>> searchRoomsByEquipment(@RequestParam String equipment) {
        List<Room> rooms = roomService.searchRoomsByEquipment(equipment);
        if (rooms.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(rooms);
        }
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/number/{number}")
    public ResponseEntity<Room> getRoomByNumber(@PathVariable String number) {
        logger.info("Received request for room number: {}", number);
        try {
            Room room = roomService.getRoomByNumber(number);
            if (room != null) {
                logger.info("Found room: {}", room);
                return ResponseEntity.ok(room);
            } else {
                logger.warn("Room not found for number: {}", number);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            logger.error("Error while fetching room: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<Room>> getAllRooms() {
        return ResponseEntity.ok(roomService.getAllRooms());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Room>> getAvailableRooms() {
        return ResponseEntity.ok(roomService.getAvailableRooms());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Room> getRoomById(@PathVariable Long id) {
        return ResponseEntity.ok(roomService.getRoomById(id));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<Room> updateRoomAvailability(
            @PathVariable Long id,
            @RequestParam boolean available) {
        return ResponseEntity.ok(roomService.updateRoomAvailability(id, available));
    }

    @PatchMapping("/{id}/equipment")
    public ResponseEntity<Room> updateRoomEquipment(
            @PathVariable Long id,
            @RequestBody List<String> equipment) {
        return ResponseEntity.ok(roomService.updateRoomEquipment(id, equipment));
    }
    @PostMapping
    public ResponseEntity<Room> createRoom(@RequestBody Room room) {
        Room createdRoom = roomService.createRoom(room);
        return new ResponseEntity<>(createdRoom, HttpStatus.CREATED);
    }

}

