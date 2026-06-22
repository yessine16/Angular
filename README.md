# Application de gestion d'une bibliothèque

Projet d'examen Front-End réalisé avec Angular 16, selon la même démarche et
la même architecture que le projet `lab`.

## Même méthode que le projet lab

| Projet lab | Projet bibliothèque |
| --- | --- |
| `member/member.component` | `books/books.component` et `readers/readers.component` |
| `member-from/member-from.component` | `book-form` et `reader-form` |
| `events/events.component` | `borrowings/borrowings.component` |
| `member.service.ts` | `book.service.ts` et `reader.service.ts` |
| `evt.service.ts` | `borrowing.service.ts` |
| `Member`, `Evenement` | `Book`, `Reader`, `Borrowing` |
| `fetch()` | `fetch()` dans chaque composant de liste |
| `applyFilter($event)` | `applyFilter($event)` avec `MatTableDataSource` |
| `idcourant` et `sub()` | `idcourant` et `sub()` dans chaque formulaire |
| `getAllMembers`, `AddMember`, `editMember` | `getAllBooks`, `AddBook`, `editBook`, etc. |

Les modèles restent dans `src/app/model`, les services dans `src/service`, les
composants dans `src/app`, et toutes les routes sont déclarées dans
`app-routing.module.ts`, comme dans `lab`.

## Fonctionnalités

- Authentification locale et gestion des rôles `admin` et `user`.
- Protection des routes avec `authGuard` et `adminGuard`.
- CRUD complet des livres, lecteurs et emprunts.
- Formulaires Angular réactifs avec validation.
- Consommation d'une API REST avec `HttpClient`.
- Relation entre `Book`, `Reader` et `Borrowing`.
- Tableaux Angular Material avec recherche, tri et pagination.
- Dashboard interactif avec Chart.js.
- Confirmation de suppression avec une fenêtre modale.
- Mise à jour automatique du stock lors d'un emprunt, retour ou suppression.
- Calcul automatique du statut `En cours`, `En retard` ou `Retourné`.
- Blocage d'un emprunt lorsque le livre n'est plus disponible.
- Messages de succès et d'erreur avec Angular Material SnackBar.
- Identifiants numériques séquentiels pour préserver les relations entre modèles.
- Demandes de livres envoyées par l'utilisateur et validées par l'administrateur.
- Approbation automatique d'une demande avec création de l'emprunt.
- Annulation et refus des demandes avec suivi de leur statut.
- Bouton de retour rapide avec restitution automatique du stock.

## Rôles

| Compte | Mot de passe | Droits |
| --- | --- | --- |
| `admin@biblio.tn` | `admin` | Consultation et CRUD complet |
| `user@biblio.tn` | `user` | Consultation uniquement |

## Correspondance avec l'énoncé

| Exigence | Implémentation |
| --- | --- |
| Architecture Angular | Modules, composants, modèles, services et guards |
| API REST | `BookService`, `ReaderService`, `BorrowingService` |
| CRUD complet | Livres, lecteurs et emprunts |
| Relation entre tables | Un emprunt référence un livre et un lecteur |
| Formulaires Angular | `BookForm`, `ReaderForm`, `BorrowingForm` |
| Utilisateurs et rôles | Sessions locales `admin/user` et contrôle des routes |
| Dashboard | Indicateurs, diagramme circulaire et histogramme |
| Déploiement | Compilation de production dans `dist/app` |

`json-server` joue le rôle de l'API REST de démonstration. Les URL des services
peuvent ensuite être remplacées par celles d'un back-end .NET, Spring Boot ou
Laravel sans modifier les composants.

## Démarrage local

Dans deux terminaux, depuis le dossier `App` :

```bash
npm run json-server
npm start
```

Ouvrir `http://localhost:4200`.

## Compilation de production

```bash
npm run build
```

Les fichiers à déployer sont générés dans `dist/app`.
