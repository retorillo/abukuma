var settings = new KeyValueStore("retorillo_abukuma_settings");

// TODO: Load timer status and mp3

var rects = [new Rect(0, 0, 150, 150), new Rect(0, 0, 300, 300), new Rect(0, 0, 150, 150)];
zigzagSort(40, 0, rects, -40, -15, true);
var colors = [{ strong: "rgb(0, 200, 250)", weak: "rgb(0, 120, 150)" },
	      { strong: "rgb(250, 200, 0)", weak: "rgb(150, 120, 0)" },
	      { strong: "rgb(250, 0, 200)", weak: "rgb(150, 0, 120)" }];

$(function () {
	var stage = new createjs.Stage("stage");
	stage.enableMouseOver();
	
	function getButton(msg, color) {
		var button = new Button();
		button.text = msg;
		button.fontFamily = 'Meiryo UI';
		button.fontSize = 20;
		button.padding = { left : 10, right : 10, bottom: 10, top: 10 };
		button.foreground = color.strong;
		button.background = color.weak;
		return button;
	}

	// Sound Modal
	function getSoundModal() {
		
		var soundModal = new StackPanel();
		soundModal.background = 'red';
		soundModal.orientation = 'v';
		soundModal.childArrangement = 'n';
		soundModal.childSpacing = 40;
		var title = new createjs.Text();
		title.text = 'アラーム音は設定されていません';
		title.color = 'white';
		title.font = '20px Meiryo UI';
		title.width = title.getMeasuredWidth();
		title.height = title.getMeasuredHeight();
		soundModal.addChild(title);

		var btnpanel = new StackPanel();
		btnpanel.orientation = 'h';
		btnpanel.background = 'blue';
		btnpanel.childSpacing = 10;
		btnpanel.addChild(getButton('アラーム音を設定する', colors[1]));
		btnpanel.addChild(getButton('アラーム音を削除する', colors[0]));
		btnpanel.updateLayout();

		soundModal.addChild(btnpanel)

		return soundModal;
	}
	var soundModal = getSoundModal();
	stage.addChild(soundModal);
	

	// Speaker
	var speaker = new canvasicon.createjs.Speaker();
	var speaker_margin = 10;
	speaker.width = 40;
	speaker.height = 40;
	speaker.volume = 0;
	speaker.bodyColor = "rgb(255, 255, 255)";
	speaker.waveColors = ["rgb(255, 255, 255)", "rgb(255, 255, 255)", "rgb(255, 255, 255)"];
	speaker.muteColor = "rgb(200, 80, 80)";
	speaker.x = stage.canvas.width - speaker.width - speaker_margin;
	speaker.y = stage.canvas.height - speaker.height - speaker_margin;
	speaker.cursor = "pointer";
	speaker.addEventListener("click", function() {
		$("#audio_selector").click();	
	});
	stage.addChild(speaker);

	var audio;
	var audioTimeout;
	var audioDataURL;
	$("#audio_selector").change(function(e1){
		var reader = new FileReader();
		// http://www.w3.org/TR/FileAPI/#dfn-load-event
		reader.onload = function (e2) {
			audioDataURL = e2.target.result;
			speaker.volume = 100;
			playAudio(3000);
		}
		reader.readAsDataURL(e1.target.files[0]);
	});
	var playAudio = function(timeout) {
		if (audioTimeout)
			clearTimeout(audioTimeout);
		if (audio)
			audio.remove();
		audio = $('<audio>')
			.attr('autoplay', 'autoplay')
			.attr('src', audioDataURL)
			.appendTo(document.body);
		audioTimeout = setTimeout(function() {
			audio.remove();
			audio = null;
		}, timeout);
	}
	

	// ModalBg
	var modalbg = new createjs.Shape();
	modalbg.alpha = 0.5;
	modalbg.visible = false;
	modalbg.graphics.f("black").rect(0, 0, stage.canvas.width, stage.canvas.height);
	modalbg.addEventListener("click", function () {
		circles.disable(false);
		modalbg.visible = false;
		selector.visible = false;
	});

	// Selector
	var selector = new OperationSelector(0, 0);
	selector.visible = false;
	selector.itemclick(function (op) {
		selector.target.restart(op.name, moment.duration(op.duration, "m"));
		circles.disable(false);
		modalbg.visible = false;
		selector.visible = false;
	});
	selector.x = selector.default_x = (stage.canvas.width - selector.width) / 2;
	selector.y = selector.default_y = (stage.canvas.height - selector.height) / 2;

	// Circles
	var circles = new Array();
	circles.disable = function (value) {
		circles.forEach(function (c) { c.disabled = value;  })
	}
	circles.update = function () {
		circles.forEach(function (c) { c.update(); })
	}
	rects.forEach(function (rect, index) {
		var c = new CountdownCircle(rect.x, rect.y, rect.w, rect.h,
			colors[index].strong, colors[index].weak);
		stage.addChild(c);
		
		// TODO: set them when operation is stored at KeyValueStore,
		//       otherwise set defaults
		
		// WARNING: operations[index] is unavailable now. (some index will returns null)
		// c.restartOperation(operations[index]);
		
		c.click(function () {
			// oncircleclick
			selector.target = c;
			circles.disable(true);
			modalbg.visible = true;
			selector.visible = true;
			createjs.Tween.get(modalbg, { override: true })
				.to({ alpha: 0 }, 0).to({ alpha: modalbg.alpha }, 500, createjs.Ease.sineOut);
			createjs.Tween.get(selector, { override: true })
				.to({ alpha: 0 }, 0).to({ alpha: 1 }, 250, createjs.Ease.cubicOut);
			createjs.Tween.get(selector)
				.to({ y: 0 }, 0).to({ y: selector.default_y }, 500, createjs.Ease.backOut);
		});
		circles.push(c);
	});

	// ModalBg and Selector must be placed after circles
	stage.addChild(modalbg);
	stage.addChild(selector);

	createjs.Ticker.addEventListener("tick", function (event) {
		soundModal.update();
		selector.update();
		circles.update();
		stage.update();
	});
});
