canvasicon.createjs = new function () {
	var _ns = this; // namespace object

	_ns.defaultWidth = 200;
	_ns.defaultHeight = 200;

	// MouseAwareDisplayObject
	_ns.MouseAwareDisplayObject = __class(function () {
		var p = __property(this, "pressed", false, true);
		var h = __property(this, "hover", false, true);
		this.addEventListener("mousedown", function () { p.setter(true); });
		this.addEventListener("pressup", function () { p.setter(false); });
		this.addEventListener("mouseover", function () { h.setter(true); });
		this.addEventListener("mouseout", function () { h.setter(false); });
	}, createjs.DisplayObject);

	// Speaker
	_ns.Speaker = __class(function () {
		__property(this, "width", _ns.defaultWidth);
		__property(this, "height", _ns.defaultHeight);
		__property(this, "bodyColor");
		__property(this, "waveColors");
		__property(this, "muteColor");
		__property(this, "volume", 1.0);
		this.draw = function (ctx) {
			canvasicon.drawSpeaker(ctx, 0, 0, this.width, this.height, this.volume, {
				body_c: this.bodyColor,
				wave_c: this.waveColors,
				mute_c: this.muteColor,
			});
		}
	}, _ns.MouseAwareDisplayObject);

	function __class(constructor, superClass) {
		var newClass = function () {
			if (superClass) superClass.apply(this, arguments);
			constructor.apply(this, arguments);
		}
		if (superClass) {
			newClass.prototype = Object.create(superClass.prototype);
			newClass.prototype.constructor = newClass;
		}
		return newClass;
	}
	function __property(obj, name, value, readonly) {
		var field = value;
		var getter = function () { return field; }
		var setter = function (value) { field = value; }
		var p = {
			get owner() { return obj; },
			get name() { return name; },
			get getter() { return getter; },
			get setter() { return setter; },
			get readonly() { return readonly; },
		}
		Object.defineProperty(obj, name, { get: getter, set: readonly ? undefined : setter });
		return p;
	}
}; // canvasicon.createjs namespace
