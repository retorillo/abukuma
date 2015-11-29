/*! canvasicon.js - MIT License - (c) 2015 Retorillo */
var canvasicon = new function (undefined) {
	var canvasicon = this;
	function initprops(obj, setters) {
		obj = obj || {};
		[ { name: 'x',      value: 0 }, 
		  { name: 'y',      value: 0 },
		  { name: 'width',  value: canvasicon.defaultSize },
		  { name: 'height', value: canvasicon.defaultSize }
		].forEach(function(i) { setters.push(i); });
		setters.forEach(function(setter) {
			obj[setter.name] = (obj[setter.name] != undefined) ? obj[setter.name] : setter.value;
		});
		return obj;
	}
	function deg2rad (deg) { return (deg / 180) * Math.PI }
	function Arc(cx, cy, r) {
		var cos = Math.cos, sin = Math.sin;
		this.cx = cx; this.cy = cy; this.r = r;
		this.pt = function (deg){ var t = this, r = deg2rad(deg); return { x: cos(r) * t.r + t.cx, y: sin(r) * t.r + t.cy }; }
	}
	function Rect(x, y, w, h){
		this.x = x || 0; this.y = y || 0; this.w = w || 0; this.h = h || 0;
		this.resize = function(w, h) { var t = this; var cx = t.cx, cy = t.cy; t.w = w; t.h = h; t.cx = cx; t.cy = cy; return t; }
		this.inflate = function (x, y) { var t = this; t.x -= x / 2; t.w += x; t.y -= y / 2; t.h += y; return t; }
		this.offset  = function (x, y) { var t = this; t.x += x; t.y += y; return t; }
		this.clone = function() { return new Rect(this.x, this.y, this.w, this.h); }
		var toarray = function (list) { var a = []; for (var c = 0 ; c < list.length; c++) a.push(list[c]); return a; }
		var split = function(ratio, y, h) {
			var r = [], tr = 0, tra = 0; y = y || 'y'; h = h || 'h'; 
			ratio.forEach(function(r) { if (r == '*') { tra++ } else { tr += r } });
			for (var c = 0, sy = this[y], sh = this[h]; c < ratio.length; sy += r[c][h], c++) {
				r[c] = this.clone(); r[c][y] = sy; r[c][h] = sh * (ratio[c] == '*' ? (1 - tr) / tra : ratio[c]);
			}
			return 	r;
		}
		this.split  = function() { return split.apply(this, [toarray(arguments)]); }
		this.vsplit = function() { return split.apply(this, [toarray(arguments), 'x', 'w']); }
		Object.defineProperties(this, {
			cx: { get: function()  { return this.x + this.w / 2; },
			      set: function(v) { this.x = v - this.w / 2; } },
			cy: { get: function()  { return this.y + this.h / 2; },
			      set: function(v) { this.y = v - this.h / 2; } },
			r:  { get: function()  { return this.x + this.w; } },
			b:  { get: function()  { return this.y + this.h; } },
		});
	}
	canvasicon.$ = function (ctx) {
		var obj = {};
		obj.ctx = ctx;
		[ { l: 'beginPath',     s: 'bp'  }, 
		  { l: 'closePath',     s: 'cp'  },
		  { l: 'lineTo',        s: 'lt'  },
		  { l: 'moveTo',        s: 'mt'  },
		  { l: 'fill',          s: 'f'   },
		  { l: 'rect',          s: 'r'   },
		  { l: 'arc',           s: 'a'   },
		  { l: 'stroke',        s: 's'   },
		  { l: 'bezierCurveTo', s: 'bct' },
		  { l: 'fillStyle',     s: 'fs', p: true },
		  { l: 'strokeStyle',   s: 'ss', p: true },
		  { l: 'lineWidth',     s: 'lw', p: true },
		  { l: 'lineCap',       s: 'lc', p: true },
		].forEach(function(d) {
			obj[d.s] = d.p ? function() { this.ctx[d.l] = arguments[0]; return obj; }
				       : function() { this.ctx[d.l].apply(this.ctx, arguments); return obj; }
			obj[d.l] = obj[d.s];
		});
		obj.ellipse = function(x, y, w, h) {
			var r = x + w, b = y + h, cx = x + w / 2, cy = y + h / 2;
			return this.mt(x, cy).bct(x, y, r, y, r, cy).bct(r, b, x, b, x, cy);
		}
		obj.arcd = function(cx, cy, r, d1, d2) { this.arc(cx, cy, r, deg2rad(d1), deg2rad(d2)); return this; }
		// WARNING: polygon method is experimental
		obj.polygon = function (toolHandler) {
			var _tool = {};
			var _x = 0, _y = 0, _c = 0;
			tool.mv(function(x, y, absolute) {
				if (absolute) { _x = x; _y = y; }
				else { _x += x, _y += y; }
				if (_c++ == 0) obj.bp().mt(_x, _y);
				else obj.lt(_x, _y);
			});
			toolHandler.apply(this, [_tool]);
			if (_c > 0) obj.cp();
			return this;
		}
		obj.cross = function (x, y, width, height){
			this.bp().mt(x, y).lt(x + width, y + width).mt(x + width, y).lt(x, y + width).s().cp();
			return this;
		}
		return obj;
	}
	canvasicon.defaultSize = 50;
	canvasicon.primaryColor = '#000';
	canvasicon.drawSpeaker = function (ctx, style) {
		style = initprops(style, [
			{ name: 'volume',             value: 1 },
			{ name: 'bodyColor',          value: canvasicon.primaryColor },
			{ name: 'waveColors',         value: [canvasicon.primaryColor, canvasicon.primaryColor, canvasicon.primaryColor] },
			{ name: 'crossColor',         value: canvasicon.primaryColor },
			{ name: 'paddingRate',        value: 0.1  },
			{ name: 'coneWidthRate',      value: 0.20 },
			{ name: 'coneHeightRate',     value: 0.70 },
			{ name: 'neckWidthRate',      value: 0.15 },
			{ name: 'neckHeightRate',     value: 0.30 },
			{ name: 'waveRadiusRates',    value: [0.4, 0.7, 1]},
			{ name: 'waveThicknessRate',  value: 0.1 },
			{ name: 'waveArcDegree',      value: 90 },
			{ name: 'waveCapStyle',       value: 'square' }, 
			{ name: 'crossSizeRate',      value: 0.5 },
			{ name: 'crossThicknessRate', value: 0.1 },
			{ name: 'crossCapStyle',      value: 'square' },
		]);
		var squarew = Math.min(style.width, style.height);
		var rect = new Rect(style.x, style.y, squarew, squarew);
		var pad = squarew * style.paddingRate;
		rect.inflate(-pad, -pad);
		var vcells = rect.vsplit(style.neckWidthRate, style.coneWidthRate, '*');
		var ncell = vcells[0].split('*', style.neckHeightRate, '*')[1];
		var ccell = vcells[1].split('*', style.coneHeightRate, '*')[1];
		var $ctx = canvasicon.$(ctx);
		$ctx.fs(style.bodyColor).bp().mt(ncell.r, ncell.y).lt(ncell.x, ncell.y)
			.lt(ncell.x, ncell.b).lt(ncell.r, ncell.b).lt(ccell.r, ccell.b)
			.lt(ccell.r, ccell.y).lt(ncell.r, ncell.y).f().cp();
		if (style.volume <= 0) {
			var crosst = style.crossThicknessRate * squarew;
			var xw = Math.min(vcells[2].w, vcells[2].h) * style.crossSizeRate;
			var xcell = vcells[2].clone().resize(xw, xw); 
			$ctx.lw(crosst).lc(style.crossCapStyle).ss(style.crossColor)
				.cross(xcell.x, xcell.y, xcell.w, xcell.h);
		}
		else {
			var wavet = style.waveThicknessRate * squarew;
			var wcell = vcells[2];
			var wdegs = -style.waveArcDegree / 2;
			var wdege = wdegs + style.waveArcDegree;
			var vperw = 1 / style.waveRadiusRates.length;
			$ctx.lw(wavet).lc(style.waveCapStyle);
			style.waveRadiusRates.forEach(function (rrate, i) {
				if (style.volume < vperw * i) return;
				$ctx.ss(style.waveColors[i]).bp().arcd(wcell.x, wcell.cy, 
					wcell.w * rrate - wavet / 2, wdegs, wdege).s().cp();
			});
		}
	}
	canvasicon.drawClose = function (ctx, style) {
		style = initprops(style, [
			{ name: 'color',         value: canvasicon.primaryColor },
			{ name: 'cap',           value: 'square' },
			{ name: 'thicknessRate', value: 0.15 }, // Thickness rate compared with size 
			{ name: 'paddingRate',   value: 0.40 }, // Margin rate compared with size

		]);
		var b = new Rect(style.x, style.y, style.width, style.height);
		var squarew = Math.min(b.w, b.h);
		var t = style.thicknessRate * squarew;
		var p = style.paddingRate * squarew;
		b.resize(squarew, squarew).inflate(-t-p, -t-p);	
		canvasicon.$(ctx).lw(t).lc(style.cap).ss(style.color).cross(b.x, b.y, b.w, b.h);
	}
	canvasicon.drawMenu = function (ctx, style) {
		style = initprops(style, [
			{ name: 'color',         value: canvasicon.primaryColor },
			{ name: 'cap',           value: 'square' },
			{ name: 'thicknessRate', value: 0.13 }, // Thickness rate compared with min(width, height) 
			{ name: 'paddingRate',   value: 0.2 }
		]);
		var bounds = new Rect(style.x, style.y, style.width, style.height);
		var squarew = Math.min(bounds.w, bounds.h);
		var t = style.thicknessRate * squarew;
		var p = style.paddingRate * squarew;
		bounds.resize(squarew, squarew).inflate(-t-p, -t-p);
		var $ctx = canvasicon.$(ctx).lw(t).lc(style.cap).ss(style.color);
		bounds.split('*', '*', '*').forEach(function(cell){
			$ctx.bp().mt(cell.x, cell.cy).lt(cell.r, cell.cy).s().cp();	
		});
	}
	canvasicon.drawSwitch = function (ctx, style) {
		style = initprops(style, [
			{ name: 'borderColor',     value: canvasicon.primaryColor },
			{ name: 'toggleColor',     value: canvasicon.primaryColor },
			{ name: 'cap',             value: 'round' },
			{ name: 'backgroundColor', value: 'transparent' },
			{ name: 'switch',          value: 0 },    // 0 is off, 1 is on
			{ name: 'thicknessRate',   value: 0.08 }, // Thickness rate compared with width 
			{ name: 'cornerRate',      value: 0.20 },
		]);
		var bounds = new Rect(style.x, style.y, style.width, style.height);
		var t = style.thicknessRate * bounds.w;
		var cr = style.cornerRate;
		bounds.inflate(-t, -t).resize(bounds.w, cr * bounds.w * 2); 
		var cells = bounds.vsplit(cr, 1 - cr * 2, cr);
		var $ctx = canvasicon.$(ctx);
		$ctx.lw(t).lc(style.cap).ss(style.borderColor).fs(style.backgroundColor).bp()
			.arcd(cells[0].r, cells[0].cy, cells[0].w, 90, 270).lt(cells[1].r, cells[1].y)
			.arcd(cells[2].x, cells[2].cy, cells[2].w, 270, 90).lt(cells[1].x, cells[1].b)
			.f().s().cp().fs(style.toggleColor).bp()
			.arcd(cells[1].x + cells[1].w * style.switch, cells[1].cy, cells[0].w - t, 0, 360)
			.f().cp();
	}
	canvasicon.drawLock = function (ctx, style) {
		style = initprops(style, [
			{ name: 'color',               value: canvasicon.primaryColor },
			{ name: 'unlocked',            value: false },
			{ name: 'bodyAspect',          value: [1.2, 1] },
			{ name: 'paddingRate',         value: 0.2 },
			{ name: 'roundedHeightRate',   value: 0.20 },
			{ name: 'straightHeightRate',  value: 0.25 },
			{ name: 'thicknessRate',       value: 0.08 },
			{ name: 'holeSizeRate',        value: 0.3 },
			{ name: 'slitDegree',          value: 50 },
			{ name: 'slitHeightRate',      value: 0.15 },
		]);
		var squarew = Math.min(style.width, style.height);
		var bounds = new Rect(style.x, style.y, style.width, style.height);
		var p = style.paddingRate * squarew;
		bounds.resize(squarew, squarew).inflate(-p, -p);
		var cells = bounds.split(style.roundedHeightRate, style.straightHeightRate , '*');
		var t = style.thicknessRate * squarew;
		var rr = cells[0].h - t / 2;	
		var rcell = cells[0].resize(rr * 2, rr);
		var hs = style.holeSizeRate * cells[2].h;
		var sh = style.slitHeightRate * cells[2].h;
		var hole = new Arc(cells[2].cx, cells[2].cy, hs / 2);
		var holes = 90 + style.slitDegree / 2;
		var holee = 90 - style.slitDegree / 2;
		var sp1 = hole.pt(holes); var sp2 = hole.pt(holee);
		var scell = new Rect(sp1.x, sp1.y, Math.abs(sp2.x - sp1.x), sh);
		var bcell = cells[2].resize(cells[2].h * (style.bodyAspect[0] / style.bodyAspect[1]), cells[2].h);
		canvasicon.$(ctx).lw(t).ss(style.color).fs(style.color).bp()
			.mt(rcell.x, cells[1].b).lt(rcell.x, cells[1].y)
			.arcd(rcell.cx, cells[1].y, rcell.h, 180, 360)
			.lt(rcell.r, style.unlocked ? cells[1].cy : cells[1].b).s().cp().bp()
			.arcd(hole.cx, hole.cy, hole.r, holes, holee)
			.lt(scell.r, scell.b).lt(scell.x, scell.b).lt(scell.x, scell.y)
			.mt(bcell.x, bcell.y).lt(bcell.x, bcell.b).lt(bcell.r, bcell.b)
			.lt(bcell.r, bcell.y).lt(bcell.x, bcell.y).f('evenodd').cp();
	}
	canvasicon.drawBucket = function (ctx, style) {
		style = initprops(style, [
			{ name: 'color',               value: canvasicon.primaryColor },
			{ name: 'handleHeightRate',    value: 0.4 },
			{ name: 'internalWidthRate',   value: 0.7 },
			{ name: 'surfaceHeightRate',   value: 0.5 },
			{ name: 'paddingRate',         value: 0.15 },
			{ name: 'topWidthRate',        value: 0.8 },
			{ name: 'bottomWidthRate',     value: 0.7 },
		]);
		var squarew = Math.min(style.width, style.height);
		var bounds = new Rect(style.x, style.y, style.width, style.height);
		var p = style.paddingRate * squarew;
		bounds.inflate(-p, -p);
		var cells = bounds.split(style.surfaceHeightRate, '*', style.surfaceHeightRate);
		var tcell = cells[0].resize(cells[0].w * style.topWidthRate, cells[0].h);
		var ip = tcell.w * (1 - style.internalWidthRate);
		var icell = tcell.clone().inflate(-ip, -ip);
		var mcell = cells[1];
		var bcell = cells[2].resize(cells[2].w * style.bottomWidthRate, cells[2].h);
		canvasicon.$(ctx).fs(style.color).bp()
			.ellipse(icell.x, icell.y, icell.w, icell.h)
			.mt(tcell.x, tcell.cy).bct(tcell.x, tcell.y, tcell.r, tcell.y, tcell.r, tcell.cy)
			.lt(bcell.r, bcell.cy).bct(bcell.r, bcell.b, bcell.x, bcell.b, bcell.x, bcell.cy)
			.lt(tcell.x, tcell.cy) .f('evenodd').cp();
	}
};
