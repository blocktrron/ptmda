import json
import requests

from ptmda.exceptions import RequestException
from ptmda.parser import parse_positions, parse_map_objects, parse_lineplans


class RemoteConnector:
    def __init__(self, base_url, identifier):
        self.base_url = base_url
        self.identifier = identifier

        self.vehicles = []
        self.vehicles_age = None

        self.map_objects = []

        self.ways = []
        self.relations = []

    def update_positions(self):
        r = requests.get('{base_url}/vehiclelivedata?bundleIdentifier={identifier}'.format(base_url=self.base_url,
                                                                                           identifier=self.identifier))
        if r.status_code != requests.codes.ok:
            raise RequestException()

        self.vehicles, self.vehicles_age = parse_positions(json.loads(r.text))

        return True

    def update_mapobjects(self, lat, lon, distance):
        r = requests.get(
            '{base_url}/mapobjects?latitude={lat}&longitude={lon}&distance={distance}&bundleIdentifier={identifier}'.format(
                base_url=self.base_url, identifier=self.identifier, lat=str(lat), lon=str(lon), distance=str(distance)))

        if r.status_code != requests.codes.ok:
            raise RequestException()

        self.map_objects = parse_map_objects(json.loads(r.text))

        return True

    def update_lineplans(self):
        r = requests.get(
            '{base_url}/osmlineplans?bundleIdentifier={identifier}'.format(
                base_url=self.base_url, identifier=self.identifier))

        if r.status_code != requests.codes.ok:
            raise RequestException()

        self.ways, self.relations = parse_lineplans(json.loads(r.text))

        return True
