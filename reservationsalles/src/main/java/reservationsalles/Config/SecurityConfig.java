package reservationsalles.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .authorizeRequests()
                // Permet l'accès non authentifié aux pages d'inscription, de connexion et de création de salles
                .requestMatchers("/api/users/register", "/api/users/login", "/api/rooms").permitAll()
                // Protège les autres endpoints
                .anyRequest().authenticated()
                .and()
                // Utilisation de l'authentification basique pour les autres routes protégées
                .httpBasic();
        return http.build();
    }
}
