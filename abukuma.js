/*! Abukuma.js Copyright (C) Retorillo
    Dependencies: classdef.js, create.js, moment.js, iro.Color.js */
// TODO: Rewrite code by using __event method if required
/*
	    Figure.1 Overview

	                   (if snooze > snooze_max)
	 _____________________      disable     ____________________
	|                     |--------------->|                    |
	| NotificationManager |<---------------| CountdownCircleSet |
	|_____________________|      push      |____________________|
		|        ^  ^                        ^
		|        |  |                        | disable
		|        |  |                      __|___________
		|________|  |_____________________|              |
		 snooze++           dismiss       | User Dismiss |
		                                  |______________|
*/
var colors = [{ strong: "rgb(0, 200, 250)", weak: "rgb(0, 120, 150)" },
	      { strong: "rgb(250, 200, 0)", weak: "rgb(150, 120, 0)" },
	      { strong: "rgb(250, 0, 200)", weak: "rgb(150, 0, 120)" }];
var Rect = __class(function (x, y, w, h) {
	var _self = this;
	_self.x = x != undefined ? x : 0;
	_self.y = y != undefined ? y : 0;
	_self.w = w != undefined ? w : 0;
	_self.h = h != undefined ? h : 0
	_self.contains = function (x, y) {
		var l = _self.x; var t = _self.y;
		var r = l + _self.w; var b = t + _self.h;
		return l <= x && x <= r && t <= y && y <= b;
	}
	_self.clone = function () {
		return new Rect(_self.x, _self.y, _self.w, _self.h);
	}
	_self.table = function (cols, rows, cellspacing) {
		var cells = [];
		var cell_w = _self.w / cols;
		var cell_h = _self.h / rows;
		for (var r = 0; r < rows; r++) {
			for (var c = 0; c < cols; c++) {
				var x = c * cell_w + cellspacing / 2 + _self.x;
				var y = r * cell_h + cellspacing / 2 + _self.y;
				var w = Math.max(1, cell_w - cellspacing);
				var h = Math.max(1, cell_h - cellspacing);
				cells.push(new Rect(x, y, w, h));
			}
		}
		return cells;
	}
});
var MouseEventListener = __class(function (displayObject) {
	var _self = this;
	var _handler = null;
	var _pressed = false, _hover = false;
	__props(_self, [
		{ prop: 'disabled', value: false },
		{ prop: 'pressed',  get: function() { return _self.disabled ? false : _pressed } },
		{ prop: 'hover',    get: function() { return _self.disabled ? false : _hover   } } 
	]);
	_self.click = function (handler) {
		if (_handler)
			displayObject.removeEventListener("click", _handler);
		// Wrapping handler for preventing firing when disabled
		_handler = handler ? function () { if (!_self.disabled) handler.apply(this, arguments); } : null;
		if (_handler)
			displayObject.addEventListener("click", _handler);
	}
	// Shape Events
	displayObject.addEventListener("mousedown", function () { _pressed = true;  });
	displayObject.addEventListener("pressup",   function () { _pressed = false; });
	displayObject.addEventListener("mouseover", function () { _hover   = true;  });
	displayObject.addEventListener("mouseout",  function () { _hover   = false; });
});
var MouseAwareContainer = __class(function () {
	var _self = this;
	var _mel = new MouseEventListener(this);
	__props(this, [
		{ prop: 'pressed',  get: function() { return _mel.pressed; } },
		{ prop: 'hover',    get: function() { return _mel.hover;   } },
		{ prop: 'disabled', get: function() { return _mel.disabled }, set: function(value) { _mel.disabled = value; } },
	]);
	this.click = function (handler) { return _mel.click(handler); }
}, createjs.Container);
// TODO: implement WrapPanel from OperationSelector  
var OperationSelector = __class(function() {
	var _self = this;
	var _width = 0, _height = 0;
	var _item_width = 245, _item_height = 40;
	var _cellspacing = 1;
	var _max_rows = 13;
	var _itemclick = function (op, index) { }
	var _invalidated = true;
	_self.invalidate = function() { _invalidated = true; }
	__props(_self, [
		{ prop: 'background',  afterset: _self.invalidate },
		{ prop: 'operations', afterset: _self.invalidate, value: operations },
		{ prop: 'width',      get: function () { this.update(); return _width;  } },
		{ prop: 'height',     get: function () { this.update(); return _height; } },

	]);
	_self.itemclick = function () {
		if (arguments.length == 1 && typeof(arguments[0]) == "function")
			_itemclick = arguments[0];
		else if (arguments.length == 2)
			_itemclick.apply(arguments[0], arguments[1]);
	}
	_self.init = function () {
		_self.shape = new createjs.Shape();
		_self.addChild(_self.shape);
		_self.update();
	}
	_self.update = function () {
		if (_invalidated) {
			_invalidated = false;
			_width = 0;
			_height = 0;
			var count = 0;
			_self.operations.forEach(function (op, index) {
				var col = Math.floor(count / _max_rows);
				var row = count % _max_rows;
				var item_x = _cellspacing + (_item_width + _cellspacing) * col;
				var item_y = _cellspacing + (_item_height + _cellspacing) * row;
				var opb = new OperationButton();
				opb.operation = op;
				opb.x = item_x; 
				opb.y = item_y;
				opb.width = _item_width; 
				opb.height = _item_height;
				opb.click(function () { _self.itemclick(opb, [op, count]); });
				_self.addChild(opb);
				_width = Math.max(_width, item_x + _item_width + _cellspacing);
				_height = Math.max(_height, item_y + _item_height + _cellspacing);
				count++;
			});
			_self.shape.graphics.c().f(_self.background || "black").rect(0, 0, _width, _height);
		}
		_self.children.forEach(function (child) {
			if (child.update)
				child.update();
		});
	}
	_self.init();
}, createjs.Container);
var OperationButton = __class(function () {
	var _self = this;
	var _invalidated = true;
	var _strongColor, _weakColor, _strongColor_hovered, _weakColor_hovered;
	_self.invalidate = function () { _invalidated = true; }
	__props(_self, [
		{ prop: 'width',     afterset: _self.invalidate },
		{ prop: 'height',    afterset: _self.invalidate },
		{ prop: 'operation', afterset: _self.invalidate },
	]);
	_self.init = function () {
		_self.shape = new createjs.Shape();
		_self.shape_hovered = new createjs.Shape();
		_self.text_id = new createjs.Text();
		_self.text_name = new createjs.Text();
		_self.text_desc = new createjs.Text();
		_self.shape_ship = new createjs.Shape();
		_self.shape_ship_hovered = new createjs.Shape();
		_self.hitArea = _self.shape;
		_self.addChild(_self.shape);
		_self.addChild(_self.shape_hovered);
		_self.addChild(_self.text_id);
		_self.addChild(_self.text_name);
		_self.addChild(_self.text_desc);
		_self.addChild(_self.shape_ship);
		_self.update();
	}

	_self.update = function () {
		if (_invalidated && this.operation) {
			_invalidated = false;

			var op = this.operation;
			_weakColor = op.area.color;
			_strongColor = new iro.Color(_weakColor).o('s', 10).o('l', -45).css();
			_strongColor_hovered = fluoresce(_strongColor, 1.5);
			_weakColor_hovered = fluoresce(_weakColor, 1.5);

			// straight constant
			var id_fontsize_rate = 0.6; // vs _self.height
			var name_fontsize_rate = 0.45; // vs _self.height
			var desc_fontsize_rate = 0.3; // vs _self.height

			// complexed constant
			var id_region_rate = 2; // vs id_fontsize
			var ships_region_rate = 1; // vs id_fontsize
			var name_padleft_rate = 0.5; // vs name_fontsize

			// computed
			var id_fontsize = Math.round(id_fontsize_rate * _self.height);
			var ships_region_w = id_fontsize * ships_region_rate;
			var ships_region = new Rect(_self.width - ships_region_w, 0, ships_region_w, _self.height);
			var id_region = new Rect(0, 0, id_fontsize * id_region_rate, _self.height);
			var name_fontsize = Math.round(name_fontsize_rate * _self.height);
			var name_padleft = Math.round(name_padleft_rate * name_fontsize);
			var desc_fontsize = Math.round(desc_fontsize_rate * _self.height);

			_self.text_id.x = id_region.w / 2 + id_region.x;
			_self.text_id.y = id_region.h / 2 + id_region.y;
			_self.text_id.textAlign = "center";
			_self.text_id.textBaseline = "middle";
			_self.text_id.text = format("{0:d2}", op.id);
			_self.text_id.font = id_fontsize + "px Segoe UI Semilight";

			_self.text_name.x = id_region.x + id_region.w + name_padleft;
			_self.text_name.y = id_region.h / 4 + id_region.y;
			_self.text_name.textAlign = "left";
			_self.text_name.textBaseline = "middle";
			_self.text_name.text = op.name;
			_self.text_name.font = name_fontsize + "px Meiryo UI";

			var desc = new Array();
			if (op.fuel)  desc.push(format("燃 {0:d}", op.fuel));
			if (op.steel) desc.push(format("鋼 {0:d}", op.steel));
			if (op.ammo)  desc.push(format("弾 {0:d}", op.ammo));
			if (op.baux)  desc.push(format("ボ {0:d}", op.baux));

			_self.text_desc.x = id_region.x + id_region.w + name_padleft;
			_self.text_desc.y = id_region.h * 3 / 4 + id_region.y;
			_self.text_desc.textAlign = "left";
			_self.text_desc.textBaseline = "middle";
			_self.text_desc.text = desc.join(" ");
			_self.text_desc.font = desc_fontsize + "px Meiryo UI";

			// shape (background)
			[{ shape: _self.shape,         strong: _strongColor,         weak: _weakColor         },
			 { shape: _self.shape_hovered, strong: _strongColor_hovered, weak: _weakColor_hovered }]
			 .forEach(function(i) {
				i.shape.graphics.f(i.weak).rect(0, 0, _self.width, _self.height)
					.f(i.strong).rect(id_region.x, id_region.y, id_region.w, id_region.h);
				i.shape.cache(0, 0, _self.width, _self.height);	
			 });
			// ships
			var shiprect = new Rect(0, 0, ships_region.w, ships_region.h).table(2, 3, 5);
			[{ shape: _self.shape_ship,         strong: _strongColor,         weak: _weakColor  },
			 { shape: _self.shape_ship_hovered, strong: _strongColor_hovered, weak: _weakColor_hovered }]
			 .forEach(function(i) {
				i.shape.x = ships_region.x;
				i.shape.y = ships_region.y;
				if (op.ships != undefined) {
					var g = i.shape.graphics;
					op.ships.forEach(function (ship, index) {
						if (ship == ships.lightCruiser)
							g.f(i.strong);
						else if (ship == ships.destroyer ||
							ship == ships.unspecified)
							g.s(i.strong);
						var r = shiprect[index];
						g.rect(r.x, r.y, r.w, r.h);
						if (ship == ships.destroyer)
							g.mt(r.x, r.y).lt(r.x + r.w, r.y + r.h);
						g.ef().es();
					});
				}
				i.shape.cache(0, 0, ships_region.w, ships_region.h);
			 });
		}

		if (_self.hover && _self.pressed){
			_self.text_id.color   = _weakColor_hovered;
			_self.text_name.color = _strongColor_hovered;
			_self.text_desc.color = _strongColor_hovered;
			this.shape_hovered.alpha      = 0.5;
			this.shape_ship_hovered.alpha = 0.5;
		}
		else if (_self.hover) {
			_self.text_id.color   = _weakColor_hovered;
			_self.text_name.color = _strongColor_hovered;
			_self.text_desc.color = _strongColor_hovered;
			this.shape_hovered.alpha      = 1.0;
			this.shape_ship_hovered.alpha = 1.0;
		}
		else {
			_self.text_id.color = _weakColor;
			_self.text_name.color = _strongColor;
			_self.text_desc.color = _strongColor;
			this.shape_hovered.alpha = 0;
			this.shape_ship_hovered.alpha = 0;
		}
	}
	_self.init();
}, MouseAwareContainer);
var ProgressCircle = __class(function () {
	if (!ProgressCircle.static) {
		ProgressCircle.static = {};
		ProgressCircle.static.instances = 0;
	}
	var _static = ProgressCircle.static;
	_static.instances++;
	var _self = this;
	var _invalidated = true;
	var _alltext;
	var _diameter, _radius;
	var _centerX, _centerY;
	var _strongColor, _strongColor_hover;
	var _weakColor, _weakColor_hover;
	var _drawCircle = function (graphics, center_x, center_y,
		radius, _thickness, degree, foreground, background) {
		graphics.setStrokeStyle(_thickness)
			.beginStroke(background)
			.arc(center_x, center_y, radius - _thickness, 0, Math.PI * 2)
			.beginStroke(foreground)
			.arc(center_x, center_y, radius - _thickness,
				-Math.PI / 2, (degree / 360 - 0.25) * Math.PI * 2, false);
	}
	var _thickness;
	var _marqueeRadius;
	var _marqueeThickness;

	// Constants
	var thicknessRate = 4 / 15;
	var marqueeRadiusRate = 3 / 5;
	var marqueeThicknessRate = 1 / 15;
	var fontsizeRate = 32 / 150;
	var activityFontSizeRate = 0.7; // vs _thickness
	var activityCharSpacing = 30; // as deg

	_self.invalidate = function() { _invalidated = true; }
	__props(_self, [
		{ prop: 'width', value: 0, afterset: _self.invalidate },
		{ prop: 'height', value: 0, afterset: _self.invalidate },
		{ prop: 'strongColor', set: function(color) {
				_strongColor = color;
				_strongColor_hover = fluoresce(color)
				_self.invalidate();
			},
		},
		{ prop: 'weakColor', 
			set: function(color) {
				_weakColor = color;
				_weakColor_hover = fluoresce(color);
				_self.invalidate();
			},
		},
		{ prop: 'activity', 
			get: function () {
				return _self.text_activity.text;
			},
			set: function (value) {
				_self.text_activity.text = value;
				_self.text_activity.update();
			},
		},
		{ prop: 'fontFamily', value: 'Segoe UI Semilight', afterset: _self.invalidate },
		{ prop: 'activityFontFamily', value: 'Meiryo UI', afterset: _self.invalidate },
		// progress and marquee 0 - 360
		// reveserd should be true 
		// when Math..oor(marquee / 360) % 2 == 1
		{ prop: 'progress', value: 0 },
		{ prop: 'marquee', value: 0 },
		{ prop: 'timeLeft', value: '' },
		{ prop: 'endTime', value: '' },
		{ prop: 'completed', value: false },
		{ prop: 'reverse', value: false }, 
	]);

	_self.init = function () {
		_self.shape = new createjs.Shape();
		_self.text_timeLeft = new createjs.Text();
		_self.text_endTime = new createjs.Text();
		_self.hitAreaShape = new createjs.Shape();
		_self.text_activity = new TextInCircle();
		_self.text_activity.offsetDeg = activityCharSpacing;

		var inDuration = 250;
		var waitDuration = 3000;
		var outDuration = 250;
		var totalDuration = inDuration + waitDuration + outDuration;
		var delay = totalDuration - 100 * _static.instances;
		_alltext = [_self.text_timeLeft, _self.text_endTime];
		_alltext.forEach(function (text, index) {
			text.textAlign = "center";
			text.textBaseline = "middle";
			createjs.Tween.get(text, { loop: true })
				.to({ scaleX: 0, scaleY: 0, alpha: 0 }, 0)
				.wait(index * totalDuration)
				.to({ scaleX: 1, scaleY: 1, alpha: 1 }, inDuration, createjs.Ease.elasticOut)
				.wait(waitDuration)
				.to({ scaleX: 0, scaleY: 0, alpha: 0 }, outDuration, createjs.Ease.cubicOut)
				.wait((_alltext.length - 1 - index) * totalDuration)
				.setPosition(delay);
		});
		_self.cursor = "pointer";
		_self.hitArea = _self.hitAreaShape;
		_self.addChild(_self.shape);
		_self.addChild(_self.text_timeLeft);
		_self.addChild(_self.text_endTime);
		_self.addChild(_self.text_activity);
		_self.update();
	}
	_self.update = function () {
		if (_invalidated) {
			_invalidated = false;
			_diameter = Math.min(_self.width, _self.height);
			_radius = _diameter / 2;
			_centerX = _self.width / 2 + (_self.width - _diameter) / 2;
			_centerY = _self.height / 2 + (_self.height - _diameter) / 2;
			_thickness = _radius * thicknessRate;
			_marqueeRadius = _radius * marqueeRadiusRate;
			_marqueeThickness = _marqueeRadius * marqueeThicknessRate;
			_self.hitAreaShape.graphics.f("white").arc(_centerX, _centerY, _radius, 0, Math.PI * 2);
			_alltext.forEach(function (text) {
				text.font = [Math.round(fontsizeRate * _diameter), "px ", _self.fontFamily].join('');
				text.color = _strongColor;
				text.x = _self.width / 2;
				text.y = _self.height / 2;
			});
			var act = _self.text_activity;
			act.radius = _radius - _thickness;
			act.x = _centerX - act.radius;
			act.y = _centerY - act.radius;
			act.fontSize = Math.round(_thickness * activityFontSizeRate);
			act.fontFamily = _self.activityFontFamily;
			act.charSpacing = activityCharSpacing;
		}
		var strongColor = _self.hover ? _strongColor_hover : _strongColor;
		var weakColor = _self.hover ? _weakColor_hover : _weakColor;
		_self.shape.graphics.clear();
		_self.text_timeLeft.text = _self.timeLeft;
		_self.text_timeLeft.color = strongColor;
		_self.text_endTime.text = _self.endTime;
		_self.text_endTime.color = strongColor;
		_drawCircle(_self.shape.graphics, _centerX, _centerY,
			_radius, _thickness, _self.progress, strongColor,
			_self.completed && _self.reverse ? strongColor : weakColor);
		_drawCircle(_self.shape.graphics, _centerX, _centerY,
			_marqueeRadius, _marqueeThickness, _self.marquee,
			_self.reverse ? strongColor : weakColor,
			_self.reverse ? weakColor : strongColor);
	}
	_self.init();
}, MouseAwareContainer);
var CountdownCircle = __class(function () {
	var _self = this;
	var _countdown = new MomentCountdown(moment.duration(30, "m"));
	var _base = {};
	_base.update = _self.update;
	__props(_self, [
		{ prop: "countdown", get: function () { return _countdown; } },
	]);
	_self.json = function() {
		if (arguments.length == 0){
			return JSON.stringify({
				completed: _self.completed,
				startTime: _countdown.startTime.unix(),
				duration:  _countdown.duration.asSeconds(),
				activity:  _self.activity,
			});
		}
		else {
			var data = JSON.parse(arguments[0]);
			if (!data.completed) {
				var duration = moment.duration(data.duration, 's');
				var startTime = moment.unix(data.startTime);
				_self.restart(data.activity, duration, startTime, data.completed);
			}
		}
	}
	_self.restart = function (activity, duration, startTime, completed) {
		// duration must be moment.duration
		// startTime must be moment, nullable
		_self.activity = activity;
		_countdown.reset(duration, startTime);
		_countdown.completed = completed;
	}
	_self.update = function () {
		_countdown.update();
		_self.progress = _countdown.timeLeftRate * 360,
		_self.marquee = _countdown.secondRate * 360,
		_self.timeLeft = Math.ceil(_countdown.timeLeft.asMinutes());
		_self.endTime = _countdown.endTime.format("HH:mm");
		_self.completed = _countdown.completed;
		_self.reverse = _countdown.oddSecond;
		_base.update();
	}
}, ProgressCircle);
var TextInCircle = __class(function () {
	var _self = this;
	var _charList;
	var _invalidated = true;
	_self.invalidate = function() { _invalidated = true; }
	_self.animationDistance = 1;
	_self.animationDelay = 50;
	_self.animationDuration = 1000; // Each
	__props(_self, [
		{ prop: 'text',           value: '',    afterset: _self.invalidate },
		{ prop: 'fontSize',       value: 0,     afterset: _self.invalidate },
		{ prop: 'radius',         value: '',    afterset: _self.invalidate },
		{ prop: 'offsetDeg',      value: 0,     afterset: _self.invalidate },
		{ prop: 'showTestCircle', value: false, afterset: _self.invalidate },
		{ prop: 'fontFamily',     value: false, afterset: _self.invalidate },
		{ prop: 'charSpacing',    value: 0,     afterset: _self.invalidate },
	]);
	_self.init = function () {
		_charList = new createjs.Container(); 
		_self.addChild(_charList);
		_self.update();
	}
	_self.update = function () {
		if (!_invalidated) return;
		_invalidated = false;
		var text = _self.text || '';
		_charList.removeAllChildren();
		for (var c = 0; c < text.length; c++) {
			var t = new createjs.Text();
			t.text = text[c];
			t.font = [_self.fontSize, "px ", _self.fontFamily].join('');
			t.textAlign = "center";
			t.textBaseline = "middle";
			t.regY = _self.radius;
			t.rotation = (c - _self.animationDistance) * _self.charSpacing + _self.offsetDeg;
			t.alpha = 0;
			createjs.Tween.get(t)
			   .wait(c * _self.animationDelay)
			   .to({ rotation: c * _self.charSpacing + _self.offsetDeg, alpha: 1 },
				_self.animationDuration, createjs.Ease.elasticOut);
			_charList.addChild(t);
		}
		// Now, _charList (x, y) represents center point of rotation.
		// Offset by radius in order in order that its parent (x, y) represents left-top corner of entire object's bounds. 
		_charList.x = _self.radius;
		_charList.y = _self.radius;
		if (!_self.charSpacing)
			_self.charSpacing = 360 / text.length;
	}
	_self.init();
}, createjs.Container);
var MomentCountdown = __class(function () {
	var _self = this;
	var _zero = moment.duration(0, "seconds");
	__props(_self, [
		{ prop: 'duration' },
		{ prop: 'startTime' },
		{ prop: 'endTime' },
		{ prop: 'completed', value: true },
		{ prop: 'timeLeft' },
		{ prop: 'timeLeftRaw' },
		{ prop: 'secondRate' }, // for marquee
		{ prop: 'oddSecond' }, // for marquee
	]);
	__events(_self, [
		{ name: 'complete' }
	]);
	_self.reset = function (duration, startTime) {
		// duration must be moment.duration
		// startTime must be moment, nullable
		_self.duration = duration || _zero;
		_self.startTime = startTime || moment();
		_self.endTime = _self.startTime.clone().add(duration);
		_self.completed = _self.duration.asSeconds() == 0 ? true : false;
		_self.timeLeft = moment.duration(0);
		_self.timeLeftRaw = moment.duration(0);
		_self.timeLeftRate = _self.completed ? 0 : 1.0;
		_self.secondRate = 0; 
		_self.oddSecond = false;
	}
	_self.stop = function () {
		// TODO: Is _self.disabled = true correct here?
		_self.endTime = new moment();
	}
	_self.update = function () {
		_self.timeLeftRaw = moment.duration(_self.endTime.diff(moment()), "ms");
		if (!_self.completed) {
			_self.timeLeft = _self.timeLeftRaw;
			if (_self.timeLeft.asMilliseconds() < 0) {
				_self.timeLeft = _zero;
				_self.completed = true;
				_self.complete();
				// Never return here, must update some propreties always for marquee animation
			}
			_self.secondRate = _self.timeLeft.milliseconds() / 1000;
			_self.timeLeftRate = _self.timeLeft.asMilliseconds() / _self.duration.asMilliseconds();
		}
		_self.oddSecond = Math.abs(_self.timeLeftRaw.seconds()) % 2 != 1;
	}
	_self.reset();
});
var Button = __class(function() {
	var _self = this;
	// TODO: declare 'RectShape' that can change color more easily (?)
	var _shape, _shape_hovered, _text;
	var _foreground_hovered, _background_hovered;
	var _invalidated = true;
	_self.invalidate = function() { _invalidated = true; };
	__props(_self, [
		{ prop: 'width',      beforeget: _self.update, }, 
		{ prop: 'height',     beforeget: _self.update, }, 
		{ prop: 'foreground', afterset:  _self.invalidate, },
		{ prop: 'background', afterset:  _self.invalidate, },
		{ prop: 'padding',    afterset:  _self.invalidate, value: { left: 0, right: 0, top: 0, bottom: 0 }, }, 
		{ prop: 'fontFamily', afterset:  _self.invalidate, value: 'Meiryo UI' },
		{ prop: 'fontSize',   afterset:  _self.invalidate, },
		{ prop: 'text',       afterset:  _self.invalidate, },
	]);
	_self.init = function () {
		_shape = new createjs.Shape();
		_shape_hovered = new createjs.Shape();
		_text = new createjs.Text();
		_self.hitArea = _shape;
		_self.addChild(_shape);
		_self.addChild(_shape_hovered);
		_self.addChild(_text);
		_self.update();
	}
	_self.update = function () {
		if (_invalidated) {
			_invalidated = false;	
			_text.text = _self.text;
			_text.font = [Math.round(_self.fontSize), "px '" , _self.fontFamily, "'"].join('');
			_text.textBaseline = "middle";
			_text.textAlign = "center";
			var mw = _text.getMeasuredWidth(), mh = _text.getMeasuredHeight();
			_self.width = mw + _self.padding.left + _self.padding.right;
			_self.height = mh + _self.padding.top + _self.padding.bottom;
			_text.x = _self.width / 2;
			_text.y = _self.height / 2;
			_text.color = _self.foreground;
			_background_hovered = fluoresce(_self.background);
			_foreground_hovered = fluoresce(_self.foreground);
			[{ shape: _shape,         color: _self.background },
			 { shape: _shape_hovered, color: _background_hovered }]
			 .forEach(function(i){
				i.shape.graphics.clear().beginFill(i.color).drawRect(0, 0, _self.width, _self.height);
				i.shape.cache(0, 0, _self.width, _self.height);
			 });
		}
		if (_self.disabled) {
			_text.color          = _self.foreground;
			_text.alpha          = 0.2;
			_shape.alpha         = 0.2;
			_shape_hovered.alpha = 0;
		}
		else if (_self.hover && _self.pressed){
			_text.color          = _foreground_hovered;
			_text.alpha          = 1;
			_shape.alpha         = 1;
			_shape_hovered.alpha = 0.5;
		}
		else if (_self.hover) {
			_text.color          = _foreground_hovered;
			_text.alpha          = 1;
			_shape.alpha         = 1;
			_shape_hovered.alpha = 1.0;
		}
		else {
			_text.color          = _self.foreground;
			_text.alpha          = 1;
			_shape.alpha         = 1;
			_shape_hovered.alpha = 0;
		}
	}
	_self.init();
}, MouseAwareContainer);
// Panel size(width, height) is auto in contrast with other controls  
var Panel = __class(function() {
	// TODO: add _border shape and border thickness boder color
	var _self = this;
	var _base = {};
	var _bkg, _bkg_invalidated = true;
	var _invalidated = true;
	_self.invalidate = function (){ _invalidated = true; };
	// Skip children added by super-class
	var _skip; 
	// Do not use children.forEach on Panel and its sub-classes
	// Use 'all' method to enumerate all children. See '_skip' field
	// Pay attention that index of predicate(child, index) is relative index  
	_self.all = function(predicate) {
		var result = true;
		for (var c = _skip; c < _self.children.length; c ++)
			result &= predicate.apply(_self, [_self.children[c], c - _skip]);
		return result;
	}
	__props(_self, [
		{ prop: 'disabled', afterset: _self.all(function(c){ c.disabled = _self.disabled })},
		{ prop: 'background', afterset: function() { _bkg_invalidated = true; } },
	]);
	['addChild', 'removeChild', 'swapChild'].forEach(function(method){
		_base[method] = _self[method];
		_self[method] = function() {
			_base[method].apply(_self, arguments);	
			_self.invalidate();
		}
	});
	// override layout method to change layout behavior
	_self.layout = function () {
		var r = 0, b = 0
		_self.all(function(child, index){
			r = Math.max(r, child.x + child.width);
			b = Math.max(b, child.y + child.height);
		});
		_self.width = r;
		_self.height = b;
	}
	_self.init = function(){
		_bkg = new createjs.Shape();
		_self.addChild(_bkg);
		_skip = _self.children.length;
		_self.update();
	}
	_self.update = function(){
		_self.all(function(c) { if (c.update) c.update(); });
		if (_invalidated) {
			_invalidated = false;
			_self.layout.apply(_self);
			// Invalidate bkg because layout may change width and height
			_bkg_invalidated = true;
		}
		if (_bkg_invalidated) {
			_bkg_invalidated = false;
			_bkg.graphics.c();
			if (_self.background)
				_bkg.graphics.f(_self.background)
					.dr(0, 0, _self.width, _self.height);
			_bkg.cache(0, 0, _self.width, _self.height);		
		}
	}
	_self.init();
}, createjs.Container);
var StackPanel = __class(function(){
	var _self = this;
	_self.aligntest = function () { 
		var ca = _self.childAlignment;
		return /^c/i.test(ca) ? 0 : (/^n/i.test(ca) ? -1 : 1); 
	}
	_self.verttest = function () { return /^v/i.test(_self.orientation); }
	__props(_self, [
		{ prop: 'padding', value: 10, afterset: _self.invalidate },
		{ prop: 'childSpacing', value: 0, afterset: _self.invalidate },
		{ prop: 'childAlignment', value: 'center', afterset: _self.invalidate },
		{ prop: 'orientation', value: 'horizontal', afterset: _self.invalidate },
	]);
	_self.layout = function () {
		var vert = _self.verttest();
		var align = _self.aligntest();
		var tw = _self.padding;
		var mh = 0;
		var nx = vert ? 'y' : 'x';
		var ny = vert ? 'x' : 'y';
		var nw = vert ? 'height' : 'width';
		var nh = vert ? 'width' : 'height';
		_self.all(function(child, index) {
			mh = Math.max(mh, child[nh]);
		});
		_self.all(function(child, index){
			if (index > 0) { tw += _self.childSpacing; }
			var dh = mh - child[nh]; 
			child[nx] = tw;
			child[ny] = align == 0 ? (dh / 2 + _self.padding) : (align < 0 ? dh : 0);
			tw += child[nw];
		});
		_self[nw] = tw + _self.padding;
		_self[nh] = mh + _self.padding * 2;
	}
}, Panel);
var BrickStackPanel = __class(function() {
	var _self = this;
	__props(_self,[
		{ prop: 'verticalChildSpacing',   value: 0, afterset: _self.invalidate },
		{ prop: 'horizontalChildSpacing', value: 0, afterset: _self.invalidate }
	]);
	_self.layout = function () {
		var align = _self.aligntest();
		var vert = _self.verttest();
		var nx = vert ? 'y' : 'x';
		var ny = vert ? 'x' : 'y';
		var nw = vert ? 'height' : 'width';
		var nh = vert ? 'width'  : 'height';
		var hcs = (vert ? _self.verticalChildSpacing : _self.horizontalChildSpacing) + _self.childSpacing;
		var vcs = (vert ? _self.horizontalChildSpacing : _self.verticalChildSpacing) + _self.childSpacing;
		var even = [], odds = [];
		even.mh = 0; odds.mh = 0;
		_self.all(function(c, i) { (i % 2 == 0 ? even : odds).push(c) });
		even.forEach(function(c) { even.mh = Math.max(even.mh, c[nh]); })
		odds.forEach(function(c) { odds.mh = Math.max(odds.mh, c[nh]); })
		var x = _self.padding;
		even.forEach(function(c, i) {
			var diff = even.mh - c[nh];
			c[ny]  = align == 0 ? diff / 2 : (align == -1 ? 0 : diff); 
			c[ny] += _self.padding;
			c[nx]  = x;
			c[nx] += i > 0 ? hcs : 0;
			x      = c[nx] + c[nw];
		});
		odds.forEach(function(c, i) {
			var diff = odds.mh - c[nh];
			c[ny]  = align == 0 ? diff / 2 : (align == -1 ? -diff : 0); 
			c[ny] += even.mh + vcs;
			c[ny] += _self.padding;
			c[nx]  = even[i][nx] + even[i][nw] - c[nw] / 2;
			c[nx] += hcs / 2; 
			x      = Math.max(x, c[nx] + c[nw]);
		});
		_self[nw] = x + _self.padding;
		_self[nh] = even.mh + odds.mh + _self.padding * 2 + (odds.length > 0 ? vcs : 0);
	}
}, StackPanel);
var AudioFadeoutDisposer = __class(function () {
	var _self = this;
	var _tween;
	var _current;
	_self.clear = function() {
		if (_current)
			_current.remove();
		_current = null;
		_tween = null;
	}
	_self.push = function(audio, duration){	
		_current = audio;
		if (!audio) return;
		if (_tween)  _self.clear(); 
		_tween = mktween(audio, duration).call(_self.clear);
	}
	function mktween(audio, duration){
		var vctrl = {};
		__props(vctrl, [{ 
			prop: 'volume', 
			set: function (value) {
				if (!audio) return;
				audio.prop('volume', value);
			},
			get: function () {
				if (!audio) return 0;
				return audio.prop('volume');
			}
		}]);
		return createjs.Tween.get(vctrl, {override: true})
			.to({ volume: 0 }, duration);
	}
});
var AudioPlayer = __class(function() {
	// https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
	var _self = this;
	var _audio;
	var _disposer = new AudioFadeoutDisposer();
	var _tween;
	var _afterstop;
	var _playing;
	__props(_self, [
		{ prop: 'playing', get: function(){ return _playing; } }
	]);
	_self.play = function (dataURL) {
		_playing = true;
		// Cross fade 5000ms
		_disposer.push(_audio, 5000);
		_audio = $('<audio>')
			.css('width', '0px')
			.css('height', '0px')
			.css('visibility', 'hidden')
			.attr('autoplay', 'autoplay')
			.prop('loop', 'true')
			.appendTo(document.body);
		_audio.get(0).src = dataURL;
	}
	_self.stop = function () {
		_playing = false;
		// Stop quickly 500ms
		_disposer.push(_audio, 500);
	}
	function fadeout(audio) {
	}
});
var NotificationManager = __class(function(){
	var _self   = this;
	var _player = new AudioPlayer();
	var _startTime;
	var _stopTime;
	var _tick;
	__props(_self, [
		{ prop: "ringDuration",   value: moment.duration(10, 's') },
		{ prop: "snoozeCount",    valeu: 0 },
		{ prop: "snoozeMaxCount", value: 3 },
		{ prop: "snoozeInterval", value: moment.duration(10, 's') },
		{ prop: "audioURL" },
	]);
	__events(_self, [
		{ name: "snooze" },
	]);
	_self.snooze(function(){
		console.log("snooze! " + _self.snoozeCount);
	});
	_tick = setInterval(function(){
		var now = moment().unix();
		if (_startTime && now > _startTime) {
			_startTime = null;
			_self.snoozeCount++;
			_self.playWhile(_self.ringDuration);
			_self.snooze();
		}
		if (_stopTime && now > _stopTime) {
			_player.stop();			
			_stopTime = null;
			if (_self.snoozeCount < _self.snoozeMaxCount) {
				_self.playAfter(_self.snoozeInterval);
			}
		}
	}, 500);
	_self.playAfter = function(duration){
		_startTime = moment().add(duration).unix();
	}
	_self.playWhile = function(duration){
		_stopTime = moment().add(duration).unix();
		_player.play(_self.audioURL);
	}
	_self.push = function(circle){
		// circle must be CountdownCircle class
		// TODO: Notification log
		_self.snoozeCount = 0;
		_self.playWhile(_self.ringDuration);
	}
});
var CountdownCircleSet = __class(function(){
	var _self = this;
	var _invalidated = false;
	var _factories = [{ w: 150, h: 150, c: colors[0] },
		 	  { w: 300, h: 300, c: colors[1] },
			  { w: 150, h: 150, c: colors[2] }];
	__events(_self, [
		{ name: 'itemclick' },
		{ name: 'itemcomplete'  },
	]);
	_self.padding = 0;
	_self.orientation = 'v';
	_self.verticalChildSpacing = 80;
	_self.horizontalChildSpacing = -40;
	_self.childSpacing = 0;
	_self.json = function() {
		if (arguments.length == 0){
			var data = [];
			// TODO: Should assert circle is CountDownCircle?
			_self.all(function(circle){ 
				data.push(circle.json());
			});
			return JSON.stringify(data);
		}
		else {
			if (!arguments[0]) return;
			var data = JSON.parse(arguments[0]);
			_self.all(function(circle, index) {
				circle.json(data[index]);
			});
		}
	}
	_factories.forEach(function(f){
		var c = new CountdownCircle();
		// TODO: set them when operation is stored at KeyValueStore, otherwise set defaults
		// WARNING: operations[index] is unavailable now. (some index will returns null)
		// c.restartOperation(operations[index]);
		c.width = f.w;
		c.height = f.h;
		c.strongColor = f.c.strong;
		c.weakColor = f.c.weak;
		c.click(function () { _self.itemclick.apply(c); });
		// TODO: CountdownCircle.complete comflicted with CountdownCircle.countdown.complete
		c.countdown.complete(function () { _self.itemcomplete.apply(c); });
		_self.addChild(c);
	});
}, BrickStackPanel);
var AudioSelectModal = __class(function () {
	var _self = this;
	var _fileInput;
	var _outerPanel;
	var _text1;
	var _text2;
	var _selectButton;
	var _testButton;
	var _testPlayer;
	var _removeBUtton;
	var _btnPanel;
	var _invalidated = true;
	function getButton(msg, color) {
		var button = new Button();
		button.text = msg;
		button.fontFamily = 'Meiryo UI';
		button.fontSize = 18;
		button.padding = { left : 50, right : 50, bottom: 10, top: 10 };
		button.foreground = color.strong;
		button.background = color.weak;
		return button;
	}
	_self.invalidate = function () { _invalidated = true; }
	__props(_self, [
		{ prop: 'width', get: function() { _self.update(); return _outerPanel.width } },
		{ prop: 'height', get: function() { _self.update(); return _outerPanel.height } },
		{ prop: 'background', value: '#111', afterset: _self.invalidate },
		{ prop: 'foreground', value: '#eee', afterset: _self.invalidate },
		{ prop: 'messageFontSize', value: 18, afterset: _self.invalidate },
		{ prop: 'messageFontFamily', value: 'Meiryo UI', afterset: _self.invalidate },
		{ prop: 'audioURL', afterset: function () { _self.change(); } },
	]);
	__events(_self, [
		{ name: 'change' }
	]);
	_self.stopTest = function () {
		_testPlayer.stop();
	}
	_self.init = function() {
		_testPlayer = new AudioPlayer();
		_fileInput = $('<input>')
			.attr('type', 'file')
			.css('width', '0px')
			.css('height', '0px')
			.css('visibility', 'false')
			.appendTo(document.body)
			.change(function (e1) {
				var reader = new FileReader();
				// http://www.w3.org/TR/FileAPI/#dfn-load-event
				reader.onload = function (e2) {
					_self.audioURL = e2.target.result;
				}
				reader.readAsDataURL(e1.target.files[0]);
			});
		_selectButton = getButton('設定', colors[1]);
		_selectButton.click(function () { 
			_testPlayer.stop(); 
			_fileInput.click();
		});
		_testButton   = getButton('テスト', colors[2]);
		_testButton.click(function () {
			_testPlayer.play(_self.audioURL);
		});
		_removeButton = getButton('削除', colors[0]);
		_removeButton.click(function () {
			_testPlayer.stop();
			_self.audioURL = null;
		});
		_self.change(function(){
			var hasDataURL = (_self.audioURL != null);
			_selectButton.disabled =  hasDataURL;
			_testButton.disabled   = !hasDataURL;
			_removeButton.disabled = !hasDataURL;
			_text1.text = !hasDataURL ? 'アラーム音は設定してください' 
				: 'アラーム音はブラウザに保存されています';
			_text2.text = !hasDataURL ? '選択したファイルはブラウザに保存されます'
				: sizestr(_self.audioURL.length);
			// invalidate to re-calculate text bounds 
			_self.invalidate();
		});
		_btnPanel = new StackPanel();
		_text1 = new createjs.Text();
		_text2 = new createjs.Text();
		_outerPanel = new StackPanel();
		_outerPanel.addChild(_text1);
		_outerPanel.addChild(_text2);
		_outerPanel.addChild(_btnPanel)
		_outerPanel.orientation = 'v';
		_outerPanel.childArrangement = 'n';
		_outerPanel.childSpacing = 40;
		_btnPanel.childSpacing = 10;
		_btnPanel.orientation = 'h';
		_btnPanel.addChild(_selectButton);
		_btnPanel.addChild(_testButton);
		_btnPanel.addChild(_removeButton);
		_self.addChild(_outerPanel);
		_self.change();
		_self.update();
	}
	_self.update = function (){
		if (_invalidated) {
			_invalidated = false;
			_outerPanel.background = _self.background;
			var font = [Math.round(_self.messageFontSize), 'px ', _self.messageFontFamily].join('');
			[_text1, _text2].forEach(function(text){
				text.color  = _self.foreground;
				text.font   = font;
				text.width  = text.getMeasuredWidth();
				text.height = text.getMeasuredHeight();
				text.cache(0, 0, text.width, text.height * 1.2);
			});
			// _outerPanel must be layouted forcely
			_outerPanel.layout();
		} 
		_outerPanel.update();
		_btnPanel.update();
	}
	_self.init();
}, createjs.Container);
var Speaker = __class(function () {
	var _self = this;
	var _dp, _hdp; 
	var _invalidated = true;
	_self.invalidate = function() { _invalidated = true }
	__props(_self, [
		{ prop: 'width',      value: 40,     afterset: _self.invalidate },
		{ prop: 'height',     value: 40,     afterset: _self.invalidate },
		{ prop: 'color',      value: '#0ef', afterset: _self.invalidate },
		{ prop: 'mutedColor', value: '#f0e', afterset: _self.invalidate },
		{ prop: 'volume',     value: 0,      afterset: _self.invalidate },
	]);
	_self.init = function() {
		_dp = new createjs.DisplayObject();
		_hdp = new createjs.DisplayObject();
		_dp.base_draw = _dp.draw;
		_hdp.base_draw = _hdp.draw;
		_self.addChild(_dp);
		_self.addChild(_hdp);

		var hitArea = new createjs.Shape();
		hitArea.graphics.f('#000').rect(0, 0, _self.width, _self.height);
		_self.hitArea = hitArea;

		_self.update();
	}
	_self.update = function() {
		if (_invalidated) {
			_invalidated = false;
			var color  = _self.volume == 0 ? _self.mutedColor : _self.color; 
			var hcolor = fluoresce(color);
			[{ dp: _dp,  color: color },
			 { dp: _hdp, color: hcolor }]
			 .forEach(function(i){
				i.dp.draw = function (ctx, ic) {
					if (this.base_draw(ctx,ic)) return true; 
					var style = {
						body_c: i.color,
						wave_c: [i.color, i.color, i.color],
						mute_c: i.color,
					}
					canvasicon.drawSpeaker(ctx, 0, 0,
						_self.width, _self.height, _self.volume, style);
					return true;
				}
				i.dp.cache(0, 0, _self.width, _self.height);
			 });
		}
		if (_self.disabled) {
		}
		else if (_self.hover && _self.pressed){
			_hdp.alpha = 0.5;
		}
		else if (_self.hover) {
			_hdp.alpha = 1.0
		}
		else {
			_hdp.alpha = 0;
		}
	}
	_self.init();
}, MouseAwareContainer);
// Utilities
function padLeft(val, length) {
	return length >= val.toString().length ? (function (c, l) {
		for (var n = 0; n < l; n++) c += c[0];
		return c;
	}('0', length) + val).slice(-length) : val;
}
function format(fmt) {
	var args = arguments;
	return fmt.replace(/{(\d)(?::(\w)(\d)?)?}/g,
	function (m, g1, g2, g3) {
		var p = args[parseInt(g1) + 1];
		if (typeof (g2) == "undefined") { return p; }
		switch (g2) {
			case "d":
				var d = p.toString();
				return g3 ? padLeft(d, g3) : d;
			case "x":
				var h = p.toString(16);
				return g3 ? padLeft(h, g3) : h;
		}
	});
}
function fluoresce(css, multiplier) {
	if (multiplier === undefined) multiplier = 1;
	var c = new iro.Color(css);
	return (c.h > 180 ? c.o('h', -5) : c.o('h', 5)).o('s', 20 * multiplier).o('l', 10 * multiplier).css('hex');
}
function sizestr(length) {
	var units   = ['バイト', 'KB', 'MB'];
	var divider = 1;
	for (var c = 0; c < units.length; c++, divider *= 1024) 
		if (length < divider * 1024)
			break;
	return [(length / divider).toFixed(2), units[c]].join('');
}
