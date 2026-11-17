package reservationsalles.auth;

import reservationsalles.user.Role;

/** The authenticated user, available in controllers with @AuthenticationPrincipal. */
public record AuthUser(Long id, String email, Role role) {

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }
}
