🌍 [English](README.md) | [Italiano](README.it.md) | [Español](README.es.md) | [Français](README.fr.md) | [Deutsch](README.de.md) | [Português](README.pt.md) | [中文](README.zh.md) | [日本語](README.ja.md)

<p align="center">
  <img src="https://img.shields.io/badge/IOTA-2.0_Rebased-00f0ff?style=for-the-badge&logo=iota&logoColor=white" alt="IOTA 2.0" />
  <img src="https://img.shields.io/badge/Smart_Contract-Move-8B5CF6?style=for-the-badge" alt="Move" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT" />
</p>

<h1 align="center">IotaPolis</h1>

<p align="center">
  <strong>基于 IOTA 2.0 和 Move 智能合约构建的完全去中心化社区平台，集成支付、交易市场和托管功能。</strong><br/>
  每一篇帖子都上链。每个用户都用自己的钱包签名。每笔支付都无需信任。
</p>

<p align="center">
  <a href="#-快速开始">快速开始</a> &bull;
  <a href="#-功能特性">功能特性</a> &bull;
  <a href="#-系统架构">系统架构</a> &bull;
  <a href="#-智能合约">智能合约</a> &bull;
  <a href="#-支付与交易市场">支付</a> &bull;
  <a href="#-主题">主题</a> &bull;
  <a href="#-多节点">多节点</a> &bull;
  <a href="#-参与贡献">参与贡献</a>
</p>

---

## 为什么选择 IotaPolis？

传统论坛依赖中心化服务器，面临关停、审查或被攻破的风险。**IotaPolis** 将所有数据以 Move 智能合约事件的形式存储在 IOTA 2.0 区块链上。本地服务器只是缓存——区块链才是唯一的数据源。

- **真正的去中心化** — 每个用户拥有独立的 IOTA 钱包（Ed25519）。服务器不持有任何私钥
- **无单点故障** — 任何节点都可以从链上事件重建完整论坛
- **不可篡改的历史** — 每篇帖子、编辑和投票都以交易摘要永久记录
- **链上权限管理** — 角色（用户、版主、管理员）由智能合约执行，而非服务器
- **内置经济系统** — 打赏、订阅、付费内容、徽章、托管——全部上链
- **测试网零手续费** — IOTA 2.0 Rebased 测试网通过自动水龙头提供免费 Gas

---

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/deduzzo/iotapolis.git
cd iotapolis

# 安装依赖
npm install
cd frontend && npm install && cd ..

# 首次运行 — 生成服务器钱包和配置
npm run dev
# 等待 "Sails lifted" 提示后按 Ctrl+C

# 将 Move 智能合约部署到 IOTA 测试网
npm run move:deploy

# 启动论坛
npm run dev
```

打开 `http://localhost:5173` — 创建钱包、从水龙头获取 Gas、注册用户名，即可开始发帖。

> 详见 [DEPLOY.md](DEPLOY.md) 了解生产部署、自定义网络和高级配置。

---

## 功能特性

### 核心论坛

| 功能 | 说明 |
|------|------|
| **链上帖子** | 每个主题、帖子、回复、投票和编辑都是 IOTA 2.0 上的 Move 事件 |
| **智能合约角色** | 四级权限体系（封禁/用户/版主/管理员），由验证节点强制执行 |
| **IOTA 钱包身份** | Ed25519 密钥对 + BIP39 助记词。在浏览器中加密存储，无需注册账号 |
| **直接签名** | 用户直接在区块链上签名交易——服务器绝不接触私钥 |
| **不可变版本记录** | 编辑历史存储在链上。每个版本都有可在 IOTA 浏览器查看的交易摘要 |
| **嵌套回复** | 支持无限深度嵌套的串联式讨论 |
| **投票系统** | 帖子支持赞/踩。分数根据链上投票事件计算 |
| **全文搜索** | 基于区块链数据重建的 SQLite FTS5 索引 |
| **8 种语言** | 中文、英语、意大利语、西班牙语、德语、法语、葡萄牙语、日语，使用 react-i18next |
| **连接字符串** | 通过 `testnet:PACKAGE_ID:FORUM_OBJECT_ID` 分享你的论坛——任何人都可以加入 |

### 支付与交易市场

