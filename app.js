var store = new KeyValueStore('n1kz52w0mhf4');

// TODO: Please Wait Modal or HTML

var prevInfo = {};
store.open()
     .read(['audio', 'circles'])
     .success(function(pairs) {
    	pairs.forEach(function(pair){
		prevInfo[pair.key] = pair.value;
	});
     })
     .action(function(){
     	$(appstart);
     });

function appstart() {
	var audioModal, circles, modalbg;
	var stage = new createjs.Stage('stage');
	stage.enableMouseOver();
	function promoteToModal(modal, onhide){
		if (!modalbg) {
			modalbg = new createjs.Shape();
			modalbg.alpha = 0.5;
			modalbg.visible = false;
			modalbg.graphics.f('black').rect(0, 0, stage.canvas.width, stage.canvas.height);
		}
		modalbg.addEventListener('click', function () {
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
	// Speaker
	var speaker_margin = 10;
	var speaker = new Speaker();
	speaker.x = stage.canvas.width - speaker.width - speaker_margin;
	speaker.y = stage.canvas.height - speaker.height - speaker_margin;
	speaker.click(function() {
		audioModal.show();
	});
	stage.addChild(speaker);

	// NotificationManager
	var notifmgr = new NotificationManager();

	// Selector
	var selector = new OperationSelector();
	selector.itemclick(function (op) {
		selector.target.restart(op.name, moment.duration(op.duration, "m"));
		// TODO: More better timing of storing circles data, for example 'change' event
		store.write([{ key: 'circles', value: circles.json() }])
			     .success(function(){
				console.log('circles was stored');
			     });
		selector.hide();
	});
	selector.x = selector.default_x = (stage.canvas.width - selector.width) / 2;
	selector.y = selector.default_y = (stage.canvas.height - selector.height) / 2;
	promoteToModal(selector);

	// Circles
	circles = new CountdownCircleSet();
	circles.itemclick(function(){
		selector.target = this;
		selector.show(true);
	});
	circles.itemcomplete(function(){
		notifmgr.push(this); 
	});
	circles.json(prevInfo.circles);

	// ModalBg and Selector must be placed after circles
	stage.addChild(circles);
	stage.addChild(modalbg);
	stage.addChild(selector);

	// TODO: AudioSelectModal window border
	// TODO: AudioSelectModal.hasDataURL property to check more precisely
	// TODO: Button control border
	audioModal = new AudioSelectModal();
	stage.addChild(audioModal);
	audioModal.x = (stage.canvas.width - audioModal.width) / 2;
	audioModal.y = (stage.canvas.height - audioModal.height) / 2;
	audioModal.change(function(){
		notifmgr.audioURL = audioModal.audioURL; 
		speaker.volume = audioModal.audioURL != null ? 1 : 0;
	});
	// audioURL must be set after change first eventhandler was registered
	audioModal.audioURL = prevInfo.audio;
	audioModal.change(function(){
		// this eventhandler should be seperated with the above one
		// to prevent redundant overwriting (audioURL = prevInfo.audio)
		store.write([{ key:'audio', value: audioModal.audioURL }])
		     .success(function(){
		     	console.log('audio URI was stored');
		     });
	});
	// release unused memory (when change audio)
	prevInfo.audo = null;

	promoteToModal(audioModal, audioModal.stopTest)
	audioModal.show();
	
	circles.layout();
	circles.x = (stage.canvas.width - circles.width) / 2;
	circles.y = (stage.canvas.height - circles.height) / 2 - speaker.height / 2;

	createjs.Ticker.addEventListener("tick", function (event) {
		audioModal.update();
		selector.update();
		circles.update();
		speaker.update();
		stage.update();
	});
}
