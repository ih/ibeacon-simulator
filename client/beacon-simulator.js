/**
* =========INITIALIZATION==========
*/

Beacons = new Meteor.Collection(null);
Devices = new Meteor.Collection(null);

// Maximum number seconds to send didRangeBeacons
var MAX_DIDRANGE = 5;

// The starting date/time for the simulation, all times are relative to
// EPOCH e.g. if device.time === 1 then the true device time is epoch+1
var EPOCH = Date.now();

// amount of delay between processing events in milliseconds
var SIMULATION_SPEED = 1000;

var myDataRef = new Firebase('https://resplendent-fire-131.firebaseio.com/');

var events = [{"uuid":"d1", "position": {"x": 40, "y": 50}, "time": 0},
			  {"uuid":"d2", "position": {"x": 90, "y": 50}, "time": 0},
			  {"uuid":"d1", "position": {"x": 50, "y": 50}, "time": 4},
			  {"uuid":"d2", "position": {"x": 60, "y": 50}, "time": 5},
			  {"uuid":"d2", "position": {"x": 50, "y": 50}, "time": 7},
			  {"uuid":"d1", "position": {"x": 60, "y": 50}, "time": 10},
			  {"uuid":"d2", "position": {"x": 30, "y": 52}, "time": 10},
			  {"uuid":"d1", "position": {"x": 70, "y": 50}, "time": 20}];

var beacons = [{
	"uuid": "b1", "major": 100, "minor": 0, "proximityRadius": 10,
	"position": {"x": 45, "y": 50}
}, {
	"uuid": "b2", "major": 100, "minor": 0, "proximityRadius": 10,
	"position": {"x": 55, "y": 50}
}];

/** Session Variables
 signalsSent: a list of beacon events that have been sent to firebase
 time: the current number of seconds in simulation after EPOCH
 (width/height)Multiplier: amount to scale the position coordinates of an object
when displaying it.
*/

Meteor.startup(function () {
	_.each(beacons, function (beacon) {
		Beacons.insert(beacon);
	});

	Session.set('signalsSent', []);
});

/**
* =========CONFIGURATION==========
*/

// Parse and set user input of configuration (events and beacons) also
// reinitialize the simulator.
Template.configuration.events({
	'click #submit-configuration': function (event, template) {
		Devices.remove({});
		Beacons.remove({});
		Session.set('time', 0);
		Session.set('signalsSent', []);
		// TODO input validation
		events = JSON.parse(template.$('#events-input').val());
		beacons = JSON.parse(template.$('#beacons-input').val());
		_.each(beacons, function (beacon) {
			Beacons.insert(beacon);
		});
	}
});


// Used in displaying the default events/beacons.
Template.configuration.helpers({
	jsonEvents: function () {
		return JSON.stringify(events);
	},
	jsonBeacons: function () {
		return JSON.stringify(beacons);
	}
});

/**
* =========SIMULATION==========
*/

Template.simulationDisplay.events({
    'click #process-events': function (event, template) {
		console.log('processing events');
		processEvents();
    },
	'click #process-single-event': function (event, template) {
		console.log('processing single event');
		if (!_.isEmpty(events)) {
			processEvent(events.shift());
		}
		else {
			// TODO make this more visible to the user
			console.log('no events to proccess');
			flushDevices();
		}
	}
});


/** Call processEvent for each event with a delay after each call.
*/
function processEvents() {
	window.setTimeout(function () {
		if (!_.isEmpty(events)) {
			console.log(events[0]);
			processEvent(events.shift());
			processEvents();
		}
		else {
			flushDevices();
		}
	}, SIMULATION_SPEED);
};

/** Basically record a change to a device's state as represented by the
passed in event as well as sending any beacon events.
*/
function processEvent(event) {
	Session.set('time', event.time);
	var beacons = Beacons.find().fetch();
	// get the beacons that have the current event's device in range
	var beaconsNowInRange = _.filter(beacons, function (beacon) {
		var distanceToBeacon = getDistance(beacon.position, event.position);
		return distanceToBeacon <= beacon.proximityRadius;
	});
	var device = Devices.findOne({uuid: event.uuid});
	// if the device hasn't been seen before start tracking it
	if (!device) {
		Devices.insert({
			uuid: event.uuid,
			time: event.time,
			position: event.position,
			beaconsInRange: _.object(_.map(
				beaconsNowInRange, function (beacon) {
					return [beacon.uuid, 0];})),
			previousPosition: null,
			previousTime: null
		});
	}
	// if we've already seen the device use it's previous state to determine
	// how many didRangeBeacons signals to send and use the current state to
	// determine whether to send a didExitRange signal
	// then update the state of the device in the collection
	else {
		device.beaconsInRange = sendDidRangeSignals(device, event);
		var updatedBeaconsInRange = sendDidExitRange(
			beaconsNowInRange, device, event);
		Devices.update(
			{_id: device._id},
			{$set: {
				position: event.position,
				beaconsInRange: updatedBeaconsInRange,
				time: event.time}});
	}
}

