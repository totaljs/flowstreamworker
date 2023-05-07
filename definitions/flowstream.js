const PING = { TYPE: 'ping' };

PATH.mkdir(PATH.private());

var FS = {};

FS.version = 1;
FS.db = {};
FS.instances = {};

FS.init = function(flow, variables, next) {

	flow.variables2 = variables;
	flow.directory = PATH.root(F.Path.dirname(CONF.flowstream_file));
	flow.sandbox = CONF.flowstream_sandbox == true;
	flow.env = CONF.env || 'dev';

	if (!flow.memory)
		flow.memory = CONF.flowstream_memory || 0;

	MODULE('flowstream').init(flow, CONF.flowstream_worker, function(err, instance) {

		if (CONF.flowstream_worker && flow.proxypath) {

			// Removes old
			PROXY(flow.proxypath, null);

			// Registers new
			PROXY(flow.proxypath, flow.unixsocket, false);
		}

		instance.httprouting();
		instance.ondone = () => next();
		instance.onerror = function(err, source, id, component, stack) {
			var empty = '---';
			var output = '';
			output += '|------------- FlowError: ' + new Date().format('yyyy-MM-dd HH:mm:ss') + '\n';
			output += '| ' + err.toString() + '\n';
			output += '| Name: ' + flow.name + '\n';
			output += '| Source: ' + (source || empty) + '\n';
			output += '| Instance ID: ' + (id || empty) + '\n';
			output += '| Component ID: ' + (component || empty) + '\n';
			output += '|---- Stack: ----\n';
			output += stack;
			console.error(output);
			var meta = {};
			meta.error = err;
			meta.source = source;
			meta.id = id;
			meta.component = component;
			EMIT('flowstream_error', meta);
		};

		FS.instances[flow.id] = instance;
	});
};

FUNC.restart = function() {

	var is = false;

	for (var key in FS.instances) {
		var instance = FS.instances[key];

		if (instance.proxypath)
			PROXY(instance.proxypath, null);

		instance.destroy();
		is = true;
	}

	setTimeout(load, is ? 1000 : 100);

};

function load() {
	PATH.fs.readFile(PATH.root(CONF.flowstream_file), 'utf8', function(err, data) {

		if (!data)
			return;

		var db = data.parseJSON(true);

		if (db.id) {
			var tmp = db;
			db = {};
			db[tmp.id] = tmp;
		}

		var variables = db.variables || {};

		Object.keys(db).wait(function(key, next) {
			if (key === 'variables')
				next();
			else
				FS.init(db[key], variables, next);
		});

	});
}

ON('ready', function() {

	load();

	// A simple prevetion for the Flow zombie processes
	CONF.flowstream_worker && setInterval(function() {
		// ping all services
		for (var key in FS.instances) {
			var fs = FS.instances[key];
			if (fs.isworkerthread && fs.flow && fs.flow.postMessage2)
				fs.flow.postMessage2(PING);
		}
	}, 5000);

});

MAIN.flowstream = FS;