package reservationsalles.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import reservationsalles.user.UserResponse;

public final class AuthDtos {

    private AuthDtos() {
    }

    /** There is no "role" field: every new account is a regular user. */
    public record RegisterRequest(
            @NotBlank @Size(max = 80) String fullName,
            @NotBlank @Email @Size(max = 255) String email,
            @NotBlank
            @Size(min = 8, max = 72)
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "must contain at least one letter and one digit")
            String password) {
    }

    public record LoginRequest(@NotBlank @Email String email, @NotBlank @Size(max = 72) String password) {
    }

    public record AuthResponse(String token, long expiresInSeconds, UserResponse user) {
    }
}