| 功能 | 说明 |
|------|------|
| **打赏** | 直接向帖子作者发送 IOTA。预设金额 + 自定义金额，全部上链 |
| **订阅** | 分级方案（免费/专业/高级），可配置价格和时长 |
| **付费内容** | 作者为主题设定价格。AES-256 加密，付款后交付密钥 |
| **高级分类** | 管理员可限制特定分类仅对指定等级的订阅者可见 |
| **徽章** | 管理员可配置的可购买徽章，显示在用户名旁边 |
| **托管（多签）** | 2-of-3 多签托管服务：买方 + 卖方 + 仲裁者。资金锁定在链上 |
| **信誉** | 托管结算后的链上评分（1-5 星）。不可篡改的交易历史 |
| **交易市场** | 在专属页面浏览付费内容、服务和徽章 |
| **国库** | 论坛通过智能合约国库收取手续费（交易市场 5%，托管 2%） |

### 编辑器

| 功能 | 说明 |
|------|------|
| **富文本所见即所得编辑器** | 基于 Tiptap 的完整工具栏 |
| **Markdown 输出** | 通过 `tiptap-markdown` 序列化为规范的 Markdown |
| **格式** | 粗体、斜体、删除线、标题、引用、分隔线 |
| **代码** | 行内代码 + 带语法高亮的代码块 |
| **表格** | 直接插入和编辑表格 |
| **图片** | 通过 URL 插入 |
| **表情** | 表情选择器（emoji-mart） |
| **@提及** | 搜索和提及用户 |

### 主题

7 个内置主题，支持按用户选择：

| 主题 | 风格 | 布局 |
|------|------|------|
| **Neon Cyber** | 深色、毛玻璃效果、青色霓虹光效 | 卡片网格 |
| **Clean Minimal** | 浅色、极简、蓝色强调 | 卡片网格 |
| **Dark Pro** | 深色、专业、绿色强调 | 卡片网格 |
| **Retro Terminal** | 深色、等宽字体、绿色霓虹 | 卡片网格 |
| **Invision Light** | 经典论坛、白色、蓝色强调 | IPB 表格布局 |
| **Invision Dark** | 经典论坛、深灰、蓝色强调 | IPB 表格布局 |
| **Material Ocean** | Material Design、深海蓝、青色强调 | 卡片网格 |

### 实时同步

| 功能 | 说明 |
|------|------|
| **WebSocket 更新** | 细粒度的 `dataChanged` 事件推送更新到具体 UI 组件 |
| **乐观 UI** | 帖子/投票即时显示，异步确认 |
| **区块链轮询** | 每 30 秒轮询链上新事件 |
| **IOTA subscribeEvent** | 原生区块链事件订阅（约 2 秒延迟） |
| **跨节点同步** | 多个服务器通过区块链事件保持同步 |

---

## 系统架构

```
浏览器 (React 19 + Vite 6 + TailwindCSS 4)
  |
  |-- IOTA Ed25519 钱包（助记词派生，AES 加密存储在 localStorage）
  |-- 直接在区块链上签名并执行交易
  |-- 富文本所见即所得编辑器 (Tiptap) -> markdown
  |-- 主题引擎（7 套预设，CSS 变量）
  |-- 钱包页面：余额、打赏、订阅、托管
  |
  |  REST API（只读缓存）+ Socket.io WebSocket
  v
服务器 (Sails.js + Node.js) — 仅作为索引器
  |
  |-- 将区块链事件索引到 SQLite 缓存
  |-- 水龙头：为新用户发送 Gas（测试网）
  |-- 通过 REST 提供缓存数据以实现快速查询
  |-- 每次状态变更通过 WebSocket 广播
  |-- 每 30 秒区块链轮询，实现跨节点同步
  |-- 不为用户签名或发布交易
  |
  v
Move 智能合约（链上，不可变）
  |
  |-- Forum（共享对象）：用户注册、角色、订阅、徽章、信誉、国库
  |-- Escrow（共享对象）：多签 2-of-3 资金管理
  |-- AdminCap（所有权对象）：部署者能力
  |-- 20+ 入口函数，角色权限控制
  |-- 为每个操作发出事件（gzip 压缩的 JSON 载荷）
  |-- 处理所有支付：打赏、订阅、购买、托管
  |
  v
IOTA 2.0 Rebased（数据源）
  |
  |-- 通过 Package ID 查询事件
  |-- 所有节点看到相同的数据
  |-- 测试网零手续费
```

### 数据流

```
用户编写帖子
  -> Tiptap 编辑器序列化为 markdown
  -> 前端 gzip 压缩 JSON 载荷
  -> 用户的 Ed25519 密钥对签名交易
  -> 交易直接在 IOTA 区块链上执行
  -> 智能合约检查角色（USER >= 1），发出 ForumEvent
  -> 后端通过轮询/订阅检测事件
  -> 更新本地 SQLite 缓存
  -> 通过 WebSocket 广播 'dataChanged'
  -> 所有连接的客户端更新界面
```

---

## 智能合约

