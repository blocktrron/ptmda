import json
from flask import Flask

from .connector import RemoteConnector
from .parser import export_ways_to_geojson


def create_app():
    app = Flask(__name__, static_url_path='/static')
    connector = RemoteConnector('https://routing.geomobile.de/v4', 'de.ivanto.heagmobilo')
    connector.update_lineplans()
    connector.update_mapobjects(49.872781, 8.651077, 7500)
    update_interval = 30

    @app.route('/')
    def show_page():
        return app.send_static_file("app.html")

    @app.route("/vehicledata")
    def load_vehicledata():
        connector.update_positions()

        h = {'last_updated': connector.vehicles_age, 'vehicles': []}
        for v in connector.vehicles:
            h['vehicles'].append({'category': v.category, 'lineId': v.line_id, 'latitude': round(v.latitude, 6),
                                  'longitude': round(v.longitude, 6), 'vehicleId': v.vehicle_id, 'bearing': v.bearing,
                                  'lastStop': v.last_stop, 'line': v.line, })

        return json.dumps(h, ensure_ascii=False), 200, {
            'Content-Type': 'application/json; charset=utf-8'}

    @app.route("/mapobjects")
    def load_mapobjects():
        h = [{'type': o.type, 'id': o.id, 'name': o.name, 'lat': o.lat, 'lon': o.lon} for o in connector.map_objects]

        return json.dumps(h, ensure_ascii=False), 200, {
            'Content-Type': 'application/json; charset=utf-8'}

    @app.route("/lineplans")
    def load_lineplans():
        r = {'relations': [{'id': x.id, 'members': x.members, 'name': x.name, 'reference': x.referece} for x in
                           connector.relations], 'waypoints': json.loads(export_ways_to_geojson(connector.ways))}

        return json.dumps(r, ensure_ascii=False), 200, {
            'Content-Type': 'application/json; charset=utf-8'}

    @app.after_request
    def add_header(response):
        response.cache_control.max_age = update_interval
        return response

    return app
