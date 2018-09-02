'use strict';

/**
 *  @see https://developers.google.com/apps-script/api/
 */

/**
 * ドキュメントにスクリプトIDを書き込むときに使うプロパティID.
 * 当然、同じドキュメントに複数のスクリプトプロジェクトを紐付ける場合は各々別のキーを振らないと衝突します.
 *
 * @type {string}
 */
var PROPERTY_KEY = 'kuina.deployment.example';

/**
 * 親フォルダID
 *
 * @type {string}
 */
var PARENT_FOLDER_ID = '';

/**
 * 子フォルダのうち無視すべきものの名前のパターン
 *
 * @type {RegExp}
 */
var IGNORE_CHILD_FOLDER_PATTERN = /^無視$/;

/**
 * 孫ファイルの名前のパターン
 *
 * @type {RegExp}
 */
var DESCENDANT_FILE_PATTERN = /^.*管理ファイル.*$/;

/* eslint-disable no-unused-vars */
/**
 * デプロイ対象ドキュメントにまとめてスクリプトを仕込む
 */
function deploy() {
  /* eslint-enable no-unused-vars */
  if (!PARENT_FOLDER_ID || '' === PARENT_FOLDER_ID) {
    // PARENT_FOLDER_IDが未指定だとマイドライブ直下どころか全フォルダを走査してしまって危険
    throw new Error('親フォルダIDが指定されていません');
  }

  // ファイル一覧を手動で管理するのであれば ContentService でも取ってこられるが...
  var contents = callScriptApi(
    'projects/' + ScriptApp.getScriptId() + '/content'
  );
  var files = [];
  var DIST_PATTERN = /^dist\//;
  for (var i = 0; i < contents.files.length; ++i) {
    var f = contents.files[i];
    if (DIST_PATTERN.test(f.name)) {
      var name = f.name.replace(DIST_PATTERN, '');
      // APIの構造体では拡張子はついていない
      var isManifest = 'appsscript.json' === name;
      files.push({
        name: isManifest ? 'appsscript' : name,
        type: isManifest ? 'JSON' : f.type,
        source: f.source,
      });
    }
  }
  Logger.log(files);

  var docs = collectTargetDocuments();
  for (var i = 0; i < docs.length; ++i) {
    var proj = ensureProject(docs[i]);
    callScriptApi('projects/' + proj.scriptId + '/versions', 'POST', {
      description: 'デプロイスクリプト: 変更前の状態を保存',
    });
    callScriptApi('projects/' + proj.scriptId + '/content', 'PUT', {
      files: files,
    });
  }
}

/**
 * スクリプトを仕込む対象を列挙する
 * 一つのフォルダ内に対象ファイルが複数見つかった場合は、その中で一番新しいファイルを返す
 *
 * @return {!Array<GoogleAppsScript.Drive.File>}
 */
function collectTargetDocuments() {
  var targets = [];

  var folder = DriveApp.getFolderById(PARENT_FOLDER_ID);
  var fodlerIterator = folder.getFolders();
  while (fodlerIterator.hasNext()) {
    var child = fodlerIterator.next();
    if (IGNORE_CHILD_FOLDER_PATTERN.test(child.getName())) {
      Logger.log('無視: ' + child.getName());
      continue;
    }

    var candidates = [];
    var fileIterator = child.getFiles();
    while (fileIterator.hasNext()) {
      var file = fileIterator.next();
      if (DESCENDANT_FILE_PATTERN.test(file.getName())) {
        candidates.push(file);
      }
    }
    if (0 >= candidates.length) {
      throw new Error('対象ファイルが見つかりません！: ' + child.getName());
    }
    candidates.sort(function(f1, f2) {
      var t1 = f1.getDateCreated().getTime();
      var t2 = f2.getDateCreated().getTime();
      return t1 === t2 ? 0 : t1 > t2 ? 1 : -1;
    });
    targets.push(candidates[candidates.length - 1]);
  }

  return targets;
}

/**
 * Apps Script APIを呼び出す
 *
 * @param {!string} path APIのURIパス
 * @param {?string} method HTTPリクエストメソッド. デフォルト値は GET
 * @param {?any} payload リクエストボディ
 * @return {any}
 */
function callScriptApi(path, method, payload) {
  /** @type {GoogleAppsScript.URL_Fetch.URLFetchRequestOptions} */
  var opts = {
    method: method || 'GET',
    headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()},
  };
  if (payload) {
    opts.payload = JSON.stringify(payload);
    opts.contentType = 'application/json';
  }
  var res =
    '' + UrlFetchApp.fetch('https://script.googleapis.com/v1/' + path, opts);
  if (2000 > res.length) {
    Logger.log(res);
  }
  return JSON.parse(res);
}

/**
 * @typedef ScriptProject
 * @property {!string} scriptId
 */

/**
 * ドキュメントからApps Scriptプロジェクトを取得する. なければ作成
 *
 * @param {!GoogleAppsScript.Drive.File} doc
 * @return {!ScriptProject}
 */
function ensureProject(doc) {
  var prop;
  try {
    prop = Drive.Properties.get(doc.getId(), PROPERTY_KEY, {
      visibility: 'PUBLIC',
    });
    // うまく紐づいていない可能性もあるので一応getして確認
    return callScriptApi('projects/' + prop.value);
  } catch (ex) {
    Logger.log(ex);
  }

  // プロジェクト未作成なので新規に作成
  /** @type {ScriptProject} */
  var proj = callScriptApi('projects', 'POST', {
    title: doc.getName(),
    parentId: doc.getId(),
  });
  var newProp = {key: PROPERTY_KEY, value: proj.scriptId, visibility: 'PUBLIC'};
  if (prop) {
    Drive.Properties.update(newProp, doc.getId(), PROPERTY_KEY, {
      visibility: 'PUBLIC',
    });
  } else {
    Drive.Properties.insert(newProp, doc.getId());
  }
  return proj;
}
