#!/usr/bin/python
# Adapted from https://github.com/einaregilsson/Redirector/
import json
import os
import zipfile

EXTENSION_NAME = 'odoo_attendance'
GECKO_ID = "odoo_attendance@jialonso.com"
BROWSERS = {
    'chrome',
    'firefox',
    'opera',
}


def parse_manifest(manifest, browser):
    """
    Parses and returns manifest dictionary for specific browser
    """
    if browser == 'firefox':
        manifest['applications'] = {"gecko": {"id": GECKO_ID}}
    if browser == 'opera':
        manifest['options_ui']['chrome_style'] = False
    return manifest


def create_addon(browser):
    """
    Creates addon package (zip file) for given browser
    """
    output_folder = '../dist'
    if not os.path.isdir(output_folder):
        os.mkdir(output_folder)

    extension = 'zip'
    if browser == 'firefox':
        extension = 'xpi'

    output_file = os.path.join(output_folder, '%s-%s.%s' %
                               (EXTENSION_NAME, browser, extension))
    zf = zipfile.ZipFile(output_file, 'w', zipfile.ZIP_STORED)

    print '**** Creating addon for %s ****' % browser
    for root, folders, files in os.walk('.'):
        for f in files:
            path = os.path.join(root, f)
            if f == 'manifest.json':
                manifest = json.load(open(path))
                manifest = parse_manifest(manifest, browser)
                zf.writestr(f, json.dumps(manifest, indent=2))
            else:
                zf.write(path)

    zf.close()


if __name__ == '__main__':
    folder = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'src')
    os.chdir(folder)

    for browser in BROWSERS:
        create_addon(browser)
