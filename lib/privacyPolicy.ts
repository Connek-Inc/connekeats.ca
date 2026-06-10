// Política de privacidad trilingüe (PIPEDA + Loi 25 Québec + CASL).
// Generada con borrador + revisión Loi 25/FR. Es un TEMPLATE — validar con un
// abogado de privacidad de Québec antes de producción. Contacto: dev@connek.ca
export type Loc = "es" | "en" | "fr";
export type Tri = Record<Loc, string>;
export type PolicySection = { key: string; title: Tri; body: Tri };
export const PRIVACY: { updated: string; pageTitle: Tri; intro: Tri; banner: Tri; accept: Tri; link: Tri; sections: PolicySection[] } = {
  "updated": "2026-06-10",
  "pageTitle": {
    "es": "Política de privacidad",
    "en": "Privacy Policy",
    "fr": "Politique de confidentialité"
  },
  "intro": {
    "es": "En Connek Food (Connek Eats, connekeats.ca) protegemos los datos personales de las personas que utilizan nuestra plataforma de pedidos por código QR, punto de venta (POS) y CRM para restaurantes y bares en Canadá, incluido Québec. Esta política explica qué datos personales recopilamos, con qué finalidades los tratamos, cómo los protegemos y qué derechos tienes sobre ellos.\n\nTratamos los datos personales de conformidad con la Ley de Protección de Datos Personales y Documentos Electrónicos (PIPEDA, federal), la Ley 25 de Québec sobre la protección de los datos personales y la Ley Canadiense Antispam (CASL). Connek actúa como proveedor de la plataforma por cuenta de cada restaurante; cada restaurante es responsable de los datos personales de SUS clientes.",
    "en": "At Connek Food (Connek Eats, connekeats.ca) we protect the personal information of people who use our QR-code ordering, point-of-sale (POS) and CRM platform for restaurants and bars in Canada, including Québec. This policy explains what personal information we collect, the purposes for which we process it, how we protect it and what rights you have over it.\n\nWe handle personal information in accordance with the Personal Information Protection and Electronic Documents Act (PIPEDA, federal), Québec's Law 25 on the protection of personal information, and Canada's Anti-Spam Legislation (CASL). Connek acts as the platform provider on behalf of each restaurant; each restaurant is responsible for the personal information of ITS own customers.",
    "fr": "Chez Connek Food (Connek Eats, connekeats.ca), nous protégeons les renseignements personnels des personnes qui utilisent notre plateforme de commande par code QR, de point de vente (PDV) et de GRC destinée aux restaurants et aux bars au Canada, y compris au Québec. La présente politique explique quels renseignements personnels nous recueillons, à quelles fins nous les traitons, comment nous les protégeons et quels sont vos droits à leur égard.\n\nNous traitons les renseignements personnels conformément à la Loi sur la protection des renseignements personnels et les documents électroniques (LPRPDE, fédérale), à la Loi 25 du Québec sur la protection des renseignements personnels et à la Loi canadienne anti-pourriel (LCAP). Connek agit à titre de fournisseur de la plateforme pour le compte de chaque restaurant; chaque restaurant est responsable des renseignements personnels de SES propres clients."
  },
  "banner": {
    "es": "Usamos únicamente almacenamiento esencial (idioma, tema y sesión). Respetamos tu privacidad: no hacemos rastreo publicitario. Lee nuestra política de privacidad.",
    "en": "We use only essential storage (language, theme and session). We respect your privacy: no advertising tracking. Read our privacy policy.",
    "fr": "Nous utilisons uniquement du stockage essentiel (langue, thème et session). Nous respectons votre vie privée : aucun suivi publicitaire. Consultez notre politique de confidentialité."
  },
  "accept": {
    "es": "Entendido",
    "en": "Got it",
    "fr": "J'ai compris"
  },
  "link": {
    "es": "Leer la política de privacidad",
    "en": "Read the privacy policy",
    "fr": "Lire la politique de confidentialité"
  },
  "sections": [
    {
      "key": "officer",
      "title": {
        "es": "Responsable de la protección de los datos personales",
        "en": "Person in charge of the protection of personal information",
        "fr": "Responsable de la protection des renseignements personnels"
      },
      "body": {
        "es": "La persona responsable de la protección de los datos personales en Connek supervisa el cumplimiento de esta política y atiende tus solicitudes y preguntas.\n\nPuedes contactar a la Responsable de la protección de los datos personales en:\n\n- Correo: dev@connek.ca\n\nReparto de responsabilidades:\n\n- Cada restaurante que utiliza la plataforma es el responsable del tratamiento de los datos personales de SUS propios clientes y empleados, y determina con qué finalidades se usan.\n- Connek actúa como proveedor de la plataforma (encargado del tratamiento) que trata esos datos por cuenta del restaurante y siguiendo sus instrucciones.\n- Si tus datos figuran en el sistema de un restaurante concreto, ese restaurante es tu primer punto de contacto; aun así, puedes escribirnos a dev@connek.ca y te ayudaremos a dirigir tu solicitud.",
        "en": "Connek's person in charge of the protection of personal information oversees compliance with this policy and handles your requests and questions.\n\nYou can reach the person in charge of the protection of personal information at:\n\n- Email: dev@connek.ca\n\nDivision of responsibilities:\n\n- Each restaurant using the platform is the controller of the personal information of ITS own customers and employees, and determines the purposes for which it is used.\n- Connek acts as the platform provider (processor) that handles this information on behalf of, and on the instructions of, the restaurant.\n- If your information is held in a specific restaurant's system, that restaurant is your first point of contact; even so, you may write to us at dev@connek.ca and we will help route your request.",
        "fr": "La responsable de la protection des renseignements personnels chez Connek veille au respect de la présente politique et traite vos demandes et vos questions.\n\nVous pouvez joindre la responsable de la protection des renseignements personnels à :\n\n- Courriel : dev@connek.ca\n\nPartage des responsabilités :\n\n- Chaque restaurant qui utilise la plateforme est le responsable des renseignements personnels de SES propres clients et employés, et détermine les fins auxquelles ils sont utilisés.\n- Connek agit à titre de fournisseur de la plateforme (mandataire) qui traite ces renseignements pour le compte du restaurant et selon ses instructions.\n- Si vos renseignements se trouvent dans le système d'un restaurant en particulier, ce restaurant est votre premier point de contact; vous pouvez néanmoins nous écrire à dev@connek.ca et nous vous aiderons à acheminer votre demande."
      }
    },
    {
      "key": "data",
      "title": {
        "es": "Qué datos recopilamos",
        "en": "What information we collect",
        "fr": "Quels renseignements nous recueillons"
      },
      "body": {
        "es": "Recopilamos únicamente los datos personales necesarios para que el restaurante pueda operar y prestarte el servicio.\n\nDatos de clientes/comensales (CRM):\n\n- Nombre, número de teléfono y correo electrónico.\n- Fecha de cumpleaños, dirección, notas y etiquetas.\n- Estos datos pueden capturarse automáticamente a partir de los pedidos de entrega (delivery) realizados por teléfono.\n\nReseñas:\n\n- Calificación y comentario que decidas dejar sobre el restaurante.\n\nDatos de personal/empleados (Recursos Humanos):\n\n- Nombre, correo electrónico, teléfono, puesto, fecha de ingreso, salario, estado (activo/inactivo) y notas.\n\nCuentas del personal (staff):\n\n- Correo electrónico y credenciales de autenticación, gestionadas mediante Supabase Auth.\n\nPedidos por código QR:\n\n- Los pedidos en mesa mediante QR se realizan SIN inicio de sesión.\n- Se utiliza únicamente un token de mesa efímero (temporal) para asociar el pedido a la mesa; no recopilamos tu identidad para este flujo.",
        "en": "We collect only the personal information needed for the restaurant to operate and provide you with service.\n\nCustomer/diner information (CRM):\n\n- Name, phone number and email address.\n- Date of birth/birthday, address, notes and tags.\n- This information may be captured automatically from delivery orders placed by phone.\n\nReviews:\n\n- The rating and comment you choose to leave about the restaurant.\n\nStaff/employee information (Human Resources):\n\n- Name, email, phone, job title, start date, salary, status (active/inactive) and notes.\n\nStaff accounts:\n\n- Email address and authentication credentials, managed through Supabase Auth.\n\nQR-code orders:\n\n- Table orders via QR are placed WITHOUT a login.\n- Only an ephemeral (temporary) table token is used to link the order to the table; we do not collect your identity for this flow.",
        "fr": "Nous recueillons uniquement les renseignements personnels nécessaires pour que le restaurant puisse fonctionner et vous offrir son service.\n\nRenseignements sur la clientèle (GRC) :\n\n- Nom, numéro de téléphone et adresse courriel.\n- Date d'anniversaire, adresse, notes et étiquettes.\n- Ces renseignements peuvent être saisis automatiquement à partir des commandes de livraison passées par téléphone.\n\nÉvaluations :\n\n- La note et le commentaire que vous choisissez de laisser au sujet du restaurant.\n\nRenseignements sur le personnel (ressources humaines) :\n\n- Nom, courriel, téléphone, poste, date d'embauche, salaire, statut (actif/inactif) et notes.\n\nComptes du personnel :\n\n- Adresse courriel et identifiants d'authentification, gérés au moyen de Supabase Auth.\n\nCommandes par code QR :\n\n- Les commandes à table par code QR se font SANS connexion.\n- Seul un jeton de table éphémère (temporaire) est utilisé pour associer la commande à la table; nous ne recueillons pas votre identité pour ce parcours."
      }
    },
    {
      "key": "purposes",
      "title": {
        "es": "Para qué usamos tus datos",
        "en": "How we use your information",
        "fr": "À quelles fins nous utilisons vos renseignements"
      },
      "body": {
        "es": "Usamos los datos personales con finalidades determinadas, explícitas y legítimas:\n\n- Operar los pedidos (en mesa por QR, para llevar y a domicilio) y procesar el cobro correspondiente.\n- Gestionar la relación con la clientela mediante el CRM: historial de pedidos, preferencias, reseñas y comunicación operativa con el cliente.\n- Administrar al personal en el módulo de Recursos Humanos (gestión de empleados, puestos y registros).\n- Brindar soporte técnico y atender solicitudes, incidencias y consultas.\n- Cumplir con obligaciones legales, fiscales y contables aplicables.\n\nNo utilizamos tus datos personales para tomar decisiones basadas exclusivamente en un tratamiento automatizado. Si llegáramos a hacerlo, te lo informaríamos y podrías presentar observaciones, tal como se describe en la sección de derechos.\n\nNo vendemos tus datos personales. No los alquilamos ni los cedemos a terceros con fines publicitarios. Solo los compartimos con los proveedores de infraestructura estrictamente necesarios para prestar el servicio (ver la sección de transferencia fuera de Québec/Canadá).",
        "en": "We use personal information for specific, explicit and legitimate purposes:\n\n- To operate orders (dine-in via QR, takeout and delivery) and process the related payment.\n- To manage the customer relationship through the CRM: order history, preferences, reviews and operational communication with the customer.\n- To administer staff in the Human Resources module (employee, role and record management).\n- To provide technical support and handle requests, incidents and questions.\n- To comply with applicable legal, tax and accounting obligations.\n\nWe do not use your personal information to make decisions based exclusively on automated processing. Should we ever do so, we would inform you and you would be able to submit observations, as described in the rights section.\n\nWe do not sell your personal information. We do not rent or disclose it to third parties for advertising purposes. We share it only with the infrastructure providers strictly necessary to deliver the service (see the transfer outside Québec/Canada section).",
        "fr": "Nous utilisons les renseignements personnels à des fins déterminées, explicites et légitimes :\n\n- Pour exploiter les commandes (sur place par code QR, à emporter et en livraison) et traiter le paiement correspondant.\n- Pour gérer la relation avec la clientèle au moyen de la GRC : historique des commandes, préférences, évaluations et communications opérationnelles avec le client.\n- Pour administrer le personnel dans le module des ressources humaines (gestion des employés, des postes et des dossiers).\n- Pour offrir le soutien technique et traiter les demandes, les incidents et les questions.\n- Pour respecter les obligations légales, fiscales et comptables applicables.\n\nNous n'utilisons pas vos renseignements personnels pour prendre des décisions fondées exclusivement sur un traitement automatisé. Si nous devions le faire, nous vous en informerions et vous pourriez présenter vos observations, comme il est décrit à la section sur vos droits.\n\nNous ne vendons pas vos renseignements personnels. Nous ne les louons pas et ne les communiquons pas à des tiers à des fins publicitaires. Nous ne les partageons qu'avec les fournisseurs d'infrastructure strictement nécessaires à la prestation du service (voir la section sur le transfert hors Québec/Canada)."
      }
    },
    {
      "key": "consent",
      "title": {
        "es": "Consentimiento",
        "en": "Consent",
        "fr": "Consentement"
      },
      "body": {
        "es": "Recogemos y usamos tus datos personales con tu consentimiento, que solicitamos de forma clara y para finalidades específicas. Cuando proporcionas tus datos para realizar un pedido o crear una ficha en el CRM, consientes su uso para esas finalidades operativas.\n\nMarketing y comunicaciones comerciales electrónicas (CASL):\n\n- El envío de mensajes comerciales electrónicos (por ejemplo, promociones por correo o SMS) requiere tu consentimiento separado y de inclusión voluntaria (opt-in), distinto del consentimiento para operar tu pedido.\n- No te añadiremos a listas de marketing por el solo hecho de hacer un pedido. La exportación de contactos a CSV con fines de marketing solo se realiza respetando el consentimiento de cada persona.\n- Cada mensaje comercial identificará al remitente e incluirá un mecanismo de baja (unsubscribe) sencillo y gratuito.\n\nCómo retirar tu consentimiento:\n\n- Puedes retirar tu consentimiento en cualquier momento, sin coste, escribiendo a dev@connek.ca o usando el enlace de baja en los mensajes.\n- El retiro no afecta a la licitud del tratamiento previo, y puede haber datos que debamos conservar por obligaciones legales (ver la sección de conservación).",
        "en": "We collect and use your personal information with your consent, which we request clearly and for specific purposes. When you provide your information to place an order or create a CRM record, you consent to its use for those operational purposes.\n\nMarketing and commercial electronic messages (CASL):\n\n- Sending commercial electronic messages (for example, promotions by email or SMS) requires your separate, opt-in consent, distinct from the consent to operate your order.\n- We will not add you to marketing lists simply because you placed an order. Exporting contacts to CSV for marketing purposes is done only while respecting each person's consent.\n- Every commercial message will identify the sender and include a simple, free unsubscribe mechanism.\n\nHow to withdraw your consent:\n\n- You may withdraw your consent at any time, at no cost, by writing to dev@connek.ca or using the unsubscribe link in messages.\n- Withdrawal does not affect the lawfulness of prior processing, and some information may need to be retained for legal obligations (see the retention section).",
        "fr": "Nous recueillons et utilisons vos renseignements personnels avec votre consentement, que nous demandons de façon claire et à des fins précises. Lorsque vous fournissez vos renseignements pour passer une commande ou créer une fiche dans la GRC, vous consentez à leur utilisation à ces fins opérationnelles.\n\nMarketing et messages électroniques commerciaux (LCAP) :\n\n- L'envoi de messages électroniques commerciaux (par exemple, des promotions par courriel ou par message texte) exige votre consentement distinct et exprès (opt-in), différent du consentement nécessaire au traitement de votre commande.\n- Nous ne vous ajouterons pas à des listes de marketing du simple fait que vous avez passé une commande. L'exportation de contacts en format CSV à des fins de marketing se fait uniquement dans le respect du consentement de chaque personne.\n- Chaque message commercial identifiera l'expéditeur et comprendra un mécanisme de désabonnement simple et gratuit.\n\nComment retirer votre consentement :\n\n- Vous pouvez retirer votre consentement en tout temps, sans frais, en écrivant à dev@connek.ca ou en utilisant le lien de désabonnement dans les messages.\n- Le retrait n'a pas d'effet sur la licéité du traitement antérieur, et certains renseignements pourraient devoir être conservés en raison d'obligations légales (voir la section sur la conservation)."
      }
    },
    {
      "key": "rights",
      "title": {
        "es": "Tus derechos",
        "en": "Your rights",
        "fr": "Vos droits"
      },
      "body": {
        "es": "Conforme a PIPEDA y a la Ley 25 de Québec, tienes los siguientes derechos sobre tus datos personales:\n\n- Acceso: solicitar confirmación de qué datos tenemos sobre ti y obtener una copia.\n- Rectificación: corregir datos inexactos, incompletos o desactualizados.\n- Eliminación: pedir la supresión de tus datos (derecho al olvido), salvo cuando deban conservarse por obligación legal.\n- Portabilidad: recibir los datos informatizados que nos hayas proporcionado en un formato tecnológico estructurado y de uso corriente, o pedir que se transmitan a otra persona u organismo, cuando sea técnicamente posible.\n- Cese de la difusión y desindexación: pedir que dejemos de difundir tus datos personales o que se desindexe todo enlace que dé acceso a ellos cuando esa difusión te cause un perjuicio serio.\n- Decisiones automatizadas: ser informado cuando una decisión que te concierne se base exclusivamente en un tratamiento automatizado de tus datos, conocer los datos utilizados y las razones principales, y poder presentar observaciones para que una persona revise la decisión.\n- Retiro del consentimiento: retirar en cualquier momento el consentimiento que hayas otorgado.\n\nCómo ejercer tus derechos:\n\n- Escribe a la Responsable de la protección de los datos personales a dev@connek.ca.\n- Responderemos a tu solicitud en un plazo máximo de 30 días.\n- Podemos pedirte que verifiques tu identidad antes de tramitar la solicitud.\n- Si tus datos están bajo un restaurante específico, podemos remitir o coordinar la solicitud con dicho responsable.\n\nSi no estás conforme con nuestra respuesta, puedes presentar una queja ante la Commission d'accès à l'information du Québec (CAI) o ante la Oficina del Comisionado de Privacidad de Canadá (OPC).",
        "en": "Under PIPEDA and Québec's Law 25, you have the following rights over your personal information:\n\n- Access: request confirmation of what information we hold about you and obtain a copy.\n- Rectification: correct information that is inaccurate, incomplete or out of date.\n- Erasure: request deletion of your information (right to be forgotten), except where it must be retained by legal obligation.\n- Portability: receive the computerized information you provided to us in a structured, commonly used technological format, or ask that it be transmitted to another person or body, where technically feasible.\n- Cessation of dissemination and de-indexing: ask us to stop disseminating your personal information, or to de-index any hyperlink that gives access to it, where such dissemination causes you serious injury.\n- Automated decisions: be informed when a decision concerning you is based exclusively on automated processing of your information, learn the information used and the principal reasons for the decision, and submit observations so that a person can review it.\n- Withdrawal of consent: withdraw, at any time, the consent you have given.\n\nHow to exercise your rights:\n\n- Write to the person in charge of the protection of personal information at dev@connek.ca.\n- We will respond to your request within a maximum of 30 days.\n- We may ask you to verify your identity before processing the request.\n- If your information is held under a specific restaurant, we may forward or coordinate the request with that controller.\n\nIf you are not satisfied with our response, you may file a complaint with the Commission d'accès à l'information du Québec (CAI) or with the Office of the Privacy Commissioner of Canada (OPC).",
        "fr": "En vertu de la LPRPDE et de la Loi 25 du Québec, vous disposez des droits suivants à l'égard de vos renseignements personnels :\n\n- Accès : demander la confirmation des renseignements que nous détenons à votre sujet et en obtenir une copie.\n- Rectification : faire corriger des renseignements inexacts, incomplets ou non à jour.\n- Suppression : demander l'effacement de vos renseignements (droit à l'oubli), sauf lorsqu'ils doivent être conservés en raison d'une obligation légale.\n- Portabilité : recevoir les renseignements informatisés que vous nous avez fournis dans un format technologique structuré et couramment utilisé, ou demander qu'ils soient communiqués à une autre personne ou à un autre organisme, lorsque cela est techniquement possible.\n- Cessation de la diffusion et désindexation : demander que nous cessions de diffuser vos renseignements personnels ou que tout hyperlien donnant accès à ces renseignements soit désindexé lorsque cette diffusion vous cause un préjudice sérieux.\n- Décisions automatisées : être informé lorsqu'une décision vous concernant est fondée exclusivement sur un traitement automatisé de vos renseignements, connaître les renseignements utilisés et les principales raisons de la décision, et présenter vos observations afin qu'une personne puisse réviser cette décision.\n- Retrait du consentement : retirer en tout temps le consentement que vous avez accordé.\n\nComment exercer vos droits :\n\n- Écrivez à la responsable de la protection des renseignements personnels à dev@connek.ca.\n- Nous répondrons à votre demande dans un délai maximal de 30 jours.\n- Nous pourrions vous demander de vérifier votre identité avant de traiter la demande.\n- Si vos renseignements relèvent d'un restaurant en particulier, nous pourrions transmettre ou coordonner la demande avec ce responsable.\n\nSi vous n'êtes pas satisfait de notre réponse, vous pouvez déposer une plainte auprès de la Commission d'accès à l'information du Québec (CAI) ou auprès du Commissariat à la protection de la vie privée du Canada (CPVP)."
      }
    },
    {
      "key": "retention",
      "title": {
        "es": "Conservación y destrucción",
        "en": "Retention and destruction",
        "fr": "Conservation et destruction"
      },
      "body": {
        "es": "Conservamos los datos personales únicamente durante el tiempo necesario para cumplir las finalidades para las que se recopilaron.\n\n- Cuando los datos dejan de ser necesarios y no existe obligación legal de conservarlos, los destruimos o los anonimizamos de forma segura.\n- Determinada información (por ejemplo, registros de transacciones y comprobantes) puede conservarse durante un periodo de 6 años en cumplimiento de las obligaciones fiscales y contables aplicables en Canadá y Québec.\n- Los tokens de mesa utilizados para los pedidos por QR son efímeros y caducan poco después de finalizar la sesión de pedido.\n\nPasados los plazos de conservación, los datos se eliminan según un proceso de destrucción segura.",
        "en": "We retain personal information only for as long as necessary to fulfill the purposes for which it was collected.\n\n- When information is no longer necessary and there is no legal obligation to keep it, we securely destroy or anonymize it.\n- Certain information (for example, transaction records and receipts) may be retained for a period of 6 years to comply with tax and accounting obligations applicable in Canada and Québec.\n- The table tokens used for QR orders are ephemeral and expire shortly after the ordering session ends.\n\nOnce retention periods have elapsed, the information is deleted following a secure destruction process.",
        "fr": "Nous ne conservons les renseignements personnels que le temps nécessaire à la réalisation des fins pour lesquelles ils ont été recueillis.\n\n- Lorsque les renseignements ne sont plus nécessaires et qu'aucune obligation légale n'impose de les conserver, nous les détruisons ou les anonymisons de façon sécuritaire.\n- Certains renseignements (par exemple, les registres de transactions et les reçus) peuvent être conservés pendant une période de 6 ans afin de respecter les obligations fiscales et comptables applicables au Canada et au Québec.\n- Les jetons de table utilisés pour les commandes par code QR sont éphémères et expirent peu après la fin de la séance de commande.\n\nUne fois les délais de conservation écoulés, les renseignements sont supprimés selon un processus de destruction sécuritaire."
      }
    },
    {
      "key": "crossborder",
      "title": {
        "es": "Transferencia fuera de Québec/Canadá",
        "en": "Transfer outside Québec/Canada",
        "fr": "Transfert hors Québec/Canada"
      },
      "body": {
        "es": "Para prestar el servicio nos apoyamos en proveedores de infraestructura. La base de datos está alojada en Supabase y la aplicación se ejecuta en un servidor VPS de Hostinger.\n\n- Actualmente, parte del alojamiento de Supabase se encuentra fuera de Québec y de Canadá, por lo que tus datos personales pueden ser objeto de una comunicación (transferencia) fuera de Québec.\n- Conforme al artículo 17 de la Ley 25, antes de comunicar datos fuera de Québec realizamos una evaluación de los factores relativos a la vida privada para confirmar que recibirán una protección adecuada, y firmamos acuerdos contractuales con los proveedores que les imponen obligaciones de confidencialidad y seguridad.\n- Es nuestra intención migrar el alojamiento a una región canadiense (ca-central) para mantener los datos dentro de Canadá.\n\nPuedes solicitar más información sobre estas transferencias escribiendo a dev@connek.ca.",
        "en": "To provide the service we rely on infrastructure providers. The database is hosted on Supabase and the application runs on a Hostinger VPS server.\n\n- Currently, part of the Supabase hosting is located outside Québec and Canada, so your personal information may be subject to a communication (transfer) outside Québec.\n- In accordance with section 17 of Law 25, before communicating information outside Québec we carry out a privacy impact assessment to confirm that it will receive adequate protection, and we sign contractual agreements with providers that impose confidentiality and security obligations on them.\n- It is our intention to migrate hosting to a Canadian region (ca-central) in order to keep data within Canada.\n\nYou may request more information about these transfers by writing to dev@connek.ca.",
        "fr": "Pour offrir le service, nous faisons appel à des fournisseurs d'infrastructure. La base de données est hébergée chez Supabase et l'application s'exécute sur un serveur VPS de Hostinger.\n\n- À l'heure actuelle, une partie de l'hébergement Supabase se trouve à l'extérieur du Québec et du Canada; vos renseignements personnels peuvent donc faire l'objet d'une communication (transfert) hors Québec.\n- Conformément à l'article 17 de la Loi 25, avant de communiquer des renseignements à l'extérieur du Québec, nous réalisons une évaluation des facteurs relatifs à la vie privée afin de confirmer qu'ils bénéficieront d'une protection adéquate, et nous concluons des ententes contractuelles avec les fournisseurs leur imposant des obligations de confidentialité et de sécurité.\n- Nous avons l'intention de migrer l'hébergement vers une région canadienne (ca-central) afin de conserver les données au Canada.\n\nVous pouvez demander plus de renseignements sur ces transferts en écrivant à dev@connek.ca."
      }
    },
    {
      "key": "cookies",
      "title": {
        "es": "Cookies y almacenamiento local",
        "en": "Cookies and local storage",
        "fr": "Témoins et stockage local"
      },
      "body": {
        "es": "Utilizamos únicamente almacenamiento esencial y funcional para que la aplicación funcione correctamente.\n\n- Preferencia de idioma.\n- Preferencia de tema (por ejemplo, claro/oscuro).\n- Sesión de inicio de sesión del personal (staff).\n\nNo utilizamos cookies ni tecnologías de rastreo publicitario, ni perfiles publicitarios, ni rastreo entre sitios. Aplicamos el principio de privacidad por defecto: la configuración más protectora de tu privacidad se aplica sin que tengas que activarla. Como no usamos almacenamiento no esencial, no es necesario un consentimiento de cookies más allá del aviso informativo de la aplicación.",
        "en": "We use only essential and functional storage so that the application works correctly.\n\n- Language preference.\n- Theme preference (for example, light/dark).\n- Staff login session.\n\nWe do not use advertising cookies or tracking technologies, advertising profiles, or cross-site tracking. We apply privacy by default: the settings that best protect your privacy apply without you having to enable them. Because we do not use non-essential storage, no cookie consent is required beyond the application's informational notice.",
        "fr": "Nous utilisons uniquement du stockage essentiel et fonctionnel afin que l'application fonctionne correctement.\n\n- Préférence de langue.\n- Préférence de thème (par exemple, clair/sombre).\n- Session de connexion du personnel.\n\nNous n'utilisons pas de témoins ni de technologies de suivi publicitaire, ni de profils publicitaires, ni de suivi intersites. Nous appliquons le principe de la confidentialité par défaut : les paramètres les plus protecteurs de votre vie privée s'appliquent sans que vous ayez à les activer. Comme nous n'utilisons pas de stockage non essentiel, aucun consentement aux témoins n'est requis au-delà de l'avis informatif de l'application."
      }
    },
    {
      "key": "security",
      "title": {
        "es": "Seguridad",
        "en": "Security",
        "fr": "Sécurité"
      },
      "body": {
        "es": "Aplicamos medidas de seguridad razonables, técnicas y organizativas, para proteger los datos personales frente al acceso, uso o divulgación no autorizados.\n\n- Cifrado de los datos en tránsito (conexiones HTTPS/TLS).\n- Control de acceso basado en roles, de modo que cada persona del personal solo accede a la información necesaria para su función.\n- Autenticación de las cuentas del personal mediante Supabase Auth.\n\nNingún sistema es infalible, pero trabajamos para mantener y mejorar continuamente estas protecciones.",
        "en": "We apply reasonable technical and organizational security measures to protect personal information against unauthorized access, use or disclosure.\n\n- Encryption of data in transit (HTTPS/TLS connections).\n- Role-based access control, so that each staff member only accesses the information needed for their function.\n- Authentication of staff accounts through Supabase Auth.\n\nNo system is infallible, but we work to maintain and continuously improve these protections.",
        "fr": "Nous appliquons des mesures de sécurité raisonnables, techniques et organisationnelles, afin de protéger les renseignements personnels contre l'accès, l'utilisation ou la communication non autorisés.\n\n- Chiffrement des données en transit (connexions HTTPS/TLS).\n- Contrôle d'accès fondé sur les rôles, de sorte que chaque membre du personnel n'accède qu'aux renseignements nécessaires à sa fonction.\n- Authentification des comptes du personnel au moyen de Supabase Auth.\n\nAucun système n'est infaillible, mais nous nous efforçons de maintenir et d'améliorer continuellement ces protections."
      }
    },
    {
      "key": "breach",
      "title": {
        "es": "Incidentes de confidencialidad",
        "en": "Confidentiality incidents",
        "fr": "Incidents de confidentialité"
      },
      "body": {
        "es": "Un incidente de confidencialidad es el acceso, uso, comunicación o pérdida no autorizados de datos personales.\n\n- Cuando se produce un incidente, evaluamos sin demora el riesgo de perjuicio serio que podría causar a las personas afectadas.\n- Si existe riesgo de perjuicio serio, lo notificamos con prontitud a la autoridad competente (la Commission d'accès à l'information du Québec — CAI, y/o la Oficina del Comisionado de Privacidad de Canadá — OPC) y a las personas afectadas.\n- Adoptamos medidas razonables para reducir el riesgo y evitar que se repitan incidentes similares.\n- Mantenemos un registro de los incidentes de confidencialidad, conforme a la Ley 25.\n\nSi sospechas de un incidente que afecte a tus datos, escríbenos a dev@connek.ca.",
        "en": "A confidentiality incident is the unauthorized access to, use, communication or loss of personal information.\n\n- When an incident occurs, we promptly assess the risk of serious injury (harm) it could cause to the individuals concerned.\n- If there is a risk of serious injury, we promptly notify the competent authority (the Commission d'accès à l'information du Québec — CAI, and/or the Office of the Privacy Commissioner of Canada — OPC) and the affected individuals.\n- We take reasonable measures to reduce the risk and prevent similar incidents from recurring.\n- We maintain a register of confidentiality incidents, in accordance with Law 25.\n\nIf you suspect an incident affecting your information, write to us at dev@connek.ca.",
        "fr": "Un incident de confidentialité est l'accès, l'utilisation ou la communication non autorisés de renseignements personnels, ou encore leur perte.\n\n- Lorsqu'un incident survient, nous évaluons sans délai le risque qu'un préjudice sérieux soit causé aux personnes concernées.\n- S'il existe un risque qu'un préjudice sérieux soit causé, nous le signalons promptement à l'autorité compétente (la Commission d'accès à l'information du Québec — CAI, ou le Commissariat à la protection de la vie privée du Canada — CPVP) ainsi qu'aux personnes concernées.\n- Nous prenons des mesures raisonnables pour réduire le risque et éviter que des incidents semblables ne se reproduisent.\n- Nous tenons un registre des incidents de confidentialité, conformément à la Loi 25.\n\nSi vous soupçonnez un incident touchant vos renseignements, écrivez-nous à dev@connek.ca."
      }
    },
    {
      "key": "children",
      "title": {
        "es": "Menores de edad",
        "en": "Minors",
        "fr": "Mineurs"
      },
      "body": {
        "es": "Nuestro servicio está dirigido a restaurantes, bares y a su clientela y personal, no a menores de edad. No recopilamos de forma consciente datos personales de menores. Si crees que un menor nos ha proporcionado datos personales sin la autorización correspondiente, escríbenos a dev@connek.ca y tomaremos las medidas razonables para eliminarlos.",
        "en": "Our service is aimed at restaurants, bars and their customers and staff, not at minors. We do not knowingly collect personal information from minors. If you believe a minor has provided us with personal information without the appropriate authorization, write to us at dev@connek.ca and we will take reasonable steps to delete it.",
        "fr": "Notre service s'adresse aux restaurants, aux bars ainsi qu'à leur clientèle et à leur personnel, et non aux mineurs. Nous ne recueillons pas sciemment de renseignements personnels auprès de mineurs. Si vous croyez qu'un mineur nous a fourni des renseignements personnels sans l'autorisation appropriée, écrivez-nous à dev@connek.ca et nous prendrons les mesures raisonnables pour les supprimer."
      }
    },
    {
      "key": "changes",
      "title": {
        "es": "Cambios a esta política",
        "en": "Changes to this policy",
        "fr": "Modifications à la présente politique"
      },
      "body": {
        "es": "Podemos actualizar esta política de privacidad para reflejar cambios en nuestras prácticas, en la tecnología o en la legislación aplicable.\n\n- La fecha de vigencia se indica al pie de esta política.\n- Cuando realicemos cambios materiales, te lo avisaremos por medios razonables (por ejemplo, mediante un aviso en la aplicación o por correo electrónico) antes de que entren en vigor.\n\nFecha de vigencia: 10 de junio de 2026.",
        "en": "We may update this privacy policy to reflect changes in our practices, in technology or in applicable law.\n\n- The effective date is shown at the bottom of this policy.\n- When we make material changes, we will notify you by reasonable means (for example, through an in-app notice or by email) before they take effect.\n\nEffective date: June 10, 2026.",
        "fr": "Nous pouvons mettre à jour la présente politique de confidentialité afin de refléter les changements apportés à nos pratiques, à la technologie ou à la législation applicable.\n\n- La date d'entrée en vigueur figure au bas de la présente politique.\n- Lorsque nous apportons des modifications importantes, nous vous en aviserons par des moyens raisonnables (par exemple, au moyen d'un avis dans l'application ou par courriel) avant leur entrée en vigueur.\n\nDate d'entrée en vigueur : 10 juin 2026."
      }
    }
  ]
};
