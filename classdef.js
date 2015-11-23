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
function __events(obj, events) {
	events.forEach(function(e) {
		var callbacks = [];
		obj[e.name] = function() {
			// Generally, invoker equals with obj (obj === this) 
			// When you want to raise as a child item event.
			// use apply method in your class as follows:
			// _self.itemclick.apply(item); 
			var invoker = this;
			if (arguments.length == 1 && typeof(arguments[0]) == 'function') {
				callbacks.push(arguments[0]);
			}
			else {
				var arg = arguments;
				callbacks.forEach(function (callback) {
					callback.apply(invoker, arg); 
				});
			}
		}
	});
}
