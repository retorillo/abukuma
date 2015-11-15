var settings = new KeyValueStore("retorillo_abukuma_settings");

// TODO: Load timer status and mp3

var rects = [new Rect(0, 0, 150, 150), new Rect(0, 0, 300, 300), new Rect(0, 0, 150, 150)];
zigzagSort(40, 0, rects, -40, -15, true);
var colors = [{ strong: "rgb(0, 200, 250)", weak: "rgb(0, 120, 150)" },
	      { strong: "rgb(250, 200, 0)", weak: "rgb(150, 120, 0)" },
	      { strong: "rgb(250, 0, 200)", weak: "rgb(150, 0, 120)" }];

$(function () {
	var soundModal, circles, modalbg;
	var stage = new createjs.Stage("stage");
	stage.enableMouseOver();

	function promoteToModal(modal, onhide){
		if (!modalbg) {
			modalbg = new createjs.Shape();
			modalbg.alpha = 0.5;
			modalbg.visible = false;
			modalbg.graphics.f("black").rect(0, 0, stage.canvas.width, stage.canvas.height);
		}
		modalbg.addEventListener("click", function () {
			modal.hide();
		});
		modal.hide = function () {
			if (circles) circles.disable(false);
			modalbg.visible = false;
			modal.visible = false;
			if (onhide) onhide.apply(modal);
		}
		modal.show = function (v) {
			circles.disable(true);
			modalbg.visible = true;
			modal.visible = true;
			createjs.Tween.get(modalbg, { override: true })
				.to({ alpha: 0 }, 0)
				.to({ alpha: modalbg.alpha }, 500, createjs.Ease.sineOut);
			createjs.Tween.get(modal, { override: true })
				.to({ alpha: 0 }, 0)
				.to({ alpha: 1 }, 250, createjs.Ease.cubicOut);
			createjs.Tween.get(modal)
				.to( v ? { y: 0 } : { x: -modal.x } , 0)
				.to( v ? { y: modal.y } : { x: modal.x } , 500, createjs.Ease.backOut);
		}
		modal.hide();
	};

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
		soundModal.show();
	});
	stage.addChild(speaker);

	// Selector
	var selector = new OperationSelector();
	selector.itemclick(function (op) {
		selector.target.restart(op.name, moment.duration(op.duration, "m"));
		selector.hide();
	});
	selector.x = selector.default_x = (stage.canvas.width - selector.width) / 2;
	selector.y = selector.default_y = (stage.canvas.height - selector.height) / 2;
	promoteToModal(selector);

	// Circles
	circles = new Array();
	circles.disable = function (value) {
		circles.forEach(function (c) { c.disabled = value;  })
	}
	circles.update = function () {
		circles.forEach(function (c) { c.update(); })
	}
	rects.forEach(function (rect, index) {
		var c = new CountdownCircle();
		c.x = rect.x; c.y = rect.y; c.width = rect.w; c.height = rect.h;
		c.strongColor = colors[index].strong; c.weakColor = colors[index].weak;
		stage.addChild(c);
		
		// TODO: set them when operation is stored at KeyValueStore, otherwise set defaults
		
		// WARNING: operations[index] is unavailable now. (some index will returns null)
		// c.restartOperation(operations[index]);
		
		c.click(function () {
			// oncircleclick
			selector.target = c;
			selector.show(true);
		});
		circles.push(c);
	});

	// ModalBg and Selector must be placed after circles
	stage.addChild(modalbg);
	stage.addChild(selector);

	// TODO: SoundModal window border
	// TODO: SoundModal.hasDataURL property to check more precisely
	// TODO: Button control border
	// TODO: Speaker mouse hover effect
	soundModal = new SoundModal();
	stage.addChild(soundModal);
	soundModal.x = (stage.canvas.width - soundModal.width) / 2;
	soundModal.y = (stage.canvas.height - soundModal.height) / 2;
	soundModal.change(function(){
		speaker.volume = soundModal.soundDataURL != null ? 100 : 0;
	});
	promoteToModal(soundModal, soundModal.stopTest)
	soundModal.show();

	createjs.Ticker.addEventListener("tick", function (event) {
		soundModal.update();
		selector.update();
		circles.update();
		stage.update();
	});
});
