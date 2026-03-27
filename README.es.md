🌍 [English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [中文](README.zh.md) | [日本語](README.ja.md)

<p align="center">
  <img src="https://img.shields.io/badge/IOTA-2.0_Rebased-00f0ff?style=for-the-badge&logo=iota&logoColor=white" alt="IOTA 2.0" />
  <img src="https://img.shields.io/badge/Smart_Contract-Move-8B5CF6?style=for-the-badge" alt="Move" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">IotaPolis</h1>

<p align="center">
  <strong>Una plataforma comunitaria completamente descentralizada con pagos integrados, marketplace y escrow, impulsada por IOTA 2.0 y smart contracts Move.</strong><br/>
  Cada publicacion esta en la blockchain. Cada usuario firma con su propia wallet. Cada pago es trustless.
</p>

<p align="center">
  <a href="#-inicio-rapido">Inicio rapido</a> &bull;
  <a href="#-caracteristicas">Caracteristicas</a> &bull;
  <a href="#-arquitectura">Arquitectura</a> &bull;
  <a href="#-smart-contract">Smart Contract</a> &bull;
  <a href="#-pagos-y-marketplace">Pagos</a> &bull;
  <a href="#-temas">Temas</a> &bull;
  <a href="#-multi-nodo">Multi-Nodo</a> &bull;
  <a href="#-contribuir">Contribuir</a>
</p>

---

## Por que IotaPolis?

Los foros tradicionales dependen de un servidor central que puede ser apagado, censurado o comprometido. **IotaPolis** almacena cada dato en la blockchain IOTA 2.0 como eventos de smart contracts Move. El servidor local es solo una cache: la blockchain es la fuente de verdad.

- **Descentralizacion real** — Cada usuario tiene su propia wallet IOTA (Ed25519). El servidor nunca posee claves privadas
- **Sin punto unico de fallo** — Cualquier nodo puede reconstruir el foro completo a partir de eventos on-chain
- **Historial inmutable** — Cada publicacion, edicion y voto queda registrado permanentemente con un digest de transaccion
- **Permisos on-chain** — Los roles (Usuario, Moderador, Admin) son aplicados por el smart contract, no por el servidor
- **Economia integrada** — Propinas, suscripciones, contenido de pago, insignias y escrow, todo on-chain
- **Cero comisiones en testnet** — La testnet de IOTA 2.0 Rebased proporciona gas gratuito mediante faucet automatico

---

## Inicio rapido

```bash
# Clonar
git clone https://github.com/deduzzo/iotapolis.git
cd iotapolis

# Instalar dependencias
npm install
cd frontend && npm install && cd ..

# Primera ejecucion — genera la wallet del servidor + configuracion
npm run dev
# Espera a que aparezca "Sails lifted", luego Ctrl+C

# Desplegar el smart contract Move en la testnet de IOTA
npm run move:deploy

# Iniciar el foro
npm run dev
```

Abre `http://localhost:5173` — crea una wallet, obtiene gas del faucet, registra un nombre de usuario y comienza a publicar.

> Consulta [DEPLOY.md](DEPLOY.md) para despliegue en produccion, redes personalizadas y configuracion avanzada.

---

## Caracteristicas

### Foro principal

| Caracteristica | Descripcion |
|----------------|-------------|
| **Publicaciones on-chain** | Cada hilo, publicacion, respuesta, voto y edicion es un evento Move en IOTA 2.0 |
| **Roles por smart contract** | Sistema de permisos de 4 niveles (Baneado/Usuario/Moderador/Admin) aplicado por los validadores |
| **Identidad por wallet IOTA** | Par de claves Ed25519 con mnemonico BIP39. Cifrado con contrasena en el navegador. Sin necesidad de cuentas |
| **Firma directa** | Los usuarios firman transacciones directamente en la blockchain — el servidor nunca toca las claves privadas |
| **Versionado inmutable** | Historial de ediciones almacenado on-chain. Cada version tiene un digest TX en el explorador de IOTA |
| **Respuestas anidadas** | Discusiones en hilo con anidamiento de profundidad ilimitada |
| **Sistema de votos** | Voto positivo/negativo en publicaciones. Puntuaciones calculadas a partir de eventos de voto on-chain |
| **Busqueda de texto completo** | Indice SQLite FTS5 reconstruido desde datos de la blockchain |
| **8 idiomas** | IT, EN, ES, DE, FR, PT, JA, ZH con react-i18next |
| **Cadena de conexion** | Comparte tu foro con `testnet:PACKAGE_ID:FORUM_OBJECT_ID` — cualquiera puede unirse |

### Pagos y Marketplace

| Caracteristica | Descripcion |
|----------------|-------------|
| **Propinas** | Envia IOTA directamente a los autores de publicaciones. Montos predefinidos + personalizados. Todo on-chain |
| **Suscripciones** | Planes por niveles (Free/Pro/Premium) con precios y duraciones configurables |
| **Contenido de pago** | Los autores fijan un precio para los hilos. Cifrado AES-256, clave entregada tras el pago |
| **Categorias premium** | El admin restringe el acceso a categorias para suscriptores de un nivel determinado |
| **Insignias** | Insignias comprables configurables por el admin, mostradas junto al nombre de usuario |
| **Escrow (multi-sig)** | Escrow 2-de-3 para servicios: comprador + vendedor + arbitro. Fondos bloqueados on-chain |
| **Reputacion** | Valoraciones on-chain (1-5 estrellas) tras la resolucion del escrow. Historial de operaciones inmutable |
| **Marketplace** | Explora contenido de pago, servicios e insignias en una pagina dedicada |
| **Tesoreria** | El foro recauda comisiones (5% marketplace, 2% escrow) en una tesoreria del smart contract |

### Editor

| Caracteristica | Descripcion |
|----------------|-------------|
| **Editor WYSIWYG enriquecido** | Basado en Tiptap con barra de herramientas completa |
| **Salida en Markdown** | Serializa a markdown limpio mediante `tiptap-markdown` |
| **Formato** | Negrita, cursiva, tachado, encabezados, cita, linea horizontal |
| **Codigo** | Codigo en linea + bloques de codigo con resaltado de sintaxis |
| **Tablas** | Insertar y editar tablas directamente |
| **Imagenes** | Insertar mediante URL |
| **Emoji** | Selector de emojis (emoji-mart) |
| **@Menciones** | Buscar y mencionar usuarios |

### Temas

7 temas integrados con seleccion por usuario:

| Tema | Estilo | Disposicion |
|------|--------|-------------|
| **Neon Cyber** | Oscuro, glassmorphism, brillo neon cyan | Cuadricula de tarjetas |
| **Clean Minimal** | Claro, minimalista, acento azul | Cuadricula de tarjetas |
| **Dark Pro** | Oscuro, profesional, acento verde | Cuadricula de tarjetas |
| **Retro Terminal** | Oscuro, monoespaciado, neon verde | Cuadricula de tarjetas |
| **Invision Light** | Foro clasico, blanco, acento azul | Disposicion tipo IPB |
| **Invision Dark** | Foro clasico, gris oscuro, acento azul | Disposicion tipo IPB |
| **Material Ocean** | Material Design, azul marino profundo, acento teal | Cuadricula de tarjetas |

### Sincronizacion en tiempo real

| Caracteristica | Descripcion |
|----------------|-------------|
| **Actualizaciones por WebSocket** | Eventos granulares `dataChanged` envian actualizaciones a componentes especificos de la UI |
| **UI optimista** | Las publicaciones/votos aparecen al instante, se confirman de forma asincrona |
| **Polling de blockchain** | Cada 30s consulta nuevos eventos on-chain |
| **IOTA subscribeEvent** | Suscripcion nativa a eventos de la blockchain (~2s de latencia) |
| **Sincronizacion entre nodos** | Multiples servidores se mantienen sincronizados mediante eventos de la blockchain |

---

## Arquitectura

```
Navegador (React 19 + Vite 6 + TailwindCSS 4)
  |
  |-- Wallet IOTA Ed25519 (derivada de mnemonico, cifrada con AES en localStorage)
  |-- Firma y ejecuta transacciones DIRECTAMENTE en la blockchain
  |-- Editor WYSIWYG enriquecido (Tiptap) -> markdown
  |-- Motor de temas (7 presets, variables CSS)
  |-- Pagina de wallet: saldo, propinas, suscripciones, escrow
  |
  |  API REST (cache de solo lectura) + WebSocket Socket.io
  v
Servidor (Sails.js + Node.js) — SOLO INDEXADOR
  |
  |-- Indexa eventos de la blockchain en cache SQLite
  |-- Faucet: envia gas a nuevos usuarios (testnet)
  |-- Sirve datos en cache via REST para consultas rapidas
  |-- Difusion por WebSocket en cada cambio de estado
  |-- Polling de blockchain cada 30s para sincronizacion entre nodos
  |-- NO firma ni publica transacciones por los usuarios
  |
  v
Smart Contract Move (on-chain, inmutable)
  |
  |-- Forum (compartido): registro de usuarios, roles, suscripciones, insignias, reputacion, tesoreria
  |-- Escrow (objetos compartidos): gestion de fondos multi-sig 2-de-3
  |-- AdminCap (propio): capability del deployer
  |-- 20+ funciones de entrada con acceso restringido por rol
  |-- Emite eventos para cada operacion (payloads JSON comprimidos con gzip)
  |-- Gestiona todos los pagos: propinas, suscripciones, compras, escrow
  |
  v
IOTA 2.0 Rebased (fuente de verdad)
  |
  |-- Eventos consultables por Package ID
  |-- Todos los nodos ven los mismos datos
  |-- Cero comisiones en testnet
```

### Flujo de datos

```
El usuario escribe una publicacion
  -> El editor Tiptap serializa a markdown
  -> El frontend comprime el payload JSON con gzip
  -> El par de claves Ed25519 del usuario firma la transaccion
  -> La transaccion se ejecuta directamente en la blockchain IOTA
  -> El smart contract verifica el rol (USER >= 1), emite ForumEvent
  -> El backend detecta el evento via polling/subscribe
  -> Actualiza la cache local SQLite
  -> Difunde 'dataChanged' via WebSocket
  -> Todos los clientes conectados actualizan su interfaz
```

---

## Smart Contract

El smart contract Move (`move/forum/sources/forum.move`) es la columna vertebral de la seguridad. Todos los permisos y pagos son aplicados por los validadores de IOTA, no por el servidor.

### Sistema de roles

| Nivel | Rol | Permisos |
|-------|-----|----------|
| 0 | **BANEADO** | Todas las operaciones rechazadas por los validadores |
| 1 | **USUARIO** | Publicar, responder, votar, editar contenido propio, dar propina, suscribirse, comprar |
| 2 | **MODERADOR** | + Crear categorias, moderar contenido, banear/desbanear, arbitrar escrow |
| 3 | **ADMIN** | + Configuracion del foro, gestion de roles, configurar niveles/insignias, retirar de tesoreria |

### Funciones de entrada

**Foro (base):**

| Funcion | Rol minimo | Proposito |
|---------|------------|-----------|
| `register()` | Ninguno | Registro unico, asigna ROLE_USER |
| `post_event()` | USER | Hilos, publicaciones, respuestas, votos |
| `mod_post_event()` | MODERATOR | Categorias, acciones de moderacion |
| `admin_post_event()` | ADMIN | Configuracion del foro, cambios de rol |
| `set_user_role()` | MODERATOR | Cambiar roles de usuario (con restricciones) |

**Pagos:**

| Funcion | Rol minimo | Proposito |
|---------|------------|-----------|
| `tip()` | USER | Enviar IOTA al autor de una publicacion |
| `subscribe()` | USER | Suscribirse a un nivel |
| `renew_subscription()` | USER | Renovar suscripcion existente |
| `purchase_content()` | USER | Comprar acceso a contenido de pago |
| `purchase_badge()` | USER | Comprar una insignia |
| `configure_tier()` | ADMIN | Anadir/editar niveles de suscripcion |
| `configure_badge()` | ADMIN | Anadir/editar insignias |
| `withdraw_funds()` | ADMIN | Retirar fondos de la tesoreria del foro |

**Escrow:**

| Funcion | Quien | Proposito |
|---------|-------|-----------|
| `create_escrow()` | Comprador | Bloquear fondos en escrow (multi-sig 2-de-3) |
| `mark_delivered()` | Vendedor | Marcar el servicio como entregado |
| `open_dispute()` | Comprador | Abrir una disputa |
| `vote_release()` | Cualquier parte | Votar para liberar fondos al vendedor |
| `vote_refund()` | Cualquier parte | Votar para reembolsar al comprador |
| `rate_trade()` | Comprador/Vendedor | Valorar a la otra parte (1-5 estrellas) |

### Seguridad

- Cada usuario firma con su propio par de claves Ed25519 — `ctx.sender()` verificado por los validadores de IOTA
- El servidor nunca posee claves privadas de los usuarios
- El escrow usa votacion 2-de-3 con validacion cruzada (no se puede votar en ambos lados)
- Los sobrepagos se reembolsan automaticamente (se devuelve el cambio exacto)
- Aplicacion de plazos en operaciones de escrow
- Los usuarios baneados son rechazados a nivel del contrato
- No se puede promover por encima del propio rol, ni modificar usuarios de rol igual o superior

---

## Pagos y Marketplace

### Propinas

Haz clic en el boton de propina en cualquier publicacion para enviar IOTA directamente al autor. Elige entre montos predefinidos (0.1, 0.5, 1.0 IOTA) o introduce un monto personalizado. Las propinas son instantaneas, on-chain, sin intermediarios.

### Suscripciones

Los administradores configuran niveles de suscripcion con precio y duracion. Los usuarios se suscriben pagando el precio del nivel. El smart contract gestiona automaticamente la expiracion y el control de acceso.

### Contenido de pago

Los autores pueden fijar un precio para sus hilos. El contenido se cifra con AES-256. Tras el pago (on-chain), el comprador recibe la clave de descifrado. El 5% de comision va a la tesoreria del foro.

### Escrow

Para servicios entre usuarios, el comprador bloquea fondos en un escrow on-chain. Tres partes (comprador, vendedor, arbitro) forman un multi-sig 2-de-3. Cualquier par de ellos puede liberar o reembolsar los fondos. El 2% de comision va a la tesoreria del foro en la resolucion.

### Reputacion

Tras cada resolucion de escrow, ambas partes pueden dejar una valoracion (1-5 estrellas + comentario). Las valoraciones son inmutables on-chain. Los perfiles de usuario muestran la valoracion promedio, el numero de operaciones, la tasa de exito y el volumen.

---

## Multi-Nodo

IotaPolis soporta multiples nodos independientes conectados al mismo smart contract. Cada nodo:

1. Ejecuta su propio servidor Sails.js + frontend React
2. Tiene su propia cache SQLite (reconstruible)
3. Los usuarios firman transacciones directamente on-chain
4. Se sincroniza desde la blockchain cada 30 segundos

### Unirse a un foro existente

```bash
# Iniciar el servidor
npm run dev

# En el navegador: ve a Setup -> "Conectar a foro existente"
# Pega la cadena de conexion: testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
# El sistema sincroniza todos los eventos desde la blockchain
```

---

## Stack tecnologico

| Capa | Tecnologia | Version |
|------|------------|---------|
| **Blockchain** | IOTA 2.0 Rebased | Testnet |
| **Smart Contract** | Move (IOTA MoveVM) | — |
| **SDK** | @iota/iota-sdk | Ultima |
| **Backend** | Sails.js | 1.5 |
| **Runtime** | Node.js | >= 18 |
| **Base de datos** | better-sqlite3 (cache) | Ultima |
| **Frontend** | React | 19 |
| **Bundler** | Vite | 6 |
| **CSS** | TailwindCSS | 4 |
| **Animaciones** | Framer Motion | 12 |
| **Editor** | Tiptap (ProseMirror) | 3 |
| **Iconos** | Lucide React | Ultima |
| **Tiempo real** | Socket.io | 2 |
| **i18n** | react-i18next | 8 idiomas |
| **Escritorio** | Electron + electron-builder | 33 |
| **Criptografia** | Ed25519 (nativo IOTA) + AES-256-GCM + BIP39 | — |

---

## Aplicacion de escritorio (Electron)

Disponible como aplicacion de escritorio independiente para Windows, macOS y Linux. El servidor se ejecuta integrado dentro de la aplicacion.

### Descarga

Descarga la ultima version desde [GitHub Releases](https://github.com/deduzzo/iotapolis/releases):

| Plataforma | Archivo | Actualizacion automatica |
|------------|---------|--------------------------|
| **Windows** | Instalador `.exe` | Si |
| **macOS** | `.dmg` | Si |
| **Linux** | `.AppImage` | Si |

---

## Comandos

| Comando | Descripcion |
|---------|-------------|
| `npm run dev` | Iniciar backend + frontend en desarrollo |
| `npm start` | Iniciar en modo produccion (puerto unico 1337) |
| `npm run build` | Compilar el frontend para produccion |
| `npm run move:build` | Compilar el smart contract Move |
| `npm run move:deploy` | Compilar + desplegar el contrato en la testnet de IOTA |
| `npm run desktop:dev` | Ejecutar Electron en modo desarrollo |
| `npm run desktop:build` | Compilar la aplicacion de escritorio para la plataforma actual |
| `npm run release` | Script de lanzamiento interactivo |

---

## Endpoints de la API

### Publicos (cache de solo lectura)

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/api/v1/categories` | Listar todas las categorias con estadisticas |
| GET | `/api/v1/threads?category=ID&page=N` | Listar hilos en una categoria |
| GET | `/api/v1/thread/:id` | Detalle del hilo con todas las publicaciones |
| GET | `/api/v1/posts?thread=ID` | Publicaciones de un hilo |
| GET | `/api/v1/user/:id` | Perfil de usuario + reputacion + insignias |
| GET | `/api/v1/user/:id/reputation` | Reputacion comercial del usuario |
| GET | `/api/v1/user/:id/subscription` | Estado de suscripcion del usuario |
| GET | `/api/v1/search?q=QUERY` | Busqueda de texto completo |
| GET | `/api/v1/dashboard` | Estadisticas del foro + pagos |
| GET | `/api/v1/marketplace` | Contenido de pago, insignias, mejores vendedores |
| GET | `/api/v1/escrows` | Lista de escrows (filtrable) |
| GET | `/api/v1/escrow/:id` | Detalle del escrow con valoraciones |
| GET | `/api/v1/tips/:postId` | Propinas en una publicacion especifica |
| GET | `/api/v1/forum-info` | Metadatos del foro + cadena de conexion |

### Acciones del servidor

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/api/v1/faucet-request` | Solicitar gas para una nueva direccion (con limite de frecuencia) |
| POST | `/api/v1/full-reset` | Reinicio completo (requiere firma de admin) |
| POST | `/api/v1/sync-reset` | Reinicio de cache + resincronizacion (requiere firma de admin) |

Todas las operaciones de escritura (publicaciones, votos, moderacion, pagos, escrow) se ejecutan directamente en la blockchain IOTA desde la wallet del usuario. El servidor es un indexador de solo lectura.

---

## Como funciona la identidad

1. **Generar** — El navegador crea un par de claves Ed25519 a partir de un mnemonico BIP39 (12 palabras)
2. **Cifrar** — El mnemonico se cifra con la contrasena del usuario (AES-256-GCM + PBKDF2) y se almacena en localStorage
3. **Faucet** — El backend envia gas IOTA a la nueva direccion (testnet)
4. **Registrar** — El usuario llama a `register()` en el contrato Move directamente
5. **Firmar** — Cada accion (publicar, votar, dar propina, escrow) es una transaccion firmada con la clave Ed25519 del usuario
6. **Verificar** — `ctx.sender()` verificado por los validadores de IOTA a nivel de protocolo
7. **Respaldar** — Los usuarios exportan su mnemonico de 12 palabras para restaurar en cualquier dispositivo

Sin contrasenas en el servidor. Sin correos electronicos. Sin cuentas. Tu wallet es tu identidad.

---

## Contribuir

Las contribuciones son bienvenidas. Este proyecto esta en desarrollo activo.

1. Haz un fork del repositorio
2. Crea una rama de funcionalidad: `git checkout -b feature/funcionalidad-increible`
3. Realiza tus cambios
4. Ejecuta `npm run dev` y prueba localmente
5. Haz commit: `git commit -m 'feat: add funcionalidad increible'`
6. Haz push: `git push origin feature/funcionalidad-increible`
7. Abre un Pull Request

---

## Licencia

Licencia MIT. Consulta [LICENSE](LICENSE) para mas detalles.

---

<p align="center">
  <strong>Construido sobre IOTA 2.0 Rebased</strong><br/>
  <em>Cada publicacion es una transaccion. Cada permiso es un smart contract. Cada usuario es una wallet.</em>
</p>
