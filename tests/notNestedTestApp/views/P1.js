define([], function(){
	var app = null;
	var MODULE = "P1";
	return {
		init: function(){
			app = this.app;
		},

		beforeActivate: function(){
			// summary:
			//		view life cycle beforeActivate()
			//console.log(MODULE+" beforeActivate");
		},

		afterActivate: function(){
			// summary:
			//		view life cycle afterActivate()
			//console.log(MODULE+" afterActivate");
		},
		beforeDeactivate: function(){
			//console.log(MODULE+" beforeDeactivate");
		},
		afterDeactivate: function(){
			//console.log(MODULE+" afterDeactivate");
		}
	};
});
