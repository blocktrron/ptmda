var config = {
    "tiles": [
        {
            "name": "OpenStreetMap",
            "url": "https://{s}.tile.osm.org/{z}/{x}/{y}.png",
            "minZoom": 3,
            "maxZoom": 18,
            "attribution": "&copy; <a href=\"http://osm.org/copyright\">OpenStreetMap</a> contributors"
        },
        {
            "name": "ÖPNV Karte",
            "url": "https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png",
            "minZoom": 3,
            "maxZoom": 18,
            "attribution": "&copy; <a href=\"http://memomaps.de/\">ÖPNV Karte</a> contributors, <a href=\"http://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>"
        }
    ],
    "default_tiles": "OpenStreetMap",
    "default_zoom": 10,
    "default_position": [49.872906, 8.651617]
};