Move 智能合约（`move/forum/sources/forum.move`）是安全体系的核心。所有权限和支付都由 IOTA 验证节点执行，而非服务器。

### 角色系统

| 等级 | 角色 | 权限 |
|------|------|------|
| 0 | **封禁** | 所有操作被验证节点拒绝 |
| 1 | **用户** | 发帖、回复、投票、编辑自己的内容、打赏、订阅、购买 |
| 2 | **版主** | + 创建分类、管理内容、封禁/解封、仲裁托管 |
| 3 | **管理员** | + 论坛配置、角色管理、配置等级/徽章、提取国库资金 |

### 入口函数

**论坛（基础）：**

| 函数 | 最低角色 | 用途 |
|------|----------|------|
| `register()` | 无 | 一次性注册，分配 ROLE_USER |
| `post_event()` | 用户 | 主题、帖子、回复、投票 |
| `mod_post_event()` | 版主 | 分类、管理操作 |
| `admin_post_event()` | 管理员 | 论坛配置、角色变更 |
| `set_user_role()` | 版主 | 更改用户角色（有约束限制） |

**支付：**

| 函数 | 最低角色 | 用途 |
|------|----------|------|
| `tip()` | 用户 | 向帖子作者发送 IOTA |
| `subscribe()` | 用户 | 订阅某一等级 |
| `renew_subscription()` | 用户 | 续费现有订阅 |
| `purchase_content()` | 用户 | 购买付费内容的访问权 |
| `purchase_badge()` | 用户 | 购买徽章 |
| `configure_tier()` | 管理员 | 添加/编辑订阅等级 |
| `configure_badge()` | 管理员 | 添加/编辑徽章 |
| `withdraw_funds()` | 管理员 | 从论坛国库提款 |

**托管：**

| 函数 | 调用方 | 用途 |
|------|--------|------|
| `create_escrow()` | 买方 | 将资金锁定在托管中（2-of-3 多签） |
| `mark_delivered()` | 卖方 | 标记服务已交付 |
| `open_dispute()` | 买方 | 发起争议 |
| `vote_release()` | 任一方 | 投票释放资金给卖方 |
| `vote_refund()` | 任一方 | 投票退款给买方 |
| `rate_trade()` | 买方/卖方 | 为对方评分（1-5 星） |

### 安全性

- 每个用户使用自己的 Ed25519 密钥对签名 — `ctx.sender()` 由 IOTA 验证节点验证
- 服务器不持有用户私钥
- 托管使用交叉验证的 2-of-3 投票（不能同时投两方）
- 超额支付自动退还（精确找零）
- 托管操作的截止日期强制执行
- 被封禁用户在合约层面即被拒绝
- 不能提升到高于自己的角色，不能修改同级或更高级别的用户

---

## 支付与交易市场

### 打赏

点击任意帖子上的打赏按钮，直接向作者发送 IOTA。可选择预设金额（0.1、0.5、1.0 IOTA）或输入自定义金额。打赏即时到账、链上记录、零中介。

### 订阅

管理员配置带有价格和时长的订阅等级。用户支付相应等级的价格即可订阅。智能合约自动管理过期和访问控制。

### 付费内容

作者可以为主题设定价格。内容使用 AES-256 加密。付款（链上）后，买方收到解密密钥。5% 手续费进入论坛国库。

### 托管

用户之间的服务交易中，买方将资金锁定在链上托管中。三方（买方、卖方、仲裁者）组成 2-of-3 多签。任意两方可以释放或退回资金。结算时收取 2% 手续费进入论坛国库。

### 信誉

每次托管结算后，双方都可以留下评分（1-5 星 + 评语）。评分在链上不可篡改。用户资料页展示平均评分、交易次数、成功率和交易量。

---

## 多节点

IotaPolis 支持多个独立节点连接同一个智能合约。每个节点：

1. 运行自己的 Sails.js 服务器 + React 前端
2. 拥有自己的 SQLite 缓存（可重建）
3. 用户直接在链上签名交易
4. 每 30 秒从区块链同步

### 加入现有论坛

```bash
# 启动服务器
npm run dev

# 在浏览器中：进入 Setup -> "连接到现有论坛"
# 粘贴连接字符串：testnet:0xPACKAGE_ID:0xFORUM_OBJECT_ID
# 系统将从区块链同步所有事件
```

