/*! TweenCSS / The MIT License / (C) 2015 Retorillo */
function $TweenCSS(selector) { 
	var progress = 0;
	this.$obj = $(selector);
	Object.defineProperty(this, 'progress', {
		get: function () {
			return progress;
		},
		set: function (v){
			progress = v;
			this.update();
		}
	});
}
$TweenCSS.prototype.update = function() {
	for (var name in this) {
		if (!this[name].compute) continue;
		var computed = this[name].compute(this.progress);
		this.$obj.css(name, computed);	
		if (name == 'opacity') {
			if (computed == 0) this.$obj.hide();
			else this.$obj.show();
		}
	}
}
$TweenCSS.prototype.push = function(name, from, to, unit, round) {
	var p = {};
	p.name = name;
	p.from = from;
	p.to = to;
	p.unit = unit;
	p.compute = function(progress) {
		var d = (this.to - this.from) * progress + this.from;
		if (round) d = Math.round(d);
		else d = d.toFixed(2);
		return d + (this.unit || '');
	};
	this[name] = p;
	return this;
}
$TweenCSS.prototype.play = function (to, duration, ease) {
	createjs.Tween
		.get(this, { override: true })
		.to({ progress: this.progress })
		.to({ progress: to }, duration, ease);
}
