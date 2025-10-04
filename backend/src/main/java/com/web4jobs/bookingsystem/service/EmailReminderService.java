package com.web4jobs.bookingsystem.service;

import com.web4jobs.bookingsystem.model.Reservation;
import com.web4jobs.bookingsystem.model.ReservationStatus;
import com.web4jobs.bookingsystem.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailReminderService {

    private final JavaMailSender mailSender;
    private final ReservationRepository reservationRepository;

    @Value("${app.email.from}")
    private String fromEmail;

    @Value("${app.email.reminder.enabled:true}")
    private boolean reminderEnabled;

    /**
     * Runs every 5 minutes to check for reservations starting in 1 hour
     */
    @Scheduled(fixedRate = 300000) // 5 minutes = 300,000 milliseconds
    public void sendReservationReminders() {
        if (!reminderEnabled) {
            return;
        }

        log.info("Checking for reservations needing reminders...");

        // Get current time and 1 hour from now (with 5-minute window)
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime oneHourFromNow = now.plusHours(1);
        LocalDateTime reminderWindowStart = oneHourFromNow.minusMinutes(2); // 58 minutes from now
        LocalDateTime reminderWindowEnd = oneHourFromNow.plusMinutes(3);   // 63 minutes from now

        // Find reservations starting in approximately 1 hour that haven't been reminded
        List<Reservation> upcomingReservations = reservationRepository.findUpcomingReservationsForReminder(
                reminderWindowStart, reminderWindowEnd, ReservationStatus.CONFIRMED);

        log.info("Found {} reservations needing reminders", upcomingReservations.size());

        for (Reservation reservation : upcomingReservations) {
            try {
                sendReminderEmail(reservation);
                // Mark as reminded (you might want to add a 'reminderSent' field to Reservation entity)
                log.info("Reminder sent for reservation ID: {}", reservation.getId());
            } catch (Exception e) {
                log.error("Failed to send reminder for reservation ID: {}", reservation.getId(), e);
            }
        }
    }

    /**
     * Send reminder email to user
     */
    private void sendReminderEmail(Reservation reservation) {
        String userEmail = reservation.getUser().getEmail();
        String userName = reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName();
        String workstationName = reservation.getWorkStation().getName();
        String roomName = reservation.getWorkStation().getRoom().getName();
        String centerName = reservation.getWorkStation().getRoom().getCenter().getName();
        
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        String startTime = reservation.getStartTime().format(timeFormatter);
        String endTime = reservation.getEndTime().format(timeFormatter);
        String date = reservation.getStartTime().format(dateFormatter);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(userEmail);
        message.setSubject("🔔 Rappel de Réservation - Dans 1 heure");
        
        String emailBody = String.format(
                "Bonjour %s,\n\n" +
                "⏰ Rappel: Votre réservation commence dans 1 heure !\n\n" +
                "📋 DÉTAILS DE VOTRE RÉSERVATION:\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "🖥️  Poste: %s\n" +
                "🏢  Salle: %s\n" +
                "🏛️  Centre: %s\n" +
                "📅  Date: %s\n" +
                "🕐  Heure: %s - %s\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "💡 RAPPELS IMPORTANTS:\n" +
                "• Arrivez quelques minutes en avance\n" +
                "• Apportez vos écouteurs si nécessaire\n" +
                "• N'oubliez pas votre matériel de travail\n" +
                "• Respectez les règles du centre\n\n" +
                "❌ ANNULATION:\n" +
                "Si vous ne pouvez pas venir, annulez votre réservation\n" +
                "dans l'application pour éviter les pénalités.\n\n" +
                "📱 Connectez-vous à votre tableau de bord:\n" +
                "http://localhost:3000/dashboard/reservations\n\n" +
                "Bonne session de travail ! 💻\n\n" +
                "---\n" +
                "Système de Réservation de Postes de Travail\n" +
                "Cet email est envoyé automatiquement.",
                userName, workstationName, roomName, centerName, date, startTime, endTime
        );
        
        message.setText(emailBody);
        
        mailSender.send(message);
        log.info("Reminder email sent to: {} for reservation: {}", userEmail, reservation.getId());
    }

    /**
     * Manual method to send immediate reminder (for testing)
     */
    public void sendImmediateReminder(Long reservationId) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new RuntimeException("Reservation not found"));
        
        sendReminderEmail(reservation);
    }

    /**
     * Send a simple test email to verify email configuration
     */
    public void sendTestEmail(String testEmail) {
        String toEmail = testEmail != null ? testEmail : fromEmail;
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("✅ Test Email - Configuration Successful");
        
        String emailBody = "🎉 Félicitations !\n\n" +
                "Votre configuration email fonctionne parfaitement !\n\n" +
                "📧 Détails du test:\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "📤 Expéditeur: " + fromEmail + "\n" +
                "📥 Destinataire: " + toEmail + "\n" +
                "⏰ Heure d'envoi: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")) + "\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "✅ Les rappels automatiques de réservation sont maintenant opérationnels !\n\n" +
                "💡 Informations:\n" +
                "• Les rappels sont envoyés 1 heure avant chaque réservation\n" +
                "• Le service vérifie toutes les 5 minutes\n" +
                "• Les étudiants recevront leurs rappels automatiquement\n\n" +
                "🔧 Configuration SMTP:\n" +
                "• Serveur: smtp.gmail.com:587\n" +
                "• Sécurité: TLS activé\n" +
                "• Authentification: App Password utilisé\n\n" +
                "---\n" +
                "Système de Réservation de Postes de Travail\n" +
                "Email de test envoyé automatiquement.";
        
        message.setText(emailBody);
        
        mailSender.send(message);
        log.info("Test email sent successfully to: {}", toEmail);
    }

    /**
     * Send test reminder emails to students with upcoming reservations (for testing)
     */
    public int sendTestStudentReminders() {
        log.info("Sending test reminders to students with upcoming reservations...");

        // Get reservations for the next 24 hours to test with real student data
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusDays(1);

        List<Reservation> upcomingReservations = reservationRepository.findUpcomingReservationsForReminder(
                now, tomorrow, ReservationStatus.CONFIRMED);

        log.info("Found {} upcoming reservations for testing", upcomingReservations.size());

        int emailsSent = 0;
        for (Reservation reservation : upcomingReservations) {
            try {
                sendTestReminderEmail(reservation);
                emailsSent++;
                log.info("Test reminder sent for reservation ID: {} to student: {}", 
                    reservation.getId(), reservation.getUser().getEmail());
            } catch (Exception e) {
                log.error("Failed to send test reminder for reservation ID: {}", reservation.getId(), e);
            }
        }

        return emailsSent;
    }

    /**
     * Send test reminder email to student (clearly marked as test)
     */
    private void sendTestReminderEmail(Reservation reservation) {
        String userEmail = reservation.getUser().getEmail();
        String userName = reservation.getUser().getFirstName() + " " + reservation.getUser().getLastName();
        String workstationName = reservation.getWorkStation().getName();
        String roomName = reservation.getWorkStation().getRoom().getName();
        String centerName = reservation.getWorkStation().getRoom().getCenter().getName();
        
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        
        String startTime = reservation.getStartTime().format(timeFormatter);
        String endTime = reservation.getEndTime().format(timeFormatter);
        String date = reservation.getStartTime().format(dateFormatter);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(userEmail);
        message.setSubject("🧪 TEST - Rappel de Réservation (Email de Test)");
        
        String emailBody = String.format(
                "Bonjour %s,\n\n" +
                "🧪 CECI EST UN EMAIL DE TEST 🧪\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "✅ Bonne nouvelle ! Le système d'email fonctionne parfaitement !\n\n" +
                "📋 VOTRE PROCHAINE RÉSERVATION:\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" +
                "🖥️  Poste: %s\n" +
                "🏢  Salle: %s\n" +
                "🏛️  Centre: %s\n" +
                "📅  Date: %s\n" +
                "🕐  Heure: %s - %s\n" +
                "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n" +
                "💡 RAPPELS IMPORTANTS:\n" +
                "• Arrivez quelques minutes en avance\n" +
                "• Apportez vos écouteurs si nécessaire\n" +
                "• N'oubliez pas votre matériel de travail\n" +
                "• Respectez les règles du centre\n\n" +
                "🔔 À partir de maintenant, vous recevrez automatiquement:\n" +
                "• Un rappel 1 heure avant chaque réservation\n" +
                "• Les notifications importantes du système\n\n" +
                "📱 Accédez à votre tableau de bord:\n" +
                "http://localhost:3000/dashboard/reservations\n\n" +
                "🧪 NOTE: Ceci était un email de test pour vérifier que\n" +
                "le système fonctionne correctement. Aucune action requise.\n\n" +
                "Bonne session de travail ! 💻\n\n" +
                "---\n" +
                "Système de Réservation de Postes de Travail\n" +
                "Email de test envoyé par l'administrateur.",
                userName, workstationName, roomName, centerName, date, startTime, endTime
        );
        
        message.setText(emailBody);
        
        mailSender.send(message);
        log.info("Test reminder email sent to student: {} for reservation: {}", userEmail, reservation.getId());
    }
} 