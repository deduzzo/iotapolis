module.exports.routes = {
  // =====================================================================
  // READ endpoints (unchanged — serve cached data from SQLite)
  // =====================================================================
  'GET /api/v1/members': { action: 'api-users' },
  'GET /api/v1/user/:id': { action: 'api-user' },
  'GET /api/v1/categories': { action: 'api-categories' },
  'GET /api/v1/threads': { action: 'api-threads' },
  'GET /api/v1/thread/:id': { action: 'api-thread-detail' },
  'GET /api/v1/posts': { action: 'api-posts' },
  'GET /api/v1/post/:id/history': { action: 'post-history' },
  'GET /api/v1/thread/:id/history': { action: 'thread-history' },
  'GET /api/v1/user/:id/history': { action: 'user-history' },
  'GET /api/v1/config/theme': { action: 'api-config-theme' },
  'GET /api/v1/config/theme/history': { action: 'config-theme-history' },
  'GET /api/v1/search': { action: 'api-search' },
  'GET /api/v1/dashboard': { action: 'api-dashboard' },
  'GET /api/v1/sync-status': { action: 'api-sync-status' },
  'GET /api/v1/export-data': { action: 'export-data' },
  'GET /api/v1/forum-info': { action: 'api-forum-info' },
  'GET /api/v1/integrity-check': { action: 'api-integrity-check' },

  // =====================================================================
  // NEW endpoints — payments, marketplace, reputation
  // =====================================================================
  'POST /api/v1/faucet-request': { action: 'faucet-request' },
  'POST /api/v1/deploy-contract': { action: 'deploy-contract' },
  'GET /api/v1/user/:id/reputation': { action: 'api-reputation' },
  'GET /api/v1/user/:id/subscription': { action: 'api-subscription' },
  'GET /api/v1/escrows': { action: 'api-escrows' },
  'GET /api/v1/escrow/:id': { action: 'api-escrow' },
  'GET /api/v1/marketplace': { action: 'api-marketplace' },
  'GET /api/v1/tips/:postId': { action: 'api-tips' },

  // =====================================================================
  // ADMIN endpoints (require admin authentication)
  // =====================================================================
  'POST /api/v1/sync-reset': { action: 'api-sync-reset' },
  'POST /api/v1/sync-connect': { action: 'sync-connect' },
  'POST /api/v1/full-reset': { action: 'full-reset' },

  // =====================================================================
  // DEPRECATED write endpoints — now return 410 Gone
  // All write operations happen directly on-chain via IOTA smart contract.
  // These are kept for backward compatibility; they return deprecation notices.
  // =====================================================================
  'POST /api/v1/register': { action: 'register' },
  'PUT /api/v1/user/:id': { action: 'edit-user' },
  'POST /api/v1/categories': { action: 'create-category' },
  'PUT /api/v1/categories/:id': { action: 'edit-category' },
  'POST /api/v1/threads': { action: 'create-thread' },
  'PUT /api/v1/thread/:id': { action: 'edit-thread' },
  'POST /api/v1/posts': { action: 'create-post' },
  'PUT /api/v1/post/:id': { action: 'edit-post' },
  'POST /api/v1/vote': { action: 'vote' },
  'POST /api/v1/moderate': { action: 'moderate' },
  'POST /api/v1/moderate/thread': { action: 'moderate-thread' },
  'POST /api/v1/role': { action: 'assign-role' },
  'PUT /api/v1/config/theme': { action: 'update-config-theme' },

  // SPA catch-all: serve index.html for all non-API routes (React Router)
  'GET /*': {
    skipAssets: true,
    fn: function (req, res) {
      const path = require('path');
      const fs = require('fs');
      const indexPath = path.resolve(sails.config.appPath, '.tmp', 'public', 'index.html');
      if (fs.existsSync(indexPath)) {
        return res.sendFile(indexPath);
      }
      return res.notFound();
    },
  },
};
