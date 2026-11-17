package reservationsalles.reservation;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reservationsalles.auth.AuthUser;
import reservationsalles.reservation.ReservationDtos.ReservationRequest;
import reservationsalles.reservation.ReservationDtos.ReservationResponse;

@RestController
@RequestMapping("/api/v1/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @GetMapping("/mine")
    public List<ReservationResponse> mine(@AuthenticationPrincipal AuthUser user) {
        return reservationService.mine(user);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ReservationResponse create(@AuthenticationPrincipal AuthUser user, @Valid @RequestBody ReservationRequest request) {
        return reservationService.create(user, request);
    }

    @PostMapping("/{id}/cancel")
    public ReservationResponse cancel(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return reservationService.cancel(user, id);
    }
}
