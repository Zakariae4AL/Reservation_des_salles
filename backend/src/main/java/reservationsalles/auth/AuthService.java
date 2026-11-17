package reservationsalles.auth;

import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reservationsalles.auth.AuthDtos.AuthResponse;
import reservationsalles.auth.AuthDtos.LoginRequest;
import reservationsalles.auth.AuthDtos.RegisterRequest;
import reservationsalles.common.ApiException;
import reservationsalles.user.Role;
import reservationsalles.user.User;
import reservationsalles.user.UserRepository;
import reservationsalles.user.UserResponse;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    /** Checked when the email is unknown, so response time doesn't reveal which emails exist. */
    private final String dummyHash;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.dummyHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict("An account already exists with this email.");
        }
        User user = users.save(new User(
                request.fullName().trim(), email, passwordEncoder.encode(request.password()), Role.USER));
        return issue(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email().trim()).orElse(null);
        boolean matches = passwordEncoder.matches(request.password(), user != null ? user.getPasswordHash() : dummyHash);
        if (user == null || !matches) {
            throw new BadCredentialsException("Invalid email or password.");
        }
        return issue(user);
    }

    @Transactional(readOnly = true)
    public UserResponse me(AuthUser principal) {
        return users.findById(principal.id())
                .map(UserResponse::from)
                .orElseThrow(() -> ApiException.notFound("User not found."));
    }

    private AuthResponse issue(User user) {
        return new AuthResponse(jwtService.generate(user), jwtService.getTtl().toSeconds(), UserResponse.from(user));
    }
}
