import geojson
from datetime import datetime, time
from geojson import Feature, LineString, FeatureCollection

from ptmda.exceptions import NoDataException
from ptmda.objects import Vehicle, MapObject, Way, Node, Relation


def parse_positions(data):
    if len(data.get('vehicles', [])) < 1:
        raise NoDataException()

    vehicles = []
    for v in data['vehicles']:
        vehicles.append(
            Vehicle(v["lineId"], v['category'], v['lastStop'], v['status'], v['latitude'], v['longitude'],
                    v['bearing'], v['type'], v['line'], v['vehicleId'], v['encodedPath']))
    if 'timestamp' in data:
        vehicles_age = datetime.strptime(data["timestamp"].split('+')[0], "%Y-%m-%dT%H:%M:%S").strftime(
            '%s')
    else:
        vehicles_age = time()

    return vehicles, vehicles_age


def parse_map_objects(data):
    return [MapObject(x['type'], x['id'], x['name'], x['latitude'], x['longitude']) for x in data]


def parse_lineplans(data):
    ways = {data['ways'][x]['id']: Way(data['ways'][x]['id'],
                                       [Node(y['lat'], y['lon']) for y in data['ways'][x]['nodes']],
                                       data['ways'][x]['encodedPath'])
            for x in data.get('ways', [])}

    relations = [Relation(x['id'], x['name'], x['ref'], x['members']) for x in
                 data.get('relations', [])]

    return ways, relations


def export_ways_to_geojson(ways):
    f = []
    for w in ways:
        path = []
        for n in ways[w].nodes:
            path.append((n.lon, n.lat))
        f.append(Feature(geometry=LineString(path), id=ways[w].id,
                         properties={'id': ways[w].id, 'encodedPath': ways[w].encoded_path}))
    fc = FeatureCollection(f)
    return geojson.dumps(fc)
