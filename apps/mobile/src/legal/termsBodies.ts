import type { LegalEntityInfo } from "./entityInfo";

/** Conditions générales d'utilisation (FR) — brouillon. Faire valider par un juriste. */
export function buildTermsOfServiceFr(e: LegalEntityInfo): string {
  return `Conditions générales d'utilisation — ${e.tradeName}

Dernière mise à jour : ${e.lastUpdatedFr}

1. Objet et acceptation
Les présentes CGU encadrent l'accès et l'utilisation de l'Application ${e.tradeName} éditée par ${e.legalName}. En créant un compte ou en utilisant l'Application, vous acceptez sans réserve les présentes CGU et la politique de confidentialité associée.

L'éditeur se réserve le droit de modifier les présentes CGU à tout moment. Les modifications prennent effet dès leur publication dans l'Application. L'utilisation de l'Application après publication d'une nouvelle version des CGU vaut acceptation de celle-ci.

2. Description synthétique du service
${e.tradeName} est une application de fidélité permettant aux utilisateurs de réaliser des missions afin de gagner des jetons virtuels, échangeables contre des bons d'achat ou des récompenses. Le service inclut notamment : des missions, un portefeuille de jetons virtuels, des mécanismes de tirage au sort, un système de parrainage et des notifications. La description exacte des fonctionnalités peut évoluer ; l'éditeur s'efforce d'en informer les utilisateurs en cas de changement substantiel. Le service est proposé en priorité aux utilisateurs résidant en France.

3. Compte utilisateur
L'accès à certaines fonctionnalités nécessite un compte. Vous vous engagez à fournir des informations exactes et à maintenir la confidentialité des moyens d'authentification qui vous sont confiés. Toute activité réalisée depuis votre compte est présumée être la vôtre, sauf preuve contraire raisonnable.

4. Conditions d'éligibilité, âge et territoire
4.1. Âge : l'utilisation générale de l'Application est réservée aux personnes âgées d'au moins 15 ans. Certaines fonctionnalités — notamment la participation à des tirages au sort ou l'attribution de certains lots — peuvent être réservées aux personnes majeures de 18 ans ; l'âge requis est alors indiqué sur l'écran concerné et dans le règlement de l'opération. L'éditeur se réserve le droit de demander une preuve d'âge à tout moment.
4.2. Capacité : vous déclarez avoir la capacité juridique requise ou, si vous êtes mineur entre 15 et 18 ans, utiliser le service avec l'accord de la personne titulaire de l'autorité parentale lorsque la loi l'exige.
4.3. Territoire : le service est aujourd'hui destiné aux utilisateurs en France ; l'éditeur peut restreindre techniquement ou contractuellement certaines opérations.
4.4. L'éditeur peut refuser l'accès ou suspendre un compte en cas de non-respect de ces règles.

5. Règles d'utilisation acceptables
Il est notamment interdit :
• d'usurper l'identité d'un tiers ou de créer des comptes de manière frauduleuse ;
• de créer plusieurs comptes pour un même utilisateur (comptes multiples) ;
• de tenter de contourner les mesures de sécurité, d'extraire massivement des données, ou d'utiliser l'Application de manière abusive ;
• de publier des contenus illicites, diffamatoires, haineux, violents, à caractère sexuel non consensuel, ou portant atteinte aux droits de tiers ;
• d'utiliser l'Application pour spammer ou harceler ;
• de simuler ou falsifier la réalisation d'une mission par quelque moyen que ce soit (bot, script, manipulation, fausse preuve, etc.).

Pour les missions impliquant des actions sur des services tiers (réseaux sociaux, sites partenaires), vous respectez également leurs conditions d'utilisation.

6. Missions
6.1. Définition : une mission est une action définie par l'éditeur que l'utilisateur est invité à réaliser afin de gagner des jetons. Les missions peuvent notamment consister à : regarder un contenu (vidéo ou publicité), réaliser une action externe à l'Application (liker, commenter, suivre un compte sur un réseau social), ou se connecter quotidiennement à l'Application.
6.2. Durée : chaque mission est assortie d'une date de début et d'une date de fin clairement indiquées. Passée la date de fin, la mission ne peut plus être réalisée.
6.3. Créditement : selon la nature de la mission, les jetons sont crédités immédiatement à la validation ou après vérification par l'éditeur. L'éditeur se réserve un délai raisonnable pour procéder à cette vérification.
6.4. Non-conformité et retrait : si l'éditeur constate, à tout moment, qu'une mission a été réalisée de manière non conforme (preuve invalide, comportement automatisé, fraude), les jetons correspondants pourront être annulés et retirés du portefeuille de l'utilisateur, sans préavis ni indemnité. En cas de gain à un tirage au sort, l'ensemble des missions de l'utilisateur concerné pourra faire l'objet d'un audit approfondi.
6.5. Missions sur services tiers : pour les missions impliquant une action sur un service tiers (réseau social, site partenaire), l'éditeur ne peut être tenu responsable de la disponibilité, des évolutions ou des conditions d'utilisation de ce service tiers.
6.6. Gains automatiques : l'éditeur peut attribuer des jetons à titre gracieux et discrétionnaire, sans que l'utilisateur n'ait à réaliser de mission (exemple : bonus d'inscription, bonus de fidélité). Ces attributions sont automatiques et ne constituent pas des droits acquis.

7. Parrainage
7.1. Conditions pour parrainer : pour être éligible au parrainage, l'utilisateur doit disposer d'un compte actif et ne pas s'être rendu coupable d'action frauduleuse ou de violation des présentes CGU.
7.2. Créditement de la récompense : la récompense de parrainage est créditée au parrain lorsque le filleul a complété sa première mission éligible depuis son inscription (les missions de connexion quotidienne sont exclues de ce déclencheur).
7.3. Règles : l'auto-parrainage est strictement interdit. Il n'existe pas de limite au nombre de filleuls qu'un utilisateur peut parrainer.
7.4. Fraude au parrainage : en cas de parrainage frauduleux (faux comptes, auto-parrainage, manipulation), l'éditeur se réserve le droit d'annuler les récompenses associées et de suspendre ou clôturer les comptes concernés.

8. Jetons virtuels
8.1. Nature : les jetons sont des unités internes au service, sans valeur monétaire. Ils ne peuvent pas être convertis en argent, cédés, vendus ou transférés à un tiers.
8.2. Utilisation : les jetons peuvent être échangés contre des bons d'achat ou des récompenses selon les modalités précisées dans l'Application.
8.3. Absence d'expiration : les jetons n'ont pas de date d'expiration tant que le compte est actif.
8.4. Clôture du compte : en cas de suppression ou de clôture du compte (à l'initiative de l'utilisateur ou de l'éditeur), tous les jetons sont définitivement perdus et ne peuvent être récupérés ni remboursés sous quelque forme que ce soit.
8.5. Modification : l'éditeur se réserve le droit de modifier les conditions d'utilisation ou de conversion des jetons pour des motifs légitimes (obligation légale, fraude, refonte du service), sous réserve d'en informer les utilisateurs.

9. Tirages au sort et opérations promotionnelles
9.1. Règlement : chaque tirage au sort ou opération promotionnelle fait l'objet d'un règlement spécifique, accessible directement depuis la page de l'opération dans l'Application. Ce règlement précise notamment les dates, modalités de participation, nature et valeur des lots, conditions d'éligibilité et procédure de tirage.
9.2. Éligibilité : les conditions d'éligibilité (dont l'éventuelle limite d'âge à 18 ans) sont indiquées dans le règlement de chaque opération.
9.3. En cas de contradiction entre les présentes CGU et le règlement d'une opération précise, le règlement de cette opération prévaut pour ladite opération uniquement.
9.4. L'éditeur peut modifier, suspendre ou arrêter une opération pour des motifs légitimes (fraude, erreur manifeste, obligation légale, force majeure).

10. Propriété intellectuelle
L'Application, sa charte graphique, ses textes, logos, bases de données et éléments logiciels sont protégés par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.

11. Contenus utilisateurs
Lorsque vous soumettez des contenus (preuves de mission, avatar, etc.), vous concédez à l'éditeur une licence non exclusive, mondiale et gratuite, pour les besoins stricts d'exploitation, de modération et de sécurité du service, sans préjudice de vos droits moraux lorsque la loi les reconnaît.

12. Responsabilité
L'Application est fournie « en l'état ». Dans les limites permises par la loi applicable, l'éditeur décline toute responsabilité pour les dommages indirects, perte de données, interruptions de service ou contenus tiers accessibles via des liens externes proposés dans le cadre des missions.

Rien dans les présentes CGU ne limite une garantie légale impérative (notamment vis-à-vis des consommateurs en droit français).

13. Force majeure
L'éditeur ne peut être tenu responsable d'un manquement à ses obligations résultant d'un événement imprévisible, irrésistible et extérieur à sa volonté, au sens de l'article 1218 du Code civil, incluant notamment : pannes majeures d'infrastructure, cyberattaques, catastrophes naturelles, décisions gouvernementales ou réglementaires, ou toute autre cause indépendante de sa volonté. En cas de force majeure, l'éditeur s'efforcera d'en informer les utilisateurs dans les meilleurs délais et de reprendre le service dès que possible.

14. Suspension et résiliation
L'éditeur peut suspendre ou clôturer un compte en cas de manquement aux présentes CGU, de fraude ou d'impératif légal. Vous pouvez cesser d'utiliser l'Application à tout moment. En cas de clôture du compte, tous les jetons sont définitivement perdus (voir article 8.4). Les dispositions relatives aux données personnelles et à la conservation de certaines traces peuvent survivre à la clôture du compte dans la limite de la loi.

15. Droit applicable et litiges
Sous réserve d'une disposition impérative contraire, les présentes CGU sont régies par le droit français. En cas de litige, et à défaut de résolution amiable, compétence attribuée aux tribunaux français compétents selon les règles de procédure, sous réserve des règles spécifiques aux consommateurs.

16. Contact
${e.contactEmail}

Siège : ${e.registeredAddress}

Références utiles (information générale, non contractuelle) :
• Code de la consommation (France) : https://www.legifrance.gouv.fr/
• Commission européenne — résolution des litiges en ligne (plateforme ODR) : https://ec.europa.eu/consumers/odr/
`;
}

