from enum import IntEnum, Enum


class Vehicle:
    class Category(IntEnum):
        TRAM = 1
        BUS = 5

    def __init__(self, line_id=None, category=None, last_stop=None, status=None, latitude=None, longitude=None,
                 bearing=None, type=None, line=None, vehicle_id=None, encoded_path=None):
        self.line_id = line_id
        self.category = category
        self.last_stop = last_stop
        self.status = status
        self.latitude = latitude
        self.longitude = longitude
        self.bearing = bearing
        self.type = type
        self.line = line
        self.vehicle_id = vehicle_id
        self.encoded_path = encoded_path


class Relation:
    def __init__(self, id, name, reference, members):
        self.id = id
        self.name = name
        self.referece = reference
        self.members = members


class Node:
    def __init__(self, lat, lon):
        self.lat = lat
        self.lon = lon


class Way:
    def __init__(self, id, nodes, encoded_path):
        self.id = id
        self.nodes = nodes
        self.encoded_path = encoded_path


class MapObject:
    class Type(Enum):
        STOP = 'stop'

    def __init__(self, type, id, name, lat, lon):
        self.type = type
        self.id = id
        self.name = name
        self.lat = lat
        self.lon = lon
