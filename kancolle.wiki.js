// Kancolle.wiki.js
// Data From http://wikiwiki.jp/kancolle/?%B1%F3%C0%AC#h2_content_1_5

var ships = {};
ships.lightCruiser = { shortName: "軽" };
ships.destroyer    = { shortName: "駆" };
ships.unspecified  = { shortName: '艦' };

var areas = {};
areas.debug = { color: "rgb(250, 0, 200)",  name: "動作試験" };
areas.home  = { color: "rgb(250, 200, 0)", name: "鎮守府海域" };
areas.seast = { color: "rgb(200, 0, 250)", name: "南西諸島海域" };
areas.north = { color: "rgb(0, 250, 200)", name: "北方海域"  };
areas.south = { color: "rgb(200, 250, 0)", name: "南方海域" };

var operations = [];
{
	// ARA
	setara( 99, areas.debug, "拾秒動作試験");
	setara(  2, areas.home,  "長距離練習航海");
	setara(  3, areas.home,  "警備任務");
	setara(  5, areas.home,  "海上護衛任務");
	setara(  6, areas.home,  "防空射撃演習");
	setara(  9, areas.seast, "タンカー護衛任務");
	setara( 11, areas.seast, "ボーキサイト輸送任務");
	setara( 21, areas.north, "北方鼠輸送作戦");
	setara( 37, areas.south, "東京急行");
	setara( 38, areas.south, "東京急行 弐");

	// RES      dur | ful | amo | stl | bax
	setres( 99,  1/6,  999,  999,  999,    0);
	setres(  2,   30,    0,  100,   30,    0);
	setres(  3,   20,   30,   30,   40,    0);
	setres(  5,   90,  200,  200,   20,   20);
	setres(  6,   40,    0,    0,    0,   80);
	setres(  9,  240,  350,    0,    0,    0);
	setres( 11,  300,    0,    0,    0,  250);
	setres( 21,  140,  320,  270,    0,    0);
	setres( 37,  165,    0,  380,  270,    0);
	setres( 38,  175,  420,    0,  200,    0);

	// REQ     -------------------|--|-------------------|--
	setreq(  2, ships.unspecified,  4)
	setreq(  3, ships.unspecified,  3)
	setreq(  5, ships.lightCruiser, 1, ships.destroyer,   2)
	setreq(  6, ships.unspecified,  4)
	setreq(  9, ships.lightCruiser, 1, ships.destroyer,   2)
	setreq( 11, ships.destroyer,    2, ships.unspecified, 2)
	setreq( 21, ships.lightCruiser, 1, ships.destroyer,   4)
	setreq( 37, ships.lightCruiser, 1, ships.destroyer,   5)
	setreq( 38, ships.destroyer,    6)
	setreq( 99, ships.unspecified,  6)


	function setara(id, area, name){
		operations[id] = operations[id] || {};
		operations[id].id   = id;
		operations[id].area = area;
		operations[id].name = name;
		operations[id].text = format("[{0:d2}] {1}", id, name);
	}
	function setreq(id) {
		operations[id] = operations[id] || {};
		operations[id].ships = [];
		for (var c = 1; c < arguments.length; c += 2) {
			var x = arguments[c];
			var n = arguments[c + 1];
			for (var d = 0; d < n; d++)
				operations[id].ships.push(x);
		}
	}
	function setres(id, duration, fuel, ammo, steel, baux){
		operations[id] = operations[id] || {};
		operations[id].duration = duration;
		operations[id].fuel = fuel;
		operations[id].ammo = ammo;
		operations[id].steel = steel;
		operations[id].baux = baux;
	};
}
