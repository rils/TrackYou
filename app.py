import time

from flask import Flask, request, render_template
from flask_socketio import SocketIO

from trackyou import start_pos, get_anchors_data, POS_DATA_Q, pos_data_lock

app = Flask(__name__)
socketio = SocketIO(app)
namespace = '/track'


@socketio.on('connect', namespace='/track')
def connect():
    """
    callback on a  connection.
    This get invoked on a client connection.In reality : when browser open webpage.
    :return: none
    """
    print('Client connected, sid- {}'.format(request.sid))
    socketio.start_background_task(target=background_thread)


@socketio.on('client_msg', namespace='/track')
def client_msg(msg):
    """
    Any msg from client browser reaches here. Resolves and respond back
    :param msg: not a callable. decorator get called back on each msg
    :return: none
    """
    resolve_client_msg(msg)


# @copy_current_request_context
def background_thread():
    while True:
        socketio.sleep(0.02)  # push interval
        with pos_data_lock:
            if POS_DATA_Q:
                msg_dict = POS_DATA_Q.pop(0)  # every prints in this project are queued in MSG_Q.
                # print('pos data emit',msg_dict)
                try:
                    socketio.emit('server_msg', msg_dict, namespace=namespace)
                except TypeError:
                    socketio.emit('server_msg', 'unhandled exception', namespace=namespace)


@app.route('/')
def hello_world():
    return 'Hello World!'


@app.route('/trackyou')
def tracku():
    return render_template('pos.html')


# ----------------------------------------------------------------------------------------------------------------------
def resolve_client_msg(msg):
    print(msg)
    if msg['cause'] == 'ts':
        POS_DATA_Q.append({'topic': 'connection', 'cause': 'ts', 'ts': time.time()})
    elif msg['cause'] == 'start_pos':
        start_pos(dummy=msg['msg']['dummy_mode'])
    elif msg['cause'] == 'connection':
        POS_DATA_Q.append({'cause': 'anchor_data', 'anchor_data': get_anchors_data()})


if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0')
