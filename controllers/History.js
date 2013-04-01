define(["dojo/_base/lang", "dojo/_base/declare", "dojo/on", "../Controller", "../utils/hash"],
function(lang, declare, on, Controller, hash){
	// module:
	//		dojox/app/controllers/History
	// summary:
	//		Bind "app-domNode" event on dojox/app application instance,
	//		Bind "startTransition" event on dojox/app application domNode,
	//		Bind "popstate" event on window object.
	//		Maintain history by HTML5 "pushState" method and "popstate" event.

	return declare("dojox.app.controllers.History", Controller, {
		constructor: function(app){
			// summary:
			//		Bind "app-domNode" event on dojox/app application instance,
			//		Bind "startTransition" event on dojox/app application domNode,
			//		Bind "popstate" event on window object.
			//
			// app:
			//		dojox/app application instance.

			this.events = {
				"app-domNode": this.onDomNodeChange,
				"app-finishedTransition": this.setupUrlHash
			};
			if(this.app.domNode){
				this.onDomNodeChange({oldNode: null, newNode: this.app.domNode});
			}
			this.bind(window, "popstate", lang.hitch(this, this.onPopState));
		},

		onDomNodeChange: function(evt){
			if(evt.oldNode != null){
				this.unbind(evt.oldNode, "startTransition");
	//			this.unbind(evt.oldNode, "app-resize");
			}
			this.bind(evt.newNode, "startTransition", lang.hitch(this, this.onStartTransition));
	//		this.bind(evt.newNode, "app-resize", lang.hitch(this, this.onStartTransition));
			
		},

		onStartTransition: function(evt){
			// summary:
			//		Response to dojox/app "startTransition" event.
			//
			// example:
			//		Use "dojox/mobile/TransitionEvent" to trigger "startTransition" event, and this function will response the event. For example:
			//		|	var transOpts = {
			//		|		title:"List",
			//		|		target:"items,list",
			//		|		url: "#items,list",
			//		|		params: {"param1":"p1value"}
			//		|	};
			//		|	new TransitionEvent(domNode, transOpts, e).dispatch();
			//
			// evt: Object
			//		transition options parameter

			// bubbling "startTransition", so Transition controller can response to it.
			this.app.log("> in History onStartTransition evt.detail.target=["+evt.detail.target+"]");

			var target = evt.detail.target;
			var regex = /#(.+)/;
			if(!target && regex.test(evt.detail.href)){
				target = evt.detail.href.match(regex)[1];
			}
			
			if(!this.app.autoHashUrl){
				// create url hash from target if it is not set
				var currentHash = evt.detail.url || "#"+evt.detail.target;
				if(evt.detail.params){
					currentHash = hash.buildWithParams(currentHash, evt.detail.params);
				}
				// push states to history list
				history.pushState(evt.detail, evt.detail.href, currentHash);
			}else{
				this.app.currentParams = evt.detail.params;
				this.app.currentDetail = evt.detail;
				this.app.currentDetailHref = evt.detail.href;
			}	
		},

		setupUrlHash: function(evt){
			// summary:
			//		Response to dojox/app "startTransition" event.
			//
			// example:
			//		Use "dojox/mobile/TransitionEvent" to trigger "startTransition" event, and this function will response the event. For example:
			//		|	var transOpts = {
			//		|		title:"List",
			//		|		target:"items,list",
			//		|		url: "#items,list",
			//		|		params: {"param1":"p1value"}
			//		|	};
			//		|	new TransitionEvent(domNode, transOpts, e).dispatch();
			//
			// evt: Object
			//		transition options parameter
			
			// create url hash from target if it is not set
			if(this.app.doingPopState){ // when doingPopState do not pushState.
				this.app.doingPopState = false;
				return;	
			}
			if(this.app.autoHashUrl){
				var currentHash = "#"+hash.getAllSelectedChildrenHash(this.app, "");
				this.app.log("> in History setupUrlHash currentHash=["+currentHash+"]");
			
				if(this.app.currentParams){
					currentHash = hash.buildWithParams(currentHash, this.app.currentParams);
				}
						
				// push states to history list
				history.pushState(this.app.currentDetail, this.app.currentDetailHref, currentHash);
			}
		},

		onPopState: function(evt){
			// summary:
			//		Response to dojox/app "popstate" event.
			//
			// evt: Object
			//		transition options parameter

			// Clean browser's cache and refresh the current page will trigger popState event,
			// but in this situation the application has not started and throws an error.
			// so we need to check application status, if application not STARTED, do nothing.
			if(this.app.getStatus() !== this.app.lifecycle.STARTED){
				return;
			}
			this.app.doingPopState = true;

			var state = evt.state;
			if(!state){
				if(window.location.hash){
					state = {
						target: hash.getTarget(location.hash),
						url: location.hash,
						params: hash.getParams(location.hash)
					}
					this.app.log("> in History onPopState state.target=["+state.target+"]");
				}else{
					this.app.log("> in History onPopState this.app.defaultView=["+this.app.defaultView+"]");
					state = {
						target: this.app.defaultView
					};
				}
			}
			this.app.log("> in History onPopState state.target=["+state.target+"]");

			// TODO explain what is the purpose of this, _sim is never set in dojox/app
			if(evt._sim){
				history.replaceState(state, state.title, state.href);
			}

			this.app.log("> in History onPopState state.target=["+state.target+"]");
			// transition to the target view
			this.app.emit("app-transition", {
				viewId: state.target,
				opts: lang.mixin({reverse: true}, evt.detail, {"params": state.params})
			});
		}
	});
});
