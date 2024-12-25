"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const node_cluster_1 = __importDefault(require("node:cluster"));
const node_http_1 = __importDefault(require("node:http"));
const config_schema_1 = require("./config-schema");
const server_schema_1 = require("./server-schema");
function createServer(config) {
    return __awaiter(this, void 0, void 0, function* () {
        const WORKER_POOL = [];
        if (node_cluster_1.default.isPrimary) {
            console.log("Master Node is spinned up");
            for (let i = 0; i < config.workerCount; i++) {
                const w = node_cluster_1.default.fork({ config: JSON.stringify(config.config) });
                WORKER_POOL.push(w);
                console.log(`Master Node: Worker node ${i + 1} is running`);
            }
            const server = node_http_1.default.createServer((req, res) => {
                const index = Math.floor(Math.random() * WORKER_POOL.length);
                const worker = WORKER_POOL.at(index);
                if (!worker) {
                    res.writeHead(500);
                    res.end('worker not found');
                    return;
                }
                const payload = {
                    requestType: 'HTTP',
                    headers: req.headers,
                    body: null,
                    url: `${req.url}`
                };
                const handleRequest = (workerReply) => __awaiter(this, void 0, void 0, function* () {
                    const reply = yield server_schema_1.workerMessageReply.parseAsync(JSON.parse(workerReply));
                    if (reply.error_code) {
                        res.writeHead(parseInt(reply.error_code));
                        res.end(reply.error);
                    }
                    else {
                        res.writeHead(200);
                        res.end(reply.data);
                    }
                    worker === null || worker === void 0 ? void 0 : worker.off('message', handleRequest);
                    return;
                });
                worker.send(JSON.stringify(payload));
                worker.on('message', handleRequest);
            });
            server.listen(config.port);
        }
        else {
            console.log("Worker Node");
            const config = yield config_schema_1.rootConfigSchema.parseAsync(JSON.parse(`${process.env.config}`));
            process.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
                const messageValidated = yield server_schema_1.workerMessageSchema.parseAsync(JSON.parse(message));
                const requestUrl = messageValidated.url;
                const rule = config.server.rules.find(e => {
                    const regex = new RegExp(`^${e.path}.*$`); //converting path to regex
                    return regex.test(requestUrl);
                });
                if (!rule) {
                    const reply = {
                        error_code: '404',
                        error: 'Rule not found'
                    };
                    if (process.send)
                        return process.send(JSON.stringify(reply));
                }
                const upstreamID = rule === null || rule === void 0 ? void 0 : rule.upstreams[0]; //initially hardcoded ---- taking first upstream only rn
                const upstream = config.server.upstreams.find(e => e.id === upstreamID);
                if (!upstream) {
                    const reply = {
                        error_code: '500',
                        error: 'Upstream not found'
                    };
                    if (process.send)
                        return process.send(JSON.stringify(reply));
                }
                // reverse-proxy requesting on url
                const request = node_http_1.default.request({
                    host: upstream === null || upstream === void 0 ? void 0 : upstream.url, //domain name only
                    path: requestUrl, //Correct path
                    method: 'GET'
                }, (proxyRes) => {
                    let body = '';
                    proxyRes.on('data', (chunk) => {
                        body += chunk;
                    });
                    proxyRes.on('end', () => {
                        const reply = {
                            data: body
                        };
                        if (process.send)
                            return process.send(JSON.stringify(reply));
                    });
                });
                request.end();
            }));
        }
    });
}
