from flask import Flask

app = Flask(__name__)

from megawave import routes
