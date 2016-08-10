Companies = new Mongo.Collection('companies');
CompaniesDescription = new Mongo.Collection('compdescription');


Meteor.startup(function () {
	// producer.js
	if (Meteor.isServer) {
		// var Fiber = Meteor.npmRequire('fibers');
		// var zmq = Meteor.npmRequire('zmq');
		// sock = zmq.socket('pub');
		// sock.bindSync('tcp://9.2.247.218:3001');
		// //sock.bindSync('ipc:///tmp/zmq.sock');

		// sock.on("error", function(e){
		// 		console.log(e);
		// });
	}

	// subsock = zmq.socket('sub');
	// subsock.connect('tcp://9.2.247.158:3001');
	// subsock.subscribe('');
	// subsock.on('message', function(topic, message){
	// 	console.log("received : " + topic + "  " + message);
	// });
	// sock.on('message', Meteor.bindEnvironment(
	// 	function(topic, message){
	// 		console.log('received a message related to:', topic.toString(), 'containing message:', message.toString());
	// 	}
	// 	,
	// 		function(res, err){

	// 		})
	// 	);
	

	// sock.connect('tcp://9.2.247.158:3002', function(err) {
 //    	if (err) throw err
 //    	console.log('ready to publish for ZMQ messages')
	// });
/*
	try {
		Meteor.bindEnvironment(
			function(){
				sock.bindSync('tcp://9.2.247.158:3002');
				sock.send("test hello");
				sock.on("error", function(e){
					console.log(e);
				})
			},
			function(res, err){

			});
	}
	catch (e) {
		console.log ("Server already running on port " + 'tcp://9.2.247.158:3002');
		//console.log ("exception is: " + e);
		// if (noCrash) return; //don't crash
		// else 
			throw e;
	}
	*/
});