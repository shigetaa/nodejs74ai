# 人口無能と会話しよう
人口無能は古くからたくさん作られてきました。
ユーバーが語る言葉に反応して、ロボットがそれらしい応答するプログラムです。
ここでは、人口無能の仕組みを解説し基本的な処理に注目して、プログラムを作っていきます。

## 人口無能について
人口無能とは、人口知能に対応する用語です。
また、人口無能を実装したプログラムを「ボット(bot)」と呼びます。
ボットというのはロボットの略称で、もともと人間がコンピューターを操作して行っていた処理を、人間に代わって自動的に実行すｒプログラムの事を言います。

## ここで作る人工無能
ここでは、Node.jsのサーバー機能を使って、Webブラウザー上で会話ができるプログラムを作ってみます。
また、簡単なキーワードに反応する会話ボットをつくります。
今回用意した会話辞書は100行程度ですが、後々拡張できるように、MongoDBにキーワードを入れておいて、そこから会話データを引っ張てくるようにします。

### 会話の仕組み
本プログラムでは、以下の様にして会話します。

1. ユーザーから入力を得る
2. 入力を形態素解析する
3. 各単語についてデータベースの会話辞書を調べる
4. もし一致するものがあればその返答を返す

人工無能プログラム関連ファイル一覧
| ファイル名         | 説明                                          |
| :----------------- | :-------------------------------------------- |
| bot-dic.dat        | 会話辞書テキスト                              |
| make-dic.js        | 会話辞書テキストをMongoDBを挿入するプログラム |
| chat-client.html   | チャットする画面HTML                          |
| chat-server.js     | 会話ボットとチャットするサーバー              |
| chat-server-bot.js | 会話ボットの動作を定義したモジュール          |
| package.json       | 必要なモジュールなどの情報を記録したファイル  |

今回のプログラムを実行するには、前段階として、会話辞書をデータベースに登録する必要があります。
そのための辞書データが「bot-dic.dat」であり、データベースに登録するプログラムが「make-dic.js」です。

そして、Webブラウザーから利用するために、HTTPサーバーを作成しますが、それが「chat-server.js」です。
基本的にこのプログラムを実行し、Webブラウザーでこのサーバーにアクセスすると、会話を行う事が出来ます。

### プログラムの実行方法
プログラムを実行する前に、必要なモジュールをインストールしておきます。
データベースに「mongodb」、形態素解析に「mecab-lite」を使用しますので以下のコマンドを実行してインストールします。
```bash
npm i mecab-lite mongodb
```

### mongodb インストール
まだ、mongodb をインストールしていない場合は、以下のサイトからダウンロードしてインストールをしてください。

