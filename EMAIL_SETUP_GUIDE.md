# 📧 Email Reminder Setup Guide

## ✅ **What's Implemented:**

### **🔔 Automatic Email Reminders:**
- **Triggers:** 1 hour before each reservation
- **Frequency:** Checks every 5 minutes
- **Status:** Only sends to CONFIRMED reservations
- **Content:** Detailed, professional French emails with emojis

### **📋 Email Content Includes:**
- ✅ Reservation details (workstation, room, center)
- ✅ Date and time information
- ✅ Important reminders (arrive early, bring headphones)
- ✅ Cancellation instructions
- ✅ Direct link to dashboard

## 🔧 **Setup Instructions:**

### **Step 1: Create Gmail App Password**

1. **Go to your Gmail account settings:**
   - Visit: https://myaccount.google.com/security

2. **Enable 2-Step Verification** (if not already enabled)

3. **Generate App Password:**
   - Go to "App passwords" section
   - Select "Mail" as the app
   - Generate password (16-character code)

### **Step 2: Update Configuration**

**Edit `application.properties`:**
```properties
# Replace these with your actual Gmail credentials:
spring.mail.username=your-actual-email@gmail.com
spring.mail.password=your-16-character-app-password

app.email.from=your-actual-email@gmail.com
```

### **Step 3: Test the System**

**Option A: Manual Test (Recommended)**
```bash
# Test with a specific reservation ID
POST http://localhost:8080/api/email/test-reminder/123
```

**Option B: Create Test Reservation**
1. Create a reservation for 1 hour from now
2. Wait for the automatic reminder (checks every 5 minutes)

## 📊 **System Details:**

### **🕐 Timing Logic:**
- **Check Interval:** Every 5 minutes
- **Reminder Window:** 58-63 minutes before reservation
- **Target:** Exactly 1 hour before start time

### **🎯 Triggering Conditions:**
```java
// Only sends reminders for:
- ReservationStatus.CONFIRMED
- Reservations starting in 58-63 minutes
- Has not been reminded yet (no duplicate emails)
```

### **📧 Email Template:**
```
Subject: 🔔 Rappel de Réservation - Dans 1 heure

Bonjour [User Name],

⏰ Rappel: Votre réservation commence dans 1 heure !

📋 DÉTAILS DE VOTRE RÉSERVATION:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️  Poste: [Workstation Name]
🏢  Salle: [Room Name]  
🏛️  Centre: [Center Name]
📅  Date: [DD/MM/YYYY]
🕐  Heure: [HH:MM] - [HH:MM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 RAPPELS IMPORTANTS:
• Arrivez quelques minutes en avance
• Apportez vos écouteurs si nécessaire
• N'oubliez pas votre matériel de travail
• Respectez les règles du centre

❌ ANNULATION:
Si vous ne pouvez pas venir, annulez votre réservation
dans l'application pour éviter les pénalités.

📱 Connectez-vous à votre tableau de bord:
http://localhost:3000/dashboard/reservations

Bonne session de travail ! 💻
```

## 🔍 **Monitoring & Logs:**

### **Backend Logs to Watch:**
```
INFO: Checking for reservations needing reminders...
INFO: Found X reservations needing reminders
INFO: Reminder sent for reservation ID: 123
INFO: Reminder email sent to: user@email.com for reservation: 123
```

### **Error Handling:**
- Failed emails are logged but don't stop the service
- System continues checking every 5 minutes
- Fallback: Manual reminder API available

## ⚙️ **Admin Controls:**

### **Disable Reminders:**
```properties
app.email.reminder.enabled=false
```

### **Manual Commands:**
```bash
# Test specific reservation
POST /api/email/test-reminder/123

# Force reminder check now  
POST /api/email/check-reminders
```

## 🚀 **Next Steps:**

1. **Update your Gmail credentials** in `application.properties`
2. **Restart the backend** to load new email configuration
3. **Create a test reservation** for 1 hour from now
4. **Monitor backend logs** for reminder activity
5. **Check your email** for the test reminder

## 📈 **Optional Enhancements:**

### **Future Improvements:**
- ✅ **HTML emails** with better formatting
- ✅ **Multiple reminder times** (24h, 1h, 15min)
- ✅ **Email templates** for different scenarios
- ✅ **Unsubscribe options**
- ✅ **SMS reminders** (Twilio integration)
- ✅ **Reminder preferences** per user

---

## 🎯 **Status: Ready to Use!**

Your email reminder system is fully implemented and ready to send automatic reminders to students 1 hour before their workstation reservations! 📧✨ 