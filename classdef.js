/*! ClassDef.js / MIT License / (C) Retorillo */
function __class(constructor, superClass) {
	var newClass = function () {
		if (superClass) superClass.apply(this, arguments);
		constructor.apply(this, arguments);
	}
	if (superClass)
		newClass.prototype = Object.create(superClass.prototype);
	return newClass;
}
function __props(obj, properties) {
	properties.forEach(function (i){
		var field = i.value;
		Object.defineProperty(obj, i.prop, {
			get: i.get || function() {
				if (i.beforeget)
					i.beforeget.apply(obj, arguments);
				return field
			},
			set: i.set || function(value) { 
				field = value; 
				if (i.afterset)
					i.afterset.apply(obj, arguments);
			},
		});

	});
}

