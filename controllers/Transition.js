define(["require", "dojo/_base/lang", "dojo/_base/declare", "dojo/has", "dojo/on", "dojo/Deferred", "dojo/when",
	"dojo/dom-style", "../Controller", "../utils/constraints"],
	function(require, lang, declare, has, on, Deferred, when, domStyle, Controller, constraints){

	var transit;
	var MODULE = "app/controllers/Transition";

	// module:
	//		dojox/app/controllers/transition
	//		Bind "app-transition" event on dojox/app application instance.
	//		Do transition from one view to another view.
	return declare("dojox.app.controllers.Transition", Controller, {

		proceeding: false,

		waitingQueue:[],
		lastSubChildMatch: null,

		constructor: function(app, events){
			// summary:
			//		bind "app-transition" event on application instance.
			//
			// app:
			//		dojox/app application instance.
			// events:
			//		{event : handler}
			this.events = {
				"app-transition": this.transition,
				"app-domNode": this.onDomNodeChange
			};
			require([this.app.transit || "dojox/css3/transit"], function(t){
				transit = t;
			});
			if(this.app.domNode){
				this.onDomNodeChange({oldNode: null, newNode: this.app.domNode});
			}
		},

		transition: function(event){
			// summary:
			//		Response to dojox/app "app-transition" event.
			//
			// example:
			//		Use emit to trigger "app-transition" event, and this function will response to the event. For example:
			//		|	this.app.emit("app-transition", {"viewId": viewId, "opts": opts});
			//
			// event: Object
			//		"app-transition" event parameter. It should be like this: {"viewId": viewId, "opts": opts}
			var F = MODULE+":transition";
			this.app.log(F+" event.viewId=[",event.viewId,"], event.opts=",event.opts);

			var viewsId = event.viewId || "";
			this.proceedingSaved = this.proceeding;	
			var parts = viewsId.split('+');
			var removePartsTest = viewsId.split('-');
			var viewId, newEvent;
			if(parts.length > 0 || removePartsTest.length > 0){
				while(parts.length > 1){ 	
					viewId = parts.shift();
					newEvent = lang.clone(event);
					newEvent.viewId = viewId;
					this.proceeding = true;
					newEvent._removeView = false;
					this.proceedTransition(newEvent);
				}
				viewId = parts.shift();
				var removeParts = viewId.split('-');
				if(removeParts.length > 0){
					viewId = removeParts.shift();
				}
				if(viewId.length > 0){ // check viewId.length > 0 to skip this section for a transition with only -viewId
					this.proceeding = this.proceedingSaved;
					event.viewId = viewId;
					event._doResize = true; // at the end of the last transition call resize
					event._removeView = false;
					this.proceedTransition(event);
				}
				if(removeParts.length > 0){
					while(removeParts.length > 0){
						var remViewId = removeParts.shift();
						newEvent = lang.clone(event);
						newEvent.viewId = remViewId;
						newEvent._removeView = true;
						newEvent._doResize = true; // at the end of the last transition call resize
						this.proceedTransition(newEvent);
					}
				}
			}else{
				event._doResize = true; // at the end of the last transition call resize
				event._removeView = false;
				this.proceedTransition(event);
			}
		},

		onDomNodeChange: function(evt){
			if(evt.oldNode != null){
				this.unbind(evt.oldNode, "startTransition");
			}
			this.bind(evt.newNode, "startTransition", lang.hitch(this, this.onStartTransition));
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
			//		|		data: {}
			//		|	};
			//		|	new TransitionEvent(domNode, transOpts, e).dispatch();
			//
			// evt: Object
			//		transition options parameter

			// prevent event from bubbling to window and being
			// processed by dojox/mobile/ViewController
			if(evt.preventDefault){
				evt.preventDefault();
			}
			evt.cancelBubble = true;
			if(evt.stopPropagation){
				evt.stopPropagation();
			}

			var target = evt.detail.target;
			var regex = /#(.+)/;
			if(!target && regex.test(evt.detail.href)){
				target = evt.detail.href.match(regex)[1];
			}

			// transition to the target view
			this.transition({ "viewId":target, opts: lang.mixin({}, evt.detail), data: evt.detail.data });
		},

		proceedTransition: function(transitionEvt){
			// summary:
			//		Proceed transition queue by FIFO by default.
			//		If transition is in proceeding, add the next transition to waiting queue.
			//
			// transitionEvt: Object
			//		"app-transition" event parameter. It should be like this: {"viewId":viewId, "opts":opts}
			var F = MODULE+":proceedTransition";

			if(this.proceeding){
				this.app.log(F+" push event", transitionEvt);
				this.waitingQueue.push(transitionEvt);
				this.processingQueue = false;
				return;
			}
			// If there are events waiting, needed to have the last in be the last processed, so add it to waitingQueue
			// process the events in order.
			this.app.log(F+" this.waitingQueue.length ="+ this.waitingQueue.length+ " this.processingQueue="+this.processingQueue);
			if(this.waitingQueue.length > 0 && !this.processingQueue){
				this.processingQueue = true;
				this.app.log(F+" push event past proceeding", transitionEvt);
				this.waitingQueue.push(transitionEvt);
				transitionEvt = this.waitingQueue.shift();
				this.app.log(F+" shifted waitingQueue to process", transitionEvt);
			}
			
			this.proceeding = true;

			this.app.log(F+" calling trigger load", transitionEvt);
			if(!transitionEvt.opts){
				transitionEvt.opts = {};
			}
			var params = transitionEvt.params || transitionEvt.opts.params;
			this.app.emit("app-load", {
				"viewId": transitionEvt.viewId,
				"params": params,
				"callback": lang.hitch(this, function(){
					var transitionDef = this._doTransition(transitionEvt.viewId, transitionEvt.opts, params, transitionEvt.opts.data, this.app, transitionEvt._removeView, transitionEvt._doResize);
					when(transitionDef, lang.hitch(this, function(){
						this.proceeding = false;
						this.processingQueue = true;
						var nextEvt = this.waitingQueue.shift();
						if(nextEvt){
							this.proceedTransition(nextEvt);
						}
					}));
				})
			});
		},

		_getTransition: function(parent, transitionTo, opts){
			// summary:
			//		Get view's transition type from the config for the view or from the parent view recursively.
			//		If not available use the transition option otherwise get view default transition type in the
			//		config from parent view.
			//
			// parent: Object
			//		view's parent
			// transitionTo: Object
			//		view to transition to
			//	opts: Object
			//		transition options
			//
			// returns:
			//		transition type like "slide", "fade", "flip" or "none".
			var parentView = parent;
			var transition = null;
			if(parentView.views[transitionTo]){
				transition = parentView.views[transitionTo].transition;
			} 
			if(!transition){
				transition = parentView.transition;
			}
			var defaultTransition = parentView.defaultTransition;
			while(!transition && parentView.parent){
				parentView = parentView.parent;
				transition = parentView.transition;
				if(!defaultTransition){
					defaultTransition = parentView.defaultTransition;
				}
			}
			return transition || opts.transition || defaultTransition || "none";
		},


		_getParamsForView: function(view, params){
			// summary:
			//		Get view's params only include view specific params if they are for this view.
			//
			// view: String
			//		the view's name
			// params: Object
			//		the params
			//
			// returns:
			//		params Object for this view
			var viewParams = {};
			for(var item in params){
				var value = params[item];
				if(lang.isObject(value)){	// view specific params
					if(item == view){		// it is for this view
						// need to add these params for the view
						viewParams = lang.mixin(viewParams, value);
					} 
				}else{	// these params are for all views, so add them
					if(item && value != null){
						viewParams[item] = params[item];
					}
				}
			}
			return viewParams;
		},

		_doTransition: function(transitionTo, opts, params, data, parent, removeView, doResize, nested){
			// summary:
			//		Transitions from the currently visible scene to the defined scene.
			//		It should determine what would be the best transition unless
			//		an override in opts tells it to use a specific transitioning methodology
			//		the transitionTo is a string in the form of [view]@[scene].  If
			//		view is left of, the current scene will be transitioned to the default
			//		view of the specified scene (eg @scene2), if the scene is left off
			//		the app controller will instruct the active scene to the view (eg view1).  If both
			//		are supplied (view1@scene2), then the application should transition to the scene,
			//		and instruct the scene to navigate to the view.
			//
			// transitionTo: Object
			//		transition to view id. It looks like #tabScene,tab1
			// opts: Object
			//		transition options
			// params: Object
			//		params
			// data: Object
			//		data object that will be passed on activate & de-activate methods of the view
			// parent: Object
			//		view's parent
			// removeView: Boolean
			//		remove the view instead of transition to it
			// doResize: Boolean
			//		emit a resize event
			// nested: Boolean
			//		whether the method is called from the transitioning of a parent view
			//
			// returns:
			//		transit dojo/promise/all object.
			var F = MODULE+":_doTransition";

			if(!parent){
				throw Error("view parent not found in transition.");
			}

			this.app.log(F+" transitionTo=[",transitionTo,"], removeView = [",removeView,"] parent.name=[",parent.name,"], opts=",opts);

			var parts, toId, subIds, next;
			if(transitionTo){
				parts = transitionTo.split(",");
			}else{
				// If parent.defaultView is like "main,main", we also need to split it and set the value to toId and subIds.
				// Or cannot get the next view by "parent.children[parent.id + '_' + toId]"
				parts = parent.defaultView.split(",");
			}
			toId = parts.shift();
			subIds = parts.join(',');

			// next is loaded and ready for transition
			next = parent.children[parent.id + '_' + toId];
			if(!next){
				if(removeView){
					this.app.log(F+" called with removeView true, but that view is not available to remove");
					return;	// trying to remove a view which is not showing
				}
				throw Error("child view must be loaded before transition.");
			}
			// if no subIds and next has default view,
			// set the subIds to the default view and transition to default view.
			if(!subIds && next.defaultView){
				subIds = next.defaultView;
			}

			var nextSubViewArray = [next || parent];
			if(subIds){
				nextSubViewArray = this.getNextSubViewArray(subIds, next,  parent);
			}

			var current = constraints.getSelectedChild(parent, next.constraint);
			var currentSubViewArray = this.getCurrentSubViewArray(parent, nextSubViewArray, removeView);

			var currentSubNames = this.getCurrentSubViewNamesArray(currentSubViewArray);

			// set params on next view.
			next.params = this._getParamsForView(next.name, params);

			if(removeView){
				if(next !== current){ // nothing to remove
					this.app.log(F+" called with removeView true, but that view is not available to remove");
					return;	// trying to remove a view which is not showing
				}	
				this.translog(F,"Transition Remove current From="+currentSubNames);
				// if next == current we will set next to null and remove the view with out a replacement
				next = null;
			}

			var currentLastSubChild = this.lastSubChildMatch || current; // currentLastSubChild holds the view to transition from
			// get the list of nextSubNames, this is next.name followed by the subIds
			var nextSubNames = "";
			if(next){
				nextSubNames = next.name;
				if(subIds){
					nextSubNames = nextSubNames+","+subIds;
				}
			}

			if(nextSubNames == currentSubNames && next == current){  // new test to see if current matches next
				this.translog(F,"Transition current and next DO MATCH From="+currentSubNames+" TO="+nextSubNames);
				this.handleMatchingViews(nextSubViewArray, next, current, parent, data, removeView, doResize, subIds, currentSubNames);

			}else{
				this.translog(F,"Transition current and next DO NOT MATCH From="+currentSubNames+" TO="+nextSubNames);
				//When clicking fast, history module will cache the transition request que
				//and prevent the transition conflicts.
				//Originally when we conduct transition, selectedChild will not be the
				//view we want to start transition. For example, during transition 1 -> 2
				//if user click button to transition to 3 and then transition to 1. After
				//1->2 completes, it will perform transition 2 -> 3 and 2 -> 1 because
				//selectedChild is always point to 2 during 1 -> 2 transition and transition
				//will record 2->3 and 2->1 right after the button is clicked.

				//assume next is already loaded so that this.set(...) will not return
				//a promise object. this.set(...) will handles the this.selectedChild,
				//activate or deactivate views and refresh layout.

				if(current && current._active){
					this.handleBeforeDeactivateCalls(currentSubViewArray, next, current, data, subIds);
				}
				if(next){
					this.app.log(F+" calling handleBeforeActivateCalls next name=[",next.name,"], parent.name=[",next.parent.name,"]");
					this.handleBeforeActivateCalls(nextSubViewArray, current, data, subIds);
				}
				if(!removeView){
					this.app.log(F+" calling handleLayoutAndResizeCalls");
					this.handleLayoutAndResizeCalls(nextSubViewArray, removeView, doResize, subIds);
				}
				var result = true;

				if(transit && (!nested || this.lastSubChildMatch != null) && currentLastSubChild !== next){
					// css3 transit has the check for IE so it will not try to do it on ie, so we do not need to check it here.
					// We skip in we are transitioning to a nested view from a parent view and that nested view
					// did not have any current
					var mergedOpts = lang.mixin({}, opts); // handle reverse from mergedOpts or transitionDir
					mergedOpts = lang.mixin({}, mergedOpts, {
						reverse: (mergedOpts.reverse || mergedOpts.transitionDir === -1)?true:false,
						// if transition is set for the view (or parent) in the config use it, otherwise use it from the event or defaultTransition from the config
						transition: this._getTransition(parent, toId, mergedOpts)
					});

					var nextLastSubChild = this.nextLastSubChildMatch || next;
					if(removeView){
						nextLastSubChild = null;
					}
					if(currentLastSubChild){
						this.translog(F,"transit FROM currentLastSubChild.id ="+currentLastSubChild.id);
					}
					if(nextLastSubChild){
						this.translog(F,"transit TO nextLastSubChild.id ="+nextLastSubChild.id);
					}
					result = transit(currentLastSubChild && currentLastSubChild.domNode, nextLastSubChild && nextLastSubChild.domNode, mergedOpts);

				}
				when(result, lang.hitch(this, function(){
					if(next){
						this.app.log(F+" back from transit for next ="+next.name);
					}
					if(removeView){
						this.handleLayoutAndResizeCalls(nextSubViewArray, removeView, doResize, subIds);
					}

					// Add call to handleAfterDeactivate and handleAfterActivate here!
					this.handleAfterDeactivateCalls(currentSubViewArray, next, current, data, subIds);
					this.handleAfterActivateCalls(nextSubViewArray, removeView, current, data, subIds);
				}));
				return result; // dojo/promise/all
			}
		},

		handleMatchingViews: function(subs, next, current, parent, data, removeView, doResize, subIds, currentSubNames){
			var F = MODULE+":handleMatchingViews";

			this.handleBeforeDeactivateCalls(subs, next, current, data, subIds);
			// this is the order that things were being done before on a reload of the same views, so I left it
			// calling handleAfterDeactivateCalls here instead of after handleLayoutAndResizeCalls
			this.handleAfterDeactivateCalls(subs, next, current, data, subIds);
			this.handleBeforeActivateCalls(subs, current, data, subIds);
			this.handleLayoutAndResizeCalls(subs, removeView, doResize, subIds);
			this.handleAfterActivateCalls(subs, removeView, current, data, subIds);
		},

		handleBeforeDeactivateCalls: function(subs, next, current, /*parent,*/ data, /*removeView, doResize,*/ subIds/*, currentSubNames*/){
			var F = MODULE+":handleBeforeDeactivateCalls";
			if(current._active){
				//now we need to loop backwards thru subs calling beforeDeactivate
				for(var i = subs.length-1; i >= 0; i--){
					var v = subs[i];
					if(v && v.beforeDeactivate && v._active){
						this.translog(F,"beforeDeactivate for v.id ="+v.id);
						v.beforeDeactivate(next, data);
					}
				}
			}
		},

		handleAfterDeactivateCalls: function(subs, next, current, data, subIds){
			var F = MODULE+":handleAfterDeactivateCalls";
			if(current && current._active){
				//now we need to loop forwards thru subs calling afterDeactivate
				for(var i = 0; i < subs.length; i++){
					var v = subs[i];
					if(v && v.beforeDeactivate && v._active){
						this.translog(F,"afterDeactivate for v.id ="+v.id);
						v.afterDeactivate(next, data);
						v._active = false;
					}
				}

			}
		},

		handleBeforeActivateCalls: function(subs, current, data, subIds){
			var F = MODULE+":handleBeforeActivateCalls";
			//now we need to loop backwards thru subs calling beforeActivate (ok since next matches current)
			for(var i = subs.length-1; i >= 0; i--){
				var v = subs[i];
				this.translog(F,"beforeActivate for v.id ="+v.id);
				v.beforeActivate(current, data);
			}
		},

		handleLayoutAndResizeCalls: function(subs, removeView, doResize, subIds){
			var F = MODULE+":handleLayoutAndResizeCalls";
			var remove = removeView;
			for(var i = 0; i < subs.length; i++){
				var v = subs[i];
				this.translog(F,"emit layoutView v.id=["+v.id+"] removeView = ["+remove+"]");
				// it seems like we should be able to minimize calls to resize by passing doResize: false and only doing resize on the app-resize emit
				this.app.emit("app-layoutView", {"parent": v.parent, "view": v, "removeView": remove, "doResize": false});
				remove = false;
			}
			if(doResize){
				this.translog(F,"emit doResize called");
				this.app.emit("app-resize"); // after last layoutView fire app-resize
			}
		},

		handleAfterActivateCalls: function(subs, removeView, current, data, subIds){
			var F = MODULE+":handleAfterActivateCalls";
			//now we need to loop backwards thru subs calling beforeActivate (ok since next matches current)
			var startInt = 0;
			if(removeView && subs.length > 1){
				startInt = 1;
			}
			for(var i = startInt; i < subs.length; i++){
				var v = subs[i];
				if(v.afterActivate){
					this.translog(F,"afterActivate for v.id ="+v.id);
					v.afterActivate(current, data);
					v._active = true;
				}
			}
		},

		getNextSubViewArray: function(subIds, next, parent){
			var F = MODULE+":getNextSubViewArray";
			var parts = [];
			var p = next || parent;
			if(subIds){
				parts = subIds.split(",");
			}
			var nextSubViewArray = [p];
			//now we need to loop forwards thru subIds calling beforeActivate
			for(var i = 0; i < parts.length; i++){
				toId = parts[i];
				var v = p.children[p.id + '_' + toId];
				if(v){
					nextSubViewArray.push(v);
					p = v;
				}
			}
			nextSubViewArray.reverse();
			return nextSubViewArray;
		},

		getCurrentSubViewArray: function(parent, nextSubViewArray, removeView){
			// summary:
			//		Get current sub view array which will be replaced by the views in the nextSubViewArray
			//
			// parent: String
			//		the parent view whose selected children will be replaced
			// nextSubViewArray: Array
			//		the array of views which are to be transitioned to.
			//
			// returns:
			//		Array of views which will be deactivated during this transition
			var F = MODULE+":getCurrentSubViewArray";
			var currentSubViewArray = [];
			var constraint, type, hash;
			var p = parent;
			this.lastSubChildMatch = null;
			this.nextLastSubChildMatch = null;

			for(var i = nextSubViewArray.length-1; i >= 0; i--){
				constraint = nextSubViewArray[i].constraint;
				type = typeof(constraint);
				hash = (type == "string" || type == "number") ? constraint : constraint.__hash;
				// if there is a selected child for this constraint, and the child matches this view, push it.
				if(p && p.selectedChildren && p.selectedChildren[hash]){
					if (p.selectedChildren[hash] == nextSubViewArray[i]){
						this.lastSubChildMatch = p.selectedChildren[hash];
						this.nextLastSubChildMatch = nextSubViewArray[i];
						currentSubViewArray.push(this.lastSubChildMatch);
						p = this.lastSubChildMatch;
					}else{
						this.lastSubChildMatch = p.selectedChildren[hash];
						currentSubViewArray.push(this.lastSubChildMatch);
						// Here since they had the constraint but it was not the same I need to deactivate all children of this.lastSubChildMatch
						if(!removeView){
							var selChildren = constraints.getAllSelectedChildren(this.lastSubChildMatch);
							currentSubViewArray = currentSubViewArray.concat(selChildren);
						}
						break;
					}
				}else{ // the else is for the constraint not matching which means no more to deactivate.
					this.lastSubChildMatch = null;   // there was no view selected for this constraint
					break;
				}

			}
			// Here since they had the constraint but it was not the same I need to deactivate all children of p
			if(removeView){
				var selChildren = constraints.getAllSelectedChildren(p);
				currentSubViewArray = currentSubViewArray.concat(selChildren);
			}

			return currentSubViewArray;
		},

		getCurrentSubViewNamesArray: function(nextSubViewArray){
			// summary:
			//		Get current sub view array which will be replaced by the views in the nextSubViewArray
			//
			// parent: String
			//		the parent view whose selected children will be replaced
			// nextSubViewArray: Array
			//		the array of views which are to be transitioned to.
			//
			// returns:
			//		Array of views which will be deactivated during this transition
			var F = MODULE+":getCurrentSubViewNamesArray";
			var currentSubViewNamesArray = [];
			for(var i = 0; i < nextSubViewArray.length; i++){
				currentSubViewNamesArray.push(nextSubViewArray[i].name);
			}
			return currentSubViewNamesArray;
		},

		translog: function(){
			// summary:
			//		If config is set to turn on translog or app logging, then log msg to the console
			//
			// arguments:
			//		the message to be logged,
			//		all but the last argument will be treated as Strings and be concatenated together,
			//      the last argument can be an object it will be added as an argument to the console.log
			if(!(has("app-log-api") || this.app.logTransitions)){
				return;
			}
			var msg = "";
			try{
				if(has("app-log-api")){  // only include the function if normal app-log-api is true
					msg = msg + arguments[0];
				}
				for(var i = 1; i < arguments.length-1; i++){
					msg = msg + arguments[i];
				}
				console.log(msg,arguments[arguments.length-1]);
			}catch(e){}
		}

	});
});
