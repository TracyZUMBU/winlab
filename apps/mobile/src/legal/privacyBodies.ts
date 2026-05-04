import type { LegalEntityInfo } from "./entityInfo";

function dpoBlockFr(e: LegalEntityInfo): string {
  if (e.dpoEmail?.trim()) {
    return `Un délégué à la protection des données (DPO) est désigné : ${e.dpoEmail.trim()}.`;
  }
  return (
    "Aucun DPO n’est désigné : pour une structure de cette taille, la désignation d’un DPO n’est en principe pas obligatoire sous le seul RGPD, " +
    "sauf cas particuliers (voir fiches CNIL). " +
    "Pour exercer vos droits sur vos données personnelles ou pour toute question relative à leur traitement, vous contactez le responsable du traitement à l’adresse : " +
    `${e.contactEmail} (réponse dans des délais raisonnables).`
  );
}

function dpoBlockEn(e: LegalEntityInfo): string {
  if (e.dpoEmail?.trim()) {
    return `A data protection officer (DPO) has been appointed: ${e.dpoEmail.trim()}.`;
  }
  return (
    "No DPO has been appointed: for an organisation of this size, appointing a DPO is not generally mandatory under the GDPR alone, " +
    "unless specific criteria apply (see your supervisory authority’s guidance). " +
    "To exercise your rights or ask questions about your personal data, contact the data controller at: " +
    `${e.contactEmail}.`
  );
}

function siretLineFr(e: LegalEntityInfo): string {
  const s = e.siret?.trim();
  if (!s) return "";
  return `Numéro SIRET (identifiant d’entreprise, France) : ${s}.\n\n`;
}

function siretLineEn(e: LegalEntityInfo): string {
  const s = e.siret?.trim();
  if (!s) return "";
  return `Company registration number (if applicable): ${s}.\n\n`;
}

