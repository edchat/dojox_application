define(["build/buildControlDefault"], function(bc){
	// module:
	//		dojox/app/build/buildControlApp
	// summary:
	//		This module extend default build control module to add dojox/app build support
	// enhance buildControl
	bc.discoveryProcs.splice(0, 0, "dojox/app/build/discoverAppConfig");
	// add appConfigTransform into gates between the "read" and the "write"
	bc.gates.splice(6, 0, [1, "appConfigTransform", "executing app config transform"]);
	bc.transforms.appConfigTransform = ["dojox/app/build/transformAppConfig", "appConfigTransform"];
	// add the function to transformJobs to handle the processing of the applications config file
	bc.transformJobs.splice(0, 0, [
				function(resource, bc){
					var destConfig = bc.appConfigFile.replace(bc.basePath+"/", "");
					if(resource.mid==destConfig){
						return true;
					}
					return false;
				},
				["read", "appConfigTransform", "write"]
			]);
	return bc;
});
