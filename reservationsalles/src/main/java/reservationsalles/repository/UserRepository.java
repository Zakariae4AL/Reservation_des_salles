package reservationsalles.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import reservationsalles.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);
    boolean existsByEmail(String email); // Vérifier si l'email existe

    User findByEmailAndPassword(String email, String password); // Trouver un utilisateur par email et mot de passe
}