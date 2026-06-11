// Términos de servicio trilingües (B2B SaaS + B2C diner) + disclosure de contrato
// a distancia (P-40.1). Generado con borrador + revisión. TEMPLATE — validar con
// un abogado antes de producción. Contacto: dev@connek.ca
export type Loc = "es" | "en" | "fr";
export type Tri = Record<Loc, string>;
export type TosSection = { key: string; title: Tri; body: Tri };
export const TERMS: { updated: string; pageTitle: Tri; intro: Tri; link: Tri; disclosure: Tri; sections: TosSection[] } = {
  "updated": "2026-06-10",
  "pageTitle": {
    "es": "Términos de servicio",
    "en": "Terms of Service",
    "fr": "Conditions d'utilisation"
  },
  "intro": {
    "es": "Bienvenido a Connek Food (también llamado «Connek Eats»). Estos Términos de servicio rigen el uso de nuestra plataforma de pedidos por código QR, punto de venta (POS) y gestión de clientes (CRM), tanto para los restaurantes y bares que la utilizan («comerciantes») como para los comensales que realizan pedidos. Al usar la plataforma o realizar un pedido, aceptas estos términos. El tratamiento de datos personales se describe en nuestra Política de privacidad, disponible por separado. Para cualquier pregunta, escríbenos a dev@connek.ca.",
    "en": "Welcome to Connek Food (also called \"Connek Eats\"). These Terms of Service govern your use of our QR-code ordering, point-of-sale (POS) and customer-management (CRM) platform, both for the restaurants and bars that use it (\"merchants\") and for the diners who place orders. By using the platform or placing an order, you accept these terms. The handling of personal data is described in our separate Privacy Policy. For any questions, write to us at dev@connek.ca.",
    "fr": "Bienvenue chez Connek Food (aussi appelé « Connek Eats »). Les présentes Conditions d'utilisation régissent votre utilisation de notre plateforme de commande par code QR, de point de vente (PDV) et de gestion de la clientèle (CRM), tant pour les restaurants et les bars qui s'en servent (« commerçants ») que pour les clients qui passent une commande. En utilisant la plateforme ou en passant une commande, vous acceptez les présentes conditions. Le traitement des renseignements personnels est décrit dans notre Politique de confidentialité, fournie séparément. Pour toute question, écrivez-nous à dev@connek.ca."
  },
  "link": {
    "es": "Términos de servicio",
    "en": "Terms of Service",
    "fr": "Conditions d'utilisation"
  },
  "disclosure": {
    "es": "Antes de confirmar tu pedido: Estás comprando a [Nombre del restaurante], el comercio que prepara y vende estos productos. El total a pagar es de [monto] CAD, impuestos GST/TPS y QST/TVQ incluidos. Connek solo provee la tecnología del pedido. Una vez que el restaurante empieza a preparar tu pedido, no se realizan reembolsos, salvo error del restaurante. El alcohol no es reembolsable. Al confirmar, aceptas estas condiciones y los Términos de servicio.",
    "en": "Before confirming your order: You are buying from [Restaurant name], the business that prepares and sells these items. The total to pay is [amount] CAD, including GST and QST taxes. Connek only provides the ordering technology. Once the restaurant starts preparing your order, no refunds are issued, except for a restaurant error. Alcohol is non-refundable. By confirming, you accept these conditions and the Terms of Service.",
    "fr": "Avant de confirmer votre commande : Vous achetez auprès de [Nom du restaurant], le commerce qui prépare et vend ces articles. Le total à payer est de [montant] CAD, taxes TPS et TVQ comprises. Connek ne fournit que la technologie de commande. Une fois que le restaurant commence à préparer votre commande, aucun remboursement n'est accordé, sauf en cas d'erreur du restaurant. L'alcool n'est pas remboursable. En confirmant, vous acceptez les présentes conditions ainsi que les Conditions d'utilisation."
  },
  "sections": [
    {
      "key": "acceptance",
      "title": {
        "es": "Aceptación de los términos",
        "en": "Acceptance of the terms",
        "fr": "Acceptation des conditions"
      },
      "body": {
        "es": "Al acceder a la plataforma Connek, escanear un código QR, navegar por un menú digital o realizar un pedido, confirmas que has leído, entendido y aceptado estos Términos de servicio en su totalidad.\n\nSi no estás de acuerdo con estos términos, no debes usar la plataforma ni realizar pedidos a través de ella.\n\n- Si usas la plataforma como comensal, aceptas las secciones aplicables a los pedidos y al pago.\n- Si usas la plataforma como comerciante (restaurante o bar), aceptas además los Términos para el comerciante descritos más abajo.\n- Si aceptas estos términos en nombre de una empresa, declaras tener autoridad para obligar a esa empresa.",
        "en": "By accessing the Connek platform, scanning a QR code, browsing a digital menu or placing an order, you confirm that you have read, understood and accepted these Terms of Service in full.\n\nIf you do not agree with these terms, you must not use the platform or place orders through it.\n\n- If you use the platform as a diner, you accept the sections that apply to ordering and payment.\n- If you use the platform as a merchant (restaurant or bar), you also accept the Merchant Terms set out below.\n- If you accept these terms on behalf of a business, you represent that you have authority to bind that business.",
        "fr": "En accédant à la plateforme Connek, en scannant un code QR, en consultant un menu numérique ou en passant une commande, vous confirmez avoir lu, compris et accepté l'intégralité des présentes Conditions d'utilisation.\n\nSi vous n'êtes pas d'accord avec ces conditions, vous ne devez pas utiliser la plateforme ni y passer de commande.\n\n- Si vous utilisez la plateforme à titre de client, vous acceptez les sections qui s'appliquent à la commande et au paiement.\n- Si vous utilisez la plateforme à titre de commerçant (restaurant ou bar), vous acceptez en outre les Conditions du commerçant énoncées plus bas.\n- Si vous acceptez ces conditions au nom d'une entreprise, vous déclarez avoir le pouvoir de lier cette entreprise."
      }
    },
    {
      "key": "service",
      "title": {
        "es": "Descripción del servicio",
        "en": "Description of the service",
        "fr": "Description du service"
      },
      "body": {
        "es": "Connek es un proveedor de software. Ofrecemos una plataforma tecnológica que permite a los restaurantes y bares mostrar su menú, recibir pedidos por código QR, gestionar su punto de venta (POS) y administrar la relación con sus clientes (CRM).\n\nConnek no prepara, cocina, vende ni sirve alimentos ni bebidas. Cada restaurante o bar es el único responsable de:\n\n- La comida, las bebidas y su calidad, seguridad e higiene.\n- Los precios, las descripciones del menú, los alérgenos y la disponibilidad de los productos.\n- La venta y el servicio de alcohol, incluida la verificación de la edad legal.\n- El servicio al cliente, los tiempos de preparación y la entrega o el servicio en mesa.\n\nEl contrato de compraventa de los alimentos y bebidas se celebra directamente entre el comensal y el restaurante. Connek no es parte de ese contrato; únicamente facilita la herramienta tecnológica que permite realizar el pedido.",
        "en": "Connek is a software provider. We offer a technology platform that lets restaurants and bars display their menu, receive QR-code orders, run their point of sale (POS) and manage their customer relationships (CRM).\n\nConnek does not prepare, cook, sell or serve any food or drink. Each restaurant or bar is solely responsible for:\n\n- The food, the drinks and their quality, safety and hygiene.\n- Prices, menu descriptions, allergens and product availability.\n- The sale and service of alcohol, including verifying legal age.\n- Customer service, preparation times and delivery or table service.\n\nThe contract of sale for food and drink is formed directly between the diner and the restaurant. Connek is not a party to that contract; it merely provides the technology tool that makes the order possible.",
        "fr": "Connek est un fournisseur de logiciel. Nous offrons une plateforme technologique qui permet aux restaurants et aux bars d'afficher leur menu, de recevoir des commandes par code QR, de gérer leur point de vente (PDV) et d'administrer leur relation avec la clientèle (CRM).\n\nConnek ne prépare, ne cuisine, ne vend ni ne sert aucun aliment ou boisson. Chaque restaurant ou bar est seul responsable :\n\n- des aliments, des boissons ainsi que de leur qualité, de leur salubrité et de leur hygiène;\n- des prix, des descriptions du menu, des allergènes et de la disponibilité des produits;\n- de la vente et du service d'alcool, y compris la vérification de l'âge légal;\n- du service à la clientèle, des délais de préparation et de la livraison ou du service à la table.\n\nLe contrat de vente des aliments et des boissons est conclu directement entre le client et le restaurant. Connek n'est pas partie à ce contrat; elle ne fait que fournir l'outil technologique qui rend la commande possible."
      }
    },
    {
      "key": "orders",
      "title": {
        "es": "Pedidos y pagos",
        "en": "Orders and payments",
        "fr": "Commandes et paiements"
      },
      "body": {
        "es": "Cuando realizas un pedido por código QR, celebras un contrato de compra directamente con el restaurante o bar, no con Connek.\n\n- El precio que pagas es el precio mostrado en el menú digital, más los impuestos aplicables (GST/TPS y QST/TVQ en Québec) y cualquier cargo, propina o tarifa indicados antes de confirmar.\n- El total con impuestos se muestra claramente antes de que confirmes el pedido.\n- Los pagos se procesan mediante los métodos de pago disponibles en la plataforma (por ejemplo, tarjeta de crédito o débito, u otros métodos habilitados por el restaurante).\n- El restaurante confirma, acepta y prepara el pedido. Connek no garantiza que un restaurante acepte un pedido determinado.\n\nUn pedido se considera firme una vez que lo confirmas y el restaurante lo acepta. Es tu responsabilidad revisar el pedido y la información de pago antes de confirmar.",
        "en": "When you place an order via QR code, you enter into a purchase contract directly with the restaurant or bar, not with Connek.\n\n- The price you pay is the price shown on the digital menu, plus applicable taxes (GST in Québec, the federal sales tax, and QST, the Québec sales tax) and any charges, tips or fees shown before you confirm.\n- The total with taxes is shown clearly before you confirm the order.\n- Payments are processed through the payment methods available on the platform (for example, credit or debit card, or other methods enabled by the restaurant).\n- The restaurant confirms, accepts and prepares the order. Connek does not guarantee that a restaurant will accept any given order.\n\nAn order is firm once you confirm it and the restaurant accepts it. It is your responsibility to review the order and the payment information before confirming.",
        "fr": "Lorsque vous passez une commande par code QR, vous concluez un contrat d'achat directement avec le restaurant ou le bar, et non avec Connek.\n\n- Le prix que vous payez est celui affiché au menu numérique, plus les taxes applicables (TPS, la taxe fédérale, et TVQ, la taxe de vente du Québec) ainsi que tout frais, pourboire ou supplément indiqué avant la confirmation.\n- Le total, taxes comprises, est affiché clairement avant que vous confirmiez la commande.\n- Les paiements sont traités au moyen des modes de paiement offerts sur la plateforme (par exemple, carte de crédit ou de débit, ou autres modes activés par le restaurant).\n- Le restaurant confirme, accepte et prépare la commande. Connek ne garantit pas qu'un restaurant acceptera une commande donnée.\n\nUne commande est ferme une fois que vous l'avez confirmée et que le restaurant l'a acceptée. Il vous revient de vérifier la commande et les renseignements de paiement avant de confirmer."
      }
    },
    {
      "key": "cancellation",
      "title": {
        "es": "Cancelación y reembolsos",
        "en": "Cancellation and refunds",
        "fr": "Annulation et remboursements"
      },
      "body": {
        "es": "Como el restaurante comienza a preparar tu pedido poco después de confirmarlo, las posibilidades de cancelar son limitadas.\n\n- Una vez que la comida o la bebida ha empezado a prepararse, normalmente no hay derecho a reembolso, salvo en caso de error del restaurante (por ejemplo, un producto incorrecto, faltante o en mal estado).\n- Las bebidas alcohólicas no son reembolsables una vez servidas o preparadas.\n- Cualquier queja, solicitud de reembolso o reclamación sobre el pedido debe dirigirse directamente al restaurante, ya que es el vendedor y responsable del servicio.\n- Connek puede ayudar a transmitir una incidencia técnica relacionada con la plataforma, pero no decide ni gestiona los reembolsos del restaurante.\n\nNada en esta sección limita los derechos que la ley de protección al consumidor de Québec pueda otorgarte.",
        "en": "Because the restaurant begins preparing your order shortly after you confirm it, the ability to cancel is limited.\n\n- Once the food or drink has started being prepared, there is normally no right to a refund, except in the case of a restaurant error (for example, a wrong, missing or spoiled item).\n- Alcoholic beverages are non-refundable once served or prepared.\n- Any complaint, refund request or claim about the order must be addressed directly to the restaurant, as it is the seller and is responsible for the service.\n- Connek can help relay a technical issue related to the platform, but it does not decide on or handle the restaurant's refunds.\n\nNothing in this section limits the rights that Québec consumer protection law may grant you.",
        "fr": "Comme le restaurant commence à préparer votre commande peu après que vous l'avez confirmée, les possibilités d'annulation sont limitées.\n\n- Une fois que la préparation de l'aliment ou de la boisson a commencé, il n'y a normalement aucun droit au remboursement, sauf en cas d'erreur du restaurant (par exemple, un article erroné, manquant ou avarié).\n- Les boissons alcoolisées ne sont pas remboursables une fois servies ou préparées.\n- Toute plainte, demande de remboursement ou réclamation concernant la commande doit être adressée directement au restaurant, puisqu'il est le vendeur et qu'il est responsable du service.\n- Connek peut aider à transmettre un problème technique lié à la plateforme, mais elle ne décide pas des remboursements du restaurant et ne les gère pas.\n\nAucune disposition de la présente section ne limite les droits que la Loi sur la protection du consommateur du Québec peut vous accorder."
      }
    },
    {
      "key": "conduct",
      "title": {
        "es": "Uso aceptable",
        "en": "Acceptable use",
        "fr": "Utilisation acceptable"
      },
      "body": {
        "es": "Te comprometes a usar la plataforma Connek de buena fe y conforme a la ley.\n\nNo está permitido:\n\n- Usar la plataforma para cometer fraude, suplantar a otra persona o realizar pagos no autorizados.\n- Interferir con el funcionamiento de la plataforma, intentar acceder sin autorización a sistemas o datos, o introducir software malicioso.\n- Hacer pedidos falsos, abusivos o de mala fe, o acosar al personal del restaurante.\n- Reproducir, revender o explotar la plataforma o su contenido sin autorización.\n\nRespecto al alcohol, la edad mínima legal y la verificación de la edad son responsabilidad del restaurante, que puede rechazar o cancelar la venta de alcohol conforme a la ley. Debes ser mayor de edad para comprar o consumir alcohol.\n\nConnek puede suspender o restringir el acceso a quien incumpla estas reglas.",
        "en": "You agree to use the Connek platform in good faith and in accordance with the law.\n\nThe following is not allowed:\n\n- Using the platform to commit fraud, impersonate another person or make unauthorized payments.\n- Interfering with the operation of the platform, attempting to gain unauthorized access to systems or data, or introducing malicious software.\n- Placing false, abusive or bad-faith orders, or harassing restaurant staff.\n- Reproducing, reselling or exploiting the platform or its content without authorization.\n\nRegarding alcohol, the minimum legal age and age verification are the responsibility of the restaurant, which may refuse or cancel an alcohol sale in accordance with the law. You must be of legal age to buy or consume alcohol.\n\nConnek may suspend or restrict access for anyone who breaches these rules.",
        "fr": "Vous vous engagez à utiliser la plateforme Connek de bonne foi et conformément à la loi.\n\nIl est interdit :\n\n- d'utiliser la plateforme pour commettre une fraude, usurper l'identité d'une autre personne ou effectuer des paiements non autorisés;\n- de nuire au fonctionnement de la plateforme, de tenter d'accéder sans autorisation à des systèmes ou à des données, ou d'introduire un logiciel malveillant;\n- de passer des commandes fausses, abusives ou de mauvaise foi, ou de harceler le personnel du restaurant;\n- de reproduire, de revendre ou d'exploiter la plateforme ou son contenu sans autorisation.\n\nEn ce qui concerne l'alcool, l'âge légal minimal et la vérification de l'âge relèvent de la responsabilité du restaurant, qui peut refuser ou annuler une vente d'alcool conformément à la loi. Vous devez avoir l'âge légal pour acheter ou consommer de l'alcool.\n\nConnek peut suspendre ou restreindre l'accès de quiconque enfreint ces règles."
      }
    },
    {
      "key": "liability",
      "title": {
        "es": "Limitación de responsabilidad",
        "en": "Limitation of liability",
        "fr": "Limitation de responsabilité"
      },
      "body": {
        "es": "Connek proporciona la plataforma «tal cual» y «según disponibilidad». No garantizamos que el servicio sea ininterrumpido o esté libre de errores en todo momento.\n\nEn la medida permitida por la ley:\n\n- La responsabilidad total de Connek frente a un comerciante se limita al monto que ese comerciante haya pagado a Connek por el uso de la plataforma durante los doce (12) meses anteriores al hecho que origina la reclamación.\n- Connek no es responsable de la comida, las bebidas, los precios, el alcohol, el servicio ni del cumplimiento legal del restaurante; de ello responde el propio restaurante.\n\nEsta limitación NO se aplica y NO excluye la responsabilidad por:\n\n- Negligencia grave o falta intencional de Connek.\n- Daños derivados de una brecha de seguridad de datos imputable a Connek.\n- Infracción de derechos de propiedad intelectual.\n- Cualquier responsabilidad que no pueda excluirse o limitarse según la ley aplicable, incluida la ley de protección al consumidor de Québec.",
        "en": "Connek provides the platform \"as is\" and \"as available\". We do not guarantee that the service will be uninterrupted or error-free at all times.\n\nTo the extent permitted by law:\n\n- Connek's total liability to a merchant is limited to the amount that merchant has paid Connek for use of the platform during the twelve (12) months preceding the event giving rise to the claim.\n- Connek is not responsible for the food, drinks, prices, alcohol, service or legal compliance of the restaurant; the restaurant itself is responsible for these.\n\nThis limitation does NOT apply and does NOT exclude liability for:\n\n- Gross negligence or wilful misconduct by Connek.\n- Damages resulting from a data security breach attributable to Connek.\n- Infringement of intellectual property rights.\n- Any liability that cannot be excluded or limited under applicable law, including Québec consumer protection law.",
        "fr": "Connek fournit la plateforme « telle quelle » et « selon sa disponibilité ». Nous ne garantissons pas que le service sera ininterrompu ou exempt d'erreurs en tout temps.\n\nDans la mesure permise par la loi :\n\n- La responsabilité totale de Connek envers un commerçant se limite au montant que ce commerçant a versé à Connek pour l'utilisation de la plateforme au cours des douze (12) mois précédant l'événement à l'origine de la réclamation.\n- Connek n'est pas responsable des aliments, des boissons, des prix, de l'alcool, du service ni de la conformité légale du restaurant; le restaurant lui-même en est responsable.\n\nCette limitation NE s'applique PAS et N'exclut PAS la responsabilité dans les cas suivants :\n\n- la faute lourde ou la faute intentionnelle de Connek;\n- les dommages découlant d'une atteinte à la sécurité des données imputable à Connek;\n- la violation de droits de propriété intellectuelle;\n- toute responsabilité qui ne peut être exclue ni limitée en vertu de la loi applicable, y compris la Loi sur la protection du consommateur du Québec."
      }
    },
    {
      "key": "ip",
      "title": {
        "es": "Propiedad intelectual",
        "en": "Intellectual property",
        "fr": "Propriété intellectuelle"
      },
      "body": {
        "es": "La plataforma Connek, su software, su diseño, su interfaz, sus bases de datos, así como la marca «Connek», «Connek Food» y «Connek Eats» y los logotipos asociados, son propiedad de Connek o de sus licenciantes y están protegidos por las leyes de propiedad intelectual.\n\n- No puedes copiar, modificar, distribuir, descompilar ni crear obras derivadas de la plataforma sin nuestra autorización por escrito.\n- El contenido del menú (nombres de platos, descripciones, fotos, precios y marca del restaurante) pertenece al restaurante correspondiente, que es responsable de tener los derechos necesarios sobre ese contenido.\n- El restaurante concede a Connek una licencia limitada para mostrar y procesar su contenido de menú con el fin de prestar el servicio.\n\nEl uso de la plataforma no te transfiere ningún derecho de propiedad sobre ella.",
        "en": "The Connek platform, its software, design, interface and databases, as well as the \"Connek\", \"Connek Food\" and \"Connek Eats\" brands and associated logos, are owned by Connek or its licensors and are protected by intellectual property laws.\n\n- You may not copy, modify, distribute, decompile or create derivative works of the platform without our written authorization.\n- The menu content (dish names, descriptions, photos, prices and the restaurant's branding) belongs to the relevant restaurant, which is responsible for holding the necessary rights to that content.\n- The restaurant grants Connek a limited license to display and process its menu content for the purpose of providing the service.\n\nUsing the platform does not transfer to you any ownership rights in it.",
        "fr": "La plateforme Connek, son logiciel, son design, son interface et ses bases de données, de même que les marques « Connek », « Connek Food » et « Connek Eats » et les logos associés, appartiennent à Connek ou à ses concédants de licence et sont protégés par les lois sur la propriété intellectuelle.\n\n- Vous ne pouvez pas copier, modifier, distribuer ni décompiler la plateforme, ni en créer d'œuvres dérivées, sans notre autorisation écrite.\n- Le contenu du menu (noms des plats, descriptions, photos, prix et image de marque du restaurant) appartient au restaurant concerné, qui est responsable de détenir les droits nécessaires sur ce contenu.\n- Le restaurant accorde à Connek une licence limitée pour afficher et traiter son contenu de menu aux fins de la prestation du service.\n\nL'utilisation de la plateforme ne vous transfère aucun droit de propriété sur celle-ci."
      }
    },
    {
      "key": "merchant",
      "title": {
        "es": "Términos para el comerciante",
        "en": "Merchant terms",
        "fr": "Conditions du commerçant"
      },
      "body": {
        "es": "Esta sección se aplica a los restaurantes y bares («comerciantes») que utilizan Connek para operar.\n\nComo comerciante, declaras y garantizas que:\n\n- Cuentas con todos los permisos, licencias y autorizaciones necesarios para tu actividad, incluida, cuando corresponda, la licencia de alcohol y el cumplimiento de las normas de la RACJ (Régie des alcools, des courses et des jeux) de Québec.\n- Cumples las leyes fiscales aplicables, incluida la recaudación y remisión de GST/TPS y QST/TVQ, y las leyes laborales y de empleo aplicables a tu personal.\n- La información de tu menú (precios, descripciones, alérgenos y disponibilidad) es exacta y está actualizada.\n- Eres el responsable del tratamiento de los datos personales de tus clientes que se recopilan a través de la plataforma. Connek actúa como proveedor de servicios que trata esos datos por cuenta tuya, conforme a la Política de privacidad y a la ley aplicable (incluida la Ley 25 de Québec).\n\nConnek te provee la plataforma como herramienta tecnológica, pero no asume la operación de tu negocio ni tu cumplimiento normativo. Eres responsable del uso que tú y tu personal hacen de la plataforma.",
        "en": "This section applies to the restaurants and bars (\"merchants\") that use Connek to operate.\n\nAs a merchant, you represent and warrant that:\n\n- You hold all permits, licenses and authorizations required for your activity, including, where applicable, the alcohol license and compliance with the rules of the RACJ (Régie des alcools, des courses et des jeux) of Québec.\n- You comply with applicable tax laws, including the collection and remittance of GST and QST, and with the labour and employment laws applicable to your staff.\n- Your menu information (prices, descriptions, allergens and availability) is accurate and up to date.\n- You are the controller responsible for the personal data of your customers collected through the platform. Connek acts as a service provider that processes that data on your behalf, in accordance with the Privacy Policy and applicable law (including Québec's Law 25).\n\nConnek provides you with the platform as a technology tool, but does not take over the operation of your business or your regulatory compliance. You are responsible for how you and your staff use the platform.",
        "fr": "La présente section s'applique aux restaurants et aux bars (« commerçants ») qui utilisent Connek pour exploiter leur entreprise.\n\nÀ titre de commerçant, vous déclarez et garantissez ce qui suit :\n\n- Vous détenez tous les permis, licences et autorisations requis pour votre activité, y compris, le cas échéant, le permis d'alcool et le respect des règles de la RACJ (Régie des alcools, des courses et des jeux) du Québec.\n- Vous respectez les lois fiscales applicables, y compris la perception et la remise de la TPS et de la TVQ, ainsi que les lois du travail et de l'emploi applicables à votre personnel.\n- Les renseignements de votre menu (prix, descriptions, allergènes et disponibilité) sont exacts et à jour.\n- Vous êtes responsable du traitement des renseignements personnels de vos clients recueillis au moyen de la plateforme. Connek agit comme fournisseur de services qui traite ces renseignements pour votre compte, conformément à la Politique de confidentialité et à la loi applicable (y compris la Loi 25 du Québec).\n\nConnek vous fournit la plateforme à titre d'outil technologique, mais n'assume pas l'exploitation de votre entreprise ni votre conformité réglementaire. Vous êtes responsable de l'utilisation que vous et votre personnel faites de la plateforme."
      }
    },
    {
      "key": "law",
      "title": {
        "es": "Ley aplicable y disputas",
        "en": "Governing law and disputes",
        "fr": "Droit applicable et différends"
      },
      "body": {
        "es": "Estos Términos de servicio se rigen por las leyes de la provincia de Québec y las leyes de Canadá aplicables en ella, sin tener en cuenta sus normas sobre conflicto de leyes.\n\n- Cualquier disputa relacionada con estos términos o con el uso de la plataforma se someterá a los tribunales del distrito judicial correspondiente en Québec, Canadá, salvo que la ley disponga otra cosa.\n- Antes de acudir a los tribunales, te animamos a contactarnos en dev@connek.ca para intentar resolver la disputa de buena fe.\n- Si eres consumidor, conservas todos los derechos que te otorga la ley de protección al consumidor de Québec, que prevalecen sobre cualquier cláusula incompatible de estos términos.",
        "en": "These Terms of Service are governed by the laws of the Province of Québec and the laws of Canada applicable therein, without regard to conflict-of-law rules.\n\n- Any dispute relating to these terms or to the use of the platform will be submitted to the courts of the appropriate judicial district in Québec, Canada, unless the law provides otherwise.\n- Before going to court, we encourage you to contact us at dev@connek.ca to try to resolve the dispute in good faith.\n- If you are a consumer, you keep all the rights granted to you by Québec consumer protection law, which prevail over any incompatible clause in these terms.",
        "fr": "Les présentes Conditions d'utilisation sont régies par les lois de la province de Québec et les lois du Canada qui y sont applicables, sans égard aux règles de conflit de lois.\n\n- Tout différend relatif aux présentes conditions ou à l'utilisation de la plateforme sera soumis aux tribunaux du district judiciaire compétent au Québec, Canada, sauf disposition contraire de la loi.\n- Avant de vous adresser aux tribunaux, nous vous invitons à nous joindre à dev@connek.ca afin de tenter de régler le différend de bonne foi.\n- Si vous êtes un consommateur, vous conservez tous les droits que vous confère la Loi sur la protection du consommateur du Québec, lesquels priment toute clause incompatible des présentes conditions."
      }
    },
    {
      "key": "changes",
      "title": {
        "es": "Cambios a estos términos",
        "en": "Changes to these terms",
        "fr": "Modifications des présentes conditions"
      },
      "body": {
        "es": "Podemos actualizar estos Términos de servicio de vez en cuando para reflejar cambios en la plataforma, en la ley o en nuestras prácticas.\n\n- Publicaremos la versión actualizada en connekeats.ca con una nueva fecha de vigencia.\n- Para los comerciantes, te avisaremos de los cambios importantes con una antelación razonable cuando sea posible.\n- El uso continuado de la plataforma después de la fecha de vigencia de los cambios significa que aceptas los términos actualizados.\n\nFecha de vigencia: 10 de junio de 2026.",
        "en": "We may update these Terms of Service from time to time to reflect changes in the platform, the law or our practices.\n\n- We will post the updated version on connekeats.ca with a new effective date.\n- For merchants, we will give you reasonable advance notice of material changes where possible.\n- Continued use of the platform after the effective date of the changes means you accept the updated terms.\n\nEffective date: June 10, 2026.",
        "fr": "Nous pouvons mettre à jour les présentes Conditions d'utilisation de temps à autre afin de tenir compte des changements apportés à la plateforme, à la loi ou à nos pratiques.\n\n- Nous publierons la version mise à jour sur connekeats.ca avec une nouvelle date d'entrée en vigueur.\n- Pour les commerçants, nous vous donnerons un préavis raisonnable des changements importants lorsque cela sera possible.\n- La poursuite de l'utilisation de la plateforme après la date d'entrée en vigueur des changements signifie que vous acceptez les conditions mises à jour.\n\nDate d'entrée en vigueur : 10 juin 2026."
      }
    }
  ]
};
