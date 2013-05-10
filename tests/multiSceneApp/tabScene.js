define(["dojo/dom", "dojo/_base/connect", "dijit/registry", "dojox/mobile/TransitionEvent"],
function(dom, connect, registry, TransitionEvent){
	return {
		selectedChild : null,
		// simple view init
		init: function(){
		},

		afterActivate: function(){
			console.log("In tabscene beforeActivate called selectedChild="+this.selectedChild);
			if(!this.selectedChild){
				this.selectedChild = "tab1";
				var transOpts = {title:"TabScene - "+this.selectedChild,target:"tabscene,"+this.selectedChild,url: "#tabscene,"+this.selectedChild};
				this.app.transitionToView(dom.byId(this.id),transOpts);
			}else{
				if(this.selectedChildren && this.selectedChildren.center && this.selectedChildren.center.name
					&& this.selectedChildren.center.name !== this.selectedChild){
					this.selectedChild = this.selectedChildren.center.name;
					var transOpts = {title:"TabScene - "+this.selectedChild,target:"tabscene,"+this.selectedChild,url: "#tabscene,"+this.selectedChild};
					this.app.transitionToView(dom.byId(this.id),transOpts);
				}
			}

		}//,
/*
		afterActivate: function(){
			console.log("In view1 afterActivate called");
			var t3 = dom.byId("multiSceneApp_tabscene_tab3");
			if(t3){
				t3.style.display = "block";
			}
		},

		afterDeactivate: function(){
			console.log("In view1 afterDeactivate called");
			var t3 = dom.byId("multiSceneApp_tabscene_tab3");
			if(t3){
				t3.style.display = "none";
			}
		}
*/
	};
});
