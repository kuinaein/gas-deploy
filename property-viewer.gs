/* eslint-disable no-unused-vars */
/**
 * ファイルのプロパティをドライブの画面上で見られないようなので手製したユーティリティ
 *
 * @param {string} fileId その下に直接書き込んでしまったほうが早いと思う
 */
function getProperties(fileId) {
  /* eslint-enable no-unused-vars */
  fileId = fileId || '';
  props = Drive.Properties.list(fileId);
  Logger.log(JSON.stringify(props, null, 2));
}
