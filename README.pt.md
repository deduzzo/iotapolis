🌍 [English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [中文](README.zh.md) | [日本語](README.ja.md)

<p align="center">
  <img src="https://img.shields.io/badge/IOTA-2.0_Rebased-00f0ff?style=for-the-badge&logo=iota&logoColor=white" alt="IOTA 2.0" />
  <img src="https://img.shields.io/badge/Smart_Contract-Move-8B5CF6?style=for-the-badge" alt="Move" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">IotaPolis</h1>

<p align="center">
  <strong>Uma plataforma comunitaria totalmente descentralizada com pagamentos integrados, marketplace e escrow — alimentada por IOTA 2.0 e smart contracts Move.</strong><br/>
  Cada post esta na blockchain. Cada usuario assina com sua propria carteira. Cada pagamento e trustless.
</p>

<p align="center">
  <a href="#-inicio-rapido">Inicio Rapido</a> &bull;
  <a href="#-funcionalidades">Funcionalidades</a> &bull;
  <a href="#-arquitetura">Arquitetura</a> &bull;
  <a href="#-smart-contract">Smart Contract</a> &bull;
  <a href="#-pagamentos--marketplace">Pagamentos</a> &bull;
  <a href="#-temas">Temas</a> &bull;
  <a href="#-multi-node">Multi-Node</a> &bull;
  <a href="#-contribuindo">Contribuindo</a>
</p>

---

## Por que IotaPolis?

Forums tradicionais dependem de um servidor central que pode ser derrubado, censurado ou comprometido. O **IotaPolis** armazena cada dado na blockchain IOTA 2.0 como eventos de smart contracts Move. O servidor local e apenas um cache — a blockchain e a fonte da verdade.

- **Descentralizacao real** — Cada usuario tem sua propria carteira IOTA (Ed25519). O servidor nunca detem chaves privadas
- **Sem ponto unico de falha** — Qualquer no pode reconstruir o forum inteiro a partir dos eventos on-chain
- **Historico imutavel** — Cada post, edicao e voto e registrado permanentemente com um digest de transacao
- **Permissoes on-chain** — Roles (Usuario, Moderador, Admin) aplicadas pelo smart contract, nao pelo servidor
- **Economia integrada** — Gorjetas, assinaturas, conteudo pago, badges e escrow — tudo on-chain
- **Zero taxas na testnet** — A testnet IOTA 2.0 Rebased fornece gas gratuito via faucet automatico

---

## Inicio Rapido

```bash
# Clonar
git clone https://github.com/deduzzo/iotapolis.git
cd iotapolis

# Instalar dependencias
npm install
cd frontend && npm install && cd ..

# Primeira execucao — gera carteira do servidor + configuracao
npm run dev
# Aguarde "Sails lifted", depois Ctrl+C

# Deploy do smart contract Move na testnet IOTA
npm run move:deploy

# Iniciar o forum
npm run dev
```

Abra `http://localhost:5173` — crie uma carteira, obtenha gas do faucet, registre um nome de usuario e comece a postar.

> Veja [DEPLOY.md](DEPLOY.md) para deploy em producao, redes customizadas e configuracao avancada.

---

## Funcionalidades

### Forum Principal

| Funcionalidade | Descricao |
|----------------|-----------|
| **Posts on-chain** | Cada topico, post, resposta, voto e edicao e um evento Move na IOTA 2.0 |
| **Roles via smart contract** | Sistema de permissoes de 4 niveis (Banido/Usuario/Moderador/Admin) aplicado pelos validadores |
| **Identidade via carteira IOTA** | Par de chaves Ed25519 com mnemonic BIP39. Criptografado com senha no navegador. Sem necessidade de contas |
| **Assinatura direta** | Usuarios assinam transacoes diretamente na blockchain — o servidor nunca toca nas chaves privadas |
| **Versionamento imutavel** | Historico de edicoes armazenado on-chain. Cada versao tem um TX digest no IOTA Explorer |
| **Respostas aninhadas** | Discussoes em arvore com profundidade ilimitada |
| **Sistema de votacao** | Upvote/downvote em posts. Pontuacoes calculadas a partir de eventos de voto on-chain |
| **Busca textual completa** | Indice SQLite FTS5 reconstruido a partir dos dados da blockchain |
| **8 idiomas** | IT, EN, ES, DE, FR, PT, JA, ZH com react-i18next |
| **String de conexao** | Compartilhe seu forum com `testnet:PACKAGE_ID:FORUM_OBJECT_ID` — qualquer um pode participar |

### Pagamentos e Marketplace

| Funcionalidade | Descricao |
|----------------|-----------|
| **Gorjetas** | Envie IOTA diretamente para autores de posts. Valores predefinidos + personalizado. Tudo on-chain |
| **Assinaturas** | Planos escalonados (Free/Pro/Premium) com precos e duracoes configuraveis |
| **Conteudo pago** | Autores definem um preco para topicos. Criptografado com AES-256, chave entregue apos pagamento |
| **Categorias premium** | Admin restringe acesso a categorias para assinantes de um determinado plano |
| **Badges** | Badges compraveis configuraveis pelo admin, exibidos ao lado dos nomes de usuario |
| **Escrow (multi-sig)** | Escrow 2-de-3 para servicos: comprador + vendedor + arbitrador. Fundos bloqueados on-chain |
| **Reputacao** | Avaliacoes on-chain (1-5 estrelas) apos resolucao de escrow. Historico de negociacoes imutavel |
| **Marketplace** | Navegue por conteudo pago, servicos e badges em uma pagina dedicada |
| **Tesouro** | Forum coleta taxas (5% marketplace, 2% escrow) para o tesouro do smart contract |

### Editor

| Funcionalidade | Descricao |
|----------------|-----------|
| **Editor WYSIWYG rico** | Baseado em Tiptap com barra de ferramentas completa |
| **Saida em Markdown** | Serializa para markdown limpo via `tiptap-markdown` |
| **Formatacao** | Negrito, italico, tachado, titulos, citacao, linha horizontal |
| **Codigo** | Codigo inline + blocos de codigo com syntax highlighting |
| **Tabelas** | Insira e edite tabelas diretamente |
| **Imagens** | Insira via URL |
| **Emoji** | Seletor de emoji (emoji-mart) |
| **@Mencoes** | Busque e mencione usuarios |

### Temas

7 temas integrados com selecao por usuario:

| Tema | Estilo | Layout |
|------|--------|--------|
| **Neon Cyber** | Escuro, glassmorphism, brilho neon ciano | Grid de cards |
| **Clean Minimal** | Claro, minimalista, acento azul | Grid de cards |
| **Dark Pro** | Escuro, profissional, acento verde | Grid de cards |
| **Retro Terminal** | Escuro, monoespaco, neon verde | Grid de cards |
| **Invision Light** | Forum classico, branco, acento azul | Layout de tabela IPB |
| **Invision Dark** | Forum classico, cinza escuro, acento azul | Layout de tabela IPB |
| **Material Ocean** | Material Design, azul marinho, acento teal | Grid de cards |

### Sincronizacao em Tempo Real

| Funcionalidade | Descricao |
|----------------|-----------|
| **Atualizacoes WebSocket** | Eventos granulares `dataChanged` enviam atualizacoes para componentes especificos da UI |
| **UI otimista** | Posts/votos aparecem instantaneamente, confirmados de forma assincrona |
| **Polling da blockchain** | A cada 30s consulta novos eventos on-chain |
| **IOTA subscribeEvent** | Inscricao nativa em eventos da blockchain (~2s de latencia) |
| **Sincronizacao cross-node** | Multiplos servidores se mantem sincronizados via eventos da blockchain |

---

## Arquitetura

```
Navegador (React 19 + Vite 6 + TailwindCSS 4)
  |
  |-- Carteira IOTA Ed25519 (derivada de mnemonic, criptografada com AES no localStorage)
  |-- Assina e executa transacoes DIRETAMENTE na blockchain
  |-- Editor WYSIWYG rico (Tiptap) -> markdown
  |-- Motor de temas (7 presets, variaveis CSS)
  |-- Pagina da carteira: saldo, gorjetas, assinaturas, escrow
  |
  |  API REST (cache somente leitura) + WebSocket Socket.io
  v
Servidor (Sails.js + Node.js) — APENAS INDEXADOR
  |
  |-- Indexa eventos da blockchain no cache SQLite
  |-- Faucet: envia gas para novos usuarios (testnet)
  |-- Serve dados em cache via REST para consultas rapidas
  |-- Broadcast via WebSocket a cada mudanca de estado
  |-- Polling da blockchain a cada 30s para sincronizacao cross-node
  |-- NAO assina ou publica transacoes para usuarios
  |
  v
Smart Contract Move (on-chain, imutavel)
  |
  |-- Forum (compartilhado): registro de usuarios, roles, assinaturas, badges, reputacao, tesouro
  |-- Escrow (objetos compartilhados): gestao de fundos multi-sig 2-de-3
  |-- AdminCap (owned): capability do deployer
  |-- 20+ funcoes de entrada com acesso controlado por role
  |-- Emite eventos para cada operacao (payloads JSON comprimidos com gzip)
  |-- Gerencia todos os pagamentos: gorjetas, assinaturas, compras, escrow
  |
  v
IOTA 2.0 Rebased (fonte da verdade)
  |
  |-- Eventos consultaveis por Package ID
  |-- Todos os nos veem os mesmos dados
  |-- Zero taxas na testnet
```

### Fluxo de Dados

```
Usuario digita um post
  -> Editor Tiptap serializa para markdown
  -> Frontend comprime o payload JSON com gzip
  -> Par de chaves Ed25519 do usuario assina a transacao
  -> Transacao executada diretamente na blockchain IOTA
  -> Smart contract verifica role (USER >= 1), emite ForumEvent
  -> Backend detecta evento via polling/subscribe
  -> Atualiza cache SQLite local
  -> Faz broadcast de 'dataChanged' via WebSocket
  -> Todos os clientes conectados atualizam sua UI
```

---

## Smart Contract

O smart contract Move (`move/forum/sources/forum.move`) e a espinha dorsal de seguranca. Todas as permissoes e pagamentos sao aplicados pelos validadores IOTA, nao pelo servidor.

### Sistema de Roles

| Nivel | Role | Permissoes |
|-------|------|------------|
| 0 | **BANIDO** | Todas as operacoes rejeitadas pelos validadores |
| 1 | **USUARIO** | Postar, responder, votar, editar proprio conteudo, dar gorjeta, assinar, comprar |
| 2 | **MODERADOR** | + Criar categorias, moderar conteudo, banir/desbanir, arbitrar escrow |
| 3 | **ADMIN** | + Configuracao do forum, gestao de roles, configurar planos/badges, sacar do tesouro |

### Funcoes de Entrada

**Forum (base):**

| Funcao | Role Minima | Finalidade |
|--------|-------------|------------|
| `register()` | Nenhuma | Registro unico, atribui ROLE_USER |
| `post_event()` | USER | Topicos, posts, respostas, votos |
| `mod_post_event()` | MODERATOR | Categorias, acoes de moderacao |
| `admin_post_event()` | ADMIN | Configuracao do forum, alteracao de roles |
| `set_user_role()` | MODERATOR | Alterar roles de usuarios (com restricoes) |

**Pagamentos:**

| Funcao | Role Minima | Finalidade |
|--------|-------------|------------|
| `tip()` | USER | Enviar IOTA para o autor de um post |
| `subscribe()` | USER | Assinar um plano |
| `renew_subscription()` | USER | Renovar assinatura existente |
| `purchase_content()` | USER | Comprar acesso a conteudo pago |
| `purchase_badge()` | USER | Comprar um badge |
| `configure_tier()` | ADMIN | Adicionar/editar planos de assinatura |
| `configure_badge()` | ADMIN | Adicionar/editar badges |
| `withdraw_funds()` | ADMIN | Sacar do tesouro do forum |

**Escrow:**

| Funcao | Quem | Finalidade |
|--------|------|------------|
| `create_escrow()` | Comprador | Bloquear fundos em escrow (multi-sig 2-de-3) |
| `mark_delivered()` | Vendedor | Marcar servico como entregue |
| `open_dispute()` | Comprador | Abrir uma disputa |
| `vote_release()` | Qualquer parte | Votar para liberar fundos ao vendedor |
| `vote_refund()` | Qualquer parte | Votar para reembolsar o comprador |
| `rate_trade()` | Comprador/Vendedor | Avaliar a outra parte (1-5 estrelas) |

### Seguranca

- Cada usuario assina com seu proprio par de chaves Ed25519 — `ctx.sender()` verificado pelos validadores IOTA
- O servidor nunca detem chaves privadas dos usuarios
- Escrow usa votacao 2-de-3 com validacao cruzada (nao e possivel votar em ambos os lados)
- Pagamentos excessivos sao reembolsados automaticamente (troco exato devolvido)
- Aplicacao de prazo nas operacoes de escrow
- Usuarios banidos sao rejeitados no nivel do contrato
- Nao e possivel promover acima do proprio role, nem modificar usuarios de role igual ou superior

---

## Pagamentos e Marketplace

### Gorjetas

Clique no botao de gorjeta em qualquer post para enviar IOTA diretamente ao autor. Escolha entre valores predefinidos (0.1, 0.5, 1.0 IOTA) ou insira um valor personalizado. Gorjetas sao instantaneas, on-chain, sem intermediarios.

### Assinaturas

Admins configuram planos de assinatura com preco e duracao. Usuarios assinam pagando o preco do plano. O smart contract gerencia automaticamente a expiracao e o controle de acesso.

### Conteudo Pago

Autores podem definir um preco para seus topicos. O conteudo e criptografado com AES-256. Apos o pagamento (on-chain), o comprador recebe a chave de descriptografia. 5% de taxa vai para o tesouro do forum.

### Escrow

Para servicos entre usuarios, o comprador bloqueia fundos em um escrow on-chain. Tres partes (comprador, vendedor, arbitrador) formam um multi-sig 2-de-3. Quaisquer dois podem liberar ou reembolsar os fundos. 2% de taxa para o tesouro do forum na resolucao.

### Reputacao

Apos cada resolucao de escrow, ambas as partes podem deixar uma avaliacao (1-5 estrelas + comentario). Avaliacoes sao imutaveis on-chain. Perfis de usuario exibem avaliacao media, numero de negociacoes, taxa de sucesso e volume.

---

## Multi-Node

O IotaPolis suporta multiplos nos independentes conectados ao mesmo smart contract. Cada no:

1. Executa seu proprio servidor Sails.js + frontend React
2. Tem seu proprio cache SQLite (reconstruivel)
3. Usuarios assinam transacoes diretamente on-chain
4. Sincroniza a partir da blockchain a cada 30 segundos

### Conectando a um Forum Existente

```bash
# Iniciar o servidor
npm run dev

# No navegador: va em Setup -> "Conectar a forum existente"
# Cole a string de conexao: testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
# O sistema sincroniza todos os eventos da blockchain
```

---

## Stack Tecnologica

| Camada | Tecnologia | Versao |
|--------|------------|--------|
| **Blockchain** | IOTA 2.0 Rebased | Testnet |
| **Smart Contract** | Move (IOTA MoveVM) | — |
| **SDK** | @iota/iota-sdk | Mais recente |
| **Backend** | Sails.js | 1.5 |
| **Runtime** | Node.js | >= 18 |
| **Banco de dados** | better-sqlite3 (cache) | Mais recente |
| **Frontend** | React | 19 |
| **Bundler** | Vite | 6 |
| **CSS** | TailwindCSS | 4 |
| **Animacoes** | Framer Motion | 12 |
| **Editor** | Tiptap (ProseMirror) | 3 |
| **Icones** | Lucide React | Mais recente |
| **Tempo real** | Socket.io | 2 |
| **i18n** | react-i18next | 8 idiomas |
| **Desktop** | Electron + electron-builder | 33 |
| **Criptografia** | Ed25519 (nativo IOTA) + AES-256-GCM + BIP39 | — |

---

## Aplicativo Desktop (Electron)

Disponivel como aplicativo desktop independente para Windows, macOS e Linux. O servidor roda embutido dentro do aplicativo.

### Download

Baixe a versao mais recente em [GitHub Releases](https://github.com/deduzzo/iotapolis/releases):

| Plataforma | Arquivo | Atualizacao automatica |
|------------|---------|------------------------|
| **Windows** | Instalador `.exe` | Sim |
| **macOS** | `.dmg` | Sim |
| **Linux** | `.AppImage` | Sim |

---

## Comandos

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Iniciar backend + frontend em desenvolvimento |
| `npm start` | Iniciar em modo producao (porta unica 1337) |
| `npm run build` | Build do frontend para producao |
| `npm run move:build` | Compilar o smart contract Move |
| `npm run move:deploy` | Compilar + deploy do contrato na testnet IOTA |
| `npm run desktop:dev` | Executar Electron em modo desenvolvimento |
| `npm run desktop:build` | Build do aplicativo desktop para a plataforma atual |
| `npm run release` | Script interativo de release |

---

## Endpoints da API

### Publicos (cache somente leitura)

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| GET | `/api/v1/categories` | Listar todas as categorias com estatisticas |
| GET | `/api/v1/threads?category=ID&page=N` | Listar topicos em uma categoria |
| GET | `/api/v1/thread/:id` | Detalhes do topico com todos os posts |
| GET | `/api/v1/posts?thread=ID` | Posts de um topico |
| GET | `/api/v1/user/:id` | Perfil do usuario + reputacao + badges |
| GET | `/api/v1/user/:id/reputation` | Reputacao de negociacoes do usuario |
| GET | `/api/v1/user/:id/subscription` | Status da assinatura do usuario |
| GET | `/api/v1/search?q=QUERY` | Busca textual completa |
| GET | `/api/v1/dashboard` | Estatisticas do forum + pagamentos |
| GET | `/api/v1/marketplace` | Conteudo pago, badges, melhores vendedores |
| GET | `/api/v1/escrows` | Lista de escrows (filtravel) |
| GET | `/api/v1/escrow/:id` | Detalhes do escrow com avaliacoes |
| GET | `/api/v1/tips/:postId` | Gorjetas em um post especifico |
| GET | `/api/v1/forum-info` | Metadados do forum + string de conexao |

### Acoes do servidor

| Metodo | Endpoint | Descricao |
|--------|----------|-----------|
| POST | `/api/v1/faucet-request` | Solicitar gas para um novo endereco (com limite de taxa) |
| POST | `/api/v1/full-reset` | Reset completo (requer assinatura de admin) |
| POST | `/api/v1/sync-reset` | Reset do cache + ressincronizacao (requer assinatura de admin) |

Todas as operacoes de escrita (posts, votos, moderacao, pagamentos, escrow) sao executadas diretamente na blockchain IOTA pela carteira do usuario. O servidor e um indexador somente leitura.

---

## Como a Identidade Funciona

1. **Gerar** — O navegador cria um par de chaves Ed25519 a partir de um mnemonic BIP39 (12 palavras)
2. **Criptografar** — Mnemonic criptografado com a senha do usuario (AES-256-GCM + PBKDF2) e armazenado no localStorage
3. **Faucet** — Backend envia gas IOTA para o novo endereco (testnet)
4. **Registrar** — Usuario chama `register()` no contrato Move diretamente
5. **Assinar** — Cada acao (post, voto, gorjeta, escrow) e uma transacao assinada com a chave Ed25519 do usuario
6. **Verificar** — `ctx.sender()` verificado pelos validadores IOTA no nivel do protocolo
7. **Backup** — Usuarios exportam seu mnemonic de 12 palavras para restaurar em qualquer dispositivo

Sem senhas no servidor. Sem emails. Sem contas. Sua carteira e sua identidade.

---

## Contribuindo

Contribuicoes sao bem-vindas! Este projeto esta em desenvolvimento ativo.

1. Faca um fork do repositorio
2. Crie um branch de funcionalidade: `git checkout -b feature/funcionalidade-incrivel`
3. Faca suas alteracoes
4. Execute `npm run dev` e teste localmente
5. Commit: `git commit -m 'feat: adicionar funcionalidade incrivel'`
6. Push: `git push origin feature/funcionalidade-incrivel`
7. Abra um Pull Request

---

## Licenca

Licenca MIT. Veja [LICENSE](LICENSE) para detalhes.

---

<p align="center">
  <strong>Construido sobre IOTA 2.0 Rebased</strong><br/>
  <em>Cada post e uma transacao. Cada permissao e um smart contract. Cada usuario e uma carteira.</em>
</p>
