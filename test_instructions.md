# Instructions de Test pour le Système de Réservation de Postes de Travail

Ce document explique comment tester les fonctionnalités de base que nous avons implémentées jusqu'à présent.

## Tester le Backend Spring Boot

### Prérequis

1. Assurez-vous que XAMPP est démarré avec les services MySQL et Apache en cours d'exécution
2. Vérifiez que MySQL est bien accessible sur le port 3306
3. Assurez-vous que Java 17 est installé sur votre machine

### Démarrer l'application Spring Boot

1. Ouvrez un terminal et naviguez vers le dossier du backend :
   ```
   cd c:\Users\Windows\Desktop\WEB4JOBS\p\backend
   ```

2. Exécutez l'application avec Maven :
   ```
   mvn spring-boot:run
   ```
   
   Si Maven n'est pas installé globalement, vous pouvez utiliser le wrapper Maven :
   ```
   ./mvnw spring-boot:run
   ```

3. L'application devrait démarrer sur le port 8080

### Tester les endpoints

Nous avons créé un contrôleur de test avec deux endpoints pour vérifier que l'application fonctionne correctement :

#### 1. Vérifier que l'application est en cours d'exécution

Accédez à l'URL suivante dans votre navigateur :
```
http://localhost:8080/api/test/ping
```

Vous devriez voir une réponse JSON similaire à :
```json
{
  "status": "success",
  "message": "Application is running!"
}
```

#### 2. Vérifier la connexion à la base de données

Accédez à l'URL suivante dans votre navigateur :
```
http://localhost:8080/api/test/db-connection
```

Si la connexion à la base de données est réussie, vous devriez voir une réponse JSON similaire à :
```json
{
  "status": "success",
  "message": "Database connection successful!",
  "databaseVersion": "10.4.28-MariaDB"
}
```

Si la connexion échoue, vous verrez un message d'erreur avec des détails sur le problème.

### Tester avec Postman

Vous pouvez également utiliser Postman pour tester les endpoints de l'API :

1. Téléchargez et installez Postman depuis [postman.com](https://www.postman.com/downloads/)

2. Importez la collection Postman fournie :
   - Ouvrez Postman
   - Cliquez sur "Import" en haut à gauche
   - Sélectionnez le fichier `postman_collection.json` situé à la racine du projet

3. Une fois importée, vous verrez la collection "Workstation Reservation System API" avec les requêtes de test

4. Assurez-vous que l'application Spring Boot est en cours d'exécution

5. Exécutez les requêtes de test en cliquant sur le bouton "Send" pour chaque requête

La collection Postman inclut les mêmes endpoints de test que ceux mentionnés ci-dessus, mais avec une interface plus conviviale pour visualiser les réponses et les en-têtes HTTP.

## Dépannage

### Problèmes de connexion à la base de données

1. Vérifiez que XAMPP est bien démarré et que le service MySQL est actif
2. Vérifiez les informations de connexion dans le fichier `application.properties`
3. Assurez-vous qu'aucun autre service n'utilise le port 3306

### Problèmes de démarrage de l'application Spring Boot

1. Vérifiez que le port 8080 n'est pas déjà utilisé par une autre application
2. Assurez-vous que Java 17 est bien installé et configuré
3. Vérifiez les logs de l'application pour identifier d'éventuelles erreurs

## Prochaines étapes

Les repositories et services pour toutes les entités ont été implémentés avec succès. La prochaine étape consiste à développer les contrôleurs REST suivants :

1. AuthController (authentification)
2. UserController (CRUD utilisateurs)
3. WorkStationController (CRUD postes)
4. ReservationController (CRUD réservations)
5. StatisticsController (rapports et statistiques)
6. RoomController (gestion des salles)
7. CenterController (gestion des centres)
8. NotificationController (gestion des notifications)

Une fois les contrôleurs implémentés, nous pourrons étendre la collection Postman avec des requêtes pour tester ces nouveaux endpoints.