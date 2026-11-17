package reservationsalles.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Clock;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Limits login and registration attempts per client IP (sliding one-minute window)
 * to slow down password guessing. Other routes are not affected.
 */
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final long WINDOW_MILLIS = 60_000;

    private final int maxRequests;
    private final Clock clock;
    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(int maxRequests, Clock clock) {
        this.maxRequests = maxRequests;
        this.clock = clock;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !"POST".equals(request.getMethod())
                || !(path.endsWith("/api/v1/auth/login") || path.endsWith("/api/v1/auth/register"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long now = clock.millis();
        Deque<Long> times = attempts.computeIfAbsent(request.getRemoteAddr(), ip -> new ArrayDeque<>());
        boolean allowed;
        synchronized (times) {
            while (!times.isEmpty() && times.peekFirst() <= now - WINDOW_MILLIS) {
                times.pollFirst();
            }
            allowed = times.size() < maxRequests;
            if (allowed) {
                times.addLast(now);
            }
        }
        if (!allowed) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":429,\"title\":\"Too Many Requests\",\"detail\":\"Too many attempts. Try again in a minute.\"}");
            return;
        }
        chain.doFilter(request, response);
    }
}
