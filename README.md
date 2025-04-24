# Projet DBD

## Description
Projet DBD est une application web qui permet de gérer des archives de canaux Discord. Elle utilise IndexedDB pour stocker les données extraites de fichiers ZIP contenant des informations sur les canaux et les messages.

## Structure du projet
Le projet est organisé comme suit :

```
Projet-DBD
├── js
│   ├── db.js                # Fonctions liées aux opérations de base de données
│   ├── dom.js               # Manipulations du DOM
│   ├── fileProcessing.js     # Traitement des fichiers ZIP et extraction des données
│   ├── randomChannel.js      # Affichage d'un canal aléatoire
│   ├── transfer.js           # Gestion du transfert de canaux entre différents stores
│   ├── userProfile.js        # Affichage des informations du profil utilisateur
│   └── utils.js              # Fonctions utilitaires
├── index.html                # Fichier HTML principal
├── script.js                 # Point d'entrée principal de l'application
└── README.md                 # Documentation du projet
```

## Installation
1. Clonez le dépôt ou téléchargez les fichiers du projet.
2. Ouvrez `index.html` dans un navigateur web compatible.

## Utilisation
- Chargez un fichier ZIP contenant les archives de canaux Discord via l'interface utilisateur.
- Les canaux et messages seront extraits et stockés dans la base de données.
- Vous pouvez afficher un canal aléatoire et gérer les canaux (garder ou supprimer) à partir de l'interface.

## Contribuer
Les contributions sont les bienvenues ! N'hésitez pas à soumettre des demandes de tirage pour des améliorations ou des corrections de bogues.