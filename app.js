var settings = new KeyValueStore("retorillo_abukuma_settings");
// TODO: Load timer status and mp3
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
			if (circles) circles.disable = false;
			modalbg.visible = false;
			modal.visible = false;
			if (onhide) onhide.apply(modal);
		}
		modal.show = function (v) {
			circles.disable = true;
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

	// TODO: Speaker hitArea
	// TODO: Speaker mouse hover effect
	// TODO: Remove canvasicon.createjs.js
	// Speaker
	var speaker_margin = 10;
	var speaker = new Speaker();
	speaker.x = stage.canvas.width - speaker.width - speaker_margin;
	speaker.y = stage.canvas.height - speaker.height - speaker_margin;
	speaker.click(function() {
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
	circles = new CountdownCircleSet();
	circles.itemclick(function(c){
		selector.target = c;
		selector.show(true);
	});
	
	// ModalBg and Selector must be placed after circles
	stage.addChild(circles);
	stage.addChild(modalbg);
	stage.addChild(selector);

	// TODO: SoundModal window border
	// TODO: SoundModal.hasDataURL property to check more precisely
	// TODO: Button control border
	soundModal = new SoundModal();
	stage.addChild(soundModal);
	soundModal.x = (stage.canvas.width - soundModal.width) / 2;
	soundModal.y = (stage.canvas.height - soundModal.height) / 2;
	soundModal.change(function(){
		speaker.volume = soundModal.soundDataURL != null ? 100 : 0;
	});
	promoteToModal(soundModal, soundModal.stopTest)
	soundModal.show();
	
	circles.layout();
	circles.x = (stage.canvas.width - circles.width) / 2;
	circles.y = (stage.canvas.height - circles.height) / 2 - speaker.height / 2;


	createjs.Ticker.addEventListener("tick", function (event) {
		soundModal.update();
		selector.update();
		circles.update();
		speaker.update();
		stage.update();
	});
});
