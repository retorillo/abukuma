// Abukuma.js Copyright (C) Retorillo
// Dependencies: create.js, moment.js
var __class = __class || function (constructor, superClass) {
	var newClass = function () {
		if (superClass) superClass.apply(this, arguments);
		constructor.apply(this, arguments);
	}
	if (superClass)
		newClass.prototype = Object.create(superClass.prototype);
	return newClass;
}
// Class Definitions
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
var Color = __class(function (color) {
	var _self = this;
	var m = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$|^#?([\da-f]{6})$/i.exec(color);
	_self.r = (m[4] ? parseInt(m[4].substr(0, 2), 16) : parseInt(m[1])) / 255;
	_self.g = (m[4] ? parseInt(m[4].substr(2, 2), 16) : parseInt(m[2])) / 255;
	_self.b = (m[4] ? parseInt(m[4].substr(4, 2), 16) : parseInt(m[3])) / 255;
	_self.clone = function() {
		return new Color(_self.toString());
	}
	_self.fluoresce = function () {
		hsv_setter(_self.h + (_self.h > 180 ? -5 : 5), _self.s + 0.2, _self.v + 0.2);
		return this;
	}
	_self.toString = function (hsv) {
		return hsv ? ["hsv(", [_self.h.toFixed(1), _self.s.toFixed(1), _self.v.toFixed(1)].join(", ") , ")"].join("") : ["rgb(", [Math.round(_self.r * 255), Math.round(_self.g * 255), Math.round(_self.b * 255)].join(", ") , ")"].join("");
	}
	function hsv_setter(h, s, v) {

		h = h % 360;
		s = Math.min(Math.max(s, 0), 1.0);
		v = Math.min(Math.max(v, 0), 1.0);

		var c = s;
		var h2 = h ? h / 60 : undefined;
		var x = h ? c * (1 - Math.abs(h2 % 2 - 1)) : undefined;
		var rgb1 = [v - c, v - c, v - c];
		var rgb2 = null;
		if (!h2) rgb2 = [0, 0, 0];
		else if (0 <= h2 && h2 < 1) rgb2 = [c, x, 0];
		else if (1 <= h2 && h2 < 2) rgb2 = [x, c, 0];
		else if (2 <= h2 && h2 < 3) rgb2 = [0, c, x];
		else if (3 <= h2 && h2 < 4) rgb2 = [0, x, c];
		else if (4 <= h2 && h2 < 5) rgb2 = [x, 0, c];
		else rgb2 = [c, 0, x];
		_self.r = rgb1[0] + rgb2[0];
		_self.g = rgb1[1] + rgb2[1];
		_self.b = rgb1[2] + rgb2[2];
	}
	Object.defineProperty(this, "v", {
		get: function () {
			return Math.max(_self.r, _self.g, _self.b);
		},
		set: function (value) {
			hsv_setter(_self.h, _self.s, value);
		}
	});
	Object.defineProperty(this, "s", {
		get: function () {
			return (Math.max(_self.r, _self.g, _self.b) - Math.min(_self.r, _self.g, _self.b));
		},
		set: function (value) {
			hsv_setter(_self.h, value, _self.v);
		}
	});
	Object.defineProperty(this, "h", {
		get: function () {
			var r = _self.r;
			var g = _self.g;
			var b = _self.b;
			var max = Math.max(r, g, b);
			var min = Math.min(r, g, b);
			if (min == max) return undefined;
			else if (min == b) return 60 * ((g - r) / (max - min)) + 60;
			else if (min == r) return 60 * ((b - g) / (max - min)) + 180;
			else // min == g
				return 60 * ((r - b) / (max - min)) + 300;
		},
		set: function (value) {
			hsv_setter(value, _self.s, _self.v);
		}
	});
});
var MouseEventListener = __class(function (displayObject) {
	var _self = this;
	var _disabled = false;
	var _handler = null;
	var _pressed = false;
	var _hover = false;
	Object.defineProperty(_self, "disabled", {
		get: function () {
			return _disabled;
		},
		set: function (value) {
			_disabled = value;
		}
	});
	Object.defineProperty(_self, "pressed", {
		get: function () {
			return _disabled ? false : _pressed;
		}
	});
	Object.defineProperty(_self, "hover", {
		get: function () {
			return _disabled ? false : _hover;
		}
	});
	_self.click = function (handler) {
		if (_handler)
			displayObject.removeEventListener("click", _handler);
		// Wrap handler to prevent firing when disabled
		_handler = handler ? function () { if (!_disabled) handler.apply(this, arguments); } : null;
		if (_handler)
			displayObject.addEventListener("click", _handler);
	}
	// Shape Events
	displayObject.addEventListener("mousedown", function () {
		_pressed = true;
	});
	displayObject.addEventListener("pressup", function () {
		_pressed = false;
	});
	displayObject.addEventListener("mouseover", function () {
		_hover = true;
	});
	displayObject.addEventListener("mouseout", function () {
		_hover = false;
	});
});
var MouseAwareContainer = __class(function () {
	var _self = this;
	var _mel = new MouseEventListener(this);
	Object.defineProperty(_self, "pressed", {
		get: function () {
			return _mel.pressed;
		}
	});
	Object.defineProperty(_self, "hover", {
		get: function () {
			return _mel.hover;
		}
	});
	Object.defineProperty(_self, "disabled", {
		get: function () {
			return _mel.disabled;
		},
		set: function (value) {
			_mel.disabled = value;
		}
	});
	this.click = function (handler) {
		return _mel.click(handler);
	}
}, createjs.Container);
var OperationSelector = __class(function(x, y, backColor) {
	var _self = this;
	// Constant
	var item_width = 245;
	var item_height = 40;
	var cellspacing = 1;
	var max_rows = 13;
	var _width = 0;
	var _height = 0;
	var _itemclick = function (op, index) { console.log(op.name + " is click"); }

	Object.defineProperty(this, "width", {
		get: function () { return _width; }
	});
	Object.defineProperty(this, "height", {
		get: function () { return _height; }
	});
	Object.defineProperty(this, "backColor", {
		set: function (c) {
			_self.shape.graphics.c().f(c || "black").rect(0, 0, _width, _height);
		}
	});
	// Public Members
	_self.shape = new createjs.Shape();
	_self.itemclick = function () {
		if (arguments.length == 1 && typeof(arguments[0]) == "function")
			_itemclick = arguments[0];
		else if (arguments.length == 2)
			_itemclick.apply(arguments[0], arguments[1]);
	}
	_self.init = function () {
		_self.x = x;
		_self.y = y;
		_self.addChild(_self.shape);
		_width = 0;
		_height = 0;
		var count = 0;
		operations.forEach(function (op, index) {
			var col = Math.floor(count / max_rows);
			var row = count % max_rows;
			var item_x = cellspacing + (item_width + cellspacing) * col;
			var item_y = cellspacing + (item_height + cellspacing) * row;
			var opb = new OperationButton(item_x, item_y, item_width, item_height, op);
			opb.click(function () { _self.itemclick(opb, [op, count]); });
			_self.addChild(opb);
			_width = Math.max(_width, item_x + item_width + cellspacing);
			_height = Math.max(_height, item_y + item_height + cellspacing);
			_self.backColor = backColor;
			count++;
		});
	}
	_self.update = function () {
		_self.children.forEach(function (child) {
			if (child.update)
				child.update();
		});
	}
	_self.init();
}, createjs.Container);
var OperationButton = __class(function (x, y, w, h, operation) {
	var _self = this;
	var strongColor = operation.area.strongColor;
	var weakColor = operation.area.weakColor;

	// Public Members
	_self.hoverlight = new createjs.Shape();
	_self.shape = new createjs.Shape();
	_self.text_id = new createjs.Text();
	_self.text_name = new createjs.Text();
	_self.text_desc = new createjs.Text();
	_self.shape_ship = new createjs.Shape();

	_self.initComponents = function () {
		// straight constant
		var id_fontsize_rate = 0.6; // vs h
		var name_fontsize_rate = 0.45; // vs h
		var desc_fontsize_rate = 0.3; // vs h

		// complexed constant
		var id_region_rate = 2; // vs id_fontsize
		var ships_region_rate = 1; // vs id_fontsize
		var name_padleft_rate = 0.5; // vs name_fontsize

		// computed
		var id_fontsize = Math.round(id_fontsize_rate * h);
		var ships_region_w = id_fontsize * ships_region_rate;
		var ships_region = new Rect(w - ships_region_w, 0, ships_region_w, h);
		var id_region = new Rect(0, 0, id_fontsize * id_region_rate, h);
		var name_fontsize = Math.round(name_fontsize_rate * h);
		var name_padleft = Math.round(name_padleft_rate * name_fontsize);
		var desc_fontsize = Math.round(desc_fontsize_rate * h);

		_self.x = x;
		_self.y = y;

		_self.shape.graphics.f(weakColor).rect(0, 0, w, h)
			.f(strongColor).rect(id_region.x, id_region.y, id_region.w, id_region.h);

		_self.hoverlight.alpha = 0;
		_self.hoverlight.graphics.f("white").rect(0, 0, w, h);

		_self.text_id.color = weakColor;
		_self.text_id.x = id_region.w / 2 + id_region.x;
		_self.text_id.y = id_region.h / 2 + id_region.y;
		_self.text_id.textAlign = "center";
		_self.text_id.textBaseline = "middle";
		_self.text_id.text = format("{0:d2}", operation.id);
		_self.text_id.font = id_fontsize + "px Segoe UI Semilight";

		_self.text_name.color = strongColor;
		_self.text_name.x = id_region.x + id_region.w + name_padleft;
		_self.text_name.y = id_region.h / 4 + id_region.y;
		_self.text_name.textAlign = "left";
		_self.text_name.textBaseline = "middle";
		_self.text_name.text = operation.name;
		_self.text_name.font = name_fontsize + "px Meiryo UI";

		var desc = new Array();
		if (operation.fuel) desc.push(format("燃 {0:d}", operation.fuel));
		if (operation.steel) desc.push(format("鋼 {0:d}", operation.steel));
		if (operation.ammo) desc.push(format("弾 {0:d}", operation.ammo));
		if (operation.baux) desc.push(format("ボ {0:d}", operation.baux));

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
		var shiprect = makeGrid(new Rect(0, 0, ships_region.w, ships_region.h),
			2, 3, 5);
		if (operation.ships != undefined) {
			var g = _self.shape_ship.graphics;
			operation.ships.forEach(function (ship, index) {
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
		_self.hitArea = _self.shape;
		_self.addChild(_self.shape);
		_self.addChild(_self.text_id);
		_self.addChild(_self.text_name);
		_self.addChild(_self.text_desc);
		_self.addChild(_self.shape_ship);
		_self.addChild(_self.hoverlight);
	}

	_self.update = function () {
		if (_self.hover && _self.pressed)
			this.hoverlight.alpha = 0.4;
		else if (_self.hover)
			this.hoverlight.alpha = 0.2;
		else
			this.hoverlight.alpha = 0;
	}
	_self.initComponents();
}, MouseAwareContainer);
var ProgressCircle = __class(function (x, y, w, h, strongColor, weakColor) {
	if (!ProgressCircle.static) {
		ProgressCircle.static = {};
		ProgressCircle.static.instances = 0;
	}
	var _static = ProgressCircle.static;
	_static.instances++;
	// Private Members
	var _self = this;
	var _diameter;
	var _radius;
	var _centerX;
	var _centerY;
	var _strongColor;
	var _strongColor_hover;
	var _weakColor;
	var _weakColor_hover;
	var _drawCircle = function (graphics, center_x, center_y, radius, thickness, degree, foreground, background) {
		graphics.setStrokeStyle(thickness)
			.beginStroke(background)
			.arc(center_x, center_y, radius - thickness, 0, Math.PI * 2)
			.beginStroke(foreground)
			.arc(center_x, center_y, radius - thickness,
				-Math.PI / 2, (degree / 360 - 0.25) * Math.PI * 2, false);
	}
	// Constants
	var thicknessRate = 4 / 15;
	var marqueeRadiusRate = 3 / 5;
	var marqueeThicknessRate = 1 / 15;
	var fontsizeRate = 32 / 150;
	var activityFontSizeRate = 0.7; //vs thickness
	var activityPadding = 30; //as deg
	var thickness = _radius * thicknessRate;
	var marqueeRadius = _radius * marqueeRadiusRate;
	var marqueeThickness = marqueeRadius * marqueeThicknessRate;

	// Public Members
	Object.defineProperty(this, "strongColor", {
		set: function(color) {
			_strongColor = color;
			_strongColor_hover = new Color(color).fluoresce().toString();
		},
	});
	_self.strongColor = strongColor;
	Object.defineProperty(this, "weakColor", {
		set: function(color) {
			_weakColor = color;
			_weakColor_hover = new Color(color).fluoresce().toString();
		},
	});
	_self.weakColor = weakColor;
	_self.shape = new createjs.Shape();
	_self.text_timeLeft = new createjs.Text();
	_self.text_endTime = new createjs.Text();
	_self.hitarea = new createjs.Shape();
	_self.text_activity = new TextInCircle(activityPadding, false);
	_self.init = function (x, y, w, h, strongColor, weakColor) {
		_diameter = Math.min(w, h);
		_radius = _diameter / 2;
		_centerX = w / 2 + (w - _diameter) / 2;
		_centerY = h / 2 + (h - _diameter) / 2;

		thickness = _radius * thicknessRate;
		marqueeRadius = _radius * marqueeRadiusRate;
		marqueeThickness = marqueeRadius * marqueeThicknessRate;
		
		// init texts of the circle center
		var inDuration = 250;
		var waitDuration = 3000;
		var outDuration = 250;
		var allTexts = [_self.text_timeLeft, _self.text_endTime];
		var totalDuration = inDuration + waitDuration + outDuration;
		var delay = totalDuration - 100 * _static.instances;
		allTexts.forEach(function (text, index) {
			text.font = Math.round(fontsizeRate * _diameter)
			+ "px Segoe UI Semilight";
			text.color = strongColor;
			text.x = w / 2;
			text.y = h / 2;
			text.textAlign = "center";
			text.textBaseline = "middle";
			createjs.Tween.get(text, { loop: true })
				.to({ scaleX: 0, scaleY: 0, alpha: 0 }, 0)
				.wait(index * totalDuration)
				.to({ scaleX: 1, scaleY: 1, alpha: 1 }, inDuration, createjs.Ease.elasticOut)
				.wait(waitDuration)
				.to({ scaleX: 0, scaleY: 0, alpha: 0 }, outDuration, createjs.Ease.cubicOut)
				.wait((allTexts.length - 1 - index) * totalDuration)
				.setPosition(delay);
		});

		_self.hitarea.graphics.f("white").arc(_centerX, _centerY, _radius, 0, Math.PI * 2);

		_self.cursor = "pointer";
		_self.hitArea = _self.hitarea;

		_self.addChild(_self.shape);
		_self.addChild(_self.text_timeLeft);
		_self.addChild(_self.text_endTime);
		_self.addChild(_self.text_activity);

		_self.x = x;
		_self.y = y;
	}

	Object.defineProperty(this, "activity", {
		set: function (value) {
			return _self.text_activity.update(value, _centerX, _centerY, _radius - thickness,
				Math.round(thickness * activityFontSizeRate), "Meiryo UI", activityPadding);
		}
	});
	// progress and marquee 0 - 360
	// reveserd should be true 
	// when Math..oor(marquee / 360) % 2 == 1
	_self.update = function (progress, marquee, text_timeLeft, text_endTime, completed, reverse) {
		var strongColor = _self.hover ? _strongColor_hover : _strongColor;
		var weakColor = _self.hover ? _weakColor_hover : _weakColor;

		_self.shape.graphics.clear();
		_self.text_timeLeft.text = text_timeLeft;
		_self.text_timeLeft.color = strongColor;
		_self.text_endTime.text = text_endTime;
		_self.text_endTime.color = strongColor;

		_drawCircle(_self.shape.graphics, _centerX, _centerY,
			_radius, thickness, progress, strongColor,
			completed && reverse ? strongColor : weakColor);
		_drawCircle(_self.shape.graphics, _centerX, _centerY,
			marqueeRadius, marqueeThickness, marquee,
			reverse ? strongColor : weakColor,
			reverse ? weakColor : strongColor);
	}

	// Initialization
	_self.init(x, y, w, h, strongColor, weakColor);
}, MouseAwareContainer);
var CountdownCircle = __class(function (x, y, w, h, strongColor, weakColor) {
	var _self = this;
	var _countdown = new MomentCountdown(moment.duration(30, "m"));
	// Base-Class References
	var _base = {}
	_base.update = _self.update;
	Object.defineProperty(this, "startTime", {
		get: function () { return _countdown.startTime; }
	});
	Object.defineProperty(this, "duration", {
		get: function () { return _countdown.duration; }
	});
	// Public Members
	_self.restart = function (activity, duration, startTime) {
		// duration must be moment.duration
		// startTime must be moment, nullable
		_self.activity = activity;
		_countdown.reset(duration, startTime);
	}
	_self.update = function () {
		_countdown.update();
		//var text_timeLeft = _countdown.completed ? ""
		//	: Math.ceil(_countdown.timeLeft.asMinutes());
		var text_timeLeft = Math.ceil(_countdown.timeLeft.asMinutes());
		var text_endTime = _countdown.endTime.format("HH:mm");
		_base.update(_countdown.timeLeftRate * 360,
			_countdown.secondRate * 360,
			text_timeLeft, text_endTime,
			_countdown.completed, _countdown.oddSecond);
	}
}, ProgressCircle);
//var OperationCountdownCircle = __class(function (x, y, w, h, strongColor, weakColor) {
//	var _self = this;
//	var _operation = null;
//	_self.restartCustom = function(op, startTime) {
//	
//	
//	_self.restartOperation = function (op, startTime) {
//		_operation = op;
//		_self.restart(op.name, moment.duration(op.duration, "m", startTime));
//	}
//	Object.defineProperty(this, "operation", {
//		get: function () { return _operation; }
//	});
//}, CountdownCircle);
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
