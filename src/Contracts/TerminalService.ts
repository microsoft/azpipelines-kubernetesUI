import WebSocket = require('isomorphic-ws');
import { Terminal } from 'xterm';
import * as fit from 'xterm/lib/addons/fit/fit';
Terminal.applyAddon(fit);
export class TerminalHandler {
    private server:string;
    private token:string;
    private termRef: HTMLElement | null;
    private terminal:Terminal | null = null;
    private socket:WebSocket | null = null;
    constructor(config:any, termRef: HTMLDivElement | null) {
        const ssl = config.server.startsWith('https://');
        const target  = ssl ? config.server.substr(8) : config.server.substr(7);
        const proto = ssl ? 'wss' : 'ws';
        this.server = `${proto}://${target}`;
        const b64enctoken = btoa(config.token);
        this.token = b64enctoken.substring(0, b64enctoken.indexOf('=')); //stripping the = padding in base64 encoded token
        this.termRef = termRef;
    }

    public generateTTYForPod(podName: string, containerName:string):void {
        const protocols = ['base64url.bearer.authorization.k8s.io.','channel.k8s.io',];
        //todo: put in a fallback if bin/bash is not found. Should be trying for sh, zsh, csh and powershell for windows containers
        const path = '/api/v1/namespaces/default/pods/'+podName+'/exec?stdin=1&stdout=1&stderr=1&tty=1&command='+encodeURIComponent("/bin/bash")+'&container='+containerName;
        const uri = `${this.server}${path}`;
        //todo: service account already provides token in base64encoded format. Account for the token from service account
        protocols[0] = protocols[0]+this.token;
        const sock = new WebSocket(uri, protocols);
        sock.onopen = () => {
            this.socket = sock;
            if(this.termRef) {
                this.terminal = new Terminal({
                    cols:180,
                    rows:30,
                    fontSize:14,
                    cursorBlink:true,
                });
                this.terminal.on('data', (data)=>{
                    this.transferData(data);
                });
                this.terminal.open(this.termRef);
                (this.terminal as any).fit();
                this.terminal.focus();
            }
        };

        sock.onerror = (err) =>{
            console.log(err);
            this.socket = null;
            this.terminal && this.terminal.dispose();
            this.terminal = null;
        }

        sock.onclose = (event) => {
            this.socket = null;
            this.terminal && this.terminal.dispose();
            this.terminal = null;
        }

        sock.onmessage = (event) =>{
            const reader = new FileReader();
            reader.onload = () =>{
                if(reader.result) {
                    if(reader.result instanceof ArrayBuffer) {
                        const buff = Buffer.from(reader.result);
                        //refitting the terminal to actual dimensions
                        this.terminal && this.terminal.write(buff.slice(1).toString('utf-8'));
                    }else {
                        //this condition should not be seen ever
                        console.log(typeof reader.result);
                    }
                }
            };
            reader.readAsArrayBuffer(event.data);
        }
    }

    //todo: characters are streamed as received from terminal. Evaluate buffer
    private transferData(data:string) {
        const buff = Buffer.alloc(data.length + 1);
        buff.writeInt8(0, 0); //0 is for stdin. First byte denotes the channel on which data is written/read
        buff.write(data,1);
        this.socket && this.socket.send(buff);
    }

}