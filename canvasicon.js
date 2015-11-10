// canvasicon.js - MIT License - (c) 2015 Retorillo
var canvasicon = new function () {
	var _ns = this; // namespace object
	var $ = function (ctx) {
		[ 
			{ l: "beginPath", s: "bp" }, 
			{ l: "closePath", s: "cp" },
			{ l: "lineTo", s: "lt" },
			{ l: "moveTo", s: "mt"},
			{ l: "fill", s: "f" },
		]
	} // wrapper

	_ns.primaryColor = "rgb(0, 0, 0)";
	_ns.dangerColor = "rgb(200, 0, 0)";
	_ns.drawSpeaker = function (ctx, x, y, w, h, v, style) {
		var size = Math.min(w, h);
		x += (w - size) / 2;
		y += (h - size) / 2;

		var s = style || {};
		s.body_c = s.body_c || _ns.primaryColor;
		s.wave_c = s.wave_c || [_ns.primaryColor, _ns.primaryColor, _ns.primaryColor];
		s.mute_c = s.mute_c || _ns.dangerColor;
		s.body_w = s.body_w || 0.5; // body width vs size
		s.body_h = s.body_h || 0.8; // body height vs size
		s.neck_w = s.neck_w || 0.4; // neck width vs body
		s.neck_h = s.neck_h || 0.5; // neck height vs body
		s.wave_t = s.wave_t || 0.1; // wave thickness vs size
		s.wave_d = s.wave_d || Math.PI * 0.6; // wave degree
		s.wave_cap = s.wave_cap || "round"; // cap
		s.mute_m = s.mute_m || 0.2; // mute margin vs (w - body)
		s.mute_hr = 1; // mute horizontal rate (1 is center)
		s.mute_vr = 1; // mute vertical rate (1 is middle)
		s.mute_t = s.mute_t || "round"; // mute thickness vs size
		s.mute_cap = s.mute_cap || "round"; // cap
		s.boundary = s.boundary || false;

		body_w = s.body_w * size;
		var wave_t = s.wave_t * size; // wave thickness
		var mute_t = s.mute_t * size; // mute thickness
		var body_y_margin = (h - (s.body_h * size)) / 2;
		var wave_r = (1 - s.body_w) * size; // wave radius

		// Draw Boundary
		if (s.boundary) {
			ctx.fill("red");
			ctx.rect(0, 0, w, h);
		}

		// Draw Speaker Body
		ctx.fillStyle = v > 0 ? s.body_c : s.mute_c;
		ctx.beginPath();
		ctx.moveTo(x, y + (1 - s.neck_h) / 2 * size + body_y_margin);
		ctx.lineTo(x, y + (0.5 + 0.5 * s.neck_h) * size - body_y_margin);
		ctx.lineTo(x + body_w * s.neck_w,
			   y + (0.5 + 0.5 * s.neck_h) * size - body_y_margin);
		ctx.lineTo(x + body_w, y + size - body_y_margin);
		ctx.lineTo(x + body_w, y + body_y_margin);
		ctx.lineTo(x + body_w * s.neck_w,
			   y + (0.5 - 0.5 * s.neck_h) * size + body_y_margin);
		ctx.fill();
		ctx.closePath();

		// Draw Wave
		ctx.lineWidth = wave_t;
		ctx.lineCap = s.wave_cap;
		[0.4, 0.7, 1].forEach(function (radius, index) {
			if (v <= 0 || (index > 0 && v < 0.33) ||
			    (index > 1 && v < 0.66)) return;
			var cx = body_w;
			var cy = size / 2;
			var start = (Math.PI - s.wave_d) / 2 - Math.PI / 2
			var end = start + s.wave_d;
			ctx.strokeStyle = s.wave_c[index];
			ctx.beginPath();
			ctx.arc(x + cx, y + cy, wave_r * radius - wave_t / 2,
				    start, end)
			ctx.stroke();
			ctx.closePath();
		});

		// Draw Mute Symbol
		ctx.lineWidth = s.mute_t;
		ctx.lineCap = s.mute_cap;
		if (v == 0) {
			var mute_x = body_w;
			var mute_s = size - mute_x; //mute size
			var mute_m = mute_s * s.mute_m;
			mute_s -= mute_m * 2;
			var offset_x = mute_m * s.mute_hr;
			var offset_y = size * (s.mute_vr - 0.5) - mute_s / 2;
			ctx.strokeStyle = s.mute_c;
			ctx.beginPath();
			ctx.moveTo(x + mute_x + offset_x, y + offset_y); //lt
			ctx.lineTo(x + mute_x + mute_s + offset_x,
				 y + mute_s + offset_y); //rb
			ctx.moveTo(x + mute_x + mute_s + offset_x,
				   y + offset_y); //rt
			ctx.lineTo(x + mute_x + offset_x,
				 y + mute_s + offset_y); //lb
			ctx.stroke();
			ctx.closePath();
		}
	}

}; // canvasicon namespace