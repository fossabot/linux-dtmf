/**
 * DTMF decoder based on sox and multimon
 *
 *
 * @author Andrey Nedobylskiy (admin@twister-vl.ru)
 */

const os = require('os');
const util = require('util');
const {exec, spawn} = require('child_process');
const execP = util.promisify(exec);
const {EventEmitter} = require('events');

const TYPES = ['raw', 'mp3', 'wav', 'ogg'];

/**
 * Sox instancer
 */
class Sox extends EventEmitter {

    constructor(pipeName) {
        super();
        if(!pipeName) {
            throw new Error('Pipe name required');
        }
        this.pipeName = pipeName;
        this._status = 0;
    }

    /**
     * Validate data type
     * @param type
     * @return {*}
     * @private
     */
    _validateType(type) {
        type = type.toLowerCase();
        if(TYPES.indexOf(type) === -1) {
            throw new Error('Invalid input type');
        }

        return type;
    }

    _assertBusy(){
        if(this._status !== 0){
            throw new Error('Sox instance is busy');
        }
    }

    /**
     * Decode URI
     * @param uri
     * @param type
     */
    decodeUri(uri, type) {
        this._assertBusy();
        const that = this;
        type = this._validateType(type);
        this._run(uri, type);

    }


    /**
     * Decode buffer
     * @param {ArrayBuffer} buffer
     * @param {String} type
     */
    decodeBuffer(buffer, type) {
        this._assertBusy();
        const that = this;
        type = this._validateType(type);
        this._run('-', type);
        this._sox.stdin.write(buffer);
    }

    /**
     * Start decoding stream
     * @param type
     */
    startDecodeStream(type){
        this._assertBusy();
        this._run('-', type);
    }

    /**
     * Write buffer to decoder
     * @param buffer
     */
    writeTypedBuffer(buffer){
        this._sox.stdin.write(buffer);
    }


    /**
     * Run sox with params
     * @param {string} uri
     * @param {string} type
     * @private
     */
    _run(uri, type) {
        const that = this;
        this._sox = exec('sox -t ' + type + ' "' + uri + '"  -t raw -e signed-integer -r 22050 - >' + this.pipeName);
        this._status = 1;
        this._sox.on('close', function (code) {
            that._status = 0;
            if(code === 0) {
                that.emit('end');
            } else {
                that.emit('close', code);
            }
        });
    }


}


module.exports = Sox;