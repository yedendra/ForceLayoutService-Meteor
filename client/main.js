var selectionList = [];
var contentDesc = {};
function updateSelection(item){	
	if(selectionList.indexOf(item) > -1){
		selectionList.splice(selectionList.indexOf(item),1);
	}else{
		selectionList.push(item);
	}
	var obj = {"clientid": "ma", "nodes" : selectionList};
	
	HTTP.post("highlightNodes", {"data" : obj }, function (err, data) {
      console.log(data);
      if(err)
      	console.log(err);
    });
	
}


Template.forcelayout.events({
	'change #queryBox' : function (){
		console.log(document.getElementById("queryBox").value);
		var obj = {'text' : document.getElementById("queryBox").value};
		Meteor.call('celspeak', obj);
	}
  
});




Template.forcelayout.rendered = function(){
	
	var clientid = "ma";
	//Easy colors accessible via a 10-step ordinal scale
	var color = d3.scale.category10();

	var margin = {top: 30, right: 20, bottom: 30, left: 50},
    width = window.innerWidth - margin.left - margin.right,
    height = window.innerHeight  - margin.top - margin.bottom;

	//Create SVG element
	var svg = d3.select("#graph")
				.attr("width", width + margin.left + margin.right)
				.attr("height", height + margin.top + margin.bottom)
			.append("g")
				.attr("transform", 
					"translate(" + margin.left + "," + margin.top + ")");

	// Define the div for the tooltip
	var tooltipdiv = d3.select("body").append("div")	
		.attr("class", "tooltip")				
		.style("opacity", 0);
		
	var key = function(d){ 
		return d.name;
	};

	var edgekey = function(d){
		return d.source + "_" + d.target;
	}

	/*
		
	*/

	console.log(width + "   " + height);
	Deps.autorun(function(){
		var dataset = Companies.find({"clientid" : clientid}).fetch();
		var contents =  CompaniesDescription.find({"clientid" : clientid}).fetch();
		console.log(contents);
		if(contents.length>0 ){
			contentDesc = contents[0].description;
		}
		
		svg.selectAll("line").remove();
		svg.selectAll("circle").remove();
		svg.selectAll("text").remove();
		if(dataset.length>0 && width != undefined && height != undefined){
			
			var obj = dataset[0];
			selectionList.length = 0;
			for(var i = 0; i < obj.nodes.length;i++){
				if(obj.nodes[i].highlighted){
					selectionList.push(obj.nodes[i].name);
				}
			}


		
			//var g = svg.append("g");

			
			var lines = svg.selectAll("line")
							.data(obj.edges, edgekey);
			lines.enter()
					.append("line")
					.attr("class", "links")
					.attr("z-index", -1)
					.attr("x1", function(d){
						if(d.sx != undefined){
							return d.sx * width;	
						}else{
							return 0;
						}
						
					})
					.attr("y1", function(d){
						if(d.sy != undefined){
							return d.sy * height;
						}else{
							return 0;
						}
					})
					.attr("x2", function(d){
						if(d.tx != undefined){
							return d.tx * width;	
						}else{
							return 0;
						}
					})
					.attr("y2", function(d){
						if(d.ty != undefined){
							return d.ty * height
						}else{
							return 0;
						}
					})
					.attr("z-index", -1);


			var circles = svg.selectAll("circle")
						  .data(obj.nodes, key);

			circles.enter()
					.append("circle")
					.attr("class", function(d){
						if(d.type === 0.5){
							return "conceptnodes";
						}else{
						  if(d.highlighted)
							return "selectednodes";
						  else
							return "companynodes";
						}
					})
					.attr("id", function(d){
						return d.name;
					})
					.attr("cx", function(d){
						return d.x * width;
					})
					.attr("cy", function(d){
						return d.y * height;
					})
					.attr("r", function(d){
						if(d.type === 0.5)
							return "4em";
						else if(d.type === 2)
							return "2.1em";
						else
							return "2em";
					})
					// .attr("data-tooltip", function(d){

					// 	var div = document.createElement("div")
					// 	div.innerHTML = "<b>" + decodeURI(d.label) + "</b><p>" + d.content.description+ "</p>Employees : " + d.content.employees + "<br/>Revenue : " + d.content.revenue
					// 	return div.innerHTML;
					// })
					.on("mousedown", function(d){
						console.log(d);
						if(d.type > 0.5){
							Meteor.setTimeout(function(){
								updateSelection(d.name)
							}, 5);
						}
					})
					.on("mouseover", function(d) {
						if(!d.highlighted)
							d3.select(this).style("stroke", "darkorange").style("stroke-width", "0.25em")	

						var cd = contentDesc[d.name]
						if(cd){ 	
							tooltipdiv.transition()		
								.duration(200)		
								.style("opacity", .9);		
							tooltipdiv	.html("<b>" + decodeURI(d.label) + "</b><p>" + cd.description+ "</p>Employees : " + cd.employees + "<br/>Revenue : " + cd.revenue)	
								.style("left", function(d){
									if(window.innerWidth - d3.event.pageX < 250)
										return  (d3.event.pageX -250) + "px"
									else
										return (d3.event.pageX) + "px"
								})		
								.style("top", function(d){
									if( window.innerHeight - d3.event.pageY < 150)
										return  (d3.event.pageY -150) + "px"
									else
										return (d3.event.pageY) + "px"
								});
						}	
					})					
					.on("mouseout", function(d) {	
						if(!d.highlighted)
							d3.select(this).style("stroke", "white").style("stroke-width", "0.1em")
						tooltipdiv.transition()		
							.duration(500)		
							.style("opacity", 0);	
					});

			var text = svg.selectAll("text")
						  .data(obj.nodes, key);

			text.enter()
					.append("text")
					.attr("class", function(d){
						if(d.type === 0.5)
							return "concepttext";
						else
							return "nodetext";
					})
					.attr("id", function(d){
						return d.name+'txt';
					})
					.attr("x", function(d){
						return Math.round(d.x * width);
					})
					.attr("y", function(d){
						return Math.round(d.y * height);
					})
					.text( function(d){
						return decodeURI(d.label);
					});
					
					

		}
		//Draw arc paths
		// newGroups
		// 	.append("circle")
		// 	.attr("cx", function(d){
		// 			return d.x;
		// 		})
		// 		.attr("cy", function(d){
		// 			return d.y;
		// 		});
		
		// //Labels
		// newGroups
		// 	.append("text")
		// 	.attr("transform", function(d) {
		// 		return "translate(" + arc.centroid(d) + ")";
		// 	})
		// 	.attr("text-anchor", "middle")
		// 	.text(function(d) {
		// 		return d.value;
		// 	});

		// arcs
		// 	.transition()
		// 	.select('path')
		// 	.attrTween("d", function(d) {
		// 		this._current = this._current || d;
		// 		var interpolate = d3.interpolate(this._current, d);
		// 		this._current = interpolate(0);
		// 		return function(t) {
		// 			return arc(interpolate(t));
		// 		};
		// 	});
		
		// arcs
		// 	.transition()
		// 	.select('text')
		// 	.attr("transform", function(d) {
		// 		return "translate(" + arc.centroid(d) + ")";
		// 	})
		// 	.text(function(d) {
		// 		return d.value;
		// 	});

		// arcs
		// 	.exit()
	 // 		.remove();
	});
};
