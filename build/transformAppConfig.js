define([
	"build/buildControl",
	"build/fileUtils",
	"build/fs",
 	"dojo/_base/lang",
	"dojox/json/ref",
	"../utils/config"
], function(bc, fileUtils, fs, lang, json, configUtils) {
	// transformAppConfig will call dojox/app/utils/config.configBuildProcessHas() to resolve the "has" checks
	// in the config.json file which correspond to things set in staticHasFeatures for the build.
	// The updated config.json file will be set into resource.text, and then the write transform
	// will write the updated config.json to the build destination, and it will be merged into the layer.

		transformConfig = function(resource){
			var config, configStr;
			config = json.fromJson(resource.text);
			if(config){
				// process the staticHasFeatures for the config with the call to configBuildProcessHas
				// and set the updated config into resource.text with the staticHasFeatures processed
				// always pass true for skipNonStaticHasSections when writing out the built config
				config = configUtils.configBuildProcessHas(config, bc.staticHasFeatures, true);
				configStr = json.toJson(config, false); // prettyPrint is the second arg.
			}

			resource.optimizedText = configStr;
			if(!resource.tag.noOptimize){
				resource.rawText = resource.text;
				resource.text = configStr;
			}
		};

	return function(resource, callback) {
		try{
			if(!resource.tag.noOptimize){
				transformConfig(resource);
				bc.log("transformAppConfig", ["file", resource.src]);
			}
		}catch(e){
			bc.log("transformAppConfig", ["file", resource.src, "error", e]);
		}
	};
});
