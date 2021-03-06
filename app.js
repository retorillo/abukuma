$(function(){
	$('#help, #close').hide();
	var stageTransition = new $TweenCSS('#stage')
		.push('width', $('#stage').get(0).width, 800, 'px', true)
		.push('margin-top', 0, -200, 'px', true)
		.push('opacity', 1, 0.1);
	var helpTransition = new $TweenCSS('#help')
		.push('padding-top', 100, 0, 'px', true)  
		.push('opacity', 0, 1);  
	var titleTransition = new $TweenCSS('#title')
		.push('opacity', 1, 0.1)
		.push('margin-top', 0, -50, 'px', true);
	var closeTransition = new $TweenCSS('#close')
		.push('opacity', 0, 1)
		.push('top', -50, 0, 'px', true);
	var transisions = [stageTransition, helpTransition, titleTransition, closeTransition];
	transisions.play = function(reverse) {
		this.forEach(function(t) {
			t.play(reverse ? 0 : 1, 1000, createjs.Ease.cubicInOut);
		});
	}
	$('#helpbtn').click(function(){ transisions.play(); });
	$('#closebtn').click(function(){ transisions.play(true); });
	var ctx = $('#closebtn').get(0).getContext('2d');
	canvasicon.drawClose(ctx, { width: 50, height: 50, color: 'white' });
});



// Application 
var store = new KeyValueStore('n1kz52w0mhf4');
//https://developer.mozilla.org/en-US/docs/Web/Events/beforeunload
// TODO: Is only warn if timer active?
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
	var audioModal, circles, dashboard;
	var dashboard = new createjs.Container();

	var stage = new createjs.Stage('stage');
	// http://createjs.com/docs/easeljs/classes/Stage.html#property_hitArea
	// The hitArea property is not supported for Stage. 
	var stage_hitArea = new createjs.Shape();
	stage_hitArea.hitArea = new createjs.Shape();
	stage_hitArea.hitArea.graphics.c().f('#000').dr(0, 0, stage.canvas.width, stage.canvas.height);
	stage.addChild(stage_hitArea);

	var modalbg = new createjs.Shape();
	modalbg.hitArea = new createjs.Shape();
	modalbg.hitArea.graphics.c().f('#000').dr(0, 0, stage.canvas.width, stage.canvas.height);
	
	stage.enableMouseOver();
	// promoteToModal
	function promoteToModal(modal, onhide){
		modal.addEventListener('click', function(e) {
			e.stopPropagation();
		});
		modal.hide = function () {
			// TODO: Improve disable/enabled mechanism
			if (circles) circles.disabled = false;
			if (speaker) speaker.disabled = false;
			if (onhide) onhide.apply(modal);
			modalbg.visible = false;
			promoteToModal.currentModal = null;
			createjs.Tween.removeTweens(dashboard);
			createjs.Tween.removeTweens(modal);
			dashboard.alpha = 1.0;
			modal.visible = false;
		}
		modal.show = function (v) {
			promoteToModal.currentModal = modal;
			modalbg.visible = true;
			circles.disabled = true;
			speaker.disabled = true;
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
	function raiseGlobalClick() {
		if (promoteToModal.currentModal)
			promoteToModal.currentModal.hide();
		notifmgr.dismiss();
	}
	$(document.body).click(function(e) { raiseGlobalClick(); });
	stage.addEventListener('click', function(e) {
		raiseGlobalClick();
	});
	modalbg.addEventListener('click', function (e) {
		e.stopPropagation();
		raiseGlobalClick();
	});
	$('#stage').click(function(e) {
		e.stopPropagation();
	});

	// Speaker
	var speaker_margin = 10;
	var speaker = new Speaker();
	speaker.x = stage.canvas.width - speaker.width - speaker_margin;
	speaker.y = stage.canvas.height - speaker.height - speaker_margin;
	speaker.click(function(e) {
		audioModal.show();
	});

	// NotificationManager
	var notifmgr = new NotificationManager();
	var defaultBgColor = new iro.Color("rgb(20,20,20)");
	var blendBgColor = new iro.Color("rgb(0,80,90)");
	var blinkBgTweenObj = {};
	__props(blinkBgTweenObj, [
		{ 
			prop: "blendRate",
			afterset: function() {
				blendBgColor.a = blinkBgTweenObj.blendRate;
				var bc = defaultBgColor.clone().blend(blendBgColor, 'add').css('hex');
				document.body.style.background = bc;
			},
		}
	]);
	notifmgr.ringStart(function() {
		blinkbg = true;
		createjs.Tween
			.get(blinkBgTweenObj, { override: true, loop: true })
			.to({ blendRate: 0 }, 0)
			.to({ blendRate: 1 }, 1000, createjs.Ease.cubicInOut)
			.to({ blendRate: 0 }, 500, createjs.Ease.cubicInOut);
	});
	notifmgr.ringEnd(function() {
		createjs.Tween.removeTweens(blinkBgTweenObj);
		document.body.style.background = defaultBgColor.css('hex');
	});
	document.body.style.background = defaultBgColor.css('hex');

	// Selector
	var selector = new OperationSelector();
	selector.itemclick(function () {
		var op = this;
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
	circles.itemclick(function(e){
		selector.target = this;
		var op;
		operations.forEach(function(o) {
			if (op || selector.target.activity != o.name) return;
			op = o;
		});
		selector.selectedOperation = op;
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