export function buildTermsOfServiceEn(e: LegalEntityInfo): string {
  return `Terms of Service — ${e.tradeName}

Last updated: ${e.lastUpdatedEn}

1. Purpose and acceptance
These Terms govern access to and use of the ${e.tradeName} mobile application published by ${e.legalName}. By creating an account or using the App, you agree to these Terms and the related privacy policy.

We reserve the right to modify these Terms at any time. Changes take effect upon publication in the App. Continued use of the App after a new version of the Terms is published constitutes acceptance of the updated Terms.

2. Service overview
${e.tradeName} is a loyalty application that allows users to complete missions in order to earn virtual tokens, redeemable for vouchers or rewards. The service may include loyalty-style features such as missions, a virtual token wallet, lottery/contest-style mechanics, referral features and notifications. Features may evolve; we will endeavour to inform users of material changes. The service is primarily aimed at users residing in France.

3. User account
Certain features require an account. You agree to provide accurate information and to keep your authentication credentials confidential. Activity performed from your account is presumed to be yours, unless reasonably proven otherwise.

4. Eligibility, age and territory
4.1. Age: general use of the App is limited to users aged at least 15. Certain features — including promotional lottery-style mechanics or certain prizes — may be limited to adults aged 18 or over; any age requirement is shown on the relevant screen and in the rules of the operation. We reserve the right to request proof of age at any time.
4.2. Capacity: you represent that you have the required legal capacity or, if you are between 15 and 18, that you use the service with parental consent where the law requires it.
4.3. Territory: the service is currently intended for users in France; we may restrict certain operations technically or contractually.
4.4. We may refuse access or suspend an account if these rules are breached.

5. Acceptable use
You must not, in particular:
• impersonate others or create accounts fraudulently;
• create multiple accounts for the same user;
• attempt to bypass security, scrape data at scale, or abuse the App;
• publish unlawful, defamatory, hateful, violent, non-consensual sexual content, or content infringing third-party rights;
• use the App to spam or harass;
• simulate or falsify the completion of a mission by any means whatsoever (bots, scripts, manipulation, false proof, etc.).

For missions involving third-party services, you also comply with those services' terms.

6. Missions
6.1. Definition: a mission is an action defined by the publisher that the user is invited to complete in order to earn tokens. Missions may include: watching content (video or advertisement), performing an action external to the App (liking, commenting, following an account on a social network), or logging in to the App daily.
6.2. Duration: each mission has a clearly indicated start date and end date. Once the end date has passed, the mission can no longer be completed.
6.3. Token crediting: depending on the nature of the mission, tokens are credited either immediately upon validation or after verification by the publisher. The publisher reserves a reasonable timeframe to carry out this verification.
6.4. Non-compliance and withdrawal: if the publisher determines at any time that a mission was completed in a non-compliant manner (invalid proof, automated behaviour, fraud), the corresponding tokens may be cancelled and removed from the user's wallet without notice or compensation. In the event of a lottery win, all of the relevant user's missions may be subject to an in-depth audit.
6.5. Third-party service missions: for missions involving an action on a third-party service (social network, partner site), the publisher cannot be held responsible for the availability, changes, or terms of use of that third-party service.
6.6. Automatic rewards: the publisher may award tokens on a discretionary and gratuitous basis, without the user having to complete a mission (e.g., sign-up bonus, loyalty bonus). These awards are automatic and do not constitute vested rights.

7. Referral programme
7.1. Eligibility: to be eligible to refer others, a user must hold an active account and must not have engaged in any fraudulent activity or breach of these Terms.
7.2. Reward crediting: the referral reward is credited to the referrer once the referred user has completed their first eligible mission since signing up (daily log-in missions are excluded from this trigger).
7.3. Rules: self-referral is strictly prohibited. There is no limit to the number of people a user may refer.
7.4. Referral fraud: in the event of fraudulent referral (fake accounts, self-referral, manipulation), the publisher reserves the right to cancel the associated rewards and to suspend or close the accounts concerned.

8. Virtual tokens
8.1. Nature: tokens are internal service units with no monetary value. They cannot be converted to cash, transferred, sold, or assigned to a third party.
8.2. Use: tokens may be exchanged for vouchers or rewards according to the terms set out in the App.
8.3. No expiry: tokens do not expire as long as the account remains active.
8.4. Account closure: upon deletion or closure of an account (whether initiated by the user or the publisher), all tokens are permanently forfeited and cannot be recovered or refunded in any form whatsoever.
8.5. Changes: the publisher reserves the right to modify the conditions of use or conversion of tokens for legitimate reasons (legal obligation, fraud, service redesign), subject to informing users accordingly.

9. Prize draws and promotional operations
9.1. Rules: each prize draw or promotional operation is governed by specific rules, accessible directly from the operation page within the App. These rules specify in particular the dates, participation conditions, nature and value of prizes, eligibility requirements, and draw procedure.
9.2. Eligibility: eligibility conditions (including any age limit of 18 years) are set out in the rules of each operation.
9.3. In the event of a conflict between these Terms and the rules of a specific operation, the operation-specific rules prevail for that operation only.
9.4. We may change, suspend or stop an operation for legitimate reasons (fraud, manifest error, legal obligation, force majeure).

10. Intellectual property
The App, branding, text, logos, databases and software elements are protected by intellectual property laws. Any unauthorised reproduction is prohibited.

11. User content
When you submit content (mission proofs, avatar, etc.), you grant the publisher a non-exclusive, worldwide, royalty-free licence for the strict purposes of operating, moderating and securing the service, without prejudice to moral rights where recognised by law.

12. Liability
The App is provided "as is". To the fullest extent permitted by applicable law, the publisher disclaims liability for indirect damages, data loss, service interruptions, or third-party content accessed via external links provided as part of missions.

Nothing in these Terms limits mandatory legal consumer guarantees where applicable.

13. Force majeure
The publisher cannot be held liable for any failure to fulfil its obligations resulting from an unforeseeable, irresistible event beyond its control, including but not limited to: major infrastructure outages, cyberattacks, natural disasters, governmental or regulatory decisions, or any other cause beyond its reasonable control. In the event of force majeure, the publisher will endeavour to inform users as soon as possible and to restore the service at the earliest opportunity.

14. Suspension and termination
We may suspend or terminate an account for breach of these Terms, fraud, or legal requirements. You may stop using the App at any time. Upon account closure, all tokens are permanently forfeited (see section 8.4). Certain provisions on personal data and retention may survive account closure as required by law.

15. Governing law and disputes
Unless mandatory law provides otherwise, these Terms are governed by French law. Disputes shall be submitted to the competent courts in accordance with procedural rules, subject to any mandatory consumer protections.

16. Contact
${e.contactEmail}

Registered office: ${e.registeredAddress}

Helpful references (general information, not contractual):
• French consumer law portal (Legifrance): https://www.legifrance.gouv.fr/
• EU Online Dispute Resolution platform: https://ec.europa.eu/consumers/odr/
`;
}
