class API {

  constructor() {
    this.APIURL = "";

    this._callMethod = this._callMethod.bind(this);
    this._fetch = this._fetch.bind(this);
    this._getRunParams = this._getRunParams.bind(this);
    this._onDocu = this._onDocu.bind(this);
    this._onHelp = this._onHelp.bind(this);
    this._onRun = this._onRun.bind(this);
    this._onRunReturn = this._onRunReturn.bind(this);

    this._registerEventListeners();
  }

  _registerEventListeners() {
    document.querySelector("#popup_runcommand")
      .addEventListener('click', this._toggleManualRun);
    document.querySelector("#button_manualrun")
      .addEventListener('click', this._toggleManualRun);
    document.querySelector("#button_close_cmd")
      .addEventListener('click', this._toggleManualRun);
    document.querySelector("#button_logout")
      .addEventListener('click', _ => {
        this._logout(this);
    } );
    document.querySelector("#button_minions")
      .addEventListener('click', _ => {
        window.location.replace("/");
    } );
    document.querySelector("#button_keys")
      .addEventListener('click', _ => {
        window.location.replace("/keys");
    } );
    document.querySelector(".run-command input[type='submit']")
      .addEventListener('click', this._onRun);
    document.querySelector(".run-command #help")
      .addEventListener('click', this._onHelp);
    document.querySelector(".run-command #docu")
      .addEventListener('click', this._onDocu);
  }

  _onHelp() {
    var command = document.querySelector(".run-command #command").value;
    command = command.trim().replace(/ .*/, "");
    var cmd = command.split(".");

    // unfortunatelly the urls are inconsistent
    // with the package names
    switch(cmd[0]){
    case "":
      cmd = [];
      break;
    case "auth":
      break;
    case "beacon":
    case "beacons":
      cmd[0] = "beacons";
      break;
    case "cache":
      break;
    case "cloud":
    case "clouds":
      cmd[0] = "clouds";
      break;
    case "engine":
    case "engines":
      cmd[0] = "engines";
      break;
    case "execution":
    case "modules":
      cmd[0] = "modules";
      break;
    case "executor":
    case "executors":
      cmd[0] = "executor";
      break;
    case "fileserver":
    case "file_server":
      cmd[0] = "file_server";
      break;
    case "grain":
    case "grains":
      break;
    case "master":
    case "tops":
      cmd[0] = "tops";
      break;
    case "netapi":
      break;
    case "output":
      break;
    case "pillar":
    case "pillars":
      cmd[0] = "pillar";
      break;
    case "proxy":
      break;
    case "queue":
    case "queues":
      cmd[0] = "queues";
      break;
    case "renderer":
    case "renderers":
      cmd[0] = "renderers";
      break;
    case "returner":
    case "returners":
      cmd[0] = "returners";
      break;
    case "roster":
    case "rosters":
      cmd[0] = "roster";
      break;
    case "runner":
    case "runners":
      cmd[0] = "runners";
      break;
    case "sdb":
      break;
    case "serializer":
    case "serializers":
      cmd[0] = "serializers";
      break;
    case "state":
    case "states":
      cmd[0] = "states";
      break;
    case "thorium":
      break;
    case "wheel":
      break;
    default:
      cmd.unshift("modules");
    }

    var url = "https://docs.saltstack.com/en/latest/ref/";
    switch(cmd.length){
    case 0:
      break;
    case 1:
      url += cmd[0] + "/all/index.html";
      break;
    case 2:
      if(cmd[0] === "modules")
        url += cmd[0] + "/all/salt." + cmd[0] + "." + cmd[1] + ".html";
      else
        url += cmd[0] + "/salt." + cmd[0] + "." + cmd[1] + ".html";
      break;
    default: // 3 and more
      if(cmd[0] !== "modules")
        return;
      url += cmd[0] + "/all/salt." + cmd[0] + "." + cmd[1] + ".html#salt." + cmd[0] + "." + cmd[1] + "." + cmd[2];
    }

    window.open(url, '_blank');
  }

  _onDocu() {
    var button = document.querySelector(".run-command input[type='submit']");
    var output = document.querySelector(".run-command pre");
    if(button.disabled) return;

    var target = document.querySelector(".run-command #target").value;
    var command = document.querySelector(".run-command #command").value;
    if(target === "") target = "*";
    if(command === "") return;

    button.disabled = true;
    output.innerHTML = "Loading...";

    this.runFunction(target, "sys.doc " + command)
      .then(this._onRunReturn, this._onRunReturn);
  }

  _onRun() {
    var button = document.querySelector(".run-command input[type='submit']");
    var output = document.querySelector(".run-command pre");
    if(button.disabled) return;

    var target = document.querySelector(".run-command #target").value;
    var command = document.querySelector(".run-command #command").value;

    var func = this._getRunParams(target, command);
    if(func == null) return;

    button.disabled = true;
    output.innerHTML = "Loading...";

    this.runFunction(target, command)
      .then(this._onRunReturn, this._onRunReturn);
  }