/* Each device keeps track of the number of didRangeBeacons signals it sent for
each beacon.  This function updates the counts after calling sendDidRangeSignal.
 */
function sendDidRangeSignals(device, event) {
	var updatedBeaconsInRange = _.clone(device.beaconsInRange);
	_.each(_.keys(device.beaconsInRange), function (beaconId) {
		var beacon = Beacons.findOne({uuid: beaconId});
		var signalsSentCount = sendDidRangeSignal(beacon, device, event);
		updatedBeaconsInRange[beaconId] += signalsSentCount;
	});
	return updatedBeaconsInRange;
}

/* Determine the number of didRangeBeacons signals to send and send them.
 */
function sendDidRangeSignal(beacon, device, event) {
	var secondsPassed = event.time - device.time;
	var signalCount = Math.min(
		secondsPassed, MAX_DIDRANGE - device.beaconsInRange[beacon.uuid]);
	_.each(_.range(signalCount), function (secondsAfter) {
		var beaconEvent = {
			uuid: beacon.uuid,
			major: beacon.major,
			minor: beacon.minor,
			type: 'didRangeBeacons',
			create_at: formatTime(device.time + secondsAfter),
			visitor_uuid: device.uuid
		};
		Session.set(
			'signalsSent', Session.get('signalsSent').concat(beaconEvent));
		myDataRef.push(beaconEvent);
	});
	return signalCount;
}

/** Determine whether to send a didExitRange signal and send it if appropriate.
also add new beacons and remove old beacons from the count of didRangeBeacons.
*/
function sendDidExitRange(beaconsNowInRange, device, event) {
	var updatedBeaconsInRange = _.clone(device.beaconsInRange);
	var previousBeaconIds = _.keys(device.beaconsInRange);
	var newBeaconsIds = _.difference(
		_.pluck(beaconsNowInRange, 'uuid'), previousBeaconIds);
	var lostBeaconsIds = _.difference(
		previousBeaconIds, _.pluck(beaconsNowInRange, 'uuid'));
	_.each(lostBeaconsIds, function (beaconId) {
		var beacon = Beacons.findOne({uuid: beaconId});
		var beaconEvent = {
			uuid: beaconId,
			major: beacon.major,
			minor: beacon.minor,
			type: 'didExitRange',
			create_at: formatTime(event.time),
			visitor_uuid: device.uuid
		};
		Session.set(
			'signalsSent', Session.get('signalsSent').concat(beaconEvent));
		myDataRef.push(beaconEvent);

		delete updatedBeaconsInRange[beaconId];
	});
	_.each(newBeaconsIds, function (beaconId) {
		updatedBeaconsInRange[beaconId] = 0;
	});
	return updatedBeaconsInRange;
}

function flushDevices() {
	// Add event for each device at time one past the current state
	// so each is processed one last time
	console.log('final pass through...');
	_.each(Devices.find().fetch(), function (device) {
		var finalEvent = {
			uuid: device.uuid,
			position: device.position,
			time: Session.get('time') + 1 // maybe plus 5?
		};
		events.push(finalEvent);
	});
	console.log(events);
	_.each(events, processEvent);
	console.log('finished processing events');
}

/**
* =========VISUALIZATION==========
*/

Template.simulationDisplay.rendered = function () {
	Session.set(
		'widthMultiplier', this.$('#simulation-display').width() / 100.0);
	Session.set(
		'heightMultiplier', this.$('#simulation-display').height() / 100.0);
};

Template.simulationDisplay.helpers({
	devices: function () {
		return Devices.find();
	},
	beacons: function () {
		return Beacons.find();
	},
	simulationEpoch: function () {
		return new Date(EPOCH);
	},
	simulationTime: function () {
		return Session.get('time') || 0;
	},
	signalsSent: function () {
		return Session.get('signalsSent');
	},
	orderedSignalsSent: function () {
		return _.sortBy(
			Session.get('signalsSent'), function (signal) {
				return Date.parse(signal.create_at);
			});;
	}
});

Template.device.rendered = function () {
	positionObject(this, Devices);
};

Template.beacon.rendered = function () {
	positionObject(this, Beacons);
};

function positionObject(templateInstance, collection) {
	Deps.autorun(function () {
		var object = collection.findOne({uuid: templateInstance.data.uuid});
		var $object = templateInstance.$('#' + object.uuid);
		$object.css('top', object.position.y * Session.get('heightMultiplier'));
		$object.css('left', object.position.x * Session.get('widthMultiplier'));
	});
}

/**
* =========UTILITY FUNCTIONS==========
*/

// TODO move to a utility file?
function getDistance(point1, point2) {
	var diffx = point1.x - point2.x;
	var diffy = point1.y - point2.y;
	return Math.sqrt(Math.pow(diffx, 2) + Math.pow(diffy, 2));
}


function formatTime(relativeSeconds) {
	// console.log('formatting time ' + (EPOCH + relativeSeconds * 1000));
	var date = new Date(EPOCH + relativeSeconds * 1000);
	return date.toString();
}
