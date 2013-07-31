define(["dojo/sniff"], function(has){

// module:
//		dojox/app/utils/config

return {
	// summary:
	//		This module contains the config

	configBuildProcessHas: function(/*Object*/ source, /*Object*/ staticHasFeatures){
		// summary:
		//		scan the source config for has checks which are included in staticHasFeatures and call configMerge to merge has sections, and remove the has sections from the source.
		// description:
		//		configBuildProcessHas will scan the source config for has checks.
		//		For each has section the items inside the has section will be tested against the staticHasFeatures
		//		If the has test is included in the staticHasFeatures and it is true it will call configMerge to merge has sections back into the source config, and remove the has section.
		//		If the has test is not included in the staticHasFeatures the has section be be left in the config.
		//		The names in the has section can be separated by a comma, indicating that any of those being true will satisfy the test.
		// source:
		//		an object representing the config to be processed.
		// returns:
		//		the updated source object.
		for(var name in source){
			var	sval = source[name];
			if(name == "has"){ // found a "has" section in source
				for(var hasname in sval){ // get the hasnames from the has section
					if(!(hasname.charAt(0) == '_' && hasname.charAt(1) == '_') && sval && typeof sval === 'object'){
						// need to handle multiple has checks separated by a ",".
						var parts = hasname.split(',');
						if(parts.length > 0){
							while(parts.length > 0){
								var haspart = parts.shift();
								// check for haspart in staticHasFeatures, if it matches process and remove it
								if((staticHasFeatures[haspart]) !== undefined || (haspart.charAt(0) == '!' && (staticHasFeatures[haspart.substring(1)] !== undefined))){
									if((staticHasFeatures[haspart]) || (haspart.charAt(0) == '!' && !(staticHasFeatures[haspart.substring(1)]))){ // if true this one should be merged
										var hasval = sval[hasname];
										this.configMerge(source, hasval); // merge this has section into the source config
										delete sval[hasname];	// after merge remove this part of the has section from the config
										break;	// found a match for this multiple has test, so go to the next one
									}else{
										delete sval[hasname];	// this has was included in staticHasFeatures but failed the test so remove this has part section from the config
									}
								}
							}
						}
					}else{  //remove __ things from the has section to be able to tell if the has section is empty after processing staticHasFeatures
						delete sval[hasname];
					}
				}
				if(Object.keys(sval).length === 0){ // if the has section is empty remove it from the config
					delete source["has"];	// after merge remove this has section from the config
				}
			}else{ // name !== has, this is not a has section but it may contain an object with a has section
				if(!(name.charAt(0) == '_' && name.charAt(1) == '_') && sval && typeof sval === 'object'){
						this.configBuildProcessHas(sval, staticHasFeatures);
				}
			}
		}
		return source;
	},

	configProcessHas: function(/*Object*/ source){
		// summary:
		//		scan the source config for has checks and call configMerge to merge has sections, and remove the has sections from the source.
		// description:
		//		configProcessHas will scan the source config for has checks.
		//		For each has section the items inside the has section will be tested with has (sniff)
		//		If the has test is true it will call configMerge to merge has sections back into the source config.
		//		It will always remove the has section from the source after processing it.
		//		The names in the has section can be separated by a comma, indicating that any of those being true will satisfy the test.
		// source:
		//		an object representing the config to be processed.
		// returns:
		//		the updated source object.
		for(var name in source){
			var	sval = source[name];
			if(name == "has"){ // found a "has" section in source
				for(var hasname in sval){ // get the hasnames from the has section
					if(!(hasname.charAt(0) == '_' && hasname.charAt(1) == '_') && sval && typeof sval === 'object'){
						// need to handle multiple has checks separated by a ",".
						var parts = hasname.split(',');
						if(parts.length > 0){
							while(parts.length > 0){
								var haspart = parts.shift();
								// check for has(haspart) or if haspart starts with ! check for !(has(haspart))
								if((has(haspart)) || (haspart.charAt(0) == '!' && !(has(haspart.substring(1))))){ // if true this one should be merged
									var hasval = sval[hasname];
									this.configMerge(source, hasval); // merge this has section into the source config
									break;	// found a match for this multiple has test, so go to the next one
								}
							}
						}
					}
				}
				delete source["has"];	// after merge remove this has section from the config
			}else{
				if(!(name.charAt(0) == '_' && name.charAt(1) == '_') && sval && typeof sval === 'object'){
						this.configProcessHas(sval);
				}
			}
		}
		return source;
	},

	configMerge: function(/*Object*/ target, /*Object*/ source){
		// summary:
		//		does a deep copy of the source into the target to merge the config from the source into the target
		// description:
		//		configMerge will merge the source config into the target config with a deep copy.
		//		anything starting with __ will be skipped and if the target is an array the source items will be pushed into the target.
		// target:
		//		an object representing the config which will be updated by merging in the source.
		// source:
		//		an object representing the config to be merged into the target.
		// returns:
		//		the updated target object.

		for(var name in source){
			var tval = target[name];
			var	sval = source[name];
			if(tval !== sval && !(name.charAt(0) == '_' && name.charAt(1) == '_')){
				if(tval && typeof tval === 'object' && sval && typeof sval === 'object'){
					this.configMerge(tval, sval);
				}else{
					if(target instanceof Array){
						target.push(sval);
					}else{
						target[name] = sval;
					}
				}
			}
		}
		return target;
	}
};

});
