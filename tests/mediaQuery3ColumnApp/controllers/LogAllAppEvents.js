define(["dojo/_base/lang", "dojo/_base/declare", "dojox/app/Controller"],
function(lang, declare, Controller){
	// module:
	//		dojox/app/tests/mediaQuery3ColumnApp/controllers/LogAllAppEvents
	// summary:
	//		This Custom controller created to log all dojox/app events to see when these events are fired.

	return declare("dojox/app/tests/mediaQuery3ColumnApp/controllers/LogAllAppEvents", Controller, {

		constructor: function(){
			// summary:
			//		Bind all events used by dojox/app in order to log their use.
			//		Bind "app-domNode" event on dojox/app application instance.
			//		Bind "startTransition" event on dojox/app application domNode.
			//		Bind "popstate" event on window object.
			//

			this.events = {
				"app-domNode": this.onDomNodeChange,
				"app-init": this.appinit,
				"app-transition": this.apptransition,
				"app-load": this.appload,
				"app-initLayout": this.appinitLayout,
				"app-layoutView": this.applayoutView,
				"app-resize": this.appresize
			};
			if(this.app.domNode){
				this.onDomNodeChange({oldNode: null, newNode: this.app.domNode});
			}
			this.bind(window, "popstate", lang.hitch(this, this.onPopState));
		},

		onDomNodeChange: function(evt){
			console.log(" ====> onDomNodeChange fired: evt.newNode.id = "+evt.newNode.id);
			if(evt.oldNode != null){
				this.unbind(evt.oldNode, "startTransition");
			}
			this.bind(evt.newNode, "startTransition", lang.hitch(this, this.onStartTransition));
		},

		appinit: function(evt){
			console.log(" ====> app-init fired in LogAllAppEvents");
		},

		apptransition: function(evt){
			console.log(" ====> app-transition fired: evt.viewId = "+evt.viewId);
		},

		appload: function(evt){
			console.log(" ====> app-load fired: evt.viewId = "+evt.viewId);
		},

		appinitLayout: function(evt){
			console.log(" ====> app-initLayout fired: evt.view.id = "+evt.view.id);
		},

		applayoutView: function(evt){
			console.log(" ====> app-layoutView fired: evt.view.id = "+evt.view.id);
		},

		appresize: function(){
			console.log(" ====> app-resize fired:");
		},

		onStartTransition: function(evt){
			console.log(" ====> onStartTransition fired: evt.detail.target = "+evt.detail.target);
		},

		onPopState: function(evt){
			console.log(" ====> onPopState fired: evt.state.target = "+evt.state.target);
		}
	});
});
