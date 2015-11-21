var store = new KeyValueStore('n1kz52w0mhf4');

//https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload
leaveMessage = "ブラウザを閉じたり、このページから移動したりするとアラーム音は鳴りませんがよろしいでしょうか。なお、ブラウザを閉じても設定した時間は維持されるため、このページを再び開けば自動的にタイマーが再開します。";
window.addEventListener("beforeunload", function(e) {
  e.returnValue = leaveMessage; // Gecko and Trident
  return leaveMessage;          // Gecko and WebKit
});

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
	var blinkbg = false;
	var audioModal, circles, dashboard;//, modalbg;
	var dashboard = new createjs.Container();
	var stage = new createjs.Stage('stage');
	stage.enableMouseOver();

	// promoteToModal
	function promoteToModal(modal, onhide){
		modal.hide = function () {
			if (circles) circles.disable = false;
			dashboard.alpha = 1.0;
			modal.visible = false;
			if (onhide) onhide.apply(modal);
			promoteToModal.bodyClick = 0;
			promoteToModal.currentModal = null;
		}
		modal.show = function (v) {
			promoteToModal.bodyClick = 0;
			promoteToModal.currentModal = modal;
			circles.disable = true;
			dashboard.alpha = 0.5;
			modal.visible = true;
			createjs.Tween.get(dashboard, { override: true })
				.to({ alpha: dashboard.alpha }, 0)
				.to({ alpha: 0.5 }, 500, createjs.Ease.sineOut);
			createjs.Tween.get(modal, { override: true })
				.to({ alpha: 0 }, 0)
				.to({ alpha: 1 }, 250, createjs.Ease.cubicOut);
			createjs.Tween.get(modal)
				.to( v ? { y: 0 } : { x: -modal.x } , 0)
				.to( v ? { y: modal.y } : { x: modal.x } , 500, createjs.Ease.backOut);
		}
		modal.hide();
	};
	promoteToModal.currentModal = null;
	promoteToModal.bodyClick = 0;
	document.body.addEventListener('click', function () {
		if (promoteToModal.bodyClick++ > 0 && promoteToModal.currentModal)
			promoteToModal.currentModal.hide();
	});

	// Speaker
	var speaker_margin = 10;
	var speaker = new Speaker();
	speaker.x = stage.canvas.width - speaker.width - speaker_margin;
	speaker.y = stage.canvas.height - speaker.height - speaker_margin;
	speaker.click(function() {
		audioModal.show();
	});

	// NotificationManager
	var notifmgr = new NotificationManager();
	notifmgr.ringStart(function() {
		//TODO: Flush Background
		blinkbg = true;
	});
	notifmgr.ringEnd(function() {
		//TODO: Flush Background
		blinkbg = false;
	});
	document.body.addEventListener('click', function () {
		notifmgr.dismiss();	
	});

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
	dashboard.addChild(circles);
	dashboard.addChild(speaker);

	stage.addChild(dashboard);
	// stage.addChild(modalbg);
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
	
	circles.layout();
	circles.x = (stage.canvas.width - circles.width) / 2;
	circles.y = (stage.canvas.height - circles.height) / 2 - speaker.height / 2;
	
	createjs.Ticker.addEventListener("tick", function (event) {

		if (!blinkbg || new Date().getSeconds() % 2 == 1) {
			document.body.style.background = "rgb(20,20,30)";
//			canvasbg.graphics
//				.f("rgb(30, 30, 30)")
//				.rect(0, 0, stage.canvas.width, stage.canvas.height)
		}
		else {
			document.body.style.background = "rgb(80, 5, 15)";
//			canvasbg.graphics
//				.f("rgb(80, 80, 80)")
//				.rect(0, 0, stage.canvas.width, stage.canvas.height)
		}

		audioModal.update();
		selector.update();
		circles.update();
		speaker.update();
		stage.update();
	});
}
