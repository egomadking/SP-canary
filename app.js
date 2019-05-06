var model = {
  currentTime: '',
  timeStarted: '',
  timeLastClean: '',
  timestamps: [],
  status: 'Started',
  oldStatus: 'Initializing...', //detect change on status
  lastStatus: 'Initializing...', //for DOM use
  timeFirstIssue: '',
  timeFirstIssueSet: false,
  url: 'http://5cce22999eb94f0014c481ae.mockapi.io/response', //changes when attached to SP
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
  timeFirstIssue: '',
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
    if (elem === view.timeStarted || elem === view.timeFirstIssue) {
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
  setLastStatus: function(lastStatus) {
    this.lastStatus.innerText = lastStatus;
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
    v.timeFirstIssue = document.getElementsByClassName('canary-time-first-issue')[0];
    if(_spPageContextInfo){
      model.url = _spPageContextInfo.webAbsoluteUrl + '/_api/web'
    }
  },
  getAsync: function(url) {
    model.req = new XMLHttpRequest();
    model.req.open('GET', url);
    model.req.onreadystatechange = controller.processAsync;
    model.req.send();
  },
  processAsync: function() {
    if (model.req.readyState === 4) {
      model.timestamps.push({ time: model.currentTime.getTime(), status: model.req.status });
      if (model.req.status === 200) {
        return controller.updateStatus('Good');
      }
      else if(model.req.status === 0 || model.req.status >= 400){
        return controller.updateStatus('Worsen'); //I may want to deal with 0 & 4xx differently
        
      }
      else if (model.req.status >= 300 && model.req.status <= 308) {
        return controller.updateStatus('Worsen');
      } else {
        console.log("exception to status logging. Check status.")
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
  checkConnection: function(){
    controller.getAsync(model.url)
    setTimeout(controller.checkConnection, 5000);
  },
  updateState: function() {
    controller.updateTimeCounters();
    if (model.status !== model.oldStatus) {
      view.updateCanaryPath(model.status);
      view.setStatus(model.status);
      model.oldStatus = model.status;
      view.setLastStatus(model.lastStatus);
    }
    setTimeout(controller.updateState, 1000);
  },
  updateStatus: function(e) {
    model.lastStatus = model.oldStatus;
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
          //something else
        }
        break;
      default:
        model.status = "Good";
    }
  },
  updateTimeCounters: function() {
    var current = new Date();
    model.currentTime = current;
    if(model.status !== "Good"){
      model.timeLastClean = new Date();
      if(model.status === "Warning" && model.timeFirstIssueSet === false){
        model.timeFirstIssue = new Date();
        model.timeFirstIssueSet = true;
        view.setTime(model.timeFirstIssue, view.timeFirstIssue)
      }
      
    }
    var upHolder = current.getTime() - model.timeStarted.getTime();
    var up = new Date(upHolder);
    view.setTime(up, view.timeUp);
    var cleanHolder = current.getTime() - model.timeLastClean.getTime();
    var clean = new Date(cleanHolder);
    view.setTime(clean, view.timeClean);
  },
  saveAndReload: function() {
    //save model.timestamps w/localForage
    location.reload();
  },
  init: function() {
    //load localForage timestamps into model
    this.getPageElements();
    this.setState();
    this.checkConnection();
    this.updateState();
  },
};

controller.init();
