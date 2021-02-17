import configparser

# Parse config
config = configparser.ConfigParser()
config.read("../../config.ini")

# files
fileDirectory = config["server"]["audioDirectory"]
