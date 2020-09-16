import tkinter as tk
from math import sin, cos, atan, ceil, floor


w, h = 1600, 900
cx, cy, cz = w/2, h/2, 100
previous_mouse_pos = 0, 0

mouse_wheel_sensitivity = 5

point_radius = 5
line_width = 2

round_values = True

current_vector = None
vectors = []


class Vector(object):

    def __init__(self, canv, x0, y0, x1, y1, color="black"):

        self.canvas = canv
        self.color = color

        self.x0, self.y0 = tk_to_graph(x0, y0)
        self.x1, self.y1 = tk_to_graph(x1, y1)

        tx0, ty0 = graph_to_tk(self.x0, self.y0)
        tx1, ty1 = graph_to_tk(self.x1, self.y1)

        self.line = self.canvas.create_line(tx0, ty0, tx1, ty1,
                                            width=line_width, fill=color, arrow=tk.LAST, arrowshape=(12, 15, 6))

        self.point = self.canvas.create_oval(tx0 - (cz*point_radius)/100, ty0 - (cz*point_radius)/100,
                                             tx0 + (cz*point_radius)/100, ty0 + (cz*point_radius)/100,
                                             fill=color)

        vectors.append(self)

    def draw(self):

        tx0, ty0 = graph_to_tk(self.x0, self.y0)
        tx1, ty1 = graph_to_tk(self.x1, self.y1)

        self.canvas.coords(self.line, tx0, ty0, tx1, ty1)

        self.canvas.coords(self.point, tx0 - (cz*point_radius)/100, ty0 - (cz*point_radius)/100,
                           tx0 + (cz*point_radius)/100, ty0 + (cz*point_radius)/100)


def create_vector(event):
    global current_vector

    v = Vector(canvas, event.x, event.y, event.x, event.y)

    if round_values:
        v.x0, v.y0, v.x1, v.y1 = round(v.x0), round(v.y0), round(v.x1), round(v.y1)

    v.draw()

    current_vector = v


def update_vector(event):
    global current_vector

    if current_vector is not None:
        current_vector.x1, current_vector.y1 = tk_to_graph(event.x, event.y)

        if round_values:
            current_vector.x0, current_vector.y0, current_vector.x1, current_vector.y1 = \
                round(current_vector.x0), round(current_vector.y0), round(current_vector.x1), round(current_vector.y1)

        current_vector.draw()


def start_drag_grid(event):
    global previous_mouse_pos

    previous_mouse_pos = event.x, event.y


def drag_grid(event):
    global cx, cy, previous_mouse_pos

    cx, cy = cx + event.x - previous_mouse_pos[0], cy + event.y - previous_mouse_pos[1]
    previous_mouse_pos = event.x, event.y
    draw_grid()


def draw_grid():

    canvas.coords(x_line, 0, cy, w, cy)
    canvas.coords(y_line, cx, 0, cx, h)

    for i in range(floor(-h/(2*cz)), ceil(h/(2*cz)) + 1):
        canvas.coords(small_x_lines[i], 0, ((cy - h/2) % cz) + h/2 + cz * i, w, ((cy - h/2) % cz) + h/2 + cz * i)

    for i in range(floor(-w/(2*cz)), ceil(w/(2*cz)) + 1):
        canvas.coords(small_y_lines[i], ((cx - w/2) % cz) + w/2 + cz * i, 0, ((cx - w/2) % cz) + w/2 + cz * i, h)

    for p in vectors:
        p.draw()


def zoom(event):
    global small_x_lines, small_y_lines, cz

    for line in small_x_lines:
        canvas.delete(line)

    for line in small_y_lines:
        canvas.delete(line)

    cz += event.delta * mouse_wheel_sensitivity/120

    if cz <= 2:
        cz = 2
    elif cz >= w/2 or cz >= h/2:
        cz = min(w, h)

    print(cz)

    small_x_lines = [canvas.create_line(0, cy + cz * i, w, cy + cz * i) for i in
                     range(floor(-h / (2 * cz)), ceil(h / (2 * cz)) + 1)]
    small_y_lines = [canvas.create_line(cx + cz * i, 0, cx + cz * i, h) for i in
                     range(floor(-w / (2 * cz)), ceil(w / (2 * cz)) + 1)]

    draw_grid()


def tk_to_graph(tx, ty):
    global cx, cy
    gx = (tx - cx)/cz
    gy = (-ty + cy)/cz
    return gx, gy


def graph_to_tk(gx, gy):
    global cx, cy
    tx = cz*gx + cx
    ty = -cz*gy + cy
    return tx, ty


def cartesian_to_polar(x, y):
    return x**2 + y**2, atan(y/x)


def polar_to_cartesian(r, theta):
    return r*cos(theta), r*sin(theta)


root = tk.Tk()
root.title("2D Physics Simulator")

canvas = tk.Canvas(root, width=w, height=h)
canvas.pack()

canvas.bind('<Button-1>', create_vector)
canvas.bind('<B1-Motion>', update_vector)

canvas.bind('<Button-3>', start_drag_grid)
canvas.bind('<B3-Motion>', drag_grid)

canvas.bind('<Button-4>', zoom)
canvas.bind('<Button-5>', zoom)
canvas.bind('<MouseWheel>', zoom)

x_line = canvas.create_line(0, cy, w, cy, width=3)
y_line = canvas.create_line(cx, 0, cx, h, width=3)

small_x_lines = [canvas.create_line(0, cy + cz * i, w, cy + cz * i)
                 for i in range(floor(-h/(2*cz)), ceil(h/(2*cz)) + 1)]
small_y_lines = [canvas.create_line(cx + cz * i, 0, cx + cz * i, h)
                 for i in range(floor(-w/(2*cz)), ceil(w/(2*cz)) + 1)]

root.mainloop()
