#!/bin/bash
wget -O /home/pi/web/hue/varsel_tmp.xml http://www.yr.no/place/Finland/Southern_Finland/Vantaa/varsel.xml
if [ -f "/home/pi/web/hue/varsel_tmp.xml" ]; then
  cp /home/pi/web/hue/varsel_tmp.xml /home/pi/web/hue/varsel.xml
fi
