/** single stationary device, single beacon, stationary event **/
/// beacons
[{"uuid": "b1", "major": 100, "minor": 0, "proximityRadius": 10, "position": {"x": 50, "y": 50}}];
// events
[{"uuid":"d1", "position": {"x": 50, "y": 45}, "time": 0}];
// 1 didRange signals at 0

// single stationary device, single beacon, multiple didRange <5
// events
[{"uuid":"d1", "position": {"x": 50, "y": 45}, "time": 0},
 {"uuid":"d1", "position": {"x": 50, "y": 45}, "time": 2}];
// 3 didRange signals from 0 to 2

// single stationary device, single beacon, multiple didRange >=5
// events
[{"uuid":"d1", "position": {"x": 50, "y": 45}, "time": 0},
 {"uuid":"d1", "position": {"x": 50, "y": 45}, "time": 7}];
// 5 didRange signals from 0 to 4

// single mobile device, single beacon, multiple didRange
// events
[{"uuid":"d1", "position": {"x": 0, "y": 0}, "time": 0},
 {"uuid":"d1", "position": {"x": 50, "y": 45}, "time": 5},
 {"uuid":"d1", "position": {"x": 50, "y": 90}, "time": 11}];
// 5 didRange signals starting at 5 and 1 didExit at 11

// single mobile device, single beacon, multiple enter exit enter exit
// events
[{"uuid":"d1", "position": {"x": 0, "y": 0}, "time": 0},
 {"uuid":"d1", "position": {"x": 50, "y": 45}, "time": 5},
 {"uuid":"d1", "position": {"x": 50, "y": 90}, "time": 8},
 {"uuid":"d1", "position": {"x": 45, "y": 50}, "time": 20},
 {"uuid":"d1", "position": {"x": 90, "y": 90}, "time": 30}];
// 3 didRange signals from 5-7, 1 didExit at 8
// 5 didRange from 20-24, 1 didExit at 30

// single mobile device, multiple beacons
/// beacons
 [{"uuid": "b1", "major": 100, "minor": 0, "proximityRadius": 10, "position": {"x": 45, "y": 50}},
  {"uuid": "b2", "major": 100, "minor": 0, "proximityRadius": 10, "position": {"x": 55, "y": 50}}];

// events
[{"uuid":"d1", "position": {"x": 40, "y": 50}, "time": 0},
 {"uuid":"d1", "position": {"x": 50, "y": 50}, "time": 4},
 {"uuid":"d1", "position": {"x": 60, "y": 50}, "time": 10},
 {"uuid":"d1", "position": {"x": 70, "y": 50}, "time": 20}];
//5 didRange from 0-5 for b1, 5 didRange for b2 from 4-8
// 1 didExit for b1 at 10, 1 didExitRange at 20 for b2

// multiple mobile devices, multiple beacons
// events
[{"uuid":"d1", "position": {"x": 40, "y": 50}, "time": 0},
 {"uuid":"d2", "position": {"x": 90, "y": 50}, "time": 0},
 {"uuid":"d1", "position": {"x": 50, "y": 50}, "time": 4},
 {"uuid":"d2", "position": {"x": 60, "y": 50}, "time": 5},
 {"uuid":"d2", "position": {"x": 50, "y": 50}, "time": 7},
 {"uuid":"d1", "position": {"x": 60, "y": 50}, "time": 10},
 {"uuid":"d2", "position": {"x": 30, "y": 52}, "time": 10},
 {"uuid":"d1", "position": {"x": 70, "y": 50}, "time": 20}];
//d1 5 didRange from 0-5 for b1, d1 5 didRange for b2 from 4-8
// d1 1 didExit for b1 at 10, d1 1 didExitRange at 20 for b2
// d2 5 didRange 5-9 for b2, d2 3 didRange for b1 from 7-9
// d2 1 didExit for b2 at 10, d2 1 didExit for b1 at 10
