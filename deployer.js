const path = require('path');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;

switch (process.argv[2]) {
  case 'push':
    push();
    break;

  default:
    throw new Error('引数を解釈できません: ' + process.argv[2]);
}

/**
 * claspを呼び出す
 */
function callClasp(...args) {
  spawnSync(
    'node',
    [path.join(__dirname, 'node_modules/.bin/clasp')].concat(args),
    {stdio: 'inherit'}
  );
}

/**
 * デプロイ用のスクリプトをアップロードする
 *
 * Apps Script プロジェクトがなければ作成
 */
function push() {
  callClasp('login');
  if (!fs.existsSync(path.join(__dirname, '.clasp.json'))) {
    const projectName = process.env['PROJECT_NAME'];
    const parentId = process.env['PROJECT_PARENT_ID'];
    if (parentId && '' !== parentId) {
      callClasp('create', projectName, parentId);
    } else {
      callClasp('create', projectName);
    }
  }
  callClasp('push');
  callClasp('open'); // スクリプトエディタを開く
}