  _onRunReturn(data) {
    var response = data.return[0];
    var hostnames = Object.keys(response);

    var outputContainer = document.querySelector(".run-command pre");
    outputContainer.innerHTML = "";

    for(var i = 0; i < hostnames.length; i++) {
      var hostname = hostnames[i];
      var output = response[hostname];
      if(typeof output !== 'object') {
        continue;
      }
      let isSysDocOutput = true;
      for(let key of Object.keys(output)) {
        if(typeof output[key] !== 'string') {
          isSysDocOutput = false;
          break;
        }
      }
      if(!isSysDocOutput)
        break;

      for(let key of Object.keys(output).sort()) {
        let out = output[key];
        out = out.replace(/&/g, "&amp;");
        out = out.replace(/</g, "&lt;");
        out = out.replace(/>/g, "&gt;");
        out = out.trimEnd();
        outputContainer.innerHTML +=
          `<div class='hostname'>${key}</div>:<br>` +
          '<pre style="height: initial; overflow-y: initial;">' + out + '</pre>';
      }

      // sabotage any further output
      hostnames = [];
      break;
    }

    for(var i = 0; i < hostnames.length; i++) {
      var hostname = hostnames[i];

      var output = response[hostname];

      // when you do a state.apply for example you get a json response.
      // let's format it nicely here
      if (typeof output === 'object') {
        output = JSON.stringify(output, null, 2);
      }

      outputContainer.innerHTML +=
        `<div class='hostname'>${hostname}</div>: ${output}<br>`;
    }

    var button = document.querySelector(".run-command input[type='submit']");
    button.disabled = false;
  }

  _toggleManualRun(evt) {
    var manualRun = document.querySelector("#popup_runcommand");
    var isShowing = manualRun.style.display !== "none" && manualRun.style.display !== "";

    //Don't close if they click inside the window
    if(isShowing && evt.target.className !== "popup" && evt.target.className !== "nearlyvisiblebutton") return;
    manualRun.style.display = isShowing ? "none" : "block";
    document.body.style["overflow-y"] = isShowing ? "scroll" : "hidden";

    // test whether the command may have caused an update to the list
    // the user may have altered the text after running the command, just ignore that
    var command = document.querySelector(".run-command #command").value;
    var output = document.querySelector(".run-command pre").innerHTML;
    if(isShowing && command.startsWith("wheel.key.") && output != "Waiting for command...") {
      location.reload();
    }
    evt.stopPropagation();
  }

  isAuthenticated() {
    return window.sessionStorage.getItem("token") !== null;
  }

  _logout(api) {
    var params = {
    };

    return new Promise(function(resolve, reject) {
      api._callMethod("POST", "/logout", params)
      .then(function(data) {
        window.sessionStorage.removeItem("token");
        window.location.replace("/");
        resolve();
      }, reject);
    });
  }

  login(username, password) {
    var api = this;

    var params = {
      username: username,
      password: password,
      eauth: "pam"
    };

    // overrule the eauth method when one is selected
    var type = document.querySelector("#login-form #eauth");
    if(type.value !== "default") {
      params.eauth = type.value;
    }
    localStorage.setItem('logintype', type.value);

    return new Promise(function(resolve, reject) {
      api._callMethod("POST", "/login", params)
      .then(function(data) {
        window.sessionStorage.setItem("token", data.return[0].token);
        resolve();
      }, reject);
    });
  }

  getMinions() {
    return this._callMethod("GET", "/minions", {});
  }

  getKeys() {
    return this._callMethod("GET", "/keys", {});
  }

  getJobs() {
    return this._callMethod("GET", "/jobs", {});
  }

  getJob(id) {
    return this._callMethod("GET", "/jobs/" + id, {});
  }

  _showError(errorMessage) {
    var errLabel = document.querySelector("#cmd_error");
    errLabel.innerText = errorMessage;
    if(errorMessage)
      errLabel.style.display = "block";
    else
      errLabel.style.display = "none";
  }

  _getRunParams(target, toRun) {

    this._showError("");

    if(target === "") {
      this._showError("'Target' field cannot be empty");
      return null;
    }

    if(toRun === "") {
      this._showError("'Command' field cannot be empty");
      return null;
    }

    // collection for unnamed parameters
    var args = [ ];

    // collection for named parameters
    var params = { };

    let ret = window.parseCommandLine(toRun, args, params);
    if(ret !== null) {
      // that is an error message being returned
      this._showError(ret);
      return null;
    }

    if(args.length === 0) {
      this._showError("First (unnamed) parameter is the function name, it is mandatory");
      return null;
    }

    var functionToRun = args.shift();

    if(typeof functionToRun != typeof "dummy") {
      this._showError("First (unnamed) parameter is the function name, it must be a string, not a " + typeof functionToRun);
      return null;
    }

    if(functionToRun.startsWith("wheel.")) {
      // wheel.key functions are treated slightly different
      // we re-use the 'target' field to fill the parameter 'match'
      // as used by the salt.wheel.key functions
      params.client = "wheel";
      // use only the part after "wheel." (6 chars)
      params.fun = functionToRun.substring(6);
      params.match = target;
    } else {
      params.client = "local";
      params.fun = functionToRun;
      params.tgt = target;
      if(args.length !== 0) params.arg = args;
    }

    return this._callMethod("POST", "/", params);
  }

  _callMethod(method, route, params) {
    var location = this.APIURL + route;
    var token = window.sessionStorage.getItem("token");

    var headers = {
      "Accept": "application/json",
      "X-Auth-Token": token !== null ? token : "",
      "Cache-Control": "no-cache"
    };

    return this._fetch(method, location, headers, params);
  }

  _fetch(method, url, headers, params) {
    var onFetchResponse = this._onFetchResponse;
    return new Promise(function(resolve, reject) {

      var options = {
        method: method,
        url: url,
        headers: headers
      };

      if(method === "POST") options.body = JSON.stringify(params);

      fetch(url, options).then(
        (response) => onFetchResponse(response, resolve, reject),
        reject
      );
    });
  }

  _onFetchResponse(response, resolve, reject) {
    if(response.status == 401 && document.location.pathname != "/login") {
      // sesion has expired
      // redirect to login screen
      window.sessionStorage.removeItem("token");
      document.location.replace("/");
      return;
    }
    if(response.status !== 200) {
      reject();
      return;
    }

    response.json()
    .then(resolve, reject);
  }

}
