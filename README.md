# FlowStream: Worker

- [Website](https://www.totaljs.com/flow/)
- [__Documentation__](https://docs.totaljs.com/total4/5aed1001bj51c/)
- [Join __Total.js Telegram__](https://t.me/totalplatform)
- [Support](https://www.totaljs.com/support/)

This app provides exported FlowStream from the Total.js Flow without UI and without nested worker, and the app can be provided in the cluster.

__How to run it?__

```bash
$ cd flowstreamworker
$ npm install
$ npm start
```

- open web browser `http:/127.0.0.1:8000`

## FlowStream Meta File

It's stored in `flowstream` directory and the content will be evaluated automatically. If you create your own FlowStream file, just design it in the Flow app and export your design to the JSON format, and then store it into the `/flowstream/database.json` file.