PATH.mkdir(PATH.private());

FUNC.init = function(env, flow, variables) {

	flow.variables2 = variables || {};
	flow.directory = CONF.directory || PATH.root('/flowstream/');
	flow.sandbox = false;
	flow.env = env || 'dev';

	MODULE('flowstream').init(flow, false, function(err, instance) {
		instance.httprouting();
		instance.onerror = function(err, source, id, component) {
			var empty = '---';
			var output = '';
			output += '|------------- FlowError: ' + new Date().format('yyyy-MM-dd HH:mm:ss') + '\n';
			output += '| ' + err.toString() + '\n';
			output += '| Name: ' + flow.name + '\n';
			output += '| Source: ' + (source || empty) + '\n';
			output += '| Instance ID: ' + (id || empty) + '\n';
			output += '| Component ID: ' + (component || empty);
			console.error(output);
			var meta = {};
			meta.error = err;
			meta.source = source;
			meta.id = id;
			meta.component = component;
			EMIT('flowstream_error', meta);
		};

		instance.onsave = NOOP;
		instance.ondone = NOOP;
	});
};

ON('ready', function() {
	var path = CONF.flowstream_file[0] === '~' ? CONF.flowstream_file.substring(1) : PATH.root(CONF.flowstream_file);
	PATH.fs.readFile(path, function(err, data) {

		if (err) {
			console.log(err);
			return;
		}

		var flow = data.toString('utf8').parseJSON(true);
		if (flow && !flow.components) {
			for (var key in flow) {
				flow = flow[key];
				break;
			}
		}

		flow && FUNC.init(CONF.flowstream_mode, flow);
	});
});