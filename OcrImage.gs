// メイン関数
function myFunction() {
  ocrAllImagesInFolders();
}

// 画像ルートフォルダ
const rootFolderID = '17rZjM9SLvpHMGmMcBVw22s-iSRzf7KxD';

// テキスト保存先フォルダ
const textFolderID = '1eX4cj5I94SEqRI0FPC9YlVd1BIBDykbf';
const textFolder = DriveApp.getFolderById(textFolderID);

// OCRの設定
const option = {
  'ocr': true,
  'ocrLanguage': 'ja',
}

function ocrAllImagesInFolders() {
  const folders = DriveApp.getFolderById(rootFolderID).getFolders();

  while (folders.hasNext()) {
    const folder = folders.next();

    if (folder.getId() === textFolderID) {
      // テキスト保存先フォルダはスキップ
      continue;
    }

    const folderName = folder.getName();

    console.log(folderName + ' : start...');

    const files = DriveApp.getFolderById(folder.getId()).getFiles();
    
    // 画像ファイルの並び替え
    const sortedFiles = sortImageFiles(files)

    // 並び替えた全画像ファイルにOCRを実行し、テキストを結合して取得
    const allImageText = ocrAllImagesInFolder(sortedFiles);

    console.log(' >> text file save start...');

    const textFileName = folderName + '.txt';
    // テキストへの書き込み
    writeTextFile(allImageText, textFileName);

    console.log(' >> text file save end... : ' + textFileName);

    console.log(folderName + ' : end...');
  }
}

// 画像ファイルの並び替え
function sortImageFiles(files) {
  const filesArray = [];

  while (files.hasNext()) {
    filesArray.push(files.next());
  }

  filesArray.sort((x, y) => {
    if (x < y) return -1;
    if (x > y) return 1;
  });

  return filesArray.values();
}

// フォルダ内の全画像ファイルにOCRを実行し、テキストを結合して取得
function ocrAllImagesInFolder(files) {
  let allImageText = '';

  for (const file of files) {
    if (file.getMimeType() === 'application/vnd.google-apps.script') {
      // GASファイルは処理から除外
      continue;
    }

    const fileName = file.getName();

    console.log(' > ocr start... : ' + fileName);

    // OCRの実行
    const text = ocrImage(file.getId(), fileName);
    // 取得したテキストを結合
    // 何ページ目かわかるようファイル名を付加
    allImageText += fileName + '\r\n' + '--------------------------------------------------\r\n' + text + '\r\n';

    console.log(' > ocr end... : ' + fileName);
  }

  return allImageText;
}

// OCRの実行
function ocrImage(fileId, fileName) {
  const resource = { title: fileName };

  const image = Drive.Files.copy(resource, fileId, option);
  const doc = DocumentApp.openById(image.id);
  const text = doc.getBody().getText();

  Drive.Files.remove(doc.getId());

  return text;
}

// テキストへの書き込み
function writeTextFile(text, fileName) {
  const contentType = 'text/plain';
  const charSet = 'UTF8';
  const blob = Utilities.newBlob('', contentType, fileName).setDataFromString(text, charSet);

  textFolder.createFile(blob);
}
