$(document).ready(function () {
    //Map and tile layers
    var map;
    var tile_layers = {};

    // Map object layers
    var overlay_layers = {
        "Fahrzeuge": new L.FeatureGroup(),
        "Haltestellen": new L.FeatureGroup(),
        "Strecken": new L.FeatureGroup()
    };

    // Stores current vehicle route GeoJSON
    var current_vehicle_route;

    // Current update iteration
    var update_count = 0;
    // Update Interval in seconds
    var update_interval = 30;

    var vehicles = {};
    var line_routes;

    var selected_vehicle_reference = null;

    /*
     * Restores the map-view from URL params.
     * This is required to allow bookmarking a specific location.
     *
     * Format:
     * #<lat>;<lon>;<zoom>
     *
     * Returns true in case a position can be extracted, false if not.
     */
    function restoreMapView() {
        var map_pos_params = /[#]([0-9]+[\.][0-9]*)[;]([0-9]+[\.][0-9]*)[;]([0-9]+)/g.exec(window.location.href);
        if (map_pos_params !== null) {
            map.panTo([map_pos_params[1], map_pos_params[2]]);
            map.setZoom(map_pos_params[3]);
            return true
        }
        return false
    }

    /*
     * Starts geolocation process
     */
    function startGeolocation() {
        map.locate({setView: true, maxZoom: 15});
    }

    /*
     * Called when a click on a vehicle occurs. Opens Pop-up and displays vehicles line route on the map.
     */
    function onVehicleClick(e) {
        selected_vehicle_reference = this.options.properties.line;
        current_vehicle_route = L.geoJSON(line_routes.waypoints, {filter: filterLine});
        overlay_layers["Strecken"].addLayer(current_vehicle_route);
    }

    /*
     * Called when a vehicles popup gets closed. Removes the vehicles route from the map.
     */
    function onPopupClose(e) {
        overlay_layers["Strecken"].removeLayer(current_vehicle_route);
    }

    /*
     * Filters vehicles route from array of all relations.
     */
    function filterLine(feature) {
        var corresponding_relations = [];
        for (var i = 0; i < line_routes.relations.length; i++) {
            if (line_routes.relations[i].reference === selected_vehicle_reference) {
                corresponding_relations = corresponding_relations.concat(line_routes.relations[i].members);
            }
        }
        return corresponding_relations.indexOf(feature.properties.id) > -1;
    }

    /*
     * Pulls lineplans from remote.
     */
    function updateLineplans() {
        $.ajax("/lineplans")
            .done(function (data) {
                line_routes = data;
            })
    }

    /*
     * Pulls vehicle data from remote
     */
    function updateVehicles() {
        $.ajax("/vehicledata")
            .done(function (data) {
                data.vehicles.forEach(function (item, index) {
                    var class_name, vehicle_type;

                    if (item.category === 5) {
                        // Bus
                        class_name = 'vehicle vehicle-bus';
                        vehicle_type = "Bus"
                    } else if (item.category === 1) {
                        // Tram
                        class_name = 'vehicle vehicle-tram';
                        vehicle_type = "Tram"
                    } else {
                        class_name = 'vehicle vehicle-other';
                        vehicle_type = "Line"
                    }

                    var popup_content = "<strong>" + vehicle_type + " " + item.line + " - " + item.lastStop + "</strong><br>" +
                        "Fahrzeug: " + item.vehicleId + "<br>" +
                        "<span class='popup-cordinates'>" + item.latitude + ", " + item.longitude + "</span>";

                    var icon = L.divIcon({
                        className: class_name,
                        iconSize: [22, 22],
                        iconAnchor: [11, 11],
                        popupAnchor: [0, -11],
                        html: '<div class="vehicle-bearing" id="vehicle-' + item.vehicleId + '"></div>' + item.line
                    });

                    if (!(item.vehicleId in vehicles)) {
                        // Add new vehicle to the map
                        var marker = L.Marker.movingMarker(
                            [[item.latitude, item.longitude], [item.latitude, item.longitude]],
                            update_interval * 1000, {
                                icon: icon,
                                properties: {line: item.line},
                                autostart: true
                            })
                            .bindPopup(popup_content)
                            .on('popupopen', onVehicleClick)
                            .on('popupclose', onPopupClose);

                        vehicles[item.vehicleId] = {
                            lastAppearance: update_count,
                            marker: marker,
                            rawData: item
                        };

                        overlay_layers["Fahrzeuge"].addLayer(vehicles[item.vehicleId].marker);
                    } else {
                        // Upate existing vehicle
                        vehicles[item.vehicleId].marker._popup.setContent(popup_content);
                        vehicles[item.vehicleId].marker.setIcon(icon);
                        vehicles[item.vehicleId].lastAppearance = update_count;

                        // Start movement animation
                        vehicles[item.vehicleId].marker.moveTo([item.latitude, item.longitude], update_interval * 1000);
                    }

                    // Set orientation (bearing) of current vehicle on the map
                    $(".vehicle-bearing#vehicle-" + item.vehicleId).css("transform", "rotate(" + item.bearing + "deg)");
                });

                for (var vehicleId in vehicles) {
                    // Remove inactive vehicle
                    if (vehicles.hasOwnProperty(vehicleId)) {
                        if (vehicles[vehicleId].lastAppearance < update_count) {
                            overlay_layers["Fahrzeuge"].removeLayer(vehicles[vehicleId].marker);
                            delete vehicles[vehicleId];
                        }
                    }
                }

                update_count++;
            })
            .fail(function () {
                // ToDo implement error routine
            })
    }

    function updateStops() {
        $.ajax("/mapobjects")
            .done(function (data) {
                data.forEach(function (item, idx) {
                    if (item.type === 'stop') {
                        var popup_content = "<strong>" + item.name + "</strong><br>" +
                            "<a target='_blank' href='https://darmstart.de/?q=" + item.id + "'>Darmstart</a><br>" +
                            "<a target='_blank' href='https://www.rmv.de/auskunft/bin/jp/stboard.exe/dn?" +
                            "ld=14.53&protocol=https:&CMS_AppId=BahnhofstafelErgebnis&input=" + item.id +
                            "&boardType=&maxJourneys=50&productsFilter=1111111111111111&start=yes'>RMV</a><br>" +
                            "<span class='popup-cordinates'>" + item.id + "</span>";
                        var icon = L.icon({
                            iconUrl: '/static/stop.png',
                            iconSize: [22, 22],
                            iconAnchor: [11, 11],
                            popupAnchor: [0, -11]
                        });
                        var marker = L.marker([item.lat, item.lon]).bindPopup(popup_content);
                        marker.setIcon(icon);
                        var ao = {marker: marker};
                        overlay_layers["Haltestellen"].addLayer(ao.marker);
                    }
                })
            })
    }


    tile_layers["OpenStreetMap"] = new L.tileLayer('https://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        minZoom: 3, maxZoom: 18,
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });

    tile_layers["ÖPNV"] = new L.TileLayer('https://tile.memomaps.de/tilegen/{z}/{x}/{y}.png', {
        minZoom: 3, maxZoom: 18,
        attribution: '&copy; <a href="http://memomaps.de/">ÖPNV Karte</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'
    });

    map = L.map('map', {center: [49.872906, 8.651617], zoom: 10, layers: [tile_layers["OpenStreetMap"]]});

    map.on('moveend', function () {
        var mapPos = map.getCenter();
        var mapZoom = map.getZoom();
        var url = window.location.href.split('#')[0] + '#' + mapPos.lat + ';' + mapPos.lng + ';' + mapZoom;
        history.pushState('', '', url);
    });

    // Add tile-layer control
    L.control.layers(tile_layers, overlay_layers).addTo(map);

    // Add object-layers
    map.addLayer(overlay_layers["Fahrzeuge"]);
    map.addLayer(overlay_layers["Strecken"]);

    // First, try to restore the view. If this is not possible try to geolocate.
    if (!restoreMapView()) {
        startGeolocation();
    }
    updateVehicles();
    updateStops();
    updateLineplans();

    setInterval(updateVehicles, update_interval * 1000);
});