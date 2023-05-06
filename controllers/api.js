exports.install = function() {
	ROUTE('GET      /private/',        privatefiles);
	ROUTE('GET      /notify/{id}/',    notify);
	ROUTE('POST     /notify/{id}/',    notify, 1024); // 1 MB
};

function privatefiles() {

	var $ = this;

	var filename = $.query.filename;
	if (filename) {

		filename = filename.replace(/\.{2,}|~|\+|\/|\\/g, '');
		$.nocache();

		var path = PATH.private(filename);

		F.Fs.lstat(path, function(err, stat) {

			if (err) {
				$.throw404();
				return;
			}

			var offset = $.query.offset;
			var opt = {};

			if (offset) {
				offset = U.parseInt(offset);
				opt.start = offset;
			}

			var stream = F.Fs.createReadStream(path, opt);

			$.nocache();
			$.stream(stream, U.getContentType(U.getExtension(path)), filename, { 'x-size': stat.size, 'last-modified': stat.mtime.toUTCString() });

		});

		return;
	}

	var q = $.query.q;

	U.ls2(PATH.private(), function(files) {
		var arr = [];
		for (var file of files)
			arr.push({ name: file.filename.substring(file.filename.lastIndexOf('/') + 1), size: file.stats.size, modified: file.stats.mtime });
		$.json(arr);
	}, q);
}

function notify(id) {

	var $ = this;

	var arr = id.split('-');
	var instance = MAIN.flowstream.instances[arr[0]];
	if (instance) {
		var obj = {};
		obj.id = arr[1];
		obj.method = $.req.method;
		obj.headers = $.headers;
		obj.query = $.query;
		obj.body = $.body;
		obj.url = $.url;
		obj.ip = $.ip;
		obj.params = arr.length > 2 ? arr.slice(2) : EMPTYOBJECT;
		arr[1] && instance.notify(arr[1], obj);
		instance.flow && instance.flow.$socket && instance.flow.$socket.send({ TYPE: 'flow/notify', data: obj });
	}

	if ($.query.REDIRECT) {
		$.redirect($.query.REDIRECT);
		return;
	}

	var accept = $.headers.accept;
	if (accept && accept.indexOf('html') !== -1)
		$.html('<html><body style="font-family:Arial;font-size:11px;color:#777;background-color:#FFF">Close the window<script>window.close();</script></body></html>');
	else
		$.success();
}