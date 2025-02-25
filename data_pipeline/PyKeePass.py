# -*- coding: utf-8 -*-
"""
Created on Tue Feb 25 19:24:49 2025

@author: cindy
"""

from pykeepass import PyKeePass

kp = PyKeePass('secrets.kdbx', password=)
group = kp.find_groups(name='General', first=True)
entry = kp.find_entries(title='SCW_ACCESS_KEY', first=True)
entry.password
entry = kp.find_entries(title='SCW_SECRET_KEY', first=True)
entry.password
