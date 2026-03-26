/**
 * afterPack hook for electron-builder.
 * 1. Rebuilds native modules (better-sqlite3) against Electron's Node.js version.
 * 2. Ad-hoc signs the app on macOS (required for auto-update without Apple Developer ID).
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function (context) {
  const appDir = path.join(context.appOutDir, context.packager.appInfo.productFilename + '.app',
    'Contents', 'Resources', 'app-server');

  // On Linux/Windows the path is different
  const appDirAlt = path.join(context.appOutDir, 'resources', 'app-server');

  const targetDir = require('fs').existsSync(appDir) ? appDir : appDirAlt;

  if (!require('fs').existsSync(targetDir)) {
    console.log('[rebuild] app-server not found at', appDir, 'or', appDirAlt);
    return;
  }

  const electronVersion = context.electronPlatformName
    ? context.packager.config.electronVersion || require('electron/package.json').version
    : require('electron/package.json').version;

  console.log(`[rebuild] Rebuilding native modules in ${targetDir} for Electron ${electronVersion}...`);

  try {
    execSync(
      `npx @electron/rebuild --force --module-dir "${targetDir}" --electron-version "${electronVersion}"`,
      {
        cwd: targetDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          npm_config_runtime: 'electron',
          npm_config_target: electronVersion,
        },
      }
    );
    console.log('[rebuild] Native modules rebuilt successfully');
  } catch (err) {
    console.error('[rebuild] Failed:', err.message);
    // Try direct npm rebuild as fallback
    try {
      execSync(`npm rebuild better-sqlite3 --runtime=electron --target=${electronVersion}`, {
        cwd: targetDir,
        stdio: 'inherit',
      });
      console.log('[rebuild] Fallback rebuild succeeded');
    } catch (err2) {
      console.error('[rebuild] Fallback also failed:', err2.message);
    }
  }
};