---

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| **区块链** | IOTA 2.0 Rebased | Testnet |
| **智能合约** | Move (IOTA MoveVM) | — |
| **SDK** | @iota/iota-sdk | 最新版 |
| **后端** | Sails.js | 1.5 |
| **运行时** | Node.js | >= 18 |
| **数据库** | better-sqlite3（缓存） | 最新版 |
| **前端** | React | 19 |
| **打包器** | Vite | 6 |
| **CSS** | TailwindCSS | 4 |
| **动画** | Framer Motion | 12 |
| **编辑器** | Tiptap (ProseMirror) | 3 |
| **图标** | Lucide React | 最新版 |
| **实时通信** | Socket.io | 2 |
| **国际化** | react-i18next | 8 种语言 |
| **桌面端** | Electron + electron-builder | 33 |
| **加密** | Ed25519 (IOTA 原生) + AES-256-GCM + BIP39 | — |

---

## 桌面应用 (Electron)

提供 Windows、macOS 和 Linux 的独立桌面应用程序。服务器内嵌在应用中运行。

### 下载

从 [GitHub Releases](https://github.com/deduzzo/iotapolis/releases) 下载最新版本：

| 平台 | 文件 | 自动更新 |
|------|------|----------|
| **Windows** | `.exe` 安装程序 | 支持 |
| **macOS** | `.dmg` | 支持 |
| **Linux** | `.AppImage` | 支持 |

---

## 命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 以开发模式启动后端 + 前端 |
| `npm start` | 以生产模式启动（单端口 1337） |
| `npm run build` | 构建前端用于生产环境 |
| `npm run move:build` | 编译 Move 智能合约 |
| `npm run move:deploy` | 编译并部署合约到 IOTA 测试网 |
| `npm run desktop:dev` | 以开发模式运行 Electron |
| `npm run desktop:build` | 为当前平台构建桌面应用 |
| `npm run release` | 交互式发布脚本 |

---

## API 端点

### 公开（只读缓存）

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/v1/categories` | 列出所有分类及统计信息 |
| GET | `/api/v1/threads?category=ID&page=N` | 列出某分类下的主题 |
| GET | `/api/v1/thread/:id` | 主题详情及所有帖子 |
| GET | `/api/v1/posts?thread=ID` | 某主题的帖子 |
| GET | `/api/v1/user/:id` | 用户资料 + 信誉 + 徽章 |
| GET | `/api/v1/user/:id/reputation` | 用户交易信誉 |
| GET | `/api/v1/user/:id/subscription` | 用户订阅状态 |
| GET | `/api/v1/search?q=QUERY` | 全文搜索 |
| GET | `/api/v1/dashboard` | 论坛 + 支付统计 |
| GET | `/api/v1/marketplace` | 付费内容、徽章、热门卖家 |
| GET | `/api/v1/escrows` | 托管列表（可筛选） |
| GET | `/api/v1/escrow/:id` | 托管详情及评分 |
| GET | `/api/v1/tips/:postId` | 特定帖子的打赏记录 |
| GET | `/api/v1/forum-info` | 论坛元数据 + 连接字符串 |

### 服务器操作

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/v1/faucet-request` | 为新地址请求 Gas（频率限制） |
| POST | `/api/v1/full-reset` | 完全重置（需管理员签名） |
| POST | `/api/v1/sync-reset` | 缓存重置 + 重新同步（需管理员签名） |

所有写操作（帖子、投票、管理、支付、托管）均由用户钱包直接在 IOTA 区块链上执行。服务器是只读索引器。

---

## 身份认证机制

1. **生成** — 浏览器从 BIP39 助记词（12 个单词）创建 Ed25519 密钥对
2. **加密** — 助记词使用用户密码（AES-256-GCM + PBKDF2）加密并存储在 localStorage
3. **水龙头** — 后端向新地址发送 Gas IOTA（测试网）
4. **注册** — 用户直接调用 Move 合约的 `register()`
5. **签名** — 每个操作（发帖、投票、打赏、托管）都是用户 Ed25519 密钥签名的交易
6. **验证** — `ctx.sender()` 由 IOTA 验证节点在协议层面验证
7. **备份** — 用户导出 12 个助记词即可在任何设备上恢复

服务器上没有密码、没有邮箱、没有账号。你的钱包就是你的身份。

---

## 参与贡献

欢迎贡献代码！本项目正在积极开发中。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 进行更改
4. 运行 `npm run dev` 并在本地测试
5. 提交：`git commit -m 'feat: add amazing feature'`
6. 推送：`git push origin feature/amazing-feature`
7. 提交 Pull Request

---

## 许可证

MIT 许可证。详见 [LICENSE](LICENSE)。

---

<p align="center">
  <strong>基于 IOTA 2.0 Rebased 构建</strong><br/>
  <em>每篇帖子都是一笔交易。每个权限都是一个智能合约。每个用户都是一个钱包。</em>
</p>
