Meteor.publish('companies', function() {
  return Companies.find();
});


Facts.setUserIdFilter(function () {
  return true;
});


var threadMap = {};

var fs = Meteor.npmRequire('fs');
var forceworking = false;
Meteor.methods({
	"celspeak" : function(obj){
		HTTP.post("http://cel-service.watson.ibm.com:3377/speakText", {"data" : obj }, function (err,data) {
//			console.log("cel-speak : " + JSON.stringify(obj, null,2));
			if(err){
				console.log("cel-speak : " + JSON.stringify(obj, null,2));
				console.log(err);
			}else{
//				console.log(data);
			}
		});
	},

 	"forcedirect" : function(clientid){
 		var d3 = Meteor.npmRequire('d3');
 		var objlist = Companies.find({"clientid" : clientid}).fetch();
	  	var obj = objlist[0];
	  	var time = new Date();
		var links = [];
		var sourceNodesList = [];
		var sourceNodeChildren = {};
		var nodesScore = {};
		console.log("no of nodes received " , obj.nodes.length , " no of edges " , obj.edges.length);
		obj.edges.forEach(function(e) {
		    var sourceNode = obj.nodes.filter(function(n) {
		        return n.name === e.source;
		    })[0],
		        targetNode = obj.nodes.filter(function(n) {
		            return n.name === e.target;
		        })[0];

		   	if(sourceNodeChildren[sourceNode.name] != undefined){
		    	if(sourceNodeChildren[sourceNode.name].indexOf(targetNode.name) < 0){
		    		sourceNodeChildren[sourceNode.name].push(targetNode.name);
		    	}
	        }else{
	        	sourceNodeChildren[sourceNode.name] = [];
	        	sourceNodeChildren[sourceNode.name].push(targetNode.name);
	        	sourceNodesList.push(sourceNode.name);
	        	nodesScore[sourceNode.name]=0.5;
	        }

		   	if(nodesScore[targetNode.name] != undefined)
				nodesScore[targetNode.name]++;
			else
				nodesScore[targetNode.name] =  1;

		    links.push({
		        source: obj.nodes.indexOf(sourceNode),
		        target: obj.nodes.indexOf(targetNode),
		        value: e.value
		    });
		});
		
		console.log("no of source nodes : " + sourceNodesList.length);
		for(var i = 0;i<sourceNodesList.length;i++){
			console.log(sourceNodesList[i] + "   " + sourceNodeChildren[sourceNodesList[i]].length);	
		}
		var linkDistance = 0.01 / math.sqrt(obj.nodes.length);
		var linkStrength = 0.2 / math.sqrt(obj.nodes.length);
		var charge = obj.nodes.length > 0 ? -0.007 * math.log(obj.nodes.length)/obj.nodes.length :-0.01 ;
		//var charge = obj.nodes.length > 0 ? -0.007 / math.sqrt(obj.nodes.length) :-0.007 ;
        var gravity = 0;//0.1/math.sqrt(obj.nodes.length);

		if(sourceNodesList.length === 1){
	 	 	var sourceNode = obj.nodes.filter(function(n) {
				return n.name === sourceNodesList[0];
			})[0];
	 	 	sourceNode.x = 0.5;
			sourceNode.y = 0.5;
			sourceNode.fixed = true;
			linkDistance = 0.1;
			linkStrength = 0.9;	
			charge = obj.nodes.length > 0 ? -0.091 * math.log(obj.nodes.length)/obj.nodes.length :-0.01 ;
		}else if(sourceNodesList.length === 2){
			var total = (sourceNodeChildren[sourceNodesList[0]].length + sourceNodeChildren[sourceNodesList[1]].length) * 4;
			for(var x =0 ;x < sourceNodesList.length;x++){
				var sourceNode = obj.nodes.filter(function(n) {
					return n.name === sourceNodesList[x];
				})[0];
				// sourceNode.y = (x==0 ? -1:1)* 0.5 + (sourceNodeChildren[sourceNodesList[x]].length/total) + 0.25;
				// sourceNode.x = (x==0 ? -1:1)* 0.5 + (sourceNodeChildren[sourceNodesList[x]].length/total) + 0.25;
				sourceNode.y = 0.4 + x * 0.2;
				sourceNode.x = 0.4 + x * 0.2;
				sourceNode.fixed = true;
			}
			linkDistance = 0.04;
			linkStrength = 0.6;	
 			charge = obj.nodes.length > 0 ? -0.041 * math.log(obj.nodes.length)/obj.nodes.length :-0.01 ;
		}else if(sourceNodesList.length === 3){
			for(var x =0 ;x < sourceNodesList.length;x++){
				var sourceNode = obj.nodes.filter(function(n) {
					return n.name === sourceNodesList[x];
				})[0];
				sourceNode.x = 0.5 + x * ( x%2 === 0 ? 0.5 : -1)  * 0.2;
				sourceNode.y = 0.4 +  ( x > 0 ? 1 : 0  ) * 0.2;
				sourceNode.fixed = true;
			}
			linkDistance = 0.07;
			linkStrength = 0.6;
			charge = obj.nodes.length > 0 ? -0.033 * math.log(obj.nodes.length)/obj.nodes.length :-0.01 ;	
		}
		var tickcount = 0;
		var bounding_box = obj.bounding_box;
		var force;
		//var charge = -0.00050 * sourceNodesList.length;//obj.nodes.length > 0 ? -0.01 * math.log(obj.nodes.length)/obj.nodes.length :-0.01 ;
		console.log("charge  : " + charge + " , gravity : " + gravity + " , linkDistance : " + linkDistance + " , linkStrength : " + linkStrength );

		if(threadMap[clientid] != undefined){
			console.log("reuse force");
			force = threadMap[clientid];
			force.stop();
			console.log("force stopped");
			Meteor.setTimeout(function(){
				force.nodes(obj.nodes)
					.links(links)
					.linkStrength(linkStrength)
					.linkDistance(linkDistance)
					.charge(function(d){
						if(sourceNodesList.indexOf(d.name) > -1){
							return 1*charge ;
						}else{
							if(nodesScore[d.name] >2)
								return  charge * 2;
							else
								return charge ;// * nodesScore[d.name] ;
						}	
					})
					.gravity(function(d){
						if(sourceNodesList.indexOf(d.name) > -1){
							return gravity;
						}else{
							return gravity;
						}
					})
					.start();
			}, 100);
			
		}else{
			console.log("new force");
			force = d3.layout.force()
							.nodes(obj.nodes)
							.links(links)
							.size([1,1])
							.linkStrength(linkStrength)
							.linkDistance(linkDistance)
							//    .charge(charge)
							.charge(function(d){
								if(sourceNodesList.indexOf(d.name) > -1){
									return 1* charge ;
								}else{
									if(nodesScore[d.name] >2)
										return  charge * 2;
									else
										return charge ;//* nodesScore[d.name] ;
								}
							})
							.chargeDistance(1)
							//   .gravity(gravity)
							.gravity(function(d){
								if(sourceNodesList.indexOf(d.name) > -1){
									return gravity;
								}else{
									return gravity ;
								}
							})
							.friction(0.51);
							// .theta(0.9);

							//.alpha(0.1);
			threadMap[clientid] = force;
			force.start(); 
			console.log("start client");	
		}
		
	    force.on("tick", Meteor.bindEnvironment(function(){
		    	var items = force.nodes();
		    	var links = force.links();
			console.log("force alpha : " + force.alpha());
				tickcount++;
				// socket
				// if(tickcount %  == 0){
					//sock.send(['test',JSON.stringify(items)]);
					if(obj != null){
			  			var _obj = {};
						_obj.id = obj._id;
						_obj.graphid = obj.graphid;
						_obj.bounding_box = obj.bounding_box;
						
						_obj.time = new Date();
						_obj.nodes = [];

						for(var i = 0;i < items.length;i++){
							var _item = items[i];
							var _n = {};
							_item.x = Math.max(0.01, Math.min(0.99, _item.x));
							_item.y = Math.max(0.01, Math.min(0.99, _item.y));
							_n.name = _item.name;
							_n.x = _item.x;
							_n.y = _item.y;
							_n.label = _item.label;
							_n.content = _item.content;
							_n.type = nodesScore[_item.name];
							_obj.nodes.push(_n);
						}
						var objlist = Companies.find({"_id" : _obj.id}).fetch();
		                if(objlist.length>0){
							var tobj = objlist[0];
							_obj.nodes.forEach(function(e) {
								var sourceNode;
								if(tobj.selnodes != undefined){
		                            sourceNode = tobj.selnodes.filter(function(n) {
											return n.name === e.name;
										})[0];
		                        }else{
		                        	sourceNode = tobj.nodes.filter(function(n) {
											return n.name === e.name;
										})[0];
		                        }
								if(sourceNode != undefined){
								    e.highlighted = sourceNode.highlighted;
								}
							});
						}

						_obj.edges = [];

						for(var i = 0; i < links.length; i++){
							var _link = links[i];
							var _e = {};
							_e.source = _link.source.name;
							_e.target = _link.target.name;
							_e.value = _link.value;
							_e.sx = _link.source.x;
							_e.sy = _link.source.y;
							_e.tx = _link.target.x;
							_e.ty = _link.target.y;
							_obj.edges.push(_e);
						}

						var drop_protein = false;
						 var newTime = new Date();
						 if(newTime - time > 500){
						 	time = newTime;
						 	drop_protein = true;
						 }
						Meteor.call("updateGraphLocation", _obj);
						if(drop_protein)
						 	Meteor.call("dropProtein", _obj);
					}	
					//if(force.alpha() < 0.005){
					//	force.stop();
					//}
				// }

		    }, function(err,res){
				console.log(res, err);
				return (res || err);
		  }));

	     force.on("end", Meteor.bindEnvironment(function(){
	     	/*var items = force.nodes();
		    var links = force.links();
	     	if(obj != null){
			  			var _obj = {};
						_obj.id = obj._id;
						_obj.bounding_box = obj.bounding_box;
						
						_obj.time = new Date();
						_obj.nodes = [];

						for(var i = 0;i < items.length;i++){
							var _item = items[i];
							var _n = {};
							_item.x = Math.max(0.01, Math.min(0.99, _item.x));
							_item.y = Math.max(0.01, Math.min(0.99, _item.y));
							_n.name = _item.name;
							_n.x = _item.x;
							_n.y = _item.y;
							_n.label = _item.label;
							_n.type = nodesScore[_item.name];
							_obj.nodes.push(_n);
						}
						var objlist = Companies.find({"_id" : _obj.id}).fetch();
		                if(objlist.length>0){
							var tobj = objlist[0];
							_obj.nodes.forEach(function(e) {
								var sourceNode;
								if(tobj.selnodes != undefined){
		                            sourceNode = tobj.selnodes.filter(function(n) {
											return n.name === e.name;
										})[0];
		                        }else{
		                        	sourceNode = tobj.nodes.filter(function(n) {
											return n.name === e.name;
										})[0];
		                        }
								if(sourceNode != undefined){
								    e.highlighted = sourceNode.highlighted;
								}
							});
						}

						_obj.edges = [];

						for(var i = 0; i < links.length; i++){
							var _link = links[i];
							var _e = {};
							_e.source = _link.source.name;
							_e.target = _link.target.name;
							_e.value = _link.value;
							_e.sx = _link.source.x;
							_e.sy = _link.source.y;
							_e.tx = _link.target.x;
							_e.ty = _link.target.y;
							_obj.edges.push(_e);
						}

						// var drop_protein = false;
						//  var newTime = new Date();
						//  if(newTime - time > 5){
						//  	time = newTime;
						//  	drop_protein = true;
						//  }
						Meteor.call("updateGraphLocation", _obj);
						//if(drop_protein)
						Meteor.call("dropProtein", _obj);
					}
					*/

	     	/*
	     	console.log("from end : " + tickcount);
	 //     	if(tickcount === 0)
	 //     		return;
		
		
		// if(tickcount < 300){
		// 	console.log(tickcount +  "  " +  force.nodes().length);
		// //	force.start();
		// }
	     		var items = force.nodes();
			
	     		//sock.send(['test',"end " + JSON.stringify(items)]);
	   //   		if(obj != null){
		  // 			var id = obj._id;
		  // 			var newObj = {};
				// 	newObj.clientid = clientid;
				// 	newObj.time = new Date();
				// 	newObj.nodes = force.nodes();
				// 	newObj.edges = force.links();
				// 	newObj.bounding_box = obj.bounding_box;
					
			
				// 	var _obj = {};
				// 	_obj.id = id;
				// 	_obj.data = newObj;
				// 	//Meteor.call("updateGraph", _obj); 	    	
				// }	
				if(obj != null){
		  			var _obj = {};
					_obj.id = obj._id;
					_obj.time = new Date();
					_obj.nodes = [];

					for(var i = 0;i < items.length;i++){
						var _item = items[i];
						var _n = {};
						_item.x = Math.max(0.01, Math.min(0.99, _item.x));
                                                _item.y = Math.max(0.01, Math.min(0.99, _item.y));
						_n.name = _item.name;
						_n.x = _item.x;
						_n.y = _item.y;
						_n.label = _item.label;
						_n.highlighted = _item.highlighted;
						_obj.nodes.push(_n);
					}
					var objlist = Companies.find({"_id" : _obj.id}).fetch();
	                if(objlist.length>0){
						var tobj = objlist[0];
						_obj.nodes.forEach(function(e) {
                            var sourceNode = obj.nodes.filter(function(n) {
									return n.name === e.name;
								})[0];
							if(sourceNode != undefined){
							    e.highlighted = sourceNode.highlighted;
							    if(e.name === 'Peoplefluent_3204'){
							    	console.log((new Date()) +   "   " + e.name + "   " + e.highlighted);
							    }
							}
						});
					}

					_obj.edges = [];

					for(var i = 0; i < links.length; i++){
						var _link = links[i];
						var _e = {};
						_e.source = _link.source.name;
						_e.target = _link.target.name;
						_e.value = _link.value;
						_e.sx = _link.source.x;
						_e.sy = _link.source.y;
						_e.tx = _link.target.x;
						_e.ty = _link.target.y;
						_obj.edges.push(_e);
					}

					Meteor.call("updateGraph", _obj, bounding_box, true);
	    	
				}
				*/		
					
	     }, function(err,res){
						console.log(res, err);
						return (res || err);
		}));
		
	     return obj;
 	},

	//"highlightItems" : function(_obj){
 	"highlightItems" : function(nodelist, clientid){
 		var force = threadMap[clientid];
 		if(force != undefined){
 			if(force.alpha() != 0){
 				console.log(force.alpha());
 				var tmpalpha = force.alpha();
	 			force.stop();
	 			Meteor.setTimeout(function(){
	 				var objlist = Companies.find({"clientid" : clientid}).fetch();
					var obj = objlist.length > 0  ? objlist[0] : null;
					if(obj != null){
						var id = obj._id;
						if(nodelist != undefined && nodelist.length != undefined){
							for(var i = 0; i < obj.nodes.length; i++){
								if( nodelist.indexOf(obj.nodes[i].name) > -1 ){
									obj.nodes[i].highlighted = true;
								}else{
									obj.nodes[i].highlighted = false;
								}
								if(obj.nodes[i].name === 'Peoplefluent_3204'){
									console.log((new Date()) +   "   " + obj.nodes[i].name + "   " + obj.nodes[i].highlighted + "  #router");
								}
							}
						
							var newObj = {};
							newObj.id = id;
							newObj.clientid = clientid;
							newObj.graphid = obj.graphid;
							newObj.time = new Date();
							newObj.nodes = obj.nodes;
							newObj.edges = obj.edges;
							newObj.bounding_box = obj.bounding_box;
							Companies.update({"_id" : newObj.id }, {$set : { "nodes" : newObj.nodes, "time" : newObj.time }});
						}else{
							console.log( "No nodes for highlighting" );
						} 
					}else{
						console.log( "No graph found");
					}

	 				
	 				force.alpha(tmpalpha);
	 			}, 10);

				/*
				var force = threadMap[_obj.clientid];
		 		if(force != undefined){
		 			if(force.alpha() != 0){
		 				console.log(force.alpha());
		 				var tmpalpha = force.alpha();
			 			force.stop();
			 			console.log(force.alpha());
			 			Companies.update({"_id" : _obj.id }, {$set : { "selnodes" : _obj.nodes, "time" : _obj.time }});
		            	//force.resume();	
		            	force.alpha(tmpalpha);
			 		}else{
			 			Meteor.call("updateGraphLocation", _obj);
			 			Meteor.call("dropProtein", _obj);
			 		}
		 		}
				*/	 			
            	return;
	 		}
	 	}
		var objlist = Companies.find({"clientid" : clientid}).fetch();
		var obj = objlist.length > 0  ? objlist[0] : null;
		console.log("highlighting : " + clientid + "   " + objlist.length + "  " + nodelist.length);
		if(obj != null){
			var id = obj._id;
			if(nodelist != undefined && nodelist.length != undefined){
				for(var i = 0; i < obj.nodes.length; i++){
					if( nodelist.indexOf(obj.nodes[i].name) > -1 ){
						obj.nodes[i].highlighted = true;
					}else{
						obj.nodes[i].highlighted = false;
					}
					if(obj.nodes[i].name === 'Peoplefluent_3204'){
						console.log((new Date()) +   "   " + obj.nodes[i].name + "   " + obj.nodes[i].highlighted + "  #router");
					}
				}
			
				var newObj = {};
				newObj.id = id;
				newObj.clientid = clientid;
				newObj.graphid = obj.graphid;
				newObj.time = new Date();
				newObj.nodes = obj.nodes;
				newObj.edges = obj.edges;
				newObj.bounding_box = obj.bounding_box;

				Meteor.call("updateGraphLocation", newObj);
				Meteor.call("dropProtein", newObj);
			}else{
				console.log( "No nodes for highlighting" );
			} 
		}else{
			console.log( "No graph found");
		}
/*
				Meteor.call("updateGraphLocation", _obj);
	 			Meteor.call("dropProtein", _obj);
	
*/
	 			
	 		
 		
 	},

 	"updateGraphLocation" : function(_obj){
		// Companies.remove({"clientid" : _obj.clientid });
		//console.log(_obj.id);
/*
		var objlist = Companies.find({"_id" : _obj.id}).fetch();
                if(objlist.length>0){
			var obj = objlist[0];
			_obj.nodes.forEach(function(e) {
                                var sourceNode = obj.nodes.filter(function(n) {
                                  return n.name === e.name;
                                })[0];
                                if(sourceNode != undefined){
                                        e.highlighted = sourceNode.highlighted;
                                }
                          });
		}*/

		Companies.update({"_id" : _obj.id }, {$set : { "nodes" : _obj.nodes, "edges" : _obj.edges, "time" : _obj.time }});
	    return true;
 	},

 	"dropProtein" : function(_obj){
/*		 console.log("no of nodes sent " , _obj.nodes.length , " no of edges " , _obj.edges.length);
 		var yamlobj = {};
		yamlobj.descrips = ["container-media-property"];
		yamlobj.ingests = {};
		yamlobj.ingests["container-id"] = _obj.graphid;;
		yamlobj.ingests["media-id"] = _obj.graphid + "-node-graph";
		yamlobj.ingests["action"] = "POST:/nodeLocations";
		
		var arr = [];
		for(var i = 0; i < _obj.nodes.length; i++){
			var _t = {};
			_t.id = _obj.nodes[i].name;
			_t.x = _obj.nodes[i].x * _obj.bounding_box.dx/2   - _obj.bounding_box.dx * 0.25;
			_t.y = -  _obj.nodes[i].y * _obj.bounding_box.dy  + _obj.bounding_box.dy * 0.5;		
			_t.highlighted = _obj.nodes[i].highlighted != undefined ? _obj.nodes[i].highlighted : false;
			arr.push(_t);
		}
		yamlobj.ingests["node_locations"] = arr;
		var protein = YAML.safeDump(yamlobj);
		fs.writeFile("/tmp/single.protein", protein, function(err) {
		  	if(err) {
		  		console.log(err);
			}
		  	else {
		//  		console.log("writtern output. Sent time : " + (new Date()) + "  , created time : " + _obj.time);
		  		//exec("cp /tmp/single.protein /tmp/single1.protein");
		  		var exec = Meteor.npmRequire("child_process").exec;
		  		//exec("cp  /tmp/single.protein /tmp/single1.protein  &");
		    	exec("poke tcp://celvds.watson.ibm.com/framework-container /tmp/single.protein &");
		   	}
		});
*/
 	}


 });