/** Politique de confidentialité (FR) — brouillon basé sur le RGPD (UE 2016/679). Faire valider par un juriste. */
export function buildPrivacyPolicyFr(e: LegalEntityInfo): string {
  return `Politique de confidentialité — ${e.tradeName}

Dernière mise à jour : ${e.lastUpdatedFr}

1. Introduction
La présente politique décrit comment ${e.legalName} (« nous », « l’éditeur ») traite les données personnelles des utilisateurs de l’application mobile ${e.tradeName} (« l’Application »), conformément au Règlement (UE) 2016/679 (« RGPD ») et à la loi française « Informatique et Libertés » modifiée. Textes de référence : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32016R0679 et https://www.cnil.fr/fr/reglement-europeen-protection-donnees.

Ce document est un modèle éditorial : il doit être adapté à vos traitements réels et relu par un conseil juridique avant diffusion définitive.

L’Application est proposée aux utilisateurs situés en France ; toute extension à d’autres pays fera l’objet d’une mise à jour de la présente politique.

2. Responsable du traitement
Le responsable du traitement est : ${e.legalName}, dont le siège est situé au :
${e.registeredAddress}

Contact données personnelles : ${e.contactEmail}

${siretLineFr(e)}${dpoBlockFr(e)}

3. Données collectées
Selon votre utilisation de l’Application, nous pouvons traiter notamment :
• Données d’authentification : adresse e-mail, identifiant de compte, jetons de session.
• Données de profil : pseudonyme, photo de profil si vous en choisissez une, codes de parrainage le cas échéant.
• Données d’usage et de fonctionnement : journaux techniques, identifiants d’appareil nécessaires aux notifications push, horodatages, interactions avec les contenus (missions, portefeuille, loteries, etc.).
• Contenus que vous soumettez dans le cadre des missions (preuves, commentaires, métadonnées associées), dans la limite prévue par le service.
• Données issues de tiers strictement nécessaires au service (ex. prestataires d’hébergement ou d’envoi de notifications), conformément à leurs politiques.

Nous ne vous demandons pas de données inutiles au regard des finalités ci-dessous.

4. Finalités et bases légales (résumé)
• Fourniture et sécurisation du compte, exécution des CGU : exécution du contrat (art. 6(1)(b) RGPD).
• Authentification par e-mail (OTP / liens magiques) : exécution du contrat ; intérêt légitime en matière de sécurité (art. 6(1)(f)).
• Gestion du portefeuille de jetons virtuels, participation aux mécanismes de type loterie/concours tels que décrits dans l’Application : exécution du contrat ; obligations légales le cas échéant selon votre modèle exact (à valider juridiquement).
• Notifications push (si vous y consentez ou si la base légale applicable le permet) : consentement (art. 6(1)(a)) et/ou intérêt légitime pour les messages non commerciaux liés au service, selon le paramétrage réel.
• Amélioration du service, mesure d’audience technique, correction d’erreurs, sécurité : intérêt légitime (art. 6(1)(f)), dans le respect de vos droits et des recommandations de l’autorité de contrôle (voir https://www.cnil.fr/).
• Obligations légales : respect d’injunctions légales (art. 6(1)(c)).

5. Destinataires et sous-traitants
Les données sont traitées par l’éditeur et, le cas échéant, par des prestataires agissant sur instruction (hébergement, base de données, envoi d’e-mails transactionnels, notifications push, outils de supervision technique). ${e.hostingSummary}

Nous ne vendons pas vos données personnelles.

6. Transferts hors Union européenne
Certains prestataires peuvent traiter des données en dehors de l’Espace économique européen. Le cas échéant, nous mettons en œuvre les garanties prévues par le RGPD (clauses contractuelles types de la Commission européenne, mesures complémentaires, etc.). Les informations détaillées figurent dans la documentation du prestataire concerné.

7. Durées de conservation (principes)
Nous conservons les données le temps nécessaire aux finalités poursuivies, puis les archivons, anonymisons ou supprimons selon des règles documentées en interne (durées liées au compte actif, obligations comptables/fiscales le cas échéant, prescriptions légales). Les comptes inactifs peuvent faire l’objet d’une politique d’effacement ou d’anonymisation décrite dans les CGU ou par notification.

8. Vos droits
Conformément au RGPD, vous disposez, sous conditions et exceptions légales, des droits d’accès, de rectification, d’effacement, de limitation du traitement, d’opposition, de portabilité (lorsque applicable), ainsi que du droit de retirer votre consentement lorsque le traitement en dépend.

Vous pouvez introduire une réclamation auprès de la CNIL : https://www.cnil.fr/fr/agir.

Les demandes s’exercent via : ${e.contactEmail}. Une preuve d’identité peut être exigée pour éviter la divulgation à un tiers.

9. Sécurité
Nous mettons en œuvre des mesures techniques et organisationnelles appropriées (chiffrement en transit lorsque pertinent, contrôle d’accès, journalisation interne, gestion des incidents). Aucun système n’est exempt de risque ; en cas de violation de données susceptible d’engendrer un risque pour vos droits, les notifications prévues par le RGPD pourront être effectuées.

10. Mineurs et public
L’utilisation générale de l’Application est réservée aux personnes âgées d’au moins 15 ans, conformément aux CGU. Certaines fonctionnalités (notamment des opérations promotionnelles de type loterie ou l’attribution de certains lots) peuvent être réservées aux majeurs de 18 ans ; le cas échéant, cela est indiqué dans l’Application et dans le règlement de l’opération concernée. Si vous estimez qu’un mineur utilise le service sans droit, écrivez à ${e.contactEmail}.

11. Modifications
Nous pouvons mettre à jour la présente politique pour refléter l’évolution du service ou des lois. La date de mise à jour en tête du document sera révisée ; une notification dans l’Application ou par e-mail peut être utilisée pour les changements substantiels.

12. Documents de référence (sources officielles — lecture réglementaire)
• RGPD (texte consolidé) : https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX%3A32016R0679
• CNIL — droits et obligations : https://www.cnil.fr/
`;
}

