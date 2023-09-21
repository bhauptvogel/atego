from PIL import Image
import os
import webcolors
from os import listdir

NEW_COLOR = (232, 216, 42)

def closest_colour(requested_colour):
    min_colours = {}
    for key, name in webcolors.CSS3_HEX_TO_NAMES.items():
        r_c, g_c, b_c = webcolors.hex_to_rgb(key)
        rd = (r_c - requested_colour[0]) ** 2
        gd = (g_c - requested_colour[1]) ** 2
        bd = (b_c - requested_colour[2]) ** 2
        min_colours[(rd + gd + bd)] = name
    return min_colours[min(min_colours.keys())]


folder_dir = "/home/benmainbird/Projects/Stratego/game/assets/"
for images in os.listdir(folder_dir):
    if (images.endswith(".png") and "-" not in images):
        picture = Image.open(folder_dir+images)

        width, height = picture.size
        for x in range(0, width-1):
            for y in range(0, height-1):
                color = list(picture.getpixel((x,y)))
                color[0] = NEW_COLOR[0]
                color[1] = NEW_COLOR[1]
                color[2] = NEW_COLOR[2]
                picture.putpixel((x,y), tuple(color))

        picture.save(f"{folder_dir}{images.replace('.png','')}-{closest_colour(NEW_COLOR)}.png")