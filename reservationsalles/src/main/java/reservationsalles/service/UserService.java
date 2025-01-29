package reservationsalles.service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import reservationsalles.model.User;
import reservationsalles.repository.UserRepository;
@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public User registerUser(User user) {
        // Vérifier si l'utilisateur existe déjà dans la base de données
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("L'email est déjà pris");
        }

        // Enregistrer l'utilisateur
        return userRepository.save(user); // Retourne l'utilisateur enregistré
    }

    public User validateUser(String email, String password) {
        // Vérification de l'utilisateur dans la base de données
        User user = userRepository.findByEmail(email);
        if (user != null && user.getPassword().equals(password)) {
            return user;  // Connexion réussie
        }
        return null;  // Identifiants invalides
    }


    public String loginUser(String email, String password) {
        User user = userRepository.findByEmail(email);
        if (user != null && passwordEncoder.matches(password, user.getPassword())) {
            // In a real application, you would generate a proper JWT token here
            return "dummy_token";
        }
        throw new RuntimeException("Invalid email or password");
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }


}

