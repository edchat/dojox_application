require(["dojo/_base/window","dojo/_base/lang","dojo/_base/declare","dojox/app/main", "dojox/app/utils/configUtils", "dojox/json/ref", 
		"dojo/text!../../simpleModelApp/config.json", "dojo/text!./configMerge.json", "dojo/sniff"],
function(win, lang, declare, Application, configUtils, jsonRef, config1, configMerge, has){
	win.global.modelApp = {};
	modelApp.names = {
		identifier: "id",
		items: [{
			"id": "1",
			"Serial": "360324",
			"First": "John",
			"Last": "Doe",
			"Email": "jdoe@us.ibm.com",
			"ShipTo": {
				"Street": "123 Valley Rd",
				"City": "Katonah",
				"State": "NY",
				"Zip": "10536"
			},
			"BillTo": {
				"Street": "17 Skyline Dr",
				"City": "Hawthorne",
				"State": "NY",
				"Zip": "10532"
			}
		}]
	};
	modelApp.names2 = {
			identifier: "id",
			items: [{
				"id": "1",
				"Serial": "360324",
				"First": "John",
				"Last": "Doe",
				"Email": "jdoe@us.ibm.com",
				"ShipTo": {
					"Street": "123 Valley Rd",
					"City": "Katonah",
					"State": "NY",
					"Zip": "10536"
				},
				"BillTo": {
					"Street": "17 Skyline Dr",
					"City": "Hawthorne",
					"State": "NY",
					"Zip": "10532"
				}
			}]
		};
	modelApp.repeatData = [{
		"First": "Chad",
		"Last": "Chapman",
		"Location": "CA",
		"Office": "1278",
		"Email": "c.c@test.com",
		"Tel": "408-764-8237",
		"Fax": "408-764-8228"
	}, {
		"First": "Irene",
		"Last": "Ira",
		"Location": "NJ",
		"Office": "F09",
		"Email": "i.i@test.com",
		"Tel": "514-764-6532",
		"Fax": "514-764-7300"
	}, {
		"First": "John",
		"Last": "Jacklin",
		"Location": "CA",
		"Office": "6701",
		"Email": "j.j@test.com",
		"Tel": "408-764-1234",
		"Fax": "408-764-4321"
	}];

	var config = configUtils.configMerge(jsonRef.fromJson(config1), jsonRef.fromJson(configMerge));
	// on IE use the HistoryHash controller instead of the History controller.
	//config.controllers[0] = has("ie") ? "dojox/app/controllers/HistoryHash" : "dojox/app/controllers/History";		
	config = has("ie") ? configUtils.configMerge(config,{"controllers": ["dojox/app/controllers/HistoryHash"]}) : 
						configUtils.configMerge(config,{"controllers": ["dojox/app/controllers/History"]})		
	Application(config);

});