export function buildPrivacyPolicyEn(e: LegalEntityInfo): string {
  return `Privacy Policy — ${e.tradeName}

Last updated: ${e.lastUpdatedEn}

1. Introduction
This policy describes how ${e.legalName} (“we”, “the publisher”) processes personal data of users of the mobile application ${e.tradeName} (“the App”), in accordance with Regulation (EU) 2016/679 (“GDPR”) and applicable national law. Official GDPR text: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679

This document is a draft template: it must be aligned with your actual processing activities and reviewed by legal counsel before final publication.

The App is primarily offered to users located in France; expansion to other countries will be reflected in this policy.

2. Data controller
The controller is: ${e.legalName}, with its registered office at:
${e.registeredAddress}

Privacy contact: ${e.contactEmail}

${siretLineEn(e)}${dpoBlockEn(e)}

3. Data we may collect
Depending on how you use the App, we may process:
• Authentication data: email address, account identifier, session tokens.
• Profile data: username, profile photo if you choose one, referral codes where applicable.
• Usage and operations data: technical logs, device identifiers needed for push notifications, timestamps, interactions with content (missions, wallet, lotteries, etc.).
• Content you submit as part of missions (proofs, comments, related metadata), within the limits of the service.
• Data from third parties strictly necessary to operate the service (e.g. hosting or notification providers), in line with their policies.

We do not request data that is unnecessary for the purposes below.

4. Purposes and legal bases (summary)
• Providing and securing your account, performing the Terms: contract (Art. 6(1)(b) GDPR).
• Email authentication (OTP / magic links): contract; legitimate interests in security (Art. 6(1)(f)).
• Virtual token wallet and lottery/contest-style mechanics as described in the App: contract; legal obligations where applicable depending on your exact model (to be confirmed with counsel).
• Push notifications (where you consent or where another legal basis applies): consent (Art. 6(1)(a)) and/or legitimate interests for non-marketing service messages, depending on actual configuration.
• Service improvement, technical audience metrics, bug fixes, security: legitimate interests (Art. 6(1)(f)), respecting your rights and supervisory guidance.
• Legal obligations: compliance with legal requests (Art. 6(1)(c)).

5. Recipients and processors
Data is processed by the publisher and, where applicable, by processors instructed by us (hosting, database, transactional email, push notifications, technical monitoring). ${e.hostingSummary}

We do not sell your personal data.

6. Transfers outside the European Economic Area
Some providers may process data outside the EEA. Where required, we implement GDPR safeguards (EU Commission Standard Contractual Clauses, supplementary measures, etc.). See each provider’s documentation for details.

7. Retention (principles)
We keep data for as long as necessary for the purposes described, then archive, anonymise or delete it according to internal rules (active account lifecycle, accounting/tax obligations if any, statutory limitation periods). Inactive accounts may be erased or anonymised as described in the Terms or by notice.

8. Your rights
Subject to conditions and legal exceptions, you have rights of access, rectification, erasure, restriction, objection, data portability (where applicable), and the right to withdraw consent where processing is consent-based.

You may lodge a complaint with a supervisory authority in the EU/EEA.

Requests can be sent to: ${e.contactEmail}. Proof of identity may be required to prevent disclosure to third parties.

9. Security
We implement appropriate technical and organisational measures (encryption in transit where relevant, access controls, internal logging, incident handling). No system is risk-free; where a breach is likely to affect your rights, notifications required by the GDPR may be issued.

10. Children and audience
General use of the App is limited to users aged at least 15, as set out in the Terms. Certain features (including promotional lottery-style operations or certain prizes) may be limited to adults aged 18 or over; where applicable, this is stated in the App and in the rules of the relevant operation. If you believe a minor uses the service without a valid basis, contact ${e.contactEmail}.

11. Changes
We may update this policy to reflect service or legal changes. The “Last updated” date will be revised; an in-app notice or email may be used for material changes.

12. Official references
• GDPR (consolidated text): https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016R0679
`;
}
