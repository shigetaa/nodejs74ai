// ボットのためのキーワード辞書を作成
//------------------------------------
// 会話辞書テキストファイルの指定
var FILE_DIC = 'bot-dic.dat';
// MongoDBの接続情報
var MONGO_DSN = "mongodb://localhost:27017/simple-bot";
var mongo_db; // 接続オブジェクト

// モジュール
var mongo_client = require('mongodb').MongoClient;
var fs = require('fs');

// MongoDBに接続
mongo_client.connect(MONGO_DSN, function (err, client) {
	// エラーチェック
	if (err) { console.log("DB error", err); return; }
	// MongoDBの接続オブジェクトを記憶
	var db = client.db('simple-bot');
	mongo_db = client;

	// コレクションを取得
	var collection = db.collection('keywords');

	// 既存のデータがあれば一度初期化
	collection.drop(function (err, reply) {
		// 初期化後に挿入
		insertKeywords(collection);
	});
});

// MongoDBに辞書データを挿入
function insertKeywords(collection) {
	var cnt = 0, dataCount = 0;
	// テキストデータを読み込む
	var txt = fs.readFileSync(FILE_DIC, "utf-8");
	// 各行を処理
	var lines = txt.split("\n");
	for (var i in lines) {
		var line = trim(lines[i]);
		if (line == "") continue; // 空行
		if (line.substr(0, 1) == ";") continue; // コメント
		var cells = line.split(",");
		var key = trim(cells[0]);
		var rank = parseInt(trim(cells[1]));
		var pat = trim(cells[2]);
		var msg = trim(cells[3]);
		// 挿入 
		collection.insert({
			"key": key, "rank": rank,
			"pattern": pat, "msg": msg
		}, function (err, result) {
			console.log(cnt + ":inserted:", result.acknowledged);
			if (++cnt == dataCount) {
				console.log("done");
				mongo_db.close();
			}
		});
		dataCount++;
	}
}

// 前後の空白トリムを行う
function trim(s) {
	s = "" + s;
	return s.replace(/(^\s+|\s+$)/g, "");
}