/* status === "Started", "Good", "Warning", "Fail", "Logging results and restarting" */

var model = {
  currentTime: '',
  timeStarted: '',
  timeLastClean: '',
  timestamps: [],
  status: 'Started',
  oldStatus: 'Initializing...', //detect change on status
  lastStatus: 'Initializing...', //for DOM use
  url: 'http://5cce22999eb94f0014c481ae.mockapi.io/response',
  req: '',
};

var view = {
  canary: '',
  canaryPath: '',
  status: '',
  timeStarted: '',
  timeUp: '',
  timeClean: '',
  lastStatus: '',
  updateCanaryPath: function(status) {
    var classes = this.canaryPath.classList;
    switch (status) {
      case 'Warning':
        classes.value = 'canary-path canary-warning';
        break;
      case 'Fail':
        classes.value = 'canary-path canary-fail';
        break;
      default:
        classes.value = 'canary-path canary-good';
    }
  },
  setTime: function(date, elem) {
    var hr = date.getUTCHours();
    if (elem === view.timeStarted) {
      hr = date.getHours();
    }
    var min = date.getUTCMinutes();
    var sec = date.getUTCSeconds();

    if (hr < 10) {
      hr = '0' + hr.toString();
    }
    if (min < 10) {
      min = '0' + min.toString();
    }
    if (sec < 10) {
      sec = '0' + sec.toString();
    }

    elem.innerText = hr + ':' + min + ':' + sec;
  },
  setStatus: function(status) {
    this.status.innerText = status;
  },
  setLastStatus: function(status) {
    this.lastStatus.innerText = status;
  },
};

var controller = {
  getPageElements: function() {
    var v = view;
    v.canary = document.getElementsByClassName('canary')[0];
    v.canaryPath = document.getElementsByClassName('canary-path')[0];
    v.status = document.getElementsByClassName('canary-status')[0];
    v.timeStarted = document.getElementsByClassName('canary-time-started')[0];
    v.lastStatus = document.getElementsByClassName('canary-last-status')[0];
    v.timeUp = document.getElementsByClassName('canary-time-up')[0];
    v.timeClean = document.getElementsByClassName('canary-time-clean')[0];
  },
  getAsync: function(url) {
    model.req = new XMLHttpRequest();
    model.req.open('GET', url);
    model.req.onreadystatechange = controller.processAsync;
    model.req.send();
  },
  processAsync: function() {
    /* keeping in case redirect does not give off readyState 4
    if (model.req.readyState === 2 || model.req.readyState === 3) {
      console.log(model.req.readyState, model.req.status);
    }
    */
    if (model.req.readyState === 4) {
      console.log('done');
      if (model.req.status === 200) {
        if (model.req.oldStatus !== model.req.status) {
          model.timestamps.push({ time: model.time.getTime(), status: status });
        }
        return controller.updateStatus('Good');
      }
      if (model.req.status >= 300 && model.req.status <= 308) {
        model.timestamps.push({ time: model.time.getTime(), status: status });
        return controller.updateStatus('Worsen');
      }
    }
  },
  setState: function() {
    model.timeStarted = new Date();
    model.timeLastClean = new Date();
    view.setTime(model.timeStarted, view.timeStarted);
    view.setStatus(model.status);
    view.setLastStatus(model.lastStatus);
  },
  updateState: function() {
    controller.updateTimeCounters();
    if (model.status !== model.oldStatus) {
      view.updateCanaryPath(model.status);
      view.setStatus(model.status);
      view.oldStatus = model.status;
    }
    setTimeout(controller.updateState, 1000);
  },
  updateStatus: function(e) {
    switch (e) {
      case 'Good':
        model.status = 'Good';
        break;
      case 'Worsen':
        if (model.status === 'Started' || model.status === 'Good') {
          model.status = 'Warning';
        } else if (model.status === 'Warning') {
          model.status = 'Fail';
        } else {
        }
    }
  },
  updateTimeCounters: function() {
    var current = new Date();
    model.currentTime = current;
    var upHolder = current.getTime() - model.timeStarted.getTime();
    var up = new Date(upHolder);
    view.setTime(up, view.timeUp);
    var cleanHolder = current.getTime() - model.timeLastClean.getTime();
    var clean = new Date(cleanHolder);
    view.setTime(clean, view.timeClean);
  },
  init: function() {
    this.getPageElements();
    this.setState();
    this.updateState();
  },
};

controller.init();
