/* Abukuma.js Copyright (C) Retorillo
   Dependencies: classdef.js, create.js, moment.js */
//TODO: replaced by createjs.Rectangle
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
				//TODO: opb.backgroud ?
				// _self.background = background;
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
	_self.invalidate = function () { _invalidated = true; }
	__props(_self, [
		{ prop: 'width',     afterset: _self.invalidate },
		{ prop: 'height',    afterset: _self.invalidate },
		{ prop: 'operation', afterset: _self.invalidate },
	]);
	_self.init = function () {
		_self.hoverlight = new createjs.Shape();
		_self.shape = new createjs.Shape();
		_self.text_id = new createjs.Text();
		_self.text_name = new createjs.Text();
		_self.text_desc = new createjs.Text();
		_self.shape_ship = new createjs.Shape();
		_self.hitArea = _self.shape;
		_self.addChild(_self.shape);
		_self.addChild(_self.text_id);
		_self.addChild(_self.text_name);
		_self.addChild(_self.text_desc);
		_self.addChild(_self.shape_ship);
		_self.addChild(_self.hoverlight);
		_self.update();
	}
	_self.update = function () {
		if (_invalidated && this.operation) {
			_invalidated = false;

			var op = this.operation;
			var strongColor = op.area.strongColor;
			var weakColor = op.area.weakColor;

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

			_self.shape.graphics.f(weakColor).rect(0, 0, _self.width, _self.height)
				.f(strongColor).rect(id_region.x, id_region.y, id_region.w, id_region.h);

			_self.hoverlight.alpha = 0;
			_self.hoverlight.graphics.f("white").rect(0, 0, _self.width, _self.height);

			_self.text_id.color = weakColor;
			_self.text_id.x = id_region.w / 2 + id_region.x;
			_self.text_id.y = id_region.h / 2 + id_region.y;
			_self.text_id.textAlign = "center";
			_self.text_id.textBaseline = "middle";
			_self.text_id.text = format("{0:d2}", op.id);
			_self.text_id.font = id_fontsize + "px Segoe UI Semilight";

			_self.text_name.color = strongColor;
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

			_self.text_desc.color = strongColor;
			_self.text_desc.x = id_region.x + id_region.w + name_padleft;
			_self.text_desc.y = id_region.h * 3 / 4 + id_region.y;
			_self.text_desc.textAlign = "left";
			_self.text_desc.textBaseline = "middle";
			_self.text_desc.text = desc.join(" ");
			_self.text_desc.font = desc_fontsize + "px Meiryo UI";

			//ships
			_self.shape_ship.x = ships_region.x;
			_self.shape_ship.y = ships_region.y;
			var shiprect = makeGrid(new Rect(0, 0, ships_region.w, ships_region.h), 2, 3, 5);
			if (op.ships != undefined) {
				var g = _self.shape_ship.graphics;
				op.ships.forEach(function (ship, index) {
					if (ship == ships.lightCruiser)
						g.f(strongColor);
					else if (ship == ships.destroyer ||
						ship == ships.unspecified)
						g.s(strongColor);
					var r = shiprect[index];
					g.rect(r.x, r.y, r.w, r.h);
					if (ship == ships.destroyer)
						g.mt(r.x, r.y).lt(r.x + r.w, r.y + r.h);
					g.ef().es();
				});
			}
		}

		if (_self.hover && _self.pressed)
			this.hoverlight.alpha = 0.4;
		else if (_self.hover)
			this.hoverlight.alpha = 0.2;
		else
			this.hoverlight.alpha = 0;
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
	var activityFontSizeRate = 0.7; //vs _thickness
	var activityPadding = 30; //as deg

	_self.invalidate = function() { _invalidated = true; }
	__props(_self, [
		{ prop: 'width', value: 0, afterset: _self.invalidate },
		{ prop: 'height', value: 0, afterset: _self.invalidate },
		{ prop: 'strongColor', set: function(color) {
				var c = new iro.Color(color)
				_strongColor = c.css('hex');
				_strongColor_hover = fluoresce(c).css('hex');
				_self.invalidate();
			},
		},
		{ prop: 'weakColor', set: function(color) {
				var c = new iro.Color(color)
				_weakColor = c.css('hex');
				_weakColor_hover = fluoresce(c).css('hex');
				_self.invalidate();
			},
		},
		{ prop: 'activity', set: function (value) {
				return _self.text_activity.update(value, 
					_centerX, _centerY, _radius - _thickness,
					Math.round(_thickness * activityFontSizeRate), 
					"Meiryo UI", activityPadding);
			},
		},
		{ prop: 'fontFamily', value: 'Segoe UI Semilight', afterset: _self.invalidate },
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
		_self.text_activity = new TextInCircle(activityPadding, false);
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
	var _base = {}
	_base.update = _self.update;
	__props(_self, [
		{ prop: "startTime", get: function () { return _countdown.startTime; } },
		{ prop: "duration", get: function () { return _countdown.duration; } }
	]);
	_self.restart = function (activity, duration, startTime) {
		// duration must be moment.duration
		// startTime must be moment, nullable
		_self.activity = activity;
		_countdown.reset(duration, startTime);
	}
	_self.update = function () {
		_countdown.update();
		this.progress = _countdown.timeLeftRate * 360,
		this.marquee = _countdown.secondRate * 360,
		this.timeLeft = Math.ceil(_countdown.timeLeft.asMinutes());
		this.endTime = _countdown.endTime.format("HH:mm");
		this.completed = _countdown.completed;
		this.reverse = _countdown.oddSecond;
		_base.update();
	}
}, ProgressCircle);
var TextInCircle = __class(function (offsetDeg, showTestCircle) {
	// Private Members
	var _self = this;
	// Public Members
	_self.testCircle = new createjs.Shape();
	_self.testCircle.visible = showTestCircle;
	_self.animationDistance = 1;
	_self.animationDelay = 50;
	_self.animationDuration = 1000; // Each
	_self.update = function (text, center_x, center_y, radius, font_size, font_family, char_spacing) {
		text = text || "";

		if (!char_spacing)
			char_spacing = 360 / text.length;

		_self.testCircle.graphics
		    .clear()
		    .s("red")
		    .arc(0, 0, radius, 0, Math.PI * 2);

		_self.removeAllChildren();
		_self.addChild(_self.testCircle);

		for (var c = 0; c < text.length; c++) {
			var t = new createjs.Text();
			t.text = text[c];
			t.font = font_size + "px " + font_family;
			t.textAlign = "center";
			t.textBaseline = "middle";
			t.regY = radius;
			t.rotation = (c - _self.animationDistance)
			    * char_spacing + offsetDeg;
			t.alpha = 0;

			createjs.Tween.get(t)
			   .wait(c * _self.animationDelay)
			   .to({
			   	rotation: c * char_spacing + offsetDeg,
			   	alpha: 1
			   }, _self.animationDuration,
				  createjs.Ease.elasticOut);

			_self.addChild(t);
		}
		_self.x = center_x;
		_self.y = center_y;
	}
}, createjs.Container);
var MomentCountdown = __class(function () {
	// Private Members
	var _self = this;
	var _zeroLeft = moment.duration(0, "seconds");
	// Public Members
	_self.reset = function (duration, startTime) {
		// duration must be moment.duration
		// startTime must be moment, nullable
		_self.duration = duration;
		_self.startTime = startTime || moment();
		_self.endTime = _self.startTime.clone().add(duration);
		_self.completed = false;
		_self.timeLeft = null;
		_self.timeLeftRaw = null;
		_self.timeLeftRate = 1.0;
		_self.secondRate = 0; // for marquee
		_self.oddSecond = false; // for marquee
	}
	_self.stop = function () {
		_self.endTime = new moment();
	}
	_self.update = function () {
		_self.timeLeft = _self.timeLeftRaw = moment.duration(_self.endTime.diff(moment()), "ms");
		if (_self.timeLeftRaw.asMilliseconds() < 0) {
			_self.timeLeft = _zeroLeft;
			_self.completed = true;
		}
		_self.secondRate = _self.timeLeft.milliseconds() / 1000;
		_self.oddSecond = Math.abs(_self.timeLeftRaw.seconds()) % 2 != 1;
		_self.timeLeftRate = _self.timeLeft.asMilliseconds() / _self.duration.asMilliseconds();
	}

	_self.reset(_zeroLeft);
});
var Button = __class(function() {
	var _self = this;
	var _shape = new createjs.Shape();
	var _text = new createjs.Text();
	var _invalidated = true;
	_self.addChild(_shape);
	_self.addChild(_text);
	  	
	_self.invalidate = function() {
		_invalidated = true;
	};

	__props(_self, [
		{ prop: 'width', beforeget: _self.update  }, 
		{ prop: 'height', beforeget: _self.update }, 
		{ prop: 'foreground', afterset: _self.invalidate },
		{ prop: 'background', afterset: _self.invalidate },
		{ prop: 'padding', afterset: _self.invalidate, value: { left: 0, right: 0, top: 0, bottom: 0 } }, 
		{ prop: 'fontFamily', afterset: _self.invalidate, },
		{ prop: 'fontSize', afterset: _self.invalidate, },
		{ prop: 'text', afterset: _self.invalidate }
	]);

	_self.update = function () {
		if (!_invalidated) return;
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
		_shape.graphics.clear()
			.beginFill(_self.background)
			.drawRect(0, 0, _self.width, _self.height);
	}
}, MouseAwareContainer);
var StackPanel = __class(function(){
	var _self = this;
	var _base = {};
	var _algn = 0; 
	var _vert = false;
	var _bkg  = new createjs.Shape();
	_self.addChild(_bkg);
	var _invalidated = true;
	var _skip = _self.children.length;

	_self.invalidate = function (){
		_invalidated = true;
	};

	['addChild', 'removeChild', 'swapChild'].forEach(function(method){
		_base[method] = _self[method];
		_self[method] = function() {
			_base[method].apply(_self, arguments);	
			_self.invalidate();
		}
	});

	__props(_self, [
		{ prop: 'background', afterset: _self.invalidate },
		{ prop: 'padding', value: 10, afterset: _self.invalidate },
		{ prop: 'childSpacing', value: 0, afterset: _self.invalidate },
		{ prop: 'childAlignment',
			get: function() {
				return _algn != 0 ? (_algn < 0 ? 'near' : 'far') : 'center';
			},
			set: function(value) {
				_algn = /^c/i.test(value) ? 0 : (/^n/i.test(value) ? -1 : 1);
				_self.invalidate();
			}
		},
		{ prop: 'orientation',
			get: function() {
				return _vert ? "vertical" : "horizontal";
			},
			set: function(value) {
				_vert = /^v/i.test(value);
				_self.invalidate();
			}
		}
	]);
	
	_self.update = function () {
		_self.children.forEach(function(c) { if (c.update) c.update(); });
		if (!_invalidated) return;
		_invalidated = false;
		var tw = _self.padding;
		var mh = 0;
		var nx = _vert ? 'y' : 'x';
		var ny = _vert ? 'x' : 'y';
		var nw = _vert ? 'height' : 'width';
		var nh = _vert ? 'width' : 'height';
		_self.children.forEach(function(child, index) {
			if (index < _skip) return; 
			mh = Math.max(mh, child[nh]);
		});
		_self.children.forEach(function(child, index){
			if (index < _skip) return;
			if (index > _skip) {
				tw += _self.childSpacing;
			}
			var dh = mh - child[nh]; 
			child[nx] = tw;
			child[ny] = _algn == 0 ? (dh / 2 + _self.padding) : (_algn < 0 ? dh : 0);
			tw += child[nw];
		});
		_self[nw] = tw + _self.padding;
		_self[nh] = mh + _self.padding * 2;
		_bkg.graphics.c();
		if (_self.background)
			_bkg.graphics.f(_self.background).dr(0, 0, !_vert ? _self[nw] : _self[nh], !_vert ? _self[nh] : _self[nw]);
	}
}, createjs.Container);
var SoundModal = __class(function () {
	var _self = this;
	var _outerPanel;
	var _message;
	var _btnPanel;
	var _invalidated = true;
	function getButton(msg, color) {
		var button = new Button();
		button.text = msg;
		button.fontFamily = 'Meiryo UI';
		button.fontSize = 20;
		button.padding = { left : 10, right : 10, bottom: 10, top: 10 };
		button.foreground = color.strong;
		button.background = color.weak;
		button.update();
		return button;
	}
	_self.invalidate = function () {
		_invalidated = true;
	}
	__props(_self, [
		{ prop: 'width', get: function() { _self.update(); return _outerPanel.width } },
		{ prop: 'height', get: function() { _self.update(); return _outerPanel.height } },
		{ prop: 'title', afterset: _self.invalidate },
		{ prop: 'background', value: 'white', afterset: _self.invalidate },
		{ prop: 'foreground', value: 'dimgray', afterset: _self.invalidate },
		{ prop: 'message', value: 'アラーム音は設定されていません', afterset: _self.invalidate },
		{ prop: 'messageFontSize', value: 20, afterset: _self.invalidate },
		{ prop: 'messageFontFamily', value: 'Meiryo UI', afterset: _self.invalidate },
	]);
	_self.init = function() {
		_btnPanel = new StackPanel();
		_message = new createjs.Text();
		_outerPanel = new StackPanel();
		_outerPanel.addChild(_message);
		_outerPanel.addChild(_btnPanel)
		_outerPanel.orientation = 'v';
		_outerPanel.childArrangement = 'n';
		_outerPanel.childSpacing = 40;
		_btnPanel.childSpacing = 10;
		_btnPanel.orientation = 'h';
		_btnPanel.addChild(getButton('アラーム音を設定する', colors[1]));
		_btnPanel.addChild(getButton('アラーム音を削除する', colors[0]));
		_self.addChild(_outerPanel);
		_self.update();
	}
	_self.update = function (){
		_outerPanel.update();
		_btnPanel.update();
		if (!_invalidated) return;
		_invalidated = false;
		_outerPanel.background = _self.background;
		_message.text = _self.message;
		_message.color = _self.foreground;
		_message.font = [Math.round(_self.messageFontSize), 'px ', _self.messageFontFamily].join('');
		_message.width = _message.getMeasuredWidth();
		_message.height = _message.getMeasuredHeight();
	}
	_self.init();
}, createjs.Container);
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
function makeGrid(rect, cols, rows, cellspacing) {
	var rects = new Array();
	var cell_w = rect.w / cols;
	var cell_h = rect.h / rows;
	for (var r = 0; r < rows; r++) {
		for (var c = 0; c < cols; c++) {
			var x = c * cell_w + cellspacing / 2 + rect.x;
			var y = r * cell_h + cellspacing / 2 + rect.y;
			var w = Math.max(1, cell_w - cellspacing);
			var h = Math.max(1, cell_h - cellspacing);
			rects.push(new Rect(x, y, w, h));
		}
	}
	return rects;
}
function zigzagSort(x, y, rects, padx, pady, oddbase) {
	if (padx == undefined) padx = 0;
	if (pady == undefined) pady = 0;

	var evenRects = new Array();
	var oddRects = new Array();
	rects.forEach(function (rect, index) {
		(index % 2 == 1 ? oddRects : evenRects).push(rect);
	});
	var even_maxw = 0;
	var even_totalh = 0;
	var odd_maxw = 0;
	var odd_totalh = 0;
	evenRects.forEach(function (rect) { even_maxw = Math.max(rect.w, even_maxw); even_totalh += rect.h; });
	oddRects.forEach(function (rect) { odd_maxw = Math.max(rect.w, odd_maxw); odd_totalh += rect.h; });

	if (!oddbase /*even_totalh >= odd_totalh*/) {
		var even_y = y;
		evenRects.forEach(function (rect, index) {
			rect.x = x + (even_maxw - rect.w) / 2;
			rect.y = even_y;
			even_y += rect.h + pady;
		});
		oddRects.forEach(function (rect, index) {
			rect.x = x + even_maxw + (odd_maxw - rect.w) / 2 + padx;
			var even = evenRects[index];
			rect.y = (even.y + even.h) - rect.h / 2;
		});
	}
	else {
		var odd_y = y + evenRects[0].h / 2;
		oddRects.forEach(function (rect, index) {
			rect.x = x + even_maxw + (odd_maxw - rect.w) / 2
                + padx;
			rect.y = odd_y;
			odd_y += rect.y;
		});
		evenRects.forEach(function (rect, index) {
			rect.x = x + (even_maxw - rect.w) / 2;
			if (index % 2 == 0) {
				var odd = oddRects[index];
				rect.y = odd.y - rect.h / 2 - pady;
			}
			else {
				var odd = oddRects[index - 1];
				rect.y = (odd.y + odd.h) - rect.h / 2 + pady;
			}
		});
	}
}
function fluoresce(c) {
	return (c.h > 180 ? c.o('h', -5) : c.o('h', 5)).o('s', 20).o('l', 10);
}
