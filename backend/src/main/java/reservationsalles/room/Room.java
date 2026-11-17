package reservationsalles.room;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.Collection;
import java.util.Set;
import java.util.TreeSet;

@Entity
@Table(name = "rooms")
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Room code shown to users, e.g. "A101". Unique. */
    @Column(nullable = false, unique = true, length = 30)
    private String name;

    @Column(nullable = false)
    private int capacity;

    @Column(length = 100)
    private String location;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "room_equipment", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "equipment", nullable = false, length = 40)
    private Set<String> equipment = new TreeSet<>();

    /** Inactive rooms (maintenance, closed…) can't be booked. */
    @Column(nullable = false)
    private boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Room() {
    }

    public Room(String name, int capacity, String location, Collection<String> equipment, boolean active) {
        update(name, capacity, location, equipment, active);
    }

    public final void update(String name, int capacity, String location, Collection<String> equipment, boolean active) {
        this.name = name;
        this.capacity = capacity;
        this.location = location;
        this.equipment.clear();
        this.equipment.addAll(equipment);
        this.active = active;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getCapacity() {
        return capacity;
    }

    public String getLocation() {
        return location;
    }

    public Set<String> getEquipment() {
        return equipment;
    }

    public boolean isActive() {
        return active;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
