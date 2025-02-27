# -*- coding: utf-8 -*-
"""
Created on Tue Feb 25 19:24:49 2025

@author: cindy
"""

from pykeepass import PyKeePass

kp = PyKeePass('secrets.kdbx') #, password= (à définir en .env)
group = kp.find_groups(name='General', first=True)
entry = kp.find_entries(title='SCW_ACCESS_KEY', first=True)
acces_key=entry.password
entry = kp.find_entries(title='SCW_SECRET_KEY', first=True)
secret_key=entry.password
