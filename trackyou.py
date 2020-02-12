import _thread
import threading
import time

pos_data_lock = threading.Lock()

POS_DATA_Q = []
POS_INTERVAL = 0.1
POS_RUNNING = False

anchors = dict(
    A1=[0, 30, 0],
    A2=[30, 30, 0],
    A3=[0, 30, 30],
    A4=[30, 0, 0],
    A5=[0, 30, 30],
    A6=[30, 30, 30],
)

dummy_tag_data = [
    {'x': 1, 'y': 1, 'z': 1, 'name': 'R'},
    {'x': 2, 'y': 2, 'z': 2, 'name': 'I'},
    {'x': 3, 'y': 3, 'z': 3, 'name': 'L'},
    {'x': 4, 'y': 4, 'z': 4, 'name': 'S'},
]


def add_anchor(name, pos):
    anchors.update({name: pos})


def get_anchors_data():
    anc_data = []
    for name, pos in anchors.items():
        anc_data.append({'z': pos[0], 'x': pos[1], 'y': pos[2], 'name': name, 'item': 'anchor'})
    print(anc_data)
    return anc_data


# def get_tag_data():
#     with pos_data_lock:
#         POS_DATA_Q.clear()
#     retrieve_pos_data()


def move_dummy_data():
    step = 0.5
    dummy_tag_data[0]['x'] += step
    dummy_tag_data[0]['y'] += step
    if dummy_tag_data[0]['x'] >= 30:
        dummy_tag_data[0]['x'] = 0
        dummy_tag_data[0]['y'] = 0

    dummy_tag_data[1]['y'] += step
    dummy_tag_data[1]['z'] += step
    if dummy_tag_data[1]['y'] >= 30:
        dummy_tag_data[1]['y'] = step
        dummy_tag_data[1]['z'] = step

    dummy_tag_data[2]['x'] += step
    dummy_tag_data[2]['z'] += step
    if dummy_tag_data[2]['x'] >= 30:
        dummy_tag_data[2]['x'] = 0
        dummy_tag_data[2]['z'] = 0


def get_dummy_tag_data():
    while POS_RUNNING:
        move_dummy_data()
        POS_DATA_Q.append({'cause': 'pos_data', 'pos_data': dummy_tag_data})
        # print(dummy_tag_data)
        time.sleep(POS_INTERVAL)


def start_pos(dummy=True, start=True):
    global POS_RUNNING
    if not POS_RUNNING:
        POS_RUNNING = True
        if dummy:
            _thread.start_new_thread(get_dummy_tag_data, ())
    else:
        POS_RUNNING = False


if __name__ == '__main__':
    get_dummy_tag_data()
