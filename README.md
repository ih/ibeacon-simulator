# iBeacon Simulator
A meteor app for simulating mobile device interaction with iBeacons.

## Installation Instructions
Clone this repository and make sure meteor is installed on the machine.

## Operating Instructions
Operating the simulator consists of two steps:
1) Configuration
2) Execution

### Configuration
You configure the simulator by setting both the events to be simulated as well as the initialization for the beacons.  Both are set by putting a JSON parsable string into text areas at the bottom of the application.  The format for both the event and beacon JSON are described below.

#### Event JSON Format
Each event represents where a device has moved to at the given time.  The format is:

```JSON
{
	"uuid": "String", // unique id of the device
	"position":  {"x": Number, "y": Number}, // location of the device where x and y have a range [0, 99]
	"time": number // number of seconds after the start of the simulation, represents the instant when the device first appears at the given location
}
```

#### Beacon JSON Format
Each beacon json represents the settings for a particular beacon. The format is:
{
	"uuid": "String", // beacon's proximity uuid
	"major": Number, // beacon's major
	"minor": Number, // beacon's minor
	"proximityRadius": Number, // distance from beacon where mobile devices start to send signals
	"position": {"x": Number, "y": Number} // location of the beacon where x and y have a range [0, 99]
}

### Execution
Once the simulator has been configured it can be run one event at a time (by clicking on the "Process Single Event" button) or all events at once (by clicking on the "Process Events" button).

For each device event the simulator will send beacon events to Firebase based on the device's previous event.  At the end of the simulation the simulator will be "flushed" to send any additional signals for the each device's final event.

## Design Tradeoffs
One design choice was to drive the simulator off of individual event times rather than have a "world clock" and computing the state of the world for each time step.  The advantage incrementing time via events is it allows the simulation to "skip" over periods of time where nothing is happening and you don't have to check on devices/beacons for each second of time.  A disadvantage is the simulation visualization can be less fluid and beacon events get processed all at once based on the previous event, which can make it more difficult to follow what's going on during the simulation.  This also requires the "flush" at the end to make sure the last listed event for each device gets processed.

Another design choice was to only compute the beacon events for the current event's device as opposed to computing the beacon events for every device when processing an event.  The advantage is it reduces the number of devices that have to be checked at each event and it simplifies the code when processing a single event.  The disadvantage is beacon events can be sent out of order from their "create_at" time.
