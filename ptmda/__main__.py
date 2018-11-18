#!/usr/bin/env python
import click
from waitress import serve

from .server import create_app


@click.command()
@click.option('--port', default='45232', help='Port to listen on')
def start_server(port):
    serve(create_app(), listen='{host}:{port}'.format(host='127.0.0.1', port=port))


if __name__ == "__main__":
    start_server()