[MongoDB Community Server<br>https://www.mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)

無事にインストール出来たら、以下のコマンドを実行して、バージョン情報が表示されたら使用出来ます。
```bash
mongo --version
```
バージョン情報が表示されず、エラーなどが表示される場合は、実行ファイルにパスを通して見てください。

### mongodb 起動と終了
MongoDBを起動しておく必要があります。
OSによって起動の仕方が異なりますので詳しくは公式サイトをご覧下さい。

[MongoDB 公式サイト<br>https://www.mongodb.com/](https://www.mongodb.com/)

ちなみにWindowsはデフォルトではスタートアップ時にサービスとして自動起動するようになってます。

### 会話辞書データ作成
会話ボットを作るにあたって、その心臓部分ともいえるのが会話辞書です。
今回の人工無能は、簡単なキーワードに反応して会話を返すという簡単なものですから、会話辞書を作る際にも
「検索用の語句」に加えて、どの順番でパターンを調べるのか「ランク」、否定・肯定を調べるための「パターン」
そして返答用の「メッセージ本文」と４つのパラメータを入力していくことにしました。

辞書ファイル`bot-dic.dat`を以下の様に作成していきます。
左から、検索語句、検索ランク、パターン、応答メッセージ、の順にカンマ区切りで作成していきます。

```csv
; --- 会話ボットの返答用キーワード辞書 ---
; key, rank, pattern, message
こんにちは, 0, *, こんにちは。お元気ですか？
こんにちは, 0, *, ようこそ。どんな事があったんですか？
元気, 2, 元気ですか, 元気です。あなたは？
元気, 1, 元気です, 良かったです。今日はどのようなご用件で？
おはよう, 0, *, おはようございます。今日のご用件は？
こんばんは, 0, *, こんばんは。お元気ですか？
おやすみ, 0, *, おやすみなさい。ゆっくり休んでください。
; 語尾
です, 0, ですね, そうですね。
です, 0, ですね, 良いですね。それで？
です, 0, です, そうかもしれませんね。そして？
です, 0, ですか, そうかもしれません。
です, 0, ですか, 分かりませんが、どうして？
です, 0, でした, お疲れ様でした。
です, 0, でした, そうでしたね。それから、どうしたんですか？
です, 0, *, いいですね。もう少し詳しく教えてくださいますか？
です, 0, *, それを言い換えるとどうなるでしょうか？
です, 0, *, 続きを教えてください。
です, 0, *, 他に何か知りたいことはありますか？
です, 0, *, それは興味深い点ですね。それでどうなりました？
です, 0, *, それについて、もう少し教えてください。
です, 0, *, それがあなたにどう関係しているのですか？
です, 0, *, いいですね。他にありますか？
です, 0, *, 素晴らしいですね、もっと知りたいです。
; 形容
かわいい, 2, がかわいい, 本当、かわいいですよね。
かわいい, 1, かわいい, 私もそう思います。
きれい, 2, がきれい, 綺麗ですね。他に綺麗なのは？
きれい, 1, *,綺麗ですね。
美味しい, 1, *, そう思います。特にどこが美味しいですか？
美味しい, 2, が美味しい, 美味しいと元気になりますが、どうですか？
うまい, 0, *, 本当うまいですね。
; 思う
思う, 2, と思う, そう思うのには理由がありますか?
覚える, 0, を覚え, それを忘れられないのはなぜですか？
違い, 0, *, そう思うのはなぜですか？
忘れる, 2, 忘れない, どうして忘れないのですか？
忘れる, 0, 忘れた, 忘れたのはなぜですか？
忘れる, 0, 忘れ, 忘れたのはなぜ？
思い出す,0,思い出せない,何か障害があって思い出せないのですか？
思い出す,0,思い出せません,何か障害があって思い出せないのですか？
思い出す,0,思い出します,どうして思い出すのですか？
; 仮定
なら, 0, ならば, それが好きなんですか？
なら, 0, ならば, そうなったらどうしますか？
なら, 0, になれば, そうなると良いのですが。
難しい, 2, が難しい, それが難しい理由は何でしょうか？
難しい, 2, は難しい, それが難しいのはどうしてだと思いますか？
難しい, 0, *, それが難しいのはなぜでしょうか？
ば, 0, *, そう思うのはなぜですか？
ば, 0, *, そうなったら、どうしますか？
; 可能性
かも, 0, *, 確信が持てないのはどうしてですか？
かも, 0, *, どうしてそう思うのですか？
名前, 0, *, その名前にどんな意味があるのでしょうか？
; 負の感情
すみません, 0, *, 気にしないでください。
すみません, 0, *, ここで謝る必要はないんです。
ごめん, 0, *, いえいえ。
ごめん, 0, *, 大丈夫ですよ。
悪い, 0, が悪い, どうして悪いんですか？
悪い, 0, に悪い, それについて詳しく教えてください。
悪い,0, 悪かった, その方に謝りに行く必要がありますか？
悲しい, 0, *, どうして悲しいのだと思いますか？
悲しい, 0, *, どうして悲しいのだと思いますか？
悲しい, 0, *, お気の毒でしたね。
悲しい, 0, *, お疲れ様でした。
悲しい, 0, *, そうだったんですね。でも、どうして？
嬉しい, 0, *, 良かったですね。
嬉しい, 0, *, 私も嬉しいです。
嬉しい, 0, *, 嬉しいのは、なぜですか？
できる, 0, できない, どうしてできないんですか？
できる, 0, できません, どうしてできないのですか？
嫌い,0,*,どうして嫌いなんですか？
嫌い,0,*,きっかけがありますか？
嫌い,0,*,特にどこが嫌いですか？
; 病気
風邪,0,*,それはお大事に。
熱が,0,*,ゆっくり家で休んでください。
思う,0,*,いつもそう思うんですか？
思う,0,*,どうしてそう思うんですか？
;
うまい,0,*, すごいですね。今度ご一緒しませんか？
うまい,0,*, 確かに。
;
どうして,0,*,分かりません。どう思いますか？
何, 0, *, 答えられません。恥ずかしいんです。
何, 0, *, 分かりません。当ててみてください。
;
分かる,0,分からない,どうして分からないのでしょうか？
誰,1,誰も,寂しいですか？
誰,0,*,誰でしょう。知りません。
みんな,0,*,本当ですか？
みんな,0,*,それは確かな情報でしょうか？
みんな,0,*,私もです。でも本当ですか？
みんな,0,*,例えば、誰ですか？
みんな,0,*,それに関してどう思いますか？
どこ,0,*,どこが良いと思いますか？
どこ,0,*,どこが良いとも居ますか？
;
ので,0,*,それが本当の理由ですか？
ですから,0,*,他の理由がありますか？
いつも,0,*,例えばいつですか？
いつも,0,*,今日もですか？
いつも,0,*,本当にいつもですか？
;
好き,0,*,どうして好きなんですか？
好き,0,*,私もです。そう思いますか？
好き,0,*,特にどこが好きですか？
```

### 会話辞書データ登録
会話辞書データを、データベースMongoDBに挿入するプログラムを`make-dic.js`という名前で作成していきます。

```javascript
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
```

以下のスクリプトを実行して、辞書をデータベースに登録します。
```bash
node make-dic.js
```
```bash
0:inserted: true
1:inserted: true
2:inserted: true
3:inserted: true
4:inserted: true
...省略...
```

### 会話ボットとのチャット画面
会話ボットとチャットする画面を構成するHTMLファイル`chat-client.htl`を以下の様に作成していきます。
```html
<!DOCTYPE html>
<html>
<meta charset="utf-8">

<body>
	<h3>Chat Client</h3>
	<!-- ユーザーのコメント発言フォーム -->
	<div>
		コメント:
		<input id="msg" type="text" value="こんにちは。" size="40">
		<button id="talk_btn">発言</button>
	</div>
	<hr>
	<!-- ログの表示 -->
	<div id="log" style="margin:24px;"></div>

	<script type="text/javascript">
		// サーバーAPIの指定
		var api = "http://localhost:1337/api?";

		// ボタンをクリックした時のイベントを定義
		$("#talk_btn").onclick = sendMsg;

		//クリックした時の処理
		function sendMsg() {
			// コメントを取得し、パラメーターを組み立てる
			var msg = $("#msg").value;
			var url = api + "msg=" + encodeURIComponent(msg);
			// AjaxでAPIにメッセージを送信
			$ajax(url, function (xhr, txt) {
				// サーバーからの返信をログに表示
				$("#msg").value = "";
				$("#msg").focus();
				var e = JSON.parse(txt);
				// ユーザーの発言
				var p_you = document.createElement("p");
				p_you.innerHTML = "あなた &gt; " + msg + "<hr>";
				// ボットの発言
				var p_bot = document.createElement("p");
				p_bot.innerHTML = "ボット &gt; " + e["msg"] + "<hr>";
				p_bot.style.backgroundColor = "#e0f0ff";
				// ログに追加
				var log = $("#log");
				log.insertBefore(p_you, log.firstChild);
				log.insertBefore(p_bot, p_you);
			});
		}

		// DOMを返す
		function $(q) { return document.querySelector(q); }

		// Ajax関数
		function $ajax(url, callback) {
			var xhr = new XMLHttpRequest();
			xhr.open('GET', url, true);
			xhr.onreadystatechange = function () {
				if (xhr.readyState == 4) { //通信完了
					if (xhr.status == 200) { //HTTPステータス200
						callback(xhr, xhr.responseText);
					}
				}
			};
			xhr.send(''); // 通信を開始
			return xhr;
		}
	</script>
</body>

</html>
```

### 会話ボットサーバー
Node.js で HTTPサーバー機能を稼働するプログラムを`chat-server.js`として作成していきます。

```javascript
// チャットサーバーを作る
//-----------------------------
// 設定
var SERVER_PORT = 1337; // サーバーポート
var FILE_CLIENT = "chat-client.html";

// モジュールの取り込み
var
	http = require('http'),
	URL = require('url'),
	path = require('path'),
	fs = require('fs'),
	bot = require('./chat-server-bot.js');

// サーバーを起動
var svr = http.createServer(checkRequest);
svr.listen(SERVER_PORT, function () {
	console.log("サーバー起動しました");
	console.log("http://localhost:" + SERVER_PORT);
});

// サーバーにリクエストがあった時の処理
function checkRequest(req, res) {
	var uri = URL.parse(req.url, true);
	var pathname = uri.pathname;
	// パス名で処理を分岐
	if (pathname == "/api") {
		apiRequest(req, res, uri);
	} else if (pathname == "/") {
		res.writeHead(200, { 'Content-Type': 'text/html' });
		res.end(fs.readFileSync(FILE_CLIENT, "utf-8"));
	} else {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end("File not found");
	}
	console.log(pathname);
};

// APIへのリクエストを処理 
function apiRequest(req, res, uri) {
	msg = uri.query["msg"];
	bot.getResponse(msg, function (bot_msg) {
		body = JSON.stringify({ "msg": bot_msg });
		res.writeHead(200, { 'Content-Type': 'application/json' });
		res.end(body);
	});
};
```

### 会話ボットの会話生成モジュール
会話ボットの会話を生成するモジュール`chat-server-bot.js`とファイル名として作成していきます。

```javascript
// 会話ボットの応答を生成するモジュール
//---------------------------------

// MongoDBの設定情報
var MONGO_DSN = "mongodb://localhost:27017/simple-bot";

// モジュールの取り込み
var Mecab = require('mecab-lite'),
	mecab = new Mecab(),
	mongo_client = require('mongodb').MongoClient;

// MongoDBの接続情報を保持する変数
var mongo_db = null, keywords_co;

// 外部に getResponse() メソッドを公開
module.exports = {
	"getResponse": getResponse
};

// 会話ボットの応答を返す関数
function getResponse(msg, callback) {
	checkDB(function () {
		var bot = new Bot(msg, callback);
		bot.talk();
	});
}

// MongoDBへ接続
function checkDB(next_func) {
	// 既に接続していれば何もしない
	if (mongo_db) {
		next_func(); return;
	}

	// MongoDBに接続
	mongo_client.connect(MONGO_DSN, function (err, client) {
		// エラーチェック
		if (err) { console.log("DB error", err); return; }
		// 接続情報を記録
		var db = client.db('simple-bot');
		mongo_db = client;
		// コレクションを取得
		keywords_co = db.collection('keywords');
		// 次の処理を実行
		next_func();
	});
}

// ボットクラスの定義
function Bot(msg, callback) {
	this.callback = callback;
	this.msg = msg;
	this.results = [];
	this.words = [];
	this.index = 0;
}

// ボットからの応答を得るメソッド
Bot.prototype.talk = function () {
	var self = this;
	// 形態素解析 
	mecab.parse(this.msg, function (err, words) {
		if (err) {
			self.callback("Error");
			return;
		}
		// 単語を一つずつ確認する
		self.index = 0;
		self.words = words;
		self.nextWord();
	});
};

// 各単語を一語ずつ調べるメソッド
Bot.prototype.nextWord = function () {
	// 単語を最後まで調べたか確認
	if (this.index >= this.words.length) {
		this.response();
		return;
	}
	// データベースを検索
	var w = this.words[this.index++];
	// 活用のない単語 - 「頑張ら」なら「頑張る」を利用
	var org = (w.length >= 7) ? w[7] : w[0];
	var self = this;
	keywords_co
		.find({ key: org })
		.toArray(function (err, rows) {
			// データベースに合致する語があったか？
			if (rows.length == 0) {
				self.nextWord(); return;
			}
			// パターンにマッチするか確認
			var keys = rows.filter(function (el, index, ary) {
				if (el.pattern == "*") return true;
				if (self.msg.indexOf(el.pattern) >= 0) return true;
				return false;
			});
			if (keys.length > 0) {
				var r = Math.floor(Math.random() * keys.length);
				var key = keys[r];
				self.results.push(key.msg);
			}
			self.response();
		});
};

// 結果を戻す
Bot.prototype.response = function () {
	var res = "もう少しかみ砕いて話してください。";
	if (this.results.length > 0) {
		res = this.results.join("。");
	}
	this.callback(res);
};

```

### プログラムを実行
以下のスクリプトを実行して、無事にサーバーが起動しているか確認します。

```bash
node chat-server.js
```
```bash
サーバー起動しました
http://localhost:1337
```

Webブラウザーで`http://localhost:1337`にアクセスして、表示ができていたら
動作を確認してみてください。