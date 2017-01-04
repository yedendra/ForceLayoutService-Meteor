/*

Router.configureBodyParsers = function() {
  Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    extended: true,
    limit: '500mb'
  }));
};
*/


    Router.configure({
      layoutTemplate: 'forcelayout',
      loadingTemplate: 'loading',
      notFoundTemplate: 'notFound',
      waitOn: function() {  return Meteor.subscribe('companies') && Meteor.subscribe('companiesdescription'); }
    });

    // Router.onBeforeAction('dataNotFound', {only: 'postPage'});

    // Router.route('/', {name: 'postsList'});

    // Router.route('/posts/:_id', {
    //   name: 'postPage',
    //   data: function() { return Posts.findOne(this.params._id); }
    // });

    // Router.onBeforeAction(Iron.Router.bodyParser.urlencoded({
    //     extended: false
    // }));


    Router.route('/', function () {
      this.render('forcelayout');
    });

    Router.route('/item', function () {
      var req = this.request;
      var res = this.response;
      var array = [1,2,3,4,5,6,7,8,8,9,9,20];
      var d3 = Meteor.npmRequire('d3');
      res.end("{title: 'hello from the server\n'}" + d3.max(array));
    }, {where: 'server'});

		Router.route('/getHighlightedNodes', function() {
      			var res = this.response;
			var clientid = this.request.query.clientid;
			var objlist = Companies.find({"clientid" : clientid}).fetch();
			var obj = objlist.length > 0  ? objlist[0] : null;
			var highlightNodes = [];
			if(obj != null && obj.nodes){
					for(var i = 0; i < obj.nodes.length; i++){
						if( obj.nodes[i].highlighted === true ){
							highlightNodes.push(obj.nodes[i].name);
						}
					}
			}else{
				console.log( "No graph found");
			}
			res.end(JSON.stringify(highlightNodes))
		}, { where : 'server'});
		  

    Router.route('/highlightNodes', {where : 'server'})
      .post(function(){
          var req = this.request;
          var res = this.response;
          var clientid = this.request.body.clientid;
          var nodelist = this.request.body.nodes;


          console.log("highlight nodes :  " + nodelist.length);
          Meteor.call("highlightItems", nodelist, clientid);
          res.end("highlighting submitted");
          /*
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
            }

            if(nodelist != undefined){
              var newObj = {};
              newObj.id = id;
              newObj.clientid = clientid;
              newObj.time = new Date();
              newObj.nodes = obj.nodes;
              newObj.edges = obj.edges;
              newObj.bounding_box = obj.bounding_box;
              Meteor.call("highlightItems", newObj);
              res.end( "highlighting done" );
            }else{
              res.end( "No nodes for highlighting" );
            } 
          }else{
            res.end( "No graph found");
          }
          */
      });


    Router.route('/clearNodesEdges', {where : 'server'})
    	.post(function(){
    		console.log("reset graph");
    		var req = this.request;
 		var res = this.response;
 		var clientid = this.request.body.clientid;
 		Companies.remove({ "clientid" : clientid });
 		res.end("cleared nodes and edges for clientid : " + clientid );
    	});

    Router.route('/removeNodes', {where  : 'server'})
    	.post(function(){
    		var req = this.request;
      	var res = this.response;
      	var clientid = this.request.body.clientid;
      	var nodelist = this.request.body.nodes;
      	// console.log(clientid);
    		var objlist = Companies.find({"clientid" : clientid}).fetch();
      	var obj = objlist.length > 0  ? objlist[0] : null;
    		if(obj != null){
    			var id = obj._id;
      			if(nodelist != undefined && nodelist.length != undefined){
      				var removeNodes = [];
      				for(var i = 0; i < nodelist.length; i++){
      					var sourceNode = obj.nodes.filter(function(n) {
      						//console.log(n.name + "  " +  nodelist[i].name);
    				        return n.name === nodelist[i];
    				    });

    				    if(sourceNode.length  > 0){
      						obj.nodes.splice(obj.nodes.indexOf(sourceNode[0]), 1) ;	
      						removeNodes.push(nodelist[i])
    				    }else{
      						console.log(nodelist[i] + " does not exists.");
      					}
      				}

      				for(var i = obj.edges.length -1; i >=0; i--){
      					var source = obj.edges[i].source;
      					var target = obj.edges[i].target;
      					if(removeNodes.indexOf(source) > -1 || removeNodes.indexOf(target)> -1){
      						obj.edges.splice(i,1);
      					}
      				}

        			var newObj = {};
      				newObj.clientid = clientid;
      				newObj.time = new Date();
      				newObj.nodes = obj.nodes;
      				newObj.edges = obj.edges;
      				newObj.bounding_box = obj.bounding_box;
      				Companies.remove({_id : id });
      				Companies.insert(newObj);
      				var obj = Meteor.call("forcedirect", clientid);
      				res.end("Updated graph : client id : " +  clientid + ", nodes(" + obj.nodes.length + "), edges(" 
      					+ obj.edges.length + ")" );
      			}
    		}else{
    			res.end("client id not found");
    		}

    	});

    Router.route('/addNodesEdges', {where : 'server'})
      .post(function(){
      		var req = this.request;
      		var res = this.response;
      		var clientid = this.request.body.clientid;
      		var nodelist = this.request.body.nodes;
      		var edgelist = this.request.body.edges;

					var desc = {}
					nodelist.forEach(function(n){
						desc[n.name] = n.content
					})
      		
					var descobj = CompaniesDescription.find({"clientid" : clientid}).fetch()
					CompaniesDescription.remove({"clientid" : clientid });
      		CompaniesDescription.insert({"clientid" : clientid, "description" : desc });

      		var objlist = Companies.find({"clientid" : clientid}).fetch();
      		var obj = objlist.length > 0  ? objlist[0] : null;
      		if(obj != null){
      			var id = obj._id;
      			if(nodelist != undefined && nodelist.length != undefined){
      				for(var i = 0; i < nodelist.length; i++){
      					var sourceNode = obj.nodes.filter(function(n) {
      						console.log(n.name + "  " +  nodelist[i].name);
    				        return n.name === nodelist[i].name;
    				    });

    				    if(sourceNode.length  == 0){
    				    	nodelist[i].weight = 1;
      						obj.nodes.push(nodelist[i]);	
      					}else{
      						console.log(nodelist[i].name + " already exists.");
      					}
      				}
      			}

      			if(edgelist != undefined){
      				for(var i = 0; i < edgelist.length; i++){
      					obj.edges.push(edgelist[i]);	
      				}
      			}

      			if(nodelist != undefined ||  edgelist != undefined){
        			var newObj = {};
      				newObj.clientid = clientid;
      				newObj.time = new Date();
      				newObj.nodes = obj.nodes;
      				newObj.edges = obj.edges;
      				newObj.bounding_box = obj.bounding_box;
      				Companies.remove({_id : id });
      				Companies.insert(newObj);
      				var obj = Meteor.call("forcedirect", clientid);
      				res.end("Updated graph : client id : " +  clientid + ", nodes(" + obj.nodes.length + "), edges(" 
      					+ obj.edges.length + ")" );
      			}else{
      				res.end("No updates for graph : client id : " +  clientid + ",  nodes(" + obj.nodes.length + "), edges(" 
      					+ obj.edges.length + ")" );
      			}	
      			
      		}else{
      			console.log("new graph for " + clientid + "   " + (new Date()).getMilliseconds()); 
      			var bounding_box = this.request.body.bounding_box != undefined ? this.request.body.bounding_box : {"dx": 1000,"dy": 900};
      			var newObj = {};
      			newObj.clientid = clientid;
      			newObj.nodes = nodelist;
      			newObj.edges = edgelist;
      			newObj.time = new Date();
      			newObj.bounding_box = bounding_box;
      			Companies.insert(newObj);
      			var obj = Meteor.call("forcedirect", clientid);
      			res.end("Created new graph");
      		}
      });

    Router.route('/allNodesEdges', {where : 'server'})
      .post(function(){
 		console.log((new Date()) + " - add all nodes and edges");
 		var req = this.request;
 		var res = this.response;
 		var clientid = this.request.body.clientid;
		var graphid = this.request.body.graphid;
     		var queryid = this.request.body.queryid;
 		var nodelist = this.request.body.nodes;
 		var edgelist = this.request.body.edges;
 		console.log("nodes count : " + nodelist.length + " , Edge count : " + edgelist.length);

		var desc = {}
		nodelist.forEach(function(n){
			desc[n.name] = n.content
		})
		
		// var descobj = CompaniesDescription.find({"clientid" : clientid}).fetch();
		CompaniesDescription.remove({"clientid" : clientid });
		console.log(desc)
		CompaniesDescription.insert({"clientid" : clientid, "description" : desc });

 		var objlist = Companies.find({"clientid" : clientid}).fetch();
 		var obj = objlist.length > 0  ? objlist[0] : null;
    /*  		if(obj != null){
      			var id = obj._id;
      			Companies.remove({_id : id });
      		}

          for(var i = 1;i <= nodelist.length;i++){
            nodelist[i-1].x = i/nodelist.length;
            nodelist[i-1].y = i/nodelist.length;
          }

          for(var i = 0;i < edgelist.length;i++){
            edgelist[i].sx = 0;
            edgelist[i].sy = 0;
            edgelist[i].tx = 0;
            edgelist[i].ty = 0;
          }
    */
    		var newObj = {};
    		newObj.clientid = clientid;
		newObj.graphid = graphid;
    		if(obj != null){
      		var id = obj._id;
    			nodelist.forEach(function(e) {
			var sourceNode = obj.nodes.filter(function(n) {
        			  return n.name === e.name;
      			})[0];
      			if(sourceNode != undefined){
					e.x = sourceNode.x;
	      			e.y = sourceNode.y;
					e.highlighted = sourceNode.highlighted;
				}else{
					e.x = 0.5;
					e.y = 0.5;
					e.highlighted = false;
				}
			  });
       		newObj.nodes = nodelist;
       		newObj.edges = edgelist;
 			Companies.remove({_id : id });
 		}else{
       		for(var i = 1;i <= nodelist.length;i++){
	    			if(nodelist.length > 25){
					nodelist[i-1].x = i/nodelist.length;
	    				nodelist[i-1].y = i/nodelist.length;
				}else{
					nodelist[i-1].x = 0.5;
					nodelist[i-1].y = 0.5;				
				}
				nodelist[i-1].highlighted = false;
	       	}
          	newObj.nodes = nodelist;
            	newObj.edges = edgelist;
          }		
      	var bounding_box = this.request.body.bounding_box != undefined ? this.request.body.bounding_box : {"dx": 1000,"dy": 900};
 		newObj.time = new Date();
 		newObj.bounding_box = bounding_box;
 		Companies.insert(newObj);
 		var obj = Meteor.call("forcedirect", clientid);
 		res.end("Created new graph");
     });


    Router.route('/test', function () {
      	var res = this.response;
      	var obj = {
					"response": "AOK",
  				"error": null
				};
      	res.end(JSON.stringify(obj));
      },{ where: 'server' });
      
