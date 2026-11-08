// Datos semilla (seed) del catálogo obtenidos desde WhatsApp Catalogue Exporter y utilidades compartidas
export const CATEGORIES = [
  { id: 'corporativa', label: 'Corporativa' },
  { id: 'fire', label: 'Fire' },
  { id: 'seven', label: 'Seven' },
  { id: 'accesorios', label: 'Accesorios' },
];

export function normalizeCategoryId(catId) {
  const raw = String(catId || '').trim().toLowerCase();
  if (raw === 'ropa' || raw === 'corporativa' || raw === 'institucional') return 'corporativa';
  if (raw === 'proteccion' || raw === 'herramientas' || raw === 'fire') return 'fire';
  if (raw === 'seven') return 'seven';
  if (raw === 'accesorios') return 'accesorios';
  return 'fire';
}

export const KIDS_SIZES = ['2', '4', '6', '8', '10', '12', '14', '16'];
export const ADULT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', '6XL'];
export const ALL_SIZES = [...KIDS_SIZES, ...ADULT_SIZES];

export const DEFAULT_PRODUCTS = [
  {
    "id": "uniforme-rescate-usar-gersa",
    "name": "Uniforme Rescate USAR-GERSA",
    "category": "fire",
    "description": "Informes Rescate GERSA Bomberos, personalizados. Tallas disponibles S a 4XL, colores a elección. Solicitar cotización. Pedido mínimo 6 unidades completas.",
    "image": "uploads/uniforme-rescate-usar-gersa.jpg",
    "normalPrice": null,
    "offerPrice": null,
    "showPrice": false,
    "colors": [
      "A elección"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 6,
    "featured": true,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.834Z"
  },
  {
    "id": "chaqueta-comandante-bomberos",
    "name": "Chaqueta Comandante Bomberos",
    "category": "corporativa",
    "description": "Chaqueta en material impermeable, ideal dado sus características antifluido. Modelo Comandante. Color Blanco. Incluye Bordado en material Reflectante. Tallas Xs a XXXL. Cotiza en @gam.chile",
    "image": "uploads/chaqueta-comandante-bomberos.jpg",
    "normalPrice": 70000,
    "offerPrice": 60000,
    "showPrice": true,
    "colors": [
      "Blanco"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.835Z"
  },
  {
    "id": "uniforme-diseno-rosenbauer-adulto-y-ninos",
    "name": "Uniforme Diseño Rosenbauer - Adulto y Niños",
    "category": "fire",
    "description": "Buscas esta linea de diseño en tus uniformes? Uniformes estilo diseño Alemán Rosenbauer GAM FIRE lo confeccionamos para ti. Tallas de Niños (BJ) y para Adultos. Tallas desde 6 a 4xl. Enviamos a todo el pais. Cotiza con nosotros, GAM FIRE puede ser tu mejor alternativa! Contáctanos al +56979684064",
    "image": "uploads/uniforme-diseno-rosenbauer-adulto-y-ninos.jpg",
    "normalPrice": 120000,
    "offerPrice": 100000,
    "showPrice": true,
    "colors": [
      "Negro / Amarillo",
      "Rojo",
      "Azul Marino"
    ],
    "sizes": [
      "6",
      "8",
      "10",
      "12",
      "14",
      "16",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 1,
    "featured": true,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.835Z"
  },
  {
    "id": "camisa-cuartel",
    "name": "Camisa Cuartel",
    "category": "corporativa",
    "description": "Material Royal Crop, ideal para un calce perfecto. Modelo Damas y Varón. Detalles incorporados como palas,broches,boton invisible, etc. Pedido sobre 12 unidades. Tallas de XS a 3XL. Cotiza con nosotros @gam.chile",
    "image": "uploads/camisa-cuartel.jpg",
    "normalPrice": 40000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Azul Marino",
      "Blanco",
      "Negro"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL"
    ],
    "minOrderQty": 12,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.836Z"
  },
  {
    "id": "chaqueta-rescate-vial",
    "name": "Chaqueta Rescate - Vial",
    "category": "fire",
    "description": "Buscas Chaqueta de Rescate o Vial, para tu equipo, Brigada, o Compañía?... no sigas buscando!!! Aquí te presentamos estos modelos modelos. Tallas XS a 6XL. Cotiza con nosotros!!! +56979684064 Descuento por primera compra en grupo. Producción mínimo 6 unidades. Envío a todo el pais. (Chile) Valor unitario previa confirmación con vendedor a cargo.",
    "image": "uploads/chaqueta-rescate-vial.jpg",
    "normalPrice": 60000,
    "offerPrice": 50000,
    "showPrice": true,
    "colors": [
      "Rojo / Amarillo Flúor",
      "Amarillo Flúor"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL",
      "5XL",
      "6XL"
    ],
    "minOrderQty": 6,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.836Z"
  },
  {
    "id": "uniforme-grimp",
    "name": "Uniforme GRIMP",
    "category": "fire",
    "description": "Uniforme diseño GRIMP •Cortavientos •Polar •Pantalón Cotiza con nosotros al +56979684064.Tallas XS A 4XL.",
    "image": "uploads/uniforme-grimp.jpg",
    "normalPrice": null,
    "offerPrice": null,
    "showPrice": false,
    "colors": [
      "Rojo / Negro",
      "Naranja"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.837Z"
  },
  {
    "id": "camisa-bluson-ignifugo",
    "name": "Camisa / Blusón Ignífugo",
    "category": "fire",
    "description": "Nuestra camisa ignífuga certificada es la elección perfecta para quienes buscan protección confiable en entornos de alto riesgo. Confeccionada en textil Firewear® y certificada bajo las normativas NFPA 2112 y ASTM F1506, esta prenda ofrece una defensa efectiva contra el fuego sin sacrificar comodidad. Su diseño clásico y resistencia superior garantizan durabilidad y mantienen una apariencia profesional incluso después de múltiples lavados.",
    "image": "uploads/camisa-bluson-ignifugo.jpg",
    "normalPrice": 75000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Azul Marino",
      "Amarillo Forestal"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 1,
    "featured": true,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.838Z"
  },
  {
    "id": "cobertor-quilt-guardia",
    "name": "Cobertor / Quilt Guardia",
    "category": "accesorios",
    "description": "Juego de Cobertor cama, 2 piezas, 1 funda de almohada incluida. Bordado en full color. Trabajamos con 1 plaza y 1 plaza y media. Colores variados. Cotización para Guardias Nocturnas, con descuento. Pedido min 6 Unidades.",
    "image": "uploads/cobertor-quilt-guardia.jpg",
    "normalPrice": 35000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Colores variados (1 plaza y 1.5 plaza)"
    ],
    "sizes": [],
    "minOrderQty": 6,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.839Z"
  },
  {
    "id": "uniformes-brigada-juvenil",
    "name": "Uniformes Brigada Juvenil",
    "category": "corporativa",
    "description": "Buscas Uniformes para Brigadieres.. GAM FIRE somos tu mejor alternativa. Material Gabardina Ripstop. Modelo unicolor o bicolor. Cotiza con nosotros ws +56979684064 / 9 9878 3965 Te asesoramos antes, durante y después de tu compra. Trabajamos desde la talla 2 en adelante.",
    "image": "uploads/uniformes-brigada-juvenil.jpg",
    "normalPrice": null,
    "offerPrice": null,
    "showPrice": false,
    "colors": [
      "Unicolor",
      "Bicolor"
    ],
    "sizes": [
      "2",
      "4",
      "6",
      "8",
      "10",
      "12",
      "14",
      "16",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.841Z"
  },
  {
    "id": "pantalon-blanco",
    "name": "Pantalón Blanco",
    "category": "corporativa",
    "description": "Pantalón Blanco Gabardina Ideal para:  Competencias  Bautizo  Desfiles Uniforme de parada Aniversario, Romería, etc. Tallas disponibles S a 2XL. Contáctanos a uno de nuestros números al +56979684064 - +56998783965",
    "image": "uploads/pantalon-blanco.jpg",
    "normalPrice": 15000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Blanco"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "2XL"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.842Z"
  },
  {
    "id": "uniforme-de-parada",
    "name": "Uniforme de Parada",
    "category": "corporativa",
    "description": "Cotiza con nosotros tu diseño. Pedido minimo por 6 unidades. Talla de XS A 4XL. Material Paño y Casimir.",
    "image": "uploads/uniforme-de-parada.jpg",
    "normalPrice": null,
    "offerPrice": null,
    "showPrice": false,
    "colors": [
      "Azul Marino",
      "Negro",
      "Rojo"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 6,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.845Z"
  },
  {
    "id": "uniforme-multirol-antillama",
    "name": "Uniforme Multirol / Antillama",
    "category": "fire",
    "description": "Uniforme Multirol con Insumos certificados. Cierres YKK, Cinta 3M. Modelo Veridian, o Lakeland. Tallas XS A 4XL. Material Tela Certificada retardante a la llama.",
    "image": "uploads/uniforme-multirol-antillama.jpg",
    "normalPrice": 115000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Negro / Amarillo",
      "Azul Marino",
      "Tan / Arena"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 1,
    "featured": true,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.847Z"
  },
  {
    "id": "pantalon-cuartel",
    "name": "Pantalón Cuartel",
    "category": "corporativa",
    "description": "Pantalón Cuartel. Material liviano,elegante y certificado. Pantalon en casimir. Detalles en confección que resaltan su talle,tanto para Varones como Damas. Ajuste, boton invisible, broches,porta palas. Te invitamos a Cotizar con @gam.chile Enviamos a todo el país. Entrega de Cotización formal y Factura. Tallas Xs a 4XL. Colores Azul marino, Negro, Beige. Negro.",
    "image": "uploads/pantalon-cuartel.jpg",
    "normalPrice": 35000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Azul Marino",
      "Negro",
      "Beige"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.850Z"
  },
  {
    "id": "accesorios-para-brigada-juvenil",
    "name": "Accesorios para Brigada Juvenil",
    "category": "accesorios",
    "description": "GORROS BORDADOS - MOCHILAS - BANANOS",
    "image": "uploads/accesorios-para-brigada-juvenil.jpg",
    "normalPrice": null,
    "offerPrice": null,
    "showPrice": false,
    "colors": [
      "Personalizado con bordado"
    ],
    "sizes": [],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.851Z"
  },
  {
    "id": "jockey-gorros-safari",
    "name": "Jockey - Gorros - Safari",
    "category": "accesorios",
    "description": "Gorro de lana bordados - Jockey Gabardina bordados - Gorro estilo Safari. Cotiza por minimo 6 unidades para personalizar.",
    "image": "uploads/jockey-gorros-safari.jpg",
    "normalPrice": 10000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Azul Marino",
      "Negro",
      "Rojo"
    ],
    "sizes": [],
    "minOrderQty": 6,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.852Z"
  },
  {
    "id": "chaqueta-institucional-con-pala",
    "name": "Chaqueta Institucional con Pala",
    "category": "corporativa",
    "description": "Chaqueta formal, en material gabardina con modelo palas en hombros. Tallas XS A 4XL.",
    "image": "uploads/chaqueta-institucional-con-pala.jpg",
    "normalPrice": 45000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Azul Marino",
      "Negro"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.853Z"
  },
  {
    "id": "uniforme-cuartel-gabardina",
    "name": "Uniforme Cuartel Gabardina",
    "category": "corporativa",
    "description": "UNIFORME EN MATERIAL GABARDINA O CASIMIR. PANTALON FORMAL, CAMISA/BLUSA FORMAL,CON PALAS. TALLA DE XS A 4XL.",
    "image": "uploads/uniforme-cuartel-gabardina.jpg",
    "normalPrice": null,
    "offerPrice": null,
    "showPrice": false,
    "colors": [
      "Azul Marino",
      "Negro"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.853Z"
  },
  {
    "id": "chaqueta-bomber-adulto",
    "name": "Chaqueta Bomber Adulto",
    "category": "corporativa",
    "description": "GAM FIRE te ofrece Chaquetas Chicago Fire en tallas infantiles y Adultos. Uniforme de Cuartel, Incorpora el escudo o insignia de tu Cia, Brigada o Grupo. Desde 2 a 12 y de XS a 4XL. Enviamos a todo el pais. Descuentos aplicados por un minimo de 6 unidades. Si quieres para un grupo, nos comentas y hacemos personalizado.  Contáctanos al +56979684064",
    "image": "uploads/chaqueta-bomber-adulto.jpg",
    "normalPrice": 48000,
    "offerPrice": 45000,
    "showPrice": true,
    "colors": [
      "Azul Marino",
      "Negro"
    ],
    "sizes": [
      "2",
      "4",
      "6",
      "8",
      "10",
      "12",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 6,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.855Z"
  },
  {
    "id": "uniforme-para-ninos-mi-bomberito",
    "name": "Uniforme para Niños (Mi Bomberito)",
    "category": "corporativa",
    "description": "Gam Fire Chile-Mi Bomberito te ofrece durante todo el año, Uniforme para tu hij@, Sobrin@, Niet@*...confeccionamos desde la talla 2 en adelante. Enviamos a todo el país, por bluexpress a domicilio. Pantalón, chaqueta, estampado espalda-  Contáctanos a nuestro número de ws. +56979684064",
    "image": "uploads/uniforme-para-ninos-mi-bomberito.jpg",
    "normalPrice": 38000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Negro / Amarillo",
      "Rojo"
    ],
    "sizes": [
      "2",
      "4",
      "6",
      "8",
      "10",
      "12",
      "14",
      "16"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.857Z"
  },
  {
    "id": "uniforme-grimp-diseno-frances",
    "name": "Uniforme GRIMP - Diseño Francés",
    "category": "fire",
    "description": "Uniformes para Grupo de Rescates. buscas el modelo francés??...pues acá lo tenemos para ti  a un valor accesible. Recuerda que enviamos a todo el pais. Trabajamos en la confección hasta 4 xl y algunas prendas hasta 6xl. Materiales, telas e insumos certificados. Costuras reforzadas y termoselladas. Contáctanos para cotizar al mail: gamfirechile@gmail.com ws +569979684064",
    "image": "uploads/uniforme-grimp-diseno-frances.jpg",
    "normalPrice": 185000,
    "offerPrice": 140000,
    "showPrice": true,
    "colors": [
      "Rojo / Azul",
      "Naranja / Azul"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL",
      "5XL",
      "6XL"
    ],
    "minOrderQty": 1,
    "featured": true,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.859Z"
  },
  {
    "id": "camisas-blusa-institucionales-oxford",
    "name": "Camisas - Blusa Institucionales Oxford",
    "category": "corporativa",
    "description": "Camisa o Blusa en material Oxford. Bordado delantero corazón, insignia. Mas bordado espalda. Talla S a XXL.",
    "image": "uploads/camisas-blusa-institucionales-oxford.jpg",
    "normalPrice": 15000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Blanco",
      "Celeste",
      "Azul"
    ],
    "sizes": [
      "S",
      "M",
      "L",
      "XL",
      "2XL"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.862Z"
  },
  {
    "id": "souvenir-mates-llaveros-3d",
    "name": "Souvenir Mates - Llaveros 3D",
    "category": "accesorios",
    "description": "Hermosos artículos como souvenir, regalo, colección, demostración. Mate Diseños Bomberos en material polimero diseñado 3D. Incluye Bombilla. Llaveros en diseño 3D.",
    "image": "uploads/souvenir-mates-llaveros-3d.jpg",
    "normalPrice": 20000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Diseños Bomberos 3D"
    ],
    "sizes": [],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.866Z"
  },
  {
    "id": "juego-sabanas-negras-guardias-nocturnas",
    "name": "Juego Sábanas Negras Guardias Nocturnas",
    "category": "accesorios",
    "description": "Juego de Sabanas, bajera y encimera,color negro, material crea algodón. Diseño con cinta reflectante. 1 plaza o 1 plaza y media.",
    "image": "uploads/juego-sabanas-negras-guardias-nocturnas.jpg",
    "normalPrice": 25000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Negro con cinta reflectante"
    ],
    "sizes": [],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.869Z"
  },
  {
    "id": "uniforme-brigada-juvenil-ripstop",
    "name": "Uniforme Brigada Juvenil Ripstop",
    "category": "corporativa",
    "description": "Elige tu opción más adecuada, para la Brigada Juvenil de tu CB o COMPAÑIA. Telas certificadas. Insumos certificados. Confección talla 2 a 4Xl. Enviamos a todo el pais. Nos respaldan grandes Cuerpos de la RM y Regiones. Contáctanos y cotiza!!!",
    "image": "uploads/uniforme-brigada-juvenil-ripstop.jpg",
    "normalPrice": 75000,
    "offerPrice": null,
    "showPrice": true,
    "colors": [
      "Rojo / Negro",
      "Azul / Amarillo"
    ],
    "sizes": [
      "2",
      "4",
      "6",
      "8",
      "10",
      "12",
      "14",
      "16",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 1,
    "featured": false,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.870Z"
  },
  {
    "id": "uniforme-agreste-ignifugo-rs-270",
    "name": "Uniforme Agreste - Ignífugo (RS 270)",
    "category": "fire",
    "description": "Uniformes Brigada Forestal - Rescate Agreste - CONAF. RS 270 representa la última innovación en textiles inherentes retardantes a la llama dentro de la línea Firetex®. Especialmente diseñado para faenas forestales donde la protección y seguridad de los brigadistas es imprescindible.",
    "image": "uploads/uniforme-agreste-ignifugo-rs-270.jpg",
    "normalPrice": 140000,
    "offerPrice": 135000,
    "showPrice": true,
    "colors": [
      "Amarillo Forestal / Negro",
      "Naranja"
    ],
    "sizes": [
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL"
    ],
    "minOrderQty": 1,
    "featured": true,
    "active": true,
    "updatedAt": "2026-10-24T22:01:42.871Z"
  }
];

export const DEFAULT_BANNERS = [
  {
    id: 'banner-aliado',
    title: 'EL MEJOR',
    highlight: 'ALIADO',
    titleRight: 'PARA TU',
    highlightRight: 'EQUIPO',
    badge: 'GAM CHILE • CONFECCIÓN 100% NACIONAL',
    subtitle: 'Uniformes corporativos, tácticos y de emergencia diseñados a la medida de tu institución o empresa.',
    layout: 'split',
    posterImage: 'uploads/promo-banner-aliado.jpg',
    videoUrl: 'uploads/promo-gam-chile.webm',
    ctaText: 'COTIZA CON NOSOTROS AQUÍ',
    ctaLink: 'contacto.html',
    active: true,
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'banner-fire-certificado',
    title: 'PROTECCIÓN E INSUMOS',
    highlight: 'CERTIFICADOS',
    titleRight: '',
    highlightRight: '',
    badge: 'DIVISIÓN FIRE • EMERGENCIA Y ALTA EXIGENCIA',
    subtitle: 'Confección nacional con proveedores e insumos certificados (NFPA 2112 • ASTM F1506 • EN 15614, según corresponda), cintas reflectantes 3M y cierres YKK.',
    layout: 'vignette',
    posterImage: 'uploads/promo-banner-certificado.jpg',
    videoUrl: '',
    ctaText: 'CONOCE LÍNEA FIRE AQUÍ',
    ctaLink: 'catalogo.html?categoria=fire',
    active: true,
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'banner-nacional-divisiones',
    title: '4 DIVISIONES A MEDIDA',
    highlight: 'ENVÍOS A TODO CHILE',
    titleRight: '',
    highlightRight: '',
    badge: 'CORPORATIVA • FIRE • SEVEN • ACCESORIOS',
    subtitle: 'Desde tallas infantiles (2) hasta adultos (6XL). Atención personalizada para Cuerpos de Bomberos, Brigadas y Empresas.',
    layout: 'bottom-bar',
    posterImage: 'uploads/promo-banner-nacional.jpg',
    videoUrl: '',
    ctaText: 'EXPLORAR DIVISIONES AQUÍ',
    ctaLink: 'catalogo.html',
    active: true,
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
  {
    id: 'banner-dual-line',
    title: 'VITRINA MULTILÍNEA',
    highlight: 'GAM CHILE',
    titleRight: '',
    highlightRight: '',
    badge: 'LÍNEAS DESTACADAS GAM CHILE',
    subtitle: 'Muestra interactiva de nuestras 4 divisiones y prendas destacadas',
    layout: 'showcase',
    productIds: [
      'uniforme-rescate-usar-gersa',
      'chaqueta-comandante-bomberos',
      'cobertor-quilt-guardia',
      'uniformes-brigada-juvenil',
    ],
    posterImage: '/hero-banner.jpg',
    videoUrl: '',
    ctaText: 'VER CATÁLOGO COMPLETO',
    ctaLink: 'catalogo.html',
    active: true,
    updatedAt: '2026-11-01T00:00:00.000Z',
  },
];

export const DEFAULT_SITE_CONTENT = {
  siteLayoutMode: 'multipage',
  contact: {
    whatsappNumber: '+56 9 7968 4064',
    whatsappUrl: 'https://wa.me/56979684064',
    facebookName: 'Gam Fire Chile - Mi Bomberito',
    facebookUrl: 'https://www.facebook.com/minibomberito',
    instagramHandle: '@gam.chile',
    instagramUrl: 'https://instagram.com/gam.chile',
    email: 'gamfirechile@gmail.com',
  },
  intro: {
    titleMain: 'FABRICAMOS',
    titleHighlight: 'ROPA CORPORATIVA Y DE EMERGENCIA',
    paragraph:
      'En GAM CHILE, nuestro compromiso es proporcionar soluciones de Ropa Corporativa, Indumentaria Fire de Emergencia, Línea Seven y Accesorios de alta calidad, destacando que nuestra confección es 100% nacional. Trabajamos con proveedores e insumos certificados para labores relacionadas con emergencias y alta exigencia (ASTM F1506 o EN 15614, NFPA 2112, según corresponda), junto con cierres YKK y cintas reflectantes 3M, garantizando durabilidad, protección y funcionalidad que reflejan la identidad de tu institución o empresa. Además, ofrecemos atención personalizada y confección por volumen con despachos a todo Chile.',
  },
  empresa: {
    titleMain: 'QUIÉNES',
    titleHighlight: 'SOMOS',
    paragraph1:
      'En GAM CHILE nos especializamos en el diseño y confección nacional de uniformes corporativos, ropa técnica de trabajo e indumentaria de emergencia en nuestras líneas Corporativa, Fire y Seven, diseñados para brindar la máxima seguridad, representatividad y comodidad a quienes enfrentan riesgos diarios en servicios de emergencia, cuerpos de bomberos, brigadas e industria.',
    paragraph2:
      'Empleamos proveedores e insumos certificados que cumplen con rigurosas normativas internacionales para trabajo de emergencia (como ASTM F1506, EN 15614 y NFPA 2112, según corresponda), incorporando telas retardantes a la llama, cintas reflectantes 3M, cierres YKK y costuras reforzadas que garantizan calidad y desempeño en cada prenda.',
    paragraph3:
      'Trabajamos en conjunto con cada institución, compañía y empresa, promoviendo el trabajo en equipo y el asesoramiento personalizado antes, durante y después de tu compra para desarrollar soluciones adaptadas a sus necesidades, tallas (desde niños hasta 6XL) e identidad institucional, respaldados por un servicio de postventa confiable y despachos de Arica a Magallanes.',
    motto: 'Nuestro lema: Calidad, protección certificada y compromiso con la vida.',
    misionTitle: '1. Misión',
    misionText:
      'GAM CHILE entrega soluciones confiables y de alta calidad en confección de vestuario técnico de emergencia, uniformes de bomberos, rescate y ropa corporativa, utilizando insumos certificados para apoyar la seguridad y protección integral de voluntarios, brigadistas y trabajadores en todo el país, adaptándonos a los requerimientos específicos de cada compañía, brigada o empresa.',
    visionTitle: '2. Visión',
    visionText:
      'Ser el referente estratégico a nivel nacional en la confección de indumentaria de emergencia y vestuario corporativo a través de nuestras divisiones Corporativa, Fire, Seven y Accesorios, destacando por la excelencia de nuestra manufactura chilena, innovación textil y cercanía con cada cliente en todas las regiones del país.',
  },
  catalogBanners: {
    all: {
      badge: 'CATÁLOGO GENERAL • GAM CHILE',
      titleMain: 'TODAS NUESTRAS',
      titleHighlight: 'DIVISIONES',
      desc: 'Confección 100% nacional con proveedores e insumos certificados. Explora nuestras líneas Corporativa, Fire, Seven y Accesorios o selecciona los productos que deseas cotizar por WhatsApp.',
      pills: [
        '✓ Confección 100% Nacional',
        '✓ Insumos Certificados (3M / YKK)',
        '✓ Tallas Niños (2) a Adultos (6XL)',
        '✓ Envíos a Todo Chile',
      ],
      bgImage: '/hero-banner.jpg',
    },
    corporativa: {
      badge: 'DIVISIÓN CORPORATIVA • GAM CHILE',
      titleMain: 'DIVISIÓN',
      titleHighlight: 'CORPORATIVA',
      desc: 'Nos especializamos en transformar la vestimenta laboral en una poderosa herramienta de identidad de marca, combinando elegancia, durabilidad en camisas de oxford y gabardina, blusas, pantalones de vestir, pantalones tipo cargo, poleras, chaquetas, parkas, uniforme institucional de oficina; manteniendo un estándar de presentación impecable.',
      cardDesc:
        'Nos especializamos en transformar la vestimenta laboral en una poderosa herramienta de identidad de marca, combinando elegancia, durabilidad en camisas de oxford y gabardina, blusas, pantalones de vestir, pantalones tipo cargo, poleras, chaquetas, parkas, uniforme institucional de oficina; manteniendo un estándar de presentación impecable.',
      pills: [
        '✓ Telas Oxford, Royal Crop, Casimir y Gabardina',
        '✓ Calce Damas y Varón (Tallas XS a 4XL)',
        '✓ Bordado Institucional Personalizado',
        '✓ Ventas por Volumen con Factura',
      ],
      bgImage: 'uploads/division-corporativa.jpg',
    },
    fire: {
      badge: 'DIVISIÓN FIRE • EMERGENCIA Y ALTA EXIGENCIA',
      titleMain: 'DIVISIÓN',
      titleHighlight: 'FIRE • EMERGENCIA Y RESCATE',
      desc: 'Indumentaria de emergencia y rescate de confección nacional con proveedores e insumos certificados (ASTM F1506, EN 15614, NFPA 2112, según corresponda), cintas reflectantes 3M, cierres YKK y costuras reforzadas.',
      cardDesc:
        'Uniformes Multirol antillama, rescate USAR-GERSA, agreste RS 270, camisas ignífugas y diseño Rosenbauer / GRIMP con insumos certificados.',
      pills: [
        '🔥 Normativas NFPA 2112 • ASTM F1506 • EN 15614',
        '✓ Telas Inherentes Retardantes a la Llama',
        '✓ Cintas Reflectantes 3M y Cierres YKK',
        '✓ Tallas Infantiles (2) a Adultos (6XL)',
      ],
      bgImage: 'uploads/division-fire.jpg',
    },
    seven: {
      badge: 'DIVISIÓN SEVEN • DISEÑO Y RENDIMIENTO',
      titleMain: 'DIVISIÓN',
      titleHighlight: 'SEVEN',
      desc: 'Línea especializada SEVEN de GAM Chile: vestuario técnico, táctico y operativo de alto desempeño diseñado para brindar movilidad, resistencia y confort térmico a tu equipo en terreno.',
      cardDesc:
        'Línea especializada SEVEN de GAM Chile. Prendas técnicas, versátiles y de alto rendimiento listas para personalizar para tu equipo.',
      pills: [
        '⚡ Línea Exclusiva SEVEN GAM Chile',
        '✓ Telas Técnicas Ripstop, Softshell y Térmicas',
        '✓ Personalización con Bordado y Estampado',
        '✓ Despachos de Arica a Magallanes',
      ],
      bgImage: 'uploads/division-seven.jpg',
    },
    accesorios: {
      badge: 'DIVISIÓN ACCESORIOS Y GUARDIA • GAM CHILE',
      titleMain: 'DIVISIÓN',
      titleHighlight: 'ACCESORIOS Y GUARDIA',
      desc: 'Artículos tradicionales de alta rotación como jockeys, mochilas, artículos 3d personalizados, pines, medallas acrílicas, galvanos; imanes para nevera, llaveros, tazas, camisetas con diseños locales, bolsas de tela (tote bags) eco-amigables, entre otros artículos mas. Además de servicios de estampados y bordados.',
      cardDesc:
        'Artículos tradicionales de alta rotación como jockeys, mochilas, artículos 3d personalizados, pines, medallas acrílicas, galvanos; imanes para nevera, llaveros, tazas, camisetas con diseños locales, bolsas de tela (tote bags) eco-amigables, entre otros artículos mas. Además de servicios de estampados y bordados.',
      pills: [
        '✓ Jockeys y Gorros con Bordado Full Color',
        '✓ Cobertores y Sábanas Guardia Nocturna',
        '✓ Mochilas y Bananos Personalizados',
        '✓ Souvenirs y Mates Bomberos 3D',
      ],
      bgImage: 'uploads/division-accesorios.jpg',
    },
  },
};

export function getCategoryLabel(catId) {
  const norm = normalizeCategoryId(catId);
  const found = CATEGORIES.find((c) => c.id === norm);
  return found ? found.label : catId || 'General';
}

export function formatCLP(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '';
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(num);
}
