import cluster, { Worker } from 'node:cluster';
import http from 'node:http';
import { configSchemaType, rootConfigSchema } from './config-schema';
import { workerMessageReply, workerMessageSchema, WorkerMessageType, WorkerReplyType } from './server-schema';

interface ServerConfig {
    port: number,
    workerCount: number,
    config: configSchemaType
}

export async function createServer(config: ServerConfig) {
    const WORKER_POOL: Worker[] = [];

    if(cluster.isPrimary){
        console.log("Master Node is spinned up");
        for(let i=0; i<config.workerCount; i++){
            const w = cluster.fork({config: JSON.stringify(config.config)});
            WORKER_POOL.push(w);
            console.log(`Master Node: Worker node ${i+1} is running`);
        }
        const server = http.createServer((req, res)=>{
            const index = Math.floor(Math.random() * WORKER_POOL.length);
            const worker = WORKER_POOL.at(index);

            if(!worker) {
                res.writeHead(500);
                res.end('worker not found');
                return;
            }

            const payload: WorkerMessageType ={
                requestType: 'HTTP',
                headers: req.headers,
                body: null,
                url: `${req.url}`
            }

            const handleRequest = async (workerReply: string) => {
                const reply = await workerMessageReply.parseAsync(JSON.parse(workerReply));
               if(reply.error_code){
                res.writeHead(parseInt(reply.error_code));
                res.end(reply.error)
               } else {
                res.writeHead(200);
                res.end(reply.data);
               }
               worker?.off('message', handleRequest);
               return;
            }
            worker.send(JSON.stringify(payload));
            worker.on('message', handleRequest);
        })
        server.listen(config.port);
    } else {
        console.log("Worker Node");
        const config = await rootConfigSchema.parseAsync(
            JSON.parse(`${process.env.config}`)
        );
        process.on('message', async (message: string)=>{
            const messageValidated = await workerMessageSchema.parseAsync(
                JSON.parse(message)
            );
            
            const requestUrl = messageValidated.url;
            const rule = config.server.rules.find(e => {
                const regex =new RegExp(`^${e.path}.*$`); //converting path to regex
                return regex.test(requestUrl);
            });
            if(!rule){
                const reply: WorkerReplyType = {
                    error_code: '404',
                    error: 'Rule not found'
                }
                if(process.send) return process.send(JSON.stringify(reply));
            }
            const upstreamID = rule?.upstreams[0];      //initially hardcoded ---- taking first upstream only rn
            const upstream = config.server.upstreams.find(e => e.id === upstreamID);
            if(!upstream){
                const reply: WorkerReplyType = {
                    error_code: '500',
                    error: 'Upstream not found'
                }
                if(process.send) return process.send(JSON.stringify(reply));
            }
            // reverse-proxy requesting on url
            const request = http.request(
                {
                host: upstream?.url, //domain name only
                path: requestUrl,   //Correct path
                method: 'GET'
                }, 
                (proxyRes)=>{
                let body = '';
                
                proxyRes.on('data', (chunk)=>{
                    body+= chunk;
                });
                proxyRes.on('end', ()=>{
                    const reply: WorkerReplyType = {
                        data: body
                    }
                    if(process.send) return process.send(JSON.stringify(reply)); 
                })
            })
            request.end();
        });
    }
}